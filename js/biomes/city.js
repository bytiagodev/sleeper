function createCityLayer({ seed, z, plotWidth, minHeight, heightRange, color, windowColor, litChance, edgeAlpha, windowGlow }) {
  const fill = hazed(color, z);
  // Windows fade into the haze too, but slower than walls, because they
  // give off their own light.
  const windowVisibility = 1 - hazeAt(z) * 0.7;
  return {
    z,
    draw() {
      const scale = scaleAt(z);
      const baseY = groundYAt(z);
      const windowWidth = Math.max(1, 1.3 * scale);
      const windowHeight = Math.max(1, 1.6 * scale);
      const litWindows = [];
      const dimWindows = [];

      const buildings = new Path2D();
      forEachSlot(z, plotWidth, plotWidth, (index, x) => {
        const random = seededRandom(seed, index);
        const buildingWidth = plotWidth * (0.72 + random() * 0.28);
        // Smooth noise makes neighbouring buildings similar in height, so
        // tall towers cluster together like a city centre.
        const buildingHeight =
          minHeight + layeredNoise(index * 0.1, seed, 3) * heightRange + random() * 6;

        const left = screenXAt(x, z);
        const right = screenXAt(x + buildingWidth, z);
        const roofY = baseY - buildingHeight * scale;
        buildings.rect(left, roofY, right - left, baseY - roofY);
        traceRooftop(buildings, left, right, roofY, scale, seededRandom(seed + 100, index));

        const columns = Math.floor((buildingWidth - 2) / 3.2);
        const floors = Math.floor((buildingHeight - 3) / 3.6);
        for (let floor = 0; floor < floors; floor++) {
          for (let column = 0; column < columns; column++) {
            const roll = random();
            if (roll > litChance) continue;
            const pane = {
              x: left + (1.6 + column * 3.2) * scale,
              y: roofY + (2 + floor * 3.6) * scale,
            };
            if (roll < litChance * 0.4) dimWindows.push(pane);
            else litWindows.push(pane);
          }
        }
      });

      fillWithMoonlitEdge(buildings, fill, edgeAlpha * (1 - hazeAt(z)));

      ctx.save();
      ctx.globalAlpha = windowVisibility;
      ctx.fillStyle = windowColor;
      for (const pane of litWindows) {
        ctx.fillRect(pane.x, pane.y, windowWidth, windowHeight);
      }
      if (windowGlow > 0) {
        for (const pane of litWindows) {
          drawGlow(pane.x + windowWidth / 2, pane.y + windowHeight / 2, windowWidth * 3, warmLight, windowGlow);
        }
      }
      ctx.fillStyle = "#a8783f";
      for (const pane of dimWindows) {
        ctx.fillRect(pane.x, pane.y, windowWidth, windowHeight);
      }
      ctx.restore();
    },
  };
}

// What stands on a roof: always a cornice, the ledge along the top of the
// wall, and often more. A narrower block set back from the edge, a water
// tank on legs, chimney stacks or an aerial.
function traceRooftop(path, left, right, roofY, scale, random) {
  const width = right - left;
  const overhang = 0.3 * scale;
  path.rect(left - overhang, roofY - 0.6 * scale, width + overhang * 2, 0.6 * scale);

  const kind = random();
  if (kind < 0.2) {
    const setbackWidth = width * (0.4 + random() * 0.3);
    const setbackLeft = left + (width - setbackWidth) * random();
    const setbackHeight = (4 + random() * 8) * scale;
    path.rect(setbackLeft, roofY - setbackHeight, setbackWidth, setbackHeight);
    path.rect(setbackLeft - overhang / 2, roofY - setbackHeight - 0.4 * scale, setbackWidth + overhang, 0.4 * scale);
  } else if (kind < 0.4) {
    traceWaterTank(path, left + width * (0.2 + random() * 0.6), roofY, scale);
  } else if (kind < 0.55) {
    const stacks = 1 + Math.floor(random() * 3);
    for (let i = 0; i < stacks; i++) {
      const stackX = left + width * (0.1 + random() * 0.8);
      const stackHeight = (2 + random() * 1.5) * scale;
      path.rect(stackX, roofY - stackHeight, 0.8 * scale, stackHeight);
      path.rect(stackX - 0.1 * scale, roofY - stackHeight - 0.25 * scale, 1 * scale, 0.25 * scale);
    }
  } else if (kind < 0.75) {
    const antennaHeight = (3 + random() * 8) * scale;
    const antennaWidth = Math.max(1, 0.3 * scale);
    path.rect(left + width / 2, roofY - antennaHeight, antennaWidth, antennaHeight);
  }
}

// A wooden water tank: a barrel with a pointed cap, raised on legs so the
// water has the height to reach the top floors.
function traceWaterTank(path, centerX, roofY, scale) {
  const legHeight = 2 * scale;
  const tankWidth = 3 * scale;
  const tankHeight = 3 * scale;
  const legWidth = Math.max(1, 0.25 * scale);
  const tankBottom = roofY - legHeight;
  const tankTop = tankBottom - tankHeight;
  path.rect(centerX - tankWidth * 0.4, tankBottom, legWidth, legHeight);
  path.rect(centerX + tankWidth * 0.4 - legWidth, tankBottom, legWidth, legHeight);
  path.rect(centerX - tankWidth / 2, tankTop, tankWidth, tankHeight);
  path.moveTo(centerX - tankWidth / 2 - 0.15 * scale, tankTop);
  path.lineTo(centerX, tankTop - 1.2 * scale);
  path.lineTo(centerX + tankWidth / 2 + 0.15 * scale, tankTop);
  path.closePath();
}

// Low warehouses and yard walls between the city and the line.
function createYardLayer(seed) {
  const z = 34;
  const fill = hazed("#0a0b15", z);
  return {
    z,
    draw() {
      const scale = scaleAt(z);
      const baseY = groundYAt(z);
      const sheds = new Path2D();
      const litWindows = [];
      forEachSlot(z, 30, 30, (index, x) => {
        const random = seededRandom(seed, index);
        if (random() < 0.3) {
          // An empty plot with just a wall along it
          sheds.rect(screenXAt(x, z), baseY - 2.2 * scale, 30 * scale, 2.2 * scale);
          return;
        }
        const width = 14 + random() * 12;
        const wallHeight = 4 + random() * 4;
        const left = screenXAt(x + 2, z);
        const right = screenXAt(x + 2 + width, z);
        sheds.moveTo(left, baseY);
        sheds.lineTo(left, baseY - wallHeight * scale);
        sheds.lineTo((left + right) / 2, baseY - (wallHeight + 2.5) * scale);
        sheds.lineTo(right, baseY - wallHeight * scale);
        sheds.lineTo(right, baseY);
        sheds.closePath();
        if (random() < 0.5) {
          litWindows.push({ x: left + (2 + random() * (width - 4)) * scale, y: baseY - (wallHeight - 1.5) * scale });
        }
      });
      fillWithMoonlitEdge(sheds, fill, 0.22);

      for (const pane of litWindows) {
        ctx.fillStyle = "#e0a85c";
        ctx.fillRect(pane.x, pane.y, 1.4 * scale, 1 * scale);
        drawGlow(pane.x + 0.7 * scale, pane.y + 0.5 * scale, 3 * scale, warmLight, 0.35);
      }
    },
  };
}

// A street running alongside the line, lit by lamps every 35 m. Each lamp
// throws a pool of light on the road below it.
function createStreetLampLayer(seed) {
  const z = 22;
  const lampHeight = 5;
  return {
    z,
    draw() {
      const scale = scaleAt(z);
      const baseY = groundYAt(z);
      forEachSlot(z, 35, 5, (index, x) => {
        const lampX = screenXAt(x, z);
        const lampY = baseY - lampHeight * scale;
        drawLightPool(lampX, baseY, 6 * scale);

        ctx.fillStyle = "#07080e";
        ctx.fillRect(lampX - 0.08 * scale, lampY, 0.16 * scale, lampHeight * scale);
        ctx.fillRect(lampX - 0.08 * scale, lampY, 0.9 * scale, 0.1 * scale);
        ctx.fillStyle = "#ffd28a";
        ctx.fillRect(lampX + 0.6 * scale, lampY + 0.1 * scale, 0.3 * scale, 0.18 * scale);
        drawGlow(lampX + 0.75 * scale, lampY + 0.2 * scale, 4 * scale, warmLight, 0.6);
      });
    },
  };
}

function createCityLayers(seed) {
  const farRow = createCityLayer({
    seed: seed + 1,
    z: 230,
    plotWidth: 26,
    minHeight: 18,
    heightRange: 60,
    color: "#161a35",
    windowColor: "#d9a35e",
    litChance: 0.08,
    edgeAlpha: 0.1,
    windowGlow: 0,
  });
  const nearRow = createCityLayer({
    seed: seed + 2,
    z: 70,
    plotWidth: 22,
    minHeight: 10,
    heightRange: 40,
    color: "#0c0e1c",
    windowColor: "#ffc76e",
    litChance: 0.22,
    edgeAlpha: 0.25,
    windowGlow: 0.35,
  });
  return [farRow, nearRow, createYardLayer(seed + 3), createStreetLampLayer(seed + 4)];
}
