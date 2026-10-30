const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d");

// Everything in the world is measured in metres. This file is the only place
// that turns metres into pixels.
//
// The rule is the one every camera follows: something twice as far away
// looks half as big, and also slides past half as fast. So nothing in the
// scene needs a hand-picked size or scroll speed, only a distance.

const gauge = 1.435; // metres between the rails
const railHeight = 0.16;

const camera = {
  height: 6, // metres above the ground
  trackZ: 12, // metres from the camera to the middle of the track
  focal: 0,
  pxPerMetre: 0, // at the track
  horizonY: 0,
  railY: 0, // top of the near rail, where the wheels sit
};

// How far the train has gone, in metres. The camera moves with it.
let travelled = 0;

function updateCamera() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.pxPerMetre = Math.min(height * 0.034, width * 0.07);
  camera.focal = camera.pxPerMetre * camera.trackZ;

  // Put the near rail at 80% of the screen height and work out where the
  // horizon has to be for that.
  const nearRailZ = camera.trackZ - gauge / 2;
  const groundBelowHorizon = (camera.height * camera.focal) / nearRailZ;
  camera.horizonY = Math.round(height * 0.8 - groundBelowHorizon);
  camera.railY = groundYAt(nearRailZ) - railHeight * scaleAt(nearRailZ);
}

// Pixels per metre for something z metres away.
function scaleAt(z) {
  return camera.focal / z;
}

// Ground far away sits just below the horizon; ground close by sits near
// the bottom of the screen.
function groundYAt(z) {
  return camera.horizonY + camera.height * scaleAt(z);
}

// The opposite of groundYAt: how far away the ground is at a screen row.
function zAtGroundY(screenY) {
  return (camera.height * camera.focal) / (screenY - camera.horizonY);
}

function screenXAt(worldX, z) {
  return window.innerWidth / 2 + (worldX - travelled) * scaleAt(z);
}

function worldXAt(screenX, z) {
  return travelled + (screenX - window.innerWidth / 2) / scaleAt(z);
}

// The line is divided into slots of a fixed length, numbered from the start
// of the journey. This calls fn for each slot currently on screen at
// distance z. Each slot's contents come from its number, so slot 812 always
// holds the same tree and the scenery never needs to be stored.
function forEachSlot(z, spacing, margin, fn) {
  const first = Math.floor((worldXAt(0, z) - margin) / spacing);
  const last = Math.ceil((worldXAt(window.innerWidth, z) + margin) / spacing);
  for (let index = first; index <= last; index++) {
    fn(index, index * spacing);
  }
}
