from pydantic import BaseModel
from typing import Optional, List


class MediaCompleteWebhook(BaseModel):
    """Schema for media generation completion webhook from n8n UGC workflow."""
    listing_id: Optional[str] = None
    status: str = "success"
    
    # Enhanced product information from n8n
    sku: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None  # Enhanced HTML description
    price: Optional[str] = None
    quantity: Optional[int] = None
    category_id: Optional[str] = None
    condition: Optional[str] = None
    brand: Optional[str] = None
    mpn: Optional[str] = None
    
    # Generated media
    image_urls: Optional[List[str]] = None  # Multiple generated images
    video_url: Optional[str] = None
    
    # eBay aspects (product attributes)
    aspects: Optional[dict] = None
    
    # Legacy fields for backward compatibility
    product: Optional[str] = None
    model: Optional[str] = None
    assets: Optional[dict] = None
    prompts: Optional[dict] = None
    
    # Error handling
    error_message: Optional[str] = None
    
    @property
    def success(self) -> bool:
        return self.status == "success"
    
    @property
    def has_media(self) -> bool:
        """Check if webhook contains generated media."""
        return bool(self.image_urls or self.video_url)
    
    @property
    def has_enhanced_data(self) -> bool:
        """Check if webhook contains enhanced product data."""
        return bool(self.description or self.aspects)


class EbayPublishWebhook(BaseModel):
    """Schema for eBay publishing completion webhook."""
    listing_id: str
    ebay_item_id: Optional[str] = None
    ebay_url: Optional[str] = None
    success: bool = True
    error_message: Optional[str] = None
    fees: Optional[dict] = None
