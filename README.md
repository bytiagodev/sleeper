# Sleeper

A night train you watch from outside.

**[Take a ride](https://bytiagodev.github.io/sleeper/)**

A steam train crosses the frame while a generated world scrolls past behind it: city lights, pine forest, open fields, a moonlit coast, mountains. Everything on screen is drawn by code. The scene uses no image files, no frameworks and no build step. The one image in the repository, `og.png`, is the preview shown when the link is shared, and it is a screenshot of the scene itself.

> Sleeper is being rebuilt. `concept/sleeper-concept.png` is the target: textured ground, a real track, a detailed locomotive with steam, stations, tunnel portals, fog and sound. See the roadmap below.

## Run it

Open `index.html` in a browser, or visit the link above. Nothing to install.

Press **New journey** for a different ride. Each journey has its own name in the corner, like *the 23:21 from the deep wood to the long valleys, in steady rain*.

If your system asks for reduced motion, Sleeper shows a single still frame of the journey instead of the moving scene. **New journey** then shows a new still.

While developing, in `main.js`:

- To replay one journey, change `startJourney(randomSeed())` at the bottom of `main.js` to a fixed number, such as `startJourney(2)`.
- To force a weather, change `activeWeather = journey.weather` inside `startJourney` in `js/timeline.js` to `"clear"`, `"rain"` or `"snow"`.
- To reach the tunnels faster, shorten the biome time in `generateJourney` in `js/journey.js` (`50 + random() * 30` seconds).
- To move the camera, change `height` and `trackZ` in `js/camera.js`. Every size and speed in the scene follows from those two numbers.

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

**Tunnels.** A journey passes through two to four landscapes, each lasting about a minute, and loops when it reaches the end. Between landscapes the train enters a tunnel: the world fades to near black, only the train's windows and lamps stay lit, and the next landscape opens up as it leaves. **New journey** fades the whole frame to black and starts a different ride in the dark.

**Seeded journeys.** A journey is a number. The same number always produces the same biome sequence, landscapes, weather, time and train, which is what will make journeys shareable by link.

## How it works

- **Plain scripts, no build.** `index.html` loads the files in `js/` in order, then `main.js`. They are plain scripts rather than modules, so the page still runs when opened straight from disk. Later files use what earlier files define.

| File | What it does |
| --- | --- |
| `js/random.js` | Seeded random numbers, a hash and one-dimensional noise |
| `js/camera.js` | Turns metres into pixels. The only place that does |
| `js/journey.js` | Rolls a journey from its number, and names it |
| `js/textures.js` | Painting textures once, glows, the textured ground, the moonlit-edge trick, vignette and grain |
| `js/sky.js` | Sky, stars, moon, clouds and the ground plane |
| `js/track.js` | Ballast, sleepers, rails, telegraph poles and the grass in front |
| `js/biomes/*.js` | The five landscapes, and `builders.js`, which assembles them |
| `js/train.js` | The train |
| `js/weather.js` | Rain and snow |
| `js/timeline.js` | Biomes, tunnels and starting a journey |
| `main.js` | Speed, the frame loop and the order things are drawn in |

- **Everything is measured in metres.** The camera stands 12 metres from the track and 6 metres up. Something `z` metres away is drawn `focal / z` pixels per metre and slides past at the same rate, so size and speed always agree. A fence post is 1.3 m, a telegraph pole 8 m, a pine 15 to 27 m, and they all look right next to the train because none of them is sized by hand. The ground follows the same rule: flat ground `z` metres away sits `height × focal / z` pixels below the horizon, which is why the sleepers narrow towards the far rail and the furrows all point at one spot on the horizon.
- **One distance, one source.** The train's wheels, the sleepers and every layer move by the same metres travelled. The wheels can no longer slide over the ground, and nothing has a hand-tuned scroll speed.
- **Speed with momentum.** The train eases towards a target speed instead of jumping to it. The target drifts gently around cruising speed for now. Stations will lower it to zero.
- **Scenery from the slot number, not a list.** The world is cut into slots along the line, and the slot's number is the seed for what stands there: the tree in slot 812 is always the same tree. Any stretch of the line can be drawn without generating what came before it, so the scenery never repeats and needs no wrapping. Ridges and skylines use smooth noise along the line, measured in metres, so a mountain keeps its shape as it drifts by.
- **Seeded random numbers.** `Math.random` can't be replayed, so the scene uses `hash` instead: it takes the sine of a large number and keeps the decimals, which gives a random-looking value between 0 and 1 that is always the same for the same inputs. `seededRandom(seed)` wraps it into a sequence that can be replayed from the start.
- **Particle pool.** Every raindrop and snowflake is created once. When one lands it is moved back above the screen and reused, so no memory is allocated while the scene runs.
- **Textures are painted once.** Sky, moon, clouds, the ground texture, glows and the grain are painted pixel by pixel when the page loads or the window changes size, then reused every frame. The sky and stars are a single image; only a few bright stars are drawn live so they can twinkle.
- **Textured ground in perspective.** The ground is drawn in thin strips. Each strip is a slice of one repeating texture, stretched to the scale of its distance and shifted by how far the train has gone, so near ground rushes past and far ground creeps.
- **Glows add light.** Every lamp and lit window stamps a soft glow painted once per colour, drawn with the "lighter" blend so the glow brightens what is under it.
- **Moonlit edges.** Trees, buildings and poles are filled once in moonlight, shifted a pixel up and to the right, then again in their own colour, which leaves a thin lit edge on the moon's side.
- **Batched drawing.** Each row of trees, each set of sleepers and each weather band is one path and one draw call.
- **Journey timeline.** A small state object tracks whether the train is in the open or in a tunnel. The new landscape is built halfway through the tunnel, while the screen is dark, so the swap is never seen.
- **Journey names.** Each journey's name is built from its departure time, its landscapes and its weather. The name has its own seeded random stream, so naming a journey never changes the journey.
- **Fits any screen.** The camera is sized to the window, so a resize only needs a new camera. On a narrow screen the locomotive stays in view while the tail runs off the edge.

## Roadmap

The first version is in the git history (canvas, layers, seeded journeys, five landscapes, the train, weather, tunnel fades, names). The rebuild:

- [x] **Phase 0.** Split the single script into files
- [x] **Phase 1.** A camera in metres: correct scale and speed for everything, a real track with sleepers and two rails, telegraph poles, grass in front of the line
- [x] **Phase 2.** Textures and light: noise textures made once at startup, a glow pass, moonlight from one side, stars, a textured moon with a halo, clouds
- [ ] **Phase 3.** The train rebuilt: real proportions, spoked wheels with rods that move like real ones, liveries, firebox glow, window light on the ground, steam and smoke
- [ ] **Phase 4.** The five landscapes rebuilt on the new system, with fog as a fourth weather and haze with distance
- [ ] **Phase 5.** Braking and stations, and real tunnels with portals the train disappears into
- [ ] **Phase 6.** Sound made in the browser: puffs timed to the wheels, rail joints, brakes, the whistle, echo in tunnels, rain and wind
- [ ] **Phase 7.** Performance, mobile, journeys shared by link, a new preview image

## Palette

Dusk sky `#2b2d55` to `#151a38`, far silhouettes `#0c0e1c`, near silhouettes `#05060d`, lit windows `#ffc76e`, moon `#f2ead8`, rain `#9fb0d8`, snow `#e8ecf4`. Far layers sit close to the sky tone and nearer ones get darker, so depth reads as atmosphere.

## License

MIT. See `LICENSE`.
