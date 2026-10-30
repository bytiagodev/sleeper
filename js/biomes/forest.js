// A pine is three stacked triangles, widest at the bottom.
function tracePine(centerX, baseY, width, height) {
  const tierHeight = height / 2;
  const tierStep = tierHeight / 2;
  const tierWidths = [width * 0.5, width * 0.75, width];

  tierWidths.forEach((tierWidth, tier) => {
    const tierTop = baseY - height + tier * tierStep;
    const tierBottom = tierTop + tierHeight;
    ctx.moveTo(centerX, tierTop);
    ctx.lineTo(centerX - tierWidth / 2, tierBottom);
    ctx.lineTo(centerX + tierWidth / 2, tierBottom);
    ctx.closePath();
  });
}

function createTreeRow({ seed, z, spacing, minHeight, heightRange, color, gapChance }) {
  return {
    z,
    draw() {
      const scale = scaleAt(z);
      const baseY = groundYAt(z);
      ctx.fillStyle = color;
      ctx.beginPath();
      forEachSlot(z, spacing, 8, (index, x) => {
        const random = seededRandom(seed, index);
        if (random() < gapChance) return;
        const height = minHeight + random() * heightRange;
        const width = height * (0.36 + random() * 0.16);
        const treeX = x + (random() - 0.5) * spacing * 0.8;
        tracePine(screenXAt(treeX, z), baseY, width * scale, height * scale);
      });
      ctx.fill();
    },
  };
}

// Far rows are lighter because distance fades them towards the sky.
function createForestLayers(seed) {
  return [
    createTreeRow({ seed: seed + 1, z: 95, spacing: 4.5, minHeight: 12, heightRange: 10, color: "#11142a", gapChance: 0.1 }),
    createTreeRow({ seed: seed + 2, z: 48, spacing: 4.2, minHeight: 14, heightRange: 11, color: "#0a0c19", gapChance: 0.12 }),
    createTreeRow({ seed: seed + 3, z: 27, spacing: 4.6, minHeight: 15, heightRange: 12, color: "#05060d", gapChance: 0.18 }),
  ];
}
