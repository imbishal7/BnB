# Backend API Requirements for Preview Page

This document outlines the data fields that the backend API (`GET /listings/{id}`) should return to populate the preview page.

## Required API Response Structure

The `GET /listings/{id}` endpoint should return a JSON object with the following fields:

### Core Product Information

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `id` | string | Yes | Listing ID | `"123"` |
| `title` | string | Yes | Product title | `"Vintage Canon AE-1 35mm Film Camera"` |
| `description` | string | Yes | Product description | `"Beautiful vintage camera..."` |
| `enriched_description` | string | No | AI-enriched description (used if available) | `"Enhanced description..."` |
| `status` | string | Yes | Listing status | `"published"`, `"draft"`, `"media_ready"` |

### Pricing & Inventory

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `price` | number | Yes | Current selling price | `299.99` |
| `list_price` | number | No | Original/list price (for showing discounts) | `450.00` |
| `original_price` | number | No | Alternative field for list price | `450.00` |
| `currency` | string | No | Currency code (defaults to "USD") | `"USD"` |
| `quantity` | number | Yes | Total quantity available | `5` |
| `available_quantity` | number | No | Available quantity (defaults to quantity) | `3` |

### Media

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `image_urls` | string[] | Yes | Array of image URLs | `["https://...", "https://..."]` |
| `images` | string[] | No | Alternative field for image URLs | `["https://..."]` |
| `video_url` | string | No | Video URL if available | `"https://..."` |

### Condition

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `condition_id` | string | Yes | eBay condition ID | `"7000"` |
| `condition` | string | No | Alternative field for condition ID | `"7000"` |
| `condition_label` | string | No | Human-readable condition label | `"Excellent - Used"` |
| `condition_notes` | string[] | No | Detailed condition notes | `["Light meter working...", "..."]` |

### Shipping & Delivery

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `shipping_cost` | number | No | Shipping cost (0 for free) | `0` |
| `shipping_method` | string | No | Shipping method description | `"FREE Standard Shipping"` |
| `shipping` | object | No | Shipping object with nested fields | `{ method: "...", cost: 0 }` |
| `estimated_delivery` | string | No | Estimated delivery date range | `"Estimated Wed, Nov 20 - Mon, Nov 25"` |

### Returns & Policies

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `returns_policy` | string | No | Returns policy description | `"30 days money back"` |
| `returns_accepted` | boolean | No | Whether returns are accepted | `true` |
| `returns` | object | No | Returns object with nested fields | `{ policy: "...", accepted: true }` |

### Payment Methods

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `payment_methods` | string[] | No | Accepted payment methods | `["Visa", "Mastercard", "PayPal"]` |
| `paymentMethods` | string[] | No | Alternative camelCase field | `["Visa", "Mastercard"]` |

### Location

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `location_city` | string | No | Seller's city | `"Brooklyn"` |
| `location_state` | string | No | Seller's state | `"New York"` |
| `location_country` | string | No | Seller's country | `"United States"` |
| `location` | object | No | Location object with nested fields | `{ city: "...", state: "...", country: "..." }` |

### Seller Information

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `seller_name` | string | No | Seller's name/username | `"VintageSeller"` |
| `seller_rating` | number | No | Seller's rating percentage | `98.5` |
| `seller_total_ratings` | number | No | Total number of ratings | `2431` |
| `seller_avatar` | string | No | Seller avatar/initials | `"VS"` |
| `seller` | object | No | Seller object with nested fields | `{ name: "...", rating: 98.5, ... }` |

### Additional Details

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `whats_included` | string[] | No | List of items included | `["Camera body", "Lens", ...]` |
| `whatsIncluded` | string[] | No | Alternative camelCase field | `["Camera body", ...]` |
| `category` | string | No | Category name | `"Cameras & Photo"` |
| `category_name` | string | No | Alternative field for category | `"Cameras & Photo"` |
| `category_id` | string | No | Category ID | `"625"` |
| `badge` | string | No | Badge text (e.g., "New", "Sale") | `"New"` |

## Example API Response

```json
{
  "id": "123",
  "title": "Vintage Canon AE-1 35mm Film Camera",
  "description": "Beautiful vintage Canon AE-1 35mm film camera in excellent working condition...",
  "enriched_description": "Enhanced description with AI improvements...",
  "status": "published",
  "price": 299.99,
  "list_price": 450.00,
  "currency": "USD",
  "quantity": 5,
  "available_quantity": 5,
  "condition_id": "7000",
  "condition_label": "Excellent - Used",
  "image_urls": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg",
    "https://example.com/image3.jpg"
  ],
  "video_url": "https://example.com/video.mp4",
  "shipping_cost": 0,
  "shipping_method": "FREE Standard Shipping",
  "estimated_delivery": "Estimated Wed, Nov 20 - Mon, Nov 25",
  "returns_policy": "30 days money back",
  "returns_accepted": true,
  "payment_methods": ["Visa", "Mastercard", "PayPal"],
  "location_city": "Brooklyn",
  "location_state": "New York",
  "location_country": "United States",
  "seller_name": "VintageSeller",
  "seller_rating": 98.5,
  "seller_total_ratings": 2431,
  "seller_avatar": "VS",
  "whats_included": [
    "Canon AE-1 camera body",
    "Canon FD 50mm f/1.8 lens",
    "Original lens cap",
    "Camera strap",
    "Batteries included"
  ],
  "condition_notes": [
    "Light meter working perfectly",
    "All shutter speeds accurate",
    "Clean viewfinder with no fungus or haze",
    "Minor cosmetic wear consistent with age",
    "Film advance mechanism smooth"
  ],
  "category": "Cameras & Photo",
  "category_id": "625",
  "badge": "New"
}
```

## Notes

1. **Fallback Values**: The frontend uses default values from `defaultListingInformation` if fields are missing from the API response.

2. **Field Aliases**: Many fields have alternative names (e.g., `list_price` and `original_price`) to support different API response formats.

3. **Nested Objects**: Some fields can be provided as nested objects (e.g., `shipping`, `returns`, `location`, `seller`) or as flat fields (e.g., `shipping_method`, `returns_policy`).

4. **Condition Mapping**: If `condition_label` is not provided, the frontend will map `condition_id` to a human-readable label using a predefined mapping.

5. **Status-Based Badges**: If `badge` is not provided, the frontend may derive it from the `status` field (e.g., "published" → "New").

## Minimum Required Fields

For the preview page to function, the API must return at minimum:
- `id`
- `title`
- `description`
- `price`
- `quantity`
- `condition_id` or `condition`
- `image_urls` or `images`
- `status`

All other fields are optional and will use defaults if not provided.


