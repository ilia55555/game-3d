// File: stickman/src/gameplay/player.controller.js
// Role: Owns keyboard movement, jumping, sprinting, third-person camera, aiming, health, and energy.
// Scope: Player input/state and world translation only; projectile visuals and enemy behavior stay elsewhere.
// Rule: Character geometry, animation math, aura rendering, damage effects, and level construction remain separate.
// Goal: Provide responsive WASD gameplay while keeping the controller independent from model implementation details.

import * as THREE from 'three';

export class PlayerController {
  constructor({ stickman, animator, camera, domElement, level, onShoot, onMelee, onToggleElement, onDeath, onPause }) {
    this.stickman = stickman;
    this.animator = animator;
    this.camera = camera;
    this.domElement = domElement;
    this.level = level;
    this.onShoot = onShoot;
    this.onMelee = onMelee;
    this.onToggleElement = onToggleElement;
    this.onDeath = onDeath;
    this.onPause = onPause;

    this.enabled = false;
    this.keys = new Set();
    this.mouseDown = false;
    this.velocity = new THREE.Vector3();
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
    this.shotCooldown = 0;
    this.meleeCooldown = 0;
    this.invulnerable = 0;
    this.dead = false;

    this.#bindInput();
    this.reset(level?.playerSpawn);
  }

  #bindInput() {
    window.addEventListener('keydown', event => {
      if (['Space', 'KeyQ', 'KeyF'].includes(event.code)) event.preventDefault();
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
      if (event.code === 'KeyF' && this.meleeCooldown <= 0) {
        this.meleeCooldown = 0.48;
        this.animator.triggerAttack();
        this.onMelee?.(this.getAttackOrigin(), this.getAimDirection(), this.elementMode);
      }
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

    window.addEventListener('mousemove', event => {
      if (!this.enabled || document.pointerLockElement !== this.domElement) return;
      this.yaw -= event.movementX * 0.00215;
      this.pitch = THREE.MathUtils.clamp(this.pitch - event.movementY * 0.00175, -0.55, 0.32);
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
    if (this.enabled && document.pointerLockElement !== this.domElement) this.domElement.requestPointerLock();
  }

  reset(spawn = new THREE.Vector3()) {
    this.hp = this.maxHp;
    this.energy = this.maxEnergy;
    this.dead = false;
    this.verticalVelocity = 0;
    this.moveVelocity.set(0, 0, 0);
    this.grounded = true;
    this.shotCooldown = 0;
    this.meleeCooldown = 0;
    this.invulnerable = 0;
    this.stickman.position.set(spawn.x, this.stickman.userData.stickman.dimensions.pelvisY, spawn.z);
    this.stickman.rotation.set(0, this.yaw, 0);
    this.#updateCamera(1);
  }

  getPosition(target = new THREE.Vector3()) {
    return target.copy(this.stickman.position);
  }

  getCenter(target = new THREE.Vector3()) {
    return target.copy(this.stickman.position).add(new THREE.Vector3(0, 0.40, 0));
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
    const hand = this.stickman.userData.stickman.joints.rightHand;
    hand.getWorldPosition(target);
    const direction = this.getAimDirection(new THREE.Vector3());
    return target.addScaledVector(direction, 0.26);
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
    document.body.classList.remove('damage-flash');
    void document.body.offsetWidth;
    document.body.classList.add('damage-flash');
    if (this.hp <= 0) {
      this.dead = true;
      this.enabled = false;
      this.mouseDown = false;
      if (document.pointerLockElement) document.exitPointerLock();
      this.onDeath?.();
    }
    return true;
  }

  #tryShoot() {
    if (!this.mouseDown || this.shotCooldown > 0 || this.dead) return;
    const cost = this.elementMode === 'fire' ? 11 : 8;
    if (!this.spendEnergy(cost)) return;
    this.shotCooldown = this.elementMode === 'fire' ? 0.20 : 0.14;
    this.onShoot?.(this.getAttackOrigin(), this.getAimDirection(), this.elementMode);
  }

  #updateCamera(delta) {
    const target = this.cameraTarget.copy(this.stickman.position).add(new THREE.Vector3(0, 0.72, 0));
    const cp = Math.cos(this.pitch);
    const view = new THREE.Vector3(
      Math.sin(this.yaw) * cp,
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * cp
    );
    const distance = 6.2;
    this.cameraDesired.copy(target).addScaledVector(view, -distance);
    this.cameraDesired.y += 1.55;

    const smoothing = 1 - Math.exp(-Math.max(delta, 0.001) * 10);
    this.camera.position.lerp(this.cameraDesired, smoothing);
    this.camera.lookAt(target.clone().addScaledVector(view, 4));
  }

  update(delta) {
    const dt = Math.min(delta, 0.05);
    this.shotCooldown = Math.max(0, this.shotCooldown - dt);
    this.meleeCooldown = Math.max(0, this.meleeCooldown - dt);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.energy = Math.min(this.maxEnergy, this.energy + dt * (this.mouseDown ? 9 : 18));

    if (!this.enabled || this.dead) {
      this.#updateCamera(dt);
      this.animator.setMotion({ speed: 0, grounded: this.grounded, sprinting: false, verticalVelocity: this.verticalVelocity });
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
    const maxSpeed = this.sprinting ? 8.1 : 4.8;
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
    this.level?.resolveCircle?.(this.stickman.position, this.stickman.userData.stickman.dimensions.playerRadius);

    if (this.stickman.position.y <= baseY) {
      this.stickman.position.y = baseY;
      this.verticalVelocity = 0;
      this.grounded = true;
    } else {
      this.grounded = false;
    }

    const speed = Math.hypot(this.moveVelocity.x, this.moveVelocity.z);
    const targetFacing = this.yaw;
    const current = this.stickman.rotation.y;
    const angle = Math.atan2(Math.sin(targetFacing - current), Math.cos(targetFacing - current));
    this.stickman.rotation.y += angle * (1 - Math.exp(-dt * 13));

    this.animator.setMotion({
      speed,
      grounded: this.grounded,
      sprinting: this.sprinting,
      verticalVelocity: this.verticalVelocity
    });

    this.#tryShoot();
    this.#updateCamera(dt);
  }
}
