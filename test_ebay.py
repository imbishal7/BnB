import requests
import json
from dotenv import load_dotenv
import os

load_dotenv()

# ============================================================
# CONFIG – FILL THESE IN
# ============================================================

# eBay SANDBOX user OAuth token
# Must have at least:
#   https://api.ebay.com/oauth/api_scope/sell.inventory
#   https://api.ebay.com/oauth/api_scope/sell.account
EBAY_USER_TOKEN = os.getenv('EBAY_TOKEN')  # TODO

# Fixed SKU and item details
SKU = "SANDBOX-SKU--001radonm"  # can be any unique string

# Public GCS image URLs (must be accessible without auth)
GCS_IMAGE_URLS = [
    "https://storage.googleapis.com/prodcut_assets/Testimage.png"  # TODO
]

# Inventory location (merchant) – fixed for now
MERCHANT_LOCATION_KEY = "SANDBOX_WH_US_1"

LOCATION_ADDRESS = {
    "addressLine1": "123 Sandbox St",
    "city": "San Jose",
    "stateOrProvince": "CA",
    "postalCode": "95125",
    "country": "US",       # This drives Item.Country
}

# Business policy IDs – from your (sandbox) business policies
FULFILLMENT_POLICY_ID = "YOUR_FULFILLMENT_POLICY_ID"  # TODO
PAYMENT_POLICY_ID     = "YOUR_PAYMENT_POLICY_ID"      # TODO
RETURN_POLICY_ID      = "YOUR_RETURN_POLICY_ID"       # TODO

# Endpoints (SANDBOX)
INVENTORY_BASE = "https://api.sandbox.ebay.com/sell/inventory/v1"


# ============================================================
# HELPERS
# ============================================================

def ebay_json_headers():
    return {
        "Authorization": f"Bearer {EBAY_USER_TOKEN}",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Content-Language": "en-US",
    }


def pretty_print(resp, label=""):
    print(f"\n=== {label} ===")
    print("Status:", resp.status_code)
    try:
        print(json.dumps(resp.json(), indent=2))
    except Exception:
        print(resp.text)


# ============================================================
# INVENTORY LOCATION (MERCHANT)
# ============================================================

def create_or_replace_inventory_location():
    """
    Create/replace an inventory location with a fixed address.
    Required so eBay knows Item.Country via merchantLocationKey.
    """
    url = f"{INVENTORY_BASE}/location/{MERCHANT_LOCATION_KEY}"

    payload = {
        "name": "Sandbox Warehouse US",
        "locationType": "WAREHOUSE",
        "address": LOCATION_ADDRESS,
        "phone": "+1-555-555-5555",
        "locationInstructions": "Sandbox test warehouse location.",
        "locationWebUrl": "https://example.com/sandbox-warehouse"
    }

    resp = requests.put(url, headers=ebay_json_headers(), data=json.dumps(payload))
    pretty_print(resp, "createOrReplaceInventoryLocation")
    resp.raise_for_status()
    print("Inventory location created/updated.")


# ============================================================
# INVENTORY ITEM WITH IMAGES
# ============================================================

def create_inventory_item_with_images(sku: str, image_urls):
    """
    Create/replace Inventory Item with images from GCS (direct URLs).
    """
    url = f"{INVENTORY_BASE}/inventory_item/{sku}"

    payload = {
        "product": {
            "title": "Sandbox USB-C Cable 1m",
            "description": "High quality USB-C cable, 1m, black. Sandbox test listing.",
            "aspects": {
                "Brand": ["Generic"],
                "Type": ["Cable"],
                "Connector A": ["USB-C"],
                "Connector B": ["USB-C"]
            },
            "brand": "Generic",
            # Directly use your GCS URLs as imageUrls
            "imageUrls": image_urls,
        },
        "availability": {
            "shipToLocationAvailability": {
                "quantity": 5
            }
        },
        "condition": "NEW"
    }

    resp = requests.put(url, headers=ebay_json_headers(), data=json.dumps(payload))
    pretty_print(resp, "createOrReplaceInventoryItem")
    resp.raise_for_status()
    print("Inventory item created/updated.")


# ============================================================
# OFFER + PUBLISH
# ============================================================

def create_offer_for_sku(sku: str) -> str:
    """
    Create an Offer for the given fixed SKU, using fixed merchant location & policies.
    """
    url = f"{INVENTORY_BASE}/offer"

    payload = {
        "sku": sku,
        "marketplaceId": "EBAY_US",
        "format": "FIXED_PRICE",
        "listingDescription": "SANDBOX: USB-C cable with images from GCS.",
        "availableQuantity": 5,
        "categoryId": "96914",  # example electronics/cables category; adjust if desired
        "pricingSummary": {
            "price": {"currency": "USD", "value": "9.99"}
        },
        "listingDuration": "GTC",          # Good-Til-Cancelled
        "merchantLocationKey": MERCHANT_LOCATION_KEY,
        "listingPolicies": {
            "fulfillmentPolicyId": FULFILLMENT_POLICY_ID,
            "paymentPolicyId":     PAYMENT_POLICY_ID,
            "returnPolicyId":      RETURN_POLICY_ID
        }
    }

    resp = requests.post(url, headers=ebay_json_headers(), data=json.dumps(payload))
    pretty_print(resp, "createOffer")
    resp.raise_for_status()

    data = resp.json()
    offer_id = data.get("offerId")
    if not offer_id:
        raise RuntimeError("No offerId returned from createOffer")
    print("Offer ID:", offer_id)
    return offer_id


def publish_offer(offer_id: str) -> str:
    """
    Publish the offer -> becomes a listing.
    """
    url = f"{INVENTORY_BASE}/offer/{offer_id}/publish"
    resp = requests.post(url, headers=ebay_json_headers())

    print("\n=== publishOffer raw response ===")
    print("Status:", resp.status_code)
    try:
        print(json.dumps(resp.json(), indent=2))
    except Exception:
        print(resp.text)

    if not resp.ok:
        raise RuntimeError(f"publishOffer failed with status {resp.status_code}")

    data = resp.json()
    listing_id = data.get("listingId")
    print("Listing ID (Item ID):", listing_id)
    return listing_id


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":
    # 0) Ensure inventory location exists (fixed merchant details)
    create_or_replace_inventory_location()

    # 1) Inventory item with fixed details + GCS images
    print("\nCreating inventory item with images...")
    create_inventory_item_with_images(SKU, GCS_IMAGE_URLS)

    # 2) Offer + publish
    print("\nCreating offer...")
    offer_id = create_offer_for_sku(SKU)

    print("\nPublishing offer...")
    listing_id = publish_offer(offer_id)

    print("\nDONE ✅")
    print("Sandbox listing (Item ID):", listing_id)
