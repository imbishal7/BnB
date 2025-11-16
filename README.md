# BnB - Brand in Box

AI-powered marketplace listing platform that generates UGC-style product images and videos, then publishes directly to eBay.

## 🎯 Overview

BnB enables vendors to create complete e-commerce listings with minimal effort using AI-generated media and automated publishing workflows. The system uses n8n to orchestrate AI image/video generation and eBay marketplace integration.

## 🏗️ Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Next.js   │ ───> │   FastAPI   │ ───> │     n8n     │ ───> │  AI APIs    │
│  Frontend   │      │   Backend   │      │  Workflows  │      │  eBay API   │
└─────────────┘      └─────────────┘      └─────────────┘      └─────────────┘
```

### Components

- **Frontend**: Next.js 16 + React 19 + TypeScript + Tailwind CSS
- **Backend**: FastAPI + SQLAlchemy + SQLite/PostgreSQL
- **Automation**: n8n workflows for AI generation and eBay publishing
- **AI Models**: Nano (images), Veo 3.1 (videos)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or Bun
- Python 3.9+
- n8n instance (self-hosted or cloud)

### 1. Backend Setup

```bash
cd backend
./setup.sh
source venv/bin/activate

# Update .env with your n8n webhook URL
# N8N_MEDIA_GENERATION_WEBHOOK=https://your-n8n.app.n8n.cloud/webhook/ugc-generate

uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`

### 2. Frontend Setup

```bash
cd frontend
npm install  # or bun install
npm run dev
```

Frontend runs at `http://localhost:3000`

### 3. n8n Workflow Setup

Import the `n8n.json` workflow and configure:
1. Set webhook URL in backend `.env`
2. Configure callback URL to `http://your-backend:8000/webhooks/media-complete`
3. Add your AI API credentials in n8n

## 📱 User Flow

1. **Register/Login** → JWT authentication
2. **Create Listing** → Product details + UGC settings
   - Product photo URL
   - Target audience (ICP)
   - Product features
   - Video setting/scene
3. **Generate Media** → Triggers n8n workflow
   - AI generates UGC-style image
   - AI generates UGC-style video
4. **Review & Approve** → View generated media
5. **Publish to eBay** → Automated listing creation
6. **View Published** → eBay ItemID and URL

## 🔑 Key Features

- **AI Media Generation**: Authentic UGC-style images and videos
- **n8n Automation**: Visual workflow orchestration
- **eBay Integration**: Direct marketplace publishing
- **Real-time Updates**: Status polling for async operations
- **Simple UX**: Minimal clicks, clean forms

## 📂 Project Structure

```
BnB/
├── backend/              # FastAPI backend
│   ├── api/             # Endpoints (auth, listings, webhooks)
│   ├── core/            # Config, database, security
│   ├── models/          # SQLAlchemy models
│   ├── services/        # n8n client
│   └── main.py          # FastAPI app
├── frontend/            # Next.js frontend
│   ├── app/             # Pages (App Router)
│   └── lib/             # API client, types
├── n8n.json            # n8n workflow export
└── README.md           # This file
```

## 🔧 Configuration

### Backend (.env)
```env
DATABASE_URL=sqlite:///./bnb.db
SECRET_KEY=your-secret-key
N8N_MEDIA_GENERATION_WEBHOOK=https://n8n.../webhook/ugc-generate
N8N_EBAY_PUBLISH_WEBHOOK=https://n8n.../webhook/ebay-publish
BACKEND_URL=http://localhost:8000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📊 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - Get JWT token

### Listings
- `POST /listings` - Create listing
- `GET /listings` - Get all user listings
- `GET /listings/{id}` - Get specific listing
- `POST /listings/{id}/generate-media` - Trigger n8n workflow
- `POST /listings/{id}/approve-media` - Approve media
- `POST /listings/{id}/publish` - Publish to eBay

### Webhooks (n8n callbacks)
- `POST /webhooks/media-complete` - Media generation result
- `POST /webhooks/ebay-complete` - eBay publish result

## 🎨 n8n Workflow

The UGC media generation workflow:

1. **Webhook Trigger** - Receives product data
2. **Image Prompt** - AI generates image prompt
3. **Nano Image** - Generates UGC-style image
4. **Image Analysis** - Describes generated image
5. **Video Prompt** - AI generates video prompt
6. **Veo Video** - Generates UGC-style video
7. **Callback** - Returns results to backend

## 🧪 Testing

### Test the backend:
```bash
cd backend
# See API_EXAMPLES.md for curl commands
```

### Test the frontend:
```bash
cd frontend
npm run build
npm start
```

## 🚢 Deployment

### Backend
- Deploy to Render, Railway, or any VPS
- Use PostgreSQL for production
- Set environment variables

### Frontend
- Deploy to Vercel
- Set `NEXT_PUBLIC_API_URL` environment variable

### n8n
- Use n8n Cloud or self-host with Docker
- Configure webhook URLs to production backend

## 📝 License

MIT License - See LICENSE file

## 🤝 Contributing

This is a hackathon project. Contributions welcome!

## 🏆 Hackathon Notes

Built for rapid MVP development with:
- SQLite for quick setup (migrate to PostgreSQL later)
- n8n for visual workflow debugging
- Minimal UI for speed
- JWT for simple auth (no OAuth yet)