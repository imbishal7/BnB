import requests
import json
import time
from dotenv import load_dotenv
import os

load_dotenv()

# ============================
# CONFIG (EDIT THESE)
# ============================

# 1) Your eBay **user OAuth token** for SANDBOX
#    Must have at least: sell.inventory scope (and media access)
EBAY_USER_TOKEN =  os.getenv("EBAY_TOKEN")  # TODO --- IGNORE ---

# 2) Your SKU for this test item
SKU = "SANDBOX-SKU-VIDEO-001"  # TODO if you want

# 3) Your GCS MEDIA (must be public-read URLs)
GCS_IMAGE_URLS = [
   "https://storage.googleapis.com/prodcut_assets/Testimage.png"
]
GCS_VIDEO_URL = 'https://storage.googleapis.com/prodcut_assets/761f9d9efac2f282d97801e6e21557d2_1763242585.mp4'  # TODO

# 4) eBay sandbox endpoints
MEDIA_BASE = "https://apim.sandbox.ebay.com/commerce/media/v1_beta"
INVENTORY_BASE = "https://api.sandbox.ebay.com/sell/inventory/v1"


# ============================
# HELPERS
# ============================

def ebay_json_headers():
    return {
        "Authorization": f"Bearer {EBAY_USER_TOKEN}",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Content-Language": "en-US",
    }


def ebay_binary_headers(content_length, content_type="video/mp4"):
    return {
        "Authorization": f"Bearer {EBAY_USER_TOKEN}",
        "Content-Type": content_type,
        "Content-Length": str(content_length),
    }


def pretty_print(resp, label=""):
    print("\n=== ", label, " ===")
    print("Status:", resp.status_code)
    try:
        print(json.dumps(resp.json(), indent=2))
    except Exception:
        print(resp.text)


# ============================
# IMAGES: GCS -> Media API -> EPS URLs
# ============================

def media_create_image_from_url(image_url: str) -> str:
    """
    Call eBay Media API to create an EPS image from your GCS URL.
    Returns image_id.
    """
    url = f"{MEDIA_BASE}/image/create_image_from_url"
    payload = {"imageUrl": image_url}

    resp = requests.post(url, headers=ebay_json_headers(), data=json.dumps(payload))
    pretty_print(resp, f"createImageFromUrl ({image_url})")
    resp.raise_for_status()

    location = resp.headers.get("Location")
    if not location:
        raise RuntimeError("No Location header returned for image")

    image_id = location.rstrip("/").split("/")[-1]
    print("Created image_id:", image_id)
    return image_id


def media_get_image_url(image_id: str) -> str:
    """
    Get EPS image URL from image_id.
    """
    url = f"{MEDIA_BASE}/image/{image_id}"
    resp = requests.get(url, headers=ebay_json_headers())
    pretty_print(resp, f"getImage ({image_id})")
    resp.raise_for_status()

    data = resp.json()
    eps_url = data["imageUrl"]
    print("EPS image URL:", eps_url)
    return eps_url


def convert_gcs_images_to_eps_urls(gcs_urls):
    eps_urls = []
    for u in gcs_urls:
        img_id = media_create_image_from_url(u)
        eps_url = media_get_image_url(img_id)
        eps_urls.append(eps_url)
    return eps_urls


# ============================
# VIDEO: GCS -> Media API -> video_id
# ============================

def get_gcs_content_length(url: str) -> int:
    """
    HEAD the GCS URL to get Content-Length in bytes.
    """
    head = requests.head(url)
    head.raise_for_status()
    cl = head.headers.get("Content-Length")
    if not cl:
        raise RuntimeError("No Content-Length on GCS object")
    size = int(cl)
    print("GCS Content-Length:", size)
    return size


def media_create_video(title: str, description: str, size_bytes: int) -> str:
    """
    Create a video asset in eBay Media API (no file upload yet).
    Returns video_id.
    """
    url = f"{MEDIA_BASE}/video"
    payload = {
        "title": title,
        "description": description,
        "size": size_bytes,
        "classification": ["ITEM"],  # for item listing videos
    }

    resp = requests.post(url, headers=ebay_json_headers(), data=json.dumps(payload))
    pretty_print(resp, "createVideo")
    resp.raise_for_status()

    location = resp.headers.get("Location")
    if not location:
        raise RuntimeError("No Location header returned for video")
    video_id = location.rstrip("/").split("/")[-1]
    print("Created video_id:", video_id)
    return video_id


def media_upload_video_from_gcs(video_id: str, gcs_url: str, size_bytes: int):
    """
    Stream the GCS video file into eBay Media upload endpoint.
    """
    url = f"{MEDIA_BASE}/video/{video_id}/upload"

    with requests.get(gcs_url, stream=True) as src:
        src.raise_for_status()
        resp = requests.post(
            url,
            headers=ebay_binary_headers(size_bytes, content_type="video/mp4"),
            data=src.iter_content(chunk_size=1024 * 1024),
        )

    pretty_print(resp, "uploadVideo")
    resp.raise_for_status()
    print("Video upload completed.")


def media_get_video_status(video_id: str) -> str:
    url = f"{MEDIA_BASE}/video/{video_id}"
    resp = requests.get(url, headers=ebay_json_headers())
    pretty_print(resp, f"getVideo ({video_id})")
    resp.raise_for_status()
    return resp.json()["status"]


def wait_until_video_live(video_id: str, timeout_sec: int = 300, interval_sec: int = 10):
    """
    Poll video status until it becomes LIVE or fails/times out.
    """
    start = time.time()
    while True:
        status = media_get_video_status(video_id)
        print("Video status:", status)

        if status == "LIVE":
            print("Video is LIVE ✅")
            return
        if status in ("BLOCKED", "PROCESSING_FAILED"):
            raise RuntimeError(f"Video processing failed or blocked: {status}")
        if time.time() - start > timeout_sec:
            raise TimeoutError(f"Video did not reach LIVE in {timeout_sec} seconds")

        time.sleep(interval_sec)


def create_and_upload_video_from_gcs(gcs_url: str) -> str:
    """
    Full video pipeline: size -> createVideo -> upload -> wait LIVE.
    Returns video_id.
    """
    size = get_gcs_content_length(gcs_url)
    title = "Sandbox USB-C Demo Video"
    desc = "Demo video uploaded via eBay Media API from GCS."

    video_id = media_create_video(title, desc, size)
    media_upload_video_from_gcs(video_id, gcs_url, size)
    wait_until_video_live(video_id)
    return video_id


# ============================
# INVENTORY & OFFER
# ============================

def create_inventory_item_with_media(sku: str, image_urls, video_id: str = None):
    """
    Create/replace Inventory Item with images (and optional video).
    """
    url = f"{INVENTORY_BASE}/inventory_item/{sku}"

    product_data = {
        "title": "Sandbox USB-C Cable 1m",
        "description": "High quality USB-C cable, 1m, black.",
        "aspects": {
            "Brand": ["Generic"],
            "Type": ["Cable"],
            "Connector A": ["USB-C"],
            "Connector B": ["USB-C"]
        },
        "brand": "Generic",
        "imageUrls": image_urls,      # Image URLs (GCS or EPS)
    }
    
    # Only add videoIds if video_id is provided
    if video_id:
        product_data["videoIds"] = [video_id]

    payload = {
        "product": product_data,
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


def create_offer_for_sku(sku: str) -> str:
    """
    Create an Offer for the given SKU.
    NOTE: you may need to add your policy IDs depending on your seller setup.
    """
    url = f"{INVENTORY_BASE}/offer"
    payload = {
        "sku": sku,
        "marketplaceId": "EBAY_US",
        "format": "FIXED_PRICE",
        "listingDescription": "SANDBOX: USB-C cable with product images.",
        "availableQuantity": 5,
        "categoryId": "96914",  # TODO: set correct category for your item
        "pricingSummary": {
            "price": {
                "currency": "USD",
                "value": "9.99"
            }
        }
        # If you get policy-related errors, you may need:
        # "listingPolicies": {...}
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
    pretty_print(resp, "publishOffer")
    resp.raise_for_status()

    data = resp.json()
    listing_id = data.get("listingId")
    print("Listing ID (Item ID):", listing_id)
    return listing_id


# ============================
# MAIN
# ============================

if __name__ == "__main__":
    # OPTION A: Skip Media API for images, use GCS URLs directly
    # eBay allows external image URLs for sandbox
    print("Using GCS image URLs directly (skipping Media API)...")
    eps_image_urls = GCS_IMAGE_URLS
    print("Image URLs:", eps_image_urls)

    # OPTION B: Uncomment below if you have proper Media API scope
    # print("Converting GCS images to eBay EPS URLs...")
    # eps_image_urls = convert_gcs_images_to_eps_urls(GCS_IMAGE_URLS)
    # print("Final EPS image URLs:", eps_image_urls)

    # 2) Skip video for now (requires commerce.media.readwrite scope)
    print("\nSkipping video upload (no Media API scope)...")
    video_id = None
    # Uncomment below if you have proper Media API scope:
    # video_id = create_and_upload_video_from_gcs(GCS_VIDEO_URL)
    # print("Final video_id:", video_id)

    # 3) Create inventory item with images only
    print("\nCreating inventory item with images...")
    create_inventory_item_with_media(SKU, eps_image_urls, video_id)

    # 4) Create offer and publish
    print("\nCreating offer...")
    offer_id = create_offer_for_sku(SKU)

    print("\nPublishing offer...")
    listing_id = publish_offer(offer_id)

    print("\nDONE ✅")
    print("Sandbox listing (Item ID):", listing_id)
    print("Now check your eBay SANDBOX seller account for the listing.")
