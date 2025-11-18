"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { approveMedia, generateMedia, getListing } from "@/lib/api";
import { CheckCircle2, RefreshCw, Image as ImageIcon, Video, ArrowLeft, Loader2, Check, Download } from "lucide-react";
import '@/app/assets/hero_background.css';
interface ListingData {
  id: string;
  title: string;
  description: string;
  status: string;
  media?: {
    image_urls?: string[];
    video_url?: string;
  };
}

export default function MediaReviewPage() {
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as string;

  const [listing, setListing] = useState<ListingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isRegeneratingImages, setIsRegeneratingImages] = useState(false);
  const [isRegeneratingVideo, setIsRegeneratingVideo] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (listingId) {
      fetchListing();
    }
  }, [listingId]);

  // Poll for media generation status
  useEffect(() => {
    if (!listing || listing.status !== "generating_media") {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const data = await getListing(listingId);
        setListing(data as ListingData);
        
        // Stop polling when media is ready or error occurs
        if (data.status === "media_ready" || data.status === "error") {
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error("Polling error:", err);
        // Continue polling even on error
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [listing?.status, listingId]);

  const fetchListing = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getListing(listingId);
      setListing(data as ListingData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load listing"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setIsApproving(true);
      setError(null);
      const selectedImageIndices = Array.from(selectedImages);
      // await approveMedia(listingId, selectedImageIndices);
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
      setSelectedImages(new Set());
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
  const isGenerating = listing.status === "generating_media";

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

        {/* Generating Media State */}
        {isGenerating && (
          <Card className="rounded-xl border bg-card shadow-sm mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12 gap-6">
                <div className="relative">
                  <Loader2 className="h-16 w-16 animate-spin text-primary" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-12 w-12 rounded-full bg-primary/20 animate-pulse"></div>
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold">Generating Your Media</h3>
                  <p className="text-muted-foreground max-w-md">
                    Our AI is creating amazing images and videos for your product. 
                    This may take a few minutes. Please wait...
                  </p>
                  <p className="text-sm text-muted-foreground/80 mt-4">
                    ⏱️ Estimated time: 2-5 minutes
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span>Processing...</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Media Display Section - Only show when not generating */}
        {!isGenerating && (
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
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

