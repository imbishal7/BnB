# BnB Product Overview

## Project Purpose

A platform that enables small shop vendors to create complete e-commerce listings with minimal effort. The system generates AI-powered product images/videos, enriches metadata, and publishes listings directly to marketplaces (eBay MVP, with Amazon and others planned).

## Core Features

### Vendor Inputs
- Product title, description
- AI image/video generation prompts
- Price, quantity, category
- Condition details, item specifics (brand, color, size)
- Shipping details, return policy

### System-Generated Outputs
- AI-generated product images
- AI-generated product video
- SEO-optimized product descriptions
- Suggested item specifics and category recommendations
- Completed listing payload for marketplace APIs

### Publishing Flow
- User reviews and approves generated media/metadata
- One-click publish to eBay via Trading API
- Backend stores listing ID, fees, and status
- Dashboard displays listing status and analytics

## User Journey

1. Login & marketplace OAuth connection (eBay)
2. Create new listing
3. Enter basic product info
4. Enter prompts for image/video generation
5. AI media generation (async)
6. User reviews and approves media + enriched metadata
7. Publish to eBay
8. System stores listing results (ItemID, URL)
9. Dashboard shows listing with status & analytics

## Technical Architecture

### Frontend (Next.js + Bun)
- Location: `/home/aditya/projects/BnB/frontend/`
- Tech: Next.js 16, React 19, TypeScript, Tailwind CSS
- Responsibilities:
  - User authentication & session management
  - Listing creation UI (wizard-style)
  - Media preview & approval interface
  - REST API integration with backend

### Backend (Python)
- Location: To be created (suggest `/home/aditya/projects/BnB/backend/`)
- Tech: FastAPI/Flask, PostgreSQL, Celery/RQ
- Responsibilities:
  - Application logic and business rules
  - AI media generation API integration
  - eBay Trading API integration
  - Database layer (listings, users, marketplace tokens)
  - Job queue for async tasks (media generation, publishing)
  - OAuth token storage and management
  - Media upload & CDN integration

### Data Flow
1. Frontend submits listing → Backend saves as draft
2. Backend triggers image/video generation → Stores results
3. User approves → Backend transforms data → Submits to eBay
4. eBay returns ItemID/status → Backend stores in database

## eBay Integration (MVP)

### Trading API Endpoints
- `AddFixedPriceItem` - Primary publishing endpoint
- `VerifyAddItem` - Optional pre-validation
- `GetCategories` - Category guidance
- `GetCategoryFeatures` - Item specifics guidance
- `UploadSiteHostedPictures` - Media upload

### Stored Metadata
- ItemID, listing URL, fees, status

## Non-Functional Requirements

- **Scalability**: Async processing for media generation & publishing
- **Reliability**: Retry logic for API failures
- **Security**: Secure token storage, input validation, file safety
- **Compliance**: Follow eBay listing rules and content restrictions
- **Cost Efficiency**: Manage media generation & compute load
- **Extensibility**: Architecture supports additional marketplaces

## Roadmap

### MVP Scope
- eBay support only
- Fixed-price listings
- Basic fields: title, description, prompts, price, quantity
- Image + video generation
- Simple dashboard

### Post-MVP
- Amazon, Etsy integrations
- Variation listings (size/color)
- Bulk product upload
- Advanced analytics (views, sold count, profit)
- Template library for prompts and listing metadata

## Key Files & Structure

```
BnB/
├── frontend/          # Next.js application
│   ├── app/           # App router pages
│   └── ...
├── backend/           # Python FastAPI/Flask service (to be created)
│   ├── api/           # API endpoints
│   ├── services/      # Business logic
│   ├── integrations/  # eBay, AI APIs
│   └── models/        # Database models
└── plan_overview.md   # This document
```

## Implementation Priorities

1. Backend API structure and database schema
2. eBay OAuth integration and token management
3. Listing creation and draft storage
4. AI media generation integration
5. Media approval workflow
6. eBay publishing integration
7. Dashboard and listing management
8. Error handling and retry logic

