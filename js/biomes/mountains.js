function createMountainLayer({
  seed,
  z,
  peakSpacing,
  maxHeight,
  color,
  sharpPeaks,
  rimAlpha = 0,
  snowColor = null,
  lightChance = 0,
}) {
  function heightAt(x) {
    let value = layeredNoise(x / peakSpacing, seed, 5);
    // Flipping the bottom half of the noise upwards turns round hilltops
    // into sharp peaks.
    if (sharpPeaks) value = 1 - Math.abs(value * 2 - 1);
    return maxHeight * (0.12 + 0.88 * value);
  }

  return {
    z,
    draw() {
      const scale = scaleAt(z);
      const baseY = groundYAt(z);

      const outline = [];
      for (let screenX = -6; screenX <= window.innerWidth + 6; screenX += 6) {
        const x = worldXAt(screenX, z);
        outline.push({ screenX, x, y: baseY - heightAt(x) * scale });
      }
      const first = outline[0];
      const last = outline[outline.length - 1];

      function traceRange() {
        ctx.beginPath();
        ctx.moveTo(first.screenX, baseY + 1);
        for (const point of outline) ctx.lineTo(point.screenX, point.y);
        ctx.lineTo(last.screenX, baseY + 1);
        ctx.closePath();
      }

      ctx.fillStyle = color;
      traceRange();
      ctx.fill();

      // Clip to the mountain so the snow only covers the slopes above the
      // snow line, not the sky.
      if (snowColor) {
        ctx.save();
        traceRange();
        ctx.clip();
        ctx.fillStyle = snowColor;
        ctx.beginPath();
        ctx.moveTo(first.screenX, 0);
        for (const point of outline) {
          const snowLine = maxHeight * (0.6 + smoothNoise(point.x / 400, seed + 3) * 0.16);
          ctx.lineTo(point.screenX, baseY - snowLine * scale);
        }
        ctx.lineTo(last.screenX, 0);
        ctx.fill();
        ctx.restore();
      }

      // The moon is on the right, so only slopes facing right catch its light.
      if (rimAlpha > 0) {
        ctx.strokeStyle = `rgba(130, 150, 230, ${rimAlpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 1; i < outline.length; i++) {
          const from = outline[i - 1];
          const to = outline[i];
          const facesRight = to.y > from.y;
          if (facesRight) {
            ctx.moveTo(from.screenX, from.y);
            ctx.lineTo(to.screenX, to.y);
          }
        }
        ctx.stroke();
      }

      if (lightChance > 0) {
        ctx.fillStyle = "#c98f4a";
        forEachSlot(z, 40, 0, (index, x) => {
          const random = seededRandom(seed, index);
          if (random() > lightChance) return;
          const lightX = x + random() * 40;
          const lightHeight = heightAt(lightX) * (0.1 + random() * 0.4);
          ctx.globalAlpha = 0.4 + random() * 0.5;
          ctx.fillRect(screenXAt(lightX, z), baseY - lightHeight * scale, 2, 2);
        });
        ctx.globalAlpha = 1;
      }
    },
  };
}

function createMountainLayers(seed) {
  const snowing = activeWeather === "snow";
  const farRange = createMountainLayer({
    seed: seed + 1,
    z: 2000,
    peakSpacing: 1100,
    maxHeight: 1600,
    color: "#161a3a",
    sharpPeaks: true,
    rimAlpha: 0.22,
    snowColor: snowing ? "#4d5588" : null,
  });
  const middleRange = createMountainLayer({
    seed: seed + 2,
    z: 1100,
    peakSpacing: 600,
    maxHeight: 700,
    color: "#10142e",
    sharpPeaks: true,
    rimAlpha: 0.14,
    snowColor: snowing ? "#323966" : null,
  });
  const foothills = createMountainLayer({
    seed: seed + 3,
    z: 350,
    peakSpacing: 180,
    maxHeight: 110,
    color: "#0b0f24",
    sharpPeaks: false,
    lightChance: 0.3,
  });
  return [farRange, middleRange, foothills];
}
