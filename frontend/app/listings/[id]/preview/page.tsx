'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Share2, Heart, Loader2, ShoppingCart, Check, ExternalLink } from 'lucide-react'
import { getListing, publishToEbayWithScript } from '@/lib/api'
import { ListingInformation, defaultListingInformation, transformApiDataToListingInfo } from './information'
import { useListingContext } from '../layout'
export default function ItemPage() {
  const params = useParams()
  const listingId = params.id as string
  const { selectedImageIndices, listingData, setListingData } = useListingContext()
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [listingInfo, setListingInfo] = useState<ListingInformation>(defaultListingInformation)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishSuccess, setPublishSuccess] = useState(false)
  const [ebayUrl, setEbayUrl] = useState<string | null>(null)

  useEffect(() => {
    console.log("LISTING DATA",listingData);
    // Prioritize context data - use it if available
    if (listingData) {
      const transformedData = transformApiDataToListingInfo(listingData)
      setListingInfo(transformedData)
      setLoading(false)
      setError(null)
      return
    }

    // Only fetch from API if context doesn't have data (e.g., direct navigation to preview)
    const fetchListingData = async () => {
      if (!listingId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const apiData = await getListing(listingId)
        console.log("API DATA",apiData);
        const transformedData = transformApiDataToListingInfo(apiData)
        console.log("TRANSFORMED DATA",transformedData);
        setListingInfo(transformedData)
        // Store in context for future use
        setListingData(apiData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load listing')
        // Don't set dummy data, just show error state
        setListingData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchListingData()
  }, [listingId, listingData, setListingData])

  // Filter images based on selected indices from context
  const allImages = listingInfo.images && listingInfo.images.length > 0 ? listingInfo.images : defaultListingInformation.images
  const images = useMemo(() => {
    // If context has selected indices, filter images to only show selected ones
    // selectedImageIndices contains the original indices from the full array
    if (selectedImageIndices && selectedImageIndices.size > 0) {
      return allImages.filter((_, index) => selectedImageIndices.has(index))
    }
    // Otherwise, show all images (fallback for direct navigation)
    return allImages
  }, [allImages, selectedImageIndices])

  // Reset selectedImage if it's out of bounds after filtering
  useEffect(() => {
    if (selectedImage >= images.length && images.length > 0) {
      setSelectedImage(0)
    }
  }, [images.length, selectedImage])

  const handlePrevImage = () => {
    setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNextImage = () => {
    setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price)
  }

  const calculateDiscount = () => {
    if (!listingInfo.listPrice || listingInfo.listPrice <= listingInfo.price) return null
    const discount = ((listingInfo.listPrice - listingInfo.price) / listingInfo.listPrice) * 100
    return Math.round(discount)
  }

  const discount = calculateDiscount()
  const maxQuantity = Math.min(listingInfo.availableQuantity, listingInfo.quantity)
  const quantityOptions = Array.from({ length: maxQuantity }, (_, i) => i + 1)

  const handlePublishToEbay = async () => {
    try {
      setIsPublishing(true)
      setError(null)
      setPublishSuccess(false)
      
      const result = await publishToEbayWithScript(listingId)
      
      if (result.success) {
        setPublishSuccess(true)
        setEbayUrl(result.ebay_url)
      } else {
        throw new Error(result.message || 'Failed to publish to eBay')
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to publish to eBay'
      )
    } finally {
      setIsPublishing(false)
    }
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

  if (error) {
    console.error('Error loading listing:', error)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
      <div className="mb-8 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold">Preview Listing</h1>
            
            {/* Publish to eBay Button */}
            {!publishSuccess ? (
              <Button
                onClick={handlePublishToEbay}
                disabled={isPublishing || !listingData?.media || (!listingData.media.image_urls && !listingData.media.video_url)}
                size="lg"
                className="px-8"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Publishing to eBay...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Publish to eBay
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="lg"
                className="px-8"
                onClick={() => ebayUrl && window.open(ebayUrl, '_blank')}
              >
                <Check className="mr-2 h-5 w-5 text-green-600" />
                Published!
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
          {publishSuccess && ebayUrl && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm text-green-800 dark:text-green-200">
                ✅ Successfully published to eBay Sandbox! 
                <a 
                  href={ebayUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-2 underline hover:text-green-900 dark:hover:text-green-100 inline-flex items-center gap-1"
                >
                  View Listing <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>
          )}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-200">
                ❌ {error}
              </p>
            </div>
          )}
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Image Gallery Section */}
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
              <img
                src={typeof images[selectedImage] === 'string' ? images[selectedImage] : (images[selectedImage] as any).src}
                alt={listingInfo.title}
                className="h-full w-full object-cover"
              />
              <button
                onClick={handlePrevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow-lg hover:bg-background"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow-lg hover:bg-background"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
            
            {/* Thumbnail Images */}
            <div className="grid grid-cols-5 gap-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                    selectedImage === idx ? 'border-primary' : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <img 
                    src={typeof img === 'string' ? img : (img as any).src} 
                    alt={`Thumbnail ${idx + 1}`} 
                    className="h-full w-full object-cover" 
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Information Section */}
          <div className="space-y-6">
            <div>
              {listingInfo.badge && (
                <Badge variant="secondary" className="mb-2">{listingInfo.badge}</Badge>
              )}
              <h1 className="text-3xl font-bold text-pretty">{listingInfo.title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Condition: <span className="font-medium text-foreground">{listingInfo.conditionLabel}</span>
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-4xl font-bold">{formatPrice(listingInfo.price, listingInfo.currency)}</div>
              {listingInfo.listPrice && discount && (
                <p className="text-sm text-muted-foreground">
                  List price: <span className="line-through">{formatPrice(listingInfo.listPrice, listingInfo.currency)}</span> ({discount}% off)
                </p>
              )}
            </div>

            <Card className="p-4">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Quantity:</label>
                    {listingInfo.quantity}
                  </div>
                </div>

                <Button className="w-full" size="lg">
                  Buy It Now
                </Button>
                <Button variant="outline" className="w-full" size="lg">
                  Add to Cart
                </Button>
                <Button variant="ghost" className="w-full" size="lg">
                  <Heart className="mr-2 h-5 w-5" />
                  Add to Watchlist
                </Button>
              </div>
            </Card>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Shipping:</span>
                <span className="font-medium">{listingInfo.shipping.method}</span>
              </div>
              {listingInfo.shipping.estimatedDelivery && (
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Delivery:</span>
                  <span className="font-medium">{listingInfo.shipping.estimatedDelivery}</span>
                </div>
              )}
              {listingInfo.returns.accepted && (
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Returns:</span>
                  <span className="font-medium">{listingInfo.returns.policy}</span>
                </div>
              )}
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Payments:</span>
                <span className="font-medium">{listingInfo.paymentMethods.join(', ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Located in:</span>
                <span className="font-medium">{listingInfo.location.city}, {listingInfo.location.state}, {listingInfo.location.country}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  {listingInfo.seller.avatar || listingInfo.seller.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium">{listingInfo.seller.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {listingInfo.seller.rating}% positive ({listingInfo.seller.totalRatings.toLocaleString()})
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Contact seller
              </Button>
              <Button variant="ghost" size="icon">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className="mt-12">
          <Card className="p-6">
            <h2 className="mb-4 text-2xl font-bold">Item Description</h2>
            <div className="space-y-4 text-muted-foreground">
              <div
                className="prose prose-sm max-w-none dark:prose-invert"
              >
                <div dangerouslySetInnerHTML={{ __html: listingData?.enriched_description || '' }} />
              </div>
              
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
