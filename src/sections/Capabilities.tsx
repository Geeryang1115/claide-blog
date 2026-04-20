import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import ScrollHighlightText from '../components/ScrollHighlightText'

gsap.registerPlugin(ScrollTrigger)

export default function Capabilities() {
  const sectionRef = useRef<HTMLElement>(null)
  const labelRef = useRef<HTMLDivElement>(null)

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
  }, { scope: sectionRef })

  return (
    <section
      ref={sectionRef}
      id="hub"
      className="relative w-full py-40 px-6 lg:px-[5vw]"
      style={{ background: '#030305' }}
    >
      <div className="max-w-[720px]">
        <div
          ref={labelRef}
          className="font-mono-label text-[#7A7A7A] mb-8"
          style={{ opacity: 0 }}
        >
          CAPABILITIES
        </div>

        <ScrollHighlightText
          text="Claide orchestrates complex editorial workflows by understanding context, maintaining voice consistency, and structuring narratives that resonate with your audience across every channel."
          className="text-[clamp(1.5rem,3vw,2.25rem)] leading-[1.3] font-normal"
        />
      </div>

      <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
        {[
          {
            number: '01',
            title: 'Context Awareness',
            description:
              'Maintains deep understanding of your brand voice, audience preferences, and content history across every generation.',
          },
          {
            number: '02',
            title: 'Multi-Format Output',
            description:
              'Transform a single source into blog posts, social threads, newsletters, and video scripts without losing coherence.',
          },
          {
            number: '03',
            title: 'Collaborative Editing',
            description:
              'Real-time suggestions and iterative refinement that feels like working with a senior editor who knows your style.',
          },
        ].map((item, index) => (
          <CapabilityCard key={index} {...item} />
        ))}
      </div>
    </section>
  )
}

function CapabilityCard({
  number,
  title,
  description,
}: {
  number: string
  title: string
  description: string
}) {
  const cardRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!cardRef.current) return

    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: cardRef.current,
          start: 'top 85%',
        },
      }
    )
  }, { scope: cardRef })

  return (
    <div
      ref={cardRef}
      className="liquid-glass rounded-xl p-8 liquid-glass-hover"
      style={{ opacity: 0 }}
    >
      <div className="font-mono-label text-[#7B61FF] mb-4">{number}</div>
      <h3 className="text-xl font-medium text-[#EAEAEA] mb-3">{title}</h3>
      <p className="text-[#7A7A7A] text-sm leading-relaxed">{description}</p>
    </div>
  )
}
