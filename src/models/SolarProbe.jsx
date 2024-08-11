import solarProbeScene from '../assets/3d/parker_solar_probe.glb'
import { useGLTF } from '@react-three/drei'

const SolarProbe = ({ isRotating, ...props }) => {
    const { scene } = useGLTF(solarProbeScene)
  
    return (
        <mesh {...props}>
            <primitive 
                scale={[0.7, 0.7, 0.7]}
                object={scene} 
            />
        </mesh>
    )
}

export default SolarProbe
