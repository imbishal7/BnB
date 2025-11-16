"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createListing, uploadImages } from "@/lib/api";
import { Sparkles, Package, DollarSign, Image, Video, Upload, X, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import '@/app/assets/hero_background.css'


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
];

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
];

export default function NewListingPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enableImageGeneration, setEnableImageGeneration] = useState(false);
  const [enableVideoGeneration, setEnableVideoGeneration] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    quantity: "",
    condition: "",
    product_photo_url: "",
    target_audience: "",
    product_features: "",
    video_setting: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleImageToggle = (checked: boolean) => {
    setEnableImageGeneration(checked);
    if (!checked) {
      setFormData((prev) => ({ ...prev, product_photo_url: "", target_audience: "", product_features: "" }));
    }
  };

  const handleVideoToggle = (checked: boolean) => {
    setEnableVideoGeneration(checked);
    if (!checked) {
      setFormData((prev) => ({ ...prev, video_setting: "" }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const invalidFiles = fileArray.filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      setError('Please upload only image files (JPEG, PNG, WebP, GIF)');
      return;
    }

    // Validate file sizes (max 10MB each)
    const maxSize = 10 * 1024 * 1024;
    const oversizedFiles = fileArray.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      setError('Each image must be less than 10MB');
      return;
    }

    // Add to uploaded images list
    setUploadedImages(prev => [...prev, ...fileArray]);
    setError(null);
  };

  const removeUploadedImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    setUploadedImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImagesToCloud = async () => {
    if (uploadedImages.length === 0) return [];

    try {
      setIsUploading(true);
      const response = await uploadImages(uploadedImages);
      setUploadedImageUrls(response.urls);
      return response.urls;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to upload images');
    } finally {
      setIsUploading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError("Title is required");
      return false;
    }
    if (!formData.description.trim()) {
      setError("Description is required");
      return false;
    }
    if (!formData.category) {
      setError("Category is required");
      return false;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError("Price must be greater than 0");
      return false;
    }
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      setError("Quantity must be greater than 0");
      return false;
    }
    if (!formData.condition) {
      setError("Condition is required");
      return false;
    }
    if (enableImageGeneration && !formData.product_photo_url.trim()) {
      setError("Product photo URL is required when image generation is enabled");
      return false;
    }
    if (enableVideoGeneration && !formData.video_setting.trim()) {
      setError("Video setting is required when video generation is enabled");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload images to GCS first if any
      let imageUrls: string[] = [];
      if (uploadedImages.length > 0) {
        imageUrls = await uploadImagesToCloud();
      }

      const listingData: {
        title: string;
        description: string;
        category_id: string;
        price: number;
        quantity: number;
        condition_id: string;
        uploaded_image_urls?: string[];
        product_photo_url?: string;
        target_audience?: string;
        product_features?: string;
        video_setting?: string;
      } = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category_id: formData.category,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        condition_id: formData.condition,
      };

      // Add uploaded image URLs
      if (imageUrls.length > 0) {
        listingData.uploaded_image_urls = imageUrls;
      }

      if (enableImageGeneration) {
        listingData.product_photo_url = formData.product_photo_url.trim();
        listingData.target_audience = formData.target_audience.trim();
        listingData.product_features = formData.product_features.trim();
      }

      if (enableVideoGeneration) {
        listingData.video_setting = formData.video_setting.trim();
      }

      const response = await createListing(listingData);
      router.push(`/listings/${response.id}/media-review`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create listing"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background">
      <div className="hero-background min-h-screen absolute top-0 left-0 w-full h-full opacity-30"></div>
      <div className="container mx-auto max-w-4xl py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header Section */}
        <div className="mb-8 space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Create New Listing</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Fill in the details below to create your product listing. We'll generate stunning media for you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive shadow-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">Error:</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Basic Information Section */}
          <div className="rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-6 space-y-1">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Basic Information
              </h2>
              <p className="text-sm text-muted-foreground">
                Provide the essential details about your product
              </p>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base font-medium">
                  Product Title *
                </Label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Vintage Leather Jacket - Size Medium"
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-base font-medium">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your product in detail. Include key features, specifications, and any important information buyers should know..."
                  rows={5}
                  className="resize-none"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  A detailed description helps buyers understand your product better
                </p>
              </div>
            </div>
          </div>

          {/* Category & Condition Section */}
          <div className="rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-6 space-y-1">
              <h2 className="text-xl font-semibold">Product Details</h2>
              <p className="text-sm text-muted-foreground">
                Select the appropriate category and condition for your listing
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-base font-medium">
                  Category *
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleSelectChange("category", value)}
                >
                  <SelectTrigger id="category" className="w-full h-11">
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
                <Label htmlFor="condition" className="text-base font-medium">
                  Condition *
                </Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value) => handleSelectChange("condition", value)}
                >
                  <SelectTrigger id="condition" className="w-full h-11">
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
            </div>
          </div>

          {/* Pricing Section */}
          <div className="rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-6 space-y-1">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Pricing & Inventory
              </h2>
              <p className="text-sm text-muted-foreground">
                Set your price and available quantity
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-base font-medium">
                  Price *
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="h-11 pl-8"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-base font-medium">
                  Quantity *
                </Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="1"
                  className="h-11"
                  required
                />
              </div>
            </div>
          </div>

          {/* Product Images Upload Section */}
          <div className="rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-6 space-y-1">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Image className="h-5 w-5 text-primary" />
                Product Images
              </h2>
              <p className="text-sm text-muted-foreground">
                Upload actual photos of your product (optional but recommended)
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
                <div className="flex flex-col items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <Label htmlFor="image-upload" className="cursor-pointer">
                      <span className="text-primary hover:underline font-medium">
                        Click to upload
                      </span>
                      <span className="text-muted-foreground"> or drag and drop</span>
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, WebP or GIF (max 10MB each)
                    </p>
                  </div>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isUploading || isSubmitting}
                  />
                </div>
              </div>

              {/* Preview uploaded images */}
              {uploadedImages.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Uploaded Images ({uploadedImages.length})
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {uploadedImages.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg border overflow-hidden">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeUploadedImage(index)}
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          disabled={isUploading || isSubmitting}
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                          {file.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isUploading && (
                <div className="flex items-center justify-center gap-2 text-primary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Uploading images to cloud storage...</span>
                </div>
              )}
            </div>
          </div>

          {/* Media Generation Prompts Section */}
          <div className="rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-6 space-y-1">
              <h2 className="text-xl font-semibold">AI Media Generation</h2>
              <p className="text-sm text-muted-foreground">
                Optionally enable AI-generated images and videos for your listing
              </p>
            </div>
            <div className="space-y-6">
              {/* Image Generation Toggle */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enable-image" className="text-base font-medium flex items-center gap-2 cursor-pointer">
                      <Image className="h-4 w-4 text-primary" />
                      Generate Image
                    </Label>
                  </div>
                  <Switch
                    id="enable-image"
                    checked={enableImageGeneration}
                    onCheckedChange={handleImageToggle}
                  />
                </div>
                {enableImageGeneration && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="space-y-2">
                      <Label htmlFor="product_photo_url" className="text-sm font-medium">
                        Product Photo URL *
                      </Label>
                      <Input
                        id="product_photo_url"
                        name="product_photo_url"
                        type="url"
                        value={formData.product_photo_url}
                        onChange={handleChange}
                        placeholder="https://example.com/product-image.jpg"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="target_audience" className="text-sm font-medium">
                        Target Audience (ICP)
                      </Label>
                      <Input
                        id="target_audience"
                        name="target_audience"
                        value={formData.target_audience}
                        onChange={handleChange}
                        placeholder="e.g., Young male athlete"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="product_features" className="text-sm font-medium">
                        Product Features
                      </Label>
                      <Textarea
                        id="product_features"
                        name="product_features"
                        value={formData.product_features}
                        onChange={handleChange}
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
                    onCheckedChange={handleVideoToggle}
                  />
                </div>
                {enableVideoGeneration && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <Label htmlFor="video_setting" className="text-sm font-medium">
                      Video Setting *
                    </Label>
                    <Textarea
                      id="video_setting"
                      name="video_setting"
                      value={formData.video_setting}
                      onChange={handleChange}
                      placeholder="e.g., A cyclist with water bottle in outdoor setting"
                      rows={4}
                      className="resize-none"
                      required
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-4 pt-4 w-1/2 mx-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="w-auto h-11 sm:w-1/2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-auto h-11 text-base font-medium sm:w-1/2"
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2">Creating...</span>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Create Listing
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

