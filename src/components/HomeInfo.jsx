import React from 'react'
import { Link } from 'react-router-dom';

const InfoBox = ({ text, link, btnText }) => (
    <div className='info-box'>
        <p className='font-medium sm:text-xl text-center'>{text}</p>
        <Link to={link} className='neo-brutalism-white neo-btn'>
            {btnText}
        </Link>
    </div>
);

const renderContent = {
    1: (
        <h1 className='sm:text-xl sm:leading-snug text-center
        neo-brutalism-white py-4 px-8 text-black mx-5'>
            Hi, I am <span className='font-semibold'>Santiago</span>! 🤙
            <br/><br/>
            A software engineer from 🎊<span
                className='text-yellow-400'>Colo</span><span
                className='text-blue-700'>mb</span><span
                className='text-red-600'>ia</span>🎊
        </h1>
    ),
    2: (
        <InfoBox 
            text={"This is the second text, goes to About"}
            link={"/About"}
            btnText={"Know me more"}
        />
    ),
    3: (
        <h1>3</h1>
    ),
    4: (
        <h1>4</h1>
    ),
};


const HomeInfo = ({currentStage}) => {
    return renderContent[currentStage] || null;  
};

export default HomeInfo
