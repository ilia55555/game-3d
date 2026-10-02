// File: stickman/src/main.js
// Role: Composes the scene, stickman model, animator, and model-preview UI.
// Scope: Startup and frame-loop orchestration only; it does not define systems internally.
// Rule: Model, animation, gameplay, enemies, combat, and level implementation remain separate files.
// Goal: Keep the entry point tiny so every subsystem can be replaced without rewriting startup code.

import { createScene } from './core/scene.js';
import { createStickmanModel } from './model/stickman.model.js';
import { StickmanAnimator } from './animation/stickman.animations.js';
import { createLevel01 } from './levels/level01.js';
import { PlayerController } from './gameplay/player.controller.js';
import { EnemySystem } from './enemies/enemy.system.js';

const canvas = document.querySelector('#game');
const status = document.querySelector('#status');
const app = createScene(canvas);
const level = createLevel01(app.scene);

const stickman = createStickmanModel();
app.scene.add(stickman);

const animator = new StickmanAnimator(stickman);
const player = new PlayerController({
  stickman,
  animator,
  camera: app.camera,
  domElement: app.renderer.domElement
});
const enemies = new EnemySystem({ scene: app.scene });

// Model-design phase: gameplay and enemies are deliberately present but inactive.
player.setEnabled(false);
enemies.setEnabled(false);

for (const button of document.querySelectorAll('[data-animation]')) {
  button.addEventListener('click', () => {
    animator.setMode(button.dataset.animation);
    document.querySelectorAll('[data-animation]').forEach(item => {
      item.classList.toggle('active', item === button);
    });
    status.textContent = `MODEL PREVIEW • ${button.dataset.animation.toUpperCase()}`;
  });
}

for (const button of document.querySelectorAll('[data-part]')) {
  button.addEventListener('click', () => {
    const visible = stickman.userData.stickman.togglePart(button.dataset.part);
    button.classList.toggle('off', !visible);
  });
}

let lastTime = performance.now();

function frame(now) {
  requestAnimationFrame(frame);
  const delta = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  animator.update(delta);
  player.update(delta);
  enemies.update(delta);
  level.update(now / 1000);
  app.controls.update();
  app.renderer.render(app.scene, app.camera);
}

requestAnimationFrame(frame);
