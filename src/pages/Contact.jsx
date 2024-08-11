import { Suspense, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import emailjs from '@emailjs/browser';

import Alert from './../components/Alert';
import Thinker from './../models/Thinker';
import Loader from './../components/Loader';

import useAlert from '../hooks/useAlert';

const Contact = () => {
    const formRef = useRef(null);

    const [form, setForm] = useState(
        {
            name: '',
            email: '',
            message: ''
        }
    );
    const [isLoading, setIsLoading] = useState(false);
    const [rotate, setRotate] = useState(false);
    const [makeAnimation, setMakeAnimation] = useState(false);
    const [stopAnimation, setStopAnimation] = useState(false);

    const { alert, showAlert, hideAlert } = useAlert();

    const test = () => {
        setRotate(false);
        setMakeAnimation(true);

        setIsLoading(false);

        setTimeout(() => {
            setStopAnimation(true);
        }, 2000);

        console.log()
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    };

    const handleFocus = () => {
        setRotate(true);
    };

    const handleblur = () => {
        setRotate(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);
        setRotate(false);
        setMakeAnimation(true);

        emailjs.send(
            import.meta.env.VITE_EMAILJS_SERVICEID,
            import.meta.env.VITE_EMAILJS_TEMPLATEID,
            {
                from_name: form.name,
                to_name: "Santiago",
                from_email: form.email,
                to_email: import.meta.env.VITE_MY_EMAIL,
                message: form.message
            },
            import.meta.env.VITE_EMAILJS_PUBLIC_KEY
        ).then(() => {
            setIsLoading(false);

            showAlert({
                'show': true,
                'text': 'Message Sent Successfully!',
                'type': 'success'
            })

            setForm({
                name: '',
                email: '',
                message: ''
            });

            setTimeout(() => {
                hideAlert();

                setStopAnimation(true);
            }, 2000);

        }).catch((error) => {
            setIsLoading(false);
            console.log(error);

            showAlert({
                'show': true,
                'text': 'There was a problem sending the message :(',
                'type': 'danger'
            });

            setTimeout(() => {
                hideAlert();
            }, 3000);
        })
    };


    return (
        <section className='relative flex lg:flex-row flex-col max-container'>
            {alert.show && <Alert {...alert} />}

            <div className='flex-1 min-w-[50%] flex flex-col'>
                <h1 className='head-text'>Contact me</h1>

                <form
                    className='w-full flex flex-col gap-7 mt-14'
                    onSubmit={handleSubmit}
                >
                    <label className='text-black-500 font-semibold'>
                        Name
                        <input
                            type='text'
                            name='name'
                            className='input'
                            placeholder='Jhon Doe'
                            required
                            value={form.name}
                            onChange={handleChange}
                            onFocus={handleFocus}
                            onBlur={handleblur}
                        />
                    </label>
                    <label className='text-black-500 font-semibold'>
                        Email
                        <input
                            type='email'
                            name='email'
                            className='input'
                            placeholder='JhonDoe@gmail.com'
                            required
                            value={form.email}
                            onChange={handleChange}
                            onFocus={handleFocus}
                            onBlur={handleblur}
                        />
                    </label>
                    <label className='text-black-500 font-semibold'>
                        Your Message
                        <textarea
                            name='message'
                            rows={4}
                            className='input'
                            placeholder='Let me know how I can help'
                            required
                            value={form.message}
                            onChange={handleChange}
                            onFocus={handleFocus}
                            onBlur={handleblur}
                        />
                    </label>
                    <button
                        type='submit'
                        className='btn'
                        disabled={isLoading}
                    >
                        {isLoading ? 'Sending ...' : 'Send'}
                    </button>
                </form>
            </div>

            <div className='lg:w-1/2 w-full lg:h-auto md:h-[550px] h-[350px]' onClick={test}>
                <Canvas
                    camera={{
                        position: [0, 0, 1],
                        fov: 75,
                        near: 0.1,
                        far: 1000
                    }}
                >
                    <directionalLight
                        intensity={2.5}
                        position={[0, 0, 1]}
                    />
                    <Suspense fallback={<Loader />}>
                        <Thinker
                            rotate={rotate}
                            makeAnimation={makeAnimation}
                            setMakeAnimation={setMakeAnimation}
                            stopAnimation={stopAnimation}
                            setStopAnimation={setStopAnimation}
                        />
                    </Suspense>
                </Canvas>
            </div>

        </section>
    );
};

export default Contact;
