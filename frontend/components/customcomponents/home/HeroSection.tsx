'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'
import { RotatingWord } from './RotatingWord'
import { WorkflowCard } from './WorkflowCard'
import { ProductPreview } from './ProductPreview'
import { MarketplacesSection } from './MarketplacesSection'
import Link from 'next/link'
import '@/app/assets/hero_background.css'

export function HeroSection() {
    return (
        <section className="relative min-h-screen overflow-hidden">
            <div className="hero-background min-h-screen absolute top-0 left-0 w-full h-full opacity-60"></div>
            <div className="flex flex-col md:gap-8 gap-4 container mx-auto px-4 py-20 md:py-32 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center max-w-4xl mx-auto"
                >
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 text-balance">
                        <span className="font-merriweather">Brand'N Box</span>
                    </h1>

                    <motion.p className="text-2xl md:text-3xl mb-4 text-balance font-normal">
                        Sell <RotatingWord /> than ever.
                    </motion.p>

                    <p className="text-lg md:text-xl text-muted-foreground mb-12 text-balance">
                        From product to market in under <span className="bg-primary text-primary-foreground px-2 py-1 rounded-4xl">5mins</span>
                    </p>
                </motion.div>
                <WorkflowCard />

                <div className="md:my-12 my-8">
                    <MarketplacesSection />
                </div>
                {/* <ProductPreview /> */}

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                >
                    <Link href="/listings/new">
                        <Button size="lg" className="text-base px-8 group rounded-full hover:bg-primary/90 hover:text-primary-foreground hover:cursor-pointer">
                            Create Your Listing
                            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                    <Button size="lg" variant="outline" className="text-base px-8 rounded-full">
                        Learn More
                    </Button>
                </motion.div>
            </div>
        </section>
    )
}

