// A pine: a thin trunk and layers of drooping branches, wider towards the
// bottom. Each layer reaches a slightly different distance on each side,
// so no two trees are the same and none is perfectly symmetrical.
function tracePine(path, centerX, baseY, width, height, random) {
  const top = baseY - height;
  const layerCount = 9;
  const layers = [];
  for (let layer = 1; layer <= layerCount; layer++) {
    const progress = layer / layerCount;
    // Square root: the tree widens quickly near the top, then more slowly,
    // which gives the rounded cone of a real spruce rather than a triangle.
    const widening = Math.sqrt(progress);
    layers.push({
      tipY: top + height * 0.88 * progress,
      leftReach: (width / 2) * widening * (0.7 + random() * 0.6),
      rightReach: (width / 2) * widening * (0.7 + random() * 0.6),
    });
  }
  // Each branch layer ends in a tip, then the outline steps back in towards
  // the trunk, a little higher up, before the next layer starts.
  const notchRise = height * 0.03;

  path.moveTo(centerX, top);
  for (const layer of layers) {
    path.lineTo(centerX + layer.rightReach * 0.6, layer.tipY - notchRise);
    path.lineTo(centerX + layer.rightReach, layer.tipY);
  }
  path.lineTo(centerX + width * 0.04, baseY);
  path.lineTo(centerX - width * 0.04, baseY);
  for (const layer of [...layers].reverse()) {
    path.lineTo(centerX - layer.leftReach, layer.tipY);
    path.lineTo(centerX - layer.leftReach * 0.6, layer.tipY - notchRise);
  }
  path.closePath();
}

function createTreeRow({ seed, z, spacing, minHeight, heightRange, color, gapChance, edgeAlpha }) {
  const fill = hazed(color, z);
  const edge = edgeAlpha * (1 - hazeAt(z));

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
        tracePine(trees, screenXAt(treeX, z), baseY, width * scale, height * scale, random);
      });
      fillWithMoonlitEdge(trees, fill, edge);
    },
  };
}

// Low bushes and young trees just behind the track.
function createUndergrowthLayer(seed) {
  const z = 17;
  const fill = hazed("#06070d", z);

  return {
    z,
    draw() {
      const scale = scaleAt(z);
      const baseY = groundYAt(z);
      const bushes = new Path2D();
      forEachSlot(z, 2.2, 3, (index, x) => {
        const random = seededRandom(seed, index);
        if (random() < 0.35) return;
        const bushX = screenXAt(x + random() * 2, z);
        const bushHeight = (0.8 + random() * 1.6) * scale;
        // A bush is a few overlapping circles sitting on the ground.
        for (let i = 0; i < 4; i++) {
          const radius = bushHeight * (0.35 + random() * 0.25);
          const circleX = bushX + (random() - 0.5) * bushHeight * 1.4;
          const circleY = baseY - radius * (0.6 + random() * 0.6);
          bushes.moveTo(circleX + radius, circleY);
          bushes.arc(circleX, circleY, radius, 0, Math.PI * 2);
        }
      });
      fillWithMoonlitEdge(bushes, fill, 0.25);
    },
  };
}

function createForestLayers(seed) {
  return [
    createTreeRow({ seed: seed + 1, z: 95, spacing: 4.5, minHeight: 12, heightRange: 10, color: "#11142a", gapChance: 0.1, edgeAlpha: 0.12 }),
    createTreeRow({ seed: seed + 2, z: 48, spacing: 4.2, minHeight: 14, heightRange: 11, color: "#0a0c19", gapChance: 0.12, edgeAlpha: 0.2 }),
    createTreeRow({ seed: seed + 3, z: 27, spacing: 4.6, minHeight: 15, heightRange: 12, color: "#05060d", gapChance: 0.18, edgeAlpha: 0.3 }),
    createUndergrowthLayer(seed + 4),
  ];
}
