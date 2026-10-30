function createCityLayer({ seed, z, plotWidth, minHeight, heightRange, color, windowColor, litChance, edgeAlpha, windowGlow }) {
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

        if (random() < 0.3) {
          const antennaHeight = (3 + random() * 8) * scale;
          const antennaWidth = Math.max(1, 0.3 * scale);
          buildings.rect((left + right) / 2, roofY - antennaHeight, antennaWidth, antennaHeight);
        }

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

      fillWithMoonlitEdge(buildings, color, edgeAlpha);

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
  return [farRow, nearRow];
}
