#!/usr/bin/env python3
"""
eBay Sandbox Listing Creator
Creates a complete eBay listing in sandbox environment with all required steps.

Requirements:
- EBAY_TOKEN in .env with proper scopes:
  - sell.inventory
  - sell.account
  - sell.fulfillment
  
Usage:
    python ebay.py
    or
    python ebay.py product_config.py
"""
import os
import sys
import json
import requests
from dotenv import load_dotenv

load_dotenv()

# ============================================================
# CONFIG
# ============================================================

EBAY_TOKEN = os.getenv("EBAY_TOKEN")
if not EBAY_TOKEN:
    raise RuntimeError("EBAY_TOKEN missing in .env - Get token from: https://developer.ebay.com/my/auth/?env=sandbox")

HEADERS_JSON = {
    "Authorization": f"Bearer {EBAY_TOKEN}",
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Content-Language": "en-US",
}

ACCOUNT_BASE = "https://api.sandbox.ebay.com/sell/account/v1"
INVENTORY_BASE = "https://api.sandbox.ebay.com/sell/inventory/v1"
MEDIA_BASE = "https://apim.sandbox.ebay.com/commerce/media/v1_beta"
MARKETPLACE_ID = "EBAY_US"

# Load product data from config file if provided
PRODUCT_DATA = None
if len(sys.argv) > 1:
    config_file = sys.argv[1]
    print(f"Loading product data from {config_file}...")
    import importlib.util
    spec = importlib.util.spec_from_file_location("product_config", config_file)
    config_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(config_module)
    PRODUCT_DATA = config_module.product_data
else:
    # Default product data for backward compatibility
    PRODUCT_DATA = {
        "sku": "POLO-TSHIRT-BLK-001",
        "title": "Men's Classic Polo Shirt - Black Cotton Short Sleeve",
        "description": "Premium quality men's polo shirt in classic black. Made from 100% cotton for comfort and breathability. Features traditional collar, short sleeves, and 3-button placket. Perfect for casual or business casual wear. Classic fit design.",
        "price": "24.99",
        "quantity": 30,
        "category_id": "88433",
        "image_urls": [
            "https://tempfile.aiquickdraw.com/workers/nano/image_1763341194687_cv1jv0_1x1_1024x1024.png"
        ],
        "aspects": {
            "Brand": ["Generic"],
            "MPN": ["Does Not Apply"],
            "Type": ["Polo Shirt"],
            "Material": ["Cotton"],
            "Size Type": ["Regular"],
            "Sleeve Length": ["Short Sleeve"],
            "Color": ["Black"],
            "Features": ["Breathable"],
            "Country of Origin": ["China"]
        },
        "brand": "Generic",
        "mpn": "Does Not Apply",
        "condition": "NEW"
    }

# Extract product details
SKU = PRODUCT_DATA["sku"]
PRODUCT_TITLE = PRODUCT_DATA["title"]
PRODUCT_DESCRIPTION = PRODUCT_DATA["description"]
PRODUCT_PRICE = PRODUCT_DATA["price"]
PRODUCT_QUANTITY = PRODUCT_DATA["quantity"]
CATEGORY_ID = PRODUCT_DATA["category_id"]
IMAGE_URLS = PRODUCT_DATA["image_urls"]

# Inventory location
MERCHANT_LOCATION_KEY = "WAREHOUSE_US_1"
LOCATION_ADDRESS = {
    "addressLine1": "123 Main St",
    "city": "San Jose",
    "stateOrProvince": "CA",
    "postalCode": "95125",
    "country": "US",
}


# ============================================================
# HELPERS
# ============================================================

def pretty(label, resp):
    """Pretty print API response"""
    print(f"\n{'='*60}")
    print(f"{label}")
    print(f"{'='*60}")
    print(f"Status: {resp.status_code}")
    try:
        data = resp.json()
        print(json.dumps(data, indent=2))
    except Exception:
        print(resp.text)


def upload_video_from_url(video_url):
    """Upload video to eBay Media API and return video ID"""
    import tempfile
    
    print(f"📥 Downloading video from: {video_url}")
    resp = requests.get(video_url, stream=True)
    resp.raise_for_status()
    
    # Create temp file
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp4')
    
    # Download in chunks
    for chunk in resp.iter_content(chunk_size=8192):
        temp_file.write(chunk)
    
    temp_file.close()
    file_size = os.path.getsize(temp_file.name)
    print(f"✅ Downloaded {file_size:,} bytes")
    
    # Create video resource
    print("📤 Creating video resource on eBay...")
    url = f"{MEDIA_BASE}/video"
    headers = {
        "Authorization": f"Bearer {EBAY_TOKEN}",
        "Content-Type": "application/json",
    }
    
    payload = {
        "classification": ["ITEM"],
        "title": "Product Video",
        "description": "Product demonstration video",
        "size": file_size
    }
    
    resp = requests.post(url, headers=headers, json=payload)
    
    if resp.status_code not in [200, 201]:
        print(f"❌ Error creating video resource: {resp.status_code}")
        print(resp.text)
        os.unlink(temp_file.name)
        return None
    
    # Get video ID from Location header
    location = resp.headers.get('Location', '')
    video_id = location.split('/')[-1] if location else None
    print(f"✅ Video resource created: {video_id}")
    
    # Upload video file
    print("📤 Uploading video to eBay...")
    upload_url = f"{MEDIA_BASE}/video/{video_id}/upload"
    upload_headers = {
        "Authorization": f"Bearer {EBAY_TOKEN}",
        "Content-Type": "application/octet-stream",
        "Content-Length": str(file_size),
    }
    
    with open(temp_file.name, 'rb') as video_file:
        resp = requests.post(upload_url, headers=upload_headers, data=video_file)
    
    # Cleanup temp file
    os.unlink(temp_file.name)
    
    if resp.status_code not in [200, 204]:
        print(f"❌ Error uploading video: {resp.status_code}")
        print(resp.text)
        return None
    
    print(f"✅ Video uploaded successfully: {video_id}")
    return video_id


# ============================================================
# STEP 1: OPT INTO BUSINESS POLICIES
# ============================================================

def opt_in_policies():
    """Opt into selling policy management (safe if already opted in)"""
    url = f"{ACCOUNT_BASE}/program/opt_in"
    payload = {"programType": "SELLING_POLICY_MANAGEMENT"}
    resp = requests.post(url, headers=HEADERS_JSON, data=json.dumps(payload))
    
    if resp.status_code in (200, 201, 204):
        print("✅ Opted into business policies")
    elif resp.status_code == 409:
        print("✅ Already opted into business policies")
    else:
        print("⚠️  Opt-in returned non-2xx (continuing anyway)")


# ============================================================
# STEP 2: GET OR CREATE FULFILLMENT POLICY
# ============================================================

def get_or_create_fulfillment_policy():
    """Get existing fulfillment policy or create new one"""
    # First, try to get existing policies
    url = f"{ACCOUNT_BASE}/fulfillment_policy?marketplace_id={MARKETPLACE_ID}"
    resp = requests.get(url, headers=HEADERS_JSON)
    
    if resp.status_code == 200:
        data = resp.json()
        policies = data.get("fulfillmentPolicies", [])
        if policies:
            policy_id = policies[0]["fulfillmentPolicyId"]
            print(f"✅ Using existing fulfillment policy: {policy_id}")
            return policy_id
    
    # Create new policy
    import time
    url = f"{ACCOUNT_BASE}/fulfillment_policy"
    payload = {
        "marketplaceId": MARKETPLACE_ID,
        "name": f"Standard_Shipping_{int(time.time())}",
        "shippingOptions": [
            {
                "optionType": "DOMESTIC",
                "costType": "FLAT_RATE",
                "shippingServices": [
                    {
                        "shippingServiceCode": "USPSPriority",
                        "sortOrderId": 1,
                        "shippingCost": {"currency": "USD", "value": "0.00"},
                        "shippingCostType": "FLAT_RATE"
                    }
                ]
            }
        ],
        "handlingTime": {"unit": "DAY", "value": 1}
    }
    resp = requests.post(url, headers=HEADERS_JSON, data=json.dumps(payload))
    
    # Handle already exists
    if resp.status_code == 400:
        data = resp.json()
        for err in data.get("errors", []):
            if err.get("errorId") == 20400:
                for param in err.get("parameters", []):
                    if param.get("name") == "DuplicateProfileId":
                        existing_id = param.get("value")
                        print(f"✅ Using existing fulfillment policy: {existing_id}")
                        return existing_id
    
    if resp.status_code in (200, 201):
        policy_id = resp.json()["fulfillmentPolicyId"]
        print(f"✅ Created fulfillment policy: {policy_id}")
        return policy_id
    
    pretty("Error creating fulfillment policy", resp)
    resp.raise_for_status()


# ============================================================
# STEP 3: CREATE INVENTORY LOCATION
# ============================================================

def create_inventory_location():
    """Create merchant inventory location"""
    url = f"{INVENTORY_BASE}/location/{MERCHANT_LOCATION_KEY}"
    payload = {
        "location": {"address": LOCATION_ADDRESS},
        "name": "Primary Warehouse",
        "locationTypes": ["WAREHOUSE"],
        "merchantLocationStatus": "ENABLED"
    }
    resp = requests.post(url, headers=HEADERS_JSON, data=json.dumps(payload))
    
    if resp.status_code in (200, 201, 204):
        print("✅ Inventory location created")
        return
    
    # Handle already exists
    if resp.status_code == 400:
        data = resp.json()
        for err in data.get("errors", []):
            if err.get("errorId") == 25803:  # Already exists
                print("✅ Inventory location already exists")
                return
    
    pretty("Error creating location", resp)
    resp.raise_for_status()


# ============================================================
# STEP 4: CREATE INVENTORY ITEM
# ============================================================

def create_inventory_item():
    """Create inventory item with product details"""
    url = f"{INVENTORY_BASE}/inventory_item/{SKU}"
    payload = {
        "product": {
            "title": PRODUCT_TITLE,
            "description": PRODUCT_DESCRIPTION,
            "aspects": PRODUCT_DATA["aspects"],
            "brand": PRODUCT_DATA["brand"],
            "mpn": PRODUCT_DATA["mpn"],
            "imageUrls": IMAGE_URLS,
        },
        "availability": {
            "shipToLocationAvailability": {
                "quantity": PRODUCT_QUANTITY
            }
        },
        "condition": PRODUCT_DATA["condition"]
    }
    
    # Check if video URL is provided and upload it
    video_url = PRODUCT_DATA.get("video_url")
    if video_url:
        print("\n📹 Video URL detected, uploading to eBay...")
        video_id = upload_video_from_url(video_url)
        if video_id:
            payload["product"]["videoIds"] = [video_id]
            print(f"✅ Video will be included in listing")
        else:
            print("⚠️  Video upload failed, continuing without video")
    
    resp = requests.put(url, headers=HEADERS_JSON, data=json.dumps(payload))
    
    if resp.status_code in (200, 201, 204):
        print("✅ Inventory item created")
    else:
        pretty("Error creating inventory item", resp)
        resp.raise_for_status()


# ============================================================
# STEP 5: CREATE OFFER
# ============================================================

def create_offer(fulfillment_policy_id):
    """Create offer for the inventory item"""
    url = f"{INVENTORY_BASE}/offer"
    payload = {
        "sku": SKU,
        "marketplaceId": MARKETPLACE_ID,
        "format": "FIXED_PRICE",
        "listingDescription": PRODUCT_DESCRIPTION,
        "availableQuantity": PRODUCT_QUANTITY,
        "categoryId": CATEGORY_ID,
        "pricingSummary": {
            "price": {"currency": "USD", "value": PRODUCT_PRICE}
        },
        "listingDuration": "GTC",
        "merchantLocationKey": MERCHANT_LOCATION_KEY,
        "listingPolicies": {
            "fulfillmentPolicyId": fulfillment_policy_id,
        }
    }
    resp = requests.post(url, headers=HEADERS_JSON, data=json.dumps(payload))
    
    if resp.status_code in (200, 201):
        offer_id = resp.json()["offerId"]
        print(f"✅ Offer created: {offer_id}")
        return offer_id
    
    # Handle already exists
    if resp.status_code == 400:
        data = resp.json()
        for err in data.get("errors", []):
            if err.get("errorId") == 25002:  # Offer already exists
                for param in err.get("parameters", []):
                    if param.get("name") == "offerId":
                        existing_id = param.get("value")
                        print(f"✅ Using existing offer: {existing_id}")
                        return existing_id
    
    pretty("Error creating offer", resp)
    resp.raise_for_status()


# ============================================================
# STEP 6: PUBLISH OFFER
# ============================================================

def publish_offer(offer_id):
    """Publish the offer to create live listing"""
    url = f"{INVENTORY_BASE}/offer/{offer_id}/publish"
    resp = requests.post(url, headers=HEADERS_JSON)
    
    if resp.status_code == 200:
        data = resp.json()
        listing_id = data["listingId"]
        print(f"✅ Listing published: {listing_id}")
        
        # Show warnings if any
        if data.get("warnings"):
            print("\n⚠️  Warnings:")
            for warn in data["warnings"]:
                print(f"   - {warn.get('message', 'Unknown warning')}")
        
        return listing_id
    
    pretty("Error publishing offer", resp)
    resp.raise_for_status()


# ============================================================
# MAIN
# ============================================================

def main():
    print("\n" + "="*70)
    print("eBay Sandbox Listing Creator")
    print("="*70)
    print(f"\nProduct: {PRODUCT_TITLE}")
    print(f"SKU: {SKU}")
    print(f"Price: ${PRODUCT_PRICE}")
    print(f"Quantity: {PRODUCT_QUANTITY}")
    print("\n" + "="*70)
    
    try:
        # Step 1: Opt in
        print("\n[1/6] Opting into business policies...")
        opt_in_policies()
        
        # Step 2: Get/Create fulfillment policy
        print("\n[2/6] Getting fulfillment policy...")
        fulfillment_policy_id = get_or_create_fulfillment_policy()
        
        # Step 3: Create location
        print("\n[3/6] Creating inventory location...")
        create_inventory_location()
        
        # Step 4: Create inventory item
        print("\n[4/6] Creating inventory item...")
        create_inventory_item()
        
        # Step 5: Create offer
        print("\n[5/6] Creating offer...")
        offer_id = create_offer(fulfillment_policy_id)
        
        # Step 6: Publish
        print("\n[6/6] Publishing listing...")
        listing_id = publish_offer(offer_id)
        
        # Success!
        print("\n" + "="*70)
        print("✅ SUCCESS!")
        print("="*70)
        print(f"\nListing ID: {listing_id}")
        print(f"Offer ID: {offer_id}")
        print(f"\nView your listing:")
        print(f"https://sandbox.ebay.com/itm/{listing_id}")
        print("\n(Login with the same sandbox account used to generate the token)")
        print("="*70 + "\n")
        
    except requests.exceptions.HTTPError as e:
        print(f"\n❌ Error: {e}")
        print("\nIf you're getting 403 errors, your token needs these scopes:")
        print("  - sell.inventory")
        print("  - sell.account")
        print("  - sell.fulfillment")
        print("\nGet a new token at:")
        print("https://developer.ebay.com/my/auth/?env=sandbox&index=0")
        exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        exit(1)


if __name__ == "__main__":
    main()
