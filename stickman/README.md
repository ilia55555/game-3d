# Stickman modular character lab

1. این پوشه فعلاً فقط برای طراحی و تست کاراکتر اصلی است و هیچ دشمنی در اجرای عادی Spawn نمی‌شود.
2. مفصل‌های سر، شانه، آرنج، مچ، لگن، زانو و مچ پا به‌صورت Transform داخلی وجود دارند ولی هیچ Mesh قابل‌دیدنی ندارند.
3. بدن با Capsule/Sphereهای هم‌پوشان و متریال یکسان ساخته شده تا با وجود ریگ داخلی، یکپارچه دیده شود و دست‌ها به تنه نچسبند.
4. شمشیر و تفنگ در `src/weapons/weapon.system.js` مستقل هستند و با کلیدهای `1` و `2` یا اسکرول موس تعویض می‌شوند.
5. جهت افقی Mouse Look اصلاح شده است؛ حرکت موس به راست، دید و جهت کاراکتر را به سمت راست می‌برد.

## اجرا روی GitHub Pages

وقتی Pages روی `Ilia / (root)` باشد:

```text
https://ilia55555.github.io/game-3d/
```

یا مستقیم:

```text
https://ilia55555.github.io/game-3d/stickman/
```

## کنترل‌ها

```text
WASD        حرکت
SHIFT       دویدن
SPACE       پرش
Mouse       دوربین سوم‌شخص
LMB / F     تست حرکت/عمل سلاح
1           شمشیر
2           تفنگ
Mouse Wheel تغییر بین شمشیر و تفنگ
Q           تغییر افکت Ice / Fire
ESC         آزاد کردن ماوس / Pause
```

## ساختار فعلی

```text
stickman/
├─ index.html
├─ styles/
│  └─ main.css
└─ src/
   ├─ main.js
   ├─ core/
   │  └─ scene.js
   ├─ model/
   │  ├─ stickman.config.js
   │  ├─ stickman.materials.js
   │  └─ stickman.model.js
   ├─ animation/
   │  └─ stickman.animations.js
   ├─ gameplay/
   │  └─ player.controller.js
   ├─ weapons/
   │  └─ weapon.system.js
   ├─ effects/
   │  └─ elemental.aura.js
   ├─ ui/
   │  └─ hud.js
   └─ levels/
      └─ level01.js
```

## وضعیت این فاز

- دشمن‌ها و Projectile/Combat enemy systems در `main.js` import یا start نمی‌شوند.
- مفصل‌ها فقط برای انیمیشن هستند و هیچ کره/نقطهٔ قرمز یا قطعهٔ مفصلی روی بدن رندر نمی‌شود.
- آرنج و زانو با هم‌پوشانی بخش‌های بدن پنهان شده‌اند تا در حین خم‌شدن شکاف واضح ایجاد نشود.
- حالت تفنگ پوز دو دستی دارد و حالت شمشیر پوز و Swing مستقل دارد.
- افکت یخ/آتش همچنان مستقل از بدنه باقی مانده تا ظاهر خود کاراکتر تمیز باشد.
