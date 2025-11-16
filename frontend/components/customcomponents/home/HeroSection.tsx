'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'
import { RotatingWord } from './RotatingWord'
import { WorkflowCard } from './WorkflowCard'
import { ProductPreview } from './ProductPreview'
import { MarketplacesSection } from './MarketplacesSection'

export function HeroSection() {
  return (
    <section className="min-h-screen relative overflow-hidden">
      <div className="flex flex-col md:gap-8 gap-4 container mx-auto px-4 py-20 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 text-balance">
            Brand'N Box
          </h1>

          <motion.p className="text-2xl md:text-3xl mb-4 text-balance font-normal">
            Sell <RotatingWord /> than ever.
          </motion.p>

          <p className="text-lg md:text-xl text-muted-foreground mb-12 text-balance">
            From product to market in under <span className="bg-primary text-primary-foreground px-2 py-1 rounded-4xl">200s</span>
          </p>
        </motion.div>
        <WorkflowCard />

        <div className="md:my-12 my-8">
            <MarketplacesSection/>
        </div>
        {/* <ProductPreview /> */}

        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button size="lg" className="text-base px-8 group rounded-full">
              Create Your Listing
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8 rounded-full">
              Learn More
            </Button>
          </motion.div>
      </div>
    </section>
  )
}

