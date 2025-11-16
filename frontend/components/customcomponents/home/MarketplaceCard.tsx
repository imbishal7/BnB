'use client'

import { Card } from '@/components/ui/card'
import { motion } from 'motion/react'
import { StaticImageData } from 'next/image'

interface MarketplaceCardProps {
  name: string
  enabled: boolean
  delay: number
  logo: StaticImageData
}

export function MarketplaceCard({
  name,
  enabled,
  delay,
  logo,
}: MarketplaceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={enabled ? { y: -4 } : {}}
      className="relative w-full h-full"
    >
      <Card
        className={`p-6 text-center transition-all bg-background/50`}
      >
        <div className="flex items-center justify-center h-16 mb-4">
          <img
            src={logo.src}
            alt={name}
            className="md:h-30 h-20"
          />
        </div>
      </Card>
      {enabled && (
        <motion.div
          className="absolute inset-0 rounded-lg border-2 border-primary pointer-events-none"
          animate={{
            opacity: [0, 0.5, 0],
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </motion.div>
  )
}

