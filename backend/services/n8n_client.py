import httpx
from typing import Optional, List

from core.config import settings


class N8nClient:
    """Client for triggering n8n workflows."""
    
    def __init__(self):
        self.media_webhook_url = settings.n8n_media_generation_webhook
        self.ebay_webhook_url = settings.n8n_ebay_publish_webhook
        self.backend_url = settings.backend_url
    
    async def trigger_media_generation(
        self,
        listing_id: str,
        product_name: str,
        product_photo_url: str,
        target_audience: str,
        product_features: str,
        video_setting: str
    ) -> dict:
        """
        Trigger n8n UGC media generation workflow.
        
        Args:
            listing_id: ID of the listing
            product_name: Name of the product
            product_photo_url: URL of the product photo
            target_audience: Target ICP (ideal customer profile)
            product_features: Key features of the product
            video_setting: Setting/scene description for video
            
        Returns:
            Response from n8n webhook
        """
        payload = {
            "listing_id": listing_id,
            "Product": product_name,
            "Product Photo": product_photo_url,
            "ICP": target_audience,
            "Product Features": product_features,
            "Video Setting": video_setting,
            "callback_url": f"{self.backend_url}/webhooks/media-complete"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.media_webhook_url,
                json=payload,
                timeout=60.0
            )
            response.raise_for_status()
            return response.json()
    
    async def trigger_ebay_publish(
        self,
        listing_id: str,
        title: str,
        description: str,
        category_id: Optional[str],
        condition_id: Optional[str],
        price: float,
        quantity: int,
        image_urls: List[str],
        ebay_token: Optional[str] = None
    ) -> dict:
        """
        Trigger n8n eBay publishing workflow.
        
        Args:
            listing_id: ID of the listing
            title: Product title
            description: Product description
            category_id: eBay category ID
            condition_id: eBay condition ID
            price: Product price
            quantity: Product quantity
            image_urls: List of image URLs
            ebay_token: eBay access token (optional for sandbox)
            
        Returns:
            Response from n8n webhook
        """
        payload = {
            "listing_id": listing_id,
            "title": title,
            "description": description,
            "category_id": category_id or "default",
            "condition_id": condition_id or "1000",  # New
            "price": price,
            "quantity": quantity,
            "image_urls": image_urls,
            "ebay_token": ebay_token,
            "callback_url": f"{self.backend_url}/webhooks/ebay-complete"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.ebay_webhook_url,
                json=payload,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
