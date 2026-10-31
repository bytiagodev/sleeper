// A journey is a series of landscapes joined by tunnels. Each landscape is a
// stretch of line measured in metres: it begins where the train comes out of
// one tunnel, may have a station halfway along, and ends at the mouth of
// the next tunnel.
//
// Once half the train is inside a tunnel, the screen fades to dark: the
// camera has gone in with it. Only the train's lights and the lamps on the
// tunnel wall show. The next landscape is built in the dark, with the exit
// placed just ahead of the locomotive, and the screen fades back in as the
// train comes out.

const tunnelFadeOutSeconds = 1.2;
const tunnelHoldSeconds = 3;
const tunnelFadeInSeconds = 1.6;
const tunnelSeconds = tunnelFadeOutSeconds + tunnelHoldSeconds + tunnelFadeInSeconds;
const tunnelSwapSeconds = tunnelFadeOutSeconds + tunnelHoldSeconds / 2;
const fadeInStartSeconds = tunnelFadeOutSeconds + tunnelHoldSeconds;

const timeline = {
  stage: "open", // "open" or "tunnel"
  elapsed: 0, // seconds since this stage began
  biomeIndex: 0,
  swapped: false,
  nextSeed: null, // set only by the New journey button
};

// The stretch of line for the current landscape.
let segment = null;

const newJourneyButton = document.getElementById("new-journey");
const stationLabel = document.getElementById("station-label");

// Every journey begins with the train standing at a station, ready to leave.
const departureWaitSeconds = 8;

// secondsToExit is how long until the train should come out of a tunnel.
// It is null when there is no tunnel to come out of.
function showBiome(index, secondsToExit = null) {
  timeline.biomeIndex = index;
  activeBiome = journey.biomes[index];

  let startX = getTrainFrontX();
  let exitX = null;
  if (secondsToExit !== null) {
    exitX = startX + motion.speed * secondsToExit;
    startX = exitX;
  }

  const length = journey.biomeSeconds[index] * cruiseSpeed;
  segment = { exitX, tunnelX: startX + length, station: null };
  if (journey.stations[index]) {
    segment.station = createStation(startX + length * 0.5, journey.seed + 500 + index);
  }

  layers = buildBiomeLayers(activeBiome);
}

// The first landscape, with the train already standing at a platform, its
// front on the stopping mark. secondsInDark is how long the screen stays
// dark before the scene fades in, so the stop lasts that much longer.
function showDepartureStation(secondsInDark) {
  timeline.biomeIndex = 0;
  activeBiome = journey.biomes[0];

  const frontX = getTrainFrontX();
  const waitSeconds = departureWaitSeconds + secondsInDark;
  const length = journey.biomeSeconds[0] * cruiseSpeed;
  const station = createStation(frontX - stopPastMiddle, journey.seed + 500, waitSeconds, true);
  segment = { exitX: null, tunnelX: frontX + length, station };

  motion.state = "stopped";
  motion.speed = 0;
  motion.secondsToWait = waitSeconds;

  layers = buildBiomeLayers(activeBiome);
}

// secondsInDark is set when a new journey starts inside a tunnel, while the
// screen is black.
function startJourney(seed, secondsInDark = 0) {
  journey = generateJourney(seed);
  activeWeather = journey.weather;
  trainVehicles = createTrain();
  resetSmoke();
  weatherRandom = seededRandom(journey.seed + 7000);
  weatherBands = createWeatherBands();
  buildSky();
  showDepartureStation(secondsInDark);
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
  updateStationLabel();

  if (timeline.stage === "open") {
    // The camera follows the train in once half of it is inside.
    const trainMiddleX = (getTrainFrontX() + getTrainTailX()) / 2;
    if (trainMiddleX > segment.tunnelX) enterTunnel(null);
    return;
  }

  if (!timeline.swapped && timeline.elapsed >= tunnelSwapSeconds) {
    timeline.swapped = true;
    const secondsToExit = fadeInStartSeconds - timeline.elapsed;
    if (timeline.nextSeed !== null) {
      startJourney(timeline.nextSeed, secondsToExit + tunnelFadeInSeconds);
      showJourneyLabel();
    } else {
      const nextIndex = (timeline.biomeIndex + 1) % journey.biomes.length;
      showBiome(nextIndex, secondsToExit);
    }
  }

  if (timeline.elapsed >= tunnelSeconds) leaveTunnel();
}

// "Now stopping at…" shows while the train slows for a station and while
// it stands there, and fades once it leaves.
function updateStationLabel() {
  const station = segment.station;
  const atStation = station && (motion.state === "braking" || motion.state === "stopped");
  if (station && station.isDeparture && motion.state === "stopped") {
    stationLabel.textContent = `Departing from ${station.name}`;
    stationLabel.classList.remove("is-hidden");
  } else if (atStation) {
    stationLabel.textContent = `Now stopping at ${station.name}`;
    stationLabel.classList.remove("is-hidden");
  } else {
    stationLabel.classList.add("is-hidden");
  }
}

function getTunnelDarkness() {
  if (timeline.stage !== "tunnel") return 0;

  const time = timeline.elapsed;
  if (time < tunnelFadeOutSeconds) {
    return easeInOut(time / tunnelFadeOutSeconds);
  }
  if (time < fadeInStartSeconds) {
    return 1;
  }
  const fadeInProgress = Math.min(1, (time - fadeInStartSeconds) / tunnelFadeInSeconds);
  return 1 - easeInOut(fadeInProgress);
}

// The darkness covers everything, including the train. The train's lights
// and the tunnel's wall lamps are then drawn again on top so they stay lit.
// A new journey fades fully to black instead, because the train itself may
// change in the dark.
function drawTunnel() {
  const darkness = getTunnelDarkness();
  if (darkness === 0) return;

  ctx.fillStyle = `rgba(3, 4, 9, ${darkness})`;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  if (timeline.nextSeed === null) {
    drawTunnelWallLamps(darkness);
    ctx.globalAlpha = darkness;
    drawTrainLights();
    ctx.globalAlpha = 1;
  }
}
