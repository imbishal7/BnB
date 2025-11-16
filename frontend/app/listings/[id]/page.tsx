'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Listing } from '@/lib/types';

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const listingId = parseInt(resolvedParams.id);
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
    // Poll for updates if publishing
    const interval = setInterval(() => {
      if (listing?.status === 'publishing') {
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

  const handlePublish = async () => {
    setPublishing(true);
    setError('');
    try {
      const updated = await apiClient.publishListing(listingId);
      setListing(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish listing');
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    setError('');
    try {
      await apiClient.deleteListing(listingId);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete listing');
      setDeleting(false);
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
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{listing.title}</h1>
              <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                listing.status === 'published' ? 'bg-green-200 text-green-900' :
                listing.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {listing.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-right mr-4">
                <div className="text-2xl font-bold text-gray-900">${listing.price.toFixed(2)}</div>
                <div className="text-sm text-gray-500">Qty: {listing.quantity}</div>
              </div>
              <Link
                href={`/listings/${listingId}/edit`}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm font-medium"
              >
                Edit
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
              <p className="text-gray-700">{listing.description}</p>
            </div>

            {listing.enriched_description && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">AI-Enhanced Description</h2>
                <p className="text-gray-700 bg-blue-50 p-4 rounded-lg border border-blue-100">
                  {listing.enriched_description}
                </p>
              </div>
            )}

            {/* Generated Media Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Generated Media</h2>
              
              {listing.media ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Generated Images */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">AI-Generated Image</h3>
                    {listing.media.image_urls && listing.media.image_urls.length > 0 ? (
                      <div className="space-y-2">
                        {listing.media.image_urls.map((url, idx) => (
                          <img
                            key={idx}
                            src={url}
                            alt={`Product image ${idx + 1}`}
                            className="w-full rounded-lg shadow-md border border-gray-200"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                        <div className="text-center text-gray-500">
                          <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm">No image generated yet</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Generated Video */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">AI-Generated Video</h3>
                    {listing.media.video_url ? (
                      <video
                        src={listing.media.video_url}
                        controls
                        className="w-full rounded-lg shadow-md border border-gray-200"
                      />
                    ) : (
                      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                        <div className="text-center text-gray-500">
                          <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm">No video generated yet</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                  </svg>
                  <p className="text-gray-600 mb-4">No media generated yet</p>
                  <Link
                    href={`/listings/${listingId}/media-review`}
                    className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Generate AI Content
                  </Link>
                </div>
              )}
            </div>

            {listing.status === 'approved' && (
              <div className="pt-6 border-t border-gray-200">
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {publishing ? 'Publishing to eBay...' : 'Publish to eBay'}
                </button>
              </div>
            )}

            {listing.status === 'publishing' && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
                <div className="flex items-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <div>
                    <p className="font-medium">Publishing to eBay...</p>
                    <p className="text-sm">This may take a moment.</p>
                  </div>
                </div>
              </div>
            )}

            {listing.published_listing && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-green-900 mb-4">Published on eBay</h2>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-green-700">Item ID:</span>
                    <span className="ml-2 text-sm text-green-900">{listing.published_listing.ebay_item_id}</span>
                  </div>
                  <div>
                    <a
                      href={listing.published_listing.ebay_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View on eBay →
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
