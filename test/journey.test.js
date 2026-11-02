// A journey is a single number, and a shared link is only that number. If
// the same number ever gave a different journey, every link already shared
// would show a different ride. These tests hold that promise.
//
// Run them with: node --test

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

// The page loads plain scripts that share one global scope, not modules,
// so the tests load them the same way.
function loadScripts(...files) {
  const context = vm.createContext({});
  for (const file of files) {
    const code = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
    vm.runInContext(code, context, { filename: file });
  }
  return context;
}

const { generateJourney, generateLeg, createJourneyLabel } = loadScripts("js/random.js", "js/journey.js");

// Objects made inside the scripts belong to another realm, which strict
// comparison counts as a difference. Copying them through JSON leaves only
// their values.
function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function rounded(numbers) {
  return plain(numbers).map((number) => Math.round(number * 1000) / 1000);
}

function firstLegs(journey, count) {
  const legs = [generateLeg(journey, 0, null)];
  while (legs.length < count) {
    const previous = legs[legs.length - 1];
    legs.push(generateLeg(journey, previous.number + 1, previous.biomes[previous.biomes.length - 1]));
  }
  return legs;
}

test("the same number always gives the same journey", () => {
  for (let seed = 0; seed < 500; seed++) {
    assert.deepEqual(plain(generateJourney(seed)), plain(generateJourney(seed)));
  }
});

test("the same journey always unrolls the same legs", () => {
  const journey = generateJourney(4242);
  assert.deepEqual(plain(firstLegs(journey, 10)), plain(firstLegs(journey, 10)));
});

// Fixed by hand from what journey 4242 gives today. If this fails, a change
// has altered every journey, and every link already shared with it.
test("journey 4242 is still the ride it always was", () => {
  const journey = generateJourney(4242);
  assert.deepEqual(plain(journey.biomes), ["mountains", "fields", "coast"]);
  assert.equal(journey.weather, "snow");
  assert.equal(journey.hour, 22);
  assert.equal(journey.minute, 54);
  assert.deepEqual(plain(journey.train), { carriages: 2, livery: 2 });
  assert.deepEqual(plain(journey.stations), [true, false, false]);
  assert.deepEqual(rounded(journey.biomeSeconds), [53.099, 78.276, 66.516]);
  assert.equal(createJourneyLabel(journey), "the 22:54 through the high passes, in falling snow");

  const [, second, third] = firstLegs(journey, 3);
  assert.deepEqual(plain(second.biomes), ["city", "coast"]);
  assert.deepEqual(plain(third.biomes), ["fields", "forest", "coast"]);
});

test("different numbers give different journeys", () => {
  const seen = new Set();
  for (let seed = 0; seed < 500; seed++) seen.add(JSON.stringify(generateJourney(seed)));
  assert.equal(seen.size, 500);
});

test("no landscape follows itself, even where one leg joins the next", () => {
  for (let seed = 0; seed < 200; seed++) {
    const biomes = firstLegs(generateJourney(seed), 8).flatMap((leg) => leg.biomes);
    for (let i = 1; i < biomes.length; i++) {
      assert.notEqual(biomes[i], biomes[i - 1], `journey ${seed}, landscape ${i}`);
    }
  }
});
