// File: stickman/src/main.js
// Role: Composes rendering, level, hero, animation, aura, controls, projectiles, enemies, and HUD.
// Scope: Startup and frame-loop orchestration only; each gameplay system remains implemented elsewhere.
// Rule: New mechanics should be added to dedicated modules and only connected here through callbacks.
// Goal: Keep the playable game easy to edit while GitHub Pages can run it directly from this entry point.

import { createScene } from './core/scene.js';
import { createStickmanModel } from './model/stickman.model.js';
import { StickmanAnimator } from './animation/stickman.animations.js';
import { createLevel01 } from './levels/level01.js';
import { PlayerController } from './gameplay/player.controller.js';
import { EnemySystem } from './enemies/enemy.system.js';
import { ProjectileSystem } from './combat/projectile.system.js';
import { ElementalAura } from './effects/elemental.aura.js';
import { GameHUD } from './ui/hud.js';

const canvas = document.querySelector('#game');
const app = createScene(canvas);
const level = createLevel01(app.scene);
const hud = new GameHUD();

const hero = createStickmanModel();
app.scene.add(hero);

const animator = new StickmanAnimator(hero);
const aura = new ElementalAura(hero);

let projectiles;
let enemies;
let gameStarted = false;
let gameOver = false;
let paused = true;

const player = new PlayerController({
  stickman: hero,
  animator,
  camera: app.camera,
  domElement: app.renderer.domElement,
  level,
  onShoot(origin, direction, mode) {
    if (!paused && !gameOver) projectiles?.spawn(origin, direction, mode);
  },
  onMelee(origin, direction, mode) {
    if (!paused && !gameOver) enemies?.meleeAttack(origin, direction, mode);
  },
  onToggleElement(mode) {
    aura.setMode(mode);
    hud.setAura(mode);
  },
  onDeath() {
    gameOver = true;
    paused = true;
    enemies?.setEnabled(false);
    hud.showGameOver(enemies?.score ?? 0, enemies?.wave ?? 1);
  },
  onPause() {
    if (!gameStarted || gameOver) return;
    paused = true;
    player.setEnabled(false);
    hud.showPause();
  }
});

enemies = new EnemySystem({
  scene: app.scene,
  level,
  player,
  onCountChange: count => hud.setEnemies(count),
  onWaveChange: wave => hud.setWave(wave),
  onScore: score => hud.setScore(score)
});

projectiles = new ProjectileSystem({
  scene: app.scene,
  enemySystem: enemies
});

function beginNewGame() {
  gameStarted = true;
  gameOver = false;
  paused = false;
  projectiles.clear();
  player.reset(level.playerSpawn);
  player.elementMode = 'ice';
  aura.setMode('ice');
  hud.setAura('ice');
  hud.setScore(0);
  hud.setEnemies(0);
  enemies.start();
  player.setEnabled(true);
  hud.hideOverlay();
  player.requestPointerLock();
}

function resumeGame() {
  if (gameOver) {
    beginNewGame();
    return;
  }
  paused = false;
  player.setEnabled(true);
  hud.hideOverlay();
  player.requestPointerLock();
}

hud.startButton.addEventListener('click', () => {
  if (!gameStarted || gameOver) beginNewGame();
  else resumeGame();
});

hud.showIntro();
hud.setAura('ice');
hud.updatePlayer(player);

let lastTime = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const delta = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  player.update(delta);
  animator.update(delta);
  aura.update(delta);
  level.update(now / 1000);

  if (!paused && !gameOver) {
    projectiles.update(delta);
    enemies.update(delta);
  }

  hud.updatePlayer(player);
  app.renderer.render(app.scene, app.camera);
}

requestAnimationFrame(frame);
