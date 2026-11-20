# Neon Bay Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/piningit23/sawit-cover-art-v3-r6/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/piningit23/sawit-cover-art-v3-r6/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Neon Bay Cover Studio turns your photos into GTA-style cover art in seconds.
Open the app and a finished cover is already on screen — the two sample
photos load themselves on first paint, so there is no empty state to fill in.
Pick one of four One-tap Looks and the whole cover changes at once (layout,
colour grade, lettering, title and subtitle), or tune it yourself in three
short steps: add photos, choose a look, export a PNG. Everything runs
offline in your browser: no uploads, no network requests, no account.

Referral code: `nbhxq616`

## How to run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. No build step, no
dependencies — the app is plain files under `app/`, served as-is.

## What it does

- **Cover first.** The two sample photos (a boulevard shot and a pier shot)
  load automatically, so first paint is a finished cover, not a blank editor.
- **3 layouts:** Hero (one big panel + two small), Duo (split screen) and
  Poster (full-bleed photo + title band). No mosaic, no grid — and no photo
  ever repeats inside one cover.
- **4 saturated grades:** Vice Sunset, Neon Night, Palm Gold and Vice Noir.
  Strong colour and high contrast, the way Vice City is supposed to look —
  never washed out.
- **4 One-tap Looks:** Sunset Heist, Boulevard Queen, Neon Nights and Vice
  Noir. One click swaps layout, grade, lettering, title and subtitle together.
- **Lettering:** solid glow (default) or outlined neon, with an editable
  title and subtitle. Default cover: "VICE CITY" — "Neon Nights · Est. 2026".
- **Per-panel crop:** pick the photo, zoom and position for every panel the
  active layout shows (at most three panel cards).
- **Skyline + palms:** drawn behind the panels, never over your photos.
  On by default, toggleable. The title band owns the bottom 24% of the cover.
- **Grain + vignette:** on by default, toggleable, for the printed-poster feel.
- **Export PNG** in the three common post sizes: 1080x1080, 1080x1350 and
  1920x1080, with a preview size selector to match.

The editor is dark, in three numbered steps (1 Photos, 2 Look, 3 Export),
with dropdowns instead of walls of buttons.

## Files

- `app/index.html` — the editor page
- `app/style.css` — dark editor theme
- `app/src/cover.js` — the cover renderer (layouts, grades, skyline, lettering)
- `app/src/main.js` — editor wiring, auto-load, Looks, export
- `app/samples/` — the two sample photos
- `main.ts` — hands the app in (copies `app/` + `screenshots/`, writes `dossier.json`)
- `serve.ts` — minimal static server (`node serve.ts`)
- `shots.json` — the four screenshots and what each shows
