# Frontend Architecture (MVP Simplified)

This document outlines the **minimum frontend implementation** required for the MVP. The goal is to keep things simple, functional, and fast to build—no over-engineering, no unnecessary abstractions.

---

## 1. Frontend Purpose (MVP)

The frontend only needs to:

* Allow the user to create a listing

* Allow the user to provide prompts for image/video generation

* Display generated images/videos

* Allow the user to approve the generated media

* Send the listing to the backend for publishing to eBay

* Display a dashboard of drafts and published listings

That's it. No complex flows, no analytics, no advanced features.

---

## 2. Minimal Tech Stack

* **Framework:** Next.js (with Bun)

* **Language:** TypeScript (or JS if preferred)

* **Styling:** TailwindCSS or basic CSS/Component Library

* **State Management:** Basic React state + simple API calls (React Query optional but not required)

* **Auth:** Simple JWT-based auth using backend login

No global state library, no WebSockets, no forms library unless desired.

---

## 3. Required Pages (MVP Only)

### **1. /login**

* Email

* Password

* Calls backend `/auth/login`

### **2. /dashboard**

* List of listings with statuses (`draft`, `media_ready`, `published`)

* Button: "Create New Listing"

### **3. /listings/new**

**Basic product fields:**

* Title

* Description

* Category (simple dropdown or text field for now)

* Price

* Quantity

* Condition

* Prompts for:

  * Image

  * Video

**Button:** "Generate Media" → calls backend

### **4. /listings/[id]/media-review**

* Shows generated image(s) and video

* Buttons:

  * Approve

  * Regenerate (optional optional)

### **5. /listings/[id]/publish**

* Display combined listing preview

* "Publish to eBay" button

### **6. /listings/[id]** (Simple Detail Page)

* Show listing details

* Show eBay ItemID and URL if published

---

## 4. Key Components (MVP Only)

* `TextInput`

* `Textarea`

* `Select`

* `ImageViewer`

* `VideoViewer`

* `ListingCard`

* `Button`

No need for modals, wizards, sidebars, heavy UI libraries.

---

## 5. API Calls (MVP)

The frontend will use basic `fetch()` or `axios` calls to:

* `POST /auth/login`

* `POST /listings`

* `POST /listings/:id/generate-media`

* `GET /listings/:id`

* `POST /listings/:id/approve-media`

* `POST /listings/:id/publish`

* `GET /listings`

---

## 6. Minimum Workflow

1. User logs in

2. Goes to dashboard

3. Creates new listing

4. Enters basic product info and prompts

5. Clicks "Generate Media"

6. After backend finishes, user sees media

7. User approves media

8. User clicks "Publish to eBay"

9. Dashboard updates to show published listing

Simple, clear, no multi-step wizard if not needed.

---

## 7. UX Principles (MVP Edition)

* **Make it fast:** Minimal clicks, simple forms

* **Keep layout basic:** A few forms and a dashboard is enough

* **Show errors plainly:** Display backend errors directly

* **Mobile-friendly:** Basic responsive layout

No animations, no complex layouts, no multi-step UIs.