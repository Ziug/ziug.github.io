# Сад для вас — интерактивный подарок

Мобильный интерактивный «живой сад»: свайп-вход, рыхление земли пальцем,
посадка семян drag-and-drop, полив из лейки, рост цветов, бабочка, светлячок
и финальный букет с письмом. Состояние сада сохраняется в `localStorage`.

## Запуск

```bash
npm install
npm run dev    # http://localhost:5173
npm run build  # проверка production-сборки
```

Мобильный приоритет: iPhone Safari 390×844, `100dvh`, safe-area insets,
pointer-события, touch-targets ≥ 44px. Desktop тоже работает.

## Структура

```
src/
  scenes/      Arrival.tsx  Garden.tsx  Bouquet.tsx
  components/  Illustrations.tsx (веточка, семя, 5 цветов, лейка, светлячок)
  state/       garden.tsx (машина сцен + localStorage)
  audio/       ambience.ts (Web Audio, только после жеста)
  types.ts
docs/ASSETS.md — исследование SVG-ассетов и лицензии
```

Поток: arrival (swipe-up) → посадка семени (семя следует за пальцем) →
полив из лейки → постепенный рост → сад → светлячок → букет → живой сад.

Сцены: arrival (swipe-up) → сад (рубление → посадка → полив → рост →
сад → светлячок) → букет → живой сад после. Все цветы — оригинальный
hand-drawn SVG с раздельными stem/leaves/petals для стадий роста.
