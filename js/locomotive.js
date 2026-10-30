// The locomotive faces right. x = 0 is the back of the cab, and the front
// buffers are at 11.1 m.
const locomotiveLength = 11.1;
const tenderLength = 6.6;

const driverRadius = 0.95;
const driverY = -driverRadius;
const driverXs = [3.4, 5.5, 7.6];
const crankRadius = 0.38;
const connectingRodLength = 1.3;
const crossheadY = -1.05;
const chimneyX = 10.12;
const chimneyTop = -4.12;

const boilerTop = -3.33;
const boilerBottom = -1.77;
const runningPlateY = -1.72;

const ironColor = "#15171f";

function drawLocomotive(pixel) {
  for (const wheelX of [9.55, 10.45]) drawWheel(wheelX, -0.45, 0.45, 10, pixel);
  for (const wheelX of driverXs) drawWheel(wheelX, driverY, driverRadius, 16, pixel, true);
  drawRods(pixel);
  drawCylinder(pixel);

  ctx.fillStyle = "#0e1016";
  ctx.fillRect(0, runningPlateY, 10.75, 0.16);
  drawTopEdge(0, 10.75, runningPlateY, pixel);

  // Splashers: covers over the tops of the big wheels
  for (const wheelX of driverXs) {
    ctx.fillStyle = "#12141c";
    ctx.beginPath();
    ctx.arc(wheelX, driverY, 1.06, Math.PI * 1.12, Math.PI * 1.88);
    ctx.lineTo(wheelX + 0.95, runningPlateY);
    ctx.lineTo(wheelX - 0.95, runningPlateY);
    ctx.fill();
    ctx.strokeStyle = liningColor;
    ctx.lineWidth = pixel * 1.3;
    ctx.beginPath();
    ctx.arc(wheelX, driverY, 1.06, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  }

  drawBoiler(pixel);
  drawCab(pixel);

  // Red buffer beam and the buffers
  ctx.fillStyle = "#5e1712";
  ctx.fillRect(10.6, -1.75, 0.25, 0.6);
  drawTopEdge(10.6, 10.85, -1.75, pixel);
  ctx.fillStyle = "#1a1b22";
  ctx.fillRect(10.85, -1.55, 0.25, 0.18);
  ctx.fillRect(11.05, -1.62, 0.07, 0.32);
}

// A boiler is a cylinder, so it is shaded like one: a bright band where the
// moonlight hits the top, darkening down the curved side.
function drawBoiler(pixel) {
  const boiler = ctx.createLinearGradient(0, boilerTop, 0, boilerBottom);
  boiler.addColorStop(0, "#0f1016");
  boiler.addColorStop(0.12, "#3b4052");
  boiler.addColorStop(0.24, "#1c1f29");
  boiler.addColorStop(0.75, "#0d0e13");
  boiler.addColorStop(1, "#07080b");
  ctx.fillStyle = boiler;
  ctx.fillRect(3.9, boilerTop, 5.6, boilerBottom - boilerTop);

  // The firebox, square-topped, between the cab and the boiler
  ctx.beginPath();
  ctx.roundRect(2.55, -3.45, 1.4, -1.72 + 3.45, [0.2, 0.05, 0, 0]);
  ctx.fill();

  // Smokebox at the front, with its round door
  const smokebox = ctx.createLinearGradient(0, -3.3, 0, -1.6);
  smokebox.addColorStop(0, "#0b0c10");
  smokebox.addColorStop(0.14, "#2b2f3d");
  smokebox.addColorStop(0.3, "#111319");
  smokebox.addColorStop(1, "#050608");
  ctx.fillStyle = smokebox;
  ctx.fillRect(9.5, -3.3, 1.1, 1.58);
  ctx.beginPath();
  ctx.ellipse(10.6, -2.5, 0.14, 0.8, 0, -Math.PI / 2, Math.PI / 2);
  ctx.fill();
  drawLettering("3107", 10.25, -2.2, 0.2, pixel);

  // Brass bands around the boiler and a handrail along it
  ctx.fillStyle = "rgba(214, 176, 98, 0.55)";
  for (const bandX of [3.92, 4.9, 6.1, 7.6, 8.8, 9.48]) {
    ctx.fillRect(bandX, boilerTop + 0.03, pixel * 2, boilerBottom - boilerTop - 0.03);
  }
  ctx.fillStyle = "rgba(200, 210, 245, 0.45)";
  ctx.fillRect(3.9, -2.75, 5.7, pixel * 1.2);

  // Chimney with a copper cap
  const chimney = ctx.createLinearGradient(chimneyX - 0.25, 0, chimneyX + 0.25, 0);
  chimney.addColorStop(0, "#07080b");
  chimney.addColorStop(0.6, "#262a36");
  chimney.addColorStop(1, "#0b0c10");
  ctx.fillStyle = chimney;
  ctx.fillRect(chimneyX - 0.23, chimneyTop + 0.12, 0.46, 0.75);
  ctx.fillStyle = "#6a3a22";
  ctx.fillRect(chimneyX - 0.31, chimneyTop, 0.62, 0.16);
  ctx.fillStyle = "rgba(255, 190, 140, 0.7)";
  ctx.fillRect(chimneyX - 0.31, chimneyTop, 0.62, pixel * 1.3);

  // Brass dome and safety valves
  const dome = ctx.createRadialGradient(6.85, -3.6, 0.02, 6.9, -3.35, 0.5);
  dome.addColorStop(0, "#d9b46a");
  dome.addColorStop(0.4, "#7a5a2a");
  dome.addColorStop(1, "#2a1d0d");
  ctx.fillStyle = dome;
  ctx.beginPath();
  ctx.ellipse(6.9, boilerTop + 0.05, 0.42, 0.4, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = "#6b4f24";
  ctx.fillRect(3.05, -3.8, 0.32, 0.36);
  ctx.fillStyle = "rgba(255, 225, 160, 0.8)";
  ctx.fillRect(3.05, -3.8, 0.32, pixel * 1.3);
}

function drawCab(pixel) {
  const cab = ctx.createLinearGradient(0, -3.95, 0, runningPlateY);
  cab.addColorStop(0, "#1a1c25");
  cab.addColorStop(1, "#08090c");
  ctx.fillStyle = cab;
  ctx.fillRect(0, -3.95, 2.6, -1.72 + 3.95);

  ctx.fillStyle = "#12131a";
  ctx.beginPath();
  ctx.moveTo(-0.18, -3.9);
  ctx.quadraticCurveTo(1.3, -4.3, 2.78, -3.9);
  ctx.lineTo(2.78, -3.82);
  ctx.lineTo(-0.18, -3.82);
  ctx.fill();
  ctx.strokeStyle = moonlitEdge;
  ctx.lineWidth = pixel * 1.3;
  ctx.beginPath();
  ctx.moveTo(-0.1, -3.93);
  ctx.quadraticCurveTo(1.3, -4.28, 2.7, -3.93);
  ctx.stroke();

  ctx.strokeStyle = liningColor;
  ctx.lineWidth = pixel;
  ctx.strokeRect(0.15, -2.2, 2.3, 0.4);
}

// The wheels are joined by a coupling rod fixed off-centre on each wheel, so
// as they turn the rod moves round in a circle. The connecting rod links the
// front wheel to the crosshead, which can only slide back and forth: that
// turns the piston's push and pull into the wheels going round.
function drawRods(pixel) {
  const angle = travelled / driverRadius;
  const pinOffsetX = Math.cos(angle) * crankRadius;
  const pinOffsetY = Math.sin(angle) * crankRadius;
  const pins = driverXs.map((wheelX) => ({ x: wheelX + pinOffsetX, y: driverY + pinOffsetY }));

  const frontPin = pins[pins.length - 1];
  const rise = crossheadY - frontPin.y;
  const crossheadX = frontPin.x + Math.sqrt(connectingRodLength * connectingRodLength - rise * rise);

  // Slide bars that guide the crosshead
  ctx.fillStyle = "#2a2e3d";
  ctx.fillRect(8.35, crossheadY - 0.1, 1.0, 0.05);
  ctx.fillRect(8.35, crossheadY + 0.06, 1.0, 0.05);

  ctx.lineCap = "round";
  ctx.strokeStyle = "#3a3f52";
  ctx.lineWidth = 0.13;
  ctx.beginPath();
  ctx.moveTo(pins[0].x, pins[0].y);
  ctx.lineTo(frontPin.x, frontPin.y);
  ctx.stroke();
  ctx.strokeStyle = moonlitEdge;
  ctx.lineWidth = pixel;
  ctx.beginPath();
  ctx.moveTo(pins[0].x, pins[0].y - 0.05);
  ctx.lineTo(frontPin.x, frontPin.y - 0.05);
  ctx.stroke();

  ctx.strokeStyle = "#30354a";
  ctx.lineWidth = 0.15;
  ctx.beginPath();
  ctx.moveTo(frontPin.x, frontPin.y);
  ctx.lineTo(crossheadX, crossheadY);
  ctx.stroke();
  ctx.lineCap = "butt";

  // Crosshead and the piston rod running into the cylinder
  ctx.fillStyle = "#3a3f52";
  ctx.fillRect(crossheadX - 0.15, crossheadY - 0.1, 0.3, 0.2);
  ctx.fillRect(crossheadX, crossheadY - 0.03, 9.4 - crossheadX, 0.06);

  ctx.fillStyle = "#4a5068";
  for (const pin of pins) {
    ctx.beginPath();
    ctx.arc(pin.x, pin.y, 0.09, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCylinder(pixel) {
  const cylinder = ctx.createLinearGradient(0, -1.5, 0, -0.62);
  cylinder.addColorStop(0, "#262a36");
  cylinder.addColorStop(1, "#0c0d12");
  ctx.fillStyle = cylinder;
  ctx.beginPath();
  ctx.roundRect(9.3, -1.5, 1.2, 0.88, 0.08);
  ctx.fill();
  drawTopEdge(9.35, 10.45, -1.5, pixel);
}

// Everything on the locomotive that gives off light: the firebox seen
// through the cab, and the lamps.
function drawLocomotiveLights() {
  const seconds = performance.now() / 1000;
  // The fire flickers: two slow waves that drift in and out of step.
  const flicker = 0.85 + Math.sin(seconds * 7.3) * 0.08 + Math.sin(seconds * 13.1) * 0.06;

  const fire = ctx.createLinearGradient(0, -3.5, 0, -2.3);
  fire.addColorStop(0, "#ff9a3c");
  fire.addColorStop(1, "#c2451a");
  ctx.fillStyle = fire;
  ctx.globalAlpha *= flicker;
  ctx.beginPath();
  ctx.roundRect(0.45, -3.5, 1.4, 1.2, [0.35, 0.35, 0.05, 0.05]);
  ctx.fill();
  ctx.globalAlpha /= flicker;

  // The driver, in profile, looking ahead
  ctx.fillStyle = "#140804";
  ctx.beginPath();
  ctx.ellipse(1.25, -3.02, 0.16, 0.19, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(1.05, -3.27, 0.36, 0.1);
  ctx.beginPath();
  ctx.moveTo(0.8, -2.3);
  ctx.quadraticCurveTo(0.85, -2.8, 1.22, -2.82);
  ctx.quadraticCurveTo(1.55, -2.78, 1.62, -2.3);
  ctx.fill();

  drawGlow(1.15, -2.9, 2.6, "255, 120, 40", 0.35 * flicker);

  for (const lamp of [{ x: 10.45, y: -3.45 }, { x: 10.78, y: -1.95 }]) {
    ctx.fillStyle = "#141620";
    ctx.fillRect(lamp.x - 0.18, lamp.y - 0.2, 0.32, 0.38);
    ctx.fillStyle = "#fff1cc";
    ctx.beginPath();
    ctx.arc(lamp.x + 0.15, lamp.y, 0.11, 0, Math.PI * 2);
    ctx.fill();
    drawGlow(lamp.x + 0.15, lamp.y, 1.6, "255, 225, 170", 0.9);
    drawHeadlampBeam(lamp.x + 0.15, lamp.y);
  }
}

function drawHeadlampBeam(lampX, lampY) {
  const length = 7;
  const beam = ctx.createLinearGradient(lampX, 0, lampX + length, 0);
  beam.addColorStop(0, "rgba(255, 220, 160, 0.3)");
  beam.addColorStop(1, "rgba(255, 220, 160, 0)");
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(lampX, lampY - 0.06);
  ctx.lineTo(lampX + length, lampY - 0.9);
  ctx.lineTo(lampX + length, lampY + 1.3);
  ctx.lineTo(lampX, lampY + 0.06);
  ctx.fill();
}

function drawTender(pixel) {
  for (const wheelX of [1.1, 3.3, 5.5]) {
    drawWheel(wheelX, -0.5, 0.5, 10, pixel);
    ctx.fillStyle = "#191b26";
    ctx.fillRect(wheelX - 0.18, -0.85, 0.36, 0.28);
  }
  ctx.fillStyle = "#0c0d13";
  ctx.fillRect(0.05, -1.2, tenderLength - 0.1, 0.3);

  const body = ctx.createLinearGradient(0, -3.3, 0, -1.2);
  body.addColorStop(0, "#1f222c");
  body.addColorStop(0.15, "#15171f");
  body.addColorStop(1, "#0a0b10");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.roundRect(0, -3.3, tenderLength, 2.1, [0.15, 0.15, 0.05, 0.05]);
  ctx.fill();

  ctx.strokeStyle = liningColor;
  ctx.lineWidth = pixel;
  ctx.beginPath();
  ctx.roundRect(0.25, -3.0, tenderLength - 0.5, 1.55, 0.1);
  ctx.stroke();
  drawLettering("NORTHERN & COASTAL", tenderLength / 2, -2.12, 0.28, pixel);

  // Coal heaped above the rim
  ctx.fillStyle = "#08090d";
  ctx.beginPath();
  ctx.moveTo(0.15, -3.28);
  ctx.lineTo(0.9, -3.55);
  ctx.lineTo(2.1, -3.78);
  ctx.lineTo(3.3, -3.68);
  ctx.lineTo(4.6, -3.82);
  ctx.lineTo(5.8, -3.5);
  ctx.lineTo(6.45, -3.28);
  ctx.fill();
  ctx.fillStyle = "rgba(150, 165, 220, 0.3)";
  for (const lump of [0.8, 1.5, 2.3, 3.1, 3.9, 4.5, 5.2, 5.9]) {
    ctx.fillRect(lump, -3.62 - Math.sin(lump * 3) * 0.12, 0.12, pixel);
  }
  drawTopEdge(0.1, tenderLength - 0.1, -3.3, pixel);
}
