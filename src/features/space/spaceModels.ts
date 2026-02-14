import goldenRetrieverSittingUrl from '../../assets/3d/golden_retriever_sitting.glb';
import cosmonautOnRocketUrl from '../../assets/3d/cosmonaut_on_a_rocket.glb';
import annModelUrl from '../../assets/3d/artificial_neural_network_ann.glb';
import deathEarthUrl from '../../assets/3d/death_earth.glb';
import nixonCarUrl from '../../assets/3d/nixon_special_burnout_revenge_sd.glb';
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
  { name: 'Golden Retriever Sitting', url: goldenRetrieverSittingUrl },
  { name: 'Cosmonaut On A Rocket', url: cosmonautOnRocketUrl },
  { name: 'Artificial Neural Network', url: annModelUrl },
  { name: 'Nixon Burnout Car', url: nixonCarUrl },
  { name: 'Death Earth', url: deathEarthUrl },
  { name: 'Smurf Castle', url: smurfCastleUrl },
];
