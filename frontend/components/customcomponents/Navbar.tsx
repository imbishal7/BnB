'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sparkles, LogIn, UserPlus, LogOut, User } from 'lucide-react'
import { isAuthenticated, logout } from '@/lib/api'
import '@/app/assets/hero_background.css'

export function Navbar() {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)

  useEffect(() => {
    setIsAuth(isAuthenticated())
  }, [])

  const handleLogout = () => {
    logout()
    setIsAuth(false)
    router.push('/')
  }

  return (
    <nav className="relative">
<div className="hero-background min-h-screen absolute top-0 left-0 w-full h-full opacity-60 -z-10"></div>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <span className="font-merriweather text-xl font-bold">Brand'N Box</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-4">
            {isAuth ? (
              <>
                <Link href="/listings/new" className="hidden md:block">
                  <Button variant="ghost" size="sm">
                    Create Listing
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden md:flex">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="hidden md:block">
                  <Button variant="ghost" size="sm">
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm" className="rounded-full">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
