// A country station on the far side of the line: a brick station building
// with a clock, a platform under a canopy with lamps, people waiting, name
// boards at each end, and a signal that shows red until the train has
// stopped and is ready to leave.
//
// The building, the canopy's front board, the platform wall and the name
// boards are each drawn once when the station is created (see prerender.js),
// then drawn at their place every frame. Only the lamps, which glow, and
// the signal, which changes, are drawn live.

const stationNames = [
  "Aldermere", "Hollowcross", "Wrenhaven", "Saltmere", "Kingsfold", "Ashmoor",
  "Greywater", "Fenwick Halt", "Larkspur", "Marsh End", "Stillwater", "Owlsbury",
];

const platformHalfLength = 40;
const platformHeight = 0.9;
const platformFrontZ = camera.trackZ + 2;
const platformBackZ = camera.trackZ + 7;
const canopyHalfLength = 30;
const canopyFrontZ = platformFrontZ + 0.6;
const buildingZ = camera.trackZ + 10;
const buildingWidth = 30;

const brickColor = [92, 46, 40];
const stoneColor = [120, 116, 108];
const stationGreen = "#173027";
const creamPaint = "rgba(233, 223, 196, 0.92)";
const goldLining = "rgba(214, 176, 98, 0.85)";

// The train stops with its front this far past the middle of the platform,
// so even the longest train is alongside it.
const stopPastMiddle = 30;

// stopSeconds is how long the train stands at the platform. A departure
// station is where the journey begins.
function createStation(stationX, seed, stopSeconds = stationStopSeconds, isDeparture = false) {
  const random = seededRandom(seed);
  const station = {
    x: stationX,
    stopX: stationX + stopPastMiddle,
    name: pick(random, stationNames),
    seed,
    // The train has already stopped at a departure station.
    visited: isDeparture,
    isDeparture,
    stopSeconds,
    secondsStopped: 0,
  };
  planPassengers(station);
  return station;
}

function createStationLayers(station) {
  return [createStationBuildingLayer(station), createPlatformLayer(station)];
}

// The station building

function createStationBuildingLayer(station) {
  const lights = [];
  const image = prerenderStationBuilding(station, lights);
  hazePrerendered(image, buildingZ);
  const left = station.x - buildingWidth / 2;

  return {
    z: buildingZ,
    draw() {
      drawPrerendered(image, left, buildingZ);
      for (const light of lights) {
        const point = projectPoint(left + light.x, buildingZ, light.height);
        drawGlow(point.x, point.y, light.radius * scaleAt(buildingZ), warmLight, light.strength);
      }
    },
  };
}

function prerenderStationBuilding(station, lights) {
  const random = seededRandom(station.seed, 1);
  const seed = station.seed;

  return prerender(buildingWidth, 13.5, (p) => {
    // Roofs first, so the walls and the gable sit in front of them.
    drawSlateRoof(p, [[4.6, 8.4], [7, 11.3], [23, 11.3], [25.4, 8.4]], seed);
    drawSlateRoof(p, [[-0.3, 4.9], [1.2, 6.4], [5.2, 6.4], [5.2, 4.9]], seed + 1);
    drawSlateRoof(p, [[24.8, 4.9], [24.8, 6.4], [28.8, 6.4], [30.3, 4.9]], seed + 2);
    drawChimney(p, 8.6, 10, seed);
    drawChimney(p, 21.4, 10, seed + 3);

    // Two single-storey wings and the two-storey main block, all brick
    drawBricks(p, 0, 0, 5, 5, brickColor, seed);
    drawBricks(p, 25, 0, 5, 5, brickColor, seed + 1);
    drawBricks(p, 5, 0, 20, 8.5, brickColor, seed + 2);

    // The gable over the middle, with the clock in it
    p.save();
    p.beginPath();
    p.moveTo(11.6, -8.5);
    p.lineTo(15, -11.6);
    p.lineTo(18.4, -8.5);
    p.closePath();
    p.clip();
    drawBricks(p, 11.6, 8.4, 6.8, 3.3, brickColor, seed + 3);
    p.restore();
    p.strokeStyle = `rgb(${stoneColor.join(",")})`;
    p.lineWidth = 0.22;
    p.beginPath();
    p.moveTo(11.4, -8.45);
    p.lineTo(15, -11.75);
    p.lineTo(18.6, -8.45);
    p.stroke();
    drawClock(p, 15, 9.8, 0.62);
    lights.push({ x: 15, height: 9.8, radius: 1.8, strength: 0.35 });

    // Stone details: a plinth, a band between the floors, a cornice under
    // the eaves, and quoins, the alternating blocks on each corner.
    p.fillStyle = `rgb(${stoneColor.map((c) => c * 0.55).join(",")})`;
    p.fillRect(0, -0.5, buildingWidth, 0.5);
    p.fillStyle = `rgb(${stoneColor.map((c) => c * 0.75).join(",")})`;
    p.fillRect(5, -4.75, 20, 0.22);
    p.fillRect(4.8, -8.62, 20.4, 0.22);
    p.fillRect(-0.15, -5.1, 5.3, 0.18);
    p.fillRect(24.85, -5.1, 5.3, 0.18);
    for (const cornerX of [5, 24.5]) drawQuoins(p, cornerX, 8.5);

    // Upper floor: six tall windows, some lit
    for (let i = 0; i < 6; i++) {
      const windowX = 6.4 + i * 3.05;
      if (windowX > 11.4 && windowX < 17.4) continue;
      const state = pick(random, ["lit", "lit", "dim", "dark"]);
      drawSashWindow(p, windowX, 5.3, 1.1, 2.0, state, seed + i);
      if (state !== "dark") lights.push({ x: windowX + 0.55, height: 6.3, radius: 2.2, strength: state === "lit" ? 0.3 : 0.12 });
    }
    // Two in the middle, under the gable
    drawSashWindow(p, 13.25, 5.3, 1.1, 2.0, "lit", seed + 10);
    drawSashWindow(p, 15.65, 5.3, 1.1, 2.0, "dim", seed + 11);
    lights.push({ x: 13.8, height: 6.3, radius: 2.2, strength: 0.3 });

    // Ground floor: the door with a lit fanlight, and windows either side
    drawDoor(p, 14.2, 0.5, 1.6, 2.9);
    for (const windowX of [7.0, 10.0, 19.0, 22.0]) {
      drawSashWindow(p, windowX, 1.3, 1.1, 2.0, "lit", seed + windowX);
    }
    drawSashWindow(p, 1.9, 1.3, 1.1, 2.0, "dim", seed + 20);
    drawPosterBoard(p, 26.2, 1.4, seed);

    // The station's name on a long board under the eaves
    p.fillStyle = stationGreen;
    p.fillRect(8.4, -8.35, 13.2, 0.75);
    p.strokeStyle = goldLining;
    p.lineWidth = 0.04;
    p.strokeRect(8.5, -8.27, 13, 0.59);
    drawSpacedText(p, station.name.toUpperCase(), 15, 7.97, 0.42, creamPaint);

    // Drainpipes down the corners of the main block
    p.fillStyle = "#121318";
    p.fillRect(5.15, -8.4, 0.09, 8.4);
    p.fillRect(24.76, -8.4, 0.09, 8.4);

    // Years of soot and rain under the ledges
    drawStains(p, 5, 8.38, 20, 1.6, seed + 4, 0.3);
    drawStains(p, 5, 4.55, 20, 1.2, seed + 5, 0.25);

    // A lantern by the door, and the light it throws on the wall
    p.fillStyle = "#0b0c10";
    p.fillRect(13.55, -3.75, 0.3, 0.45);
    p.fillStyle = "#ffd28a";
    p.fillRect(13.6, -3.7, 0.2, 0.3);
    drawLampLight(p, 13.7, 3.5, 3, 0.35);
    lights.push({ x: 13.7, height: 3.55, radius: 1.6, strength: 0.6 });

    // Moonlight falls on the upper walls; the ground floor is in shadow.
    // "source-atop" paints only over what is already there, not the sky.
    const shade = p.createLinearGradient(0, -11, 0, 0);
    shade.addColorStop(0, "rgba(150, 165, 220, 0.12)");
    shade.addColorStop(0.6, "rgba(0, 0, 0, 0)");
    shade.addColorStop(1, "rgba(0, 0, 10, 0.35)");
    p.globalCompositeOperation = "source-atop";
    p.fillStyle = shade;
    p.fillRect(0, -13.5, buildingWidth, 13.5);
    p.globalCompositeOperation = "source-over";
  });
}

// rows of slates, each row overlapping the one below
function drawSlateRoof(p, corners, seed) {
  p.save();
  p.beginPath();
  p.moveTo(corners[0][0], -corners[0][1]);
  for (const [x, y] of corners.slice(1)) p.lineTo(x, -y);
  p.closePath();
  p.clip();
  p.fillStyle = "#16171e";
  p.fill();

  const bottom = Math.min(...corners.map(([, y]) => y));
  const top = Math.max(...corners.map(([, y]) => y));
  const left = Math.min(...corners.map(([x]) => x));
  const right = Math.max(...corners.map(([x]) => x));
  for (let row = 0, y = bottom; y < top; row++, y += 0.22) {
    const shift = (row % 2) * 0.15;
    for (let column = 0, x = left - shift; x < right; column++, x += 0.3) {
      const shade = 18 + hash(row, column, seed) * 14;
      p.fillStyle = `rgb(${shade}, ${shade + 2}, ${shade + 8})`;
      p.fillRect(x, -y - 0.21, 0.28, 0.2);
    }
  }
  p.restore();

  // The ridge and top edges catch the moonlight.
  p.strokeStyle = "rgba(175, 190, 240, 0.4)";
  p.lineWidth = 0.05;
  p.beginPath();
  p.moveTo(corners[1][0], -corners[1][1]);
  p.lineTo(corners[2][0], -corners[2][1]);
  p.stroke();
}

function drawChimney(p, centerX, roofHeight, seed) {
  drawBricks(p, centerX - 0.5, roofHeight - 1, 1, 3.1, brickColor, seed + 30);
  p.fillStyle = `rgb(${stoneColor.map((c) => c * 0.7).join(",")})`;
  p.fillRect(centerX - 0.6, -(roofHeight + 2.2), 1.2, 0.2);
  p.fillStyle = "#2a1a16";
  p.fillRect(centerX - 0.38, -(roofHeight + 2.65), 0.24, 0.45);
  p.fillRect(centerX + 0.14, -(roofHeight + 2.55), 0.24, 0.35);
}

function drawQuoins(p, left, height) {
  for (let row = 0, y = 0.5; y < height; row++, y += 0.32) {
    const width = row % 2 === 0 ? 0.5 : 0.32;
    const shade = 0.6 + (row % 3) * 0.06;
    p.fillStyle = `rgb(${stoneColor.map((c) => c * shade).join(",")})`;
    p.fillRect(left, -y - 0.3, width, 0.29);
  }
}

// A tall sash window with a stone surround, a rounded head and a sill.
// Lit windows glow warm with half-drawn curtains; dark ones show only a
// faint reflection of the sky.
function drawSashWindow(p, left, bottom, width, height, state, seed) {
  const top = bottom + height;
  p.fillStyle = `rgb(${stoneColor.map((c) => c * 0.7).join(",")})`;
  p.beginPath();
  p.roundRect(left - 0.12, -top - 0.12, width + 0.24, height + 0.12, [0.6, 0.6, 0, 0]);
  p.fill();
  p.fillRect(left - 0.18, -bottom, width + 0.36, 0.12);

  const glass = p.createLinearGradient(0, -top, 0, -bottom);
  if (state === "lit") {
    glass.addColorStop(0, "#ffd99a");
    glass.addColorStop(1, "#e89a48");
  } else if (state === "dim") {
    glass.addColorStop(0, "#b8834a");
    glass.addColorStop(1, "#6e4322");
  } else {
    glass.addColorStop(0, "#26304e");
    glass.addColorStop(1, "#0c0e18");
  }
  p.fillStyle = glass;
  p.beginPath();
  p.roundRect(left, -top, width, height, [0.5, 0.5, 0, 0]);
  p.fill();

  if (state !== "dark" && hash(seed, 1, 7) < 0.7) {
    p.fillStyle = "rgba(110, 30, 26, 0.85)";
    p.fillRect(left, -top + 0.3, width * 0.22, height - 0.3);
    p.fillRect(left + width * 0.78, -top + 0.3, width * 0.22, height - 0.3);
  }

  p.fillStyle = "#1a1210";
  p.fillRect(left + width / 2 - 0.025, -top + 0.2, 0.05, height - 0.2);
  p.fillRect(left, -bottom - height * 0.5, width, 0.06);
  p.fillRect(left, -bottom - height * 0.25, width, 0.03);
  p.fillRect(left, -bottom - height * 0.75, width, 0.03);
}

function drawDoor(p, left, bottom, width, height) {
  p.fillStyle = `rgb(${stoneColor.map((c) => c * 0.7).join(",")})`;
  p.fillRect(left - 0.15, -bottom - height - 0.6, width + 0.3, height + 0.6);
  p.fillStyle = "#1b120f";
  p.fillRect(left, -bottom - height, width, height);
  p.fillStyle = "rgba(255, 255, 255, 0.05)";
  p.fillRect(left + 0.12, -bottom - height + 0.1, width / 2 - 0.18, height - 0.2);
  p.fillRect(left + width / 2 + 0.06, -bottom - height + 0.1, width / 2 - 0.18, height - 0.2);
  // The fanlight above the door, lit from the hall inside
  p.fillStyle = "#ffcf86";
  p.beginPath();
  p.arc(left + width / 2, -bottom - height, width / 2 - 0.05, Math.PI, 0);
  p.fill();
  p.strokeStyle = "#1b120f";
  p.lineWidth = 0.04;
  for (let i = 1; i < 5; i++) {
    const angle = Math.PI + (i / 5) * Math.PI;
    p.beginPath();
    p.moveTo(left + width / 2, -bottom - height);
    p.lineTo(left + width / 2 + Math.cos(angle) * width / 2, -bottom - height + Math.sin(angle) * width / 2);
    p.stroke();
  }
}

// A round clock in a stone surround. Its hands show the time the journey
// left.
function drawClock(p, centerX, height, radius) {
  p.fillStyle = `rgb(${stoneColor.join(",")})`;
  p.beginPath();
  p.arc(centerX, -height, radius + 0.12, 0, Math.PI * 2);
  p.fill();
  const face = p.createRadialGradient(centerX, -height, 0, centerX, -height, radius);
  face.addColorStop(0, "#fff1d0");
  face.addColorStop(1, "#d9c08c");
  p.fillStyle = face;
  p.beginPath();
  p.arc(centerX, -height, radius, 0, Math.PI * 2);
  p.fill();

  p.strokeStyle = "#2a2318";
  for (let hour = 0; hour < 12; hour++) {
    const angle = (hour / 12) * Math.PI * 2;
    const inner = hour % 3 === 0 ? 0.72 : 0.82;
    p.lineWidth = hour % 3 === 0 ? 0.05 : 0.025;
    p.beginPath();
    p.moveTo(centerX + Math.sin(angle) * radius * inner, -height - Math.cos(angle) * radius * inner);
    p.lineTo(centerX + Math.sin(angle) * radius * 0.92, -height - Math.cos(angle) * radius * 0.92);
    p.stroke();
  }

  const minuteAngle = (journey.minute / 60) * Math.PI * 2;
  const hourAngle = ((journey.hour % 12) / 12 + journey.minute / 720) * Math.PI * 2;
  p.lineCap = "round";
  p.lineWidth = 0.06;
  p.beginPath();
  p.moveTo(centerX, -height);
  p.lineTo(centerX + Math.sin(hourAngle) * radius * 0.5, -height - Math.cos(hourAngle) * radius * 0.5);
  p.stroke();
  p.lineWidth = 0.04;
  p.beginPath();
  p.moveTo(centerX, -height);
  p.lineTo(centerX + Math.sin(minuteAngle) * radius * 0.78, -height - Math.cos(minuteAngle) * radius * 0.78);
  p.stroke();
  p.lineCap = "butt";
}

// An old railway poster, faded, in a frame.
function drawPosterBoard(p, left, bottom, seed) {
  p.fillStyle = "#1a1c22";
  p.fillRect(left - 0.08, -bottom - 1.68, 1.76, 1.76);
  const poster = p.createLinearGradient(0, -bottom - 1.6, 0, -bottom);
  poster.addColorStop(0, "#5a6a7a");
  poster.addColorStop(0.55, "#8a7a5a");
  poster.addColorStop(1, "#3a4048");
  p.fillStyle = poster;
  p.fillRect(left, -bottom - 1.6, 1.6, 1.6);
  p.fillStyle = "rgba(240, 230, 210, 0.6)";
  p.fillRect(left + 0.15, -bottom - 1.45, 1.3, 0.18);
  p.fillRect(left + 0.15, -bottom - 0.35, 0.9, 0.1);
  p.fillStyle = "rgba(20, 24, 40, 0.5)";
  p.beginPath();
  p.arc(left + 1.1, -bottom - 0.9, 0.3 + hash(seed, 2, 3) * 0.1, 0, Math.PI * 2);
  p.fill();
}

// The platform

function createPlatformLayer(station) {
  const x = station.x;
  const valance = prerenderCanopyValance(canopyHalfLength * 2);
  hazePrerendered(valance, canopyFrontZ);
  const wall = prerenderPlatformWall(platformHalfLength * 2 + 10, station.seed);
  hazePrerendered(wall, platformFrontZ);
  const nameBoard = prerenderNameBoard(station.name);
  hazePrerendered(nameBoard, canopyFrontZ);

  return {
    z: platformFrontZ,
    draw() {
      drawCanopyRoof(x);
      drawPlatformTop(x);
      for (const person of station.people) {
        if (person.onPlatform) drawPerson(person);
      }
      drawPrerendered(wall, x - platformHalfLength - 5, platformFrontZ);
      drawPrerendered(valance, x - canopyHalfLength, canopyFrontZ, 4.6);
      drawCanopyLamps(x);
      drawPrerendered(nameBoard, x - platformHalfLength + 4.3, canopyFrontZ, platformHeight);
      drawPrerendered(nameBoard, x + platformHalfLength - 7.7, canopyFrontZ, platformHeight);
      drawSignal(station);
    },
  };
}

// The platform's brick front wall, with a ramp down at each end and stone
// coping along the top, painted white along its edge.
function prerenderPlatformWall(length, seed) {
  return prerender(length, 1.05, (p) => {
    p.save();
    p.beginPath();
    p.moveTo(0, 0);
    p.lineTo(5, -platformHeight);
    p.lineTo(length - 5, -platformHeight);
    p.lineTo(length, 0);
    p.closePath();
    p.clip();
    drawBricks(p, 0, 0, length, platformHeight, brickColor, seed + 40);
    drawStains(p, 0, platformHeight, length, 0.6, seed + 41, 0.3);
    p.restore();

    p.fillStyle = `rgb(${stoneColor.map((c) => c * 0.8).join(",")})`;
    p.fillRect(5, -platformHeight - 0.12, length - 10, 0.14);
    p.fillStyle = "rgba(235, 230, 215, 0.8)";
    p.fillRect(5, -platformHeight - 0.12, length - 10, 0.04);
  });
}

// The canopy's front board: green-painted timber with a gold line, and the
// wooden fringe of points along its bottom edge that country stations had.
function prerenderCanopyValance(length) {
  return prerender(length, 0.9, (p) => {
    p.fillStyle = stationGreen;
    p.fillRect(0, -0.9, length, 0.5);
    p.fillStyle = goldLining;
    p.fillRect(0, -0.82, length, 0.03);
    p.fillRect(0, -0.5, length, 0.02);
    p.fillStyle = "rgba(175, 190, 240, 0.35)";
    p.fillRect(0, -0.9, length, 0.025);

    p.fillStyle = stationGreen;
    for (let x = 0; x < length; x += 0.36) {
      p.beginPath();
      p.moveTo(x, -0.41);
      p.lineTo(x + 0.36, -0.41);
      p.lineTo(x + 0.18, -0.05);
      p.closePath();
      p.fill();
    }
    // A small hole cut in each point, as in real fretwork
    p.fillStyle = "rgba(0, 0, 0, 1)";
    p.globalCompositeOperation = "destination-out";
    for (let x = 0; x < length; x += 0.36) {
      p.beginPath();
      p.arc(x + 0.18, -0.28, 0.045, 0, Math.PI * 2);
      p.fill();
    }
    p.globalCompositeOperation = "source-over";
  });
}

function prerenderNameBoard(name) {
  return prerender(3.4, 2.5, (p) => {
    p.fillStyle = "#0b0c12";
    p.fillRect(0.3, -2.4, 0.1, 2.4);
    p.fillRect(3.0, -2.4, 0.1, 2.4);
    p.fillStyle = stationGreen;
    p.fillRect(0, -2.45, 3.4, 0.75);
    p.strokeStyle = goldLining;
    p.lineWidth = 0.04;
    p.strokeRect(0.08, -2.37, 3.24, 0.59);
    drawSpacedText(p, name.toUpperCase(), 1.7, 2.07, 0.3, creamPaint);
    p.fillStyle = "rgba(175, 190, 240, 0.4)";
    p.fillRect(0, -2.45, 3.4, 0.025);
  });
}

function drawPlatformTop(x) {
  const left = x - platformHalfLength;
  const right = x + platformHalfLength;
  ctx.fillStyle = hazed("#1c1d26", platformFrontZ);
  fillShape([[left, platformFrontZ, platformHeight], [right, platformFrontZ, platformHeight],
    [right, platformBackZ, platformHeight], [left, platformBackZ, platformHeight]]);

  for (let lampX = x - canopyHalfLength + 4; lampX < x + canopyHalfLength; lampX += 8) {
    const point = projectPoint(lampX, platformFrontZ + 1.6, platformHeight);
    drawLightPool(point.x, point.y, 5 * scaleAt(platformFrontZ), warmLight, 0.45);
  }
}

function drawCanopyRoof(x) {
  const left = x - canopyHalfLength;
  const right = x + canopyHalfLength;
  ctx.fillStyle = hazed("#0e1015", canopyFrontZ);
  fillShape([[left, canopyFrontZ, 5.4], [right, canopyFrontZ, 5.4], [right, platformBackZ, 6], [left, platformBackZ, 6]]);

  // Cast-iron columns holding it up, with a curved bracket at the top
  const columnZ = platformFrontZ + 3;
  const scale = scaleAt(columnZ);
  ctx.fillStyle = hazed("#10201a", columnZ);
  for (let columnX = left + 2; columnX <= right - 2; columnX += 8) {
    fillShape([[columnX - 0.1, columnZ, platformHeight], [columnX - 0.1, columnZ, 5.5],
      [columnX + 0.1, columnZ, 5.5], [columnX + 0.1, columnZ, platformHeight]]);
    const top = projectPoint(columnX, columnZ, 5.4);
    ctx.lineWidth = 0.08 * scale;
    ctx.strokeStyle = ctx.fillStyle;
    ctx.beginPath();
    ctx.arc(top.x - 0.8 * scale, top.y + 0.8 * scale, 0.8 * scale, -Math.PI / 2, 0);
    ctx.arc(top.x + 0.8 * scale, top.y + 0.8 * scale, 0.8 * scale, Math.PI, -Math.PI / 2);
    ctx.stroke();
  }
}

// Lanterns hanging under the canopy
function drawCanopyLamps(x) {
  const z = canopyFrontZ + 1;
  const scale = scaleAt(z);
  for (let lampX = x - canopyHalfLength + 4; lampX < x + canopyHalfLength; lampX += 8) {
    const lamp = projectPoint(lampX, z, 4.45);
    ctx.fillStyle = "#0b0c10";
    ctx.fillRect(lamp.x - 0.02 * scale, lamp.y - 0.45 * scale, 0.04 * scale, 0.3 * scale);
    ctx.beginPath();
    ctx.moveTo(lamp.x - 0.2 * scale, lamp.y - 0.15 * scale);
    ctx.lineTo(lamp.x + 0.2 * scale, lamp.y - 0.15 * scale);
    ctx.lineTo(lamp.x, lamp.y - 0.3 * scale);
    ctx.fill();
    ctx.fillStyle = "#ffd28a";
    ctx.fillRect(lamp.x - 0.13 * scale, lamp.y - 0.15 * scale, 0.26 * scale, 0.34 * scale);
    ctx.fillStyle = "#0b0c10";
    ctx.fillRect(lamp.x - 0.15 * scale, lamp.y + 0.19 * scale, 0.3 * scale, 0.05 * scale);
    drawGlow(lamp.x, lamp.y, 3 * scale, warmLight, 0.6);
  }
}

// A person waiting, seen as a dark shape against the lamplight: a head, a
// long coat, and sometimes a suitcase.
function drawPerson(person) {
  const scale = scaleAt(person.z);
  const feet = projectPoint(person.x, person.z, platformHeight);
  const height = person.height * scale;
  ctx.fillStyle = hazed("#07080e", person.z);
  ctx.beginPath();
  ctx.arc(feet.x, feet.y - height + 0.12 * scale, 0.12 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(feet.x - 0.2 * scale, feet.y - height + 0.3 * scale);
  ctx.lineTo(feet.x + 0.2 * scale, feet.y - height + 0.3 * scale);
  ctx.lineTo(feet.x + 0.28 * scale, feet.y - 0.25 * scale);
  ctx.lineTo(feet.x + 0.1 * scale, feet.y);
  ctx.lineTo(feet.x - 0.1 * scale, feet.y);
  ctx.lineTo(feet.x - 0.28 * scale, feet.y - 0.25 * scale);
  ctx.fill();
  if (person.hasCase) {
    ctx.fillRect(feet.x + 0.3 * scale, feet.y - 0.45 * scale, 0.5 * scale, 0.4 * scale);
  }
  // Lamplight from above catches the top of the head and shoulders.
  ctx.fillStyle = "rgba(255, 190, 120, 0.35)";
  ctx.fillRect(feet.x - 0.2 * scale, feet.y - height + 0.3 * scale, 0.4 * scale, Math.max(1, 0.04 * scale));
}

// A semaphore signal past the end of the platform. Red while the train is
// due to stop or standing here, green once it is free to go.
function drawSignal(station) {
  const signalX = station.x + platformHalfLength + 12;
  const z = camera.trackZ + 2.6;
  const scale = scaleAt(z);
  ctx.fillStyle = hazed("#0c0e18", z);
  fillShape([[signalX - 0.1, z, 0], [signalX - 0.1, z, 7], [signalX + 0.1, z, 7], [signalX + 0.1, z, 0]]);
  // A ladder up the post, for the lamp man
  ctx.strokeStyle = ctx.fillStyle;
  ctx.lineWidth = Math.max(1, 0.03 * scale);
  ctx.beginPath();
  for (let rung = 0.5; rung < 6; rung += 0.35) {
    const point = projectPoint(signalX + 0.25, z, rung);
    ctx.moveTo(point.x - 0.15 * scale, point.y);
    ctx.lineTo(point.x + 0.15 * scale, point.y);
  }
  ctx.stroke();

  const isClear = station.visited && motion.state === "running";
  const arm = projectPoint(signalX, z, 6.4);
  ctx.save();
  ctx.translate(arm.x, arm.y);
  // The arm sticks straight out for "stop" and tilts down for "go".
  ctx.rotate(isClear ? 0.6 : 0);
  ctx.fillStyle = "#6e1c18";
  ctx.fillRect(-1.6 * scale, -0.15 * scale, 1.6 * scale, 0.3 * scale);
  ctx.fillStyle = "#d8d2c4";
  ctx.fillRect(-1.2 * scale, -0.15 * scale, 0.2 * scale, 0.3 * scale);
  ctx.restore();

  const lamp = projectPoint(signalX + 0.3, z, 6.1);
  const lampColor = isClear ? "110, 255, 170" : "255, 70, 60";
  ctx.fillStyle = `rgb(${lampColor})`;
  ctx.beginPath();
  ctx.arc(lamp.x, lamp.y, 0.12 * scale, 0, Math.PI * 2);
  ctx.fill();
  drawGlow(lamp.x, lamp.y, 1.6 * scale, lampColor, 0.8);
}
