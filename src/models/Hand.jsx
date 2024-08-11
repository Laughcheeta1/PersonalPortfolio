/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
Author: re1monsen (https://sketchfab.com/re1monsen)
License: CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/)
Source: https://sketchfab.com/3d-models/energy-3d999ee4743744fcb5feea9f8c8893ad
Title: Energy
*/

import React, { useRef, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { a } from '@react-spring/three';

import energyScene from '../assets/3d/energy.glb';


const Hand = ({ isRotating, setIsRotating, setCurrentStage, ...props}) => {
    const handRef = useRef();

    const { gl, viewport } = useThree();
    const { nodes, materials } = useGLTF(energyScene);

    const lastX = useRef(0);
    const rotationSpeed = useRef(0);
    const dampingFactor = 0.95;

    const handlePointerDown = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setIsRotating(true);

        lastX.current = e.touches ? e.touches[0].clientX : e.clientX;
    }

    const handlePointerUp = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setIsRotating(false);
    }

    const handlePointerMove = (e) => {
        e.stopPropagation();
        e.preventDefault();

        if (isRotating) {
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;

            const delta = (clientX - lastX.current) / viewport.width;

            handRef.current.rotation.y += delta * 0.01 * Math.PI;
            lastX.current = clientX;
            rotationSpeed.current = delta * 0.01 * Math.PI;
        }
            
    }

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowLeft') {
            if (!isRotating)
                setIsRotating(true);

            handRef.current.rotation.y += 0.01 * Math.PI;
        }
        else if (e.key === 'ArrowRight') {
            if (!isRotating)
                setIsRotating(true);

            handRef.current.rotation.y -= 0.01 * Math.PI;
        }
    }

    const handleKeyUp = (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight')
            setIsRotating(false);
    }

    // Use frame is a function that runs every time the object re-renders (contrary to normal React components
    //   that render just once, unless promped to change, 3d objects are re-drawn every frame (in a normal pc 
    //   once every 1/60 of a second, due to the 60hz ratio)).
    // So in escence this functions runs every 1/60 of a second
    useFrame(() => {
        if (!isRotating) {
            rotationSpeed.current *= dampingFactor;

            if (Math.abs(rotationSpeed.current) < 0.001) {
                rotationSpeed.current = 0;
            }

            // This makes the slowing down motion of the hand
            handRef.current.rotation.y += rotationSpeed.current;  
        } else {
            // Remember that `rotation` of the object perse
            // This basically converts the current rotation into the range [0, 2pi), add it 2pi in
            // in case it is negative, and then convert it back into the range [0, 2pi)
            const normalizedRotation = ((handRef.current.rotation.y % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

            // Set the current stage based on the hands's orientation
            switch (true) {
                case normalizedRotation >= 5.45 && normalizedRotation <= 5.85:
                setCurrentStage(1);
                break;
                case normalizedRotation >= 3.5 && normalizedRotation <= 4:
                setCurrentStage(3);
                break;
                case normalizedRotation >= 2.5 && normalizedRotation <= 3:
                setCurrentStage(4);
                break;
                case normalizedRotation >= 4.25 && normalizedRotation <= 4.75:
                setCurrentStage(2);
                break;
                default:
                setCurrentStage(null);
            }
        }
    })

    // This function will run when those functions are declared and when the canvas where the objects are drawn
    // changes
    useEffect(() => {
        const canvas = gl.domElement;

        canvas.addEventListener('pointerdown', handlePointerDown);
        canvas.addEventListener('pointerup', handlePointerUp);
        canvas.addEventListener('pointermove', handlePointerMove);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        return () => {
            canvas.removeEventListener('pointerdown', handlePointerDown);
            canvas.removeEventListener('pointerup', handlePointerUp);
            canvas.removeEventListener('pointermove', handlePointerMove);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
        }

    }, [gl, handlePointerDown, handlePointerUp, handlePointerMove])

    return (
        <a.group ref={handRef} {...props}>
        <group position={[0, -0.022432, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <mesh geometry={nodes.Object_4.geometry} material={materials['Material.004']} />
            <mesh
            geometry={nodes.Object_6.geometry}
            material={materials.Bulb_Info}
            position={[0.358588, -0.313293, 0.002502]}
            rotation={[Math.PI, 0, -Math.PI / 4]}
            scale={0.174075}
            />
            <mesh geometry={nodes.Object_8.geometry} material={materials.Bulb_Info} />
            <mesh geometry={nodes.Object_10.geometry} material={materials.Bulb_Info} />
            <mesh geometry={nodes.Object_12.geometry} material={materials.Bulb_Normal} />
            <mesh geometry={nodes.Object_14.geometry} material={materials.Bulb_Normal} />
            <mesh geometry={nodes.Object_16.geometry} material={materials.Bulb_Normal} />
            <mesh geometry={nodes.Object_18.geometry} material={materials.Bulb_Normal} />
            <mesh
            geometry={nodes.Object_20.geometry}
            material={materials.Bulb_Normal}
            scale={0.035679}
            />
            <mesh
            geometry={nodes.Object_22.geometry}
            material={materials.Bulb_Normal}
            position={[0.002454, 0.001556, -0.421143]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={1.744667}
            />
            <mesh
            geometry={nodes.Object_24.geometry}
            material={materials.Bulb_Normal}
            position={[0, 0, 0.010128]}
            />
            <mesh
            geometry={nodes.Object_26.geometry}
            material={materials.Bulb_Normal}
            scale={0.009872}
            />
            <mesh geometry={nodes.Object_28.geometry} material={materials.Bulb_Normal} />
            <mesh geometry={nodes.Object_30.geometry} material={materials.Bulb_Normal} />
            <mesh geometry={nodes.Object_32.geometry} material={materials.Bulb_Normal} />
            <mesh
            geometry={nodes.Object_34.geometry}
            material={materials.Bulb_Normal}
            rotation={[-Math.PI, 0, 0]}
            scale={[-0.04187, 0.04187, 0.04187]}
            />
        </group>
        <group position={[0, 2.356685, 0.259096]} scale={[0.479354, 0.479354, 0.493974]}>
            <mesh geometry={nodes.Object_40.geometry} material={materials['Material.004']} />
            <mesh
            geometry={nodes.Object_42.geometry}
            material={materials.Bulb_Normal}
            position={[0, -0.244092, -0.524514]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[0.053066, 0.051495, 0.053066]}
            />
        </group>
        <group position={[0, 1.482046, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={0.479354}>
            <mesh geometry={nodes.Object_44.geometry} material={materials['Glass.001']} />
            <mesh
            geometry={nodes.Object_46.geometry}
            material={materials.Bulb_Info}
            position={[0, 0, -0.162881]}
            rotation={[0, 0, 1.588457]}
            />
            <mesh
            geometry={nodes.Object_48.geometry}
            material={materials.Bulb_Info}
            position={[0, 0, -0.330326]}
            rotation={[Math.PI / 2, -0.07235, 0]}
            scale={2.086139}
            />
        </group>
        <group
            position={[-6.243736, -6.162186, -2.475027]}
            rotation={[0.293826, 1.117451, -0.265593]}>
            <mesh geometry={nodes.Object_52.geometry} material={materials['Material.007']} />
            <mesh geometry={nodes.Object_53.geometry} material={materials['Material.010']} />
            <mesh geometry={nodes.Object_54.geometry} material={materials['Material.010']} />
            <mesh geometry={nodes.Object_55.geometry} material={materials['Material.010']} />
            <mesh geometry={nodes.Object_56.geometry} material={materials['Material.010']} />
        </group>
        <group position={[0, 0.019103, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={0.614504}>
            <mesh geometry={nodes.Object_58.geometry} material={materials['Material.002']} />
            <mesh geometry={nodes.Object_59.geometry} material={materials.Material} />
            <mesh geometry={nodes.Object_61.geometry} material={materials.Bulb_Normal} />
            <mesh geometry={nodes.Object_63.geometry} material={materials.Bulb_Normal} />
            <mesh geometry={nodes.Object_65.geometry} material={materials.Bulb_Normal} />
            <mesh geometry={nodes.Object_67.geometry} material={materials.Bulb_Normal} />
        </group>
        <group position={[0, 2.239679, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <mesh geometry={nodes.Object_69.geometry} material={materials['Material.008']} />
            <mesh geometry={nodes.Object_71.geometry} material={materials.Bulb_Normal} />
        </group>
        <group position={[0, 2.187624, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <mesh geometry={nodes.Object_75.geometry} material={materials['Material.004']} />
            <mesh geometry={nodes.Object_77.geometry} material={materials.Bulb_Normal} />
        </group>
        <mesh
            geometry={nodes.Object_36.geometry}
            material={materials['Material.003']}
            position={[0, -0.284486, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
        />
        <mesh
            geometry={nodes.Object_38.geometry}
            material={materials['Material.006']}
            position={[0, -0.022432, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={0.250235}
        />
        <mesh
            geometry={nodes.Object_50.geometry}
            material={materials.Glass_2}
            position={[0, 1.476722, 0]}
            scale={0.479354}
        />
        <mesh
            geometry={nodes.Object_73.geometry}
            material={materials['Material.002']}
            position={[0, 0.590148, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={0.479354}
        />
        <mesh
            geometry={nodes.Object_79.geometry}
            material={materials['Material.005']}
            position={[0, 0.019103, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={0.479354}
        />
        <mesh
            geometry={nodes.Object_81.geometry}
            material={materials.Material}
            position={[-0.001443, 1.435135, -0.001989]}
            rotation={[-Math.PI, -0.168028, -Math.PI]}
            scale={[1, 1.139983, 1]}
        />
        <mesh
            geometry={nodes.Object_83.geometry}
            material={materials.Moth}
            position={[0.625994, 2.552, 0.430223]}
            rotation={[-1.846987, 1.001294, 1.855522]}
            scale={0.273124}
        />
        </a.group>
    )
};

export default Hand;
