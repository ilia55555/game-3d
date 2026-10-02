// File: stickman/src/ui/hud.js
// Role: Updates health, energy, wave, score, enemy count, aura label, toast, and overlay text.
// Scope: DOM presentation only; it never moves entities, applies damage, or creates Three.js objects.
// Rule: Gameplay systems send state into this module instead of querying or styling HUD nodes themselves.
// Goal: Keep main.js and gameplay modules free from repetitive browser UI manipulation.

export class GameHUD {
  constructor() {
    this.hpFill = document.querySelector('#hpFill');
    this.hpText = document.querySelector('#hpText');
    this.energyFill = document.querySelector('#energyFill');
    this.energyText = document.querySelector('#energyText');
    this.waveText = document.querySelector('#waveText');
    this.enemyText = document.querySelector('#enemyText');
    this.scoreText = document.querySelector('#scoreText');
    this.auraBadge = document.querySelector('#auraBadge');
    this.toastNode = document.querySelector('#toast');
    this.overlay = document.querySelector('#overlay');
    this.startButton = document.querySelector('#startButton');
    this.title = this.overlay.querySelector('h1');
    this.description = this.overlay.querySelector('p');
    this.small = this.overlay.querySelector('small');
    this.toastTimer = 0;
  }

  updatePlayer(player) {
    const hp = Math.max(0, Math.min(1, player.hp / player.maxHp));
    const energy = Math.max(0, Math.min(1, player.energy / player.maxEnergy));
    this.hpFill.style.width = `${hp * 100}%`;
    this.hpText.textContent = String(Math.ceil(player.hp));
    this.energyFill.style.width = `${energy * 100}%`;
    this.energyText.textContent = String(Math.ceil(player.energy));
  }

  setWave(wave) {
    this.waveText.textContent = `WAVE ${wave}`;
    this.toast(`موج ${wave}`);
  }

  setEnemies(count) {
    this.enemyText.textContent = String(count);
  }

  setScore(score) {
    this.scoreText.textContent = String(score);
  }

  setAura(mode) {
    const fire = mode === 'fire';
    this.auraBadge.textContent = fire ? '🔥 FIRE' : '❄ ICE';
    this.auraBadge.style.color = fire ? '#ffd1a6' : '#d8f7ff';
    this.toast(fire ? 'حالت آتشی' : 'حالت یخی');
  }

  toast(text) {
    this.toastNode.textContent = text;
    this.toastNode.style.opacity = '1';
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastNode.style.opacity = '0';
    }, 900);
  }

  hideOverlay() {
    this.overlay.classList.remove('show');
  }

  showPause() {
    this.overlay.classList.add('show');
    this.title.textContent = 'PAUSED';
    this.description.textContent = 'بازی متوقف شده. برای ادامه دوباره وارد کنترل ماوس شو.';
    this.startButton.textContent = 'ادامه';
    this.small.textContent = 'ESC دوباره ماوس را آزاد می‌کند.';
  }

  showGameOver(score, wave) {
    this.overlay.classList.add('show');
    this.title.textContent = 'SYSTEM DOWN';
    this.description.textContent = `امتیاز ${score} — رسیدی به موج ${wave}. برای شروع دوباره دکمه را بزن.`;
    this.startButton.textContent = 'شروع دوباره';
    this.small.textContent = 'همه چیز از موج اول ریست می‌شود.';
  }

  showIntro() {
    this.overlay.classList.add('show');
    this.title.textContent = 'STICK // ELEMENT';
    this.description.textContent = 'استیک‌من یکپارچه با هالهٔ عنصری. در محیط سه‌بعدی حرکت کن، دشمن‌ها را نابود کن و با Q بین حالت یخی و آتشی جابه‌جا شو.';
    this.startButton.textContent = 'شروع بازی';
    this.small.textContent = 'برای کنترل دوربین بعد از شروع، ماوس قفل می‌شود.';
  }
}
