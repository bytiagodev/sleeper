// A tunnel through a hill.
//
// The line runs into the hill, so the hill's slope rises from just in front
// of the track to its crest behind it, and covers the train as it goes in.
// Where the line enters there is a stone face with an arched opening, and a
// stone wing wall holding back the earth beside the line.
//
// The stone face stands at right angles to the track, so it can only be
// seen from its open side: while an entrance is still ahead of the camera,
// or once an exit is behind it. Seen from there it is foreshortened, so its
// image is drawn in thin vertical strips, each stretched to the height
// that its distance from the camera gives it.

const hillFrontZ = camera.trackZ - 4;
const hillBackZ = camera.trackZ + 4;
const hillCrestZ = camera.trackZ + 5;
const wingWallZ = camera.trackZ + 3.4;
const wingWallLength = 22;
const archHalfWidth = 2.6;
const archSpringHeight = 3.2;
const faceHeight = 9.3;
const tunnelStone = [92, 90, 98];

let hillPattern;

// How high the crest of the hill is, a given distance in from the tunnel
// mouth: it rises from just above the stone face to a rounded top.
function hillHeight(distanceIn, seed) {
  const rise = Math.min(1, distanceIn / 30);
  return 9.6 + rise * 4 + layeredNoise(distanceIn / 25, seed, 3) * 2;
}

// direction is 1 for an entrance, where the hill lies ahead of the mouth,
// and -1 for an exit, where the hill lies behind it.
function createTunnelLayers(mouthX, direction, seed) {
  if (!hillPattern) hillPattern = createHillPattern();
  const face = prerenderTunnelFace(seed);
  hazePrerendered(face, (hillFrontZ + hillBackZ) / 2);
  const faceSeenThrough = cutOpeningSeeThrough(face);
  const wingWall = prerenderWingWall(seed, direction);
  hazePrerendered(wingWall, wingWallZ);
  const hillColor = hazed("#0b0d12", hillCrestZ);

  // The wing wall stands behind the track, so it is drawn before the train.
  let wingWallLeft = mouthX - wingWallLength;
  if (direction < 0) wingWallLeft = mouthX;
  const wingWallLayer = {
    z: wingWallZ,
    draw() {
      drawPrerendered(wingWall, wingWallLeft, wingWallZ);
    },
  };

  // The stone face crosses the track, so half of it stands behind the train
  // and half in front. Behind the train goes the whole hill and face, with
  // the dark bore of the tunnel. In front goes only what is nearer than the
  // rails: the near half of the face, whose opening the train shows through
  // as it goes in, and the hill that covers the train once it is inside.
  const faceIsVisible = () => (mouthX - travelled) * direction > 0;

  const behindTrainLayer = {
    z: hillBackZ,
    draw() {
      if (!isHillOnScreen(mouthX, direction)) return;
      drawHillside(mouthX, direction, seed, hillColor);
      if (faceIsVisible()) {
        drawTunnelFace(face, mouthX, hillFrontZ, hillBackZ);
        drawBramblesOnFace(mouthX, seed);
      }
    },
  };

  const inFrontOfTrainLayer = {
    z: hillFrontZ,
    draw() {
      if (!isHillOnScreen(mouthX, direction)) return;
      ctx.save();
      clipToInsideOfMouth(mouthX, direction);
      drawHillside(mouthX, direction, seed, hillColor);
      if (faceIsVisible()) drawTunnelFace(faceSeenThrough, mouthX, hillFrontZ, camera.trackZ);
      ctx.restore();
    },
  };

  return [wingWallLayer, behindTrainLayer, inFrontOfTrainLayer];
}

// The hill runs from its mouth away in `direction`. It is off screen while
// its mouth, at every distance from the front to the crest, is past the
// edge it runs away from. The margin leaves room for trees on the crest.
function isHillOnScreen(mouthX, direction) {
  const margin = 5 * scaleAt(hillCrestZ);
  const mouthNear = screenXAt(mouthX, hillFrontZ);
  const mouthFar = screenXAt(mouthX, hillCrestZ);
  if (direction > 0) return Math.min(mouthNear, mouthFar) < window.innerWidth + margin;
  return Math.max(mouthNear, mouthFar) > -margin;
}

// The face, drawn flat as if seen straight on. Across the image is the
// distance from the camera, from the front of the hill to the back; up the
// image is height. The arch is in the middle, over the track.
function prerenderTunnelFace(seed) {
  const width = hillBackZ - hillFrontZ;
  const archCenter = camera.trackZ - hillFrontZ;

  return prerender(width, faceHeight, (p) => {
    drawStones(p, 0, 0, width, faceHeight, tunnelStone, seed, 0.42);

    // Pilasters: slightly projecting stone columns at both sides
    for (const pilasterX of [0, width - 0.7]) {
      drawStones(p, pilasterX, 0, 0.7, 7.4, tunnelStone.map((c) => c * 1.12), seed + 5, 0.42);
      p.fillStyle = "rgba(0, 0, 0, 0.35)";
      p.fillRect(pilasterX === 0 ? 0.68 : width - 0.72, -7.4, 0.04, 7.4);
    }

    // A string course, a parapet above it, and coping stones on top
    p.fillStyle = `rgb(${tunnelStone.map((c) => c * 1.15).join(",")})`;
    p.fillRect(0, -7.62, width, 0.22);
    p.fillStyle = `rgb(${tunnelStone.map((c) => c * 1.2).join(",")})`;
    p.fillRect(-0.1, -faceHeight, width + 0.2, 0.28);
    p.fillStyle = "rgba(180, 195, 240, 0.45)";
    p.fillRect(-0.1, -faceHeight, width + 0.2, 0.04);

    // Soot from years of chimneys, darkest just above the arch
    const soot = p.createRadialGradient(archCenter, -archSpringHeight - 2.4, 0.5, archCenter, -archSpringHeight - 2.4, 4);
    soot.addColorStop(0, "rgba(0, 0, 0, 0.7)");
    soot.addColorStop(1, "rgba(0, 0, 0, 0)");
    p.fillStyle = soot;
    p.fillRect(0, -faceHeight, width, faceHeight);
    drawStains(p, 0.3, 7.4, width - 0.6, 3.2, seed + 6, 0.3);

    // The arch ring: wedge-shaped stones round the opening, with a larger
    // keystone at the top holding them in place.
    const ringInner = archHalfWidth;
    const ringOuter = archHalfWidth + 0.55;
    const stoneCount = 17;
    for (let i = 0; i < stoneCount; i++) {
      const from = Math.PI + (i / stoneCount) * Math.PI;
      const to = Math.PI + ((i + 1) / stoneCount) * Math.PI;
      const isKeystone = i === Math.floor(stoneCount / 2);
      const outer = isKeystone ? ringOuter + 0.25 : ringOuter;
      const shade = isKeystone ? 1.3 : 0.95 + hash(i, 1, seed) * 0.25;
      p.fillStyle = `rgb(${tunnelStone.map((c) => c * shade).join(",")})`;
      p.beginPath();
      p.arc(archCenter, -archSpringHeight, outer, from + 0.01, to - 0.01);
      p.arc(archCenter, -archSpringHeight, ringInner, to - 0.01, from + 0.01, true);
      p.closePath();
      p.fill();
    }

    // The opening itself: dark, with the last of the light on the lining
    // just inside the mouth.
    p.beginPath();
    p.moveTo(archCenter - archHalfWidth, 0);
    p.lineTo(archCenter - archHalfWidth, -archSpringHeight);
    p.arc(archCenter, -archSpringHeight, archHalfWidth, Math.PI, 0);
    p.lineTo(archCenter + archHalfWidth, 0);
    p.closePath();
    const inside = p.createRadialGradient(archCenter, -1.8, 0.3, archCenter, -2.2, 3.4);
    inside.addColorStop(0, "#000000");
    inside.addColorStop(0.75, "#050506");
    inside.addColorStop(1, "#16161b");
    p.fillStyle = inside;
    p.fill();

    // Moss and damp at the foot of the wall
    const damp = p.createLinearGradient(0, -1.2, 0, 0);
    damp.addColorStop(0, "rgba(10, 20, 14, 0)");
    damp.addColorStop(1, "rgba(10, 20, 14, 0.7)");
    p.fillStyle = damp;
    p.fillRect(0, -1.2, archCenter - archHalfWidth, 1.2);
    p.fillRect(archCenter + archHalfWidth, -1.2, width - archCenter - archHalfWidth, 1.2);

    // Ivy hanging over the parapet
    drawIvy(p, 0.9, faceHeight - 0.2, 1.6, 4.5, seed + 7);
    drawIvy(p, width - 1.3, faceHeight - 0.2, 1.4, 3.2, seed + 8);

    // Moonlight on the upper stonework, shadow lower down
    const light = p.createLinearGradient(0, -faceHeight, 0, 0);
    light.addColorStop(0, "rgba(150, 165, 220, 0.12)");
    light.addColorStop(1, "rgba(0, 0, 8, 0.3)");
    p.fillStyle = light;
    p.fillRect(0, -faceHeight, width, faceHeight);
  });
}

// A copy of the face where the opening lets through what is behind it,
// darkened, so the train stays visible as it passes into the bore.
function cutOpeningSeeThrough(face) {
  const copy = makeCanvas(face.width, face.height);
  const p = copy.getContext("2d");
  p.drawImage(face, 0, 0);
  p.translate(0, copy.height);
  p.scale(prerenderPixelsPerMetre, prerenderPixelsPerMetre);

  const archCenter = camera.trackZ - hillFrontZ;
  const opening = new Path2D();
  opening.moveTo(archCenter - archHalfWidth, 0);
  opening.lineTo(archCenter - archHalfWidth, -archSpringHeight);
  opening.arc(archCenter, -archSpringHeight, archHalfWidth, Math.PI, 0);
  opening.lineTo(archCenter + archHalfWidth, 0);
  opening.closePath();

  p.globalCompositeOperation = "destination-out";
  p.fill(opening);

  // Darkest at the jamb nearest the camera, where the train is deepest in.
  p.globalCompositeOperation = "source-over";
  const shadow = p.createLinearGradient(archCenter - archHalfWidth, 0, archCenter, 0);
  shadow.addColorStop(0, "rgba(2, 2, 4, 0.9)");
  shadow.addColorStop(1, "rgba(2, 2, 4, 0.55)");
  p.fillStyle = shadow;
  p.fill(opening);
  copy.isSeeThrough = true;
  return copy;
}

// Limits drawing to the screen beyond the point where the rails meet the
// face: everything there that is nearer than the rails hides the train.
function clipToInsideOfMouth(mouthX, direction) {
  const mouthOnRails = screenXAt(mouthX, camera.trackZ);
  ctx.beginPath();
  if (direction > 0) ctx.rect(mouthOnRails, 0, window.innerWidth - mouthOnRails, window.innerHeight);
  else ctx.rect(0, 0, mouthOnRails, window.innerHeight);
  ctx.clip();
}

// The wing wall: a stone wall beside the line that holds back the hill. It
// is as high as the tunnel face where it meets it and steps down towards
// the open ground.
function prerenderWingWall(seed, direction) {
  return prerender(wingWallLength, 8.2, (p) => {
    // Height of the wall's top at a point along it, measured from the end
    // furthest from the tunnel.
    const topAt = (along) => 1.2 + (along / wingWallLength) * 6.8;
    p.save();
    if (direction < 0) {
      // An exit's wall runs the other way, so the image is mirrored.
      p.translate(wingWallLength, 0);
      p.scale(-1, 1);
    }
    p.beginPath();
    p.moveTo(0, 0);
    p.lineTo(0, -topAt(0));
    p.lineTo(wingWallLength, -topAt(wingWallLength));
    p.lineTo(wingWallLength, 0);
    p.closePath();
    p.save();
    p.clip();
    drawStones(p, 0, 0, wingWallLength, 8.2, tunnelStone.map((c) => c * 0.9), seed + 20, 0.4);
    drawStains(p, 0, 8.2, wingWallLength, 3, seed + 21, 0.25);
    const shade = p.createLinearGradient(0, -8, 0, 0);
    shade.addColorStop(0, "rgba(150, 165, 220, 0.1)");
    shade.addColorStop(1, "rgba(0, 0, 8, 0.35)");
    p.fillStyle = shade;
    p.fillRect(0, -8.2, wingWallLength, 8.2);
    p.restore();

    // Coping stones along the sloping top
    p.strokeStyle = `rgb(${tunnelStone.map((c) => c * 1.15).join(",")})`;
    p.lineWidth = 0.22;
    p.beginPath();
    p.moveTo(0, -topAt(0));
    p.lineTo(wingWallLength, -topAt(wingWallLength));
    p.stroke();
    p.strokeStyle = "rgba(180, 195, 240, 0.4)";
    p.lineWidth = 0.04;
    p.stroke();

    drawIvy(p, 6, topAt(6), 2.4, 2.2, seed + 22);
    drawIvy(p, 15, topAt(15), 3, 3.5, seed + 23);
    p.restore();
  });
}

// Earth and grass, drawn once and repeated over the hill's slope.
function createHillPattern() {
  const size = 256;
  const cells = 8;
  const texture = makeTexture(size, size, (x, y) => {
    const grass = layeredNoise2D((x / size) * cells, (y / size) * cells, 31, 5, cells);
    const speckle = hash(x, y, 32) - 0.5;
    // Short vertical streaks, like grass blades seen from the side
    const blades = layeredNoise2D((x / size) * 96, (y / size) * 8, 34, 2, 96);
    const brightness = 12 + grass * 16 + blades * 12 + speckle * 5;
    return [brightness * 0.68, brightness * 0.9, brightness * 0.74, 255];
  });
  return ctx.createPattern(texture, "repeat");
}

// The foot of the slope wanders nearer and further and rises and dips, so
// the hill never ends in a ruled line. At the mouth it starts flush with
// the stone face.
function hillFoot(distanceIn, seed) {
  const awayFromMouth = Math.max(0, Math.min(1, distanceIn / 8));
  return {
    z: hillFrontZ - awayFromMouth * layeredNoise(distanceIn / 12, seed + 5, 2) * 1.6,
    height: 0.4 + awayFromMouth * layeredNoise(distanceIn / 7, seed + 6, 2) * 0.9,
  };
}

// A point on the slope: up is 0 at the foot and 1 at the crest. The slope
// is steep near the bottom and rounds over towards the top, like a real hill.
function pointOnHill(mouthX, direction, distanceIn, up, seed) {
  const foot = hillFoot(distanceIn, seed);
  const rounded = 1 - (1 - up) * (1 - up);
  const z = mix(foot.z, hillCrestZ, up);
  const height = mix(foot.height, hillHeight(distanceIn, seed), rounded);
  return projectPoint(mouthX + distanceIn * direction, z, height);
}

// The slope of the hill, seen from the side: it starts at the foot just in
// front of the track and climbs to the crest behind it. Bushes, ferns and
// rocks are scattered over it, long grass grows along its foot, and grass
// and trees line its top.
function drawHillside(mouthX, direction, seed, hillColor) {
  let farEnd = worldXAt(window.innerWidth + 20, hillCrestZ);
  if (direction < 0) farEnd = worldXAt(-20, hillCrestZ);
  const length = Math.max(1, (farEnd - mouthX) * direction);

  const crest = [];
  const foot = [];
  for (let distanceIn = 0; distanceIn <= length; distanceIn += 1) {
    crest.push(pointOnHill(mouthX, direction, distanceIn, 1, seed));
    foot.push(pointOnHill(mouthX, direction, distanceIn, 0, seed));
  }

  // The end of the hill at the mouth is ragged: earth slumps a little past
  // the stone in some places and falls short of it in others.
  const hill = new Path2D();
  for (let up = 0; up <= 1; up += 0.1) {
    const overhang = (layeredNoise(up * 5, seed + 7, 2) - 0.3) * 1.2;
    const point = pointOnHill(mouthX, direction, -overhang, up, seed);
    if (up === 0) hill.moveTo(point.x, point.y);
    else hill.lineTo(point.x, point.y);
  }
  for (const point of crest) hill.lineTo(point.x, point.y);
  for (let i = foot.length - 1; i >= 0; i--) hill.lineTo(foot[i].x, foot[i].y);
  hill.closePath();

  ctx.fillStyle = hillColor;
  ctx.fill(hill);

  ctx.save();
  ctx.clip(hill);
  const top = Math.min(...crest.map((point) => point.y));
  const bottom = Math.max(...foot.map((point) => point.y));
  hillPattern.setTransform(new DOMMatrix([1, 0, 0, 1, screenXAt(0, hillCrestZ), 0]));
  ctx.globalAlpha = 1 - hazeAt(hillCrestZ);
  ctx.fillStyle = hillPattern;
  ctx.fillRect(0, top - 20, window.innerWidth, bottom - top + 40);
  ctx.globalAlpha = 1;
  // The moon catches the grass near the top; the foot is in shadow.
  const shade = ctx.createLinearGradient(0, top, 0, bottom);
  shade.addColorStop(0, "rgba(150, 175, 200, 0.2)");
  shade.addColorStop(0.35, "rgba(120, 140, 175, 0.05)");
  shade.addColorStop(1, "rgba(0, 0, 0, 0.6)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, top - 20, window.innerWidth, bottom - top + 40);
  drawGrassPatches(mouthX, direction, seed);
  ctx.restore();

  drawHillCrest(mouthX, direction, length, seed);
  drawSlopePlants(mouthX, direction, length, seed);
  drawHillFootGrass(mouthX, direction, length, seed);
}

// Broad patches of lighter and darker grass, so the slope is not one even
// colour: thicker growth, bare earth, the hollows the moon doesn't reach.
function drawGrassPatches(mouthX, direction, seed) {
  const patchZ = mix(hillFrontZ, hillCrestZ, 0.5);
  const scale = scaleAt(patchZ);
  forEachSlot(patchZ, 5, 10, (index, x) => {
    const random = seededRandom(seed + 30, index);
    const distanceIn = (x - mouthX) * direction;
    if (distanceIn < -2) return;
    const center = pointOnHill(mouthX, direction, distanceIn, 0.15 + random() * 0.7, seed);
    const radius = (3 + random() * 4) * scale;
    const lighter = random() < 0.5;
    const tone = lighter ? "rgba(140, 170, 150, 0.08)" : "rgba(0, 0, 0, 0.25)";
    const patch = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, radius);
    patch.addColorStop(0, tone);
    patch.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = patch;
    ctx.fillRect(center.x - radius, center.y - radius, radius * 2, radius * 2);
  });
}

// Long grass all along the crest, and trees here and there.
function drawHillCrest(mouthX, direction, length, seed) {
  const scale = scaleAt(hillCrestZ);
  const plants = new Path2D();
  forEachSlot(hillCrestZ, 0.5, 1, (index, x) => {
    const distanceIn = (x - mouthX) * direction;
    if (distanceIn < 0.5 || distanceIn > length) return;
    const random = seededRandom(seed + 1, index);
    const base = projectPoint(x, hillCrestZ, hillHeight(distanceIn, seed) - 0.1);
    traceTuft(plants, base.x, base.y, (0.4 + random() * 0.5) * scale, (0.3 + random() * 0.6) * scale);
  });

  forEachSlot(hillCrestZ, 9, 10, (index, x) => {
    const random = seededRandom(seed + 2, index);
    const treeX = x + random() * 9;
    const distanceIn = (treeX - mouthX) * direction;
    if (distanceIn < 4 || distanceIn > length || random() < 0.35) return;
    const base = projectPoint(treeX, hillCrestZ, hillHeight(distanceIn, seed) - 0.3);
    const height = 6 + random() * 7;
    if (random() < 0.6) {
      tracePine(plants, base.x, base.y, height * 0.42 * scale, height * scale, random);
    } else {
      traceRoundTree(plants, base.x, base.y, height * scale, random);
    }
  });

  fillWithMoonlitEdge(plants, hazed("#06070c", hillCrestZ), 0.3);
}

// Bushes, ferns, rocks and clumps of grass in rows across the slope, the
// furthest row first so nearer plants overlap it.
function drawSlopePlants(mouthX, direction, length, seed) {
  const rows = [0.85, 0.7, 0.55, 0.4, 0.26, 0.12];
  rows.forEach((up, row) => {
    const rowZ = mix(hillFrontZ, hillCrestZ, up);
    const scale = scaleAt(rowZ);
    const greenery = new Path2D();
    const rocks = new Path2D();

    forEachSlot(rowZ, 1.4, 2, (index, x) => {
      const random = seededRandom(seed + 40 + row, index);
      const plantX = x + random() * 1.4;
      const distanceIn = (plantX - mouthX) * direction;
      if (distanceIn < 1 || distanceIn > length) return;
      const base = pointOnHill(mouthX, direction, distanceIn, up + (random() - 0.5) * 0.08, seed);
      const size = (0.6 + random() * 1) * scale;
      const kind = random();
      if (kind < 0.15) return;
      if (kind < 0.45) traceBush(greenery, base.x, base.y, size * 1.6, random);
      else if (kind < 0.62) traceFern(greenery, base.x, base.y, size, random);
      else if (kind < 0.76) traceRock(rocks, base.x, base.y, size * 1.1, size * 0.55, random);
      else traceTuft(greenery, base.x, base.y, size * 0.8, size * 0.7);
    });

    fillWithMoonlitEdge(rocks, hazed("#32343c", rowZ), 0.45);
    fillWithMoonlitEdge(greenery, hazed("#0c130f", rowZ), 0.3);
  });
}

// Tall grass along the foot of the slope, so the hill fades into the verge
// instead of stopping at a hard edge.
function drawHillFootGrass(mouthX, direction, length, seed) {
  const grass = new Path2D();
  forEachSlot(hillFrontZ, 0.3, 1, (index, x) => {
    const distanceIn = (x - mouthX) * direction;
    if (distanceIn < 0 || distanceIn > length) return;
    const random = seededRandom(seed + 50, index);
    const foot = hillFoot(distanceIn, seed);
    const scale = scaleAt(foot.z);
    const base = projectPoint(x, foot.z - 0.2, foot.height * 0.3);
    traceTuft(grass, base.x, base.y, (0.4 + random() * 0.4) * scale, (0.5 + random() * 0.8) * scale);
  });
  fillWithMoonlitEdge(grass, hazed("#05070a", hillFrontZ), 0.18);
}

// Brambles and grass growing over the top of the stone face and trailing
// down its edge, where the earth of the hill meets the stone.
function drawBramblesOnFace(mouthX, seed) {
  const leaves = new Path2D();
  const stems = new Path2D();
  const step = 0.25;
  for (let z = hillFrontZ; z <= hillBackZ; z += step) {
    const random = seededRandom(seed + 60, Math.round(z / step));
    const scale = scaleAt(z);
    const point = projectPoint(mouthX, z, faceHeight);
    for (let i = 0; i < 3; i++) {
      const leafX = point.x + (random() - 0.5) * 0.4 * scale;
      const leafY = point.y - random() * 0.35 * scale;
      traceLeaf(leaves, leafX, leafY, (0.12 + random() * 0.12) * scale, random() * Math.PI);
    }
    if (random() < 0.5) traceTuft(leaves, point.x, point.y, 0.4 * scale, (0.3 + random() * 0.4) * scale);

    // Now and then a long stem hangs down the stone, with leaves along it.
    if (random() < 0.12) {
      const stemLength = 1 + random() * 2.5;
      stems.moveTo(point.x, point.y);
      for (let drop = 0.25; drop < stemLength; drop += 0.25) {
        const sway = Math.sin(drop * 2 + z) * 0.15;
        const along = projectPoint(mouthX, z + sway, faceHeight - drop);
        stems.lineTo(along.x, along.y);
        const side = drop % 0.5 < 0.25 ? 1 : -1;
        traceLeaf(leaves, along.x + side * 0.08 * scale, along.y, (0.08 + random() * 0.06) * scale, side * 0.8);
      }
    }
  }
  ctx.strokeStyle = hazed("#0a100c", hillFrontZ);
  ctx.lineWidth = Math.max(1, 0.03 * scaleAt(hillFrontZ));
  ctx.stroke(stems);
  fillWithMoonlitEdge(leaves, hazed("#0b120d", hillFrontZ), 0.3);
}

// A single leaf: a pointed oval at an angle.
function traceLeaf(path, x, y, length, angle) {
  path.moveTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
  path.ellipse(x, y, length, length * 0.5, angle, 0, Math.PI * 2);
}

// A low bush: a cluster of overlapping leafy balls.
function traceBush(path, x, baseY, width, random) {
  for (let i = 0; i < 9; i++) {
    const radius = width * (0.1 + random() * 0.12);
    const ballX = x + (random() - 0.5) * width * 0.7;
    const ballY = baseY - radius * 0.7 - random() * width * 0.2;
    path.moveTo(ballX + radius, ballY);
    path.arc(ballX, ballY, radius, 0, Math.PI * 2);
  }
}

// A fern: long narrow fronds fanning out from one root and arching over.
function traceFern(path, x, baseY, size, random) {
  for (let i = 0; i < 7; i++) {
    const angle = Math.PI * (1.12 + (i / 6) * 0.76) + (random() - 0.5) * 0.15;
    const reach = size * (0.6 + random() * 0.4);
    const tipX = x + Math.cos(angle) * reach;
    const tipY = baseY + Math.sin(angle) * reach * 0.8 + reach * 0.25;
    const bendX = x + Math.cos(angle) * reach * 0.5;
    const bendY = baseY + Math.sin(angle) * reach;
    const half = size * 0.06;
    path.moveTo(x, baseY);
    path.quadraticCurveTo(bendX, bendY - half, tipX, tipY);
    path.quadraticCurveTo(bendX, bendY + half, x, baseY);
  }
}

// A rock half sunk into the ground: a lumpy dome.
function traceRock(path, x, baseY, width, height, random) {
  const corners = 7;
  path.moveTo(x - width / 2, baseY);
  for (let i = 1; i < corners; i++) {
    const angle = Math.PI + (i / corners) * Math.PI;
    const lump = 0.8 + random() * 0.3;
    path.lineTo(x + Math.cos(angle) * (width / 2) * lump, baseY + Math.sin(angle) * height * lump);
  }
  path.lineTo(x + width / 2, baseY);
  path.closePath();
}

// A broad-leaved tree: a trunk and a crown of overlapping circles.
function traceRoundTree(path, x, baseY, height, random) {
  const trunkWidth = height * 0.06;
  path.rect(x - trunkWidth / 2, baseY - height * 0.5, trunkWidth, height * 0.5);
  for (let i = 0; i < 7; i++) {
    const radius = height * (0.16 + random() * 0.1);
    const circleX = x + (random() - 0.5) * height * 0.6;
    const circleY = baseY - height * (0.55 + random() * 0.3);
    path.moveTo(circleX + radius, circleY);
    path.arc(circleX, circleY, radius, 0, Math.PI * 2);
  }
}

// The stone face, drawn in thin vertical strips. For each strip of screen
// the face covers, work out which distance from the camera it shows, take
// that column of the image, and stretch it to the right height.
function drawTunnelFace(face, mouthX, nearestZ, furthestZ) {
  const nearX = screenXAt(mouthX, hillFrontZ);
  const farX = screenXAt(mouthX, hillBackZ);
  const fromX = Math.floor(Math.min(nearX, farX));
  const toX = Math.ceil(Math.max(nearX, farX));
  const stripWidth = 2;
  const metresAcross = hillBackZ - hillFrontZ;
  // Solid strips overlap a little so no gap shows between them. Strips with
  // see-through parts can't, or every overlap shows as a darker line.
  const overlap = face.isSeeThrough ? 0 : 0.5;

  for (let screenX = fromX; screenX < toX; screenX += stripWidth) {
    // screenXAt the other way round: for a fixed point along the line, the
    // distance that lands at this column of the screen.
    const offset = screenX + stripWidth / 2 - window.innerWidth / 2;
    if (offset === 0) continue;
    const z = ((mouthX - travelled) * camera.focal) / offset;
    if (z < nearestZ || z > furthestZ) continue;

    const column = ((z - hillFrontZ) / metresAcross) * face.width;
    const top = groundYAt(z) - faceHeight * scaleAt(z);
    const height = faceHeight * scaleAt(z);
    ctx.drawImage(face, column, 0, 1, face.height, screenX, top, stripWidth + overlap, height);
  }
}

// Lamps on the tunnel wall, seen while the screen is dark inside.
function drawTunnelWallLamps(strength) {
  const z = camera.trackZ + 2.8;
  const scale = scaleAt(z);
  forEachSlot(z, 30, 2, (index, x) => {
    const lamp = projectPoint(x, z, 3.4);
    ctx.fillStyle = `rgba(255, 190, 110, ${strength})`;
    ctx.fillRect(lamp.x - 0.1 * scale, lamp.y - 0.1 * scale, 0.2 * scale, 0.2 * scale);
    drawGlow(lamp.x, lamp.y, 2 * scale, warmLight, 0.5 * strength);
  });
}
