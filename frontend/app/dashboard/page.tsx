'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Package, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { isAuthenticated, getAllListings, ListingResponse } from '@/lib/api'
import '@/app/assets/hero_background.css'

export default function DashboardPage() {
  const router = useRouter()
  const [listings, setListings] = useState<ListingResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      router.push('/auth/login')
      return
    }

    // Fetch listings from API
    const fetchListings = async () => {
      try {
        setLoading(true)
        const data = await getAllListings()
        setListings(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load listings')
        console.error('Error fetching listings:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchListings()
  }, [router])

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      draft: { label: 'Draft', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
      generating_media: { label: 'Generating Media', variant: 'default', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
      media_ready: { label: 'Media Ready', variant: 'default', icon: <Package className="h-3 w-3" /> },
      approved: { label: 'Approved', variant: 'default', icon: <CheckCircle2 className="h-3 w-3" /> },
      publishing: { label: 'Publishing', variant: 'default', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
      published: { label: 'Published', variant: 'default', icon: <CheckCircle2 className="h-3 w-3" /> },
      error: { label: 'Error', variant: 'destructive', icon: <AlertCircle className="h-3 w-3" /> },
    }

    const config = statusConfig[status] || statusConfig.draft
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        {config.icon}
        {config.label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error && listings.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-2xl font-bold">Error Loading Dashboard</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-background">
      <div className="hero-background min-h-screen absolute top-0 left-0 w-full h-full opacity-20"></div>
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Dashboard</h1>
            <p className="text-muted-foreground text-lg">
              Manage your product listings and track their status
            </p>
          </div>
          <Link href="/listings/new">
            <Button size="lg" className="rounded-full group">
              <Plus className="h-4 w-4 mr-2" />
              Create Listing
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4 grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardDescription>Total Listings</CardDescription>
              <CardTitle className="text-3xl">{listings.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Published</CardDescription>
              <CardTitle className="text-3xl">
                {listings.filter(l => l.status === 'published').length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Drafts</CardDescription>
              <CardTitle className="text-3xl">
                {listings.filter(l => l.status === 'draft').length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>In Progress</CardDescription>
              <CardTitle className="text-3xl">
                {listings.filter(l => ['generating_media', 'media_ready', 'approved', 'publishing'].includes(l.status)).length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Listings */}
        <Card>
          <CardHeader>
            <CardTitle>Your Listings</CardTitle>
            <CardDescription>
              All your product listings in one place
            </CardDescription>
          </CardHeader>
          <CardContent>
            {listings.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No listings yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first listing to start selling on marketplaces
                </p>
                <Link href="/listings/new">
                  <Button className="rounded-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Listing
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {listings.map((listing) => (
                  <div
                    key={listing.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{listing.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>${listing.price.toFixed(2)}</span>
                        <span>•</span>
                        <span>{new Date(listing.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {getStatusBadge(listing.status)}
                      <Link href={`/listings/${listing.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
