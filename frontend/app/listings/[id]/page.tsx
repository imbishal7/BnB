'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Image as ImageIcon, 
  Video, 
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Package,
  Play
} from 'lucide-react'
import { getListing, ListingResponse } from '@/lib/api'
import '@/app/assets/hero_background.css'

export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const listingId = params.id as string
  
  const [listing, setListing] = useState<ListingResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getListing(listingId)
        setListing(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load listing')
        console.error('Error fetching listing:', err)
      } finally {
        setLoading(false)
      }
    }

    if (listingId) {
      fetchListing()
    }
  }, [listingId])

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
          <p className="text-muted-foreground">Loading listing...</p>
        </div>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-2xl font-bold">Listing Not Found</h2>
          <p className="text-muted-foreground">{error || 'The listing you are looking for does not exist.'}</p>
          <div className="flex gap-2">
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Link href="/dashboard">
              <Button>View Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-background">
      <div className="hero-background min-h-screen absolute top-0 left-0 w-full h-full opacity-20"></div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{listing.title}</h1>
              <div className="flex items-center gap-3">
                {getStatusBadge(listing.status)}
                <span className="text-muted-foreground">
                  Created {new Date(listing.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-1">Description</h3>
                  <p className="text-muted-foreground">{listing.description}</p>
                </div>
                
                {listing.enriched_description && (
                  <div>
                    <h3 className="font-semibold mb-1">Enriched Description</h3>
                    <p className="text-muted-foreground">{listing.enriched_description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <h3 className="text-sm text-muted-foreground mb-1">Price</h3>
                    <p className="text-2xl font-bold">${listing.price.toFixed(2)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm text-muted-foreground mb-1">Quantity</h3>
                    <p className="text-2xl font-bold">{listing.quantity}</p>
                  </div>
                  {listing.category_id && (
                    <div>
                      <h3 className="text-sm text-muted-foreground mb-1">Category</h3>
                      <p className="font-medium">{listing.category_id}</p>
                    </div>
                  )}
                  {listing.condition_id && (
                    <div>
                      <h3 className="text-sm text-muted-foreground mb-1">Condition</h3>
                      <p className="font-medium">{listing.condition_id}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* UGC Settings */}
            {(listing.product_photo_url || listing.target_audience || listing.product_features || listing.video_setting) && (
              <Card>
                <CardHeader>
                  <CardTitle>AI Generation Settings</CardTitle>
                  <CardDescription>Settings used for media generation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {listing.product_photo_url && (
                    <div>
                      <h3 className="font-semibold mb-1">Product Photo URL</h3>
                      <a 
                        href={listing.product_photo_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        {listing.product_photo_url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  
                  {listing.target_audience && (
                    <div>
                      <h3 className="font-semibold mb-1">Target Audience</h3>
                      <p className="text-muted-foreground">{listing.target_audience}</p>
                    </div>
                  )}
                  
                  {listing.product_features && (
                    <div>
                      <h3 className="font-semibold mb-1">Product Features</h3>
                      <p className="text-muted-foreground">{listing.product_features}</p>
                    </div>
                  )}
                  
                  {listing.video_setting && (
                    <div>
                      <h3 className="font-semibold mb-1">Video Setting</h3>
                      <p className="text-muted-foreground">{listing.video_setting}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Error Message */}
            {listing.error_message && (
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Error
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-destructive">{listing.error_message}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Media */}
            {listing.media && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Generated Media
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {listing.media.image_urls && listing.media.image_urls.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Images ({listing.media.image_urls.length})</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {listing.media.image_urls.map((url, idx) => (
                          <div key={idx} className="aspect-square rounded-lg border overflow-hidden">
                            <img 
                              src={url} 
                              alt={`Generated image ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {listing.media.video_url && (
                    <div>
                      <h3 className="font-semibold mb-2">Video</h3>
                      <div className="aspect-video rounded-lg border overflow-hidden bg-muted flex items-center justify-center">
                        <a 
                          href={listing.media.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center gap-2 text-primary hover:text-primary/80"
                        >
                          <Play className="h-8 w-8" />
                          <span className="text-sm">View Video</span>
                        </a>
                      </div>
                    </div>
                  )}

                  {listing.status === 'media_ready' && (
                    <Link href={`/listings/${listing.id}/media-review`}>
                      <Button className="w-full">
                        Review Media
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Published Info */}
            {listing.published_listing && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    Published on eBay
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm text-muted-foreground mb-1">Item ID</h3>
                    <p className="font-mono text-sm">{listing.published_listing.ebay_item_id}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm text-muted-foreground mb-1">Published</h3>
                    <p className="text-sm">
                      {new Date(listing.published_listing.published_at).toLocaleString()}
                    </p>
                  </div>
                  
                  <a
                    href={listing.published_listing.ebay_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="w-full" variant="outline">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View on eBay
                    </Button>
                  </a>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {listing.status === 'draft' && (
                  <Link href={`/listings/${listing.id}/media-review`}>
                    <Button className="w-full">
                      Generate Media
                    </Button>
                  </Link>
                )}
                
                {listing.status === 'media_ready' && (
                  <Link href={`/listings/${listing.id}/media-review`}>
                    <Button className="w-full">
                      Review & Approve
                    </Button>
                  </Link>
                )}
                
                {listing.status === 'approved' && (
                  <Button className="w-full">
                    Publish to eBay
                  </Button>
                )}
                
                <Link href={`/listings/${listing.id}/preview`}>
                  <Button variant="outline" className="w-full">
                    Preview Listing
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
