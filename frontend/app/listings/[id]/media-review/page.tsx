"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { approveMedia, generateMedia, getListing, publishToEbay, type ListingResponse } from "@/lib/api";
import { CheckCircle2, RefreshCw, Image as ImageIcon, Video, ArrowLeft, Loader2, Check, Download, ShoppingCart } from "lucide-react";
import '@/app/assets/hero_background.css';
import { useListingContext } from "../layout";
interface ListingMedia {
  image_urls?: string[];
  video_url?: string;
}

interface ListingData {
  id?: string;
  sku: string;
  title: string;
  description: string;
  price: string;
  quantity: number;
  category_id: string;
  condition: string;
  brand?: string;
  mpn?: string;
  media?: ListingMedia;
  aspects?: {
    [key: string]: string[];
  };
}

export const dummyData: ListingData = {
  id: "dummy-listing-id",
  sku: "OWALA-WATER-BOTTLE-385912",
  title: "Owala FreeSip Insulated Stainless Steel Water Bottle Leak-Proof BPA-Free NEW",
  description: "<p><strong>Stay hydrated in style with the innovative Owala FreeSip Insulated Stainless Steel Water Bottle!</strong></p><p>Designed for ultimate convenience, this bottle features a patented dual-function spout that lets you choose how you drink. Sip upright through the built-in straw or tilt it back to swig from the wide-mouth opening. The triple-layer insulation ensures your beverages stay cold for hours, while the 100% leak-proof lid gives you peace of mind on the go.</p><h3>Key Features:</h3><ul><li><strong>Triple-Layer Insulation:</strong> Keeps your drinks refreshingly cold for hours, perfect for the gym, office, or outdoors.</li><li><strong>Patented FreeSip Spout:</strong> The unique 2-in-1 design lets you sip through the integrated straw or swig from the larger opening.</li><li><strong>Completely Leak-Proof:</strong> A secure lid and locking carry loop prevent accidental spills in your bag or car.</li><li><strong>Safe & Healthy:</strong> Made from high-quality, BPA, lead, and phthalate-free materials for pure-tasting water.</li><li><strong>Easy to Clean:</strong> Features a wide opening for easy cleaning and adding ice. The lid is dishwasher-safe.</li><li><strong>Convenient Carry Loop:</strong> The integrated loop makes it easy to carry and doubles as a secure lock.</li></ul><p><strong>Condition:</strong> NEW. This item is brand new, unused, and in its original packaging, ready to be your favorite hydration companion.</p>",
  price: "40.0",
  quantity: 49,
  category_id: "180969",
  condition: "NEW",
  brand: "Owala",
  mpn: "123123",
  media: {
    image_urls: [
      "https://images.unsplash.com/photo-1761864293806-51e7500c08e6?q=80&w=2080&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1761864293806-51e7500c08e6?q=80&w=2080&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1762088776943-28a9fbadcec4?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1762088776943-28a9fbadcec4?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://images.unsplash.com/photo-1762088776943-28a9fbadcec4?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    ],
    video_url: "https://storage.googleapis.com/prodcut_assets/761f9d9efac2f282d97801e6e21557d2_1763242585.mp4",
  },
  aspects: {
    "Brand": [
      "Owala"
    ],
    "MPN": [
      "123123"
    ],
    "Type": [
      "Water Bottle"
    ],
    "Color": [
      "Multicolor"
    ],
    "Material": [
      "Stainless Steel"
    ],
    "Features": [
      "Insulated",
      "Leak-Proof",
      "BPA-Free",
      "With Straw",
      "Dishwasher Safe Lid",
      "Carry Loop"
    ]
  }
};

export default function MediaReviewPage() {
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as string;
  const { selectedImageIndices, setSelectedImageIndices, setListingData } = useListingContext();

  const [listing, setListing] = useState<ListingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isRegeneratingImages, setIsRegeneratingImages] = useState(false);
  const [isRegeneratingVideo, setIsRegeneratingVideo] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());
  const [isPublishingToEbay, setIsPublishingToEbay] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  useEffect(() => {
    if (listingId) {
      fetchListing();
    }
  }, [listingId]);

  const fetchListing = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getListing(listingId);
      console.log("DATA From listing",data);
      // const data = dummyData;
      setListing(data as unknown as ListingData);
      setListingData(data as ListingResponse);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load listing"
      );
      setListingData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setIsApproving(true);
      setError(null);
      const selectedImageIndicesArray = Array.from(selectedImages);
      // Ensure context is updated with final selection before navigation
      setSelectedImageIndices(selectedImages.size > 0 ? selectedImages : null);
      // await approveMedia(listingId, selectedImageIndicesArray);
      router.push(`/listings/${listingId}/preview`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to approve media"
      );
    } finally {
      setIsApproving(false);
    }
  };

  const toggleImageSelection = (index: number) => {
    setSelectedImages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (!listing?.media?.image_urls) return;
    const allSelected = listing.media.image_urls.length === selectedImages.size;
    if (allSelected) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(listing.media.image_urls.map((_, index) => index)));
    }
  };

  const handleRegenerateImages = async () => {
    try {
      setIsRegeneratingImages(true);
      setError(null);
      await generateMedia(listingId, 'images');
      // Clear selections when regenerating
      const emptySet = new Set<number>();
      setSelectedImages(emptySet);
      setSelectedImageIndices(null);
      // Refetch listing to get new media
      await fetchListing();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to regenerate images"
      );
    } finally {
      setIsRegeneratingImages(false);
    }
  };

  const handleRegenerateVideo = async () => {
    try {
      setIsRegeneratingVideo(true);
      setError(null);
      await generateMedia(listingId, 'video');
      // Refetch listing to get new media
      await fetchListing();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to regenerate video"
      );
    } finally {
      setIsRegeneratingVideo(false);
    }
  };

  const handlePublishToEbay = async () => {
    try {
      setIsPublishingToEbay(true);
      setError(null);
      setPublishSuccess(false);
      await publishToEbay(listingId);
      setPublishSuccess(true);
      // Refetch to get updated status
      await fetchListing();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to publish to eBay"
      );
    } finally {
      setIsPublishingToEbay(false);
    }
  };

  const handleDownloadImage = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Failed to fetch image');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const extension = blob.type.split('/')[1] || imageUrl.split('.').pop() || 'png';
      link.download = `listing-image-${index + 1}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to download image"
      );
    }
  };

  const handleDownloadVideo = async (videoUrl: string) => {
    try {
      // Handle both absolute URLs and relative paths
      const fetchUrl = videoUrl.startsWith('http') || videoUrl.startsWith('//') ? videoUrl : videoUrl.startsWith('/') ? videoUrl : `/${videoUrl}`;
      const response = await fetch(fetchUrl);
      if (!response.ok) throw new Error('Failed to fetch video');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const extension = blob.type.split('/')[1] || videoUrl.split('.').pop() || 'mp4';
      link.download = `listing-video.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to download video"
      );
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen bg-background">
        <div className="hero-background min-h-screen absolute top-0 left-0 w-full h-full opacity-30"></div>
        <div className="container mx-auto max-w-6xl py-12 px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading media...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !listing) {
    return (
      <div className="relative min-h-screen bg-background">
        <div className="hero-background min-h-screen absolute top-0 left-0 w-full h-full opacity-30"></div>
        <div className="container mx-auto max-w-6xl py-12 px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive shadow-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">Error:</span>
              <span>{error}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return null;
  }

  const hasImages = listing.media?.image_urls && listing.media.image_urls.length > 0;
  const hasVideo = listing.media?.video_url;

  return (
    <div className="relative min-h-screen bg-background">
      <div className="hero-background min-h-screen absolute top-0 left-0 w-full h-full opacity-30"></div>
      <div className="container mx-auto max-w-6xl py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header Section */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center gap-3 mx-auto">
            <h1 className="text-4xl font-bold">Review Media</h1>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive shadow-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">Error:</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Media Display Section */}
        <div className="space-y-6">
          {/* Images Section */}
          {hasImages && (
            <Card className="rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex md:flex-row flex-col gap-4 items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-primary" />
                      Generated Images
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Review the Generated Images for your listing
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasImages && listing.media!.image_urls!.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                        disabled={isRegeneratingImages || isRegeneratingVideo || isApproving}
                        className="h-9"
                      >
                        {selectedImages.size === listing.media!.image_urls!.length ? "Deselect All" : "Select All"}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRegenerateImages}
                      disabled={isRegeneratingImages || isRegeneratingVideo || isApproving}
                      className="h-9"
                    >
                      {isRegeneratingImages ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Regenerate Images
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {listing.media!.image_urls!.map((url, index) => {
                    const isSelected = selectedImages.has(index);
                    return (
                      <div
                        key={index}
                        className="relative aspect-square rounded-lg overflow-hidden border bg-muted group cursor-pointer"
                        onClick={(e) => {
                          // If clicking on the checkbox button, don't do anything (handled by button's onClick)
                          const target = e.target as HTMLElement;
                          if (target.closest('.checkbox-area') || target.closest('button')) {
                            return;
                          }
                          // Otherwise, open image in new tab
                          window.open(url, "_blank");
                        }}
                      >
                        <img
                          src={url}
                          alt={`Generated image ${index + 1}`}
                          className="w-full h-full object-contain transition-transform group-hover:scale-105"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23ddd' width='400' height='400'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='18' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3EFailed to load image%3C/text%3E%3C/svg%3E";
                          }}
                        />
                        {/* Checkbox overlay */}
                        <button
                          className={`checkbox-area absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-background/80 backdrop-blur-sm border-2 border-border hover:bg-accent"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleImageSelection(index);
                          }}
                          aria-label={`${isSelected ? "Deselect" : "Select"} image ${index + 1}`}
                        >
                          {isSelected && <Check className="h-5 w-5" />}
                        </button>
                        {/* Download button */}
                        <button
                          className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border-2 border-border hover:bg-accent flex items-center justify-center transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadImage(url, index);
                          }}
                          aria-label={`Download image ${index + 1}`}
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        {/* Selection overlay */}
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary/10 border-2 border-primary rounded-lg pointer-events-none" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Video Section */}
          {hasVideo && (
            <Card className="rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex md:flex-row flex-col gap-4 items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Video className="h-5 w-5 text-primary" />
                      Generated Video
                    </CardTitle>
                    <CardDescription>
                      Review the Generated Video for your listing
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerateVideo}
                    disabled={isRegeneratingVideo || isRegeneratingImages || isApproving}
                    className="h-9"
                  >
                    {isRegeneratingVideo ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Regenerate Video
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted group">
                  <video                    
                    className="w-full h-full"
                    controls preload="auto"
                  >
                    <source src={listing.media!.video_url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  {/* Download button */}
                  <button
                    className="absolute top-2 right-2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border-2 border-border hover:bg-accent flex items-center justify-center transition-all z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadVideo(listing.media!.video_url!);
                    }}
                    aria-label="Download video"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Media Message */}
          {!hasImages && !hasVideo && (
            <Card className="rounded-xl border bg-card shadow-sm">
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-semibold">No Media Generated Yet</h3>
                    <p className="text-muted-foreground mt-2">
                      Media generation may still be in progress. Click regenerate to try again.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 justify-center items-center pt-4">
            <Button
              onClick={handleApprove}
              disabled={isApproving || isRegeneratingImages || isRegeneratingVideo || (hasImages && selectedImages.size === 0) || (!hasImages && !hasVideo)}
              className="h-11 text-base font-medium px-8"
            >
              {isApproving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve & Continue
                  
                </>

              )}
            </Button>
            {hasImages && selectedImages.size === 0 && (
                    <span className="text-sm text-muted-foreground">
                      Please select at least one image to approve
                    </span>
                  )}
            
            {/* Publish to eBay Button */}
            <Button
              onClick={handlePublishToEbay}
              disabled={isPublishingToEbay || (!hasImages && !hasVideo) || publishSuccess}
              variant={publishSuccess ? "outline" : "default"}
              className="h-11 text-base font-medium px-8 mt-2"
            >
              {isPublishingToEbay ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing to eBay...
                </>
              ) : publishSuccess ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Published to eBay!
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Publish to eBay
                </>
              )}
            </Button>
            {publishSuccess && (
              <span className="text-sm text-green-600 font-medium">
                Successfully published to your eBay account!
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

