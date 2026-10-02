// File: stickman/src/model/stickman.config.js
// Role: Central source for the 2D hero proportions, spacing, collision height, and visual tuning values.
// Scope: Numeric configuration only; it contains no Three.js object creation or animation code.
// Rule: Model builders and gameplay consume these values while combat, enemies, and levels stay separate.
// Goal: Keep the side-view silhouette balanced and make proportion edits safe without touching rig logic.

export const STICKMAN_CONFIG = Object.freeze({
  pelvisY: 1.39,
  torsoLength: 0.92,
  torsoHalfWidth: 0.13,
  chestHalfWidth: 0.19,
  pelvisHalfWidth: 0.16,

  headRadius: 0.32,
  headGap: 0.31,

  shoulderX: 0.23,
  shoulderYFactor: 0.82,
  hipX: 0.105,

  upperArm: 0.56,
  lowerArm: 0.53,
  upperArmRadius: 0.082,
  lowerArmRadius: 0.074,

  upperLeg: 0.70,
  lowerLeg: 0.68,
  upperLegRadius: 0.095,
  lowerLegRadius: 0.082,

  handRadius: 0.092,
  footLength: 0.25,
  footThickness: 0.105,

  bodyColor: 0x11161c,
  bodySecondary: 0x11161c,
  outlineColor: 0x071015,
  accentIce: 0x7eeaff,
  accentFire: 0xff8d3a,
  eyeColor: 0xffffff,

  playerRadius: 0.34,
  playerHeight: 2.70,
  laneZ: 0
});
