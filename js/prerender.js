// A station or a tunnel mouth has far too much detail to draw from scratch
// sixty times a second: thousands of bricks, stone blocks, windows, ivy. So
// each is drawn once, in metres, into its own image, and every frame only
// that image is drawn, scaled to its distance.
//
// Inside an image, x runs left to right and y runs up from the bottom edge,
// both in metres. The canvas y axis points down, so heights are negative, as
// on the train.

const prerenderPixelsPerMetre = 40;

function prerender(widthMetres, heightMetres, drawDetail) {
  const image = makeCanvas(
    Math.ceil(widthMetres * prerenderPixelsPerMetre),
    Math.ceil(heightMetres * prerenderPixelsPerMetre),
  );
  const p = image.getContext("2d");
  p.translate(0, image.height);
  p.scale(prerenderPixelsPerMetre, prerenderPixelsPerMetre);
  drawDetail(p);
  image.widthMetres = widthMetres;
  image.heightMetres = heightMetres;
  return image;
}

// Fades a finished image towards the colour of the air at its distance. Done
// once, because the weather doesn't change during a journey.
function hazePrerendered(image, z) {
  const p = image.getContext("2d");
  p.save();
  p.setTransform(1, 0, 0, 1, 0, 0);
  p.globalCompositeOperation = "source-atop";
  const [red, green, blue] = getAir().color;
  p.fillStyle = `rgba(${red}, ${green}, ${blue}, ${hazeAt(z)})`;
  p.fillRect(0, 0, image.width, image.height);
  p.restore();
}

function drawPrerendered(image, leftX, z, bottomHeight = 0) {
  const topLeft = projectPoint(leftX, z, bottomHeight + image.heightMetres);
  const scale = scaleAt(z);
  ctx.drawImage(image, topLeft.x, topLeft.y, image.widthMetres * scale, image.heightMetres * scale);
}

// rgb is the brick colour as [red, green, blue]. Every brick gets its own
// small change of shade, the mortar shows between them, and alternate rows
// are shifted by half a brick, the way bricks are laid.
function drawBricks(p, left, bottom, width, height, rgb, seed) {
  const brickWidth = 0.23;
  const brickHeight = 0.075;
  const mortar = 0.012;
  p.save();
  p.beginPath();
  p.rect(left, -bottom - height, width, height);
  p.clip();
  p.fillStyle = `rgb(${rgb[0] * 0.45}, ${rgb[1] * 0.45}, ${rgb[2] * 0.45})`;
  p.fillRect(left, -bottom - height, width, height);

  const rows = Math.ceil(height / brickHeight);
  for (let row = 0; row < rows; row++) {
    const y = -bottom - (row + 1) * brickHeight;
    const shift = (row % 2) * (brickWidth / 2);
    for (let column = -1; column * brickWidth < width; column++) {
      const shade = 0.75 + hash(row, column, seed) * 0.4;
      p.fillStyle = `rgb(${rgb[0] * shade}, ${rgb[1] * shade}, ${rgb[2] * shade})`;
      p.fillRect(left + column * brickWidth + shift, y, brickWidth - mortar, brickHeight - mortar);
    }
  }
  p.restore();
}

function drawStones(p, left, bottom, width, height, rgb, seed, courseHeight = 0.45) {
  p.save();
  p.beginPath();
  p.rect(left, -bottom - height, width, height);
  p.clip();
  p.fillStyle = `rgb(${rgb[0] * 0.4}, ${rgb[1] * 0.4}, ${rgb[2] * 0.4})`;
  p.fillRect(left, -bottom - height, width, height);

  const rows = Math.ceil(height / courseHeight);
  for (let row = 0; row < rows; row++) {
    const y = -bottom - (row + 1) * courseHeight;
    let x = left - hash(row, 0, seed) * 0.6;
    let column = 0;
    while (x < left + width) {
      const stoneWidth = 0.6 + hash(row, column, seed + 1) * 0.6;
      const shade = 0.7 + hash(row, column, seed + 2) * 0.45;
      p.fillStyle = `rgb(${rgb[0] * shade}, ${rgb[1] * shade}, ${rgb[2] * shade})`;
      p.fillRect(x, y, stoneWidth - 0.03, courseHeight - 0.03);
      // Moonlight on the top edge of each stone
      p.fillStyle = "rgba(190, 200, 235, 0.08)";
      p.fillRect(x, y, stoneWidth - 0.03, 0.03);
      x += stoneWidth;
      column++;
    }
  }
  p.restore();
}

function drawIvy(p, x, top, spread, length, seed) {
  for (let i = 0; i < 260; i++) {
    const down = Math.pow(hash(i, 1, seed), 0.7) * length;
    const across = (hash(i, 2, seed) - 0.5) * spread * (1 - down / length * 0.6);
    const shade = 10 + hash(i, 3, seed) * 18;
    p.fillStyle = `rgb(${shade * 0.6}, ${shade}, ${shade * 0.7})`;
    p.beginPath();
    p.arc(x + across, -top + down, 0.05 + hash(i, 4, seed) * 0.06, 0, Math.PI * 2);
    p.fill();
  }
}

function drawStains(p, left, top, width, length, seed, strength = 0.35) {
  for (let i = 0; i < width * 3; i++) {
    const x = left + hash(i, 1, seed) * width;
    const streakLength = length * (0.3 + hash(i, 2, seed) * 0.7);
    const streak = p.createLinearGradient(0, -top, 0, -top + streakLength);
    streak.addColorStop(0, `rgba(0, 0, 0, ${strength})`);
    streak.addColorStop(1, "rgba(0, 0, 0, 0)");
    p.fillStyle = streak;
    p.fillRect(x, -top, 0.08 + hash(i, 3, seed) * 0.25, streakLength);
  }
}

function drawLampLight(p, x, height, radius, strength) {
  const light = p.createRadialGradient(x, -height, 0, x, -height, radius);
  light.addColorStop(0, `rgba(255, 180, 100, ${strength})`);
  light.addColorStop(1, "rgba(255, 180, 100, 0)");
  p.save();
  p.globalCompositeOperation = "lighter";
  p.fillStyle = light;
  p.fillRect(x - radius, -height - radius, radius * 2, radius * 2);
  p.restore();
}

// Spaced out, the way station names were sign-written.
function drawSpacedText(p, text, centerX, height, letterHeight, color) {
  p.save();
  p.translate(centerX, -height);
  p.scale(1 / prerenderPixelsPerMetre, 1 / prerenderPixelsPerMetre);
  p.font = `600 ${letterHeight * prerenderPixelsPerMetre}px Georgia, serif`;
  p.textAlign = "center";
  p.textBaseline = "middle";
  p.fillStyle = color;
  p.fillText(text.split("").join(" "), 0, 0);
  p.restore();
}
