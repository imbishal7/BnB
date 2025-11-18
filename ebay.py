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
"""
import os
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
MARKETPLACE_ID = "EBAY_US"

# Product Details
SKU = "USB-C-CABLE-001"
PRODUCT_TITLE = "USB-C to USB-C Cable - 1M Fast Charging Cable"
PRODUCT_DESCRIPTION = "High quality USB-C cable. Supports fast charging and data transfer. 1 meter length, black color."
PRODUCT_PRICE = "9.99"
PRODUCT_QUANTITY = 10
CATEGORY_ID = "162999"  # Cell Phone & Smartphone Parts

# Use public eBay image for testing (replace with your own GCS URLs)
IMAGE_URLS = [
    "https://tempfile.aiquickdraw.com/workers/nano/image_1763341194687_cv1jv0_1x1_1024x1024.png"
]

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
            "aspects": {
                "Brand": ["Generic"],
                "MPN": ["Does Not Apply"],
                "Type": ["Cable"],
                "Connector A": ["USB-C"],
                "Connector B": ["USB-C"],
                "Cable Length": ["1 m"],
                "Color": ["Black"],
                "Material": ["Plastic", "Metal"]
            },
            "brand": "Generic",
            "mpn": "Does Not Apply",
            "imageUrls": IMAGE_URLS,
        },
        "availability": {
            "shipToLocationAvailability": {
                "quantity": PRODUCT_QUANTITY
            }
        },
        "condition": "NEW"
    }
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
