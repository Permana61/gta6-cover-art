# Neon Coast Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Permana61/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Permana61/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Neon Coast Cover Studio — an offline web app that turns your own photos and a caption into GTA 6-style cover art: the multi-panel poster look with bold caption lettering and a Vice City sunset or neon colour grade, exported as a PNG to share. Built by hand for make.fun's "Make GTA 6 Cover Art" bounty ($250 in USDC). Load photos from your machine (they are read locally, never uploaded), fill several panels with one photo or several, crop and position each panel, pick a layout (Hero + 3, Grid 4, Grid 9, Full Bleed, Tilted Snaps) and a grade (Sunset, Neon, Gold Hour, Mono Noir), write the caption, subtitle, badge ribbon and heat meter, and export in the common post sizes 1080 × 1080, 1080 × 1350 and 1920 × 1080. The lettering uses Anton and Pacifico, both SIL Open Font License fonts shipped under `app/fonts/` — no Rockstar logo, artwork or font anywhere.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. No build step, no network request: `app/` is plain static files, and every script, image and font it loads is a file under `app/`.

To hand the entry in, from the repository root:

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

Requires Node.js 22.18+. `main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` there with the vendored make.fun library. The run is deterministic: two runs produce byte-identical output.
