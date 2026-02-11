import castleOnHillsUrl from '../../assets/3d/castle_on_hills.glb';
import cosmonautOnRocketUrl from '../../assets/3d/cosmonaut_on_a_rocket.glb';
import lowPolyRatUrl from '../../assets/3d/low-poly_rat.glb';
import nixonCarUrl from '../../assets/3d/nixon_special_burnout_revenge_sd.glb';
import planetUrl from '../../assets/3d/planet.glb';
import smurfCastleUrl from '../../assets/3d/smurf_castle.glb';

export type SpaceModelItem = {
  name: string;
  url: string;
};

export const SPACE_MODELS: SpaceModelItem[] = [
  { name: 'Castle On Hills', url: castleOnHillsUrl },
  { name: 'Cosmonaut On A Rocket', url: cosmonautOnRocketUrl },
  { name: 'Low Poly Rat', url: lowPolyRatUrl },
  { name: 'Nixon Burnout Car', url: nixonCarUrl },
  { name: 'Planet', url: planetUrl },
  { name: 'Smurf Castle', url: smurfCastleUrl },
];
