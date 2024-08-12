// import { meta, shopify, starbucks, tesla } from "./../assets/images";
import { 
    contact,
    cpp,
    docker,
    express,
    git,
    github, 
    java, 
    javascript,
    linkedin,
    maven,
    mongodb,
    nodejs,
    python,
    react,
    scikit_learn,
    springboot,
    sql,
    sqlserver,
    typescript,

    tictactoe,
    compression,
    plane,
    speaker,
    route,
    container,
    game,
    job,
} from "./paths";

export const skills = [
    {
        imageUrl: java,
        name: "JAVA",
        type: "Backend",
    },
    {
        imageUrl: springboot,
        name: "Spring Boot",
        type: "Backend",
    },
    {
        imageUrl: nodejs,
        name: "NodeJS",
        type: "Backend",
    },
    {
        imageUrl: express,
        name: "Express",
        type: "Backend",
    },
    {
        imageUrl: python,
        name: "Python",
        type: "General",
    },
    {
        imageUrl: mongodb,
        name: "MongoDB",
        type: "Database",
    },
    {
        imageUrl: sql,
        name: "SQL",
        type: "Database",
    },
    {
        imageUrl: sqlserver,
        name: "SQL Server",
        type: "Database",
    },
    {
        imageUrl: javascript,
        name: "JavaScript",
        type: "Frontend",
    },
    {
        imageUrl: react,
        name: "React",
        type: "Frontend",
    },
    {
        imageUrl: typescript,
        name: "TypeScript",
        type: "Frontend",
    },
    {
        imageUrl: scikit_learn,
        name: "Scikit Learn",
        type: "Machine Learning",
    },
    {
        imageUrl: cpp,
        name: "C++",
        type: "General",
    },
    {
        imageUrl: git,
        name: "Git",
        type: "General",
    },
    {
        imageUrl: maven,
        name: "Maven",
        type: "General",
    },
    {
        imageUrl: docker,
        name: "Docker",
        type: "General",
    },
];

export const socialLinks = [
    {
        name: 'Contact',
        iconUrl: contact,
        link: '/contact',
    },
    {
        name: 'GitHub',
        iconUrl: github,
        link: 'https://github.com/Laughcheeta1',
    },
    {
        name: 'LinkedIn',
        iconUrl: linkedin,
        link: 'https://www.linkedin.com/in/santiago-yepes-mesa-67ab80270/',
    }
];

export const projects = [
    {
        iconUrl: container,
        theme: 'btn-back-blue',
        name: 'Container Management App',
        description: 'This is a container management app for a local company, using React, ExpressJS and MongoDB.',
        link: 'https://github.com/Laughcheeta1/ContainersApp',
    },
    {
        iconUrl: job,
        theme: 'btn-back-green',
        name: 'Jobly Startup',
        description: 'Current participant in the team that is developing the Jobly startup, using React, SpringBoot and MongoDB.',
    },
    {
        iconUrl: game,
        theme: 'btn-back-red',
        name: 'Monteria Simulator',
        description: 'This is action game made with the greenfoot game engine, that means, developed in java.\n' + 
            'It is a quick reaction game, where you have to survive to continual hordes of enemies for the longest ' + 
            'time possible. You can choose between two characters.',
        link: 'https://github.com/Laughcheeta1/MonteriaSimulator',
    },
    {
        iconUrl: plane, 
        theme: 'btn-back-yellow',
        name: 'Military Plane Detector',
        description: 'It is a UI that you pass a video, and it will detect the military planes in that video, highlight them ' + 
            'and show the information about them.\nIt uses the YOLOv8 model for the image detection, and the UI is made with Python.',
        link: 'https://github.com/Laughcheeta1/Proyect-HORUS',
    },
    {
        iconUrl: compression,
        theme: 'btn-back-orange',
        name: 'Text Compression UI',
        description: 'This is a desktop app made with Java, that uses the Huffman Algorithm to compress and decompress txt files. ' + 
        'This is one of the projects I am must proud of because of the amount of learning I had from leading it, and how well the ' + 
        'team worked together to make it possible; also I personally think it turned out beautifull.',
        link: 'https://github.com/Laughcheeta1/FinalProyectDE',
    },
    {
        iconUrl: speaker,
        theme: 'btn-back-purple',
        name: 'Text To Speech Phone App',
        description: 'This was the first project I made in college, and probably my first code project ever, that is why it is so simple.\n' + 
        'It is a andriod phone app, developed with Android Studio, that uses the google speech to text API to convert the words you speak ' + 
        'into text that is shown in the app. It had an Register and Login authentication system made with Firebase, althoug it currently will ' +
        'not work because the Firebase repository was deleted.\nThe original idea was to make this an app for people with hearing disabilities.',
        link: 'https://github.com/Laughcheeta1/PICapp',
    },
    {
        iconUrl: tictactoe,
        theme: 'btn-back-black',
        name: 'TicTacToe vs AI',
        description: 'This is a simple command line Ai vs Player tic tac toe game made with the minimax algorithm.',
        link: 'https://github.com/Laughcheeta1/MinimaxTICTACTOE',
    },
    {
        iconUrl: route,
        theme: 'btn-back-pink',
        name: 'Route Optimization With A*',
        description: 'This is a file that that finds (or tries to find) the optimal route from one point to another in a ' +
            'a real map, basically like a Waze, but the algorithm can be used for things like favouring right turns, or other parameters. ' + 
            'It uses the A* algorithm, and OSMNX for the map data.',
        link: 'https://github.com/Laughcheeta1/MinimaxTICTACTOE',
    },
];