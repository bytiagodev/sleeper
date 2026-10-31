function createHillsLayer(seed) {
  const z = 1800;
  const fill = hazed("#151a30", z);
  return {
    z,
    draw() {
      const scale = scaleAt(z);
      const baseY = groundYAt(z);
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(-10, baseY + 2);
      for (let screenX = -10; screenX <= window.innerWidth + 10; screenX += 6) {
        const hillHeight = 4 + layeredNoise(worldXAt(screenX, z) / 260, seed) * 40;
        ctx.lineTo(screenX, baseY - hillHeight * scale);
      }
      ctx.lineTo(window.innerWidth + 10, baseY + 2);
      ctx.fill();
    },
  };
}

// A barn and a silo. All sizes are in metres; m() turns them into pixels.
function drawFarm(left, baseY, scale, z, hasLitWindow) {
  const m = (metres) => metres * scale;
  const wallColor = hazed("#0f1322", z);
  const roofColor = hazed("#080a14", z);

  ctx.fillStyle = wallColor;
  ctx.fillRect(left, baseY - m(6), m(14), m(6));

  ctx.fillStyle = roofColor;
  ctx.beginPath();
  ctx.moveTo(left - m(0.6), baseY - m(6));
  ctx.lineTo(left + m(2), baseY - m(9.5));
  ctx.lineTo(left + m(7), baseY - m(11));
  ctx.lineTo(left + m(12), baseY - m(9.5));
  ctx.lineTo(left + m(14.6), baseY - m(6));
  ctx.fill();

  ctx.fillStyle = hazed("#05060d", z);
  ctx.fillRect(left + m(5.2), baseY - m(4), m(3.6), m(4));

  if (hasLitWindow) {
    ctx.fillStyle = "#ffc76e";
    ctx.fillRect(left + m(1.5), baseY - m(4.3), m(1.3), m(1.3));
    drawGlow(left + m(2.15), baseY - m(3.65), m(4), warmLight, 0.5 * (1 - hazeAt(z)));
  }

  const siloLeft = left + m(15);
  ctx.fillStyle = wallColor;
  ctx.fillRect(siloLeft, baseY - m(13), m(4.4), m(13));
  ctx.fillStyle = roofColor;
  ctx.beginPath();
  ctx.moveTo(siloLeft - m(0.3), baseY - m(13));
  ctx.lineTo(siloLeft + m(2.2), baseY - m(15));
  ctx.lineTo(siloLeft + m(4.7), baseY - m(13));
  ctx.fill();
}

function createFarmLayer(seed) {
  const z = 75;
  const spacing = 260;
  return {
    z,
    draw() {
      const scale = scaleAt(z);
      const baseY = groundYAt(z);
      forEachSlot(z, spacing, 30, (index, x) => {
        const random = seededRandom(seed, index);
        if (random() > 0.55) return;
        const farmX = x + random() * (spacing - 30);
        const hasLitWindow = random() < 0.6;
        drawFarm(screenXAt(farmX, z), baseY, scale, z, hasLitWindow);
      });
    },
  };
}

function createLoneTreeLayer(seed, z) {
  const spacing = 60;
  const fill = hazed("#0b0e1d", z);
  return {
    z,
    draw() {
      const scale = scaleAt(z);
      const baseY = groundYAt(z);
      ctx.fillStyle = fill;
      ctx.beginPath();
      forEachSlot(z, spacing, 15, (index, x) => {
        const random = seededRandom(seed, index);
        if (random() > 0.35) return;
        const treeX = screenXAt(x + random() * spacing, z);
        const treeHeight = (8 + random() * 7) * scale;
        const trunkWidth = Math.max(1, 0.5 * scale);
        ctx.rect(treeX - trunkWidth / 2, baseY - treeHeight / 2, trunkWidth, treeHeight / 2);

        // The crown is five overlapping circles.
        for (let i = 0; i < 5; i++) {
          const circleX = treeX + (random() - 0.5) * treeHeight * 0.55;
          const circleY = baseY - treeHeight * (0.55 + random() * 0.3);
          const radius = treeHeight * (0.17 + random() * 0.1);
          ctx.moveTo(circleX + radius, circleY);
          ctx.arc(circleX, circleY, radius, 0, Math.PI * 2);
        }
      });
      ctx.fill();
    },
  };
}

function createFenceLayer(seed) {
  const z = camera.trackZ + 5;
  const spacing = 3.2;
  const postHeight = 1.3;
  const fill = hazed("#10141f", z);
  return {
    z,
    draw() {
      const scale = scaleAt(z);
      const baseY = groundYAt(z);
      const postWidth = Math.max(1.5, 0.14 * scale);

      ctx.fillStyle = fill;
      ctx.beginPath();
      forEachSlot(z, spacing, spacing, (index, x) => {
        const random = seededRandom(seed, index);
        const postX = screenXAt(x, z);
        const height = (postHeight - random() * 0.2) * scale;
        const lean = (random() - 0.5) * 0.12 * scale;
        ctx.moveTo(postX - postWidth / 2, baseY);
        ctx.lineTo(postX + postWidth / 2, baseY);
        ctx.lineTo(postX + postWidth / 2 + lean, baseY - height);
        ctx.lineTo(postX - postWidth / 2 + lean, baseY - height);
        ctx.closePath();
      });
      ctx.fill();

      ctx.fillRect(0, baseY - 1.05 * scale, window.innerWidth, 1);
      ctx.fillRect(0, baseY - 0.55 * scale, window.innerWidth, 1);
    },
  };
}

// A hedge along a field boundary: a lumpy band of bushes, about two metres
// high, with the odd gap for a gate.
function createHedgeLayer(seed) {
  const z = 58;
  const fill = hazed("#090c18", z);
  return {
    z,
    draw() {
      const scale = scaleAt(z);
      const baseY = groundYAt(z);
      const hedge = new Path2D();
      let inHedge = false;
      for (let screenX = -6; screenX <= window.innerWidth + 6; screenX += 4) {
        const x = worldXAt(screenX, z);
        const isGap = smoothNoise(x / 40, seed) < 0.22;
        const height = (1.4 + layeredNoise(x / 3, seed + 1, 3) * 1.4) * scale;
        if (isGap) {
          if (inHedge) hedge.lineTo(screenX, baseY);
          inHedge = false;
          continue;
        }
        if (!inHedge) hedge.moveTo(screenX, baseY);
        hedge.lineTo(screenX, baseY - height);
        inHedge = true;
      }
      if (inHedge) hedge.lineTo(window.innerWidth + 6, baseY);
      fillWithMoonlitEdge(hedge, fill, 0.18);
    },
  };
}

// Furrows run straight away from the camera, so in perspective they all
// point at the same spot on the horizon.
function createFurrowLayer(z, nearZ, farZ) {
  const spacing = 7;
  return {
    z,
    draw() {
      const nearY = groundYAt(nearZ);
      const farY = groundYAt(farZ);
      const fade = ctx.createLinearGradient(0, farY, 0, nearY);
      fade.addColorStop(0, "rgba(110, 120, 160, 0)");
      fade.addColorStop(1, "rgba(110, 120, 160, 0.16)");
      ctx.strokeStyle = fade;
      ctx.lineWidth = 1;
      ctx.beginPath();
      forEachSlot(nearZ, spacing, 0, (index, x) => {
        ctx.moveTo(screenXAt(x, farZ), farY);
        ctx.lineTo(screenXAt(x, nearZ), nearY);
      });
      ctx.stroke();
    },
  };
}

function createFieldsLayers(seed) {
  const trackZ = camera.trackZ;
  return [
    createHillsLayer(seed + 1),
    createFurrowLayer(1700, trackZ + 3, 300), // behind the track
    createLoneTreeLayer(seed + 2, 170),
    createFarmLayer(seed + 3),
    createHedgeLayer(seed + 6),
    createLoneTreeLayer(seed + 4, 42),
    createFenceLayer(seed + 5),
    createFurrowLayer(trackZ - 3, 6, trackZ - 3), // in front of the track
  ];
}
