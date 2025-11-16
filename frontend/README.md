# BnB Frontend

Next.js frontend for the Brand in Box (BnB) marketplace listing platform.

## Features

- User authentication (register/login with JWT)
- Listing management dashboard
- Create listings with UGC media generation settings
- AI-powered image and video generation via n8n workflow
- Media review and approval
- One-click eBay publishing
- Real-time status updates with polling

## Tech Stack

- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Fetch API** - HTTP requests to backend

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Backend API running at `http://localhost:8000`

### Installation

```bash
cd frontend
npm install
# or
bun install
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Development

```bash
npm run dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
frontend/
├── app/                      # Next.js App Router
│   ├── page.tsx             # Landing page
│   ├── login/               # Login page
│   ├── register/            # Registration page
│   ├── dashboard/           # Dashboard with listings
│   └── listings/
│       ├── new/             # Create listing form
│       └── [id]/
│           ├── page.tsx     # Listing detail/publish
│           └── media-review/ # Media review/approval
├── lib/
│   ├── api.ts               # API client
│   └── types.ts             # TypeScript types
└── .env.local               # Environment variables
```

## User Flow

1. **Register/Login** → Get JWT token stored in localStorage
2. **Dashboard** → View all listings with status badges
3. **Create Listing** → Fill form with product info + UGC settings
4. **Generate Media** → Trigger n8n workflow for AI media generation
5. **Review Media** → View generated images/videos, approve or regenerate
6. **Publish** → One-click publish to eBay
7. **View Published** → See eBay ItemID and URL

## API Integration

The frontend connects to the FastAPI backend through `lib/api.ts`:

### Auth Endpoints
- `POST /auth/register`
- `POST /auth/login`

### Listing Endpoints
- `POST /listings` - Create listing
- `GET /listings` - Get all listings
- `GET /listings/{id}` - Get specific listing
- `PATCH /listings/{id}` - Update listing
- `POST /listings/{id}/generate-media` - Trigger n8n media generation
- `POST /listings/{id}/approve-media` - Approve media
- `POST /listings/{id}/publish` - Publish to eBay

## Build & Deploy

```bash
npm run build
npm start
```
