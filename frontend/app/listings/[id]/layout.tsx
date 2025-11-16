"use client";

import { usePathname } from "next/navigation";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function ListingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const listingId = params.id as string;

  // Determine current step
  const isPreviewPage = pathname?.includes("/preview");
  const isMediaReviewPage = pathname?.includes("/media-review");

  // Step 1: Media Review
  // - Active when on media-review page
  // - Completed when on preview page (moved past it)
  const step1Active = isMediaReviewPage;
  const step1Completed = isPreviewPage;
  const step1Filled = step1Active || step1Completed;

  // Step 2: Preview
  // - Active when on preview page
  const step2Active = isPreviewPage;
  const step2Filled = step2Active;

  return (
    <div className="min-h-screen bg-background">
      {/* Progress Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-center">
            <div className="flex items-center gap-4">
              {/* Step 1: Media Review */}
              <Link
                href={`/listings/${listingId}/media-review`}
                className="flex items-center gap-2"
              >
                <div className="relative flex items-center justify-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                      step1Filled
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/30 bg-background text-muted-foreground"
                    }`}
                  >
                    <span className="text-sm font-semibold">1</span>
                  </div>
                </div>
              </Link>

              {/* Connecting Line */}
              <div className="relative h-1 w-24 sm:w-32">
                <div className="absolute h-full w-full bg-muted-foreground/20 rounded-full" />
                <div
                  className={`absolute h-full rounded-full transition-all duration-300 ${
                    step1Completed
                      ? "w-full bg-primary"
                      : "w-0 bg-muted-foreground/20"
                  }`}
                />
              </div>

              {/* Step 2: Preview */}
              <Link
                href={`/listings/${listingId}/preview`}
                className="flex items-center gap-2"
              >
                <div className="relative flex items-center justify-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                      step2Filled
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/30 bg-background text-muted-foreground"
                    }`}
                  >
                    <span className="text-sm font-semibold">2</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      {children}
    </div>
  );
}

