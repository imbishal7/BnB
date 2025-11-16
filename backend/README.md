# BnB Backend

FastAPI backend for the Brand in Box (BnB) marketplace listing platform.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Edit `.env` and set your configuration values, especially:
   - `SECRET_KEY` (generate a secure random string)
   - `N8N_MEDIA_GENERATION_WEBHOOK` (your n8n webhook URL)
   - `N8N_EBAY_PUBLISH_WEBHOOK` (your n8n webhook URL)

5. Run the application:
```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

## API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Project Structure

```
backend/
├── api/                    # API endpoints
│   ├── auth.py            # Authentication endpoints
│   ├── listings.py        # Listing CRUD endpoints
│   ├── webhooks.py        # n8n webhook callbacks
│   ├── schemas.py         # Auth schemas
│   ├── listing_schemas.py # Listing schemas
│   └── webhook_schemas.py # Webhook schemas
├── core/                   # Core configuration
│   ├── config.py          # Settings and configuration
│   ├── database.py        # Database connection
│   └── security.py        # JWT and password hashing
├── models/                 # Database models
│   └── models.py          # SQLAlchemy models
├── services/               # External integrations
│   └── n8n_client.py      # n8n webhook client
├── main.py                # FastAPI application
├── requirements.txt       # Python dependencies
└── .env.example          # Environment variables template
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token

### Listings
- `POST /listings` - Create new listing
- `GET /listings` - Get all user listings
- `GET /listings/{id}` - Get specific listing
- `PATCH /listings/{id}` - Update listing
- `POST /listings/{id}/generate-media` - Trigger AI media generation
- `POST /listings/{id}/approve-media` - Approve generated media
- `POST /listings/{id}/publish` - Publish to eBay

### Webhooks (for n8n callbacks)
- `POST /webhooks/media-complete` - Media generation completion
- `POST /webhooks/ebay-complete` - eBay publishing completion

## n8n Integration

### Media Generation Workflow (UGC Ads)
The n8n workflow generates UGC-style product images and videos. It should:

1. Receive webhook POST with payload:
```json
{
  "listing_id": 123,
  "Product": "Water Bottle",
  "Product Photo": "https://example.com/product.jpg",
  "ICP": "Young male athlete",
  "Product Features": "Keeps drinks cold for 24 hours",
  "Video Setting": "A cyclist with water bottle",
  "callback_url": "http://your-backend.com/webhooks/media-complete"
}
```

2. Generate UGC image using AI (Nano + prompt generation)
3. Analyze the generated image
4. Generate UGC video using AI (Veo 3.1)
5. POST results to `callback_url` with schema:
```json
{
  "listing_id": 123,
  "status": "success",
  "product": "Water Bottle",
  "model": "Nano + Veo 3.1",
  "assets": {
    "image_url": "https://generated-image-url.png",
    "video_url": "https://generated-video-url.mp4"
  },
  "prompts": {
    "image_prompt": "Generated image prompt...",
    "video_prompt": "Generated video prompt..."
  }
}
```

On error:
```json
{
  "listing_id": 123,
  "status": "error",
  "error_message": "Description of what went wrong"
}
```

### eBay Publishing Workflow
The workflow should:
1. Receive webhook with listing details and `callback_url`
2. Call eBay Trading API `AddFixedPriceItem`
3. POST results to `callback_url` with schema:
```json
{
  "listing_id": 123,
  "ebay_item_id": "123456789",
  "ebay_url": "https://www.ebay.com/itm/123456789",
  "success": true
}
```

## Development

Generate a secure secret key:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Database

The application uses SQLite by default. The database file `bnb.db` will be created automatically on first run.

For production, update `DATABASE_URL` in `.env` to use PostgreSQL:
```
DATABASE_URL=postgresql://user:password@localhost/bnb
```
