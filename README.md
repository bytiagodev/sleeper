# Sleeper

A night train you watch from outside.

A train crosses the frame while a generated world scrolls past behind it: city lights, pine forest, open fields, a moonlit coast, mountains. Everything on screen is drawn by code. There are no image files in this repository, no frameworks and no build step. The world is silhouettes, gradients and glow, which is what night looks like.

> Work in progress. The landscapes and the seeded journey generator are done. The train, weather and tunnels are next. See the roadmap below.

## Run it

Open `index.html` in a browser. Nothing to install.

To switch landscape while developing, change `activeBiome` near the bottom of `main.js` to one of `"city"`, `"forest"`, `"fields"`, `"coast"` or `"mountains"`.

## What is in it

**Five landscapes**, each built from layers that scroll at different speeds, so the near ones rush past and the far ones barely move:

- **City:** skylines grown by a random walk, with lit and dim windows and the odd antenna.
- **Forest:** three rows of trees, pale and slow at the back, dark and fast at the front.
- **Fields:** a wavy horizon, a ground plane with furrows that converge toward the distance, a farm with barn and silo, lone trees and a fence.
- **Coast:** a sea that mirrors the sky at the horizon, a broken moon reflection that shimmers, drifting waves, and a headland with a lighthouse and a sweeping beam.
- **Mountains:** layered ranges with sharp peaks, a rim of moonlight on the slopes, rolling foothills and a few distant lights.

**Seeded journeys.** A journey is a number. The same number always produces the same biome sequence, weather, time and train, which is what will make journeys shareable by link.

## How it works

- **One canvas, one file of scene code.** `main.js` draws everything: sky, moon, ground and the active landscape.
- **Delta-time loop.** Movement is multiplied by the time since the last frame, so the scene runs at the same speed on a 60 Hz and a 144 Hz screen.
- **Layer system.** A layer is an object with a scroll speed, a wrap width and a `draw` function. Each landscape is a function that returns a list of layers.
- **Seamless wrapping.** Every layer repeats exactly at its wrap width: whole sine cycles, whole fence posts, noise that wraps around. Positions are rounded to whole pixels so no seam shows.
- **Generate once, draw every frame.** All random choices are made when a landscape is created and stored. Drawing never rolls dice, so nothing flickers and a seed can always be reproduced. Only the clock is used while drawing, for shimmer and the lighthouse beam.
- **Seeded random numbers.** A small generator (mulberry32) replaces `Math.random`, because `Math.random` cannot be restarted from a known point.

## Roadmap

- [x] Canvas, resize handling and delta-time loop
- [x] Sky, moon and parallax layers
- [x] Seeded randomness and journey generator
- [x] Five landscapes
- [ ] The train
- [ ] Weather: rain and snow
- [ ] Tunnels between landscapes and the journey timeline
- [ ] The "new journey" button, reduced-motion fallback and deployment

Later, if it gets that far: stations, fog, synthesised rain and rail sound, and journeys shared by link.

## Palette

Dusk sky `#2b2d55` to `#151a38`, far silhouettes `#0c0e1c`, near silhouettes `#05060d`, lit windows `#ffc76e`, moon `#f2ead8`. Far layers sit close to the sky tone and nearer ones get darker, so depth reads as atmosphere.

## License

MIT. See `LICENSE`.
