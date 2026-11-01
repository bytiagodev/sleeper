// Sound, all made by code with the Web Audio API. There are no recordings.
//
// Every sound starts from one of two raw materials:
//   noise:  a hiss of random values. Passed through a filter it becomes
//           wind, rain, steam, the rumble of wheels or a knock.
//   tones:  plain notes from oscillators, for the whistle and the brakes.
//
// There are two kinds of sound:
//   beds:   steady sounds that loop for ever (wind, rain, the rumble of the
//           wheels, steam hiss, brake squeal). Each frame only their volume
//           changes, to follow what is happening.
//   events: short sounds started at one moment (a chuff, a wheel crossing a
//           rail joint, a door, the whistle).
//
// Browsers only allow sound after a click, so sound starts off and the
// Sound button turns it on.

const sound = {
  context: null,
  on: false,
  paused: false,
  listenerVolume: 1,
  distanceSinceChuff: 0,
  chuffCount: 0,
  axleJoints: [],
  trainOfAxles: null,
  previousState: null,
  previousTunnelDistance: Infinity,
  previousFrontX: null,
  doorsHeard: new Set(),
};

const soundButton = document.getElementById("sound-toggle");

const windByWeather = { clear: 0.08, rain: 0.11, snow: 0.14, fog: 0.06 };
const rainVolume = 0.1;
const rumbleVolume = 0.5;
const wheelBodyVolume = 0.1;
const steamVolume = 0.05;
const chuffVolume = 7.5;
// The four exhausts in each turn of the wheels are never equally strong on
// a real engine, because its two sides are never set up quite the same.
// Repeating a slightly uneven pattern gives the chuffs their lilt.
const chuffAccents = [1, 0.7, 0.9, 0.6];
const railClickVolume = 3.5;
const railKnockVolume = 0.12;
const railRingVolume = 0.015;
// A standing engine still simmers: its firebox burns and its boiler ticks.
const idleWheelBodyShare = 0.2;
// The level of the whole mix after the compressor, measured to sit near
// -21 dBFS while cruising. Below 1 because the browser's compressors already
// raise their output to make up for what they turn down.
const outputGain = 0.8;
// Three notes sounded together, like the chime whistles on many engines.
const whistleNotes = [392, 494, 587];
// Loud enough to ride over the train for a moment, as a real whistle does.
// This is about as loud as the limiter allows, so to stand out further the
// rest of the mix steps back to this share of its volume while it sounds.
const whistleVolume = 0.45;
const mixUnderWhistle = 0.55;
const tunnelWhistleDistance = 80;
// How far the engine runs into a tunnel, or out of one, before its sound
// has fully changed.
const enclosingDistance = 20;
// The cutoff of the train's sound while it is inside a tunnel and heard
// from outside: the walls swallow the high notes.
const muffledFrequency = 1200;
const openFrequency = 18000;
const portalWhumpVolume = 1.4;

function startSound() {
  const context = new AudioContext();
  sound.context = context;
  sound.noise = createNoiseBuffer(context, 2);

  // Everything passes through a compressor on its way to the speakers. It
  // turns the loudest moments down, so the whole mix can sit higher and the
  // quiet beds can be heard without a chuff or the whistle turning harsh.
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -24;
  compressor.knee.value = 12;
  compressor.ratio.value = 3;
  compressor.attack.value = 0.01;
  compressor.release.value = 0.3;
  sound.output = context.createGain();
  sound.output.gain.value = outputGain;
  // A last, much harder compressor that only acts on the rare peak that
  // would otherwise clip, such as hard chuffs as the train pulls away.
  const limiter = context.createDynamicsCompressor();
  limiter.threshold.value = -6;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.001;
  limiter.release.value = 0.1;
  // Two last volume controls: the listener's own setting, and the slow fade
  // of the sleep timer. Kept apart so that one never undoes the other.
  sound.volume = context.createGain();
  sound.volume.gain.value = sound.listenerVolume * sound.listenerVolume;
  sound.sleepFade = context.createGain();
  compressor.connect(sound.output).connect(limiter).connect(sound.volume).connect(sound.sleepFade);
  sound.sleepFade.connect(context.destination);

  sound.master = context.createGain();
  sound.master.gain.value = 1;
  sound.master.connect(compressor);

  // Sounds of the train go through trainBus. Inside a tunnel some of it
  // also goes through an echo, and comes back blurred and late off the
  // walls, and the rest is muffled while it is heard from outside. Wind
  // and rain go straight to the master, so a tunnel can fade them out.
  sound.trainBus = context.createGain();
  sound.muffle = context.createBiquadFilter();
  sound.muffle.type = "lowpass";
  sound.muffle.frequency.value = openFrequency;
  sound.trainBus.connect(sound.muffle).connect(sound.master);
  const echo = context.createConvolver();
  echo.buffer = createEchoResponse(context, 1.4);
  sound.echoVolume = context.createGain();
  sound.echoVolume.gain.value = 0;
  sound.trainBus.connect(echo).connect(sound.echoVolume).connect(sound.master);

  sound.wind = createNoiseBed("lowpass", 500, 0.7, sound.master);
  sound.rain = createNoiseBed("bandpass", 3000, 0.5, sound.master);
  sound.rumble = createNoiseBed("lowpass", 140, 0.7, sound.trainBus);
  // Laptop and phone speakers barely play below 200 Hz, where the rumble
  // lives. This higher band of it, the body of the wheels on the rails, is
  // what carries the train on small speakers. It swells a little each time
  // a wheel crosses a rail joint.
  sound.wheelSwell = context.createGain();
  sound.wheelSwell.connect(sound.trainBus);
  sound.wheelBody = createNoiseBed("bandpass", 300, 0.9, sound.wheelSwell);
  sound.steam = createNoiseBed("highpass", 4000, 0.7, sound.trainBus);
  sound.squeal = createToneBed([2900, 3170], sound.trainBus);
}

// Two seconds of random values, looped or cut into short bursts. Noise
// doesn't need the journey's seed: no two gusts of wind sound alike anyway.
function createNoiseBuffer(context, seconds) {
  const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  return buffer;
}

// What a clap would sound like in a tunnel: noise that dies away. The
// convolver plays this after every sound sent to it, which is an echo.
// Brick and soot absorb the high notes, so each value leans on the one
// before it, which smooths out the hiss and leaves a dark rumble.
function createEchoResponse(context, seconds) {
  const length = context.sampleRate * seconds;
  const buffer = context.createBuffer(2, length, context.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const samples = buffer.getChannelData(channel);
    let smoothed = 0;
    for (let i = 0; i < length; i++) {
      smoothed = smoothed * 0.85 + (Math.random() * 2 - 1) * 0.15;
      const fade = Math.pow(1 - i / length, 3);
      samples[i] = smoothed * fade;
    }
  }
  return buffer;
}

function createNoiseBed(filterType, frequency, q, destination) {
  const context = sound.context;
  const source = context.createBufferSource();
  source.buffer = sound.noise;
  source.loop = true;
  const filter = context.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = frequency;
  filter.Q.value = q;
  const volume = context.createGain();
  volume.gain.value = 0;
  source.connect(filter).connect(volume).connect(destination);
  source.start();
  return { filter, volume };
}

// Two notes slightly apart beat against each other, which gives the harsh
// wobble of a brake shoe on a wheel.
function createToneBed(frequencies, destination) {
  const context = sound.context;
  const volume = context.createGain();
  volume.gain.value = 0;
  volume.connect(destination);
  for (const frequency of frequencies) {
    const tone = context.createOscillator();
    tone.frequency.value = frequency;
    tone.connect(volume);
    tone.start();
  }
  return { volume };
}

// Changes a volume smoothly rather than in a jump, which would click.
function setVolume(bed, value) {
  bed.volume.gain.setTargetAtTime(value, sound.context.currentTime, 0.25);
}

// -1 is fully left, 1 fully right, matching where a point is on screen.
function panAt(worldX) {
  const share = screenXAt(worldX, camera.trackZ) / window.innerWidth;
  return Math.max(-0.8, Math.min(0.8, share * 2 - 1));
}

function sendToTrainBus(node, worldX) {
  const panner = sound.context.createStereoPanner();
  panner.pan.value = panAt(worldX);
  node.connect(panner).connect(sound.trainBus);
}

// A short note that starts sharply, slides from one pitch to another and
// dies away.
function playToneBurst(worldX, fromFrequency, toFrequency, volume, seconds) {
  const context = sound.context;
  const now = context.currentTime;
  const tone = context.createOscillator();
  tone.frequency.setValueAtTime(fromFrequency, now);
  tone.frequency.exponentialRampToValueAtTime(toFrequency, now + seconds);
  const envelope = context.createGain();
  envelope.gain.setValueAtTime(0, now);
  envelope.gain.linearRampToValueAtTime(volume, now + 0.003);
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
  tone.connect(envelope);
  sendToTrainBus(envelope, worldX);
  tone.start(now);
  tone.stop(now + seconds + 0.05);
}

// A short burst of filtered noise that starts sharply and dies away.
function playNoiseBurst(worldX, filterType, frequency, q, volume, seconds) {
  const context = sound.context;
  const now = context.currentTime;
  const source = context.createBufferSource();
  source.buffer = sound.noise;
  const filter = context.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = frequency;
  filter.Q.value = q;
  const envelope = context.createGain();
  envelope.gain.setValueAtTime(0, now);
  envelope.gain.linearRampToValueAtTime(volume, now + 0.005);
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
  source.connect(filter).connect(envelope);
  sendToTrainBus(envelope, worldX);
  // Starting somewhere random in the noise keeps every burst different.
  source.start(now, Math.random() * 1.5, seconds + 0.05);
}

function getChimneyWorldX() {
  return getTrainTailX() + getLocomotive().x + chimneyX;
}

// A chuff is steam blasting out of the chimney. At low speed the engine is
// working hard to get going, so each chuff is heavier.
function playChuff() {
  const effort = 1 - 0.5 * Math.min(1, motion.speed / cruiseSpeed);
  const accent = chuffAccents[sound.chuffCount % chuffAccents.length];
  sound.chuffCount++;
  const strength = chuffVolume * effort * accent;
  const chimney = getChimneyWorldX();
  playNoiseBurst(chimney, "bandpass", 600, 0.8, strength, 0.14);
  playNoiseBurst(chimney, "lowpass", 160, 0.7, strength * 0.5, 0.1);
}

// The clack of a wheel dropping over the small gap between two rails: the
// noise of the impact, a knock that drops in pitch as the weight of the
// wheel lands, and a faint ring from the steel. Every wheel hits a little
// differently.
function playRailClick(worldX) {
  const loudness = Math.min(1, motion.speed / 4) * (0.85 + Math.random() * 0.3);
  playNoiseBurst(worldX, "bandpass", 1800, 3, 0.14 * railClickVolume * loudness, 0.05);
  playNoiseBurst(worldX, "lowpass", 220, 0.7, 0.2 * railClickVolume * loudness, 0.08);
  playToneBurst(worldX, 210, 110, railKnockVolume * loudness, 0.09);
  // Two pitches that don't belong to the same note sound like struck metal
  // rather than like music.
  const pitch = 0.97 + Math.random() * 0.06;
  playToneBurst(worldX, 1130 * pitch, 1120 * pitch, railRingVolume * loudness, 0.14);
  playToneBurst(worldX, 1740 * pitch, 1730 * pitch, railRingVolume * 0.7 * loudness, 0.11);
  swellWheels(0.35 * loudness);
}

function swellWheels(strength) {
  const now = sound.context.currentTime;
  const swell = sound.wheelSwell.gain;
  swell.cancelScheduledValues(now);
  swell.setValueAtTime(1 + strength, now);
  swell.setTargetAtTime(1, now, 0.08);
}

// The thump of air the engine shoves ahead of it as it fills the mouth of a
// tunnel, and the softer one as it bursts out of the other end.
function playPortalWhump(worldX, strength) {
  const volume = portalWhumpVolume * strength * Math.min(1, motion.speed / cruiseSpeed);
  playNoiseBurst(worldX, "lowpass", 300, 0.7, volume, 0.6);
  playToneBurst(worldX, 160, 60, volume * 0.1, 0.4);
}

function playDoor(worldX) {
  playNoiseBurst(worldX, "lowpass", 300, 1, 0.5, 0.18);
  playNoiseBurst(worldX, "bandpass", 1200, 2, 0.08, 0.04);
}

// One blast of the whistle, starting after `delay` seconds.
function playWhistle(delay, seconds) {
  const context = sound.context;
  const start = context.currentTime + delay;
  const end = start + seconds;

  const envelope = context.createGain();
  envelope.gain.setValueAtTime(0, start);
  envelope.gain.linearRampToValueAtTime(whistleVolume, start + 0.08);
  envelope.gain.setValueAtTime(whistleVolume, end);
  envelope.gain.linearRampToValueAtTime(0, end + 0.25);
  // The whistle skips the compressor, which would flatten it back into the
  // rest of the mix. Only the limiter at the very end still guards it.
  const panner = context.createStereoPanner();
  panner.pan.value = panAt(getChimneyWorldX());
  envelope.connect(panner).connect(sound.output);
  sound.master.gain.setTargetAtTime(mixUnderWhistle, start, 0.05);
  sound.master.gain.setTargetAtTime(1, end, 0.3);

  for (const note of whistleNotes) {
    const tone = context.createOscillator();
    tone.type = "triangle";
    // A steam whistle slides up to its note as the steam comes on.
    tone.frequency.setValueAtTime(note * 0.93, start);
    tone.frequency.exponentialRampToValueAtTime(note, start + 0.12);
    tone.connect(envelope);
    tone.start(start);
    tone.stop(end + 0.3);
  }

  // The rush of steam through the whistle under the notes
  const breath = context.createBufferSource();
  breath.buffer = sound.noise;
  const breathFilter = context.createBiquadFilter();
  breathFilter.type = "bandpass";
  breathFilter.frequency.value = 1500;
  breathFilter.Q.value = 2;
  const breathVolume = context.createGain();
  breathVolume.gain.value = 0.5;
  breath.connect(breathFilter).connect(breathVolume).connect(envelope);
  breath.start(start, 0, seconds + 0.3);
}

// How far inside a tunnel the engine is, from 0 out in the open to 1 deep
// inside, whether it is going into one or coming out of the other end.
function getEnclosure() {
  const frontX = getTrainFrontX();
  const intoNext = (frontX - segment.tunnelX) / enclosingDistance;
  let insideLast = 0;
  if (segment.exitX !== null) insideLast = 1 - (frontX - segment.exitX) / enclosingDistance;
  return Math.max(0, Math.min(1, Math.max(intoNext, insideLast)));
}

function updateSound(dt) {
  if (!sound.on || sound.paused) return;
  const now = sound.context.currentTime;
  // Darkness is where the camera is, and so where we listen from. Enclosure
  // is where the engine is.
  const darkness = getTunnelDarkness();
  const outside = 1 - darkness;
  const enclosure = getEnclosure();
  const speedShare = motion.speed / cruiseSpeed;

  // Wind comes and goes in gusts.
  const gust = layeredNoise(motion.clock * 0.3, 77, 3);
  setVolume(sound.wind, windByWeather[activeWeather] * (0.4 + gust) * outside);
  sound.wind.filter.frequency.setTargetAtTime(300 + gust * 500, sound.context.currentTime, 0.5);
  setVolume(sound.rain, activeWeather === "rain" ? rainVolume * outside : 0);

  // Wheels rumble louder in the confined space of a tunnel.
  setVolume(sound.rumble, rumbleVolume * speedShare * (1 + darkness));
  setVolume(sound.wheelBody, wheelBodyVolume * Math.max(idleWheelBodyShare, speedShare) * (1 + darkness * 0.5));
  setVolume(sound.steam, motion.state === "stopped" ? steamVolume : 0);
  const squealing = motion.state === "braking" && motion.speed < 3;
  setVolume(sound.squeal, squealing ? 0.012 * (1 - motion.speed / 3) + 0.004 : 0);
  // From outside, a train in a tunnel sounds muffled and boomy. Once we
  // have followed it in, it is clear again, and the echo is all around.
  const muffling = enclosure * outside;
  // Pitch is heard in ratios, so the cutoff moves by ratio, not by hertz.
  const cutoff = openFrequency * Math.pow(muffledFrequency / openFrequency, muffling);
  sound.muffle.frequency.setTargetAtTime(cutoff, now, 0.15);
  sound.echoVolume.gain.setTargetAtTime(Math.max(enclosure * 0.35, darkness * 0.6), now, 0.3);

  updateChuffs(dt);
  updateRailClicks();
  updateWhistles();
  updateDoors();
  updatePortals();
}

function updatePortals() {
  const frontX = getTrainFrontX();
  const previous = sound.previousFrontX;
  sound.previousFrontX = frontX;
  if (previous === null) return;
  const crossed = (mouthX) => mouthX !== null && previous < mouthX && frontX >= mouthX;
  if (crossed(segment.tunnelX)) playPortalWhump(segment.tunnelX, 1);
  if (crossed(segment.exitX)) playPortalWhump(segment.exitX, 0.5);
}

// The same rhythm as the smoke: four chuffs for every turn of the wheels.
function updateChuffs(dt) {
  sound.distanceSinceChuff += motion.speed * dt;
  while (sound.distanceSinceChuff >= chuffSpacing) {
    sound.distanceSinceChuff -= chuffSpacing;
    playChuff();
  }
}

// The rail is laid in lengths with a joint every railJointSpacing metres.
// Each axle clicks as it crosses one, so the clicks come in the pattern of
// the train's wheels: the familiar clickety-clack.
function updateRailClicks() {
  const axles = getAxleXs();
  if (sound.trainOfAxles !== trainVehicles) {
    sound.trainOfAxles = trainVehicles;
    sound.axleJoints = axles.map(() => null);
  }
  const tailX = getTrainTailX();
  axles.forEach((axleX, i) => {
    const worldX = tailX + axleX;
    const joint = Math.floor(worldX / railJointSpacing);
    const previous = sound.axleJoints[i];
    // Only a step of one joint is a real crossing. A bigger jump means the
    // scenery was rebuilt in a tunnel.
    if (previous !== null && joint === previous + 1) playRailClick(worldX);
    sound.axleJoints[i] = joint;
  });
}

// Short then long when leaving a station, short when braking for one, and
// a long blast before a tunnel.
function updateWhistles() {
  if (sound.previousState === "stopped" && motion.state === "running") {
    playWhistle(0, 0.35);
    playWhistle(0.55, 1.1);
  }
  if (sound.previousState === "running" && motion.state === "braking") {
    playWhistle(0, 0.5);
  }
  sound.previousState = motion.state;

  const tunnelDistance = segment.tunnelX - getTrainFrontX();
  const reachedWhistlePoint =
    sound.previousTunnelDistance > tunnelWhistleDistance && tunnelDistance <= tunnelWhistleDistance;
  if (reachedWhistlePoint) playWhistle(0, 1.4);
  sound.previousTunnelDistance = tunnelDistance;
}

// A door bangs each time someone gets on or off at a station.
function updateDoors() {
  const station = segment.station;
  if (!station) return;
  for (const change of station.changes) {
    if (change.done && !sound.doorsHeard.has(change)) {
      sound.doorsHeard.add(change);
      playDoor(change.person.x);
    }
  }
}

// Turning sound on mid-journey shouldn't play everything that happened
// while it was off, so the sound starts from how things are now.
function catchUpSound() {
  sound.previousState = motion.state;
  sound.previousTunnelDistance = segment.tunnelX - getTrainFrontX();
  sound.previousFrontX = getTrainFrontX();
  if (segment.station) {
    for (const change of segment.station.changes) {
      if (change.done) sound.doorsHeard.add(change);
    }
  }
}

function setSoundOn(on) {
  sound.on = on;
  if (on && !sound.context) startSound();
  if (on) catchUpSound();
  if (on) sound.context.resume();
  else if (sound.context) sound.context.suspend();
  soundButton.textContent = on ? "Sound: on" : "Sound: off";
}

// The volume slider runs from 0 to 1. It is squared, because loudness is
// heard in ratios: that way halfway sounds about half as loud, instead of
// barely quieter than full.
function setListenerVolume(share) {
  sound.listenerVolume = share;
  if (!sound.context) return;
  sound.volume.gain.setTargetAtTime(share * share, sound.context.currentTime, 0.05);
}

function fadeSoundForSleep(target, seconds) {
  if (!sound.context) return;
  const now = sound.context.currentTime;
  const fade = sound.sleepFade.gain;
  fade.cancelScheduledValues(now);
  fade.setValueAtTime(fade.value, now);
  fade.linearRampToValueAtTime(target, now + seconds);
}

// While the scene sleeps, sound stops completely rather than just going
// quiet. Otherwise every chuff of the night would be waiting to play the
// moment it wakes.
function setSoundPaused(paused) {
  sound.paused = paused;
  if (!sound.context || !sound.on) return;
  if (paused) {
    sound.context.suspend();
  } else {
    catchUpSound();
    sound.context.resume();
  }
}

// Silent while the tab is hidden, back when it is shown again.
document.addEventListener("visibilitychange", () => {
  if (!sound.context || !sound.on || sound.paused) return;
  if (document.hidden) sound.context.suspend();
  else sound.context.resume();
});
