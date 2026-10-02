// File: stickman/src/gameplay/player.controller.js
// Role: Future home of player movement, input, aim, jump, crouch, and weapon state.
// Scope: Gameplay-facing player state only; this first phase intentionally keeps it disabled.
// Rule: Model geometry, animation clips, enemy AI, damage rules, and level layout stay elsewhere.
// Goal: Reserve a clean player layer now so later gameplay work never pollutes the model files.

export class PlayerController {
  constructor({ stickman, animator, camera, domElement }) {
    this.stickman = stickman;
    this.animator = animator;
    this.camera = camera;
    this.domElement = domElement;

    this.enabled = false;
    this.velocity = { x: 0, y: 0, z: 0 };
    this.state = {
      grounded: true,
      crouching: false,
      sprinting: false,
      aiming: false,
      reloading: false
    };
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
  }

  update(_delta) {
    if (!this.enabled) return;
    // Intentionally empty in the model-design phase.
    // Movement/input will be implemented only after the stickman look is approved.
  }
}
