# Primordia

A microcosm sandbox. You spawn as a single cell. You consume, mutate, reproduce, transform.
No death — only metamorphosis.

## Run

It is three static files. No build step.

```
open primordia/index.html
```

Or serve the folder:

```
python3 -m http.server 8000
# then open http://localhost:8000/
```

## Controls

- **Mouse** — your cell drifts toward the cursor.
- **Mutation card** — click one to take a path, or **refuse** to drift past.
- **≡** (top right) — leaderboard of other forms.

## Files

```
index.html   layout + canvas + overlays
style.css    microscope aesthetic
game.js      everything else (worldgen, organisms, mutations, audio)
```

State persists in `localStorage` under `primordia.leaderboard`.
