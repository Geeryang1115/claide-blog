import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import ParticleSwarm from '../components/ParticleSwarm'

export default function Hero() {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const tl = gsap.timeline({ delay: 0.5 })

    tl.fromTo(
      titleRef.current,
      { opacity: 0, y: 60 },
      { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' }
    )
    .fromTo(
      subtitleRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
      '-=0.5'
    )
    .fromTo(
      ctaRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
      '-=0.3'
    )
  }, [])

  return (
    <section
      id="hero"
      className="relative w-full h-screen overflow-hidden"
      style={{ background: '#030305' }}
    >
      <ParticleSwarm />

      <div
        className="relative z-10 flex flex-col justify-end h-full px-[5vw] pb-[15vh]"
      >
        <h1
          ref={titleRef}
          className="text-[clamp(2.5rem,7vw,6rem)] font-medium leading-[1.1] text-[#EAEAEA] max-w-4xl"
          style={{ opacity: 0 }}
        >
          Turn raw chaos into
          <br />
          <span className="text-[#7B61FF]">publishable</span> posts.
        </h1>

        <p
          ref={subtitleRef}
          className="mt-6 text-lg text-[#7A7A7A] max-w-xl"
          style={{ opacity: 0 }}
        >
          Claide transforms scattered ideas, research, and drafts into polished,
          publication-ready content through intelligent AI workflows.
        </p>

        <div ref={ctaRef} className="mt-10 flex gap-4" style={{ opacity: 0 }}>
          <button className="px-8 py-3.5 rounded-full bg-[#FF8C42] text-white text-sm font-medium hover:bg-[#e67d3a] transition-colors duration-300">
            Start creating
          </button>
          <button className="px-8 py-3.5 rounded-full liquid-glass liquid-glass-hover text-[#EAEAEA] text-sm font-medium">
            Watch demo
          </button>
        </div>
      </div>
    </section>
  )
}
