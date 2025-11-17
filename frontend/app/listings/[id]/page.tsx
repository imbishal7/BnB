'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Play,
  Save,
  X,
  Upload,
  User
} from 'lucide-react'
import { getListing, ListingResponse, updateListing, deleteListing, uploadImages } from '@/lib/api'
import '@/app/assets/hero_background.css'

export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const listingId = params.id as string
  
  const [listing, setListing] = useState<ListingResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [enableImageGeneration, setEnableImageGeneration] = useState(false)
  const [enableVideoGeneration, setEnableVideoGeneration] = useState(false)
  const [avatarPhoto, setAvatarPhoto] = useState<File | null>(null)
  const [avatarPhotoPreview, setAvatarPhotoPreview] = useState<string>('')
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    price: 0,
    quantity: 0,
    category_id: '',
    condition_id: '',
    target_audience: '',
    product_features: '',
    video_setting: '',
  })

  const CONDITIONS = [
    { value: "1000", label: "New" },
    { value: "1500", label: "New other (see details)" },
    { value: "1750", label: "New with defects" },
    { value: "2000", label: "Certified - Refurbished" },
    { value: "2500", label: "Excellent - Refurbished" },
    { value: "3000", label: "Very Good - Refurbished" },
    { value: "4000", label: "Good - Refurbished" },
    { value: "5000", label: "Seller Refurbished" },
    { value: "6000", label: "Used" },
    { value: "7000", label: "Very Good" },
    { value: "8000", label: "Good" },
    { value: "9000", label: "Acceptable" },
    { value: "10000", label: "For parts or not working" },
  ]

  const CATEGORIES = [
    { value: "1", label: "Antiques" },
    { value: "2", label: "Art" },
    { value: "3", label: "Baby" },
    { value: "4", label: "Books" },
    { value: "5", label: "Business & Industrial" },
    { value: "6", label: "Cameras & Photo" },
    { value: "7", label: "Cell Phones & Accessories" },
    { value: "8", label: "Clothing, Shoes & Accessories" },
    { value: "9", label: "Coins & Paper Money" },
    { value: "10", label: "Collectibles" },
    { value: "11", label: "Computers/Tablets & Networking" },
    { value: "12", label: "Consumer Electronics" },
    { value: "13", label: "Crafts" },
    { value: "14", label: "Dolls & Bears" },
    { value: "15", label: "DVDs & Movies" },
    { value: "16", label: "Entertainment Memorabilia" },
    { value: "17", label: "Gift Cards & Coupons" },
    { value: "18", label: "Health & Beauty" },
    { value: "19", label: "Home & Garden" },
    { value: "20", label: "Jewelry & Watches" },
    { value: "21", label: "Music" },
    { value: "22", label: "Musical Instruments & Gear" },
    { value: "23", label: "Pet Supplies" },
    { value: "24", label: "Pottery & Glass" },
    { value: "25", label: "Real Estate" },
    { value: "26", label: "Specialty Services" },
    { value: "27", label: "Sporting Goods" },
    { value: "28", label: "Sports Mem, Cards & Fan Shop" },
    { value: "29", label: "Stamps" },
    { value: "30", label: "Tickets & Experiences" },
    { value: "31", label: "Toys & Hobbies" },
    { value: "32", label: "Travel" },
    { value: "33", label: "Video Games & Consoles" },
    { value: "34", label: "Everything Else" },
  ]

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getListing(listingId)
        setListing(data)
        
        // Initialize edit form with listing data
        setEditForm({
          title: data.title,
          description: data.description,
          price: data.price,
          quantity: data.quantity,
          category_id: data.category_id || '',
          condition_id: data.condition_id || '',
          target_audience: data.target_audience || '',
          product_features: data.product_features || '',
          video_setting: data.video_setting || '',
        })
        
        // Set switches based on existing data
        setEnableImageGeneration(!!(data.target_audience || data.product_features))
        setEnableVideoGeneration(!!data.video_setting)
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

  const handleSave = async () => {
    if (!listing) return
    
    try {
      setIsSaving(true)
      const updated = await updateListing(listingId, editForm)
      setListing(updated)
      setIsEditing(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update listing')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return
    }
    
    try {
      setIsDeleting(true)
      await deleteListing(listingId)
      router.push('/dashboard')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete listing')
      setIsDeleting(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    try {
      setUploadingImages(true)
      const filesArray = Array.from(files)
      const response = await uploadImages(filesArray)
      
      // Add new URLs to existing uploaded_image_urls
      const currentUrls = listing?.uploaded_image_urls || []
      const updatedUrls = [...currentUrls, ...response.urls]
      
      // Update the listing with new image URLs
      const updated = await updateListing(listingId, { uploaded_image_urls: updatedUrls })
      setListing(updated)
      
      alert(`Successfully uploaded ${response.count} image(s)`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to upload images')
    } finally {
      setUploadingImages(false)
      e.target.value = '' // Reset file input
    }
  }

  const handleRemoveImage = async (urlToRemove: string) => {
    if (!listing || !listing.uploaded_image_urls) return
    
    try {
      const updatedUrls = listing.uploaded_image_urls.filter(url => url !== urlToRemove)
      const updated = await updateListing(listingId, { uploaded_image_urls: updatedUrls })
      setListing(updated)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove image')
    }
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      alert('Please upload an image file (JPEG, PNG, WebP)')
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      alert('Avatar photo must be less than 10MB')
      return
    }

    setAvatarPhoto(file)
    setAvatarPhotoPreview(URL.createObjectURL(file))
  }

  const removeAvatarPhoto = () => {
    setAvatarPhoto(null)
    setAvatarPhotoPreview('')
  }

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
              {isEditing ? (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Delete
                  </Button>
                </>
              )}
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
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-base font-medium">Product Title *</Label>
                      <Input
                        id="title"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        placeholder="e.g., Vintage Leather Jacket - Size Medium"
                        className="h-11"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-base font-medium">Description *</Label>
                      <Textarea
                        id="description"
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="Describe your product in detail..."
                        rows={5}
                        className="resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category" className="text-base font-medium">Category *</Label>
                        <Select
                          value={editForm.category_id}
                          onValueChange={(value) => setEditForm({ ...editForm, category_id: value })}
                        >
                          <SelectTrigger id="category" className="h-11">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="condition" className="text-base font-medium">Condition *</Label>
                        <Select
                          value={editForm.condition_id}
                          onValueChange={(value) => setEditForm({ ...editForm, condition_id: value })}
                        >
                          <SelectTrigger id="condition" className="h-11">
                            <SelectValue placeholder="Select condition" />
                          </SelectTrigger>
                          <SelectContent>
                            {CONDITIONS.map((cond) => (
                              <SelectItem key={cond.value} value={cond.value}>
                                {cond.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="price" className="text-base font-medium">Price *</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                          <Input
                            id="price"
                            type="number"
                            step="0.01"
                            value={editForm.price}
                            onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                            className="h-11 pl-8"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="quantity" className="text-base font-medium">Quantity *</Label>
                        <Input
                          id="quantity"
                          type="number"
                          value={editForm.quantity}
                          onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 0 })}
                          className="h-11"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
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
                          <p className="font-medium">{CATEGORIES.find(c => c.value === listing.category_id)?.label || listing.category_id}</p>
                        </div>
                      )}
                      {listing.condition_id && (
                        <div>
                          <h3 className="text-sm text-muted-foreground mb-1">Condition</h3>
                          <p className="font-medium">{CONDITIONS.find(c => c.value === listing.condition_id)?.label || listing.condition_id}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Uploaded Images */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Uploaded Images
                  </span>
                  <label htmlFor="image-upload">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={uploadingImages}
                      asChild
                    >
                      <span className="cursor-pointer">
                        {uploadingImages ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        Add Images
                      </span>
                    </Button>
                  </label>
                  <input
                    id="image-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {listing.uploaded_image_urls && listing.uploaded_image_urls.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {listing.uploaded_image_urls.map((url, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-lg border overflow-hidden">
                        <img 
                          src={url} 
                          alt={`Uploaded image ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveImage(url)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="secondary">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No images uploaded yet. Click &quot;Add Images&quot; to upload.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* AI Generation Settings */}
            <Card>
              <CardHeader>
                <CardTitle>AI Media Generation</CardTitle>
                <CardDescription>{isEditing ? 'Optionally enable AI-generated images and videos for your listing' : 'Settings used for media generation'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isEditing ? (
                  <>
                    {/* Image Generation Toggle */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="enable-image" className="text-base font-medium flex items-center gap-2 cursor-pointer">
                            <ImageIcon className="h-4 w-4 text-primary" />
                            Generate Image
                          </Label>
                        </div>
                        <Switch
                          id="enable-image"
                          checked={enableImageGeneration}
                          onCheckedChange={(checked) => {
                            setEnableImageGeneration(checked)
                            if (!checked) {
                              setEditForm({ ...editForm, target_audience: '', product_features: '' })
                            }
                          }}
                        />
                      </div>
                      {enableImageGeneration && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="space-y-2">
                            <Label htmlFor="avatar-upload-edit" className="text-sm font-medium flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Avatar/Model Photo (Optional)
                            </Label>
                            <p className="text-xs text-muted-foreground mb-2">
                              Upload a photo of the person/model you want to feature in your UGC content
                            </p>
                            {!avatarPhoto && !avatarPhotoPreview ? (
                              <label htmlFor="avatar-upload-edit" className="cursor-pointer">
                                <div className="border-2 border-dashed border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
                                  <div className="flex flex-col items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                      <Upload className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="text-center">
                                      <span className="text-primary hover:underline font-medium text-sm">
                                        Click to upload avatar photo
                                      </span>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        PNG, JPG, or WebP (max 10MB)
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <input
                                  id="avatar-upload-edit"
                                  type="file"
                                  accept="image/jpeg, image/jpg, image/png, image/webp"
                                  onChange={handleAvatarUpload}
                                  className="hidden"
                                />
                              </label>
                            ) : (
                              <div className="relative border rounded-lg overflow-hidden">
                                <img
                                  src={avatarPhotoPreview}
                                  alt="Avatar preview"
                                  className="w-full h-48 object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={removeAvatarPhoto}
                                  className="absolute top-2 right-2 h-8 w-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-sm p-2 truncate">
                                  {avatarPhoto?.name || 'Avatar photo'}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="target_audience" className="text-sm font-medium">
                              Target Audience (ICP)
                            </Label>
                            <Input
                              id="target_audience"
                              value={editForm.target_audience}
                              onChange={(e) => setEditForm({ ...editForm, target_audience: e.target.value })}
                              placeholder="e.g., Young male athlete"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="product_features" className="text-sm font-medium">
                              Product Features
                            </Label>
                            <Textarea
                              id="product_features"
                              value={editForm.product_features}
                              onChange={(e) => setEditForm({ ...editForm, product_features: e.target.value })}
                              placeholder="e.g., Keeps drinks cold for 24 hours"
                              rows={3}
                              className="resize-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Video Generation Toggle */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="enable-video" className="text-base font-medium flex items-center gap-2 cursor-pointer">
                            <Video className="h-4 w-4 text-primary" />
                            Generate Video
                          </Label>
                        </div>
                        <Switch
                          id="enable-video"
                          checked={enableVideoGeneration}
                          onCheckedChange={(checked) => {
                            setEnableVideoGeneration(checked)
                            if (!checked) {
                              setEditForm({ ...editForm, video_setting: '' })
                            }
                          }}
                        />
                      </div>
                      {enableVideoGeneration && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="space-y-2">
                            <Label htmlFor="video_setting" className="text-sm font-medium">
                              Video Setting *
                            </Label>
                            <Textarea
                              id="video_setting"
                              value={editForm.video_setting}
                              onChange={(e) => setEditForm({ ...editForm, video_setting: e.target.value })}
                              placeholder="e.g., A cyclist with water bottle in outdoor setting"
                              rows={4}
                              className="resize-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </CardContent>
            </Card>

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
