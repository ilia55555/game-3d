// File: stickman/src/ui/hud.js
// Role: Updates hero health, energy, weapon label, aura label, toast, and pause/intro overlays.
// Scope: DOM presentation only; it never moves the character, animates joints, or creates Three.js objects.
// Rule: Character, input, weapon, aura, and level systems send their state into this UI module.
// Goal: Keep the hero-only test scene clear while enemies and wave UI remain completely absent.

export class GameHUD {
  constructor() {
    this.hpFill = document.querySelector('#hpFill');
    this.hpText = document.querySelector('#hpText');
    this.energyFill = document.querySelector('#energyFill');
    this.energyText = document.querySelector('#energyText');
    this.weaponText = document.querySelector('#weaponText');
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

  setWeapon(weapon) {
    const gun = weapon === 'gun';
    this.weaponText.textContent = gun ? 'GUN' : 'SWORD';
    this.toast(gun ? 'تفنگ انتخاب شد' : 'شمشیر انتخاب شد');
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
    this.description.textContent = 'تست کاراکتر متوقف شده. برای ادامه دوباره وارد کنترل ماوس شو.';
    this.startButton.textContent = 'ادامه';
    this.small.textContent = 'ESC ماوس را آزاد می‌کند.';
  }

  showIntro() {
    this.overlay.classList.add('show');
    this.title.textContent = 'STICK // HERO';
    this.description.textContent = 'فقط کاراکتر اصلی فعال است: ریگ مفصلی مخفی، بدن یکپارچه، حرکت کامل و دو سلاح قابل تعویض.';
    this.startButton.textContent = 'شروع تست کاراکتر';
    this.small.textContent = '1 شمشیر، 2 تفنگ، اسکرول برای تغییر سلاح. دشمن‌ها فعلاً غیرفعال‌اند.';
  }
}
