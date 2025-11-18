"""
eBay API Client for Inventory and Sell operations
"""
import httpx
from typing import Optional, Dict, Any, List
from core.config import settings


class EbayClient:
    """Client for interacting with eBay Inventory API"""
    
    def __init__(self):
        self.base_url = "https://api.ebay.com/sell/inventory/v1"
        # You'll need to set these in your environment variables
        self.access_token = getattr(settings, 'ebay_access_token', None)
        self.marketplace_id = getattr(settings, 'ebay_marketplace_id', 'EBAY_US')
        
    def _get_headers(self) -> Dict[str, str]:
        """Get common headers for eBay API requests"""
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
            "Content-Language": "en-US"
        }
    
    async def create_inventory_item(
        self,
        sku: str,
        title: str,
        description: str,
        image_urls: List[str],
        video_url: Optional[str] = None,
        condition: str = "NEW",
        quantity: int = 1,
        price: float = 0.0,
        category_id: Optional[str] = None,
        product_aspects: Optional[Dict[str, List[str]]] = None
    ) -> Dict[str, Any]:
        """
        Create or replace an inventory item in eBay
        
        Args:
            sku: Seller-defined SKU (max 50 chars)
            title: Product title
            description: Product description
            image_urls: List of image URLs (eBay accessible URLs)
            video_url: Optional video URL
            condition: Item condition (NEW, USED, etc.)
            quantity: Available quantity
            price: Item price
            category_id: eBay category ID
            product_aspects: Product specifications/attributes
        """
        url = f"{self.base_url}/inventory_item/{sku}"
        
        # Build product object
        product = {
            "title": title[:80],  # eBay limit is 80 chars
            "description": description,
            "imageUrls": image_urls[:12],  # eBay allows max 12 images
            "aspects": product_aspects or {}
        }
        
        # Add video if available
        if video_url:
            product["videoIds"] = [video_url]
        
        # Build availability object
        availability = {
            "shipToLocationAvailability": {
                "quantity": quantity
            }
        }
        
        # Build the payload
        payload = {
            "product": product,
            "condition": condition,
            "availability": availability
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.put(
                url,
                headers=self._get_headers(),
                json=payload,
                timeout=30.0
            )
            
            if response.status_code in [200, 201, 204]:
                print(f"✅ Created inventory item with SKU: {sku}")
                return {"success": True, "sku": sku}
            else:
                error_msg = f"Failed to create inventory item: {response.status_code} - {response.text}"
                print(f"❌ {error_msg}")
                response.raise_for_status()
    
    async def create_offer(
        self,
        sku: str,
        price: float,
        quantity: int,
        category_id: str,
        listing_description: Optional[str] = None,
        format: str = "FIXED_PRICE",
        duration: str = "GTC"
    ) -> Dict[str, Any]:
        """
        Create an offer for an inventory item
        
        Args:
            sku: SKU of the inventory item
            price: Listing price
            quantity: Available quantity
            category_id: eBay category ID
            listing_description: Optional listing description
            format: FIXED_PRICE or AUCTION
            duration: GTC (Good Till Cancelled) or number of days
        """
        url = f"{self.base_url}/offer"
        
        payload = {
            "sku": sku,
            "marketplaceId": self.marketplace_id,
            "format": format,
            "listingDuration": duration,
            "availableQuantity": quantity,
            "categoryId": category_id,
            "listingPolicies": {
                "fulfillmentPolicyId": getattr(settings, 'ebay_fulfillment_policy_id', None),
                "paymentPolicyId": getattr(settings, 'ebay_payment_policy_id', None),
                "returnPolicyId": getattr(settings, 'ebay_return_policy_id', None)
            },
            "pricingSummary": {
                "price": {
                    "value": str(price),
                    "currency": "USD"
                }
            }
        }
        
        if listing_description:
            payload["listingDescription"] = listing_description
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                headers=self._get_headers(),
                json=payload,
                timeout=30.0
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                offer_id = data.get("offerId")
                print(f"✅ Created offer with ID: {offer_id}")
                return {"success": True, "offerId": offer_id, "data": data}
            else:
                error_msg = f"Failed to create offer: {response.status_code} - {response.text}"
                print(f"❌ {error_msg}")
                response.raise_for_status()
    
    async def publish_offer(self, offer_id: str) -> Dict[str, Any]:
        """
        Publish an offer to create a live eBay listing
        
        Args:
            offer_id: The offer ID to publish
        """
        url = f"{self.base_url}/offer/{offer_id}/publish"
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                headers=self._get_headers(),
                timeout=30.0
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                listing_id = data.get("listingId")
                print(f"✅ Published offer {offer_id} as listing {listing_id}")
                return {
                    "success": True,
                    "listingId": listing_id,
                    "offerId": offer_id,
                    "data": data
                }
            else:
                error_msg = f"Failed to publish offer: {response.status_code} - {response.text}"
                print(f"❌ {error_msg}")
                response.raise_for_status()
    
    async def publish_listing_to_ebay(
        self,
        listing_id: str,
        sku: str,
        title: str,
        description: str,
        price: float,
        quantity: int,
        category_id: str,
        image_urls: List[str],
        video_url: Optional[str] = None,
        condition: str = "NEW",
        product_aspects: Optional[Dict[str, List[str]]] = None
    ) -> Dict[str, Any]:
        """
        Complete workflow to publish a listing to eBay
        
        This method:
        1. Creates an inventory item
        2. Creates an offer
        3. Publishes the offer
        
        Args:
            listing_id: Internal listing ID
            sku: Stock Keeping Unit
            title: Product title
            description: Product description
            price: Product price
            quantity: Available quantity
            category_id: eBay category ID
            image_urls: List of image URLs
            video_url: Optional video URL
            condition: Item condition (NEW, USED, etc.)
            product_aspects: eBay product aspects/attributes from n8n
        """
        try:
            # Step 1: Create inventory item
            print(f"📦 Step 1: Creating inventory item for SKU: {sku}")
            if product_aspects:
                print(f"   Including {len(product_aspects)} product aspects")
            await self.create_inventory_item(
                sku=sku,
                title=title,
                description=description,
                image_urls=image_urls,
                video_url=video_url,
                condition=condition,
                quantity=quantity,
                price=price,
                category_id=category_id,
                product_aspects=product_aspects
            )
            
            # Step 2: Create offer
            print(f"💰 Step 2: Creating offer for SKU: {sku}")
            offer_result = await self.create_offer(
                sku=sku,
                price=price,
                quantity=quantity,
                category_id=category_id,
                listing_description=description
            )
            
            offer_id = offer_result["offerId"]
            
            # Step 3: Publish offer
            print(f"🚀 Step 3: Publishing offer: {offer_id}")
            publish_result = await self.publish_offer(offer_id)
            
            return {
                "success": True,
                "ebay_listing_id": publish_result["listingId"],
                "offer_id": offer_id,
                "sku": sku,
                "message": "Successfully published to eBay"
            }
            
        except Exception as e:
            print(f"❌ Error publishing to eBay: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to publish to eBay"
            }


# Create a singleton instance
ebay_client = EbayClient()



