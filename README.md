# Sleeper

*A window seat to nowhere.*

> **Work in progress.** Sleeper is being built in the open, one phase at a time. What's in this repo today is the foundation, not the finished scene. Expect missing pieces, placeholder layers, and things that change from one commit to the next.

A night train you watch from outside. A generative, ambient scene: a train crosses the frame while a procedurally generated world scrolls past behind it at parallax speeds. Every journey is different. The biomes, the weather and the train itself are all picked from a seed, and tunnels carry the train from one biome into the next.

Everything on screen is drawn by code. There are no image assets in this repo, and there won't be.

## Where it stands

The build is split into phases, each one landing as its own commit.

| Phase | What it covers | Status |
| --- | --- | --- |
| 1 | Full-viewport canvas, delta-time animation loop | Done |
| 2 | Sky, moon, parallax layer system with seamless wrapping | Done |
| 3 | Seeded randomness and the journey config generator | Done |
| 4 | Biome generators: city, forest, fields | **In progress** (city done, forest underway) |
| 5 | The train | Next |
| 6 | Weather: rain and snow | Planned |
| 7 | Tunnels and the full journey flow | Planned |
| 8 | UI, reduced-motion fallback, deploy | Planned |

If you open it right now you'll get a dusk sky, a moon, and a procedurally generated city skyline with lit windows scrolling past. There is no train yet. I'm aware the train is the whole point.

**Live demo:** not yet. It goes up with phase 8.

## Running it locally

No build step, no dependencies. Clone the repo and open `index.html` in a browser, or serve the folder with any static server:

```bash
npx serve .
# or
python -m http.server
```

## How it's built

- One HTML5 `<canvas>`, vanilla JavaScript, CSS for the page chrome only. No frameworks.
- A `requestAnimationFrame` loop driven by delta time, so the scene moves at the same speed on any refresh rate.
- A seeded PRNG (mulberry32): the seed *is* the journey, so the same seed always rebuilds the same ride.
- A parallax layer system where each layer has its own scroll speed and wraps seamlessly.
- Biomes generated once per journey and stored as geometry, then drawn from that data every frame. The city skyline is a random walk of building heights, with windows and rooftop details rolled per building.

## Later, maybe

Once the core scene ships: coast and mountain biomes, small lit stations the train stops at, fog, synthesised ambient sound, and shareable seeds in the URL.
