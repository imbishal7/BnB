'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'

export function CTASection() {
  return (
    <section className="relative ">
      <div className="hero-background absolute top-0 left-0 w-full h-full opacity-60 z-10"></div>
      <div className="max-w-4xl mx-auto container px-4 py-10 relative z-10 rounded-lg shadow-lg">
      <div className='mb-10  bg-primary py-10 text-primary-foreground rounded-lg'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-balance">
            Ready to Transform Your Listings?
          </h2>
          <p className="text-lg mb-10 opacity-90 text-balance">
            Join vendors who are saving hours and selling more with
            AI-powered listings
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="lg"
              variant="secondary"
              className="text-base px-8 group"
            >
              Get Started Free
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
      </div>
    </section>
  )
}

