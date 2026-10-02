// File: stickman/src/combat/damage.system.js
// Role: Defines the future contract for body-part damage and dismemberment decisions.
// Scope: Hit classification and detach requests only; no bullets, AI, model building, or level code.
// Rule: Physical debris motion and visual model changes are delegated to their dedicated systems.
// Goal: Keep limb loss predictable and testable instead of hard-coding it inside weapon logic.

export const BODY_PART_DAMAGE = Object.freeze({
  head: { multiplier: 2.0, detachable: true },
  torso: { multiplier: 1.0, detachable: false },
  leftArm: { multiplier: 0.85, detachable: true },
  rightArm: { multiplier: 0.85, detachable: true },
  leftLeg: { multiplier: 0.9, detachable: true },
  rightLeg: { multiplier: 0.9, detachable: true }
});

export class DamageSystem {
  constructor() {
    this.enabled = false;
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
  }

  resolveHit({ part = 'torso', baseDamage = 0 } = {}) {
    const rule = BODY_PART_DAMAGE[part] ?? BODY_PART_DAMAGE.torso;
    return {
      part,
      damage: baseDamage * rule.multiplier,
      detachable: this.enabled && rule.detachable
    };
  }
}
