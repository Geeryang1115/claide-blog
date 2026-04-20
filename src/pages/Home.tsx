import Navigation from '../components/Navigation'
import Hero from '../sections/Hero'
import Capabilities from '../sections/Capabilities'
import Architecture from '../sections/Architecture'
import Integrations from '../sections/Integrations'
import Footer from '../sections/Footer'
import useSmoothScroll from '../hooks/useSmoothScroll'

export default function Home() {
  useSmoothScroll()

  return (
    <div className="relative">
      <Navigation />
      <main>
        <Hero />
        <Capabilities />
        <Architecture />
        <Integrations />
        <Footer />
      </main>
    </div>
  )
}
