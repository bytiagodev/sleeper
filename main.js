const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d");

// Seeded random numbers (mulberry32): same seed, same sequence.
// The bit mixing is a published recipe.
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let mixed = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(random, items) {
  const randomIndex = Math.floor(random() * items.length);
  return items[randomIndex];
}

function generateJourney(seed) {
  const random = mulberry32(seed);
  const allBiomes = ["city", "forest", "fields"];

  const biomeCount = 2 + Math.floor(random() * 3);
  const biomes = [];
  for (let i = 0; i < biomeCount; i++) {
    const previousBiome = biomes[i - 1];
    const allowedBiomes = allBiomes.filter((biome) => biome !== previousBiome);
    biomes.push(pick(random, allowedBiomes));
  }

  const weather = pick(random, ["clear", "rain", "snow"]);
  const hour = 22 + Math.floor(random() * 3);
  const minute = Math.floor(random() * 60);

  const train = {
    carriages: 4 + Math.floor(random() * 5),
    livery: Math.floor(random() * 3),
  };

  const stationChance = 0.3;
  const stations = biomes.map(() => random() < stationChance);

  return { seed, biomes, weather, hour, minute, train, stations };
}

function generateSkyline(random, skylineWidth) {
  const buildings = [];
  let nextBuildingLeft = 0;
  let currentHeight = 80 + random() * 120;

  while (nextBuildingLeft < skylineWidth) {
    const buildingWidth = 30 + random() * 50;
    const heightChange = (random() - 0.5) * 60;
    currentHeight = currentHeight + heightChange;
    currentHeight = Math.max(40, Math.min(240, currentHeight));

    buildings.push({
      left: nextBuildingLeft,
      width: buildingWidth,
      height: currentHeight,
    });
    nextBuildingLeft = nextBuildingLeft + buildingWidth;
  }

  return buildings;
}

function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  ctx.scale(dpr, dpr);
}

let lastTime = 0;

function loop(currentTime) {
  const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
  lastTime = currentTime;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

function update(dt) {
  updateLayers(dt);
}

function drawSky() {
  const gradient = ctx.createLinearGradient(0, 0, 0, window.innerHeight);
  gradient.addColorStop(0, "#2b2d55");
  gradient.addColorStop(1, "#151a38");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
}

function drawMoon() {
  ctx.fillStyle = "#f2ead8";
  ctx.beginPath();
  ctx.arc(
    window.innerWidth * 0.8,
    window.innerHeight * 0.2,
    40,
    0,
    Math.PI * 2,
  );
  ctx.fill();
}

// Whole pixels, so the ground edge doesn't blend into the sky.
function getGroundY() {
  return Math.floor(window.innerHeight * 0.6);
}

const windowSize = 6;
const windowSpacing = 10;
const rowSpacing = 14;
const wallMargin = 8;
const roofMargin = 10;
const litChance = 0.25;
const dimChance = 0.4;

// Windows are rolled once per building and measured from its own corner,
// so they move with it.
function addWindows(random, building) {
  building.litWindows = [];

  let fromRoof = roofMargin;
  while (fromRoof + windowSize <= building.height - wallMargin) {
    let fromLeft = wallMargin;
    while (fromLeft + windowSize <= building.width - wallMargin) {
      if (random() < litChance) {
        const isDim = random() < dimChance;
        building.litWindows.push({ fromLeft, fromRoof, isDim });
      }
      fromLeft = fromLeft + windowSpacing;
    }
    fromRoof = fromRoof + rowSpacing;
  }
}

// Generated once at load. Drawing only reads this data.
const skylineRandom = mulberry32(5);
const skyline = generateSkyline(skylineRandom, window.innerWidth);
for (const building of skyline) {
  addWindows(skylineRandom, building);
}

// Whole pixels: the scroll wrap and the second copy must use the same number.
const lastBuilding = skyline[skyline.length - 1];
const skylineWidth = Math.floor(lastBuilding.left + lastBuilding.width);

function drawBuilding(building, shiftX) {
  const groundY = getGroundY();
  const roofY = groundY - Math.floor(building.height);

  // Round both edges so neighbouring buildings meet without a gap.
  const left = Math.floor(building.left + shiftX);
  const right = Math.floor(building.left + building.width + shiftX);

  ctx.fillStyle = "#0c0e1c";
  ctx.fillRect(left, roofY, right - left, groundY - roofY);

  for (const litWindow of building.litWindows) {
    ctx.fillStyle = litWindow.isDim ? "#c98f4a" : "#ffc76e";
    ctx.fillRect(
      left + litWindow.fromLeft,
      roofY + litWindow.fromRoof,
      windowSize,
      windowSize,
    );
  }
}

// Drawn twice, one skylineWidth apart, so the wrap is seamless.
function drawSkyline(scrollOffset) {
  const drawX = Math.floor(scrollOffset);
  for (const building of skyline) {
    drawBuilding(building, drawX);
    drawBuilding(building, drawX + skylineWidth);
  }
}

const layers = [];

function updateLayers(dt) {
  for (const layer of layers) {
    layer.scrollOffset -= layer.speed * dt;
    layer.scrollOffset = layer.scrollOffset % layer.wrapWidth;
  }
}

function drawLayers() {
  for (const layer of layers) {
    layer.draw(layer.scrollOffset);
  }
}

function draw() {
  drawSky();
  drawMoon();
  drawLayers();
}

layers.push({
  scrollOffset: 0,
  speed: 25,
  wrapWidth: skylineWidth,
  draw: drawSkyline,
});

layers.push({
  scrollOffset: 0,
  speed: 40,
  wrapWidth: window.innerWidth,
  draw(scrollOffset) {
    ctx.fillStyle = "#0c0e1c";
    const screenWidth = window.innerWidth;
    const groundY = getGroundY();
    const drawX = Math.floor(scrollOffset);
    ctx.fillRect(drawX, groundY, screenWidth, window.innerHeight - groundY);
    ctx.fillRect(
      drawX + screenWidth,
      groundY,
      screenWidth,
      window.innerHeight - groundY,
    );
  },
});

resize();
window.addEventListener("resize", resize);
requestAnimationFrame(loop);
