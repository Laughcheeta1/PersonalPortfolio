import React from 'react'
import { Link } from 'react-router-dom'

const CTA = () => {
  return (
    <section className='cta'>
        <p className='cta-text'>
            Want to build your awesome idea?!
            <br className='sm:block hidden'/>
            I'd love to help you with turning your dreams into reality!
        </p>
        <Link to="/contact" className='btn'>Tell me about it</Link>

    </section>
  )
}

export default CTA
