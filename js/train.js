// The train is drawn in its own units, 20 to a metre, and then scaled to
// the camera so it matches everything else on the track.
const trainUnitsPerMetre = 20;
const carriageWidth = 210;
const couplingGap = 12;
const tenderWidth = 88;
const locomotiveWidth = 202;

const bodyColor = "#141935";
const edgeColor = "#3d4577";
const lampColor = "#ffc76e";
const dimLampColor = "#c98f4a";

let carriageWindowSets = [];

function drawWheel(centerX, centerY, radius, distance) {
  const angle = distance / radius;
  const spokeLength = radius * 0.85;

  ctx.fillStyle = bodyColor;
  ctx.strokeStyle = edgeColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let spoke = 0; spoke < 3; spoke++) {
    const spokeAngle = angle + (spoke * Math.PI) / 3;
    const dx = Math.cos(spokeAngle) * spokeLength;
    const dy = Math.sin(spokeAngle) * spokeLength;
    ctx.moveTo(centerX - dx, centerY - dy);
    ctx.lineTo(centerX + dx, centerY + dy);
  }
  ctx.stroke();

  ctx.fillStyle = edgeColor;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawLocomotive(leftX, railY, distance) {
  const frameTop = railY - 26;
  const cabWidth = 50;
  const cabTop = railY - 92;
  const boilerLeft = leftX + 46;
  const boilerRight = leftX + 178;
  const boilerTop = railY - 70;
  const boilerBottom = railY - 28;
  const chimneyX = leftX + 156;

  ctx.fillStyle = bodyColor;
  ctx.fillRect(leftX, frameTop, 200, 7);
  ctx.fillRect(leftX, cabTop + 5, cabWidth, frameTop - cabTop - 5);
  ctx.fillRect(leftX - 5, cabTop, cabWidth + 10, 6);

  ctx.beginPath();
  ctx.roundRect(boilerLeft, boilerTop, boilerRight - boilerLeft, boilerBottom - boilerTop, [3, 14, 14, 3]);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(chimneyX - 5, boilerTop + 2);
  ctx.lineTo(chimneyX - 5, boilerTop - 16);
  ctx.lineTo(chimneyX - 10, boilerTop - 26);
  ctx.lineTo(chimneyX + 10, boilerTop - 26);
  ctx.lineTo(chimneyX + 5, boilerTop - 16);
  ctx.lineTo(chimneyX + 5, boilerTop + 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(leftX + 92, boilerTop + 1, 11, Math.PI, 0);
  ctx.arc(leftX + 124, boilerTop + 1, 7, Math.PI, 0);
  ctx.fill();

  ctx.fillRect(leftX + 150, railY - 36, 26, 14);
  ctx.beginPath();
  ctx.moveTo(leftX + 176, railY - 26);
  ctx.lineTo(leftX + 202, railY - 3);
  ctx.lineTo(leftX + 176, railY - 3);
  ctx.fill();

  ctx.fillStyle = edgeColor;
  ctx.fillRect(leftX - 3, cabTop, cabWidth + 6, 1.5);
  ctx.fillRect(boilerLeft + 6, boilerTop, boilerRight - boilerLeft - 26, 1.5);
  ctx.fillRect(chimneyX - 9, boilerTop - 26, 18, 1.5);

  // The coupling rod is pinned off-centre on each wheel, so as the wheels
  // turn, the rod goes round in a circle with them.
  const wheelY = railY - 17;
  const wheelXs = [leftX + 70, leftX + 106, leftX + 142];
  const pinAngle = distance / 17;
  const pinX = Math.cos(pinAngle) * 8;
  const pinY = Math.sin(pinAngle) * 8;

  for (const wheelX of wheelXs) drawWheel(wheelX, wheelY, 17, distance);

  ctx.strokeStyle = edgeColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(wheelXs[0] + pinX, wheelY + pinY);
  ctx.lineTo(wheelXs[2] + pinX, wheelY + pinY);
  ctx.lineTo(leftX + 164, wheelY - 3);
  ctx.stroke();

  drawWheel(leftX + 172, railY - 8, 7, distance);
  drawLocomotiveLights(leftX, railY);
}

// Kept separate from the body so a tunnel can draw only the lights.
function drawLocomotiveLights(leftX, railY) {
  const cabTop = railY - 92;
  const lampX = leftX + 176;
  const lampY = railY - 54;

  ctx.fillStyle = lampColor;
  ctx.shadowColor = "rgba(255, 199, 110, 0.7)";
  ctx.shadowBlur = 16;
  ctx.fillRect(leftX + 11, cabTop + 16, 28, 20);
  ctx.shadowBlur = 0;

  const beamEndX = lampX + 170;
  const beamEndY = lampY + 12;
  const beam = ctx.createLinearGradient(lampX, 0, beamEndX, 0);
  beam.addColorStop(0, "rgba(255, 199, 110, 0.35)");
  beam.addColorStop(1, "rgba(255, 199, 110, 0)");
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(lampX, lampY - 2);
  ctx.lineTo(beamEndX, beamEndY - 22);
  ctx.lineTo(beamEndX, beamEndY + 22);
  ctx.lineTo(lampX, lampY + 2);
  ctx.fill();

  ctx.fillStyle = lampColor;
  ctx.shadowColor = "rgba(255, 199, 110, 0.8)";
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(lampX, lampY, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawTender(leftX, railY, distance) {
  const width = 78;
  const top = railY - 62;
  const bottom = railY - 20;

  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.roundRect(leftX, top, width, bottom - top, 3);
  ctx.fill();
  ctx.fillRect(leftX, railY - 26, width + 10, 6);
  ctx.fillRect(leftX + width, railY - 24, 10, 4);

  // The coal heaped above the rim
  ctx.beginPath();
  ctx.moveTo(leftX + 6, top + 1);
  ctx.lineTo(leftX + 16, top - 9);
  ctx.lineTo(leftX + 30, top - 13);
  ctx.lineTo(leftX + 46, top - 10);
  ctx.lineTo(leftX + 62, top - 14);
  ctx.lineTo(leftX + 72, top - 6);
  ctx.lineTo(leftX + 72, top + 1);
  ctx.fill();

  ctx.fillStyle = edgeColor;
  ctx.fillRect(leftX + 3, top, width - 6, 1.5);

  for (const offset of [11, 30, 50, 69]) {
    drawWheel(leftX + offset, railY - 9, 9, distance);
  }
}

function createCarriageWindows(random) {
  const panes = [];
  for (let i = 0; i < 7; i++) {
    panes.push({
      dim: random() < 0.25,
      passenger: random() < 0.4,
      passengerX: 5 + random() * 8,
      drips: [],
    });
  }
  for (const pane of panes) {
    for (let i = 0; i < 2; i++) {
      pane.drips.push({
        x: 2 + random() * 14,
        speed: 0.12 + random() * 0.2,
        start: random(),
      });
    }
  }
  return panes;
}

function createCarriageWindowSets() {
  const sets = [];
  for (let i = 0; i < journey.train.carriages; i++) {
    sets.push(createCarriageWindows(seededRandom(journey.seed + 1000, i)));
  }
  return sets;
}

function traceCarriageRoof(leftX, bodyTop) {
  ctx.moveTo(leftX, bodyTop + 8);
  ctx.quadraticCurveTo(leftX + carriageWidth / 2, bodyTop - 6, leftX + carriageWidth, bodyTop + 8);
}

function drawCarriage(leftX, railY, panes, distance) {
  const bodyTop = railY - 78;
  const bodyBottom = railY - 20;

  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  traceCarriageRoof(leftX, bodyTop);
  ctx.lineTo(leftX + carriageWidth, bodyBottom);
  ctx.lineTo(leftX, bodyBottom);
  ctx.fill();
  ctx.fillRect(leftX, railY - 26, carriageWidth + couplingGap, 6);

  ctx.strokeStyle = edgeColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  traceCarriageRoof(leftX, bodyTop);
  ctx.stroke();

  drawCarriageGlass(leftX, railY, panes);

  for (const offset of [22, 40, 170, 188]) {
    drawWheel(leftX + offset, railY - 9, 9, distance);
  }
}

// Kept separate from the body so a tunnel can draw only the lit windows.
function drawCarriageGlass(leftX, railY, panes) {
  const windowTop = railY - 62;
  // Wet air spreads light further, so the glow doubles in the rain.
  let glowSize = 1;
  if (activeWeather === "rain") glowSize = 2;

  panes.forEach((pane, i) => {
    const windowX = leftX + 14 + i * 28;
    if (pane.dim) {
      ctx.fillStyle = dimLampColor;
      ctx.shadowColor = "rgba(201, 143, 74, 0.4)";
      ctx.shadowBlur = 4 * glowSize;
    } else {
      ctx.fillStyle = lampColor;
      ctx.shadowColor = "rgba(255, 199, 110, 0.6)";
      ctx.shadowBlur = 8 * glowSize;
    }
    ctx.fillRect(windowX, windowTop, 18, 22);
  });
  ctx.shadowBlur = 0;

  ctx.fillStyle = bodyColor;
  panes.forEach((pane, i) => {
    if (!pane.passenger) return;
    const personX = leftX + 14 + i * 28 + pane.passengerX;
    ctx.beginPath();
    ctx.arc(personX, windowTop + 11, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(personX, windowTop + 22, 6, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  if (activeWeather === "rain") drawWindowDrips(leftX, windowTop, panes);
}

function drawWindowDrips(leftX, windowTop, panes) {
  const seconds = performance.now() / 1000;
  const paneHeight = 22;
  const dripLength = 6;
  ctx.fillStyle = "rgba(255, 236, 200, 0.55)";
  panes.forEach((pane, i) => {
    for (const drip of pane.drips) {
      // % 1 keeps only the decimals, so each drip runs 0 to 1, then restarts.
      const progress = (seconds * drip.speed + drip.start) % 1;
      const dripY = windowTop + progress * (paneHeight - dripLength);
      ctx.fillRect(Math.floor(leftX + 14 + i * 28 + drip.x), dripY, 1, dripLength);
    }
  });
}

function drawTailLamp(lampX, railY) {
  ctx.fillStyle = edgeColor;
  ctx.fillRect(lampX, railY - 29, 7, 2);

  ctx.fillStyle = "#e84a4a";
  ctx.shadowColor = "rgba(232, 74, 74, 0.8)";
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(lampX, railY - 28, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function getTrainLayout() {
  const seconds = performance.now() / 1000;
  const carriageSpacing = carriageWidth + couplingGap;
  const carriageCount = carriageWindowSets.length;
  const trainWidth = carriageCount * carriageSpacing + tenderWidth + locomotiveWidth;
  const scale = camera.pxPerMetre / trainUnitsPerMetre;

  // Centre the train if it fits. If not, keep the locomotive on screen and
  // let the last carriages run off the left edge.
  const screenWidth = trainWidth * scale;
  let screenLeft = (window.innerWidth - screenWidth) / 2;
  if (screenWidth > window.innerWidth * 0.96) {
    screenLeft = window.innerWidth - screenWidth - 12;
  }

  const trainLeft = screenLeft / scale;
  const tenderLeft = trainLeft + carriageCount * carriageSpacing;

  return {
    railY: camera.railY,
    bob: Math.sin(seconds * 1.7) * 0.6 + Math.sin(seconds * 4.3) * 0.25,
    scale,
    trainLeft,
    carriageSpacing,
    tenderLeft,
    locomotiveLeft: tenderLeft + tenderWidth,
    distance: travelled * trainUnitsPerMetre,
  };
}

// Scales the train around the rail, so it stays standing on it.
function applyTrainTransform(train) {
  ctx.translate(0, train.railY + train.bob);
  ctx.scale(train.scale, train.scale);
  ctx.translate(0, -train.railY);
}

function drawTrain() {
  const train = getTrainLayout();
  ctx.save();
  applyTrainTransform(train);
  carriageWindowSets.forEach((panes, i) => {
    const carriageLeft = train.trainLeft + i * train.carriageSpacing;
    drawCarriage(carriageLeft, train.railY, panes, train.distance);
  });
  drawTender(train.tenderLeft, train.railY, train.distance);
  drawLocomotive(train.locomotiveLeft, train.railY, train.distance);
  drawTailLamp(train.trainLeft - 6, train.railY);
  ctx.restore();
}

function drawTrainLights() {
  const train = getTrainLayout();
  ctx.save();
  applyTrainTransform(train);
  carriageWindowSets.forEach((panes, i) => {
    const carriageLeft = train.trainLeft + i * train.carriageSpacing;
    drawCarriageGlass(carriageLeft, train.railY, panes);
  });
  drawLocomotiveLights(train.locomotiveLeft, train.railY);
  drawTailLamp(train.trainLeft - 6, train.railY);
  ctx.restore();
}
