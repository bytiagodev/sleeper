// A journey is a single number. Everything about it is rolled from that
// number, so the same number always gives the same journey.

function generateJourney(seed) {
  const random = seededRandom(seed);
  const allBiomes = ["city", "forest", "fields", "coast", "mountains"];

  const biomeCount = 2 + Math.floor(random() * 3);
  const biomes = [];
  for (let i = 0; i < biomeCount; i++) {
    const previousBiome = biomes[i - 1];
    const allowedBiomes = allBiomes.filter((biome) => biome !== previousBiome);
    biomes.push(pick(random, allowedBiomes));
  }

  const weather = pick(random, ["clear", "rain", "snow", "fog"]);
  const hour = 22 + Math.floor(random() * 3);
  const minute = Math.floor(random() * 60);

  const train = {
    carriages: 1 + Math.floor(random() * 3),
    livery: Math.floor(random() * 3),
  };

  const stations = biomes.map(() => random() < 0.3);
  const biomeSeconds = biomes.map(() => 50 + random() * 30);

  return { seed, biomes, weather, hour, minute, train, stations, biomeSeconds };
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
