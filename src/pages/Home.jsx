import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import Loader from '../components/Loader.jsx';

import HomeInfo from '../components/HomeInfo.jsx';
import Hand from '../models/Hand.jsx';
// import Sky from '../models/Sky.tsx';
// TODO: import an sky that works
import SolarProbe from '../models/SolarProbe.jsx';
import SpaceShip from '../models/SpaceShip.jsx';

import { Sky, useHelper } from '@react-three/drei';
import { PointLightHelper } from 'three';
import { useRef } from 'react';


const Home = () => {
    const [isRotating, setIsRotating] = useState(false);
    const [currentStage, setCurrentStage] = useState('');
    
    
    const adjustHandForScreenSize = () => {
        let screenScale;
        let screenPosition = [0, -1, 0];
        let rotation = [0, 6, 0];
        
        if (window.innerWidth < 768) {
            screenScale = [0.9, 0.9, 0.9];
        } else {
            screenScale = [1, 1, 1];
        }
        
        return [screenScale, screenPosition, rotation];
    }
    
    const adjustProbeForScreenSize = () => {
        let screenScale, screenPosition;
        
        if (window.innerWidth < 768) {
            screenScale = [0.7, 0.7, 0.9];
            screenPosition = [0, -1.5, 0];
        } else {
            screenScale = [0.7, 0.7, 0.7];
            screenPosition = [0, -0.25, 2]
        }
        
        return [screenScale, screenPosition];
    }
    
    const [handScale, handPosition, handRotation] = adjustHandForScreenSize();
    const [probeScale, probePosition] =adjustProbeForScreenSize();
    
    
    const PointLightWithHelper = (props) => {
        const lightRef = useRef();
        useHelper(lightRef, PointLightHelper, 1);
        
        return <pointLight ref={lightRef} {...props} />;
    };
    
    
    return (
        <section className='w-full h-screen relative'>

            <div className='absolute top-28 left-0 right-0 z-10 flex items-center justify-center'>
                {currentStage && <HomeInfo currentStage={currentStage}/>}
            </div>

            <Canvas 
                className={`w-full h-screen bg-transparent ${isRotating ? 'cursor-grabbing' : 'cursor-grab'}`}
                camera={{ near: 0.1, far: 1000 }}
            >
                {/*While the 3d render is loading, we will show the loader component*/}
                <Suspense fallback={<Loader />}>
                    <directionalLight position={[1, 10, 1]} intensity={50}/>
                    <ambientLight intensity={2}/>
                    <pointLight position={[0, 0.58, 0]} intensity={10}/>
                    <pointLight position={[0, 0.38, 0]} intensity={10}/>
                    <pointLight position={[0, 0.18, 0]} intensity={10}/>
                    <pointLight position={[0, -0.08, 0]} intensity={10}/>
                    {/* <PointLightWithHelper position={[0, 0.58, 0]} intensity={10}/>
                    <PointLightWithHelper position={[0, 0.38, 0]} intensity={10}/>
                    <PointLightWithHelper position={[0, 0.18, 0]} intensity={10}/>
                    <PointLightWithHelper position={[0, -0.08, 0]} intensity={10}/> */}

                    <SpaceShip />
                    {/*<SolarProbe
                        isRotating={isRotating}
                        scale={probeScale}
                        position={probePosition}
                        rotation={[0, 20, 0]}
                    />*/}
                    <Sky />
                    <Hand 
                        position={handPosition}
                        scale={handScale}
                        rotation={handRotation}
                        isRotating={isRotating}
                        setCurrentStage={setCurrentStage}
                        setIsRotating={setIsRotating}
                    />
                </Suspense>
            </Canvas>
        </section>
    );
};

export default Home;
