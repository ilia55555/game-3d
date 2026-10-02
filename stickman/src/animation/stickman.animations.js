// File: stickman/src/animation/stickman.animations.js
// Role: Drives the hidden 2D rig for idle, walk, run, jump, fall, landing, sword, gun, and aim motion.
// Scope: Invisible joint rotations, body bob, squash, and pose blending only; world movement stays in the controller.
// Rule: No visible joint geometry is ever created; the flat body pieces overlap while pivots animate underneath.
// Goal: Replace the robotic 3D gait with a readable side-view walk cycle and much softer jump transitions.

import * as THREE from 'three';

const damp = THREE.MathUtils.damp;
const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;

export class StickmanAnimator {
  constructor(stickman) {
    this.stickman = stickman;
    this.rig = stickman.userData.stickman;
    this.mode = 'idle';
    this.weapon = 'sword';
    this.time = 0;
    this.speed = 0;
    this.moveAmount = 0;
    this.verticalVelocity = 0;
    this.actionTimer = 0;
    this.actionDuration = 0.42;
    this.landingTimer = 0;
    this.aimAngle = 0;
  }

  setMotion({ speed = 0, grounded = true, sprinting = false, verticalVelocity = 0 }) {
    this.speed = speed;
    this.moveAmount = clamp(speed / 7.4, 0, 1);
    this.verticalVelocity = verticalVelocity;

    if (!grounded) this.mode = verticalVelocity > 0.35 ? 'jump' : 'fall';
    else if (speed > 5.1 && sprinting) this.mode = 'run';
    else if (speed > 0.18) this.mode = 'walk';
    else this.mode = 'idle';
  }

  setWeapon(weapon) {
    if (weapon === 'sword' || weapon === 'gun') this.weapon = weapon;
  }

  setAim(angle) {
    this.aimAngle = clamp(angle, -0.72, 0.78);
  }

  triggerPrimary(weapon = this.weapon) {
    this.weapon = weapon;
    this.actionDuration = weapon === 'gun' ? 0.12 : 0.38;
    this.actionTimer = this.actionDuration;
  }

  notifyLand(impact = 1) {
    this.landingTimer = clamp(0.10 + impact * 0.018, 0.10, 0.18);
  }

  update(delta) {
    const dt = Math.min(delta, 0.05);
    this.time += dt;
    this.actionTimer = Math.max(0, this.actionTimer - dt);
    this.landingTimer = Math.max(0, this.landingTimer - dt);

    const j = this.rig.joints;
    const running = this.mode === 'run';
    const moving = this.mode === 'walk' || running;
    const cadence = running ? 11.2 : 7.6;
    const phase = this.time * cadence;
    const stride = Math.sin(phase);
    const liftFront = Math.max(0, Math.cos(phase));
    const liftBack = Math.max(0, -Math.cos(phase));

    const t = {
      lHip: 0,
      rHip: 0,
      lKnee: 0,
      rKnee: 0,
      lAnkle: 0,
      rAnkle: 0,
      lShoulder: 0.05,
      rShoulder: -0.02,
      lElbow: -0.10,
      rElbow: -0.12,
      torso: 0,
      head: 0,
      bob: 0,
      scaleY: 1,
      scaleX: 1
    };

    if (moving) {
      const hipSwing = (running ? 0.78 : 0.56) * this.moveAmount;
      const armSwing = (running ? 0.68 : 0.46) * this.moveAmount;
      const kneeBend = running ? 0.92 : 0.68;

      t.rHip = stride * hipSwing;
      t.lHip = -stride * hipSwing;
      t.rKnee = -liftBack * kneeBend;
      t.lKnee = -liftFront * kneeBend;
      t.rAnkle = -t.rHip * 0.28 + liftBack * 0.14;
      t.lAnkle = -t.lHip * 0.28 + liftFront * 0.14;

      t.rShoulder = -stride * armSwing * 0.72;
      t.lShoulder = stride * armSwing;
      t.rElbow = -0.16 - Math.max(0, stride) * 0.16;
      t.lElbow = -0.14 - Math.max(0, -stride) * 0.14;

      t.torso = -stride * (running ? 0.032 : 0.022);
      t.head = -t.torso * 0.55;
      t.bob = Math.abs(Math.cos(phase)) * (running ? 0.055 : 0.032);
    } else if (this.mode === 'jump') {
      const rise = clamp(this.verticalVelocity / 7.5, 0, 1);
      t.rHip = 0.34 + rise * 0.08;
      t.lHip = -0.22;
      t.rKnee = -0.66;
      t.lKnee = -0.42;
      t.rShoulder = 0.28;
      t.lShoulder = -0.22;
      t.rElbow = -0.28;
      t.lElbow = -0.22;
      t.torso = -0.045;
      t.bob = 0.018;
    } else if (this.mode === 'fall') {
      const fall = clamp(-this.verticalVelocity / 9, 0, 1);
      t.rHip = -0.16;
      t.lHip = 0.23;
      t.rKnee = -0.38 - fall * 0.12;
      t.lKnee = -0.52;
      t.rShoulder = -0.18;
      t.lShoulder = 0.24;
      t.rElbow = -0.22;
      t.lElbow = -0.20;
      t.torso = 0.035;
    } else {
      const breathe = Math.sin(this.time * 1.7);
      t.rShoulder = -0.025 + breathe * 0.015;
      t.lShoulder = 0.045 - breathe * 0.012;
      t.rElbow = -0.12;
      t.lElbow = -0.10;
      t.torso = Math.sin(this.time * 0.72) * 0.008;
      t.head = -t.torso * 0.75;
      t.bob = Math.sin(this.time * 1.7) * 0.006;
    }

    if (this.weapon === 'gun') {
      const aim = this.aimAngle;
      t.rShoulder = 1.16 + aim * 0.62;
      t.rElbow = -0.48 + aim * 0.18;
      t.lShoulder = 0.92 + aim * 0.52;
      t.lElbow = -0.82 + aim * 0.16;
      t.torso += -aim * 0.035;
      t.head += aim * 0.09;
    } else {
      t.rShoulder += 0.18;
      t.rElbow = Math.min(t.rElbow, -0.24);
    }

    if (this.actionTimer > 0) {
      const p = 1 - this.actionTimer / this.actionDuration;
      if (this.weapon === 'gun') {
        const recoil = Math.sin(p * Math.PI);
        t.rShoulder -= recoil * 0.14;
        t.lShoulder -= recoil * 0.07;
        t.torso += recoil * 0.025;
      } else {
        const windup = p < 0.28 ? p / 0.28 : 1;
        const swing = p < 0.28 ? 0 : (p - 0.28) / 0.72;
        t.rShoulder = p < 0.28
          ? lerp(0.35, 1.95, windup)
          : lerp(1.95, -0.72, swing);
        t.rElbow = p < 0.28
          ? lerp(-0.30, -0.78, windup)
          : lerp(-0.78, -0.18, swing);
        t.torso = p < 0.28 ? -0.08 * windup : lerp(-0.08, 0.10, swing);
        t.head = -t.torso * 0.45;
      }
    }

    if (this.landingTimer > 0) {
      const p = this.landingTimer / 0.18;
      const compression = Math.sin(clamp(p, 0, 1) * Math.PI);
      t.rHip += 0.10 * compression;
      t.lHip -= 0.08 * compression;
      t.rKnee -= 0.28 * compression;
      t.lKnee -= 0.28 * compression;
      t.scaleY = 1 - 0.075 * compression;
      t.scaleX = 1 + 0.045 * compression;
      t.bob -= 0.035 * compression;
    }

    const k = running ? 19 : 15;
    j.rightUpperLeg.rotation.z = damp(j.rightUpperLeg.rotation.z, t.rHip, k, dt);
    j.leftUpperLeg.rotation.z = damp(j.leftUpperLeg.rotation.z, t.lHip, k, dt);
    j.rightLowerLeg.rotation.z = damp(j.rightLowerLeg.rotation.z, t.rKnee, k + 2, dt);
    j.leftLowerLeg.rotation.z = damp(j.leftLowerLeg.rotation.z, t.lKnee, k + 2, dt);
    j.rightFoot.rotation.z = damp(j.rightFoot.rotation.z, t.rAnkle, k, dt);
    j.leftFoot.rotation.z = damp(j.leftFoot.rotation.z, t.lAnkle, k, dt);

    j.rightUpperArm.rotation.z = damp(j.rightUpperArm.rotation.z, t.rShoulder, k, dt);
    j.leftUpperArm.rotation.z = damp(j.leftUpperArm.rotation.z, t.lShoulder, k, dt);
    j.rightLowerArm.rotation.z = damp(j.rightLowerArm.rotation.z, t.rElbow, k + 1, dt);
    j.leftLowerArm.rotation.z = damp(j.leftLowerArm.rotation.z, t.lElbow, k + 1, dt);

    j.torso.rotation.z = damp(j.torso.rotation.z, t.torso, 12, dt);
    j.head.rotation.z = damp(j.head.rotation.z, t.head, 12, dt);
    j.visualRoot.position.y = damp(j.visualRoot.position.y, t.bob, 18, dt);
    j.visualRoot.scale.y = damp(j.visualRoot.scale.y, t.scaleY, 20, dt);

    const facingSign = Math.sign(j.visualRoot.scale.x) || 1;
    j.visualRoot.scale.x = facingSign * damp(Math.abs(j.visualRoot.scale.x), t.scaleX, 20, dt);
  }
}
