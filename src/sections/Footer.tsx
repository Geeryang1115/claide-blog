import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function Footer() {
  const sectionRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!contentRef.current) return

    gsap.fromTo(
      contentRef.current,
      { opacity: 0, y: 60 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
        },
      }
    )
  }, { scope: sectionRef })

  return (
    <section
      ref={sectionRef}
      id="new"
      className="relative w-full min-h-[80vh] flex items-center justify-center py-40 px-6"
      style={{ background: '#0A0A0C' }}
    >
      <div ref={contentRef} className="text-center" style={{ opacity: 0 }}>
        <h2 className="text-[clamp(2.5rem,6vw,5rem)] font-medium leading-[1.1] text-[#EAEAEA] mb-8">
          Ready to scale
          <br />
          your <span className="text-[#FF8C42]">output</span>?
        </h2>

        <p className="text-[#7A7A7A] text-lg max-w-lg mx-auto mb-12">
          Join thousands of creators who have transformed their content
          workflow with Claide.
        </p>

        <button className="px-12 py-5 rounded-full bg-[#FF8C42] text-white text-lg font-medium hover:bg-[#e67d3a] transition-all duration-300 hover:scale-105 active:scale-95">
          Start creating
        </button>

        <div className="mt-32 flex flex-col md:flex-row items-center justify-center gap-8 text-[#7A7A7A] text-sm">
          <span>© 2025 Claide</span>
          <div className="flex gap-6">
            {['Privacy', 'Terms', 'GitHub', 'Twitter'].map((link) => (
              <a
                key={link}
                href="#"
                className="hover:text-[#EAEAEA] transition-colors duration-300"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
