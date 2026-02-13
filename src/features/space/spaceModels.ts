import castleOnHillsUrl from '../../assets/3d/castle_on_hills.glb';
import cosmonautOnRocketUrl from '../../assets/3d/cosmonaut_on_a_rocket.glb';
import lowPolyRatUrl from '../../assets/3d/low-poly_rat.glb';
import nixonCarUrl from '../../assets/3d/nixon_special_burnout_revenge_sd.glb';
import planetUrl from '../../assets/3d/planet.glb';
import smurfCastleUrl from '../../assets/3d/smurf_castle.glb';

// Minimal model descriptor used by runtime loader.
export type SpaceModelItem = {
  // Display label shown in UI when this model is focused.
  name: string;
  // Imported GLB URL used by GLTFLoader.
  url: string;
};

// Order matters:
// - index in this array determines ring position
// - index is also mapped from information categories via modelIndex
export const SPACE_MODELS: SpaceModelItem[] = [
  { name: 'Castle On Hills', url: castleOnHillsUrl },
  { name: 'Cosmonaut On A Rocket', url: cosmonautOnRocketUrl },
  { name: 'Low Poly Rat', url: lowPolyRatUrl },
  { name: 'Nixon Burnout Car', url: nixonCarUrl },
  { name: 'Planet', url: planetUrl },
  { name: 'Smurf Castle', url: smurfCastleUrl },
];
