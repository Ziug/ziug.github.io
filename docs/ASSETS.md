# Asset research & licensing

Date: 2026-09-11
Project: «Сад для вас» — mobile interactive birthday garden

## What was searched

Researched ready-made botanical SVG assets for a delicate hand-drawn garden:

- `botanical flower SVG hand drawn CC0` → SVG Repo (`svg-repo.com/vectors/botanical`,
  `/vectors/flowers`, `/vectors/flora`), svgsilh (CC0, Pixabay-derived), FreeSVG.org
  (CC0 / Public Domain, e.g. Floral line art, Rose Line Art).
- `floral line art SVG public domain undraw` → unDraw license + `gardening` illustration,
  FreeSVG.org floral line-art pages, publicdomainvectors.org flower line-art sets.

## Decision

**No third-party SVG is bundled.** Reasons:

1. SVG Repo / svgsilh / FreeSVG botanical packs are CC0 but stylistically icon-like:
   uniform strokes, geometric petals, symmetrical clip-art. They break the brief's
   «no primitive geometry / no stock-looking 3D flowers» rule and cannot be cleanly
   split into `stem / leaves / petals / center` for staged growth animation.
2. unDraw `Gardening` illustrations are high quality and free for personal/commercial
   use without attribution, but the license forbids redistribution as packs and the
   flat-duotone human-centric style clashes with the quiet botanical watercolor
   direction. Using one unDraw human would dominate the scene and kill the
   «interface disappears» atmosphere.
3. Pinterest / Google Images botanical art has unclear copyright — explicitly
   excluded per brief.

So all flowers, soil, grass, watering can, butterfly, firefly and twig artwork in
`src/components/Illustrations.tsx` are **original SVG from the author's own
previous prototype** (`../birthday_site`, same project, same author), extended
here with a `growth` prop for staged growth animation (stem / leaves / head
scale + sapling state). No third-party or stock art is bundled.

## If you want to swap in external art later

Safe candidates (verify license at download time, keep local copy, never hotlink):

- FreeSVG.org «Floral line art» (Public Domain, OpenClipart) — https://freesvg.org/floral-line-art
- FreeSVG.org «Rose Line Art» (Public Domain) — https://freesvg.org/rose-line-art
- svgsilh flower / flower-plant tags (CC0) — https://svgsilh.com/tag/plants-1.html
- SVG Repo botanical collection (mixed licenses — check each file's license badge) —
  https://www.svgrepo.com/vectors/botanical
- unDraw Gardening (free, no attribution, no redistribution as pack) —
  https://undraw.co/illustration/gardening_jck1 + https://undraw.co/license

Record any addition below with: file, source URL, author, license, date, modifications.

## Bundled local assets

| file | origin |
|---|---|
| `src/components/Illustrations.tsx` (Twig, Seed, FlowerIllustration ×5, WateringCan, Firefly) | original, author's own previous prototype + `growth` staging added here |
| visual system (`src/index.css`: sky, hills, ground, paper grain, Playfair/DM Sans) | original, author's own previous prototype |

No runtime requests to third-party sites for graphics. Only Google Fonts (display text).
