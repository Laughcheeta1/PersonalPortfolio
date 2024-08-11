import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei';

import thinkerScene from "./../assets/3d/der_denker.glb"
import { useFrame } from '@react-three/fiber';


const Thinker = ({ rotate, makeAnimation, setMakeAnimation, stopAnimation, setStopAnimation }) => {
    const thinkerRef = useRef();
    const startedAnimation = useRef(false);

    const { scene } = useGLTF(thinkerScene);

    useFrame(({ clock }) => {
        if (rotate)
            thinkerRef.current.rotation.y -= 0.01;

        if (makeAnimation) 
        {
            if (!startedAnimation) {
                thinkerRef.current.rotation.y = 0;  // Set the animation to the og place
                startedAnimation.current = true;
            }

            let direction = clock.elapsedTime % 2 == 0 ? 1 : -1;
            
            thinkerRef.current.rotation.x += direction * Math.sin(clock.elapsedTime);
            thinkerRef.current.rotation.y += direction * Math.sin(clock.elapsedTime);
            thinkerRef.current.rotation.z += direction * Math.sin(clock.elapsedTime);
            
        }

        if (stopAnimation) 
        {
            setMakeAnimation(false);
            thinkerRef.current.rotation.x = 0;
            thinkerRef.current.rotation.y = 1.5;
            thinkerRef.current.rotation.z = 0;
            setStopAnimation(false);
        }
    })



    return (
        <mesh>
            <primitive 
                ref={thinkerRef}
                object={scene} 
                rotation={[0, 1.5, 0]}
                position={[0, -0.45, 0]}
                scale={[0.4, 0.4, 0.4]} 
            />
        </mesh>
    )
}

export default Thinker
