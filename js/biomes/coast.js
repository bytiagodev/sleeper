const shoreZ = 26;

function createSeaLayer(seed) {
  const random = seededRandom(seed);
  const moonStrips = [];
  for (let i = 0; i < 45; i++) {
    const depth = random();
    moonStrips.push({
      depth,
      width: (8 + depth * 60) * (0.4 + random() * 1.2),
      offset: (random() - 0.5) * (10 + depth * 50),
      brightness: 0.06 + random() * 0.24,
      phase: random() * Math.PI * 2,
    });
  }

  // Equal steps across the water look closer together near the horizon, so
  // each row of waves is a little further out than the one before.
  const waveRows = [];
  for (let z = shoreZ + 4; z < 4000; z *= 1.09) waveRows.push(z);

  return {
    z: 6000,
    draw() {
      const seaTop = camera.horizonY;
      const seaBottom = groundYAt(shoreZ);
      const seaHeight = seaBottom - seaTop;

      const water = ctx.createLinearGradient(0, seaTop, 0, seaBottom);
      water.addColorStop(0, "#262c58");
      water.addColorStop(1, "#0d1429");
      ctx.fillStyle = water;
      ctx.fillRect(0, seaTop, window.innerWidth, seaHeight);

      // The moon's reflection moves with the camera, so it stays still on
      // screen while the waves pass through it.
      const moon = getMoon();
      const seconds = performance.now() / 1000;
      ctx.fillStyle = "#f2ead8";
      for (const strip of moonStrips) {
        const shimmer = Math.sin(seconds * 0.8 + strip.phase) * 4;
        ctx.globalAlpha = strip.brightness;
        ctx.fillRect(
          moon.x + strip.offset + shimmer - strip.width / 2,
          seaTop + 3 + strip.depth * (seaHeight - 6),
          strip.width,
          2,
        );
      }

      ctx.fillStyle = "#afb9c8";
      waveRows.forEach((z, row) => {
        const scale = scaleAt(z);
        const y = groundYAt(z);
        const spacing = z * 0.12;
        ctx.globalAlpha = 0.05 + 0.07 * Math.min(1, 200 / z);
        forEachSlot(z, spacing, spacing, (index, x) => {
          const random = seededRandom(seed + row, index);
          if (random() > 0.3) return;
          const waveLength = spacing * (0.3 + random() * 0.6);
          ctx.fillRect(screenXAt(x, z), y, waveLength * scale, 1);
        });
      });
      ctx.globalAlpha = 1;

      drawBreakingFoam(seaBottom);
    },
  };
}

// Where the waves break on the beach. Each stretch of foam brightens and
// fades on its own slow cycle, so the surf rolls along the shore.
function drawBreakingFoam(shoreY) {
  const seconds = performance.now() / 1000;
  const scale = scaleAt(shoreZ);
  ctx.fillStyle = "#c8d0e8";
  forEachSlot(shoreZ, 3, 3, (index, x) => {
    const surge = Math.sin(seconds * 0.9 + index * 0.7) * 0.5 + 0.5;
    ctx.globalAlpha = 0.08 + surge * 0.3;
    ctx.fillRect(screenXAt(x, shoreZ), shoreY - 1 - surge * 0.15 * scale, 3 * scale, 1.5);
  });
  ctx.globalAlpha = 1;
}

// Rocks on the beach between the sea and the line.
function createBeachRockLayer(seed) {
  const z = 18;
  const fill = hazed("#090a12", z);
  return {
    z,
    draw() {
      const scale = scaleAt(z);
      const baseY = groundYAt(z);
      const rocks = new Path2D();
      forEachSlot(z, 4, 2, (index, x) => {
        const random = seededRandom(seed, index);
        if (random() < 0.6) return;
        const rockX = screenXAt(x + random() * 3, z);
        const width = (0.6 + random() * 1.4) * scale;
        const height = width * (0.35 + random() * 0.3);
        rocks.moveTo(rockX + width / 2, baseY);
        rocks.ellipse(rockX, baseY, width / 2, height, 0, 0, Math.PI, true);
      });
      fillWithMoonlitEdge(rocks, fill, 0.3);
    },
  };
}

function drawLighthouse(centerX, baseY, scale) {
  const m = (metres) => metres * scale;
  const topY = baseY - m(26);
  const lampY = topY - m(2.5);

  drawGlow(centerX, lampY, 22, warmLight, 0.6);

  // The beam swings round; seen from the side it grows and shrinks.
  // One full turn every 18 seconds, about the pace of a real lighthouse.
  const turnsPerSecond = 1 / 18;
  const beamLength = Math.cos((performance.now() / 1000) * turnsPerSecond * Math.PI * 2) * 300;
  if (Math.abs(beamLength) > 4) {
    const tipX = centerX + beamLength;
    const beam = ctx.createLinearGradient(centerX, 0, tipX, 0);
    beam.addColorStop(0, "rgba(255, 199, 110, 0.3)");
    beam.addColorStop(1, "rgba(255, 199, 110, 0)");
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(centerX, lampY - 2);
    ctx.lineTo(tipX, lampY - 12);
    ctx.lineTo(tipX, lampY + 12);
    ctx.lineTo(centerX, lampY + 2);
    ctx.fill();
  }

  ctx.fillStyle = "#0c1028";
  ctx.beginPath();
  ctx.moveTo(centerX - m(2.2), baseY);
  ctx.lineTo(centerX - m(1.4), topY);
  ctx.lineTo(centerX + m(1.4), topY);
  ctx.lineTo(centerX + m(2.2), baseY);
  ctx.fill();
  ctx.fillRect(centerX - m(2), topY - m(0.5), m(4), m(0.8));

  ctx.fillStyle = "#ffc76e";
  ctx.fillRect(centerX - m(1), topY - m(3), m(2), m(2.5));

  ctx.fillStyle = "#0c1028";
  ctx.beginPath();
  ctx.moveTo(centerX - m(1.5), topY - m(3));
  ctx.lineTo(centerX, topY - m(5));
  ctx.lineTo(centerX + m(1.5), topY - m(3));
  ctx.fill();
}

const headlandZ = 480;
const headlandLength = 520;

function headlandHeightAlong(progress, peak, index) {
  const lumps = 0.85 + 0.15 * Math.sin(progress * 9 + index);
  return peak * Math.sin(Math.PI * progress) ** 1.5 * lumps;
}

function drawHeadland(startX, peak, index, landColor) {
  const scale = scaleAt(headlandZ);
  const waterY = groundYAt(headlandZ) + 1;
  ctx.fillStyle = landColor;
  ctx.beginPath();
  ctx.moveTo(screenXAt(startX, headlandZ), waterY);
  for (let progress = 0; progress <= 1; progress += 0.02) {
    const height = headlandHeightAlong(progress, peak, index);
    ctx.lineTo(screenXAt(startX + progress * headlandLength, headlandZ), waterY - height * scale);
  }
  ctx.lineTo(screenXAt(startX + headlandLength, headlandZ), waterY);
  ctx.fill();
}

// Bare headlands along the coast, and exactly one with a lighthouse. The
// lighthouse is placed when the coast is built, on the right-hand side of
// the screen, so it is in view for the whole stretch of coast and never has
// a twin beside it.
function createHeadlandLayer(seed) {
  const z = headlandZ;
  const spacing = 900;
  const landColor = hazed("#141935", z);

  const random = seededRandom(seed, 0);
  const lighthouseX = worldXAt(window.innerWidth * (0.55 + random() * 0.25), z);
  const lighthouseStart = lighthouseX - headlandLength * 0.65;
  const lighthousePeak = 40 + random() * 15;

  return {
    z,
    draw() {
      forEachSlot(z, spacing, headlandLength, (index, x) => {
        const slotRandom = seededRandom(seed, index);
        if (slotRandom() > 0.6) return;
        const startX = x + slotRandom() * (spacing - headlandLength);
        drawHeadland(startX, 25 + slotRandom() * 20, index, landColor);
      });

      drawHeadland(lighthouseStart, lighthousePeak, 0, landColor);
      const scale = scaleAt(z);
      const groundHeight = headlandHeightAlong(0.65, lighthousePeak, 0);
      drawLighthouse(screenXAt(lighthouseX, z), groundYAt(z) + 2 - groundHeight * scale, scale);
    },
  };
}

function createCoastLayers(seed) {
  return [createSeaLayer(seed + 1), createHeadlandLayer(seed + 2), createBeachRockLayer(seed + 3)];
}
