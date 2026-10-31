let journey;
let activeWeather;
let activeBiome;
let layers = [];

// Speeds are in metres per second. The train eases towards its target speed
// instead of jumping to it, so it can later brake into stations.
const cruiseSpeed = 8;
const acceleration = 0.6;
const motion = { speed: cruiseSpeed, clock: 0 };

// The target drifts slowly around cruising speed, so the ride never feels
// mechanical.
function getTargetSpeed(seconds) {
  const drift = Math.sin(seconds * 0.15) * 0.12 + Math.sin(seconds * 0.37) * 0.03;
  return cruiseSpeed * (1 + drift);
}

function updateMotion(dt) {
  motion.clock += dt;
  const difference = getTargetSpeed(motion.clock) - motion.speed;
  const maxChange = acceleration * dt;
  motion.speed += Math.max(-maxChange, Math.min(maxChange, difference));
  travelled += motion.speed * dt;
}

function resize() {
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * pixelRatio;
  canvas.height = window.innerHeight * pixelRatio;
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  ctx.scale(pixelRatio, pixelRatio);
  updateCamera();
  createFinish();
  if (journey) buildSky();
}

let lastTime = 0;

function loop(currentTime) {
  // Capped so a hidden tab coming back doesn't jump the train forward.
  const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
  lastTime = currentTime;

  updateMotion(dt);
  updateSmoke(dt);
  updateWeather(dt);
  updateTimeline(dt);
  draw();

  requestAnimationFrame(loop);
}

function draw() {
  drawSky();
  drawGround();
  for (const layer of layers) {
    if (layer.z >= camera.trackZ) layer.draw();
  }
  drawRainShade();
  drawWeather(false);
  drawTrain();
  for (const layer of layers) {
    if (layer.z < camera.trackZ) layer.draw();
  }
  drawWeather(true);
  drawTunnel();
  drawFinish();
}

const journeyLabel = document.getElementById("journey-label");

function showJourneyLabel() {
  journeyLabel.textContent = createJourneyLabel(journey);
  journeyLabel.classList.remove("is-hidden");
}

// People who turn on reduced motion get a single still frame instead.
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

newJourneyButton.addEventListener("click", () => {
  if (prefersReducedMotion) {
    startJourney(randomSeed());
    showJourneyLabel();
    draw();
    return;
  }
  if (timeline.stage === "tunnel") return;
  enterTunnel(randomSeed());
});

window.addEventListener("resize", () => {
  resize();
  if (prefersReducedMotion) draw();
});

createGroundPattern();
createFogTexture();
resize();
startJourney(randomSeed());
showJourneyLabel();
if (prefersReducedMotion) {
  draw();
} else {
  requestAnimationFrame(loop);
}
