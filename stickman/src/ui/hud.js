// File: stickman/src/ui/hud.js
// Role: Updates character-test health, energy, weapon, element badge, toast, and start/pause overlay text.
// Scope: DOM presentation only; it never moves the player, builds weapons, animates joints, or creates level objects.
// Rule: Enemy wave, score, and enemy-count UI are intentionally absent while the hero-design phase is active.
// Goal: Keep the screen focused on judging 2D character motion, jump feel, weapon switching, and elemental style.

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
    this.weaponText.textContent = gun ? '2 · GUN' : '1 · SWORD';
    this.toast(gun ? 'تفنگ' : 'شمشیر');
  }

  setAura(mode) {
    const fire = mode === 'fire';
    this.auraBadge.textContent = fire ? '🔥 FIRE' : '❄ ICE';
    this.auraBadge.style.color = fire ? '#ffe0bd' : '#d8f7ff';
    this.toast(fire ? 'حالت آتشی' : 'حالت یخی');
  }

  toast(text) {
    this.toastNode.textContent = text;
    this.toastNode.style.opacity = '1';
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastNode.style.opacity = '0';
    }, 800);
  }

  hideOverlay() {
    this.overlay.classList.remove('show');
  }

  showPause() {
    this.overlay.classList.add('show');
    this.title.textContent = 'PAUSED';
    this.description.textContent = 'تست کاراکتر متوقف شده. برای ادامه روی دکمه بزن.';
    this.startButton.textContent = 'ادامه';
    this.small.textContent = 'در حالت ۲.۵ بعدی ماوس قفل نمی‌شود.';
  }

  showIntro() {
    this.overlay.classList.add('show');
    this.title.textContent = 'STICK // 2.5D';
    this.description.textContent = 'فقط کاراکتر اصلی فعال است: شخصیت دوبعدی، محیط سه‌بعدی، حرکت از بغل و ریگ مفصلی کاملاً مخفی.';
    this.startButton.textContent = 'تست کاراکتر';
    this.small.textContent = 'A/D حرکت · W یا Space پرش · 1/2 یا اسکرول تعویض سلاح';
  }
}
