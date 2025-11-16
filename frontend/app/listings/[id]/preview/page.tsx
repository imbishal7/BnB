'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Share2, Heart, Loader2 } from 'lucide-react'
import { getListing } from '@/lib/api'
import { ListingInformation, defaultListingInformation } from './information'
import { transformApiDataToListingInfo } from './information'

export default function ItemPage() {
  const params = useParams()
  const listingId = params.id as string
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [listingInfo, setListingInfo] = useState<ListingInformation>(defaultListingInformation)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchListingData = async () => {
      if (!listingId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const apiData = await getListing(listingId)
        const transformedData = transformApiDataToListingInfo(apiData)
        setListingInfo(transformedData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load listing')
        // Fall back to default data on error
        setListingInfo(defaultListingInformation)
      } finally {
        setLoading(false)
      }
    }

    fetchListingData()
  }, [listingId])

  const images = listingInfo.images

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
          <div className="flex items-center gap-3 mx-auto">
            <h1 className="text-4xl font-bold">Preview Listing</h1>
          </div>
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
                    <label className="text-sm font-medium">Quantity</label>
                    <Select value={quantity.toString()} onValueChange={(val) => setQuantity(Number(val))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {quantityOptions.map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
              <p>{listingInfo.description}</p>
              {listingInfo.whatsIncluded && listingInfo.whatsIncluded.length > 0 && (
                <div>
                  <h3 className="mb-2 font-semibold text-foreground">What's Included:</h3>
                  <ul className="list-inside list-disc space-y-1">
                    {listingInfo.whatsIncluded.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {listingInfo.conditionNotes && listingInfo.conditionNotes.length > 0 && (
                <div>
                  <h3 className="mb-2 font-semibold text-foreground">Condition Notes:</h3>
                  <ul className="list-inside list-disc space-y-1">
                    {listingInfo.conditionNotes.map((note, idx) => (
                      <li key={idx}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
