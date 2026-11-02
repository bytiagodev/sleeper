// Each landscape gets its own seed offset, so a new journey grows new
// scenery while the same journey always grows the same scenery.
const biomeBuilders = {
  city: () => createCityLayers(journey.seed + 5),
  forest: () => createForestLayers(journey.seed + 11),
  fields: () => createFieldsLayers(journey.seed + 2),
  mountains: () => createMountainLayers(journey.seed + 61),
  coast: () => createCoastLayers(journey.seed + 71),
};

function buildBiomeLayers(biome) {
  const layers = [
    createCloudLayer(journey.seed + 101),
    ...createFogBanks(),
    ...biomeBuilders[biome](),
    createPoleLayer(journey.seed + 81),
    createTrackLayer(),
    ...createForegroundLayers(biome, journey.seed + 121),
    createVergeLayer(journey.seed + 91),
  ];
  if (segment.station) layers.push(...createStationLayers(segment.station));
  if (segment.exitX !== null) layers.push(...createTunnelLayers(segment.exitX, -1, journey.seed + 600));
  layers.push(...createTunnelLayers(segment.tunnelX, 1, journey.seed + 601));

  // Draw far to near, so nearer things cover farther ones.
  layers.sort((a, b) => b.z - a.z);
  return layers;
}
