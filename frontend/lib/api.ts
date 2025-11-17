const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Auth interfaces
export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  id: number;
  email: string;
  created_at: string;
}

// Listing interfaces
export interface CreateListingRequest {
  title: string;
  description: string;
  category_id?: string;
  price: number;
  quantity: number;
  condition_id?: string;
  product_photo_url?: string;
  uploaded_image_urls?: string[];
  target_audience?: string;
  product_features?: string;
  video_setting?: string;
}

export interface ListingResponse {
  id: string;
  user_id: number;
  title: string;
  description: string;
  category_id?: string;
  price: number;
  quantity: number;
  condition_id?: string;
  product_photo_url?: string;
  uploaded_image_urls?: string[];
  target_audience?: string;
  product_features?: string;
  video_setting?: string;
  enriched_description?: string;
  status: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
  media?: {
    id: number;
    listing_id: string;
    image_urls?: string[];
    video_url?: string;
    created_at: string;
  };
  published_listing?: {
    id: number;
    listing_id: string;
    ebay_item_id: string;
    ebay_url: string;
    published_at: string;
  };
}

export interface UploadResponse {
  urls: string[];
  count: number;
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    // FastAPI returns errors in 'detail' field
    throw new Error(error.detail || error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Auth API functions
export async function register(data: RegisterRequest): Promise<UserResponse> {
  return apiRequest<UserResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  // Store token in localStorage
  if (typeof window !== 'undefined' && response.access_token) {
    localStorage.setItem('auth_token', response.access_token);
  }
  
  return response;
}

export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
}

export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

// Listing API functions
export async function createListing(data: CreateListingRequest): Promise<ListingResponse> {
  return apiRequest<ListingResponse>('/listings', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getListing(id: string | number): Promise<ListingResponse> {
  return apiRequest<ListingResponse>(`/listings/${id}`);
}

export async function getAllListings(): Promise<ListingResponse[]> {
  return apiRequest<ListingResponse[]>('/listings');
}

export async function approveMedia(id: string | number, selectedImageIndices?: number[]): Promise<ListingResponse> {
  const body = selectedImageIndices ? { selected_image_indices: selectedImageIndices } : {};
  return apiRequest<ListingResponse>(`/listings/${id}/approve-media`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function generateMedia(id: string | number, mediaType?: 'images' | 'video'): Promise<ListingResponse> {
  const body = mediaType ? { media_type: mediaType } : {};
  return apiRequest<ListingResponse>(`/listings/${id}/generate-media`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateListing(id: string | number, data: Partial<CreateListingRequest>): Promise<ListingResponse> {
  return apiRequest<ListingResponse>(`/listings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteListing(id: string | number): Promise<void> {
  return apiRequest<void>(`/listings/${id}`, {
    method: 'DELETE',
  });
}

// Upload API functions
export async function uploadImages(files: File[]): Promise<UploadResponse> {
  const token = getAuthToken();
  const formData = new FormData();
  
  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await fetch(`${API_BASE_URL}/upload/images`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(error.detail || error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}
