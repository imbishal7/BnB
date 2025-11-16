# API Testing Examples

## Authentication

### Register a new user
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "securepassword123"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "securepassword123"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

Save the `access_token` for subsequent requests.

## Listings

### Create a listing
```bash
curl -X POST http://localhost:8000/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "title": "Premium Water Bottle",
    "description": "Insulated stainless steel water bottle",
    "price": 29.99,
    "quantity": 100,
    "category_id": "158963",
    "condition_id": "1000",
    "product_photo_url": "https://example.com/water-bottle.jpg",
    "target_audience": "Young athletes and fitness enthusiasts",
    "product_features": "Keeps drinks cold for 24 hours, leak-proof design, BPA-free",
    "video_setting": "Gym workout scene with athlete using water bottle"
  }'
```

### Get all listings
```bash
curl -X GET http://localhost:8000/listings \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get specific listing
```bash
curl -X GET http://localhost:8000/listings/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Update listing
```bash
curl -X PATCH http://localhost:8000/listings/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "price": 24.99,
    "quantity": 150
  }'
```

### Trigger media generation
```bash
curl -X POST http://localhost:8000/listings/1/generate-media \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

This will trigger the n8n UGC workflow. The workflow will:
1. Generate an AI image based on the product
2. Analyze the image
3. Generate a UGC-style video
4. Call back to `/webhooks/media-complete` with results

### Approve media
```bash
curl -X POST http://localhost:8000/listings/1/approve-media \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Publish to eBay
```bash
curl -X POST http://localhost:8000/listings/1/publish \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Webhooks (n8n callbacks)

### Media generation complete
```bash
curl -X POST http://localhost:8000/webhooks/media-complete \
  -H "Content-Type: application/json" \
  -d '{
    "listing_id": 1,
    "status": "success",
    "product": "Premium Water Bottle",
    "model": "Nano + Veo 3.1",
    "assets": {
      "image_url": "https://cdn.example.com/generated-image.png",
      "video_url": "https://cdn.example.com/generated-video.mp4"
    },
    "prompts": {
      "image_prompt": "A young athlete in gym attire...",
      "video_prompt": "8-second selfie-style video..."
    }
  }'
```

### eBay publish complete
```bash
curl -X POST http://localhost:8000/webhooks/ebay-complete \
  -H "Content-Type: application/json" \
  -d '{
    "listing_id": 1,
    "success": true,
    "ebay_item_id": "123456789012",
    "ebay_url": "https://www.ebay.com/itm/123456789012",
    "fees": {
      "insertion_fee": 0.35,
      "final_value_fee": 0.10
    }
  }'
```

## Full Flow Example

```bash
# 1. Register
TOKEN=$(curl -s -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"vendor@example.com","password":"pass123"}' | jq -r '.access_token')

# 2. Login (if already registered)
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"vendor@example.com","password":"pass123"}' | jq -r '.access_token')

# 3. Create listing
LISTING_ID=$(curl -s -X POST http://localhost:8000/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Premium Water Bottle",
    "description": "Insulated stainless steel water bottle",
    "price": 29.99,
    "quantity": 100,
    "product_photo_url": "https://example.com/bottle.jpg",
    "target_audience": "Fitness enthusiasts",
    "product_features": "24hr cold retention",
    "video_setting": "Gym workout"
  }' | jq -r '.id')

echo "Created listing: $LISTING_ID"

# 4. Generate media
curl -X POST http://localhost:8000/listings/$LISTING_ID/generate-media \
  -H "Authorization: Bearer $TOKEN"

# Wait for n8n callback...

# 5. Check listing status
curl -X GET http://localhost:8000/listings/$LISTING_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.status'

# 6. Approve media (when status is "media_ready")
curl -X POST http://localhost:8000/listings/$LISTING_ID/approve-media \
  -H "Authorization: Bearer $TOKEN"

# 7. Publish to eBay
curl -X POST http://localhost:8000/listings/$LISTING_ID/publish \
  -H "Authorization: Bearer $TOKEN"
```
