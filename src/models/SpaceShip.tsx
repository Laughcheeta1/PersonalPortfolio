import { useFrame } from '@react-three/fiber';
import spaceShipScene from '../assets/3d/pelican.glb';
import { useGLTF } from '@react-three/drei';
import { useRef } from 'react';


const SpaceShip = () => {
    const { scene } = useGLTF(spaceShipScene);
    const spaceShipRef = useRef();

    // The initial X will be 5
    const xPos = useRef(0);
    const yPos = useRef(0);
    const zPos = useRef(0);

    // This is a multiplier to go up or down in the X axis
    const direction = useRef(-1);

    // This is the speed of movement in the x axis
    const movement: number = 0.03;

    // These are the radious of the elipse
    const a: number = 5;
    const b: number = 3;
    const c: number = 2;
    
    const getX = (): number => {
        if (xPos.current >= a || xPos.current <= -a)
            direction.current *= -1;  // Change the current

        xPos.current += direction.current * movement;
        return xPos.current;
    }

    const getY = (): number => {
        // y formula for a 2d elipse (z = 0)
        yPos.current = Math.sqrt(1 - (xPos.current / a) ** 2) * b * direction.current;
        return yPos.current;
    };

    const getZ = (): number => {
        const value = 1 - (xPos.current / a) ** 2 - (yPos.current / b) ** 2;
        zPos.current = value >= 0 ? Math.sqrt(value) * c * direction.current : 0;
        return zPos.current;
    };


    useFrame(({ clock, camera }) => {
        // spaceShipRef.current.position.x = getX();
        // spaceShipRef.current.position.y = getY();
        // spaceShipRef.current.position.z = getZ();
        // console.log(spaceShipRef.current.position)
        // spaceShipRef.current.position.set(0, 0, 0);

        spaceShipRef.current.position.y = Math.sin(clock.elapsedTime) * 0.2 + 2;

        if (spaceShipRef.current.position.x > camera.position.x + 10) {
            spaceShipRef.current.rotation.y = Math.PI;
        } 
        else if (spaceShipRef.current.position.x < camera.position.x - 10) {
            spaceShipRef.current.rotation.y = 0;
        }


        if (spaceShipRef.current.rotation.y === 0) {
            spaceShipRef.current.position.x += 0.08;
            spaceShipRef.current.position.z -= 0.08;

            spaceShipRef.current.rotation.z -= 0.005;
        } else {
            spaceShipRef.current.position.x -= 0.08;
            spaceShipRef.current.position.z += 0.08;

            spaceShipRef.current.rotation.z += 0.005;
        }
    });

    return (
        <mesh>
            <primitive 
                ref={spaceShipRef}
                scale={[0.0023, 0.0023, 0.0023]} 
                rotation={[0, Math.PI /2, 0]}
                object={scene} 
            />
        </mesh>
    )
}

export default SpaceShip
