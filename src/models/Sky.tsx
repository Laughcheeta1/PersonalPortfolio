import { useGLTF } from '@react-three/drei';

import skyScene from '../assets/3d/fantasy_sky_background.glb';

const Sky = () => {
    const sky = useGLTF(skyScene)

    return (
        <mesh scale={[0.5, 0.5, 0.5]}>
            <primitive object={sky.scene} />
        </mesh>
    )
}

export default Sky
