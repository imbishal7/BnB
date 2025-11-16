'use client'

import {
  HeroSection,
  MarketplacesSection,
  CTASection,
} from '@/components/customcomponents/home'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <CTASection />
    </div>
  )
}
