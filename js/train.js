// The train is drawn in metres, like the world. Before drawing, the canvas
// is moved to the train's left end at rail height and scaled so one unit is
// one metre. The canvas y axis points down, so everything above the rail
// has a negative y.

const liveries = [
  { name: "maroon", light: "#4a2230", body: "#33141c", dark: "#16070b" },
  { name: "green", light: "#253c38", body: "#172a24", dark: "#08120f" },
  { name: "blue", light: "#28345a", body: "#1a2242", dark: "#0a0e20" },
];
const liningColor = "rgba(214, 176, 98, 0.7)";
const moonlitEdge = "rgba(175, 190, 240, 0.55)";
const couplingGap = 0.6;

let trainVehicles = [];

function createTrain() {
  const vehicles = [];
  let x = 0;
  for (let i = 0; i < journey.train.carriages; i++) {
    const random = seededRandom(journey.seed + 1000, i);
    vehicles.push({ kind: "carriage", x, length: carriageLength, windows: createCarriageWindows(random) });
    x += carriageLength + couplingGap;
  }
  vehicles.push({ kind: "tender", x, length: tenderLength });
  x += tenderLength + couplingGap;
  vehicles.push({ kind: "locomotive", x, length: locomotiveLength });
  return vehicles;
}

function getLocomotive() {
  return trainVehicles[trainVehicles.length - 1];
}

function getTrainLayout() {
  const locomotive = getLocomotive();
  const trainLength = locomotive.x + locomotive.length;
  const scale = camera.pxPerMetre;
  const screenWidth = trainLength * scale;

  // Centre the train if it fits. If not, keep the locomotive on screen and
  // let the last carriages run off the left edge.
  let left = (window.innerWidth - screenWidth) / 2;
  if (screenWidth > window.innerWidth * 0.96) {
    left = window.innerWidth - screenWidth - 12;
  }
  return { left, scale, pixel: 1 / scale };
}

function trainToScreenX(layout, metres) {
  return layout.left + metres * layout.scale;
}

function moveToTrain(layout) {
  ctx.translate(layout.left, camera.railY);
  ctx.scale(layout.scale, layout.scale);
}

// Each vehicle rocks a little on its own springs, slightly out of step with
// its neighbours.
function getBob(index) {
  const seconds = performance.now() / 1000;
  return Math.sin(seconds * 1.7 + index * 0.9) * 0.02 + Math.sin(seconds * 4.3 + index * 2.1) * 0.008;
}

function drawTrain() {
  const layout = getTrainLayout();
  drawLightOnGround(layout);

  ctx.save();
  moveToTrain(layout);
  trainVehicles.forEach((vehicle, index) => {
    ctx.save();
    ctx.translate(vehicle.x, getBob(index));
    if (vehicle.kind === "carriage") {
      drawCarriage(vehicle, layout.pixel);
      drawCarriageLights(vehicle);
    }
    if (vehicle.kind === "tender") drawTender(layout.pixel);
    if (vehicle.kind === "locomotive") {
      drawLocomotive(layout.pixel);
      drawLocomotiveLights();
    }
    ctx.restore();
  });
  drawTailLamp();
  drawSmoke();
  ctx.restore();
}

// In a tunnel only the lights are drawn, over the darkness.
function drawTrainLights() {
  const layout = getTrainLayout();
  ctx.save();
  moveToTrain(layout);
  trainVehicles.forEach((vehicle, index) => {
    ctx.save();
    ctx.translate(vehicle.x, getBob(index));
    if (vehicle.kind === "carriage") drawCarriageLights(vehicle);
    if (vehicle.kind === "locomotive") drawLocomotiveLights();
    ctx.restore();
  });
  drawTailLamp();
  ctx.restore();
}

function drawTailLamp() {
  ctx.fillStyle = "#e84a4a";
  ctx.beginPath();
  ctx.arc(-0.12, -1.45, 0.11, 0, Math.PI * 2);
  ctx.fill();
  drawGlow(-0.12, -1.45, 0.9, "240, 70, 60", 0.7);
}

// Light from the windows and the firebox falls on the ground between the
// train and the camera.
function drawLightOnGround(layout) {
  const nearestY = Math.min(window.innerHeight, groundYAt(camera.trackZ - 4.5));
  const top = groundYAt(camera.trackZ - 1.4);

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const vehicle of trainVehicles) {
    if (vehicle.kind !== "carriage") continue;
    vehicle.windows.forEach((pane, i) => {
      if (pane.state === "dark") return;
      let strength = 0.16;
      if (pane.state === "dim") strength = 0.07;
      const centreX = trainToScreenX(layout, vehicle.x + windowX(i) + windowWidth / 2);
      const width = windowWidth * layout.scale * 4;
      ctx.globalAlpha = strength;
      ctx.drawImage(getLightSpillSprite(), centreX - width / 2, top, width, nearestY - top);
    });
  }
  ctx.restore();

  const locomotive = getLocomotive();
  drawGlow(trainToScreenX(layout, locomotive.x + 1.2), top, 4 * layout.scale, "255, 120, 40", 0.45);
}

let lightSpillSprite;

// A soft band of light that widens and fades as it moves away from the train.
function getLightSpillSprite() {
  if (!lightSpillSprite) {
    const size = 64;
    lightSpillSprite = makeTexture(size, size, (x, y) => {
      const distance = y / size;
      const halfWidth = 0.18 + distance * 0.12;
      const fromMiddle = Math.abs(x / size - 0.5);
      const edge = Math.min(1, Math.max(0, (halfWidth - fromMiddle) * 4));
      const fade = (1 - distance) * (1 - distance);
      return [255, 180, 95, edge * fade * 255];
    });
  }
  return lightSpillSprite;
}

// A spoked wheel. The angle comes from the distance travelled, so the wheel
// turns exactly as fast as the ground moves under it.
function drawWheel(centerX, centerY, radius, spokeCount, pixel, hasCounterweight = false) {
  const angle = travelled / radius;

  ctx.fillStyle = "#0c0d13";
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  const tyreWidth = radius * 0.13;
  ctx.strokeStyle = "#272b3a";
  ctx.lineWidth = tyreWidth;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius - tyreWidth / 2, 0, Math.PI * 2);
  ctx.stroke();

  // Moonlight catches the steel tyre on the upper right.
  ctx.strokeStyle = moonlitEdge;
  ctx.lineWidth = pixel * 1.3;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius - pixel, -1.7, -0.2);
  ctx.stroke();

  ctx.strokeStyle = "#20232f";
  ctx.lineWidth = Math.max(pixel, radius * 0.06);
  ctx.beginPath();
  for (let i = 0; i < spokeCount; i++) {
    const spokeAngle = angle + (i * Math.PI * 2) / spokeCount;
    ctx.moveTo(centerX + Math.cos(spokeAngle) * radius * 0.2, centerY + Math.sin(spokeAngle) * radius * 0.2);
    ctx.lineTo(centerX + Math.cos(spokeAngle) * radius * 0.84, centerY + Math.sin(spokeAngle) * radius * 0.84);
  }
  ctx.stroke();

  // The counterweight sits opposite the crank pin, to balance the heavy rods.
  if (hasCounterweight) {
    const opposite = angle + Math.PI;
    ctx.fillStyle = "#151720";
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.8, opposite - 0.75, opposite + 0.75);
    ctx.arc(centerX, centerY, radius * 0.32, opposite + 0.75, opposite - 0.75, true);
    ctx.fill();
  }

  ctx.fillStyle = "#2b2f40";
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.2, 0, Math.PI * 2);
  ctx.fill();
}

// Text on the train is drawn at screen size, so it stays sharp.
function drawLettering(text, x, y, sizeMetres, pixel) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(pixel, pixel);
  ctx.font = `600 ${Math.round(sizeMetres / pixel)}px Georgia, serif`;
  ctx.textAlign = "center";
  ctx.fillStyle = liningColor;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

// A horizontal line along the top of a shape, where the moonlight hits it.
function drawTopEdge(fromX, toX, y, pixel) {
  ctx.fillStyle = moonlitEdge;
  ctx.fillRect(fromX, y, toX - fromX, pixel * 1.3);
}
