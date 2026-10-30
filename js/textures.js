// Textures are painted once, when the page loads or the window changes size,
// and then reused every frame. Painting them pixel by pixel is slow, but it
// only happens once.

// colorAt(x, y) returns [red, green, blue, alpha], each from 0 to 255.
function makeTexture(width, height, colorAt) {
  const texture = document.createElement("canvas");
  texture.width = width;
  texture.height = height;
  const textureCtx = texture.getContext("2d");
  const image = textureCtx.createImageData(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [red, green, blue, alpha] = colorAt(x, y);
      const index = (y * width + x) * 4;
      image.data[index] = red;
      image.data[index + 1] = green;
      image.data[index + 2] = blue;
      image.data[index + 3] = alpha;
    }
  }

  textureCtx.putImageData(image, 0, 0);
  return texture;
}

function makeCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

// Glows

// A soft round glow, painted once per colour and then stamped wherever a
// light is. "lighter" adds the glow's colour to what is underneath, the way
// light adds up, instead of painting over it.
const glowSprites = {};

function getGlowSprite(color) {
  if (!glowSprites[color]) {
    const size = 128;
    const sprite = makeCanvas(size, size);
    const spriteCtx = sprite.getContext("2d");
    const middle = size / 2;
    const gradient = spriteCtx.createRadialGradient(middle, middle, 0, middle, middle, middle);
    gradient.addColorStop(0, `rgba(${color}, 0.9)`);
    gradient.addColorStop(0.25, `rgba(${color}, 0.35)`);
    gradient.addColorStop(1, `rgba(${color}, 0)`);
    spriteCtx.fillStyle = gradient;
    spriteCtx.fillRect(0, 0, size, size);
    glowSprites[color] = sprite;
  }
  return glowSprites[color];
}

// color is "red, green, blue", for example "255, 199, 110".
function drawGlow(x, y, radius, color, strength = 1) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha *= strength;
  ctx.drawImage(getGlowSprite(color), x - radius, y - radius, radius * 2, radius * 2);
  ctx.restore();
}

const warmLight = "255, 190, 105";

// Ground

const groundTextureSize = 512;
// Across the line one copy covers 32 m; away from the camera it covers
// 64 m. Seen in perspective, depth is squashed, so stretching the texture
// that way makes its patches look round instead of like ripples on water.
const groundTexelsPerMetre = 16;
const groundTexelsPerMetreDeep = 8;
let groundPattern;

// Light and dark patches with a fine speckle on top. It is transparent where
// it is neither, so the ground colour of each landscape shows through.
function createGroundPattern() {
  const size = groundTextureSize;
  const cells = 24;
  const texture = makeTexture(size, size, (x, y) => {
    const patches = layeredNoise2D((x / size) * cells, (y / size) * cells, 3, 5, cells);
    const speckle = hash(x, y, 5) - 0.5;
    const brightness = (patches - 0.5) * 1.4 + speckle * 0.8;
    if (brightness > 0) return [150, 165, 215, brightness * 40];
    return [0, 0, 0, -brightness * 110];
  });
  groundPattern = ctx.createPattern(texture, "repeat");
}

// The ground is drawn as thin horizontal strips. Each strip is a slice of
// the same texture, stretched to the scale of its distance and shifted by how
// far the train has gone, so near ground rushes past and far ground creeps.
function drawGroundTexture(farthestZ) {
  const stripHeight = 3;
  const top = Math.ceil(groundYAt(farthestZ));

  ctx.save();
  ctx.fillStyle = groundPattern;
  for (let y = top; y < window.innerHeight; y += stripHeight) {
    const z = zAtGroundY(y);
    const pixelsPerTexel = scaleAt(z) / groundTexelsPerMetre;
    const textureRow = z * groundTexelsPerMetreDeep;
    // Line the texture up so world position 0 and this strip's texture row
    // land where they should on screen.
    groundPattern.setTransform(new DOMMatrix([pixelsPerTexel, 0, 0, 1, screenXAt(0, z), y - textureRow]));
    // Far strips fade out; up close there is detail, in the distance there is
    // only colour.
    ctx.globalAlpha = Math.min(1, (farthestZ - z) / (farthestZ * 0.8));
    ctx.fillRect(0, y, window.innerWidth, stripHeight);
  }
  ctx.restore();
}

// Finish

let finish;

// Darkened corners and a faint grain over the whole frame, painted together
// into one image. The grain also hides visible steps in smooth gradients.
function createFinish() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  finish = makeCanvas(width, height);
  const finishCtx = finish.getContext("2d");

  const vignette = finishCtx.createRadialGradient(
    width / 2, height * 0.55, Math.min(width, height) * 0.35,
    width / 2, height * 0.55, Math.max(width, height) * 0.8,
  );
  vignette.addColorStop(0, "rgba(0, 0, 6, 0)");
  vignette.addColorStop(1, "rgba(0, 0, 6, 0.55)");
  finishCtx.fillStyle = vignette;
  finishCtx.fillRect(0, 0, width, height);

  const grain = makeTexture(256, 256, (x, y) => {
    const value = hash(x, y, 11) - 0.5;
    if (value > 0) return [255, 255, 255, value * 7];
    return [0, 0, 0, -value * 22];
  });
  finishCtx.fillStyle = finishCtx.createPattern(grain, "repeat");
  finishCtx.fillRect(0, 0, width, height);
}

function drawFinish() {
  ctx.drawImage(finish, 0, 0, window.innerWidth, window.innerHeight);
}

// Moonlight comes from the right. Things with an outline get a thin lit
// edge on that side: draw the shape in moonlight, one pixel to the right and
// up, then draw it again in its own colour on top. Only the edge stays lit.
function fillWithMoonlitEdge(path, color, edgeAlpha) {
  ctx.save();
  ctx.translate(1, -0.5);
  ctx.fillStyle = `rgba(150, 165, 230, ${edgeAlpha})`;
  ctx.fill(path);
  ctx.restore();
  ctx.fillStyle = color;
  ctx.fill(path);
}
