# Sleeper

A night train you watch from outside.

A steam train crosses the frame while a generated world scrolls past behind it: city lights, pine forest, open fields, a moonlit coast, mountains. Everything on screen is drawn by code. There are no image files in this repository, no frameworks and no build step. The world is silhouettes, gradients and glow, which is what night looks like.

> Work in progress. The landscapes, the train, the weather and the seeded journey generator are done. Tunnels and the journey timeline are next. See the roadmap below.

## Run it

Open `index.html` in a browser. Nothing to install.

While developing:

- To switch landscape, change `activeBiome` near the bottom of `main.js` to one of `"city"`, `"forest"`, `"fields"`, `"coast"` or `"mountains"`.
- To switch weather, change `activeWeather` near the top of `main.js` from `journey.weather` to `"clear"`, `"rain"` or `"snow"`.

## What is in it

**Five landscapes**, each built from layers that scroll at different speeds, so the near ones rush past and the far ones barely move:

- **City:** skylines grown by a random walk, with lit and dim windows and the odd antenna.
- **Forest:** three rows of trees, pale and slow at the back, dark and fast at the front.
- **Fields:** a wavy horizon, a ground plane with furrows that converge toward the distance, a farm with barn and silo, lone trees and a fence.
- **Coast:** a sea that mirrors the sky at the horizon, a broken moon reflection that shimmers, drifting waves, and a headland with a lighthouse and a sweeping beam.
- **Mountains:** layered ranges with sharp peaks, a rim of moonlight on the slopes, rolling foothills and a few distant lights.

**The train.** An old steam locomotive with a tender and one to three carriages. The wheels turn with the distance travelled, the coupling rod rides on pins that circle the hubs, the headlamp throws a beam ahead, and a red lamp marks the tail. Carriage windows glow warm or dim, with passengers in some of them. The whole train bobs slightly and its speed drifts gently, so it never feels mechanical.

**Weather.** Clear, rain or snow, chosen by the journey:

- **Rain:** angled streaks, a darker world, a wider glow around the windows and drops sliding down the carriage glass.
- **Snow:** drifting, swaying flakes, a brighter edge where snow lies on the ground, and snow caps on the mountain peaks.

**Seeded journeys.** A journey is a number. The same number always produces the same biome sequence, weather, time and train, which is what will make journeys shareable by link.

## How it works

- **One canvas, one file of scene code.** `main.js` draws everything: sky, moon, ground, the active landscape, the weather and the train.
- **Delta-time loop.** Movement is multiplied by the time since the last frame, so the scene runs at the same speed on a 60 Hz and a 144 Hz screen.
- **Layer system.** A layer is an object with a scroll speed, a wrap width and a `draw` function. Each landscape is a function that returns a list of layers.
- **Seamless wrapping.** Every layer repeats exactly at its wrap width: whole sine cycles, whole fence posts, noise that wraps around. Positions are rounded to whole pixels so no seam shows.
- **Generate once, draw every frame.** All scenery choices are made when a landscape is created and stored. Drawing the scenery never rolls dice, so nothing flickers and a seed can always be reproduced. Only the clock is used while drawing, for shimmer, the lighthouse beam, the train's bob and the rain drips.
- **Seeded random numbers.** A small generator (mulberry32) replaces `Math.random`, because `Math.random` cannot be restarted from a known point. Weather particles get their own seeded generator, so respawning raindrops never disturbs the scenery's sequence.
- **Particle pool.** Every raindrop and snowflake is created once. When one lands it is moved back above the screen and reused, so no memory is allocated while the scene runs and frame times stay even.
- **Weather depth.** Particles sit in three depth bands, like the layers. They drift sideways at the speed of the world at their depth, because the camera rides with the train, and that drift is what slants the rain. Only the nearest band is drawn in front of the train.
- **Batched drawing.** Each weather band is one path and one draw call, which keeps hundreds of particles at 60 fps.
- **Glow.** Windows and lamps glow through canvas shadow blur in a warm colour, not through images.

## Roadmap

- [x] Canvas, resize handling and delta-time loop
- [x] Sky, moon and parallax layers
- [x] Seeded randomness and journey generator
- [x] Five landscapes
- [x] The train
- [x] Weather: rain and snow
- [ ] Tunnels between landscapes and the journey timeline
- [ ] The "new journey" button, reduced-motion fallback and deployment

Later, if it gets that far: stations, fog, synthesised rain and rail sound, and journeys shared by link.

## Palette

Dusk sky `#2b2d55` to `#151a38`, far silhouettes `#0c0e1c`, near silhouettes `#05060d`, lit windows `#ffc76e`, moon `#f2ead8`, rain `#9fb0d8`, snow `#e8ecf4`. Far layers sit close to the sky tone and nearer ones get darker, so depth reads as atmosphere.

## License

MIT. See `LICENSE`.
