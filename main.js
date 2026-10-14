const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d");

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rand, list) {
  return list[Math.floor(rand() * list.length)];
}

function generateJourney(seed) {
  const rand = mulberry32(seed);
  const count = 2 + Math.floor(rand() * 3);
  const biomes = [];
  const all = ["city", "forest", "fields"];
  for (let i = 0; i < count; i++) {
    const options = all.filter((b) => b !== biomes[i - 1]);
    biomes.push(pick(rand, options));
  }
  const weather = pick(rand, ["clear", "rain", "snow"]);
  const hour = 22 + Math.floor(rand() * 3);
  const minute = Math.floor(rand() * 60);
  const train = {
    carriages: 4 + Math.floor(rand() * 5),
    livery: Math.floor(rand() * 3),
  };
  const stations = biomes.map(() => rand() < 0.3);
  return { seed, biomes, weather, hour, minute, train, stations };
}

function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  ctx.scale(dpr, dpr);
}

let lastTime = 0;

function loop(currentTime) {
  const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
  lastTime = currentTime;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

function update(dt) {
  updateLayers(dt);
}

function drawSky() {
  const gradient = ctx.createLinearGradient(0, 0, 0, window.innerHeight);
  gradient.addColorStop(0, "#2b2d55");
  gradient.addColorStop(1, "#151a38");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
}

function drawMoon() {
  ctx.fillStyle = "#f2ead8";
  ctx.beginPath();
  ctx.arc(
    window.innerWidth * 0.8,
    window.innerHeight * 0.2,
    40,
    0,
    Math.PI * 2,
  );
  ctx.fill();
}

const layers = [];

function updateLayers(dt) {
  const width = window.innerWidth;
  for (const layer of layers) {
    layer.x -= layer.speed * dt;
    layer.x = layer.x % width;
  }
}

function drawLayers() {
  for (const layer of layers) {
    layer.draw(layer.x);
  }
}

function draw() {
  drawSky();
  drawMoon();
  drawLayers();
}

layers.push({
  x: 0,
  speed: 40,
  draw(x) {
    ctx.fillStyle = "#0c0e1c";
    const width = window.innerWidth;
    const drawX = Math.floor(x);
    ctx.fillRect(
      drawX,
      window.innerHeight * 0.6,
      width,
      window.innerHeight * 0.4,
    );
    ctx.fillRect(
      drawX + width,
      window.innerHeight * 0.6,
      width,
      window.innerHeight * 0.4,
    );
  },
});

resize();
window.addEventListener("resize", resize);
requestAnimationFrame(loop);

const j1 = JSON.stringify(generateJourney(42));
const j2 = JSON.stringify(generateJourney(42));
console.log(j1);
console.log(j1 === j2);
