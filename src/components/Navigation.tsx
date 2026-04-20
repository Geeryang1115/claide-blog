import { useRef, useState, useEffect } from 'react'

export default function Navigation() {
  const navRef = useRef<HTMLElement>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        backdropFilter: scrolled ? 'blur(20px) saturate(140%)' : 'blur(0px)',
        WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(140%)' : 'blur(0px)',
        background: scrolled ? 'rgba(3, 3, 5, 0.6)' : 'transparent',
        borderBottom: scrolled ? '1px solid rgba(255, 255, 255, 0.04)' : '1px solid transparent',
      }}
    >
      <div className="flex items-center justify-between px-6 lg:px-12 py-4">
        <a href="#" className="text-[#EAEAEA] text-lg font-medium tracking-tight">
          CLAIDE
        </a>

        <div className="hidden md:flex items-center gap-8">
          {['Hub', 'Index', 'Search', 'New'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="relative text-[#7A7A7A] text-sm hover:text-[#EAEAEA] transition-colors duration-300 group"
            >
              {item}
              <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-[#7B61FF] transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button className="w-8 h-8 rounded-full overflow-hidden liquid-glass flex items-center justify-center">
            <div className="w-full h-full bg-gradient-to-br from-[#7B61FF] to-[#FF8C42]" />
          </button>
        </div>
      </div>
    </nav>
  )
}
