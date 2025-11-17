import httpx
from typing import Optional, List

from core.config import settings


class N8nClient:
    """Client for triggering n8n workflows."""
    
    def __init__(self):
        self.media_webhook_url = settings.n8n_media_generation_webhook
        self.ebay_webhook_url = settings.n8n_ebay_publish_webhook
        self.image_webhook_url = "https://kiran1xy.app.n8n.cloud/webhook-test/gen-image"
        self.video_webhook_url = "https://kiran1xy.app.n8n.cloud/webhook-test/gen-video"
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
    
    async def trigger_image_generation(
        self,
        listing_id: str,
        product_name: str,
        product_photo_url: str,
        target_audience: str,
        product_features: str,
        video_setting: str,
        image_prompt: Optional[str] = None,
        model_avatar_url: Optional[str] = None
    ) -> dict:
        """
        Trigger n8n image generation workflow.
        
        Args:
            listing_id: ID of the listing
            product_name: Name of the product
            product_photo_url: URL of the product photo
            target_audience: Target ICP (ideal customer profile)
            product_features: Key features of the product
            video_setting: Setting/scene description
            image_prompt: Optional custom image prompt
            
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
            "is_picture": True,
            "is_video": False,
            "callback_url": f"{self.backend_url}/webhooks/media-complete"
        }
        
        if model_avatar_url:
            payload["Model Avatar Photo"] = model_avatar_url
        
        if image_prompt:
            payload["image_prompt"] = image_prompt
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.image_webhook_url,
                json=payload,
                timeout=120.0  # Image generation may take longer
            )
            response.raise_for_status()
            return response.json()
    
    async def trigger_video_generation(
        self,
        listing_id: str,
        product_name: str,
        product_photo_url: str,
        target_audience: str,
        product_features: str,
        video_setting: str,
        video_prompt: Optional[str] = None,
        model_avatar_url: Optional[str] = None
    ) -> dict:
        """
        Trigger n8n video generation workflow.
        
        Args:
            listing_id: ID of the listing
            product_name: Name of the product
            product_photo_url: URL of the product photo
            target_audience: Target ICP (ideal customer profile)
            product_features: Key features of the product
            video_setting: Setting/scene description for video
            video_prompt: Optional custom video prompt
            
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
            "is_picture": False,
            "is_video": True,
            "callback_url": f"{self.backend_url}/webhooks/media-complete"
        }
        
        if model_avatar_url:
            payload["Model Avatar Photo"] = model_avatar_url
        
        if video_prompt:
            payload["video_prompt"] = video_prompt
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.video_webhook_url,
                json=payload,
                timeout=180.0  # Video generation takes longer
            )
            response.raise_for_status()
            return response.json()
