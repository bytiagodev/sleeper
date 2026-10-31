const sleeperSpacing = 0.65;
const sleeperLength = 2.6;
const sleeperWidth = 0.24;
const ballastHalfWidth = 2.5;
const railJointSpacing = 25;

function createTrackLayer() {
  const trackZ = camera.trackZ;

  return {
    z: trackZ + 0.01, // just behind the train
    draw() {
      const width = window.innerWidth;

      const ballastTop = groundYAt(trackZ + ballastHalfWidth);
      const ballastBottom = groundYAt(trackZ - ballastHalfWidth);
      const ballast = ctx.createLinearGradient(0, ballastTop, 0, ballastBottom);
      ballast.addColorStop(0, "#1a1c2c");
      ballast.addColorStop(1, "#11131f");
      ctx.fillStyle = ballast;
      ctx.fillRect(0, ballastTop, width, ballastBottom - ballastTop);

      // A sleeper's far end is further away than its near end, so it is
      // drawn narrower and closer to the middle of the screen. That is why
      // each sleeper is a four-cornered shape rather than a rectangle.
      const farZ = trackZ + sleeperLength / 2;
      const nearZ = trackZ - sleeperLength / 2;
      const farY = groundYAt(farZ);
      const nearY = groundYAt(nearZ);
      const half = sleeperWidth / 2;

      ctx.fillStyle = "#2a2631";
      ctx.beginPath();
      forEachSlot(farZ, sleeperSpacing, 1, (index, x) => {
        ctx.moveTo(screenXAt(x - half, farZ), farY);
        ctx.lineTo(screenXAt(x + half, farZ), farY);
        ctx.lineTo(screenXAt(x + half, nearZ), nearY);
        ctx.lineTo(screenXAt(x - half, nearZ), nearY);
        ctx.closePath();
      });
      ctx.fill();

      drawRail(trackZ + gauge / 2);
      drawRail(trackZ - gauge / 2);
    },
  };
}

function drawRail(railZ) {
  const width = window.innerWidth;
  const baseY = groundYAt(railZ);
  const headHeight = Math.max(2, railHeight * scaleAt(railZ));
  const topY = baseY - headHeight;

  ctx.fillStyle = "#0b0c12";
  ctx.fillRect(0, baseY, width, 2);
  ctx.fillStyle = "#262a3a";
  ctx.fillRect(0, topY, width, headHeight);
  ctx.fillStyle = "rgba(160, 175, 230, 0.55)";
  ctx.fillRect(0, topY, width, 1);

  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  forEachSlot(railZ, railJointSpacing, 0, (index, x) => {
    ctx.fillRect(screenXAt(x, railZ), topY, 1.5, headHeight);
  });
}

// Telegraph poles appear in every landscape. Because they are always 8 m
// tall, they show the scale of everything around them.
function createPoleLayer(seed) {
  const z = camera.trackZ + 8;
  const spacing = 55;
  const poleHeight = 8;

  return {
    z,
    draw() {
      const scale = scaleAt(z);
      const baseY = groundYAt(z);
      const poleWidth = Math.max(1.5, 0.24 * scale);
      const armTops = [];

      const poles = new Path2D();
      forEachSlot(z, spacing, spacing, (index, x) => {
        const random = seededRandom(seed, index);
        const lean = (random() - 0.5) * 0.25 * scale;
        const bottomX = screenXAt(x, z);
        const topX = bottomX + lean;
        const topY = baseY - poleHeight * scale;

        poles.moveTo(bottomX - poleWidth / 2, baseY);
        poles.lineTo(topX - poleWidth / 2, topY);
        poles.lineTo(topX + poleWidth / 2, topY);
        poles.lineTo(bottomX + poleWidth / 2, baseY);
        poles.closePath();

        const armY = topY + 0.5 * scale;
        const armThickness = Math.max(1, 0.12 * scale);
        poles.rect(topX - 0.9 * scale, armY, 1.8 * scale, armThickness);
        poles.rect(topX - 0.6 * scale, armY + 0.7 * scale, 1.2 * scale, armThickness);

        armTops.push({ x: topX, y: armY });
      });
      fillWithMoonlitEdge(poles, hazed("#0b0d1a", z), 0.35 * (1 - hazeAt(z)));

      ctx.strokeStyle = "rgba(22, 26, 48, 0.9)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (const offset of [-0.75, -0.3, 0.3, 0.75]) {
        for (let i = 1; i < armTops.length; i++) {
          const from = armTops[i - 1];
          const to = armTops[i];
          const shift = offset * scale;
          const sag = 0.9 * scale;
          ctx.moveTo(from.x + shift, from.y);
          ctx.quadraticCurveTo((from.x + to.x) / 2 + shift, from.y + sag, to.x + shift, to.y);
        }
      }
      ctx.stroke();
    },
  };
}

// Grass between the camera and the track. It is the closest thing to the
// camera, so it moves fastest and gives the scene its sense of speed.
function createVergeLayer(seed) {
  const rowDistances = [9.6, 8.9, 8, 7.1, 6.3]; // far to near

  return {
    z: 6,
    draw() {
      ctx.fillStyle = "#04050a";
      ctx.beginPath();
      rowDistances.forEach((z, row) => {
        const scale = scaleAt(z);
        const baseY = groundYAt(z);
        forEachSlot(z, 0.9, 1, (index, x) => {
          const random = seededRandom(seed + row, index);
          if (random() < 0.6) return;
          const tuftX = screenXAt(x + random(), z);
          const tuftHeight = (0.12 + random() * random() * 0.5) * scale;
          const tuftWidth = (0.25 + random() * 0.35) * scale;
          traceTuft(ctx, tuftX, baseY, tuftWidth, tuftHeight);
        });
      });
      ctx.fill();
    },
  };
}

// Three blades of grass growing from one root, added to a path.
function traceTuft(path, x, baseY, width, height) {
  path.moveTo(x - width / 2, baseY);
  path.lineTo(x - width * 0.45, baseY - height * 0.75);
  path.lineTo(x - width * 0.1, baseY);
  path.lineTo(x, baseY - height);
  path.lineTo(x + width * 0.12, baseY);
  path.lineTo(x + width / 2, baseY - height * 0.65);
  path.lineTo(x + width / 2, baseY);
  path.closePath();
}
