// File: stickman/src/animation/stickman.animations.js
// Role: Drives the hidden rig for idle, walk, run, jump, sword, gun, recoil, and head-look motion.
// Scope: Joint rotations and subtle body motion only; world movement and weapon mesh creation stay elsewhere.
// Rule: No visible joint geometry is created here; all articulation happens through invisible transform pivots.
// Goal: Keep arms detached from the torso silhouette while every limb bends smoothly and naturally.

import * as THREE from 'three';

const damp = THREE.MathUtils.damp;
const clamp = THREE.MathUtils.clamp;

export class StickmanAnimator {
  constructor(stickman) {
    this.stickman = stickman;
    this.rig = stickman.userData.stickman;
    this.mode = 'idle';
    this.weapon = 'sword';
    this.time = 0;
    this.moveAmount = 0;
    this.actionTimer = 0;
    this.actionDuration = 0.42;
    this.lookPitch = 0;
  }

  setMotion({ speed = 0, grounded = true, sprinting = false, verticalVelocity = 0 }) {
    this.moveAmount = clamp(speed / 7.5, 0, 1);
    if (!grounded) this.mode = verticalVelocity > 0.25 ? 'jump' : 'fall';
    else if (speed > 5.3 && sprinting) this.mode = 'run';
    else if (speed > 0.25) this.mode = 'walk';
    else this.mode = 'idle';
  }

  setWeapon(weapon) {
    if (weapon === 'sword' || weapon === 'gun') this.weapon = weapon;
  }

  setLookPitch(pitch) {
    this.lookPitch = clamp(pitch, -0.55, 0.32);
  }

  triggerPrimary(weapon = this.weapon) {
    this.weapon = weapon;
    this.actionDuration = weapon === 'gun' ? 0.13 : 0.44;
    this.actionTimer = this.actionDuration;
  }

  update(delta) {
    const dt = Math.min(delta, 0.05);
    this.time += dt;
    this.actionTimer = Math.max(0, this.actionTimer - dt);

    const j = this.rig.joints;
    const phaseSpeed = this.mode === 'run' ? 10.2 : 7.1;
    const phase = this.time * phaseSpeed;
    const strideScale = this.mode === 'run' ? 0.86 : 0.58;
    const stride = Math.sin(phase) * strideScale * Math.max(0.12, this.moveAmount);
    const kneeL = Math.max(0, -Math.sin(phase + 0.25));
    const kneeR = Math.max(0, Math.sin(phase + 0.25));

    const target = {
      luaX: 0, ruaX: 0,
      llaX: -0.08, rlaX: -0.08,
      lulX: 0, rulX: 0,
      lllX: 0, rllX: 0,
      luaZ: 0.20, ruaZ: -0.20,
      llaZ: 0, rlaZ: 0,
      torsoX: 0, torsoZ: 0,
      headX: this.lookPitch * 0.33,
      headZ: 0
    };

    if (this.mode === 'walk' || this.mode === 'run') {
      const legStride = stride;
      const armSwing = this.mode === 'run' ? 0.62 : 0.42;
      const knee = this.mode === 'run' ? 0.90 : 0.70;

      target.lulX = legStride;
      target.rulX = -legStride;
      target.lllX = -kneeL * knee;
      target.rllX = -kneeR * knee;
      target.torsoX = this.mode === 'run' ? 0.09 : 0.025;
      target.torsoZ = Math.sin(phase) * 0.022;
      target.headZ = -target.torsoZ * 0.45;

      if (this.weapon === 'sword') {
        target.luaX = -stride * armSwing;
        target.ruaX = -0.26 + stride * 0.10;
        target.llaX = -0.16;
        target.rlaX = -0.28;
      }
    } else if (this.mode === 'jump') {
      target.luaX = -0.32;
      target.ruaX = this.weapon === 'sword' ? -0.42 : target.ruaX;
      target.lulX = 0.32;
      target.rulX = -0.20;
      target.lllX = -0.55;
      target.rllX = -0.27;
      target.torsoX = -0.04;
    } else if (this.mode === 'fall') {
      target.luaX = 0.26;
      target.ruaX = this.weapon === 'sword' ? -0.12 : target.ruaX;
      target.lulX = -0.20;
      target.rulX = 0.28;
      target.lllX = -0.30;
      target.rllX = -0.40;
      target.torsoX = 0.055;
    } else {
      const breathe = Math.sin(this.time * 1.4) * 0.022;
      target.luaX = breathe;
      target.ruaX = -breathe;
      target.torsoZ = Math.sin(this.time * 0.82) * 0.010;
      target.headZ = -target.torsoZ * 0.65;
    }

    if (this.weapon === 'gun') {
      // Two-hand gun pose: both shoulders stay off the torso, elbows bend through hidden joints.
      const bob = (this.mode === 'walk' || this.mode === 'run') ? Math.sin(phase) * 0.035 : 0;
      target.ruaX = -1.02 + bob;
      target.rlaX = -0.46;
      target.ruaZ = -0.26;
      target.rlaZ = -0.08;

      target.luaX = -0.90 - bob * 0.7;
      target.llaX = -0.72;
      target.luaZ = 0.32;
      target.llaZ = 0.10;
      target.torsoX += 0.025;
    } else {
      // Sword-ready pose keeps the weapon arm separate from the ribs and the free arm relaxed.
      target.ruaX += -0.24;
      target.rlaX = Math.min(target.rlaX, -0.28);
      target.ruaZ = -0.24;
      target.luaZ = 0.20;
    }

    if (this.actionTimer > 0) {
      const p = 1 - this.actionTimer / this.actionDuration;
      const pulse = Math.sin(p * Math.PI);

      if (this.weapon === 'gun') {
        target.ruaX += 0.16 * pulse;
        target.rlaX += 0.10 * pulse;
        target.luaX += 0.08 * pulse;
        target.torsoX -= 0.025 * pulse;
      } else {
        const wind = Math.sin(Math.min(1, p * 1.25) * Math.PI);
        target.ruaX = -0.58 - 0.58 * pulse;
        target.rlaX = -0.54 - 0.28 * pulse;
        target.ruaZ = -0.24 + 1.18 * (p - 0.5);
        target.rlaZ = 0.34 * wind;
        target.torsoZ = -0.16 * pulse;
        target.headZ += 0.06 * pulse;
      }
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

    j.leftUpperArm.rotation.z = damp(j.leftUpperArm.rotation.z, target.luaZ, 13, dt);
    j.rightUpperArm.rotation.z = damp(j.rightUpperArm.rotation.z, target.ruaZ, 13, dt);
    j.leftLowerArm.rotation.z = damp(j.leftLowerArm.rotation.z, target.llaZ, 13, dt);
    j.rightLowerArm.rotation.z = damp(j.rightLowerArm.rotation.z, target.rlaZ, 13, dt);

    j.torso.rotation.x = damp(j.torso.rotation.x, target.torsoX, 11, dt);
    j.torso.rotation.z = damp(j.torso.rotation.z, target.torsoZ, 10, dt);
    j.head.rotation.x = damp(j.head.rotation.x, target.headX, 12, dt);
    j.head.rotation.z = damp(j.head.rotation.z, target.headZ, 9, dt);
  }
}
