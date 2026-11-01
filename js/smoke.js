// A two-cylinder steam engine exhausts four times for every turn of its
// wheels, which is the "chuff chuff" rhythm. So a puff of smoke leaves the
// chimney every quarter turn, and a faster train puffs faster.
const chuffSpacing = (2 * Math.PI * driverRadius) / 4;
const puffCount = 160;

const puffs = [];
let puffSprites = [];
let smokeRandom;
let distanceSinceChuff = 0;
let secondsSinceIdlePuff = 0;

function resetSmoke() {
  smokeRandom = seededRandom(journey.seed + 8000);
  if (puffSprites.length === 0) puffSprites = [1, 2, 3].map(createPuffSprite);
  puffs.length = 0;
  for (let i = 0; i < puffCount; i++) puffs.push({ alive: false });
}

// A soft, lumpy ball of smoke, drawn once and reused for every puff.
function createPuffSprite(seed) {
  const size = 64;
  return makeTexture(size, size, (x, y) => {
    const distanceFromCentre = Math.hypot(x - size / 2, y - size / 2) / (size / 2);
    const lumpiness = layeredNoise2D(x / 12, y / 12, seed * 20, 4);
    const density = Math.max(0, 1 - distanceFromCentre - (1 - lumpiness) * 0.5);
    return [196, 202, 222, Math.min(1, density * 1.6) * 255];
  });
}

function releasePuff() {
  const puff = puffs.find((candidate) => !candidate.alive);
  if (!puff) return;
  const locomotive = getLocomotive();
  puff.alive = true;
  puff.age = 0;
  puff.lifetime = 3 + smokeRandom() * 2;
  puff.x = locomotive.x + chimneyX + (smokeRandom() - 0.5) * 0.5;
  puff.y = chimneyTop;
  puff.riseSpeed = 2 + smokeRandom() * 1.2;
  puff.size = 0.9 + smokeRandom() * 0.5;
  puff.sprite = puffSprites[Math.floor(smokeRandom() * puffSprites.length)];
  puff.tunnelX = null;

  // Once the chimney is inside, the smoke has nowhere to go but back out of
  // the mouth, where it rolls up the stone face, thick and slow.
  const tunnelX = segment.tunnelX;
  const chimneyIsInside = getTrainTailX() + locomotive.x + chimneyX > tunnelX;
  if (chimneyIsInside) {
    puff.tunnelX = tunnelX;
    puff.x = tunnelX - getTrainTailX() - smokeRandom() * 0.8;
    puff.y = -(archSpringHeight + archHalfWidth) + 0.5 + smokeRandom() * 0.4;
    puff.riseSpeed = 1 + smokeRandom() * 0.8;
    puff.size = 1.6 + smokeRandom() * 0.8;
  }
}

function updateSmoke(dt) {
  distanceSinceChuff += motion.speed * dt;
  while (distanceSinceChuff >= chuffSpacing) {
    distanceSinceChuff -= chuffSpacing;
    // Two overlapping puffs per chuff, so the trail looks continuous.
    releasePuff();
    releasePuff();
  }

  // Standing at a station, the engine still breathes out a lazy puff now
  // and then, which rises straight up because the train isn't moving.
  if (motion.speed < 0.3) {
    secondsSinceIdlePuff += dt;
    if (secondsSinceIdlePuff > 0.7) {
      secondsSinceIdlePuff = 0;
      releasePuff();
    }
  }

  for (const puff of puffs) {
    if (!puff.alive) continue;
    puff.age += dt;
    // Smoke from a tunnel mouth that is no longer there, after the next
    // landscape has been built in the dark.
    const tunnelIsGone = puff.tunnelX !== null && puff.tunnelX !== segment.tunnelX;
    if (puff.age > puff.lifetime || tunnelIsGone) {
      puff.alive = false;
      continue;
    }
    // The smoke stays where it left the chimney while the train moves on,
    // so it trails back along the train. It rises, slows and spreads out.
    puff.x -= motion.speed * dt;
    puff.y -= puff.riseSpeed * dt;
    puff.riseSpeed *= 1 - 0.6 * dt;
    puff.size += 1.6 * dt;
  }
}

// Smoke from the chimney is drawn with the train. Smoke from a tunnel mouth
// is drawn later, over the hill and the stone face.
function drawSmoke(fromTunnelMouth) {
  ctx.save();
  for (const puff of puffs) {
    if (!puff.alive) continue;
    if ((puff.tunnelX !== null) !== fromTunnelMouth) continue;
    const progress = puff.age / puff.lifetime;
    ctx.globalAlpha = 0.3 * (1 - progress) * Math.min(1, puff.age * 6);
    ctx.drawImage(puff.sprite, puff.x - puff.size / 2, puff.y - puff.size / 2, puff.size, puff.size);
  }
  ctx.restore();
}

function drawSmokeFromTunnelMouth() {
  ctx.save();
  moveToTrain(getTrainLayout());
  drawSmoke(true);
  ctx.restore();
}
