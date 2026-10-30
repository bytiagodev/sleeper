function drawSky() {
  const gradient = ctx.createLinearGradient(0, 0, 0, camera.horizonY);
  gradient.addColorStop(0, "#1c1e42");
  gradient.addColorStop(1, "#2b2f5a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, window.innerWidth, camera.horizonY + 1);
}

function getMoon() {
  return {
    x: window.innerWidth * 0.8,
    y: camera.horizonY * 0.3,
    radius: 40,
  };
}

function drawMoon() {
  const moon = getMoon();
  ctx.fillStyle = "#f2ead8";
  ctx.beginPath();
  ctx.arc(moon.x, moon.y, moon.radius, 0, Math.PI * 2);
  ctx.fill();
}

// Far ground is lighter than near ground: distance fades things towards the
// colour of the sky, and that is a big part of what makes them read as far.
const groundColors = {
  city: { far: "#151a30", near: "#07080f" },
  forest: { far: "#121628", near: "#06070d" },
  fields: { far: "#1a2133", near: "#0a0c16" },
  coast: { far: "#141626", near: "#07080f" },
  mountains: { far: "#10132a", near: "#06070d" },
};

function drawGround() {
  const colors = groundColors[activeBiome];
  const top = camera.horizonY;
  const bottom = window.innerHeight;

  const ground = ctx.createLinearGradient(0, top, 0, bottom);
  ground.addColorStop(0, colors.far);
  ground.addColorStop(1, colors.near);
  ctx.fillStyle = ground;
  ctx.fillRect(0, top, window.innerWidth, bottom - top);

  if (activeWeather === "snow") {
    const snow = ctx.createLinearGradient(0, top, 0, bottom);
    snow.addColorStop(0, "rgba(232, 236, 244, 0.09)");
    snow.addColorStop(1, "rgba(232, 236, 244, 0.03)");
    ctx.fillStyle = snow;
    ctx.fillRect(0, top, window.innerWidth, bottom - top);
  }
}
