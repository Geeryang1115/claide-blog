import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface ScrollHighlightTextProps {
  text: string
  className?: string
}

export default function ScrollHighlightText({ text, className = '' }: ScrollHighlightTextProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wordRefs = useRef<HTMLSpanElement[]>([])

  const words = text.split(' ')

  useGSAP(() => {
    if (!containerRef.current || wordRefs.current.length === 0) return

    const wordElements = wordRefs.current.filter(Boolean)
    
    gsap.to(wordElements, {
      color: '#FFFFFF',
      textShadow: '0 0 20px rgba(123, 97, 255, 0.3)',
      stagger: 0.05,
      ease: 'none',
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 80%',
        end: 'bottom 40%',
        scrub: 1,
      },
    })
  }, { scope: containerRef })

  return (
    <div ref={containerRef} className={className}>
      {words.map((word, index) => (
        <span
          key={index}
          ref={(el) => {
            if (el) wordRefs.current[index] = el
          }}
          className="highlight-word"
        >
          {word}
        </span>
      ))}
    </div>
  )
}
