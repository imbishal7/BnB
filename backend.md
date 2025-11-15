# Backend Architecture (MVP Version)

This document outlines the minimum backend architecture required for the MVP of the listing-generation and publishing application. The goal is to avoid complexity and focus only on what is necessary for the product to work end‑to‑end.

The backend is implemented in Python using a lightweight framework (FastAPI recommended) and exposes simple REST endpoints for the frontend.

## 1. Purpose of the Backend

The backend's job in the MVP is straightforward:

* Receive listing data from the frontend

* Trigger AI image/video generation (via external API)

* Store listing drafts and generated media

* Allow the user to approve generated media

* Create and send a valid listing payload to eBay (Trading API)

* Store the published item ID and status

Nothing more. No advanced retry systems, analytics, queue orchestration, microservices, or heavy infrastructure.

## 2. Minimal Tech Stack

* **Framework:** FastAPI

* **Storage:** PostgreSQL (or SQLite for early MVP)

* **ORM:** SQLAlchemy

* **Auth:** JWT-based login

* **HTTP Calls:** httpx or requests

* **Hosting:** Any basic VPS or managed service

* **Optional:** A simple background worker (pure Python thread) for media generation

No Celery, Redis, or complex workers unless absolutely needed later.

## 3. Core Database Tables (MVP‑only)

### 1. users
* id
* email
* password_hash
* ebay_access_token

### 2. listings
* id
* user_id
* title
* description
* category_id
* price
* quantity
* condition_id
* image_prompt
* video_prompt
* enriched_description
* status (draft, generating_media, media_ready, approved, published, error)

### 3. media
* id
* listing_id
* image_urls (json)
* video_url

### 4. published_listings
* id
* listing_id
* ebay_item_id
* ebay_url

That's all the MVP needs.

## 4. Minimal API Endpoints (MVP)

### Auth
* `POST /auth/register`
* `POST /auth/login`

### Listing Creation
* `POST /listings` - Save basic product info + prompts.

### Trigger AI Media Generation
* `POST /listings/{id}/generate-media` - Call external AI API → save resulting image/video URLs.

### Get Listing Data
* `GET /listings/{id}`

### Approve Media
* `POST /listings/{id}/approve-media`

### Publish to eBay
* `POST /listings/{id}/publish`
  * Build minimal eBay AddFixedPriceItem payload
  * Send to eBay Trading API
  * Store returned ItemID and URL

### Dashboard Fetch
* `GET /listings` - Get all listings for user.

## 5. External Integrations

### AI Image/Video Generation

MVP only requires:

* Send prompt
* Receive URLs of generated media
* Save into DB

No styling options, no regeneration queue, no advanced pipeline.

### eBay Trading API (MVP)

Use only:

* `AddFixedPriceItem` (main listing method)
* `UploadSiteHostedPictures` (optional — CDN URLs may be enough)

Minimum required fields:

* Title
* Description
* CategoryID
* ConditionID
* Price
* Quantity
* PictureDetails

No advanced listing features, no revisions, no variations, no analytics.

## 6. Simple MVP Workflow

1. User fills in listing form

2. Backend creates draft listing

3. User triggers media generation

4. Backend calls AI API → saves URLs → status `media_ready`

5. User reviews and approves → backend sets `approved`

6. User clicks publish

7. Backend creates minimal eBay payload

8. Call eBay API → retrieve ItemID

9. Save to DB → status `published`

10. Return published listing details to UI

No queues, no retries, no status polling unless media generation requires a short poll.

## 7. Minimal Error Handling

For MVP:

* If AI generation fails → set status `error`, return to UI

* If eBay rejects payload → return eBay error text directly to UI

* No automated retries

* No background monitoring

The user simply fixes the input and retries manually.

## 8. Future Extensions (Post-MVP)

(Not implemented in MVP, only placeholders for future.)

* Automated media queues

* Variation listings

* Multi-marketplace publishing

* Analytics (views, watchers, sales)

* Bulk listing support

* Advanced metadata enrichment

## 9. Summary

The MVP backend is intentionally simple. It focuses only on the core capability:

**Create → Generate Media → Approve → Publish to eBay**

This keeps development fast while delivering immediate real value to vendors. As the product gains traction, more robust features can be added incrementally.

