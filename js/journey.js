// A journey is a single number. Everything about it is rolled from that
// number, so the same number always gives the same journey.

function generateJourney(seed) {
  const random = seededRandom(seed);
  const biomes = rollBiomes(random, null);

  const weather = pick(random, ["clear", "rain", "snow", "fog"]);
  const hour = 22 + Math.floor(random() * 3);
  const minute = Math.floor(random() * 60);

  const train = {
    carriages: 1 + Math.floor(random() * 3),
    livery: Math.floor(random() * 3),
  };

  const { stations, biomeSeconds } = rollStops(random, biomes);

  return { seed, biomes, weather, hour, minute, train, stations, biomeSeconds };
}

// The line never ends. Its landscapes come in legs: the first leg is the one
// above, and each later leg is rolled from the journey's number and the leg's
// count. A long night never repeats, yet the same journey always unrolls the
// same way. The train and the weather stay the same all night.
function generateLeg(journey, number, previousBiome) {
  if (number === 0) {
    return { number, biomes: journey.biomes, stations: journey.stations, biomeSeconds: journey.biomeSeconds };
  }
  const random = seededRandom(journey.seed + 400, number);
  const biomes = rollBiomes(random, previousBiome);
  return { number, biomes, ...rollStops(random, biomes) };
}

// Two to four landscapes, never the same one twice in a row, including
// across the join with the leg before.
function rollBiomes(random, previousBiome) {
  const allBiomes = ["city", "forest", "fields", "coast", "mountains"];
  const count = 2 + Math.floor(random() * 3);
  const biomes = [];
  for (let i = 0; i < count; i++) {
    const before = i === 0 ? previousBiome : biomes[i - 1];
    const allowedBiomes = allBiomes.filter((biome) => biome !== before);
    biomes.push(pick(random, allowedBiomes));
  }
  return biomes;
}

function rollStops(random, biomes) {
  const stations = biomes.map(() => random() < 0.5);
  const biomeSeconds = biomes.map(() => 50 + random() * 30);
  return { stations, biomeSeconds };
}

const placeNames = {
  city: ["the lit city", "the sleeping city", "the city of late windows"],
  forest: ["pine country", "the black pines", "the deep wood"],
  fields: ["open country", "the sleeping farms", "the barley fields"],
  coast: ["the salt coast", "the lighthouse coast", "the sea road"],
  mountains: ["the high passes", "the cold ridges", "the long valleys"],
};

// The empty endings let some journeys leave out the weather.
const weatherEndings = {
  clear: ["", "", ", by moonlight", ", under a full moon"],
  rain: [", in the rain", ", in steady rain", ", with rain on the glass"],
  snow: [", in falling snow", ", in the first snow", ", in a slow snowfall"],
  fog: [", in the fog", ", through thick fog", ", with fog on the line"],
};

function createJourneyLabel(journey) {
  const random = seededRandom(journey.seed + 9000);
  const hour = String(journey.hour % 24).padStart(2, "0");
  const minute = String(journey.minute).padStart(2, "0");

  const firstBiome = journey.biomes[0];
  const lastBiome = journey.biomes[journey.biomes.length - 1];
  let otherBiome = lastBiome;
  if (lastBiome === firstBiome) otherBiome = journey.biomes[1];

  const firstPlace = pick(random, placeNames[firstBiome]);
  const otherPlace = pick(random, placeNames[otherBiome]);

  const route = pick(random, [
    `through ${firstPlace}`,
    `through ${firstPlace} and ${otherPlace}`,
    `from ${firstPlace} to ${otherPlace}`,
  ]);
  const ending = pick(random, weatherEndings[journey.weather]);
  return `the ${hour}:${minute} ${route}${ending}`;
}

// Reads the number from a shared link. Only plain digits count: Number("")
// is 0 and Number("1e3") is 1000, and nobody typed either as a journey.
function parseSeed(text) {
  if (text === null || !/^\d{1,9}$/.test(text)) return null;
  return Number(text);
}
