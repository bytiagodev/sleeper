// Returns a number between 0 and 1 that looks random but is always the same
// for the same inputs. The sine of a large number jumps around
// unpredictably, so keeping only its decimals gives a random-looking value.
// The multipliers are arbitrary; they just keep nearby inputs from giving
// nearby results.
function hash(a, b = 0, c = 0) {
  const value = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453;
  return value - Math.floor(value);
}

// Math.random can't be replayed. This can: the same seed always gives the
// same sequence, which is what makes a journey reproducible.
function seededRandom(seed, index = 0) {
  let count = 0;
  return function () {
    count++;
    return hash(seed, index, count);
  };
}

function pick(random, items) {
  return items[Math.floor(random() * items.length)];
}

function randomSeed() {
  return Math.floor(Math.random() * 1000000);
}

// Turns a straight 0 to 1 progress into one that starts and ends gently.
function easeInOut(progress) {
  return (1 - Math.cos(progress * Math.PI)) / 2;
}

function mix(from, to, amount) {
  return from + (to - from) * amount;
}

// A random height at every whole number, with a smooth blend in between.
function smoothNoise(x, seed) {
  const left = Math.floor(x);
  return mix(hash(left, seed), hash(left + 1, seed), easeInOut(x - left));
}

// Big slow hills with smaller and smaller bumps on top, like a real ridge.
// Returns a value between 0 and 1.
function layeredNoise(x, seed, layers = 4) {
  let total = 0;
  let maxTotal = 0;
  let strength = 1;
  for (let layer = 0; layer < layers; layer++) {
    total += smoothNoise(x, seed + layer) * strength;
    maxTotal += strength;
    x *= 2;
    strength /= 2;
  }
  return total / maxTotal;
}

// The same idea on a grid, for textures. If wrap is set, the grid repeats
// every `wrap` cells, so the texture's edges match and it tiles cleanly.
function smoothNoise2D(x, y, seed, wrap = 0) {
  let left = Math.floor(x);
  let top = Math.floor(y);
  const across = easeInOut(x - left);
  const down = easeInOut(y - top);
  let right = left + 1;
  let bottom = top + 1;
  if (wrap > 0) {
    left %= wrap;
    right %= wrap;
    top %= wrap;
    bottom %= wrap;
  }
  const topEdge = mix(hash(left, top, seed), hash(right, top, seed), across);
  const bottomEdge = mix(hash(left, bottom, seed), hash(right, bottom, seed), across);
  return mix(topEdge, bottomEdge, down);
}

function layeredNoise2D(x, y, seed, layers = 4, wrap = 0) {
  let total = 0;
  let maxTotal = 0;
  let strength = 1;
  for (let layer = 0; layer < layers; layer++) {
    total += smoothNoise2D(x, y, seed + layer, wrap) * strength;
    maxTotal += strength;
    x *= 2;
    y *= 2;
    wrap *= 2;
    strength /= 2;
  }
  return total / maxTotal;
}
