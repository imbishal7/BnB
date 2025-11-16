'use client'
import { Check, Loader2, Upload } from 'lucide-react'
import { motion } from 'motion/react'
import { useState, useEffect } from 'react'

const steps = [
  { label: 'Upload', icon: Upload },
  { label: 'Generate', icon: Loader2 },
  { label: 'Publish', icon: Check },
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
    <div className="bg-background flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-3xl mx-auto"
      >
        <div className="relative flex items-center justify-center md:gap-24 gap-12 px-8">
          {/* Background Line - Full length connecting all dots */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 h-1 bg-muted/40 rounded-full -z-10" 
            style={{ 
              left: 'calc(2rem + 1.25rem)',
              right: 'calc(2rem + 1.25rem)',
            }} 
          />
          
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 h-1 rounded-full -z-10 shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
            style={{ 
              left: 'calc(2rem + 1.25rem)',
              background: 'linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--primary)) 100%)',
            }}
            initial={{ width: 0 }}
            animate={{
              width:
                workflowStep === 0
                  ? 0
                  : workflowStep === 1
                  ? 'calc((100% - 6.5rem) / 2)'
                  : 'calc(100% - 6.5rem)',
            }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          />
          
          {/* Dots and Labels */}
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = workflowStep === index
            const isCompleted = workflowStep > index || isAllComplete
            const isGenerate = index === 1

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
                  ) : isActive ? (
                    isGenerate ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                      >
                        <Icon className="w-6 h-6 text-primary" strokeWidth={2.5} />
                      </motion.div>
                    ) : (
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
