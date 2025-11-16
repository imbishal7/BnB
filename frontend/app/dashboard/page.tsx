'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Listing } from '@/lib/types';

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  generating_media: 'bg-yellow-100 text-yellow-800',
  media_ready: 'bg-green-100 text-green-800',
  approved: 'bg-blue-100 text-blue-800',
  publishing: 'bg-purple-100 text-purple-800',
  published: 'bg-green-200 text-green-900',
  error: 'bg-red-100 text-red-800',
};

const statusLabels = {
  draft: 'Draft',
  generating_media: 'Generating Media',
  media_ready: 'Media Ready',
  approved: 'Approved',
  publishing: 'Publishing',
  published: 'Published',
  error: 'Error',
};

export default function DashboardPage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    try {
      const data = await apiClient.getListings();
      setListings(data);
    } catch (err) {
      if (err instanceof Error && err.message.includes('401')) {
        router.push('/login');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load listings');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    apiClient.logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">BnB Dashboard</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Your Listings</h2>
            <Link
              href="/listings/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create New Listing
            </Link>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {listings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500 text-lg mb-4">No listings yet</p>
              <Link
                href="/listings/new"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Create Your First Listing
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    if (listing.status === 'media_ready') {
                      router.push(`/listings/${listing.id}/media-review`);
                    } else if (listing.status === 'published') {
                      router.push(`/listings/${listing.id}`);
                    } else {
                      router.push(`/listings/${listing.id}`);
                    }
                  }}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">
                        {listing.title}
                      </h3>
                      <span
                        className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                          statusColors[listing.status]
                        }`}
                      >
                        {statusLabels[listing.status]}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {listing.description}
                    </p>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Price:</span>
                      <span className="text-gray-900 font-semibold">
                        ${listing.price.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm mt-2">
                      <span className="text-gray-500">Quantity:</span>
                      <span className="text-gray-900">{listing.quantity}</span>
                    </div>

                    {listing.error_message && (
                      <div className="mt-4 text-sm text-red-600">
                        Error: {listing.error_message}
                      </div>
                    )}

                    {listing.published_listing && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <a
                          href={listing.published_listing.ebay_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View on eBay →
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
