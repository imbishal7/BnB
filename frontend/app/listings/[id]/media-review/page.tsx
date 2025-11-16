'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Listing } from '@/lib/types';

export default function MediaReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const listingId = parseInt(resolvedParams.id);
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // Validate listing ID
  if (isNaN(listingId)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-red-600 mb-4">Invalid listing ID</div>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadListing();
    // Poll for updates if media is being generated
    const interval = setInterval(() => {
      if (listing?.status === 'generating_media') {
        loadListing();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [listingId, listing?.status]);

  const loadListing = async () => {
    try {
      const data = await apiClient.getListing(listingId);
      setListing(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load listing');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMedia = async () => {
    setActionLoading(true);
    setError('');
    try {
      const updated = await apiClient.generateMedia(listingId);
      setListing(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate media');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveMedia = async () => {
    setActionLoading(true);
    setError('');
    try {
      const updated = await apiClient.approveMedia(listingId);
      setListing(updated);
      router.push(`/listings/${listingId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve media');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">Listing not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{listing.title}</h1>
          <p className="text-gray-600 mb-6">{listing.description}</p>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {listing.status === 'draft' && (
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4">
                <p className="font-medium">Ready to generate AI media?</p>
                <p className="text-sm mt-1">
                  This will create UGC-style images and video for your product using the n8n workflow.
                </p>
              </div>
              <button
                onClick={handleGenerateMedia}
                disabled={actionLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Generating...' : 'Generate Media'}
              </button>
            </div>
          )}

          {listing.status === 'generating_media' && (
            <div className="mb-6">
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
                <div className="flex items-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <div>
                    <p className="font-medium">Generating media...</p>
                    <p className="text-sm">This may take a few minutes. The page will update automatically.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {listing.media && (listing.status === 'media_ready' || listing.status === 'approved') && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated Media</h2>
                
                {listing.media.image_urls && listing.media.image_urls.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Generated Image</h3>
                    <div className="grid gap-4">
                      {listing.media.image_urls.map((url, index) => (
                        <div key={index} className="relative">
                          <img
                            src={url}
                            alt={`Generated image ${index + 1}`}
                            className="w-full h-auto rounded-lg shadow-md"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {listing.media.video_url && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Generated Video</h3>
                    <video
                      src={listing.media.video_url}
                      controls
                      className="w-full max-w-2xl rounded-lg shadow-md"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}
              </div>

              {listing.status === 'media_ready' && (
                <div className="flex space-x-4">
                  <button
                    onClick={handleApproveMedia}
                    disabled={actionLoading}
                    className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? 'Approving...' : 'Approve Media'}
                  </button>
                  <button
                    onClick={handleGenerateMedia}
                    disabled={actionLoading}
                    className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Regenerate
                  </button>
                </div>
              )}

              {listing.status === 'approved' && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                  <p className="font-medium">Media approved!</p>
                  <p className="text-sm mt-1">
                    <Link href={`/listings/${listingId}`} className="underline">
                      Continue to publish your listing
                    </Link>
                  </p>
                </div>
              )}
            </div>
          )}

          {listing.error_message && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <p className="font-medium">Error:</p>
              <p className="text-sm mt-1">{listing.error_message}</p>
              <button
                onClick={handleGenerateMedia}
                disabled={actionLoading}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
