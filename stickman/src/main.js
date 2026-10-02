// File: stickman/src/main.js
// Role: Composes rendering, 2.5D level, 2D hero, hidden-rig animation, aura, weapons, controls, and HUD.
// Scope: Startup and frame-loop orchestration only; every implementation remains inside its dedicated module.
// Rule: Enemy and projectile systems are intentionally not imported or started during the hero-design phase.
// Goal: Keep the live GitHub Pages build focused on the main character, side movement, jump quality, and weapons.

import { createScene } from './core/scene.js';
import { createStickmanModel } from './model/stickman.model.js';
import { StickmanAnimator } from './animation/stickman.animations.js';
import { createLevel01 } from './levels/level01.js';
import { PlayerController } from './gameplay/player.controller.js';
import { ElementalAura } from './effects/elemental.aura.js';
import { WeaponSystem } from './weapons/weapon.system.js';
import { GameHUD } from './ui/hud.js';

const canvas = document.querySelector('#game');
const app = createScene(canvas);
const level = createLevel01(app.scene);
const hud = new GameHUD();

const hero = createStickmanModel();
app.scene.add(hero);

const animator = new StickmanAnimator(hero);
const aura = new ElementalAura(hero);
const weapons = new WeaponSystem(hero);

let started = false;
let paused = true;

const player = new PlayerController({
  stickman: hero,
  animator,
  camera: app.camera,
  domElement: app.renderer.domElement,
  level,

  onPrimaryAction() {
    if (!paused) weapons.triggerPrimary();
  },

  onWeaponChange(weapon) {
    weapons.select(weapon);
    animator.setWeapon(weapon);
    hud.setWeapon(weapon);
  },

  onToggleElement(mode) {
    aura.setMode(mode);
    weapons.setElementMode(mode);
    hero.userData.stickman.setElementMode(mode);
    hud.setAura(mode);
  },

  onDeath() {
    paused = true;
    player.setEnabled(false);
  },

  onPause() {
    if (!started) return;
    paused = true;
    player.setEnabled(false);
    hud.showPause();
  }
});

function applyDefaultCharacterState() {
  player.elementMode = 'ice';
  player.selectWeapon('sword');
  aura.setMode('ice');
  weapons.setElementMode('ice');
  hero.userData.stickman.setElementMode('ice');
  hud.setAura('ice');
  hud.setWeapon('sword');
}

function beginCharacterTest() {
  started = true;
  paused = false;
  player.reset(level.playerSpawn);
  applyDefaultCharacterState();
  player.setEnabled(true);
  hud.hideOverlay();
  player.requestPointerLock();
}

function resumeCharacterTest() {
  paused = false;
  player.setEnabled(true);
  hud.hideOverlay();
  player.requestPointerLock();
}

hud.startButton.addEventListener('click', () => {
  if (!started) beginCharacterTest();
  else resumeCharacterTest();
});

hud.showIntro();
applyDefaultCharacterState();
hud.updatePlayer(player);

let lastTime = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const delta = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  player.update(delta);
  animator.update(delta);
  aura.update(delta);
  weapons.update(delta);
  level.update(now / 1000);
  hud.updatePlayer(player);

  app.renderer.render(app.scene, app.camera);
}

requestAnimationFrame(frame);

const exportButton = document.querySelector('#exportUnity');
exportButton.addEventListener('click', async () => {
  exportButton.disabled = true;
  exportButton.textContent = 'در حال ساخت خروجی…';
  try {
    const { exportUnityCharacter } = await import('./export/unity.export.js');
    await exportUnityCharacter(hero);
    exportButton.textContent = 'دانلود مدل + انیمیشن GLB';
  } catch (error) {
    console.error(error);
    exportButton.textContent = 'خروجی ناموفق؛ دوباره تلاش کنید';
  } finally { exportButton.disabled = false; }
});
