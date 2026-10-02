// File: stickman/src/model/stickman.config.js
// Role: Central source for stickman dimensions, proportions, spacing, and visual tuning constants.
// Scope: Numeric configuration only; it contains no Three.js object creation or animation code.
// Rule: Model builders consume these values, while gameplay, enemies, combat, and levels stay separate.
// Goal: Make future body-shape edits fast and safe without hunting through implementation files.

export const STICKMAN_CONFIG = Object.freeze({
  pelvisY: 1.68,
  torsoLength: 1.05,
  torsoTopRadius: 0.20,
  torsoBottomRadius: 0.16,

  headRadius: 0.36,
  headGap: 0.37,

  shoulderX: 0.36,
  shoulderYFactor: 0.84,
  hipX: 0.15,

  upperArm: 0.68,
  lowerArm: 0.64,
  upperArmRadius: 0.095,
  lowerArmRadius: 0.086,

  upperLeg: 0.78,
  lowerLeg: 0.76,
  upperLegRadius: 0.112,
  lowerLegRadius: 0.098,

  handRadius: 0.105,
  footRadius: 0.13,

  glowColor: 0xff6a00,
  glowStrongColor: 0xff8a16,
  eyeColor: 0xffffff
});
