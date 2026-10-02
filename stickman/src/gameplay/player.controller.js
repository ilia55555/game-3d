// File: stickman/src/gameplay/player.controller.js
// Role: Owns keyboard movement, jumping, sprinting, corrected mouse look, and sword/gun selection.
// Scope: Player input/state and world translation only; model geometry, weapon meshes, and levels stay elsewhere.
// Rule: Hidden rig animation is requested through the animator and weapon visuals through callbacks.
// Goal: Provide clean character testing with WASD plus 1/2 or mouse-wheel weapon switching and natural camera control.

import * as THREE from 'three';

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
    this.moveVelocity = new THREE.Vector3();
    this.cameraTarget = new THREE.Vector3();
    this.cameraDesired = new THREE.Vector3();
    this.forward = new THREE.Vector3(0, 0, -1);
    this.right = new THREE.Vector3(1, 0, 0);

    this.yaw = 0;
    this.pitch = -0.13;
    this.verticalVelocity = 0;
    this.grounded = true;
    this.sprinting = false;
    this.hp = 100;
    this.maxHp = 100;
    this.energy = 100;
    this.maxEnergy = 100;
    this.elementMode = 'ice';
    this.weapon = 'sword';
    this.primaryCooldown = 0;
    this.invulnerable = 0;
    this.dead = false;

    this.#bindInput();
    this.reset(level?.playerSpawn);
  }

  #bindInput() {
    window.addEventListener('keydown', event => {
      if (['Space', 'KeyQ', 'KeyF', 'Digit1', 'Digit2', 'Numpad1', 'Numpad2'].includes(event.code)) {
        event.preventDefault();
      }
      this.keys.add(event.code);

      if (!this.enabled || this.dead || event.repeat) return;

      if (event.code === 'Space' && this.grounded) {
        this.verticalVelocity = 7.2;
        this.grounded = false;
      }

      if (event.code === 'KeyQ') {
        this.elementMode = this.elementMode === 'ice' ? 'fire' : 'ice';
        this.onToggleElement?.(this.elementMode);
      }

      if (event.code === 'Digit1' || event.code === 'Numpad1') this.selectWeapon('sword');
      if (event.code === 'Digit2' || event.code === 'Numpad2') this.selectWeapon('gun');
      if (event.code === 'KeyF') this.#tryPrimary(true);
    });

    window.addEventListener('keyup', event => this.keys.delete(event.code));

    this.domElement.addEventListener('mousedown', event => {
      if (event.button !== 0) return;
      this.mouseDown = true;
      if (this.enabled && document.pointerLockElement !== this.domElement) this.domElement.requestPointerLock();
    });

    window.addEventListener('mouseup', event => {
      if (event.button === 0) this.mouseDown = false;
    });

    this.domElement.addEventListener('wheel', event => {
      if (!this.enabled || this.dead) return;
      event.preventDefault();
      this.selectWeapon(this.weapon === 'sword' ? 'gun' : 'sword');
    }, { passive: false });

    window.addEventListener('mousemove', event => {
      if (!this.enabled || document.pointerLockElement !== this.domElement) return;

      // Correct direction: moving the mouse right turns the camera/head right, not left.
      this.yaw += event.movementX * 0.00215;
      this.pitch = THREE.MathUtils.clamp(
        this.pitch - event.movementY * 0.00175,
        -0.55,
        0.32
      );
    });

    document.addEventListener('pointerlockchange', () => {
      if (this.enabled && !this.dead && document.pointerLockElement !== this.domElement) {
        this.mouseDown = false;
        this.onPause?.();
      }
    });
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    if (!this.enabled) this.mouseDown = false;
  }

  requestPointerLock() {
    if (this.enabled && document.pointerLockElement !== this.domElement) {
      this.domElement.requestPointerLock();
    }
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
    this.verticalVelocity = 0;
    this.moveVelocity.set(0, 0, 0);
    this.grounded = true;
    this.primaryCooldown = 0;
    this.invulnerable = 0;
    this.weapon = 'sword';
    this.animator.setWeapon('sword');
    this.stickman.position.set(
      spawn.x,
      this.stickman.userData.stickman.dimensions.pelvisY,
      spawn.z
    );
    this.stickman.rotation.set(0, Math.PI - this.yaw, 0);
    this.onWeaponChange?.('sword');
    this.#updateCamera(1);
  }

  getPosition(target = new THREE.Vector3()) {
    return target.copy(this.stickman.position);
  }

  getCenter(target = new THREE.Vector3()) {
    return target.copy(this.stickman.position).add(new THREE.Vector3(0, 0.42, 0));
  }

  getAimDirection(target = new THREE.Vector3()) {
    const cp = Math.cos(this.pitch);
    return target.set(
      Math.sin(this.yaw) * cp,
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * cp
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
      if (document.pointerLockElement) document.exitPointerLock();
      this.onDeath?.();
    }
    return true;
  }

  #tryPrimary(force = false) {
    if (this.dead || this.primaryCooldown > 0) return;
    if (!force && !this.mouseDown) return;

    if (this.weapon === 'gun') {
      if (!this.spendEnergy(3)) return;
      this.primaryCooldown = 0.11;
    } else {
      this.primaryCooldown = 0.42;
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
    const target = this.cameraTarget
      .copy(this.stickman.position)
      .add(new THREE.Vector3(0, 0.76, 0));

    const cp = Math.cos(this.pitch);
    const view = new THREE.Vector3(
      Math.sin(this.yaw) * cp,
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * cp
    );

    const distance = 6.2;
    this.cameraDesired.copy(target).addScaledVector(view, -distance);
    this.cameraDesired.y += 1.48;

    const smoothing = 1 - Math.exp(-Math.max(delta, 0.001) * 10);
    this.camera.position.lerp(this.cameraDesired, smoothing);
    this.camera.lookAt(target.clone().addScaledVector(view, 4));
  }

  update(delta) {
    const dt = Math.min(delta, 0.05);
    this.primaryCooldown = Math.max(0, this.primaryCooldown - dt);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.energy = Math.min(this.maxEnergy, this.energy + dt * (this.mouseDown && this.weapon === 'gun' ? 12 : 22));

    this.animator.setLookPitch(this.pitch);

    if (!this.enabled || this.dead) {
      this.#updateCamera(dt);
      this.animator.setMotion({
        speed: 0,
        grounded: this.grounded,
        sprinting: false,
        verticalVelocity: this.verticalVelocity
      });
      return;
    }

    this.forward.set(Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    this.right.set(Math.cos(this.yaw), 0, Math.sin(this.yaw));

    const x = (this.keys.has('KeyD') ? 1 : 0) - (this.keys.has('KeyA') ? 1 : 0);
    const z = (this.keys.has('KeyW') ? 1 : 0) - (this.keys.has('KeyS') ? 1 : 0);
    const desired = new THREE.Vector3();
    desired.addScaledVector(this.right, x).addScaledVector(this.forward, z);
    if (desired.lengthSq() > 1) desired.normalize();

    this.sprinting = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    const maxSpeed = this.sprinting ? 8.0 : 4.8;
    desired.multiplyScalar(maxSpeed);

    const acceleration = this.grounded ? 13 : 5.2;
    const blend = 1 - Math.exp(-acceleration * dt);
    this.moveVelocity.x = THREE.MathUtils.lerp(this.moveVelocity.x, desired.x, blend);
    this.moveVelocity.z = THREE.MathUtils.lerp(this.moveVelocity.z, desired.z, blend);

    this.verticalVelocity -= 18.5 * dt;
    const baseY = this.stickman.userData.stickman.dimensions.pelvisY;
    this.stickman.position.x += this.moveVelocity.x * dt;
    this.stickman.position.z += this.moveVelocity.z * dt;
    this.stickman.position.y += this.verticalVelocity * dt;
    this.level?.resolveCircle?.(
      this.stickman.position,
      this.stickman.userData.stickman.dimensions.playerRadius
    );

    if (this.stickman.position.y <= baseY) {
      this.stickman.position.y = baseY;
      this.verticalVelocity = 0;
      this.grounded = true;
    } else {
      this.grounded = false;
    }

    const speed = Math.hypot(this.moveVelocity.x, this.moveVelocity.z);
    const targetFacing = Math.PI - this.yaw;
    const current = this.stickman.rotation.y;
    const angle = Math.atan2(
      Math.sin(targetFacing - current),
      Math.cos(targetFacing - current)
    );
    this.stickman.rotation.y += angle * (1 - Math.exp(-dt * 13));

    this.animator.setMotion({
      speed,
      grounded: this.grounded,
      sprinting: this.sprinting,
      verticalVelocity: this.verticalVelocity
    });

    this.#tryPrimary(false);
    this.#updateCamera(dt);
  }
}
