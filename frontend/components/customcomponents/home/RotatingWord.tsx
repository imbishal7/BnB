'use client'

import { motion, AnimatePresence } from 'motion/react'
import { useState, useEffect } from 'react'

export function RotatingWord() {
  const [rotatingWord, setRotatingWord] = useState(0)
  const words = ['Faster', 'Smarter', 'Easier']

  useEffect(() => {
    const interval = setInterval(() => {
      setRotatingWord((prev) => (prev + 1) % words.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={rotatingWord}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
        className="text-primary inline-block font-semibold"
      >
        {words[rotatingWord]}
      </motion.span>
    </AnimatePresence>
  )
}

