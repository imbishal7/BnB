export interface User {
  id: number;
  email: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface Media {
  id: number;
  listing_id: number;
  image_urls: string[] | null;
  video_url: string | null;
  created_at: string;
}

export interface PublishedListing {
  id: number;
  listing_id: number;
  ebay_item_id: string;
  ebay_url: string;
  published_at: string;
}

export interface Listing {
  id: number;
  user_id: number;
  title: string;
  description: string;
  category_id: string | null;
  price: number;
  quantity: number;
  condition_id: string | null;
  product_photo_url: string | null;
  target_audience: string | null;
  product_features: string | null;
  video_setting: string | null;
  enriched_description: string | null;
  status: 'draft' | 'generating_media' | 'media_ready' | 'approved' | 'publishing' | 'published' | 'error';
  error_message: string | null;
  created_at: string;
  updated_at: string;
  media: Media | null;
  published_listing: PublishedListing | null;
}

export interface CreateListingData {
  title: string;
  description: string;
  category_id?: string;
  price: number;
  quantity: number;
  condition_id?: string;
  product_photo_url?: string;
  target_audience?: string;
  product_features?: string;
  video_setting?: string;
}

export interface UpdateListingData {
  title?: string;
  description?: string;
  category_id?: string;
  price?: number;
  quantity?: number;
  condition_id?: string;
  product_photo_url?: string;
  target_audience?: string;
  product_features?: string;
  video_setting?: string;
  status?: string;
}
