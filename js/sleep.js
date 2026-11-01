// The sleep timer. When it runs out, the sound fades away and the screen
// slowly darkens while the train carries on. Once everything is dark, the
// scene stops drawing and the sound stops, so a sleeping laptop isn't kept
// busy all night. Any movement or tap wakes it again.

// Matches the long transition on .sleep-veil.is-asleep in style.css.
const sleepFadeSeconds = 30;

const sleepVeil = document.getElementById("sleep-veil");

const sleep = {
  state: "awake", // "awake", "fading" or "asleep"
  fadesAt: null, // when the fade begins, as a Date.now() time, or null
  fadeStartedAt: null,
};

function setSleepTimer(minutes) {
  sleep.fadesAt = minutes > 0 ? Date.now() + minutes * 60 * 1000 : null;
}

function updateSleep() {
  const now = Date.now();

  if (sleep.state === "awake" && sleep.fadesAt !== null && now >= sleep.fadesAt) {
    sleep.state = "fading";
    sleep.fadeStartedAt = now;
    sleepVeil.classList.add("is-asleep");
    fadeSoundForSleep(0, sleepFadeSeconds);
  }

  if (sleep.state === "fading" && now >= sleep.fadeStartedAt + sleepFadeSeconds * 1000) {
    sleep.state = "asleep";
    setSoundPaused(true);
  }
}

function wakeUp() {
  if (sleep.state === "awake") return;
  if (sleep.state === "asleep") setSoundPaused(false);
  sleep.state = "awake";
  sleep.fadesAt = null;
  sleepVeil.classList.remove("is-asleep");
  fadeSoundForSleep(1, 2);
}
