import { StaticImageData } from 'next/image';
import generated_image_1 from '@/app/assets/generated_image_1.png';

export interface ListingInformation {
  // Basic Product Info
  title: string;
  description: string;
  condition: string;
  conditionLabel: string; // e.g., "Excellent - Used"
  enrichedDescription: string;
  // Pricing
  price: number;
  listPrice?: number; // Optional original/list price for showing discounts
  currency?: string; // Default: "USD"
  
  // Inventory
  quantity: number;
  availableQuantity: number; // How many are available to purchase
  
  // Media
  images: StaticImageData[] | string[];
  videoUrl?: string;
  
  // Shipping & Delivery
  shipping: {
    cost: number; // 0 for free shipping
    method: string; // e.g., "FREE Standard Shipping"
    estimatedDelivery?: string; // e.g., "Estimated Wed, Nov 20 - Mon, Nov 25"
  };
  
  // Returns & Policies
  returns: {
    policy: string; // e.g., "30 days money back"
    accepted: boolean;
  };
  
  // Payment Methods
  paymentMethods: string[]; // e.g., ["Visa", "Mastercard", "PayPal"]
  
  // Location
  location: {
    city: string;
    state: string;
    country: string;
  };
  
  // Seller Information
  seller: {
    name: string;
    rating: number; // e.g., 98.5
    totalRatings: number; // e.g., 2431
    avatar?: string; // Optional avatar/initials
  };
  
  // Additional Details
  whatsIncluded?: string[]; // List of items included
  conditionNotes?: string[]; // Detailed condition notes
  category?: string;
  categoryId?: string;
  
  // Status
  status: string; // e.g., "published", "draft", etc.
  badge?: string; // e.g., "New", "Sale", etc.
}

// Default/mock data structure - this will be replaced with API data
export const defaultListingInformation: ListingInformation = {
  title: "Vintage Canon AE-1 35mm Film Camera",
  description: `Beautiful vintage Canon AE-1 35mm film camera in excellent working condition. This classic camera has been professionally tested and is ready to shoot. The AE-1 was one of the most popular 35mm SLR cameras ever made, known for its reliability and ease of use.

Perfect for film photography enthusiasts, students, or collectors. This camera will ship carefully packaged with tracking information provided.`,
  condition: "7000", // Condition ID
  conditionLabel: "Excellent - Used",
  price: 299.99,
  listPrice: 450.00,
  currency: "USD",
  quantity: 5,
  availableQuantity: 5,
  images: [
    generated_image_1,
    generated_image_1,
    generated_image_1,
    generated_image_1,
    generated_image_1,
  ],
  shipping: {
    cost: 0,
    method: "FREE Standard Shipping",
    estimatedDelivery: "Estimated Wed, Nov 20 - Mon, Nov 25",
  },
  returns: {
    policy: "30 days money back",
    accepted: true,
  },
  paymentMethods: ["Visa", "Mastercard", "PayPal"],
  location: {
    city: "Brooklyn",
    state: "New York",
    country: "United States",
  },
  seller: {
    name: "VintageSeller",
    rating: 98.5,
    totalRatings: 2431,
    avatar: "VS",
  },
  whatsIncluded: [
    "Canon AE-1 camera body",
    "Canon FD 50mm f/1.8 lens",
    "Original lens cap",
    "Camera strap",
    "Batteries included",
  ],
  conditionNotes: [
    "Light meter working perfectly",
    "All shutter speeds accurate",
    "Clean viewfinder with no fungus or haze",
    "Minor cosmetic wear consistent with age",
    "Film advance mechanism smooth",
  ],
  status: "published",
  badge: "New",
};

/**
 * Transforms API response data to ListingInformation format
 * This function maps backend API fields to the frontend data structure
 */
export function transformApiDataToListingInfo(apiData: any): ListingInformation {
  // Map API response to ListingInformation
  // If API doesn't provide certain fields, use defaults from defaultListingInformation
  
  const parseNumber = (value: number | string | undefined, fallback: number) => {
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      const parsed = parseFloat(value)
      return isNaN(parsed) ? fallback : parsed
    }
    return fallback
  }

  const imageSources =
    apiData.media?.image_urls ||
    apiData.image_urls ||
    apiData.images ||
    defaultListingInformation.images

  const videoSource =
    apiData.media?.video_url ||
    apiData.video_url ||
    defaultListingInformation.videoUrl

  const conditionId = apiData.condition_id || apiData.condition || defaultListingInformation.condition
  const derivedConditionLabel =
    apiData.condition_label ||
    getConditionLabel(apiData.condition_id) ||
    (typeof apiData.condition === 'string' ? apiData.condition : null) ||
    defaultListingInformation.conditionLabel

  return {
    title: apiData.title || defaultListingInformation.title,
    description: apiData.description || apiData.enriched_description || defaultListingInformation.description,
    condition: conditionId,
    conditionLabel: derivedConditionLabel,
    price: parseNumber(apiData.price, defaultListingInformation.price),
    listPrice: apiData.list_price || apiData.original_price || defaultListingInformation.listPrice,
    currency: apiData.currency || defaultListingInformation.currency,
    quantity: parseNumber(apiData.quantity, defaultListingInformation.quantity),
    availableQuantity:
      parseNumber(apiData.available_quantity, NaN) ||
      parseNumber(apiData.quantity, defaultListingInformation.availableQuantity),
    images: imageSources,
    videoUrl: videoSource,
    shipping: {
      cost: apiData.shipping_cost !== undefined ? apiData.shipping_cost : defaultListingInformation.shipping.cost,
      method: apiData.shipping_method || apiData.shipping?.method || defaultListingInformation.shipping.method,
      estimatedDelivery: apiData.estimated_delivery || apiData.shipping?.estimated_delivery || defaultListingInformation.shipping.estimatedDelivery,
    },
    returns: {
      policy: apiData.returns_policy || apiData.returns?.policy || defaultListingInformation.returns.policy,
      accepted: apiData.returns_accepted !== undefined ? apiData.returns_accepted : defaultListingInformation.returns.accepted,
    },
    paymentMethods: apiData.payment_methods || apiData.paymentMethods || defaultListingInformation.paymentMethods,
    location: {
      city: apiData.location_city || apiData.location?.city || defaultListingInformation.location.city,
      state: apiData.location_state || apiData.location?.state || defaultListingInformation.location.state,
      country: apiData.location_country || apiData.location?.country || defaultListingInformation.location.country,
    },
    seller: {
      name: apiData.seller_name || apiData.seller?.name || defaultListingInformation.seller.name,
      rating: apiData.seller_rating || apiData.seller?.rating || defaultListingInformation.seller.rating,
      totalRatings: apiData.seller_total_ratings || apiData.seller?.total_ratings || defaultListingInformation.seller.totalRatings,
      avatar: apiData.seller_avatar || apiData.seller?.avatar || defaultListingInformation.seller.avatar,
    },
    whatsIncluded: apiData.whats_included || apiData.whatsIncluded || defaultListingInformation.whatsIncluded,
    conditionNotes: apiData.condition_notes || apiData.conditionNotes || defaultListingInformation.conditionNotes,
    category: apiData.category || apiData.category_name || defaultListingInformation.category,
    categoryId: apiData.category_id || defaultListingInformation.categoryId,
    status: apiData.status || defaultListingInformation.status,
    badge: apiData.badge || getBadgeFromStatus(apiData.status) || defaultListingInformation.badge,
  };
}

/**
 * Helper function to get condition label from condition ID
 */
function getConditionLabel(conditionId: string | undefined): string | null {
  if (!conditionId) return null;
  
  const conditionMap: Record<string, string> = {
    "1000": "New",
    "1500": "New other (see details)",
    "1750": "New with defects",
    "2000": "Certified - Refurbished",
    "2500": "Excellent - Refurbished",
    "3000": "Very Good - Refurbished",
    "4000": "Good - Refurbished",
    "5000": "Seller Refurbished",
    "6000": "Used",
    "7000": "Very Good",
    "8000": "Good",
    "9000": "Acceptable",
    "10000": "For parts or not working",
  };
  
  return conditionMap[conditionId] || null;
}

/**
 * Helper function to determine badge from status
 */
function getBadgeFromStatus(status: string | undefined): string | null {
  if (!status) return null;
  
  if (status === "published") return "New";
  if (status === "draft") return null;
  return null;
}

