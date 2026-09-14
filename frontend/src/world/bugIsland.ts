import * as THREE from 'three';
import { bugHuntConfig } from './bugHuntConfig';
import { environmentTuning } from './environmentConfig';

/** New scenery is isolated from the existing island and character models. */
export function createBugIsland(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Bug hunt island';
  const { island, bridge, leaderboard, arenaRadius } = bugHuntConfig;
  const material = (color: string) => new THREE.MeshStandardMaterial({ color, roughness: .9, flatShading: true });
  const sand = material(environmentTuning.sand), cliff = material(environmentTuning.cliff);
  const grass = material('#789d77'), wood = material('#785942'), trim = material('#d2b489');
  const slate = material('#233f43'), accent = material('#96dfc5');
  const box = new THREE.BoxGeometry(1, 1, 1);
  const add = (geometry: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1, parent = group) => {
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz);
    mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh);
    return mesh;
  };
  add(new THREE.CylinderGeometry(island.radius + .5, island.radius + 1, 3.6, 48), cliff, island.x, -2, island.z);
  add(new THREE.CylinderGeometry(island.radius, island.radius, .45, 48), sand, island.x, -.2, island.z);
  add(new THREE.CylinderGeometry(island.radius - .8, island.radius - .8, .08, 48), grass, island.x, .01, island.z);

  // A gravel approach becomes a timber footbridge over the water.
  const approachEnd = 51;
  const approach = add(new THREE.PlaneGeometry(approachEnd - bridge.startX, bridge.width), material(environmentTuning.road), (bridge.startX + approachEnd) / 2, .07, bridge.z);
  approach.rotation.x = -Math.PI / 2; approach.castShadow = false;
  add(box, wood, (approachEnd + bridge.endX) / 2, -.15, bridge.z, bridge.endX - approachEnd, .3, bridge.width);
  for (let x = approachEnd; x < bridge.endX; x += .62) {
    add(box, trim, x + .29, .04, bridge.z, .56, .1, bridge.width);
  }
  for (const side of [-1, 1]) {
    const z = bridge.z + side * (bridge.width / 2 + .1);
    for (let x = approachEnd; x <= bridge.endX; x += 2.2) {
      add(box, wood, x, .55, z, .18, 1.3, .18);
      add(new THREE.SphereGeometry(.13, 8, 6), accent, x, 1.23, z);
    }
    add(box, wood, (approachEnd + bridge.endX) / 2, .92, z, bridge.endX - approachEnd, .12, .12);
  }

  // Low, unobstructive stones distinguish the play arena from the shore.
  const markerGeometry = new THREE.CylinderGeometry(.16, .2, .1, 6);
  for (let i = 0; i < 44; i++) {
    const angle = i / 44 * Math.PI * 2;
    if (Math.cos(angle) < -.87) continue;
    add(markerGeometry, accent, island.x + Math.cos(angle) * arenaRadius, .09, island.z + Math.sin(angle) * arenaRadius);
  }
  const rockGeometry = new THREE.IcosahedronGeometry(1, 0);
  for (let i = 0; i < 16; i++) {
    const angle = i / 16 * Math.PI * 2;
    if (Math.cos(angle) < -.8) continue;
    add(rockGeometry, cliff, island.x + Math.cos(angle) * 12.1, -1.5, island.z + Math.sin(angle) * 12.1, .75, 1.2, .8);
  }

  // The game mounts its live leaderboard content on the front of this frame.
  const board = new THREE.Group(); board.name = 'Bug hunt leaderboard frame';
  board.position.set(leaderboard.x, 0, leaderboard.z); board.rotation.y = leaderboard.rotationY; group.add(board);
  add(box, slate, 0, leaderboard.y, 0, leaderboard.width + .3, leaderboard.height + .3, .3, board);
  for (const x of [-leaderboard.width / 2, leaderboard.width / 2]) {
    add(box, wood, x, 2.6, -.03, .24, 5.2, .4, board);
    add(box, accent, x, 5.22, -.03, .32, .12, .46, board);
  }
  for (const y of [leaderboard.y - leaderboard.height / 2, leaderboard.y + leaderboard.height / 2]) {
    add(box, trim, 0, y, .17, leaderboard.width + .3, .16, .16, board);
  }
  return group;
}
