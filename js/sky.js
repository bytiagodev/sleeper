const moonRadius = 40;

const skyColors = {
  clear: { top: [10, 13, 38], horizon: [38, 44, 92], moonGlow: 1 },
  snow: { top: [16, 18, 34], horizon: [50, 52, 76], moonGlow: 0.7 },
  rain: { top: [9, 10, 20], horizon: [28, 30, 46], moonGlow: 0.3 },
  fog: { top: [30, 32, 48], horizon: [64, 68, 90], moonGlow: 1.6 },
};
const starCounts = { clear: 900, snow: 300, rain: 40, fog: 0 };

let skyImage;
let twinklingStars = [];
let moonImage;
let cloudSprites = [];

function getMoon() {
  return {
    x: window.innerWidth * 0.8,
    y: camera.horizonY * 0.3,
    radius: moonRadius,
  };
}

// Built when a journey starts and when the window changes size, because it
// depends on both the weather and the screen.
function buildSky() {
  const width = window.innerWidth;
  const height = Math.max(1, camera.horizonY + 2);
  skyImage = makeCanvas(width, height);
  const skyCtx = skyImage.getContext("2d");
  skyCtx.drawImage(createSkyGradient(), 0, 0, width, height);
  drawStars(skyCtx);
  if (!moonImage) moonImage = createMoonImage();
  if (cloudSprites.length === 0) cloudSprites = [1, 2, 3].map(createCloudSprite);
}

// Drawn at half size and stretched to fit: the sky is so smooth that the
// difference can't be seen, and it is four times quicker to draw.
function createSkyGradient() {
  const colors = skyColors[activeWeather];
  const moon = getMoon();
  const width = Math.ceil(window.innerWidth / 2);
  const height = Math.ceil(camera.horizonY / 2) + 1;

  return makeTexture(width, height, (x, y) => {
    const progress = y / height;
    let red = mix(colors.top[0], colors.horizon[0], progress);
    let green = mix(colors.top[1], colors.horizon[1], progress);
    let blue = mix(colors.top[2], colors.horizon[2], progress);

    // Glow around the moon: a wide faint one and a tight bright one.
    const distanceToMoon = Math.hypot(x * 2 - moon.x, y * 2 - moon.y);
    const glow =
      (Math.exp(-distanceToMoon / 380) * 28 + Math.exp(-distanceToMoon / 70) * 30) *
      colors.moonGlow;
    red += glow * 0.6;
    green += glow * 0.72;
    blue += glow;

    // A faint band of the Milky Way across the sky on clear nights.
    if (activeWeather === "clear") {
      const bandCentre = height * 0.15 + x * 0.3;
      const distanceFromBand = (y - bandCentre) / (height * 0.2);
      const cloudiness = layeredNoise2D(x / 40, y / 25, 7, 4);
      const band = Math.exp(-distanceFromBand * distanceFromBand) * Math.max(0, cloudiness - 0.35) * 30;
      red += band * 0.8;
      green += band * 0.85;
      blue += band;
    }

    const dither = (hash(x, y, 9) - 0.5) * 2;
    return [red + dither, green + dither, blue + dither, 255];
  });
}

// Most stars are drawn into the sky image once. The brightest few are
// kept aside and drawn every frame, so they can twinkle.
function drawStars(starCtx) {
  const random = seededRandom(journey.seed + 300);
  const width = window.innerWidth;
  const horizon = camera.horizonY;
  const moon = getMoon();
  twinklingStars = [];

  for (let i = 0; i < starCounts[activeWeather]; i++) {
    const x = random() * width;
    // Squaring the random number puts more stars high up, where the sky is
    // darkest, and fewer near the hazy horizon.
    const y = random() * random() * horizon;
    const size = random();
    const brightness = (0.3 + random() * 0.6) * (1 - y / horizon);
    if (Math.hypot(x - moon.x, y - moon.y) < moonRadius * 3) continue;

    if (size > 0.97) {
      twinklingStars.push({ x, y, brightness, speed: 1 + random() * 2, start: random() * 6 });
      continue;
    }
    starCtx.fillStyle = `rgba(225, 230, 255, ${brightness})`;
    starCtx.beginPath();
    starCtx.arc(x, y, 0.4 + size * 0.7, 0, Math.PI * 2);
    starCtx.fill();
  }
}

function createMoonImage() {
  const size = moonRadius * 2;
  return makeTexture(size, size, (x, y) => {
    const dx = (x + 0.5 - moonRadius) / moonRadius;
    const dy = (y + 0.5 - moonRadius) / moonRadius;
    const distanceFromCentre = Math.hypot(dx, dy);
    if (distanceFromCentre > 1) return [0, 0, 0, 0];

    // The moon is a ball, so its edge is a little darker than its middle.
    const edgeShade = Math.pow(1 - distanceFromCentre * distanceFromCentre, 0.18);
    // The darker patches, the "seas" you can see on the real moon.
    const seas = Math.max(0, layeredNoise2D(x / 22, y / 22, 13, 4) - 0.48) * 0.5;
    const light = edgeShade * (0.97 - seas);
    const softEdge = Math.min(1, (1 - distanceFromCentre) * moonRadius);
    return [246 * light, 238 * light, 216 * light, 255 * softEdge];
  });
}

function drawSky() {
  ctx.drawImage(skyImage, 0, 0);

  const seconds = performance.now() / 1000;
  for (const star of twinklingStars) {
    const twinkle = 0.6 + 0.4 * Math.sin(seconds * star.speed + star.start);
    ctx.fillStyle = `rgba(235, 240, 255, ${star.brightness * twinkle})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, 1.3, 0, Math.PI * 2);
    ctx.fill();
    drawGlow(star.x, star.y, 6, "200, 215, 255", star.brightness * twinkle * 0.5);
  }

  const moon = getMoon();
  ctx.save();
  if (activeWeather === "rain") ctx.globalAlpha = 0.35;
  if (activeWeather === "fog") ctx.globalAlpha = 0.45;
  ctx.drawImage(moonImage, moon.x - moonRadius, moon.y - moonRadius);
  ctx.restore();
}

// Clouds

function createCloudSprite(seed) {
  const width = 360;
  const height = 100;
  return makeTexture(width, height, (x, y) => {
    // Fade out towards the edges so the cloud has no hard border.
    const dx = (x - width / 2) / (width / 2);
    const dy = (y - height / 2) / (height / 2);
    const edgeFade = Math.max(0, 1 - dx * dx - dy * dy);
    const puffiness = layeredNoise2D(x / 45, y / 22, seed * 10, 5);
    const density = Math.min(1, Math.max(0, (puffiness - 0.42) * 3)) * edgeFade;
    return [150, 160, 205, density * 255];
  });
}

const cloudChance = { clear: 0.3, snow: 0.7, rain: 0.95, fog: 0 };

function createCloudLayer(seed) {
  const z = 3000;
  const spacing = 2500;
  const windSpeed = 12;

  return {
    z,
    draw() {
      const scale = scaleAt(z);
      const moon = getMoon();
      // The wind carries the clouds as well, so measured against them we
      // have gone a bit further than the train has.
      const cloudsTravelled = travelled + motion.clock * windSpeed;
      const halfScreen = window.innerWidth / 2 / scale;
      const first = Math.floor((cloudsTravelled - halfScreen - 5000) / spacing);
      const last = Math.ceil((cloudsTravelled + halfScreen) / spacing);

      ctx.save();
      for (let index = first; index <= last; index++) {
        const random = seededRandom(seed, index);
        if (random() > cloudChance[activeWeather]) continue;

        const cloudX = index * spacing + random() * spacing;
        const width = (2500 + random() * 2500) * scale;
        const height = width * 0.28;
        const screenX = window.innerWidth / 2 + (cloudX - cloudsTravelled) * scale;
        const screenY = camera.horizonY * (0.12 + random() * 0.5);
        const sprite = cloudSprites[Math.floor(random() * cloudSprites.length)];

        // Clouds near the moon are lit by it; the rest are barely visible.
        const nearMoon = Math.exp(-Math.hypot(screenX - moon.x, screenY - moon.y) / 400);
        ctx.globalAlpha = 0.18 + nearMoon * 0.5;
        ctx.drawImage(sprite, screenX - width / 2, screenY - height / 2, width, height);
      }
      ctx.restore();
    },
  };
}

// Ground

// Far ground is lighter than near ground: distance fades things towards the
// colour of the sky, and that is a big part of what makes them read as far.
const groundColors = {
  city: { far: "#151a30", near: "#07080f" },
  forest: { far: "#121628", near: "#06070d" },
  fields: { far: "#1a2133", near: "#0a0c16" },
  coast: { far: "#141626", near: "#07080f" },
  mountains: { far: "#10132a", near: "#06070d" },
};

function drawGround() {
  const colors = groundColors[activeBiome];
  const top = camera.horizonY;
  const bottom = window.innerHeight;

  const ground = ctx.createLinearGradient(0, top, 0, bottom);
  ground.addColorStop(0, hazed(colors.far, 400));
  ground.addColorStop(1, colors.near);
  ctx.fillStyle = ground;
  ctx.fillRect(0, top, window.innerWidth, bottom - top);

  if (activeBiome === "coast") {
    drawGroundTexture(shoreZ);
  } else {
    drawGroundTexture(220);
  }

  if (activeWeather === "snow") {
    const snow = ctx.createLinearGradient(0, top, 0, bottom);
    snow.addColorStop(0, "rgba(232, 236, 244, 0.09)");
    snow.addColorStop(1, "rgba(232, 236, 244, 0.05)");
    ctx.fillStyle = snow;
    ctx.fillRect(0, top, window.innerWidth, bottom - top);
  }
}
