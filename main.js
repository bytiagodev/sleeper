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

function update(dt) {}
function draw() {}

requestAnimationFrame(loop);

resize();
window.addEventListener('resize', resize);