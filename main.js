let journey;
let activeWeather;
let activeBiome;
let layers = [];

// Phone screens can have three pixels for every CSS pixel. Past two, the
// difference can't be seen, but it costs more than twice the work.
const maxPixelRatio = 2;

// Lowered when the device can't keep up, so the scene is drawn with fewer
// pixels and stretched to fill the screen.
let renderScale = 1;

function resize() {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, maxPixelRatio) * renderScale;
  canvas.width = Math.round(window.innerWidth * pixelRatio);
  canvas.height = Math.round(window.innerHeight * pixelRatio);
  ctx.scale(pixelRatio, pixelRatio);
  updateCamera();
  createFinish();
  if (journey) buildSky();
}

// Every few seconds, check the average frame time. Slower than 40 frames a
// second, drop to fewer pixels, down to half.
const slowFrameSeconds = 1 / 40;
const speedCheckSeconds = 3;
let secondsMeasured = 0;
let framesMeasured = 0;

function checkSpeed(dt) {
  // The first seconds are skipped while the page settles in.
  if (motion.clock < 2) return;
  secondsMeasured += dt;
  framesMeasured++;
  if (secondsMeasured < speedCheckSeconds) return;
  const averageFrameSeconds = secondsMeasured / framesMeasured;
  secondsMeasured = 0;
  framesMeasured = 0;
  if (averageFrameSeconds > slowFrameSeconds && renderScale > 0.5) {
    renderScale -= 0.15;
    resize();
  }
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
  updateSound(dt);
  updateSleep();
  // Asleep, the screen is already dark: drawing would only keep the
  // computer busy.
  if (sleep.state !== "asleep") draw();
  checkSpeed(dt);

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
  drawSmokeFromTunnelMouth();
  drawWeather(true);
  drawTunnel();
  drawFinish();
}

// A journey can be shared as a link: ?journey=1234 replays journey 1234.
function getSeedFromLink() {
  const text = new URLSearchParams(location.search).get("journey");
  if (text === null) return null;
  const seed = Number(text);
  if (Number.isInteger(seed) && seed >= 0) return seed;
  return null;
}

// The address bar always holds the journey on screen, ready to be shared.
function updateLink() {
  try {
    history.replaceState(null, "", `?journey=${journey.seed}`);
  } catch {
    // Some browsers refuse this for pages opened from disk. Nothing breaks.
  }
}

const shareButton = document.getElementById("share");

function flashShareButton(text) {
  shareButton.textContent = text;
  setTimeout(() => (shareButton.textContent = "Share"), 2000);
}

// Phones get their own share menu; elsewhere the link is copied.
shareButton.addEventListener("click", async () => {
  const isTouchScreen = window.matchMedia("(pointer: coarse)").matches;
  if (navigator.share && isTouchScreen) {
    try {
      await navigator.share({ title: "Sleeper", text: createJourneyLabel(journey), url: location.href });
    } catch {
      // Closing the share menu counts as an error. Nothing to do.
    }
    return;
  }
  try {
    await navigator.clipboard.writeText(location.href);
    flashShareButton("Link copied");
  } catch {
    flashShareButton("Copy the address");
  }
});

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
startJourney(getSeedFromLink() ?? randomSeed());
showJourneyLabel();
if (prefersReducedMotion) {
  // A still frame has nothing happening to hear.
  soundButton.hidden = true;
  draw();
} else {
  requestAnimationFrame(loop);
}
