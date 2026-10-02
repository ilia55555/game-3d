// File: stickman/src/enemies/enemy.system.js
// Role: Future owner of enemy spawning, AI state, target selection, and enemy lifecycle.
// Scope: Enemy entities and behavior only; this first model-design phase leaves spawning disabled.
// Rule: Player logic, stickman geometry, animation authoring, combat damage, and levels stay elsewhere.
// Goal: Give enemies a dedicated module before any AI is added, avoiding one giant game script later.

export class EnemySystem {
  constructor({ scene }) {
    this.scene = scene;
    this.enabled = false;
    this.enemies = [];
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
  }

  spawn(_definition) {
    if (!this.enabled) return null;
    return null;
  }

  update(_delta) {
    if (!this.enabled) return;
    // AI will be implemented after the player model/rig is approved.
  }

  clear() {
    this.enemies.length = 0;
  }
}
