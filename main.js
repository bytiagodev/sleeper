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

const antennaChance = 0.3;

function addAntenna(random, building) {
  building.antennaHeight = 0;
  if (random() < antennaChance) {
    building.antennaHeight = 8 + Math.floor(random() * 15);
  }
}

// Generated once at load. Drawing only reads this data.
const skylineRandom = mulberry32(5);
const skyline = generateSkyline(skylineRandom, window.innerWidth);
for (const building of skyline) {
  addWindows(skylineRandom, building);
  addAntenna(skylineRandom, building);
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

  const antennaWidth = 2;
  const antennaLeft = left + Math.floor((right - left) / 2);
  ctx.fillRect(
    antennaLeft,
    roofY - building.antennaHeight,
    antennaWidth,
    building.antennaHeight,
  );

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

function drawTree(tree, shiftX, color) {
  const groundY = getGroundY();
  const centerX = tree.centerX + shiftX;
  const treeTop = groundY - tree.height;
  const tierCount = 3;
  const tierHeight = tree.height / 2;
  const tierStep = (tree.height - tierHeight) / (tierCount - 1);

  ctx.fillStyle = color;
  for (let tier = 0; tier < tierCount; tier++) {
    const tierTop = treeTop + tier * tierStep;
    const tierBottom = tierTop + tierHeight;
    const widthFraction = 0.5 + 0.5 * (tier / (tierCount - 1));
    const tierHalfWidth = (tree.width / 2) * widthFraction;

    ctx.beginPath();
    ctx.moveTo(centerX, tierTop);
    ctx.lineTo(centerX - tierHalfWidth, tierBottom);
    ctx.lineTo(centerX + tierHalfWidth, tierBottom);
    ctx.closePath();
    ctx.fill();
  }
}

function generateForest(random, forestWidth, density, sizeScale) {
  const trees = [];
  const height = (70 + random() * 110) * sizeScale;
  let nextCenterX = 0;
  while (nextCenterX < forestWidth) {
    const height = 70 + random() * 110;
    const width = height * (0.4 + random() * 0.2);
    trees.push({ centerX: nextCenterX, width, height });
    nextCenterX = nextCenterX + (30 + random() * 40) / density;
  }
  return { trees, loopWidth: Math.floor(nextCenterX) };
}

function createForestLayer(seed, density, sizeScale, color, speed) {
  const forest = generateForest(
    mulberry32(seed),
    window.innerWidth,
    density,
    sizeScale,
  );

  return {
    scrollOffset: 0,
    speed,
    wrapWidth: forest.loopWidth,
    draw(scrollOffset) {
      const drawX = Math.floor(scrollOffset);
      for (const copy of [-1, 0, 1, 2]) {
        for (const tree of forest.trees) {
          drawTree(tree, drawX + copy * forest.loopWidth, color);
        }
      }
    },
  };
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

layers.push(createForestLayer(31, 2.5, 0.45, "#0c0e1c", 22));
layers.push(createForestLayer(21, 2, 0.7, "#080a14", 40));
layers.push(createForestLayer(11, 1.6, 1, "#05060d", 70));

resize();
window.addEventListener("resize", resize);
requestAnimationFrame(loop);
