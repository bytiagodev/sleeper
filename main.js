const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');

function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  ctx.scale(dpr, dpr);
}

let lastTime = 0;

function loop(currentTime) {
  const dt = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

function update(dt) {
  updateLayers(dt);
}
function draw() {}

function drawSky() {
  const gradient = ctx.createLinearGradient(0, 0, 0, window.innerHeight);
  gradient.addColorStop(0, '#2b2d55');
  gradient.addColorStop(1, '#151a38');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
}

function draw() {
  drawSky();
}

function drawMoon() {
  ctx.fillStyle = '#f2ead8';
  ctx.beginPath();
  ctx.arc(window.innerWidth * 0.8, window.innerHeight * 0.2, 40, 0, Math.PI * 2);
  ctx.fill();
}

function draw() {
  drawSky();
  drawMoon();
  drawLayers();
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

layers.push({
  x: 0,
  speed: 40,
  draw(x) {
  ctx.fillStyle = '#0c0e1c';
  const width = window.innerWidth;
  const drawX = Math.floor(x);
  ctx.fillRect(drawX, window.innerHeight * 0.6, width, window.innerHeight * 0.4);
  ctx.fillRect(drawX + width, window.innerHeight * 0.6, width, window.innerHeight * 0.4);
}
});

requestAnimationFrame(loop);

resize();
window.addEventListener('resize', resize);