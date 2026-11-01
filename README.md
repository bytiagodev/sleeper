<p align="center">
  <img src="assets/sleeper-banner.webp" alt="Sleeper, a night train you watch from outside" width="100%" />
</p>

<p align="center"><a href="https://bytiagodev.github.io/sleeper/"><strong>Board the train</strong></a></p>

---

Sleeper is a night train you watch from outside. A steam train pulls out of a country station, crosses a world that is generated as it goes, stops at the next platform and disappears into a tunnel. Every picture and every sound in it is made by code. The scene loads no image or audio files, and there are no frameworks and no build step.

## The route

The line never ends. It runs through city, forest, fields, coast and mountains, two to four landscapes at a time, and when one run is over it carries on into new ones, so a long night never repeats. The weather is clear, rain, snow or fog, and each has its own air, so a far ridge stays sharp on a clear night while a tree 150 metres away is half gone in fog.

Half the landscapes have a station, with a brick building, a clock set to the departure time and a signal that drops to green when it is time to go. The train brakes to stop exactly on its mark, passengers get on and off, and compartments light up or go dark. Each landscape ends at a grassy hill with a stone tunnel mouth, and the next one is built in the dark while the train is inside.

## The timetable

A journey is a single number. The same number always gives the same landscapes, weather, train, stations and passengers, so a journey can be shared as a link: `?journey=4242` is always the same ride. **Share** copies it, **New journey** starts another, and **Sound** turns on the chuffs, the rail joints, the brakes, the doors and the whistle.

## The engine room

Everything is measured in metres. The camera stands 12 metres from the track and 6 metres up, and something twice as far away is drawn half as big and slides past half as fast. No tree, pole or building has a size or speed picked by hand.

Detail is drawn once. A station building has thousands of bricks and a tunnel mouth hundreds of stones, so each is drawn by code into its own image when it is created, and every frame only that image is placed at its distance.

Sound comes from noise and tones. Filtered noise becomes wind, rain, steam or a knock, oscillators make the whistle and the brake squeal, and inside a tunnel everything goes through an echo.

## Running it

Open `index.html` in a browser. The code is plain JavaScript split into one file per part of the scene, under `js/`, loaded in order by the page.

---

<p align="center">
  <sub>Code under the <a href="LICENSE">MIT licence</a> · Built by <a href="https://bytiago.com/en/">Tiago Teixeira</a></sub>
</p>
