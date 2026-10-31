const carriageLength = 11.5;
const windowCount = 8;
const windowWidth = 0.72;
const windowTop = -2.75;
const windowHeight = 1.0;
const bodyTop = -3.6;
const bodyBottom = -0.95;

function windowX(index) {
  return 1.35 + index * 1.15;
}

function createCarriageWindows(random) {
  const windows = [];
  for (let i = 0; i < windowCount; i++) {
    const roll = random();
    // Some compartments are dark: their passengers are already asleep.
    let state = "lit";
    if (roll < 0.2) state = "dark";
    else if (roll < 0.45) state = "dim";

    windows.push({
      state,
      curtain: random() < 0.5 ? 0.12 + random() * 0.12 : 0,
      passenger: random() < 0.45,
      passengerX: 0.2 + random() * 0.3,
      drips: [0, 1].map(() => ({ x: 0.08 + random() * 0.55, speed: 0.12 + random() * 0.2, start: random() })),
    });
  }
  return windows;
}

function getLivery() {
  return liveries[journey.train.livery];
}

function drawCarriage(carriage, pixel) {
  const length = carriage.length;
  const livery = getLivery();

  for (const bogieX of [1.9, length - 1.9]) drawBogie(bogieX, pixel);

  ctx.fillStyle = "#0d0e15";
  ctx.fillRect(0.15, bodyBottom, length - 0.3, 0.22);
  ctx.fillRect(4.6, bodyBottom + 0.2, 2.3, 0.35);
  // Truss rods under the floor, which stop a long carriage from sagging
  ctx.strokeStyle = "#0d0e15";
  ctx.lineWidth = pixel * 2;
  ctx.beginPath();
  ctx.moveTo(3, bodyBottom + 0.2);
  ctx.lineTo(4.2, -0.45);
  ctx.lineTo(length - 4.2, -0.45);
  ctx.lineTo(length - 3, bodyBottom + 0.2);
  ctx.stroke();

  const body = ctx.createLinearGradient(0, bodyTop, 0, bodyBottom);
  body.addColorStop(0, livery.light);
  body.addColorStop(0.15, livery.body);
  body.addColorStop(0.8, livery.body);
  body.addColorStop(1, livery.dark);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.roundRect(0, bodyTop, length, bodyBottom - bodyTop, 0.08);
  ctx.fill();

  // Panel joints below the windows
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  for (let i = 0; i <= windowCount; i++) {
    ctx.fillRect(windowX(i) - 0.22, -1.6, pixel, 0.55);
  }

  ctx.fillStyle = liningColor;
  ctx.fillRect(0.1, -3.32, length - 0.2, pixel);
  ctx.fillRect(0.1, -1.62, length - 0.2, pixel);
  ctx.fillRect(0.1, -1.08, length - 0.2, pixel);
  drawLettering("SLEEPING CAR", length / 2, -1.24, 0.3, pixel);

  drawCarriageRoof(length, pixel);

  for (const doorX of [0.25, length - 0.95]) {
    ctx.strokeStyle = "rgba(0, 0, 0, 0.45)";
    ctx.lineWidth = pixel;
    ctx.strokeRect(doorX, -3.2, 0.7, 2.15);
    ctx.fillStyle = "#120709";
    ctx.fillRect(doorX + 0.12, -2.95, 0.46, 0.6);
  }

  // Window frames. The glass itself is drawn with the lights.
  ctx.fillStyle = "#120709";
  carriage.windows.forEach((pane, i) => {
    ctx.beginPath();
    ctx.roundRect(windowX(i) - 0.06, windowTop - 0.06, windowWidth + 0.12, windowHeight + 0.12, 0.12);
    ctx.fill();
  });

}

function drawCarriageRoof(length, pixel) {
  ctx.fillStyle = "#1b1d27";
  ctx.beginPath();
  ctx.moveTo(-0.05, bodyTop + 0.05);
  ctx.quadraticCurveTo(length / 2, -4.25, length + 0.05, bodyTop + 0.05);
  ctx.fill();

  ctx.strokeStyle = moonlitEdge;
  ctx.lineWidth = pixel * 1.3;
  ctx.beginPath();
  ctx.moveTo(0.15, bodyTop - 0.03);
  ctx.quadraticCurveTo(length / 2, -4.23, length - 0.15, bodyTop - 0.03);
  ctx.stroke();

  // Roof vents, each sitting on the curve of the roof
  ctx.fillStyle = "#121319";
  for (let ventX = 1.2; ventX < length - 0.8; ventX += 1.6) {
    ctx.beginPath();
    ctx.ellipse(ventX, roofHeightAt(ventX, length) + 0.02, 0.16, 0.08, 0, Math.PI, 0);
    ctx.fill();
  }
}

// How high the roof is at a point along the carriage. The roof is a curve
// pulled up towards -4.25 in the middle; with the pull point in the middle,
// the height follows the simple formula below, highest at the centre.
function roofHeightAt(x, length) {
  const edge = bodyTop + 0.05;
  const along = (x + 0.05) / (length + 0.1);
  return edge + 2 * along * (1 - along) * (-4.25 - edge);
}

function drawBogie(centerX, pixel) {
  ctx.fillStyle = "#0b0c12";
  ctx.fillRect(centerX - 1.4, -0.8, 2.8, 0.32);
  for (const wheelX of [centerX - 0.9, centerX + 0.9]) {
    drawWheel(wheelX, -0.46, 0.46, 10, pixel);
  }
  ctx.fillStyle = "#1d2030";
  ctx.fillRect(centerX - 1.25, -0.62, 2.5, 0.1);
  drawTopEdge(centerX - 1.25, centerX + 1.25, -0.62, pixel);
}

// The glass, the people behind it and the glow. Kept separate from the body
// so a tunnel can draw only these.
function drawCarriageLights(carriage) {
  carriage.windows.forEach((pane, i) => {
    const left = windowX(i);
    const glass = ctx.createLinearGradient(0, windowTop, 0, windowTop + windowHeight);
    if (pane.state === "lit") {
      glass.addColorStop(0, "#ffdca0");
      glass.addColorStop(1, "#f0a24c");
    } else if (pane.state === "dim") {
      glass.addColorStop(0, "#d39552");
      glass.addColorStop(1, "#8c5426");
    } else {
      glass.addColorStop(0, "#1b1420");
      glass.addColorStop(1, "#0e0a12");
    }
    ctx.fillStyle = glass;
    ctx.beginPath();
    ctx.roundRect(left, windowTop, windowWidth, windowHeight, 0.1);
    ctx.fill();
    if (pane.state === "dark") return;

    if (pane.curtain > 0) {
      ctx.fillStyle = "rgba(110, 35, 28, 0.8)";
      ctx.fillRect(left, windowTop, pane.curtain * windowWidth, windowHeight);
      ctx.fillRect(left + windowWidth * (1 - pane.curtain), windowTop, pane.curtain * windowWidth, windowHeight);
    }

    if (pane.passenger) {
      const personX = left + pane.passengerX;
      ctx.fillStyle = "#1d0d0c";
      ctx.beginPath();
      ctx.arc(personX, windowTop + 0.42, 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(personX, windowTop + windowHeight, 0.24, 0.32, 0, Math.PI, 0);
      ctx.fill();
    }

    ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
    ctx.fillRect(left + 0.05, windowTop + 0.05, windowWidth - 0.1, 0.06);

    if (activeWeather === "rain") drawWindowDrips(left, pane);

    let strength = 0.3;
    if (pane.state === "dim") strength = 0.12;
    drawGlow(left + windowWidth / 2, windowTop + windowHeight / 2, 0.9, warmLight, strength);
  });
}

function drawWindowDrips(left, pane) {
  const seconds = performance.now() / 1000;
  const dripLength = 0.25;
  ctx.fillStyle = "rgba(255, 236, 200, 0.55)";
  for (const drip of pane.drips) {
    // % 1 keeps only the decimals, so each drip runs from 0 to 1, then restarts.
    const progress = (seconds * drip.speed + drip.start) % 1;
    const dripY = windowTop + progress * (windowHeight - dripLength);
    ctx.fillRect(left + drip.x, dripY, 0.035, dripLength);
  }
}
