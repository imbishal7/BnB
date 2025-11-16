'use client'

import { motion } from 'motion/react'
import { MarketplaceCard } from './MarketplaceCard'
import ebay from "@/app/assets/ebay.png"
import amazon from "@/app/assets/amazon.png"
import walmart from "@/app/assets/walmart.png"

const marketplaces = [
  {
    name: 'Amazon',
    enabled: false,
    delay: 0.1,
    logo: amazon,
  },
  {
    name: 'eBay',
    enabled: true,
    delay: 0.2,
    logo: ebay,
  },
  {
    name: 'Walmart',
    enabled: false,
    delay: 0.3,
    logo: walmart,
  },
]

export function MarketplacesSection() {
  return (
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-6">
            {marketplaces.map((marketplace, index) => (
              <MarketplaceCard key={index} {...marketplace} />
            ))}
          </div>
        </div>
      </div>
  )
}

