const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d");

// Everything in the world is measured in metres, and this file is the only
// place that turns metres into pixels.
//
// Something twice as far away looks half as big and slides past half as fast.
// So nothing in the scene needs a hand-picked size or scroll speed, only a
// distance.

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

  // The horizon is placed so that the near rail lands at 80% of the screen
  // height.
  const nearRailZ = camera.trackZ - gauge / 2;
  const groundBelowHorizon = (camera.height * camera.focal) / nearRailZ;
  camera.horizonY = Math.round(height * 0.8 - groundBelowHorizon);
  camera.railY = groundYAt(nearRailZ) - railHeight * scaleAt(nearRailZ);
}

// Pixels per metre for something z metres away.
function scaleAt(z) {
  return camera.focal / z;
}

function groundYAt(z) {
  return camera.horizonY + camera.height * scaleAt(z);
}

function zAtGroundY(screenY) {
  return (camera.height * camera.focal) / (screenY - camera.horizonY);
}

function screenXAt(worldX, z) {
  return window.innerWidth / 2 + (worldX - travelled) * scaleAt(z);
}

// worldX along the line, z from the camera, height above the ground, all in
// metres.
function projectPoint(worldX, z, height) {
  return { x: screenXAt(worldX, z), y: groundYAt(z) - height * scaleAt(z) };
}

function worldXAt(screenX, z) {
  return travelled + (screenX - window.innerWidth / 2) / scaleAt(z);
}

// The line is divided into numbered slots of a fixed length. What stands in a
// slot is rolled from its number, so slot 812 always holds the same tree and
// the scenery never needs to be stored. fn is called for each slot on screen
// at distance z.
function forEachSlot(z, spacing, margin, fn) {
  const first = Math.floor((worldXAt(0, z) - margin) / spacing);
  const last = Math.ceil((worldXAt(window.innerWidth, z) + margin) / spacing);
  for (let index = first; index <= last; index++) {
    fn(index, index * spacing);
  }
}

// Fills a flat shape given by its corners, each [along the line, distance,
// height] in metres.
function fillShape(corners) {
  ctx.beginPath();
  corners.forEach(([x, z, height], i) => {
    const point = projectPoint(x, z, height);
    if (i === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.closePath();
  ctx.fill();
}

function drawWorldText(text, x, z, height, sizeMetres, color) {
  const point = projectPoint(x, z, height);
  ctx.font = `600 ${sizeMetres * scaleAt(z)}px Georgia, serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(text, point.x, point.y);
  ctx.textBaseline = "alphabetic";
}
