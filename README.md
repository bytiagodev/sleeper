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
- To force a weather, change `activeWeather = journey.weather` inside `startJourney` in `js/timeline.js` to `"clear"`, `"rain"`, `"snow"` or `"fog"`.
- To reach the tunnels faster, shorten the biome time in `generateJourney` in `js/journey.js` (`50 + random() * 30` seconds).
- To move the camera, change `height` and `trackZ` in `js/camera.js`. Every size and speed in the scene follows from those two numbers.

## What is in it

**Five landscapes**, each built from layers at real distances, so the near ones rush past and the far ones barely move:

- **City:** two rows of towers with lit and dim windows, warehouses and yard walls closer in, and a street of lamps alongside the line, each throwing a pool of light on the road.
- **Forest:** three rows of spruces, pale and slow at the back, dark and fast at the front, with bushes just behind the track.
- **Fields:** low hills, furrows that converge toward the horizon, farms with a barn and silo, hedgerows with gaps for gates, lone trees and a fence.
- **Coast:** a sea with a shimmering moon reflection and waves at every distance, surf breaking along the shore, rocks on the beach, and headlands with a lighthouse and a sweeping beam.
- **Mountains:** layered ranges with sharp peaks and a rim of moonlight, foothills with farm lights, pine forest on the lower slopes and a few pines by the line.

**The train.** A steam locomotive, its tender and one to three sleeping cars in maroon, green or blue, all drawn to scale in metres. The driving wheels carry counterweights and a coupling rod, and a connecting rod drives a crosshead that slides back and forth as the wheels turn. The fire glows through the cab, two lamps light the way ahead, and smoke leaves the chimney four times per turn of the wheels and trails back over the train. Some compartments are lit, some dim and some already dark; light from the windows falls on the ground in front of the train. Each vehicle rocks a little on its own springs.

**Weather.** Clear, rain, snow or fog, chosen by the journey. Each weather has its own air: on a clear night the far mountains are still sharp, while in fog a tree 150 m away is already half gone.

- **Rain:** angled streaks, a darker world, a wider glow around the windows and drops sliding down the carriage glass.
- **Snow:** drifting, swaying flakes, settled snow on the ground, and snow caps on the mountain peaks.
- **Fog:** banks of fog lying at every distance, even between the train and the camera, drifting slowly. Stars disappear, the moon blurs, and every lamp glows twice as wide.

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
| `js/train.js` | The train as a whole: its vehicles, where it sits on screen, wheels, light on the ground |
| `js/carriages.js` | Sleeping cars, their windows and passengers |
| `js/locomotive.js` | The locomotive, its rods and lamps, and the tender |
| `js/smoke.js` | Smoke from the chimney |
| `js/atmosphere.js` | Haze with distance, the air for each weather, and fog banks |
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
- **Haze with distance.** Every colour in the landscape is faded towards the colour of the air by how far away it is, using `hazed(colour, distance)`. How quickly things fade depends on the weather. Windows and lamps fade more slowly, because they give off their own light.
- **Batched drawing.** Each row of trees, each set of sleepers and each weather band is one path and one draw call.
- **The train in metres.** Before the train is drawn, the canvas is moved to its left end at rail height and scaled so one unit is one metre, so the train is measured the same way as the world around it.
- **Smoke follows the wheels.** A puff leaves the chimney every quarter turn of the driving wheels. Once out, the smoke stays where it is while the train moves on, so it trails back along the train as it rises and spreads.
- **Journey timeline.** A small state object tracks whether the train is in the open or in a tunnel. The new landscape is built halfway through the tunnel, while the screen is dark, so the swap is never seen.
- **Journey names.** Each journey's name is built from its departure time, its landscapes and its weather. The name has its own seeded random stream, so naming a journey never changes the journey.
- **Fits any screen.** The camera is sized to the window, so a resize only needs a new camera. On a narrow screen the locomotive stays in view while the tail runs off the edge.

## Roadmap

The first version is in the git history (canvas, layers, seeded journeys, five landscapes, the train, weather, tunnel fades, names). The rebuild:

- [x] **Rebuild 1.** Split the single script into files, and a camera in metres: correct scale and speed for everything, a real track with sleepers and two rails, telegraph poles, grass in front of the line
- [x] **Rebuild 2.** Textures and light: noise textures made once at startup, glows, moonlit edges, stars, a textured moon, clouds, a textured ground
- [x] **Rebuild 3.** The train rebuilt: real proportions, spoked wheels with rods that move like real ones, liveries, firebox glow, window light on the ground, smoke
- [x] **Rebuild 4.** The five landscapes rebuilt on the new system, with fog as a fourth weather and haze with distance
- [ ] **Rebuild 5.** Braking and stations, and real tunnels with portals the train disappears into
- [ ] **Rebuild 6.** Sound made in the browser: puffs timed to the wheels, rail joints, brakes, the whistle, echo in tunnels, rain and wind
- [ ] **Rebuild 7.** Performance, mobile, journeys shared by link, a new preview image

## Palette

Dusk sky `#2b2d55` to `#151a38`, far silhouettes `#0c0e1c`, near silhouettes `#05060d`, lit windows `#ffc76e`, moon `#f2ead8`, rain `#9fb0d8`, snow `#e8ecf4`. Far layers sit close to the sky tone and nearer ones get darker, so depth reads as atmosphere.

## License

MIT. See `LICENSE`.
