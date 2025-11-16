'use client'

import { Card } from '@/components/ui/card'
import { motion } from 'motion/react'

export function ProductPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4 }}
      className="mt-16 max-w-5xl mx-auto"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Card className="p-8 shadow-2xl bg-card/50 backdrop-blur-sm border-2">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="aspect-square bg-muted rounded-xl overflow-hidden"
              >
                <img
                  src="/modern-electronic-product-on-white-background.jpg"
                  alt="Product preview"
                  className="w-full h-full object-cover"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="flex gap-2"
              >
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-20 h-20 bg-muted rounded-lg"
                  />
                ))}
              </motion.div>
            </div>
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <div className="h-8 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/4" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="space-y-2"
              >
                <div className="h-4 bg-muted rounded" />
                <div className="h-4 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-5/6" />
              </motion.div>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}

