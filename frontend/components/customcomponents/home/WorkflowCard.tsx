'use client'
import { Check, Sparkles, PackageCheck, Upload } from 'lucide-react'
import { motion } from 'motion/react'
import { useState, useEffect } from 'react'

const steps = [
  { label: 'Upload', icon: Upload },
  { label: 'Generate', icon: Sparkles },
  { label: 'Publish', icon: PackageCheck },
]

export function WorkflowCard() {
  const [workflowStep, setWorkflowStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setWorkflowStep((prev) => (prev + 1) % 4)
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  const isAllComplete = workflowStep === 3

  return (
    <div className="flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-3xl mx-auto"
      >
        <div className="relative flex items-center justify-center md:gap-24 gap-12 px-8">
          {/* Dots and Labels */}
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = workflowStep === index
            const isCompleted = workflowStep > index || isAllComplete
            // const isGenerate = index === 1

            return (
              <div key={index} className="flex flex-col items-center relative z-10">
                <motion.div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-shadow duration-300 ${
                    isCompleted || isAllComplete
                      ? 'bg-primary border-primary shadow-lg shadow-primary/50'
                      : isActive
                      ? 'bg-background border-primary shadow-lg shadow-primary/30'
                      : 'bg-background border-muted'
                  }`}
                  initial={{ scale: 0 }}
                  animate={{ 
                    scale: isActive ? [1, 1.1, 1] : 1,
                  }}
                  transition={{
                    scale: {
                      duration: isActive ? 1.5 : 0.3,
                      repeat: isActive ? Infinity : 0,
                      ease: 'easeInOut',
                    },
                  }}
                >
                  {isCompleted || isAllComplete ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.4, ease: 'backOut' }}
                    >
                      <Check className="w-6 h-6 text-primary-foreground" strokeWidth={3} />
                    </motion.div>
                  ) : isActive ? ((
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3, ease: 'backOut' }}
                      >
                        <Icon className="w-6 h-6 text-primary" strokeWidth={2.5} />
                      </motion.div>
                    )
                  ) : (
                    <Icon className="w-6 h-6 text-muted-foreground" strokeWidth={2} />
                  )}
                </motion.div>
                
                <motion.p
                  className="mt-3 text-lg font-normal"
                  animate={{
                    color: isActive || isCompleted || isAllComplete
                      ? 'hsl(var(--primary))'
                      : 'hsl(var(--muted-foreground))',
                    scale: isActive ? 1.05 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {step.label}
                </motion.p>
              </div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
