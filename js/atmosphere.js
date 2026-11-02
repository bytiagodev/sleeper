// The air between the camera and the world. Things far away fade towards
// the colour of the air, and the thicker the air, the sooner they fade: a
// mountain on a clear night is still dark at 2 km, but in fog a tree
// 150 m away is already half gone.
const airByWeather = {
  clear: { color: [38, 44, 92], distance: 4500, glowSize: 1 },
  rain: { color: [28, 30, 46], distance: 600, glowSize: 1.5 },
  snow: { color: [50, 52, 76], distance: 900, glowSize: 1.3 },
  fog: { color: [64, 68, 90], distance: 140, glowSize: 2 },
};

function getAir() {
  return airByWeather[activeWeather];
}

// 0 for something right next to the camera, approaching 1 far away.
function hazeAt(z) {
  return 1 - Math.exp(-z / getAir().distance);
}

function hazed(hexColor, z) {
  const red = parseInt(hexColor.slice(1, 3), 16);
  const green = parseInt(hexColor.slice(3, 5), 16);
  const blue = parseInt(hexColor.slice(5, 7), 16);
  const air = getAir().color;
  const amount = hazeAt(z);
  const r = Math.round(mix(red, air[0], amount));
  const g = Math.round(mix(green, air[1], amount));
  const b = Math.round(mix(blue, air[2], amount));
  return `rgb(${r}, ${g}, ${b})`;
}

let fogTexture;

// The strip's left and right edges match, so strips can be laid end to end.
function createFogTexture() {
  const width = 512;
  const height = 64;
  const cellsAcross = 8;
  fogTexture = makeTexture(width, height, (x, y) => {
    const wisps = layeredNoise2D((x / width) * cellsAcross, (y / height) * 2, 21, 4, cellsAcross);
    const fromTop = y / height;
    // Fades in from the top, then out quickly at the very bottom, so the
    // strip has no hard edges.
    const shape = Math.min(1, fromTop * 1.6) * Math.min(1, (1 - fromTop) * 6);
    const density = Math.max(0, wisps - 0.3) * 1.6 * shape;
    return [150, 158, 190, Math.min(1, density) * 255];
  });
}

function createFogBankLayer(z, thickness, strength) {
  const tileMetres = 30 * Math.sqrt(z) + 40;
  const driftSpeed = 1.5;

  return {
    z,
    draw() {
      const scale = scaleAt(z);
      const tileWidth = tileMetres * scale;
      const height = thickness * scale;
      const top = groundYAt(z) - height * 0.85;
      // Where a tile starts on screen. The remainder can be negative, so the
      // tile width is added once more to bring it back on screen.
      const anchor = screenXAt(-motion.clock * driftSpeed, z);
      const firstX = ((anchor % tileWidth) + tileWidth) % tileWidth - tileWidth;

      ctx.save();
      ctx.globalAlpha = strength;
      for (let x = firstX; x < window.innerWidth; x += tileWidth) {
        ctx.drawImage(fogTexture, x, top, tileWidth + 1, height);
      }
      ctx.restore();
    },
  };
}

// Which banks lie where. Even a clear night has a little mist in the low
// ground; in fog there is a bank at every distance, including between the
// train and the camera.
const fogBanksByWeather = {
  clear: [
    { z: 400, thickness: 25, strength: 0.25 },
    { z: 120, thickness: 6, strength: 0.15 },
  ],
  rain: [{ z: 300, thickness: 30, strength: 0.3 }],
  snow: [
    { z: 300, thickness: 30, strength: 0.3 },
    { z: 80, thickness: 10, strength: 0.2 },
  ],
  fog: [
    { z: 600, thickness: 60, strength: 0.8 },
    { z: 200, thickness: 30, strength: 0.7 },
    { z: 60, thickness: 14, strength: 0.6 },
    { z: 22, thickness: 6, strength: 0.45 },
    { z: 7, thickness: 2.5, strength: 0.35 },
  ],
};

function createFogBanks() {
  return fogBanksByWeather[activeWeather].map((bank) =>
    createFogBankLayer(bank.z, bank.thickness, bank.strength),
  );
}
