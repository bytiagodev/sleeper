// The Sound button and its panel, and the way the buttons step aside: a
// few seconds after the mouse stops, they fade out and the pointer hides,
// so only the scene is left. Any movement brings them back.

const soundControl = document.getElementById("sound-control");
const soundPanel = document.getElementById("sound-panel");
const volumeSlider = document.getElementById("volume");
const sleepButtons = [...document.querySelectorAll("[data-sleep-minutes]")];
const sleepStatus = document.getElementById("sleep-status");
const soundOffButton = document.getElementById("sound-off");

const idleSeconds = 4;
const volumeStorageKey = "sleeper-volume";
let idleTimer = null;

function isPanelOpen() {
  return soundPanel.classList.contains("is-open");
}

function setPanelOpen(open) {
  soundPanel.classList.toggle("is-open", open);
  soundButton.setAttribute("aria-expanded", String(open));
}

// Browsers only allow sound after a click, so the first click turns sound
// on as well as opening the panel. After that it just opens and closes it.
soundButton.addEventListener("click", () => {
  if (!sound.on) {
    setSoundOn(true);
    setPanelOpen(true);
    return;
  }
  setPanelOpen(!isPanelOpen());
});

soundOffButton.addEventListener("click", () => {
  setSoundOn(false);
  setPanelOpen(false);
  soundButton.focus();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !isPanelOpen()) return;
  setPanelOpen(false);
  soundButton.focus();
});

document.addEventListener("pointerdown", (event) => {
  if (!soundControl.contains(event.target)) setPanelOpen(false);
});

// The volume is remembered between visits. Storage is refused in some
// private windows and for pages opened from disk; then it just isn't kept.
function loadVolume() {
  try {
    const saved = localStorage.getItem(volumeStorageKey);
    if (saved !== null) return Number(saved);
  } catch {}
  return sound.listenerVolume;
}

function saveVolume(share) {
  try {
    localStorage.setItem(volumeStorageKey, String(share));
  } catch {}
}

function applyVolume() {
  const share = volumeSlider.value / 100;
  setListenerVolume(share);
  volumeSlider.style.setProperty("--fill", `${volumeSlider.value}%`);
  return share;
}

volumeSlider.value = Math.round(loadVolume() * 100);
applyVolume();
volumeSlider.addEventListener("input", () => saveVolume(applyVolume()));

function chooseSleep(minutes) {
  setSleepTimer(minutes);
  for (const button of sleepButtons) {
    const isChosen = Number(button.dataset.sleepMinutes) === minutes;
    button.setAttribute("aria-pressed", String(isChosen));
  }
  sleepStatus.textContent = "";
  if (sleep.fadesAt !== null) {
    const fadedAt = new Date(sleep.fadesAt + sleepFadeSeconds * 1000);
    const time = fadedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    sleepStatus.textContent = `Fades out by ${time}`;
  }
}

for (const button of sleepButtons) {
  button.addEventListener("click", () => chooseSleep(Number(button.dataset.sleepMinutes)));
}

function noticeActivity() {
  if (sleep.state !== "awake") {
    wakeUp();
    chooseSleep(0);
  }
  document.body.classList.remove("is-idle");
  clearTimeout(idleTimer);
  idleTimer = setTimeout(goIdle, idleSeconds * 1000);
}

// The buttons stay while someone is using them: with the panel open, or
// with keyboard focus on one of them.
function goIdle() {
  if (isPanelOpen()) return;
  const focused = document.activeElement;
  if (focused && focused.closest(".buttons") && focused.matches(":focus-visible")) return;
  document.body.classList.add("is-idle");
}

for (const type of ["pointermove", "pointerdown", "keydown", "wheel", "touchstart"]) {
  window.addEventListener(type, noticeActivity, { passive: true });
}
noticeActivity();
