/** Environment art direction, generation budgets, and animation tuning. */
export const environmentTuning = {
  seed: 731, terrainSegments: 120, terrainRings: 28, cliffDepth: 4,
  grass: '#8bbd79', sand: '#e7cc98', cliff: '#b99c78', ocean: '#62bfc7',
  road: '#e5d5af', routeClearance: 2.8,
  landmarkClearance: 7, treeEdgeMargin: .88, rocks: 65, shoreRocks: 90,
  placementAttempts: 5000, lampSpacing: 14, lampRadius: .25, classicalStart: -42,
  particleHeight: 7, particleSpeed: .24, particleSize: .09,
  particleBobAmplitude: .5, particleRotationSpeed: .015, waveCount: 70,
  treeScaleMin: .65, treeScaleVariation: .3, leavesPerTree: 32,
  treeSightClearance: 9, flowerPetals: 5, curbSpacing: .72,
  grassCount: 1900, shrubs: 80, fenceSpacing: 12, fenceLength: 2.8,
} as const;
