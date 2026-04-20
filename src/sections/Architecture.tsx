import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function Architecture() {
  const sectionRef = useRef<HTMLElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!textRef.current || !imageRef.current) return

    // Text slides in
    gsap.fromTo(
      textRef.current,
      { opacity: 0, x: -60 },
      {
        opacity: 1,
        x: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
        },
      }
    )

    // Image slides in
    gsap.fromTo(
      imageRef.current,
      { opacity: 0, x: 60 },
      {
        opacity: 1,
        x: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
        },
      }
    )

    // Overlay glass panel
    if (overlayRef.current) {
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'expo.out',
          delay: 0.4,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
          },
        }
      )
    }
  }, { scope: sectionRef })

  return (
    <section
      ref={sectionRef}
      id="index"
      className="relative w-full py-40 px-6 lg:px-[5vw]"
      style={{ background: '#0A0A0C' }}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left: Text */}
        <div ref={textRef} style={{ opacity: 0 }}>
          <div className="font-mono-label text-[#7A7A7A] mb-6">
            THE ARCHITECTURE
          </div>

          <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-medium leading-[1.15] text-[#EAEAEA] mb-8">
            Automated topic
            <br />
            <span className="text-[#7B61FF]">suggestions</span>
          </h2>

          <p className="text-[#7A7A7A] text-lg leading-relaxed mb-6 max-w-md">
            Our AI continuously monitors trends, audience engagement patterns,
            and your content calendar to surface the most relevant topics
            before you even ask.
          </p>

          <div className="space-y-4 mb-10">
            {[
              'End-to-end encryption for all drafts',
              'Version history with semantic diff',
              'Custom workflow automation',
              'Team permissions & approvals',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#7B61FF]" />
                <span className="text-[#EAEAEA] text-sm">{feature}</span>
              </div>
            ))}
          </div>

          <button className="px-6 py-3 rounded-full liquid-glass liquid-glass-hover text-[#EAEAEA] text-sm font-medium">
            Explore the architecture
          </button>
        </div>

        {/* Right: Image with overlay */}
        <div ref={imageRef} className="relative" style={{ opacity: 0 }}>
          <div className="relative rounded-xl overflow-hidden">
            <img
              src="./images/dashboard.jpg"
              alt="Claide Dashboard"
              className="w-full h-auto rounded-xl"
              style={{
                filter: 'brightness(0.9) contrast(1.05)',
              }}
            />
            {/* Noise overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.03]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              }}
            />
          </div>

          {/* Floating glass overlay */}
          <div
            ref={overlayRef}
            className="absolute -bottom-6 -left-6 liquid-glass rounded-xl p-6 max-w-[280px]"
            style={{ opacity: 0 }}
          >
            <div className="font-mono-label text-[#7A7A7A] mb-2">PREVIEW</div>
            <p className="text-[#EAEAEA] text-sm leading-relaxed blur-[1px]">
              Content suggestions based on trending topics in your niche...
            </p>
            <div className="mt-3 flex gap-2">
              <div className="w-16 h-2 rounded-full bg-[#7B61FF]/30" />
              <div className="w-10 h-2 rounded-full bg-[#FF8C42]/30" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
