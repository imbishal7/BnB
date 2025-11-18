'use client'

import {
  HeroSection,
  MarketplacesSection,
  CTASection,
} from '@/components/customcomponents/home'

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-background">
            <div className="hero-background min-h-screen absolute top-0 left-0 w-full h-full opacity-60 -z-10"></div>

<div className="z-10">
      <HeroSection />
      
      <CTASection /> </div>
    </div>
  )
}
