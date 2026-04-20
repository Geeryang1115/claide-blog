import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const integrations = [
  {
    icon: './images/icon-neural.jpg',
    name: 'GPT-4o',
    description:
      'OpenAI\'s flagship multimodal model powering deep reasoning, code generation, and nuanced content understanding across all workflows.',
  },
  {
    icon: './images/icon-vision.jpg',
    name: 'Claude 3.5',
    description:
      'Anthropic\'s advanced assistant with extended context windows, enabling comprehensive document analysis and long-form content synthesis.',
  },
  {
    icon: './images/icon-document.jpg',
    name: 'Vision',
    description:
      'Native image understanding that extracts insights from charts, diagrams, and visual assets to enrich your written content.',
  },
  {
    icon: './images/icon-dataflow.jpg',
    name: 'Data Flow',
    description:
      'Seamless pipeline connecting your CMS, analytics, and publishing platforms with real-time synchronization and automated triggers.',
  },
]

export default function Integrations() {
  const sectionRef = useRef<HTMLElement>(null)
  const labelRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!labelRef.current) return

    gsap.fromTo(
      labelRef.current,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        },
      }
    )

    if (cardsRef.current) {
      const cards = cardsRef.current.querySelectorAll('.integration-card')
      gsap.fromTo(
        cards,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: cardsRef.current,
            start: 'top 80%',
          },
        }
      )
    }
  }, { scope: sectionRef })

  return (
    <section
      ref={sectionRef}
      id="search"
      className="relative w-full py-40 px-6 lg:px-[5vw]"
      style={{ background: '#030305' }}
    >
      <div className="max-w-7xl mx-auto">
        <div ref={labelRef} className="text-center mb-20" style={{ opacity: 0 }}>
          <div className="font-mono-label text-[#7A7A7A] mb-6">
            INTEGRATIONS
          </div>
          <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-medium leading-[1.15] text-[#EAEAEA]">
            Powered by the best
            <br />
            <span className="text-[#7B61FF]">AI models</span>
          </h2>
        </div>

        <div
          ref={cardsRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {integrations.map((item, index) => (
            <div
              key={index}
              className="integration-card liquid-glass rounded-xl p-8 liquid-glass-hover transition-transform duration-300 hover:-translate-y-1"
              style={{ opacity: 0 }}
            >
              <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-6 overflow-hidden">
                <img
                  src={item.icon}
                  alt={item.name}
                  className="w-8 h-8 object-contain invert"
                />
              </div>
              <h3 className="text-lg font-medium text-[#EAEAEA] mb-3">
                {item.name}
              </h3>
              <p className="text-[#7A7A7A] text-sm leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
