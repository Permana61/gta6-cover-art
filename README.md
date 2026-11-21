# Neon Coast Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Permana61/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Permana61/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Neon Coast Cover Studio — an offline web app that turns your own photos and a caption into GTA 6-style cover art: the multi-panel poster look with bold caption lettering and a Vice City sunset or neon colour grade, exported as a PNG to share. Built by hand for make.fun's "Make GTA 6 Cover Art" bounty ($250 in USDC). Load photos from your machine (they are read locally, never uploaded), fill several panels with one photo or several, crop and position each panel, and export in the common post sizes 1080 × 1080, 1080 × 1350 and 1920 × 1080 — all three in one click. The lettering uses Anton and Pacifico, both SIL Open Font License fonts shipped under `app/fonts/` — no Rockstar logo, artwork or font anywhere.

## What it does

- **Any photo** — add photos from your machine or use the two built-in samples; every panel takes its own photo, or fill all panels with one.
- **Face-aware smart crop** — a saliency map (skin tone + contrast) picks the crop window that keeps the face and the action in frame, per panel and aspect, cached per photo; drag to move it, scroll to zoom, and it remembers your manual crop.
- **Pop-out hero** — the hero panel breaks its frame, drawn oversized over its neighbours with a white keyline and a drop shadow.
- **Striped retro-chrome 3D titles** — the caption is drawn in layered extrusion with a chrome gradient fill and diagonal stripes clipped to the letterforms, plus a Pacifico script tagline above it.
- **Role / cast tags** — each panel gets a crew role chip (The Driver, The Hacker, The Lookout, The Muscle, The Queen, The Wheelman, The Fixer, The Inside Man, The Rookie), editable per panel.
- **8 colour grades** — Sunset, Neon, Gold Hour, Mono Noir, Twilight, Vice Pink, Teal Heat, Mono.
- **Poster Ink** — a painted look: posterize plus edge-darkening, cached per photo, toggleable.
- **8 layouts** — Hero + 3, Grid of 4, Grid of 9, Full Bleed, Tilted Snaps, 7-Panel Cast mosaic, Duo, Triptych.
- **Poster furniture** — billing block, circular seal, quote bar, tagline, five-star heat meter, badge ribbon.
- **Export** — all three sizes in one click as PNG (1080×1080, 1080×1350, 1920×1080), or a single size.
- **Editor** — live preview, 60-step undo/redo (Ctrl+Z / Ctrl+Shift+Z), drag and wheel crop, fill-all, shuffle, grain, vignette and halftone finish.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. No build step, no network request: `app/` is plain static files, and every script, image and font it loads is a file under `app/`.

To hand the entry in, from the repository root:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` there with the vendored make.fun library. The run is deterministic: two runs produce byte-identical output.

## Files

- `app/index.html`, `app/style.css` — the editor shell.
- `app/src/cover.js` — the cover renderer: grades, layouts, smart crop, Poster Ink, chrome titles, poster furniture.
- `app/src/main.js` — editor state, controls, drag/wheel crop, undo/redo, export.
- `app/src/shots.js` — screenshot scenes (`?shot=cover` / `?shot=editor`).
- `app/fonts/` — Anton and Pacifico (SIL Open Font License, texts beside them).
- `app/samples/` — the kit's two sample photos, free to use.
- `screenshots/` — four screenshots taken by the app itself in a browser.
