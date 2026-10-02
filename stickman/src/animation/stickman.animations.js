// File: stickman/src/animation/stickman.animations.js
// Role: Drives preview poses and procedural movement for the stickman rig.
// Scope: Idle, walk, and combat-pose animation math only.
// Rule: Geometry, rendering setup, gameplay input, enemies, damage, and level code stay elsewhere.
// Goal: Keep animation tuning independent so pose changes never require editing the model builder.

import * as THREE from 'three';

const clamp = THREE.MathUtils.clamp;
const damp = THREE.MathUtils.damp;

export class StickmanAnimator {
  constructor(stickman) {
    this.stickman = stickman;
    this.rig = stickman.userData.stickman;
    this.mode = 'idle';
    this.time = 0;
    this.speed = 1;

    const j = this.rig.joints;
    this.base = {
      leftUpperArmZ: j.leftUpperArm.rotation.z,
      rightUpperArmZ: j.rightUpperArm.rotation.z,
      leftLowerArmX: j.leftLowerArm.rotation.x,
      rightLowerArmX: j.rightLowerArm.rotation.x
    };
  }

  setMode(mode) {
    if (!['idle', 'walk', 'combat'].includes(mode)) return;
    this.mode = mode;
  }

  update(delta) {
    const dt = clamp(delta, 0, 0.05);
    this.time += dt * this.speed;

    if (this.mode === 'walk') this.#walk(dt);
    else if (this.mode === 'combat') this.#combat(dt);
    else this.#idle(dt);
  }

  #neutralize(dt, amount = 9) {
    const j = this.rig.joints;
    j.leftUpperArm.rotation.x = damp(j.leftUpperArm.rotation.x, 0, amount, dt);
    j.rightUpperArm.rotation.x = damp(j.rightUpperArm.rotation.x, 0, amount, dt);
    j.leftUpperArm.rotation.z = damp(j.leftUpperArm.rotation.z, this.base.leftUpperArmZ, amount, dt);
    j.rightUpperArm.rotation.z = damp(j.rightUpperArm.rotation.z, this.base.rightUpperArmZ, amount, dt);
    j.leftLowerArm.rotation.x = damp(j.leftLowerArm.rotation.x, this.base.leftLowerArmX, amount, dt);
    j.rightLowerArm.rotation.x = damp(j.rightLowerArm.rotation.x, this.base.rightLowerArmX, amount, dt);
    j.leftUpperLeg.rotation.x = damp(j.leftUpperLeg.rotation.x, 0, amount, dt);
    j.rightUpperLeg.rotation.x = damp(j.rightUpperLeg.rotation.x, 0, amount, dt);
    j.leftLowerLeg.rotation.x = damp(j.leftLowerLeg.rotation.x, 0, amount, dt);
    j.rightLowerLeg.rotation.x = damp(j.rightLowerLeg.rotation.x, 0, amount, dt);
  }

  #idle(dt) {
    const j = this.rig.joints;
    this.#neutralize(dt, 7);

    const breath = Math.sin(this.time * 1.9) * 0.012;
    const sway = Math.sin(this.time * 0.85) * 0.018;

    j.torso.scale.x = damp(j.torso.scale.x, 1 + breath * 0.38, 5, dt);
    j.torso.scale.y = damp(j.torso.scale.y, 1 + breath, 5, dt);
    j.torso.scale.z = damp(j.torso.scale.z, 1 + breath * 0.38, 5, dt);
    j.head.rotation.z = damp(j.head.rotation.z, sway, 4, dt);
    this.stickman.position.y = damp(this.stickman.position.y, this.rig.dimensions.pelvisY, 8, dt);
  }

  #walk(dt) {
    const j = this.rig.joints;
    const phase = this.time * 7.8;
    const stride = Math.sin(phase);
    const kneeL = Math.max(0, -Math.sin(phase + 0.25));
    const kneeR = Math.max(0, Math.sin(phase + 0.25));

    j.leftUpperLeg.rotation.x = damp(j.leftUpperLeg.rotation.x, stride * 0.66, 13, dt);
    j.rightUpperLeg.rotation.x = damp(j.rightUpperLeg.rotation.x, -stride * 0.66, 13, dt);
    j.leftLowerLeg.rotation.x = damp(j.leftLowerLeg.rotation.x, -kneeL * 0.72, 13, dt);
    j.rightLowerLeg.rotation.x = damp(j.rightLowerLeg.rotation.x, -kneeR * 0.72, 13, dt);

    j.leftUpperArm.rotation.x = damp(j.leftUpperArm.rotation.x, -stride * 0.55, 12, dt);
    j.rightUpperArm.rotation.x = damp(j.rightUpperArm.rotation.x, stride * 0.55, 12, dt);
    j.leftLowerArm.rotation.x = damp(j.leftLowerArm.rotation.x, -0.16, 10, dt);
    j.rightLowerArm.rotation.x = damp(j.rightLowerArm.rotation.x, -0.16, 10, dt);

    j.leftUpperArm.rotation.z = damp(j.leftUpperArm.rotation.z, this.base.leftUpperArmZ, 10, dt);
    j.rightUpperArm.rotation.z = damp(j.rightUpperArm.rotation.z, this.base.rightUpperArmZ, 10, dt);
    j.head.rotation.z = damp(j.head.rotation.z, -stride * 0.018, 8, dt);
    j.torso.rotation.z = damp(j.torso.rotation.z, stride * 0.025, 8, dt);

    const bounce = Math.abs(Math.sin(phase)) * 0.052;
    this.stickman.position.y = damp(
      this.stickman.position.y,
      this.rig.dimensions.pelvisY + bounce,
      18,
      dt
    );
  }

  #combat(dt) {
    const j = this.rig.joints;
    const pulse = Math.sin(this.time * 2.4) * 0.018;

    j.leftUpperArm.rotation.x = damp(j.leftUpperArm.rotation.x, -1.05, 11, dt);
    j.rightUpperArm.rotation.x = damp(j.rightUpperArm.rotation.x, -1.18, 11, dt);
    j.leftUpperArm.rotation.z = damp(j.leftUpperArm.rotation.z, -0.40, 11, dt);
    j.rightUpperArm.rotation.z = damp(j.rightUpperArm.rotation.z, 0.34, 11, dt);
    j.leftLowerArm.rotation.x = damp(j.leftLowerArm.rotation.x, -0.58, 12, dt);
    j.rightLowerArm.rotation.x = damp(j.rightLowerArm.rotation.x, -0.42, 12, dt);

    j.leftUpperLeg.rotation.x = damp(j.leftUpperLeg.rotation.x, 0.10, 10, dt);
    j.rightUpperLeg.rotation.x = damp(j.rightUpperLeg.rotation.x, -0.10, 10, dt);
    j.leftLowerLeg.rotation.x = damp(j.leftLowerLeg.rotation.x, -0.12, 10, dt);
    j.rightLowerLeg.rotation.x = damp(j.rightLowerLeg.rotation.x, -0.04, 10, dt);

    j.head.rotation.z = damp(j.head.rotation.z, -0.045, 8, dt);
    j.torso.rotation.z = damp(j.torso.rotation.z, 0.025, 8, dt);
    j.torso.scale.set(1 + pulse * 0.25, 1 + pulse, 1 + pulse * 0.25);
    this.stickman.position.y = damp(this.stickman.position.y, this.rig.dimensions.pelvisY - 0.035, 10, dt);
  }
}
