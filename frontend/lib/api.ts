const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface CreateListingRequest {
  title: string;
  description: string;
  category_id?: string;
  category?: string;
  price: number;
  quantity: number;
  condition_id?: string;
  condition?: string;
  image_prompt?: string;
  video_prompt?: string;
}

export interface ListingResponse {
  id: string;
  title: string;
  description: string;
  status: string;
  [key: string]: unknown;
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
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function createListing(data: CreateListingRequest): Promise<ListingResponse> {
  return apiRequest<ListingResponse>('/listings', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

