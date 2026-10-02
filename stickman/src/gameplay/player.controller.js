// File: stickman/src/gameplay/player.controller.js
// Role: Owns 2.5D side movement, natural jumping, side-camera follow, mouse aiming, and sword/gun selection.
// Scope: Player input/state and world translation only; 2D geometry, weapon art, animation, and level art stay elsewhere.
// Rule: Movement is constrained to the gameplay lane while hidden-rig posing is requested through the animator.
// Goal: Replace the awkward third-person motion with responsive platformer controls and non-inverted mouse behavior.

import * as THREE from 'three';

function approach(current, target, maxDelta) {
  if (current < target) return Math.min(current + maxDelta, target);
  if (current > target) return Math.max(current - maxDelta, target);
  return target;
}

export class PlayerController {
  constructor({
    stickman,
    animator,
    camera,
    domElement,
    level,
    onPrimaryAction,
    onWeaponChange,
    onToggleElement,
    onDeath,
    onPause
  }) {
    this.stickman = stickman;
    this.animator = animator;
    this.camera = camera;
    this.domElement = domElement;
    this.level = level;
    this.onPrimaryAction = onPrimaryAction;
    this.onWeaponChange = onWeaponChange;
    this.onToggleElement = onToggleElement;
    this.onDeath = onDeath;
    this.onPause = onPause;

    this.enabled = false;
    this.keys = new Set();
    this.mouseDown = false;
    this.horizontalVelocity = 0;
    this.verticalVelocity = 0;
    this.grounded = true;
    this.sprinting = false;
    this.facing = 1;
    this.mouseNdc = new THREE.Vector2(0.65, 0);
    this.aimAngle = 0;
    this.jumpBuffer = 0;
    this.coyote = 0.10;
    this.primaryCooldown = 0;
    this.invulnerable = 0;

    this.hp = 100;
    this.maxHp = 100;
    this.energy = 100;
    this.maxEnergy = 100;
    this.elementMode = 'ice';
    this.weapon = 'sword';
    this.dead = false;

    this.cameraDesired = new THREE.Vector3();
    this.cameraLook = new THREE.Vector3();

    this.#bindInput();
    this.reset(level?.playerSpawn);
  }

  #bindInput() {
    window.addEventListener('keydown', event => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'Digit1', 'Digit2', 'Numpad1', 'Numpad2'].includes(event.code)) {
        event.preventDefault();
      }
      this.keys.add(event.code);

      if (event.code === 'Escape' && this.enabled) {
        this.onPause?.();
        return;
      }

      if (!this.enabled || this.dead || event.repeat) return;

      if (event.code === 'Space' || event.code === 'KeyW' || event.code === 'ArrowUp') {
        this.jumpBuffer = 0.13;
      }
      if (event.code === 'Digit1' || event.code === 'Numpad1') this.selectWeapon('sword');
      if (event.code === 'Digit2' || event.code === 'Numpad2') this.selectWeapon('gun');
      if (event.code === 'KeyQ') {
        this.elementMode = this.elementMode === 'ice' ? 'fire' : 'ice';
        this.onToggleElement?.(this.elementMode);
      }
      if (event.code === 'KeyF') this.#tryPrimary(true);
    });

    window.addEventListener('keyup', event => {
      this.keys.delete(event.code);
      if ((event.code === 'Space' || event.code === 'KeyW' || event.code === 'ArrowUp') && this.verticalVelocity > 0) {
        this.verticalVelocity *= 0.48;
      }
    });

    window.addEventListener('blur', () => { this.keys.clear(); this.mouseDown = false; this.jumpBuffer = 0; });

    this.domElement.addEventListener('mousemove', event => {
      const rect = this.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
      const y = -(((event.clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1);
      this.mouseNdc.set(
        THREE.MathUtils.clamp(x, -1, 1),
        THREE.MathUtils.clamp(y, -1, 1)
      );
    });

    this.domElement.addEventListener('mousedown', event => {
      if (event.button !== 0 || !this.enabled || this.dead) return;
      this.mouseDown = true;
      this.#tryPrimary(true);
    });

    window.addEventListener('mouseup', event => {
      if (event.button === 0) this.mouseDown = false;
    });

    this.domElement.addEventListener('wheel', event => {
      if (!this.enabled || this.dead) return;
      event.preventDefault();
      this.selectWeapon(this.weapon === 'sword' ? 'gun' : 'sword');
    }, { passive: false });
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    if (!this.enabled) { this.mouseDown = false; this.keys.clear(); this.jumpBuffer = 0; }
  }

  requestPointerLock() {
    // Side-view mode intentionally keeps the normal cursor; moving right now always aims right.
    this.domElement.focus();
  }

  selectWeapon(weapon) {
    if (weapon !== 'sword' && weapon !== 'gun') return this.weapon;
    if (weapon === this.weapon) return this.weapon;
    this.weapon = weapon;
    this.animator.setWeapon(weapon);
    this.onWeaponChange?.(weapon);
    return this.weapon;
  }

  reset(spawn = new THREE.Vector3()) {
    this.hp = this.maxHp;
    this.energy = this.maxEnergy;
    this.dead = false;
    this.horizontalVelocity = 0;
    this.verticalVelocity = 0;
    this.jumpBuffer = 0;
    this.coyote = 0.10;
    this.grounded = true;
    this.primaryCooldown = 0;
    this.invulnerable = 0;
    this.weapon = 'sword';
    this.facing = 1;
    this.animator.setWeapon('sword');
    this.stickman.userData.stickman.setFacing(1);

    const x = spawn?.x ?? 0;
    const ground = this.level?.getGroundY?.(x) ?? 0;
    this.stickman.position.set(
      x,
      ground + this.stickman.userData.stickman.dimensions.pelvisY,
      this.stickman.userData.stickman.dimensions.laneZ
    );
    this.onWeaponChange?.('sword');
    this.#updateCamera(1);
  }

  getPosition(target = new THREE.Vector3()) {
    return target.copy(this.stickman.position);
  }

  getCenter(target = new THREE.Vector3()) {
    return target.copy(this.stickman.position).add(new THREE.Vector3(0, 0.45, 0));
  }

  getAimDirection(target = new THREE.Vector3()) {
    return target.set(
      this.facing * Math.cos(this.aimAngle),
      Math.sin(this.aimAngle),
      0
    ).normalize();
  }

  getAttackOrigin(target = new THREE.Vector3()) {
    this.stickman.updateWorldMatrix(true, true);
    this.stickman.userData.stickman.sockets.rightGrip.getWorldPosition(target);
    return target;
  }

  spendEnergy(amount) {
    if (this.energy < amount) return false;
    this.energy -= amount;
    return true;
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  takeDamage(amount) {
    if (this.dead || this.invulnerable > 0) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.invulnerable = 0.34;
    if (this.hp <= 0) {
      this.dead = true;
      this.enabled = false;
      this.mouseDown = false;
      this.onDeath?.();
    }
    return true;
  }

  #tryPrimary(force = false) {
    if (this.dead || this.primaryCooldown > 0) return;
    if (!force && !this.mouseDown) return;

    if (this.weapon === 'gun') {
      if (!this.spendEnergy(2.5)) return;
      this.primaryCooldown = 0.12;
    } else {
      this.primaryCooldown = 0.50;
    }

    this.animator.triggerPrimary(this.weapon);
    this.onPrimaryAction?.({
      weapon: this.weapon,
      origin: this.getAttackOrigin(new THREE.Vector3()),
      direction: this.getAimDirection(new THREE.Vector3()),
      element: this.elementMode
    });
  }

  #updateCamera(delta) {
    const lookAhead = this.facing * 0.95 + this.mouseNdc.x * 0.55;
    const targetX = this.stickman.position.x + lookAhead;
    const targetY = Math.max(1.9, this.stickman.position.y + 0.40 + this.mouseNdc.y * 0.28);

    this.cameraDesired.set(targetX, targetY + 0.72, 12.5);
    this.cameraLook.set(targetX, targetY, 0);

    const smoothing = 1 - Math.exp(-Math.max(delta, 0.001) * 7.8);
    this.camera.position.lerp(this.cameraDesired, smoothing);
    this.camera.lookAt(this.cameraLook);
  }

  update(delta) {
    const dt = Math.min(delta, 0.05);
    this.primaryCooldown = Math.max(0, this.primaryCooldown - dt);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    this.energy = Math.min(this.maxEnergy, this.energy + dt * (this.mouseDown && this.weapon === 'gun' ? 10 : 20));

    this.aimAngle = THREE.MathUtils.clamp(this.mouseNdc.y * 0.62, -0.58, 0.64);
    this.animator.setAim(this.aimAngle);

    if (!this.enabled || this.dead) {
      this.animator.setMotion({ speed: 0, grounded: this.grounded, sprinting: false, verticalVelocity: this.verticalVelocity });
      this.#updateCamera(dt);
      return;
    }

    const left = this.keys.has('KeyA') || this.keys.has('ArrowLeft');
    const right = this.keys.has('KeyD') || this.keys.has('ArrowRight');
    const input = (right ? 1 : 0) - (left ? 1 : 0);

    if (input !== 0) this.facing = input;
    else if (Math.abs(this.mouseNdc.x) > 0.16 && this.weapon === 'gun') this.facing = this.mouseNdc.x < 0 ? -1 : 1;

    this.stickman.userData.stickman.setFacing(this.facing);

    this.sprinting = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    const maxSpeed = this.sprinting ? 7.2 : 4.45;
    const targetSpeed = input * maxSpeed;
    const accel = this.grounded ? (input === 0 ? 30 : 24) : 10.5;
    this.horizontalVelocity = approach(this.horizontalVelocity, targetSpeed, accel * dt);

    if (this.grounded) this.coyote = 0.10;
    else this.coyote = Math.max(0, this.coyote - dt);

    if (this.jumpBuffer > 0 && this.coyote > 0) {
      this.verticalVelocity = 7.75;
      this.grounded = false;
      this.coyote = 0;
      this.jumpBuffer = 0;
    }

    const gravity = this.verticalVelocity < 0 ? 24.5 : 20.0;
    this.verticalVelocity -= gravity * dt;

    this.stickman.position.x += this.horizontalVelocity * dt;
    this.stickman.position.y += this.verticalVelocity * dt;
    this.stickman.position.z = this.stickman.userData.stickman.dimensions.laneZ;
    this.level?.resolveSide?.(this.stickman.position, this.stickman.userData.stickman.dimensions.playerRadius);

    const ground = (this.level?.getGroundY?.(this.stickman.position.x) ?? 0) + this.stickman.userData.stickman.dimensions.pelvisY;
    if (this.stickman.position.y <= ground) {
      const wasAirborne = !this.grounded;
      const impact = Math.abs(this.verticalVelocity);
      this.stickman.position.y = ground;
      this.verticalVelocity = 0;
      this.grounded = true;
      if (wasAirborne) this.animator.notifyLand(impact);
    } else {
      this.grounded = false;
    }

    this.animator.setMotion({
      speed: Math.abs(this.horizontalVelocity),
      grounded: this.grounded,
      sprinting: this.sprinting,
      verticalVelocity: this.verticalVelocity
    });

    if (this.weapon === 'gun') this.#tryPrimary(false);
    this.#updateCamera(dt);
  }
}
