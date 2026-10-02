// File: stickman/src/model/stickman.config.js
// Role: Central source for stickman proportions, spacing, collision height, and visual tuning values.
// Scope: Numeric configuration only; it contains no Three.js object creation or animation code.
// Rule: Model builders and gameplay consume these values while AI, combat, and levels stay separate.
// Goal: Keep the character silhouette cohesive and make later proportion edits safe and fast.

export const STICKMAN_CONFIG = Object.freeze({
  pelvisY: 1.58,
  torsoLength: 0.98,
  torsoRadius: 0.19,
  chestRadius: 0.245,
  pelvisRadius: 0.205,

  headRadius: 0.35,
  headGap: 0.34,

  shoulderX: 0.33,
  shoulderYFactor: 0.82,
  hipX: 0.14,

  upperArm: 0.62,
  lowerArm: 0.58,
  upperArmRadius: 0.105,
  lowerArmRadius: 0.095,

  upperLeg: 0.72,
  lowerLeg: 0.70,
  upperLegRadius: 0.125,
  lowerLegRadius: 0.108,

  handRadius: 0.115,
  footRadius: 0.14,

  bodyColor: 0x111820,
  bodySecondary: 0x17232d,
  accentIce: 0x7eeaff,
  accentFire: 0xff8d3a,
  eyeColor: 0xffffff,

  playerRadius: 0.43,
  playerHeight: 3.05
});
