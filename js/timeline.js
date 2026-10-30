// Between two landscapes the train goes through a tunnel. The screen fades
// out, holds, and fades back in; the new landscape is swapped in during the
// hold, while nothing can be seen.
const tunnelFadeOutSeconds = 1.8;
const tunnelHoldSeconds = 3;
const tunnelFadeInSeconds = 2.4;
const tunnelSeconds = tunnelFadeOutSeconds + tunnelHoldSeconds + tunnelFadeInSeconds;
const tunnelSwapSeconds = tunnelFadeOutSeconds + tunnelHoldSeconds / 2;

const timeline = {
  stage: "open", // "open" or "tunnel"
  elapsed: 0, // seconds since this stage began
  biomeIndex: 0,
  swapped: false,
  nextSeed: null, // set only by the New journey button
};

const newJourneyButton = document.getElementById("new-journey");

function showBiome(index) {
  timeline.biomeIndex = index;
  activeBiome = journey.biomes[index];
  layers = buildBiomeLayers(activeBiome);
}

function startJourney(seed) {
  journey = generateJourney(seed);
  activeWeather = journey.weather;
  carriageWindowSets = createCarriageWindowSets();
  weatherRandom = seededRandom(journey.seed + 7000);
  weatherBands = createWeatherBands();
  showBiome(0);
}

function enterTunnel(nextSeed) {
  timeline.stage = "tunnel";
  timeline.elapsed = 0;
  timeline.swapped = false;
  timeline.nextSeed = nextSeed;
  newJourneyButton.disabled = true;
  if (nextSeed !== null) journeyLabel.classList.add("is-hidden");
}

function leaveTunnel() {
  timeline.stage = "open";
  timeline.elapsed = 0;
  timeline.nextSeed = null;
  newJourneyButton.disabled = false;
}

function updateTimeline(dt) {
  timeline.elapsed += dt;

  if (timeline.stage === "open") {
    if (timeline.elapsed >= journey.biomeSeconds[timeline.biomeIndex]) {
      enterTunnel(null);
    }
    return;
  }

  if (!timeline.swapped && timeline.elapsed >= tunnelSwapSeconds) {
    timeline.swapped = true;
    if (timeline.nextSeed !== null) {
      startJourney(timeline.nextSeed);
      showJourneyLabel();
    } else {
      const nextIndex = (timeline.biomeIndex + 1) % journey.biomes.length;
      showBiome(nextIndex);
    }
  }

  if (timeline.elapsed >= tunnelSeconds) leaveTunnel();
}

function getTunnelDarkness() {
  if (timeline.stage !== "tunnel") return 0;

  const time = timeline.elapsed;
  const fadeInStart = tunnelFadeOutSeconds + tunnelHoldSeconds;
  if (time < tunnelFadeOutSeconds) {
    return easeInOut(time / tunnelFadeOutSeconds);
  }
  if (time < fadeInStart) {
    return 1;
  }
  const fadeInProgress = Math.min(1, (time - fadeInStart) / tunnelFadeInSeconds);
  return 1 - easeInOut(fadeInProgress);
}

// The darkness covers everything, including the train. The train's lights
// are then drawn again on top so they stay lit. A new journey fades fully
// to black instead, because the train itself may change in the dark.
function drawTunnel() {
  const darkness = getTunnelDarkness();
  if (darkness === 0) return;

  ctx.fillStyle = `rgba(3, 4, 9, ${darkness})`;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  if (timeline.nextSeed === null) {
    ctx.globalAlpha = darkness;
    drawTrainLights();
    ctx.globalAlpha = 1;
  }
}
