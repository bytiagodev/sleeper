// Everything in the scene is placed in metres and drawn through one camera.
// These tests hold the rule the whole picture rests on: something twice as
// far away is drawn half as big and slides past half as fast.
//
// Run them with: node --test

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

// camera.js asks the page for its canvas when it loads, so the tests hand it
// a stand-in page of 1280 by 800 pixels.
const context = vm.createContext({
  window: { innerWidth: 1280, innerHeight: 800 },
  document: { getElementById: () => ({ getContext: () => ({}) }) },
});
for (const file of ["js/random.js", "js/camera.js"]) {
  const code = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
  vm.runInContext(code, context, { filename: file });
}
const { updateCamera, scaleAt, groundYAt, zAtGroundY, screenXAt, worldXAt, projectPoint } = context;
updateCamera();

function close(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} is not ${expected}`);
}

test("twice as far away is drawn half as big", () => {
  close(scaleAt(24), scaleAt(12) / 2);
  close(scaleAt(120), scaleAt(12) / 10);
});

test("twice as far away slides past half as fast", () => {
  const nearStep = screenXAt(10, 12) - screenXAt(0, 12);
  const farStep = screenXAt(10, 24) - screenXAt(0, 24);
  close(farStep, nearStep / 2);
});

test("the ground rises towards the horizon and never crosses it", () => {
  const horizon = groundYAt(1e9);
  let previous = groundYAt(5);
  for (const z of [10, 20, 50, 100, 500]) {
    const y = groundYAt(z);
    assert.ok(y < previous, `ground at ${z} m is not above ground at the distance before`);
    assert.ok(y > horizon);
    previous = y;
  }
});

test("a place on screen leads back to the same place in the world", () => {
  for (const z of [8, 12, 40, 150]) {
    close(zAtGroundY(groundYAt(z)), z);
    close(worldXAt(screenXAt(37.5, z), z), 37.5);
  }
});

test("a point above the ground is drawn above its foot, by its height at that distance", () => {
  const foot = projectPoint(5, 30, 0);
  const top = projectPoint(5, 30, 4);
  close(top.x, foot.x);
  close(foot.y - top.y, 4 * scaleAt(30));
});
