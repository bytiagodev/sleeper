// Particles sit at three depths. Far ones are small, faint and slow; near
// ones are big, bright and fast. Only the nearest are drawn over the train.
const weatherDepths = [0.2, 0.55, 1];
const particleCounts = { clear: 0, rain: 420, snow: 270, fog: 0 };

let weatherRandom;
let weatherBands = [];

// The camera moves with the train, so falling rain and snow drift left on
// screen. That drift is what makes the rain slant.
function getSidewaysSpeed(depth) {
  return -(20 + depth * 100) * (motion.speed / cruiseSpeed);
}

function getFallSpeed(depth) {
  if (activeWeather === "rain") {
    return 380 + depth * 420 + weatherRandom() * 80;
  }
  return (16 + depth * 34) * (0.8 + weatherRandom() * 0.4);
}

// Particles are reused: one that lands goes back to the top with new values,
// instead of being thrown away and replaced by a new one.
function resetParticle(particle, depth, startAnywhere) {
  const height = window.innerHeight;
  particle.x = weatherRandom() * (window.innerWidth + 300);
  if (startAnywhere) {
    particle.y = weatherRandom() * height;
  } else {
    particle.y = -10 - weatherRandom() * 60;
  }
  particle.speedY = getFallSpeed(depth);

  const landingY = camera.horizonY + weatherRandom() * (height - camera.horizonY);
  particle.secondsLeft = Math.max(0.05, (landingY - particle.y) / particle.speedY);

  particle.radius = (0.7 + depth * 1.6) * (0.7 + weatherRandom() * 0.6);
  particle.swaySpeed = 0.8 + weatherRandom() * 1.2;
  particle.swaySize = 6 + weatherRandom() * 14;
  particle.swayStart = weatherRandom() * Math.PI * 2;
}

function createWeatherBands() {
  const countPerBand = particleCounts[activeWeather] / weatherDepths.length;
  return weatherDepths.map((depth) => {
    const particles = [];
    for (let i = 0; i < countPerBand; i++) {
      const particle = {};
      resetParticle(particle, depth, true);
      particles.push(particle);
    }
    return { depth, particles, inFront: depth === 1 };
  });
}

function updateWeather(dt) {
  for (const band of weatherBands) {
    const sidewaysSpeed = getSidewaysSpeed(band.depth);
    for (const particle of band.particles) {
      particle.x += sidewaysSpeed * dt;
      particle.y += particle.speedY * dt;
      particle.secondsLeft -= dt;
      if (particle.secondsLeft <= 0 || particle.x < -60) {
        resetParticle(particle, band.depth, false);
      }
    }
  }
}

// All the drops in a band go into one path and are drawn in one call, which
// is much faster than hundreds of separate calls.
function drawRain(band) {
  const streakSeconds = 0.03;
  const sidewaysSpeed = getSidewaysSpeed(band.depth);
  ctx.strokeStyle = `rgba(159, 176, 216, ${0.12 + band.depth * 0.22})`;
  ctx.lineWidth = band.depth === 1 ? 1.4 : 1;
  ctx.beginPath();
  for (const particle of band.particles) {
    ctx.moveTo(particle.x, particle.y);
    ctx.lineTo(
      particle.x - sidewaysSpeed * streakSeconds,
      particle.y - particle.speedY * streakSeconds,
    );
  }
  ctx.stroke();
}

function drawSnow(band) {
  const seconds = performance.now() / 1000;
  ctx.fillStyle = `rgba(232, 236, 244, ${0.35 + band.depth * 0.5})`;
  ctx.beginPath();
  for (const particle of band.particles) {
    const sway = Math.sin(seconds * particle.swaySpeed + particle.swayStart) * particle.swaySize * band.depth;
    const x = particle.x + sway;
    // Without moveTo, the path would join each flake to the previous one.
    ctx.moveTo(x + particle.radius, particle.y);
    ctx.arc(x, particle.y, particle.radius, 0, Math.PI * 2);
  }
  ctx.fill();
}

function drawWeather(inFront) {
  for (const band of weatherBands) {
    if (band.inFront !== inFront) continue;
    if (activeWeather === "rain") drawRain(band);
    if (activeWeather === "snow") drawSnow(band);
  }
}

// Rain clouds block the moonlight. The shade goes under the train, so its
// windows look brighter against the darker world.
function drawRainShade() {
  if (activeWeather !== "rain") return;
  ctx.fillStyle = "rgba(4, 5, 12, 0.32)";
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
}
