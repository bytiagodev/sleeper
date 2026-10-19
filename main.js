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

function drawGround() {
  const groundY = getGroundY();
  ctx.fillStyle = "#0c0e1c";
  ctx.fillRect(0, groundY, window.innerWidth, window.innerHeight - groundY);
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

function createSkylineLayer(seed, speed) {
  const random = mulberry32(seed);
  const buildings = generateSkyline(random, window.innerWidth);
  for (const building of buildings) {
    addWindows(random, building);
  }
  for (const building of buildings) {
    addAntenna(random, building);
  }

  // Whole pixels: the scroll wrap and the second copy must use the same number.
  const lastBuilding = buildings[buildings.length - 1];
  const loopWidth = Math.floor(lastBuilding.left + lastBuilding.width);

  return {
    scrollOffset: 0,
    speed,
    wrapWidth: loopWidth,
    draw(scrollOffset) {
      const drawX = Math.floor(scrollOffset);
      for (const building of buildings) {
        drawBuilding(building, drawX);
        drawBuilding(building, drawX + loopWidth);
      }
    },
  };
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
  let nextCenterX = 0;
  while (nextCenterX < forestWidth) {
    const height = (70 + random() * 110) * sizeScale;
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
      // Trees stick out past their centre, so draw an extra copy each side.
      for (const copy of [-1, 0, 1, 2]) {
        for (const tree of forest.trees) {
          drawTree(tree, drawX + copy * forest.loopWidth, color);
        }
      }
    },
  };
}

function drawBarn(leftX, baseY) {
  const wallHeight = 34;

  ctx.fillStyle = "#0f1322";
  ctx.fillRect(leftX, baseY - wallHeight, 84, wallHeight);

  ctx.fillStyle = "#05060d";
  ctx.fillRect(leftX + 31, baseY - 24, 22, 24);

  ctx.fillStyle = "#c98f4a";
  ctx.globalAlpha = 0.6;
  ctx.fillRect(leftX + 9, baseY - 26, 8, 8);
  ctx.fillRect(leftX + 67, baseY - 26, 8, 8);
  ctx.globalAlpha = 1;

  ctx.fillStyle = "#080a14";
  ctx.beginPath();
  ctx.moveTo(leftX - 4, baseY - wallHeight);
  ctx.lineTo(leftX + 12, baseY - 52);
  ctx.lineTo(leftX + 42, baseY - 62);
  ctx.lineTo(leftX + 72, baseY - 52);
  ctx.lineTo(leftX + 88, baseY - wallHeight);
  ctx.closePath();
  ctx.fill();

  const siloLeft = leftX + 90;
  const siloWidth = 26;
  const siloHeight = 58;
  ctx.fillStyle = "#0f1322";
  ctx.fillRect(siloLeft, baseY - siloHeight, siloWidth, siloHeight);

  ctx.fillStyle = "#080a14";
  ctx.beginPath();
  ctx.moveTo(siloLeft - 2, baseY - siloHeight);
  ctx.lineTo(siloLeft + siloWidth / 2, baseY - siloHeight - 10);
  ctx.lineTo(siloLeft + siloWidth + 2, baseY - siloHeight);
  ctx.closePath();
  ctx.fill();

  ctx.fillRect(siloLeft, baseY - 40, siloWidth, 2);
  ctx.fillRect(siloLeft, baseY - 20, siloWidth, 2);
}

function createHorizonLayer(seed, speed) {
  const random = mulberry32(seed);
  const phaseA = random() * Math.PI * 2;
  const phaseB = random() * Math.PI * 2;
  const width = window.innerWidth;
  const hasBarn = random() < 0.4;
  const barnX = 100 + random() * (width - 200);
  const trees = [];
  for (let index = 0; index < 5; index++) {
    const height = 22 + random() * 16;
    const blobs = [];
    const blobCount = 3 + Math.floor(random() * 3);
    for (let blob = 0; blob < blobCount; blob++) {
      blobs.push({
        offsetX: (random() - 0.5) * height * 0.6,
        offsetY: -height * (0.5 + random() * 0.4),
        radius: height * (0.16 + random() * 0.12),
      });
    }
    trees.push({ x: 30 + random() * (width - 60), height, blobs });
  }

  // Whole wave cycles across the width, so the end matches the start
  // and the wrap has no jump.
  function riseAt(x) {
    const angle = (x / width) * Math.PI * 2;
    return Math.sin(angle * 2 + phaseA) * 8 + Math.sin(angle * 5 + phaseB) * 3;
  }

  return {
    scrollOffset: 0,
    speed,
    wrapWidth: width,
    draw(scrollOffset) {
      const groundY = getGroundY();
      const drawX = Math.floor(scrollOffset);

      const groundFill = ctx.createLinearGradient(
        0,
        groundY - 12,
        0,
        window.innerHeight,
      );
      groundFill.addColorStop(0, "#1a2133");
      groundFill.addColorStop(1, "#0c0e1c");
      ctx.fillStyle = groundFill;
      ctx.beginPath();
      ctx.moveTo(drawX, window.innerHeight);
      for (let x = 0; x <= width * 2; x += 10) {
        ctx.lineTo(drawX + x, groundY - riseAt(x));
      }
      ctx.lineTo(drawX + width * 2, window.innerHeight);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#0e1222";
      trees.forEach((tree) => {
        [0, width].forEach((copyShift) => {
          const treeX = drawX + copyShift + tree.x;
          const baseY = groundY - riseAt(tree.x) + 2;
          ctx.fillRect(
            treeX - 1,
            baseY - tree.height * 0.5,
            2,
            tree.height * 0.5,
          );
          tree.blobs.forEach((blob) => {
            ctx.beginPath();
            ctx.arc(
              treeX + blob.offsetX,
              baseY + blob.offsetY,
              blob.radius,
              0,
              Math.PI * 2,
            );
            ctx.fill();
          });
        });
      });

      if (hasBarn) {
        const barnBaseY = groundY - riseAt(barnX) + 2;
        drawBarn(drawX + barnX, barnBaseY);
        drawBarn(drawX + width + barnX, barnBaseY);
      }
    },
  };
}

const fenceSpacing = 60;
const fenceHeight = 54;
const fenceColor = "#10141f";

function createFenceLayer(seed, speed) {
  const random = mulberry32(seed);
  // Whole posts only, so the loop lands post on post.
  const postCount = Math.ceil(window.innerWidth / fenceSpacing);
  const loopWidth = postCount * fenceSpacing;
  const posts = [];
  for (let i = 0; i < postCount; i++) {
    posts.push({
      height: fenceHeight - random() * 8,
      lean: (random() - 0.5) * 6,
    });
  }

  return {
    scrollOffset: 0,
    speed,
    wrapWidth: loopWidth,
    draw(scrollOffset) {
      const baseY = getGroundY() + 14;
      const drawX = Math.floor(scrollOffset);

      ctx.fillStyle = fenceColor;
      ctx.fillRect(drawX, baseY - fenceHeight + 10, loopWidth * 2, 2);
      ctx.fillRect(drawX, baseY - fenceHeight + 30, loopWidth * 2, 2);

      for (let copy = 0; copy < 2; copy++) {
        posts.forEach((post, index) => {
          const postX = drawX + copy * loopWidth + index * fenceSpacing;
          const postTop = baseY - post.height;

          ctx.beginPath();
          ctx.moveTo(postX - 2, baseY);
          ctx.lineTo(postX + 3, baseY);
          ctx.lineTo(postX + 3 + post.lean, postTop);
          ctx.lineTo(postX - 2 + post.lean, postTop);
          ctx.closePath();
          ctx.fill();
        });
      }
    },
  };
}

function createFurrowLayer(speed) {
  const furrowSpacing = 80;
  const horizonScale = 0.25;

  return {
    scrollOffset: 0,
    speed,
    wrapWidth: furrowSpacing,
    draw(scrollOffset) {
      const centerX = window.innerWidth / 2;
      const topY = getGroundY() - 12;
      const reach = centerX / horizonScale;

      const fadeIn = ctx.createLinearGradient(0, topY, 0, topY + 60);
      fadeIn.addColorStop(0, "rgba(110, 120, 150, 0)");
      fadeIn.addColorStop(1, "rgba(110, 120, 150, 0.14)");
      ctx.strokeStyle = fadeIn;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (
        let bottomX = centerX - reach + Math.floor(scrollOffset);
        bottomX <= centerX + reach;
        bottomX += furrowSpacing
      ) {
        const topX = centerX + (bottomX - centerX) * horizonScale;
        ctx.moveTo(topX, topY);
        ctx.lineTo(bottomX, window.innerHeight);
      }
      ctx.stroke();
    },
  };
}

// Each biome is a list of layers, built once. Drawing only reads them.
const biomeBuilders = {
  city: () => [createSkylineLayer(5, 25)],
  forest: () => [
    createForestLayer(31, 2.5, 0.45, "#0c0e1c", 22),
    createForestLayer(21, 2, 0.7, "#080a14", 40),
    createForestLayer(11, 1.6, 1, "#05060d", 70),
  ],
  fields: () => [
    createHorizonLayer(2, 20),
    createFurrowLayer(300),
    createFenceLayer(51, 90),
  ],
};

const activeBiome = "fields";
const layers = biomeBuilders[activeBiome]();

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
  if (activeBiome !== "fields") drawGround();
  drawLayers();
}

resize();
window.addEventListener("resize", resize);
requestAnimationFrame(loop);
