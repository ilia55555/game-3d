// File: stickman/src/animation/stickman.animations.js
// Role: Drives procedural idle, walk, run, jump, and attack poses for the hero rig.
// Scope: Joint rotations and subtle body motion only; world translation is owned by player control.
// Rule: Geometry, input, combat damage, camera, enemy AI, aura effects, and levels stay elsewhere.
// Goal: Keep movement readable and smooth while preserving the character's cohesive body silhouette.

import * as THREE from 'three';

const damp = THREE.MathUtils.damp;

export class StickmanAnimator {
  constructor(stickman) {
    this.stickman = stickman;
    this.rig = stickman.userData.stickman;
    this.mode = 'idle';
    this.time = 0;
    this.moveAmount = 0;
    this.attackTimer = 0;
  }

  setMotion({ speed = 0, grounded = true, sprinting = false, verticalVelocity = 0 }) {
    this.moveAmount = THREE.MathUtils.clamp(speed / 7, 0, 1);
    if (!grounded) this.mode = verticalVelocity > 0.25 ? 'jump' : 'fall';
    else if (speed > 5.3 && sprinting) this.mode = 'run';
    else if (speed > 0.25) this.mode = 'walk';
    else this.mode = 'idle';
  }

  triggerAttack() {
    this.attackTimer = 0.34;
  }

  update(delta) {
    const dt = Math.min(delta, 0.05);
    this.time += dt;
    this.attackTimer = Math.max(0, this.attackTimer - dt);

    const j = this.rig.joints;
    const phaseSpeed = this.mode === 'run' ? 10.4 : 7.2;
    const phase = this.time * phaseSpeed;
    const strideScale = this.mode === 'run' ? 0.84 : 0.58;
    const stride = Math.sin(phase) * strideScale * Math.max(0.15, this.moveAmount);
    const kneeL = Math.max(0, -Math.sin(phase + 0.25));
    const kneeR = Math.max(0, Math.sin(phase + 0.25));

    let target = {
      luaX: 0, ruaX: 0, llaX: -0.08, rlaX: -0.08,
      lulX: 0, rulX: 0, lllX: 0, rllX: 0,
      luaZ: 0.12, ruaZ: -0.12,
      torsoX: 0, torsoZ: 0, headZ: 0
    };

    if (this.mode === 'walk' || this.mode === 'run') {
      const arm = this.mode === 'run' ? 0.72 : 0.50;
      const knee = this.mode === 'run' ? 0.86 : 0.68;
      target.luaX = -stride * arm;
      target.ruaX = stride * arm;
      target.lulX = stride;
      target.rulX = -stride;
      target.lllX = -kneeL * knee;
      target.rllX = -kneeR * knee;
      target.llaX = -0.18;
      target.rlaX = -0.18;
      target.torsoX = this.mode === 'run' ? 0.10 : 0.035;
      target.torsoZ = Math.sin(phase) * 0.025;
      target.headZ = -target.torsoZ * 0.45;
    } else if (this.mode === 'jump') {
      target.luaX = -0.36;
      target.ruaX = -0.28;
      target.lulX = 0.33;
      target.rulX = -0.18;
      target.lllX = -0.55;
      target.rllX = -0.25;
      target.torsoX = -0.05;
    } else if (this.mode === 'fall') {
      target.luaX = 0.28;
      target.ruaX = 0.22;
      target.lulX = -0.20;
      target.rulX = 0.28;
      target.lllX = -0.32;
      target.rllX = -0.42;
      target.torsoX = 0.06;
    } else {
      target.luaX = Math.sin(this.time * 1.45) * 0.025;
      target.ruaX = -target.luaX;
      target.torsoZ = Math.sin(this.time * 0.85) * 0.012;
      target.headZ = -target.torsoZ * 0.7;
    }

    if (this.attackTimer > 0) {
      const p = 1 - this.attackTimer / 0.34;
      const punch = Math.sin(p * Math.PI);
      target.ruaX = -1.38 * punch;
      target.rlaX = -1.08 * punch - 0.10;
      target.ruaZ = -0.28;
      target.torsoZ = -0.16 * punch;
    }

    const k = this.mode === 'run' ? 18 : 13;
    j.leftUpperArm.rotation.x = damp(j.leftUpperArm.rotation.x, target.luaX, k, dt);
    j.rightUpperArm.rotation.x = damp(j.rightUpperArm.rotation.x, target.ruaX, k, dt);
    j.leftLowerArm.rotation.x = damp(j.leftLowerArm.rotation.x, target.llaX, k, dt);
    j.rightLowerArm.rotation.x = damp(j.rightLowerArm.rotation.x, target.rlaX, k, dt);
    j.leftUpperLeg.rotation.x = damp(j.leftUpperLeg.rotation.x, target.lulX, k, dt);
    j.rightUpperLeg.rotation.x = damp(j.rightUpperLeg.rotation.x, target.rulX, k, dt);
    j.leftLowerLeg.rotation.x = damp(j.leftLowerLeg.rotation.x, target.lllX, k, dt);
    j.rightLowerLeg.rotation.x = damp(j.rightLowerLeg.rotation.x, target.rllX, k, dt);
    j.leftUpperArm.rotation.z = damp(j.leftUpperArm.rotation.z, target.luaZ, 12, dt);
    j.rightUpperArm.rotation.z = damp(j.rightUpperArm.rotation.z, target.ruaZ, 12, dt);
    j.torso.rotation.x = damp(j.torso.rotation.x, target.torsoX, 11, dt);
    j.torso.rotation.z = damp(j.torso.rotation.z, target.torsoZ, 10, dt);
    j.head.rotation.z = damp(j.head.rotation.z, target.headZ, 9, dt);
  }
}
