'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { CreateListingData } from '@/lib/types';

export default function NewListingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<CreateListingData>({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const listing = await apiClient.createListing(formData);
      console.log('Created listing:', listing);
      
      if (!listing || !listing.id) {
        throw new Error('Invalid listing response - missing ID');
      }
      
      router.push(`/listings/${listing.id}`);
    } catch (err) {
      console.error('Failed to create listing:', err);
      setError(err instanceof Error ? err.message : 'Failed to create listing');
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Listing</h1>

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
                    placeholder="e.g., Premium Insulated Water Bottle"
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
                    placeholder="Describe your product..."
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
                      placeholder="e.g., 158963"
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
                      <option value="3000">Used</option>
                      <option value="4000">Very Good</option>
                      <option value="5000">Good</option>
                      <option value="6000">Acceptable</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* UGC Media Generation Settings */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Media Generation</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="product_photo_url" className="block text-sm font-medium text-gray-700">
                    Product Photo URL *
                  </label>
                  <input
                    type="url"
                    id="product_photo_url"
                    name="product_photo_url"
                    required
                    value={formData.product_photo_url}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://example.com/product-image.jpg"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Reference image for AI generation
                  </p>
                </div>

                <div>
                  <label htmlFor="target_audience" className="block text-sm font-medium text-gray-700">
                    Target Audience (ICP)
                  </label>
                  <input
                    type="text"
                    id="target_audience"
                    name="target_audience"
                    value={formData.target_audience}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Young athletes, fitness enthusiasts"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Who is your ideal customer?
                  </p>
                </div>

                <div>
                  <label htmlFor="product_features" className="block text-sm font-medium text-gray-700">
                    Key Product Features
                  </label>
                  <textarea
                    id="product_features"
                    name="product_features"
                    rows={3}
                    value={formData.product_features}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Keeps drinks cold for 24 hours, leak-proof design, BPA-free"
                  />
                </div>

                <div>
                  <label htmlFor="video_setting" className="block text-sm font-medium text-gray-700">
                    Video Setting / Scene
                  </label>
                  <input
                    type="text"
                    id="video_setting"
                    name="video_setting"
                    value={formData.video_setting}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Gym workout, outdoor hiking, office desk"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Describe the scene for the UGC video
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Link
                href="/dashboard"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Listing'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
