// A pine is three stacked triangles, widest at the bottom.
function tracePine(path, centerX, baseY, width, height) {
  const tierHeight = height / 2;
  const tierStep = tierHeight / 2;
  const tierWidths = [width * 0.5, width * 0.75, width];

  tierWidths.forEach((tierWidth, tier) => {
    const tierTop = baseY - height + tier * tierStep;
    const tierBottom = tierTop + tierHeight;
    path.moveTo(centerX, tierTop);
    path.lineTo(centerX - tierWidth / 2, tierBottom);
    path.lineTo(centerX + tierWidth / 2, tierBottom);
    path.closePath();
  });
}

function createTreeRow({ seed, z, spacing, minHeight, heightRange, color, gapChance, edgeAlpha }) {
  return {
    z,
    draw() {
      const scale = scaleAt(z);
      const baseY = groundYAt(z);
      const trees = new Path2D();
      forEachSlot(z, spacing, 8, (index, x) => {
        const random = seededRandom(seed, index);
        if (random() < gapChance) return;
        const height = minHeight + random() * heightRange;
        const width = height * (0.36 + random() * 0.16);
        const treeX = x + (random() - 0.5) * spacing * 0.8;
        tracePine(trees, screenXAt(treeX, z), baseY, width * scale, height * scale);
      });
      fillWithMoonlitEdge(trees, color, edgeAlpha);
    },
  };
}

// Far rows are lighter because distance fades them towards the sky.
function createForestLayers(seed) {
  return [
    createTreeRow({ seed: seed + 1, z: 95, spacing: 4.5, minHeight: 12, heightRange: 10, color: "#11142a", gapChance: 0.1, edgeAlpha: 0.12 }),
    createTreeRow({ seed: seed + 2, z: 48, spacing: 4.2, minHeight: 14, heightRange: 11, color: "#0a0c19", gapChance: 0.12, edgeAlpha: 0.2 }),
    createTreeRow({ seed: seed + 3, z: 27, spacing: 4.6, minHeight: 15, heightRange: 12, color: "#05060d", gapChance: 0.18, edgeAlpha: 0.3 }),
  ];
}
