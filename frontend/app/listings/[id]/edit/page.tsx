'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Listing, UpdateListingData } from '@/lib/types';

export default function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const listingId = parseInt(resolvedParams.id);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<UpdateListingData>({
    title: '',
    description: '',
    price: 0,
    quantity: 1,
    category_id: '',
    condition_id: '1000',
    product_photo_url: '',
    target_audience: '',
    product_features: '',
    video_setting: '',
  });

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
  }, [listingId]);

  const loadListing = async () => {
    try {
      const listing = await apiClient.getListing(listingId);
      setFormData({
        title: listing.title,
        description: listing.description,
        price: listing.price,
        quantity: listing.quantity,
        category_id: listing.category_id || '',
        condition_id: listing.condition_id || '1000',
        product_photo_url: listing.product_photo_url || '',
        target_audience: listing.target_audience || '',
        product_features: listing.product_features || '',
        video_setting: listing.video_setting || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load listing');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      await apiClient.updateListing(listingId, formData);
      router.push(`/listings/${listingId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update listing');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' || name === 'quantity' ? Number(value) : value,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href={`/listings/${listingId}`} className="text-blue-600 hover:text-blue-800">
            ← Back to Listing
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Listing</h1>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Product Info */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    required
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                      Price ($) *
                    </label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      id="quantity"
                      name="quantity"
                      required
                      min="1"
                      value={formData.quantity}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">
                      Category ID
                    </label>
                    <input
                      type="text"
                      id="category_id"
                      name="category_id"
                      value={formData.category_id}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 267"
                    />
                  </div>

                  <div>
                    <label htmlFor="condition_id" className="block text-sm font-medium text-gray-700">
                      Condition
                    </label>
                    <select
                      id="condition_id"
                      name="condition_id"
                      value={formData.condition_id}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="1000">New</option>
                      <option value="1500">New other</option>
                      <option value="1750">New with defects</option>
                      <option value="2000">Manufacturer refurbished</option>
                      <option value="2500">Seller refurbished</option>
                      <option value="3000">Used</option>
                      <option value="7000">For parts or not working</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Content Generation Fields */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Content Generation</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="product_photo_url" className="block text-sm font-medium text-gray-700">
                    Product Photo URL
                  </label>
                  <input
                    type="url"
                    id="product_photo_url"
                    name="product_photo_url"
                    value={formData.product_photo_url}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://example.com/product-image.jpg"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Reference image for AI to generate content from
                  </p>
                </div>

                <div>
                  <label htmlFor="target_audience" className="block text-sm font-medium text-gray-700">
                    Target Audience
                  </label>
                  <input
                    type="text"
                    id="target_audience"
                    name="target_audience"
                    value={formData.target_audience}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Fitness enthusiasts, outdoor adventurers"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Who is this product for? (Used by AI for content generation)
                  </p>
                </div>

                <div>
                  <label htmlFor="product_features" className="block text-sm font-medium text-gray-700">
                    Product Features
                  </label>
                  <textarea
                    id="product_features"
                    name="product_features"
                    rows={3}
                    value={formData.product_features}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Stainless steel, 32oz capacity, keeps drinks cold for 24hrs"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Key features to highlight in AI-generated content
                  </p>
                </div>

                <div>
                  <label htmlFor="video_setting" className="block text-sm font-medium text-gray-700">
                    Video Setting
                  </label>
                  <input
                    type="text"
                    id="video_setting"
                    name="video_setting"
                    value={formData.video_setting}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Mountain hiking trail, modern kitchen"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Desired setting/background for AI-generated video
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <Link
                href={`/listings/${listingId}`}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
