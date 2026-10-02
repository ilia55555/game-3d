# Stickman modular 2.5D character lab

1. این پوشه فعلاً فقط برای طراحی و تست کاراکتر اصلی است و هیچ دشمنی در اجرای عادی Spawn نمی‌شود.
2. کاراکتر اکنون کاملاً دوبعدی است و داخل یک محیط سه‌بعدی Side View اجرا می‌شود؛ دوربین دیگر سوم‌شخص آزاد نیست.
3. مفصل‌های شانه، آرنج، مچ، لگن، زانو و مچ پا فقط Transform داخلی‌اند و هیچ Mesh مفصلی قابل‌دیدنی ندارند.
4. راه‌رفتن، دویدن، پرش، سقوط و فرود برای حرکت ۲.۵ بعدی بازنویسی شده‌اند و Jump از Coyote Time و Jump Cut استفاده می‌کند.
5. شمشیر و تفنگ مستقل‌اند و با `1`، `2` یا اسکرول موس عوض می‌شوند؛ ماوس عادی برای Aim استفاده می‌شود و جهتش برعکس نیست.

## اجرا روی GitHub Pages

```text
https://ilia55555.github.io/game-3d/
```

یا مستقیم:

```text
https://ilia55555.github.io/game-3d/stickman/
```

## کنترل‌ها

```text
A / D        حرکت چپ و راست
SHIFT        دویدن
W / SPACE    پرش
Mouse        Aim و جابه‌جایی نرم قاب دوربین
LMB / F      استفاده از سلاح
1            شمشیر
2            تفنگ
Mouse Wheel  تعویض بین شمشیر و تفنگ
Q            تغییر افکت Ice / Fire
ESC          Pause
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

- `main.js` هیچ Enemy System یا Projectile System را import یا start نمی‌کند.
- مدل از ShapeGeometryهای تخت ساخته شده و دیگر ظاهر پلاستیکی سه‌بعدی ندارد.
- اعضا کمی روی هم هم‌پوشانی دارند تا در زانو، آرنج و مچ شکاف مفصل دیده نشود.
- راه‌رفتن با Swing مخالف دست و پا، خم‌شدن زانو، حرکت مچ پا و Bob عمودی نرم ساخته شده است.
- پرش دارای Coyote Time، Jump Buffer، Jump Cut و فشردگی کوتاه هنگام فرود است.
- محیط هنوز کاملاً سه‌بعدی است ولی بازیکن فقط روی Lane دوبعدی `X/Y` حرکت می‌کند.
