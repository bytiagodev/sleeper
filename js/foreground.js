// What stands between the camera and the track. It is the nearest scenery,
// so it passes fastest, and each landscape has its own: fence posts in the
// fields, a railing and street lamps in the city, a sea wall and rocks on
// the coast, ferns in the forest, boulders and scree in the mountains.

// The tallest thing that can stand at distance z without hiding the near
// rail. The camera is 6 m up and looks down at the rail, so the line of
// sight drops lower the closer it comes to the camera. Keeping scenery
// under it means the train is framed rather than covered.
function clearHeightAt(z) {
  const nearRailZ = camera.trackZ - gauge / 2;
  return camera.height * (1 - z / nearRailZ);
}

// The hill over a tunnel comes down to the ground in front of the track,
// so nothing stands there.
function isUnderHill(x) {
  const margin = 2;
  if (x > segment.tunnelX - margin) return true;
  return segment.exitX !== null && x < segment.exitX + margin;
}

const foregroundBuilders = {
  fields: (seed) => [createNearFenceLayer(seed)],
  city: (seed) => [createRailingLayer(seed), createStreetLampRow(seed + 1)],
  coast: (seed) => [createSeaWallLayer(seed), createRockRows(seed + 1, [7.7, 6.8], "#1d1e27", 0.4)],
  forest: (seed) => [createUndergrowthLayer(seed)],
  mountains: (seed) => [createScreeLayer(seed), createRockRows(seed + 1, [9.4, 8.2, 7], "#22232b", 0.45)],
};

function createForegroundLayers(biome, seed) {
  return foregroundBuilders[biome](seed);
}

// Fields: a post-and-rail fence, with stretches where it has fallen or a
// gate stands open.
function createNearFenceLayer(seed) {
  const z = 8;
  const spacing = 2.6;
  const postHeight = 1.25;
  const railHeights = [1.02, 0.55];
  const hasPost = (x) => !isUnderHill(x) && smoothNoise(x / 30, seed) > 0.2;

  return {
    z,
    draw() {
      const scale = scaleAt(z);
      const baseY = groundYAt(z);
      const postWidth = 0.12 * scale;
      const railThickness = 0.08 * scale;
      const fence = new Path2D();

      forEachSlot(z, spacing, spacing, (index, x) => {
        if (!hasPost(x)) return;
        const random = seededRandom(seed, index);
        const postX = screenXAt(x, z);
        const height = (postHeight - random() * 0.15) * scale;
        const lean = (random() - 0.5) * 0.1 * scale;
        fence.moveTo(postX - postWidth / 2, baseY);
        fence.lineTo(postX + postWidth / 2, baseY);
        fence.lineTo(postX + postWidth / 2 + lean, baseY - height);
        fence.lineTo(postX - postWidth / 2 + lean, baseY - height);
        fence.closePath();

        if (!hasPost(x + spacing)) return;
        const nextPostX = screenXAt(x + spacing, z);
        for (const railHeight of railHeights) {
          fence.rect(postX, baseY - railHeight * scale, nextPostX - postX, railThickness);
        }
      });

      fillWithMoonlitEdge(fence, hazed("#06080d", z), 0.4);
    },
  };
}

// City: an iron railing along the line, with a heavier post every few
// metres.
function createRailingLayer(seed) {
  const z = 8.6;
  const height = 1.05;
  const barSpacing = 0.45;
  const postSpacing = 2.8;

  return {
    z,
    draw() {
      const scale = scaleAt(z);
      const baseY = groundYAt(z);
      const barWidth = Math.max(1, 0.035 * scale);
      const postWidth = 0.1 * scale;
      const railing = new Path2D();

      forEachSlot(z, barSpacing, 1, (index, x) => {
        if (isUnderHill(x)) return;
        railing.rect(screenXAt(x, z) - barWidth / 2, baseY - height * scale, barWidth, height * scale);
      });
      forEachSlot(z, postSpacing, postSpacing, (index, x) => {
        if (isUnderHill(x)) return;
        const postX = screenXAt(x, z);
        railing.rect(postX - postWidth / 2, baseY - (height + 0.12) * scale, postWidth, (height + 0.12) * scale);
      });

      // The top and bottom rails run between the hills, if there are any.
      const fromX = segment.exitX === null ? 0 : screenXAt(segment.exitX + 2, z);
      const toX = screenXAt(segment.tunnelX - 2, z);
      const left = Math.max(0, fromX);
      const right = Math.min(window.innerWidth, toX);
      if (right > left) {
        railing.rect(left, baseY - height * scale, right - left, 0.06 * scale);
        railing.rect(left, baseY - 0.18 * scale, right - left, 0.05 * scale);
      }

      fillWithMoonlitEdge(railing, hazed("#05060b", z), 0.45);
    },
  };
}

// City: now and then a street lamp. It is the one thing in front of the
// track tall enough to pass across the train, and it lights a pool of
// pavement around its foot.
function createStreetLampRow(seed) {
  const z = 7.4;
  const spacing = 52;
  const height = 4.4;

  return {
    z,
    draw() {
      const scale = scaleAt(z);
      const baseY = groundYAt(z);
      const postWidth = Math.max(2, 0.13 * scale);
      const lamps = new Path2D();
      const lights = [];

      forEachSlot(z, spacing, 4, (index, x) => {
        const random = seededRandom(seed, index);
        const lampX = x + random() * 20;
        if (isUnderHill(lampX)) return;
        const footX = screenXAt(lampX, z);
        const topY = baseY - height * scale;
        lamps.rect(footX - postWidth / 2, topY, postWidth, height * scale);
        // A wider base, and a lantern on top
        lamps.rect(footX - postWidth, baseY - 0.5 * scale, postWidth * 2, 0.5 * scale);
        lamps.rect(footX - 0.16 * scale, topY - 0.42 * scale, 0.32 * scale, 0.42 * scale);
        lamps.moveTo(footX - 0.24 * scale, topY - 0.42 * scale);
        lamps.lineTo(footX, topY - 0.62 * scale);
        lamps.lineTo(footX + 0.24 * scale, topY - 0.42 * scale);
        lamps.closePath();
        lights.push({ x: footX, y: topY - 0.21 * scale });
      });

      for (const light of lights) drawLightPool(light.x, baseY, 3.5 * scale, warmLight, 0.35);
      fillWithMoonlitEdge(lamps, hazed("#05060b", z), 0.35);
      for (const light of lights) {
        ctx.fillStyle = "#ffd9a0";
        ctx.fillRect(light.x - 0.1 * scale, light.y - 0.13 * scale, 0.2 * scale, 0.26 * scale);
        drawGlow(light.x, light.y, 2.4 * scale, warmLight, 0.7);
      }
    },
  };
}

// Coast: a low wall of dressed stone holding the line above the beach,
// with a coping along the top that catches the moon.
function createSeaWallLayer(seed) {
  const z = 9.3;
  const height = 0.75;
  const courseHeight = height / 2;
  const blockLength = 0.9;

  return {
    z,
    draw() {
      const scale = scaleAt(z);
      const baseY = groundYAt(z);
      const fromX = segment.exitX === null ? 0 : screenXAt(segment.exitX + 2, z);
      const left = Math.max(0, fromX);
      const right = Math.min(window.innerWidth, screenXAt(segment.tunnelX - 2, z));
      if (right <= left) return;
      const topY = baseY - height * scale;

      ctx.fillStyle = hazed("#2a2b36", z);
      ctx.fillRect(left, topY, right - left, height * scale);

      // Mortar between the blocks. Each course is offset by half a block,
      // as a mason lays them, so no joint runs straight up the wall.
      ctx.strokeStyle = "rgba(0, 0, 0, 0.55)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(left, topY + courseHeight * scale);
      ctx.lineTo(right, topY + courseHeight * scale);
      for (let course = 0; course < 2; course++) {
        const offset = course * blockLength * 0.5;
        const courseTop = topY + course * courseHeight * scale;
        forEachSlot(z, blockLength, blockLength, (index, x) => {
          const random = seededRandom(seed + course, index);
          const jointX = screenXAt(x + offset + (random() - 0.5) * 0.15, z);
          if (jointX < left || jointX > right) return;
          ctx.moveTo(jointX, courseTop);
          ctx.lineTo(jointX, courseTop + courseHeight * scale);
        });
      }
      ctx.stroke();

      const coping = 0.1 * scale;
      ctx.fillStyle = hazed("#3b3d4a", z);
      ctx.fillRect(left, topY - coping, right - left, coping);
      ctx.fillStyle = "rgba(170, 185, 240, 0.4)";
      ctx.fillRect(left, topY - coping, right - left, 1);
      const shade = ctx.createLinearGradient(0, topY, 0, baseY);
      shade.addColorStop(0, "rgba(0, 0, 8, 0)");
      shade.addColorStop(1, "rgba(0, 0, 8, 0.5)");
      ctx.fillStyle = shade;
      ctx.fillRect(left, topY, right - left, height * scale);
    },
  };
}

// Coast and mountains: rows of rocks half sunk into the ground, the
// furthest row first so nearer rocks overlap it.
function createRockRows(seed, rowDistances, color, edgeAlpha) {
  return {
    z: Math.min(...rowDistances),
    draw() {
      rowDistances.forEach((z, row) => {
        const scale = scaleAt(z);
        const baseY = groundYAt(z);
        const tallest = clearHeightAt(z) * 0.8;
        const rocks = new Path2D();
        forEachSlot(z, 2.2, 3, (index, x) => {
          const random = seededRandom(seed + row, index);
          if (random() < 0.45) return;
          const rockX = x + random() * 2;
          if (isUnderHill(rockX)) return;
          const width = 0.5 + random() * 1.3;
          const height = Math.min(tallest, width * (0.35 + random() * 0.3));
          traceRock(rocks, screenXAt(rockX, z), baseY, width * scale, height * scale, random);
        });
        fillWithMoonlitEdge(rocks, hazed(color, z), edgeAlpha);
      });
    },
  };
}

// Mountains: loose stones scattered over the ground, too many and too
// small to notice one by one, so the slope reads as rough rather than
// smooth.
function createScreeLayer(seed) {
  const rowDistances = [10.2, 9.5, 8.8, 8.1, 7.4, 6.7];
  return {
    z: 10.2,
    draw() {
      const stones = new Path2D();
      rowDistances.forEach((z, row) => {
        const scale = scaleAt(z);
        const baseY = groundYAt(z);
        forEachSlot(z, 0.4, 1, (index, x) => {
          const random = seededRandom(seed + row, index);
          if (random() < 0.5) return;
          const stoneX = x + random() * 0.4;
          if (isUnderHill(stoneX)) return;
          const width = (0.08 + random() * 0.2) * scale;
          traceRock(stones, screenXAt(stoneX, z), baseY, width, width * 0.5, random);
        });
      });
      fillWithMoonlitEdge(stones, hazed("#2b2c35", 9), 0.3);
    },
  };
}

// Forest: ferns and low bushes crowding the edge of the line.
function createUndergrowthLayer(seed) {
  const rowDistances = [9.4, 8.3, 7.2];
  return {
    z: Math.min(...rowDistances),
    draw() {
      rowDistances.forEach((z, row) => {
        const scale = scaleAt(z);
        const baseY = groundYAt(z);
        const tallest = clearHeightAt(z) * 0.9;
        const greenery = new Path2D();
        forEachSlot(z, 1.6, 2, (index, x) => {
          const random = seededRandom(seed + row, index);
          if (random() < 0.4) return;
          const plantX = x + random() * 1.6;
          if (isUnderHill(plantX)) return;
          const size = Math.min(tallest, 0.5 + random() * 0.7) * scale;
          if (random() < 0.8) traceFern(greenery, screenXAt(plantX, z), baseY, size * 1.3, random);
          else traceBush(greenery, screenXAt(plantX, z), baseY, size * 1.2, random);
        });
        fillWithMoonlitEdge(greenery, hazed("#060a08", z), 0.28);
      });
    },
  };
}
