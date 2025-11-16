# Quick Start Guide - Testing the Integration

## Prerequisites
- Python 3.8+ with pip
- Node.js 18+ or Bun
- Terminal access

## Step 1: Start the Backend

```bash
# Navigate to backend directory
cd /home/imbishal7/BnB/backend

# Create/activate virtual environment (if not already done)
python -m venv venv
source venv/bin/activate

# Install dependencies (if not already done)
pip install -r requirements.txt

# Create .env file if it doesn't exist
cat > .env << EOF
SECRET_KEY=your-secret-key-here-change-in-production
DATABASE_URL=sqlite:///./bnb.db
N8N_MEDIA_GENERATION_WEBHOOK=http://localhost:5678/webhook/media-gen
N8N_EBAY_PUBLISH_WEBHOOK=http://localhost:5678/webhook/ebay-publish
BACKEND_URL=http://localhost:8000
CORS_ORIGINS=http://localhost:3000
EOF

# Start the server
uvicorn main:app --reload
```

Backend will be available at: **http://localhost:8000**

API docs at: **http://localhost:8000/docs**

## Step 2: Start the Frontend

```bash
# Open a new terminal
# Navigate to frontend directory
cd /home/imbishal7/BnB/frontend

# Install dependencies (if not already done)
npm install
# or
bun install

# Create .env.local if it doesn't exist
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start the development server
npm run dev
# or
bun dev
```

Frontend will be available at: **http://localhost:3000**

## Step 3: Test the Complete Flow

### 1. Register a New Account
1. Open http://localhost:3000
2. Click **"Get Started"** in the navbar
3. Fill in the registration form:
   - Email: `test@example.com`
   - Password: `password123` (min 8 characters)
   - Confirm Password: `password123`
4. Click **"Create Account"**
5. You should be redirected to the login page with a success message

### 2. Login
1. On the login page, enter:
   - Email: `test@example.com`
   - Password: `password123`
2. Click **"Sign In"**
3. You should be redirected to the home page
4. Navbar should now show: **Create Listing**, **Dashboard**, **Sign Out**

### 3. Create a Listing
1. Click **"Create Listing"** in the navbar
2. Fill in the form:
   - **Title**: "Premium Water Bottle"
   - **Description**: "High-quality insulated water bottle"
   - **Category**: Select any category
   - **Price**: 29.99
   - **Quantity**: 10
   - **Condition**: "New"
3. Optionally enable **Generate Image**:
   - Product Photo URL: `https://example.com/bottle.jpg`
   - Target Audience: "Athletes and fitness enthusiasts"
   - Product Features: "Keeps drinks cold for 24 hours"
4. Optionally enable **Generate Video**:
   - Video Setting: "Outdoor cycling with water bottle"
5. Click **"Create Listing"**
6. You should be redirected to the media review page

### 4. View Dashboard
1. Click **"Dashboard"** in the navbar
2. You should see:
   - Stats cards showing: 1 total listing, 0 published, 1 draft
   - Your listing in the table with status badge
   - Price and creation date

### 5. Test Logout
1. Click **"Sign Out"** in the navbar
2. You should be redirected to the home page
3. Navbar should show: **Sign In**, **Get Started**
4. Try visiting http://localhost:3000/dashboard
5. You should be redirected to the login page

## Verify Backend

### Check Database
```bash
cd /home/imbishal7/BnB/backend

# View the database (SQLite)
sqlite3 bnb.db "SELECT * FROM users;"
sqlite3 bnb.db "SELECT id, title, price, status FROM listings;"
```

### Check API Endpoints
Visit http://localhost:8000/docs to see:
- `POST /auth/register` - Create new user
- `POST /auth/login` - Login and get token
- `POST /listings` - Create listing (requires auth)
- `GET /listings` - Get all user listings (requires auth)
- `GET /listings/{id}` - Get specific listing (requires auth)

### Test with cURL
```bash
# Register
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"curl@test.com","password":"password123"}'

# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"curl@test.com","password":"password123"}'

# Copy the access_token from the response, then:
TOKEN="your-access-token-here"

# Get listings
curl http://localhost:8000/listings \
  -H "Authorization: Bearer $TOKEN"
```

## Common Issues

### Backend won't start
- **Missing .env**: Create `.env` file in `/backend/` with required variables
- **Database error**: Delete `bnb.db` file and restart (will recreate tables)
- **Port in use**: Change port with `uvicorn main:app --reload --port 8001`

### Frontend won't start
- **Dependencies**: Run `npm install` or `bun install`
- **Missing env**: Create `.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:8000`
- **Port in use**: Next.js will automatically use port 3001 if 3000 is taken

### API requests fail
- **CORS error**: Check backend `CORS_ORIGINS` includes `http://localhost:3000`
- **401 Unauthorized**: Token expired or not sent - logout and login again
- **Connection refused**: Make sure backend is running on port 8000

### Token not persisting
- **Private browsing**: localStorage won't persist in incognito mode
- **Browser error**: Check browser console for errors
- **Clear storage**: Try clearing localStorage and logging in again

## Success Indicators

✅ Backend running at http://localhost:8000
✅ Frontend running at http://localhost:3000
✅ Can register new account
✅ Can login and see token in localStorage
✅ Navbar updates after login
✅ Can create listing
✅ Dashboard shows listings
✅ Can logout and navbar updates
✅ Protected routes redirect to login when not authenticated

## Next Steps

After verifying the integration works:
1. Set up n8n workflows for media generation
2. Configure eBay API credentials
3. Implement the media review functionality
4. Add publishing to eBay
5. Deploy to production environment
