from pydantic import BaseModel
from typing import Optional, List


class MediaCompleteWebhook(BaseModel):
    """Schema for media generation completion webhook from n8n UGC workflow."""
    listing_id: Optional[str] = None
    status: str
    product: Optional[str] = None
    model: Optional[str] = None
    assets: Optional[dict] = None  # {"image_url": "...", "video_url": "..."}
    prompts: Optional[dict] = None  # {"image_prompt": "...", "video_prompt": "..."}
    error_message: Optional[str] = None
    
    @property
    def success(self) -> bool:
        return self.status == "success"
    
    @property
    def image_url(self) -> Optional[str]:
        return self.assets.get("image_url") if self.assets else None
    
    @property
    def video_url(self) -> Optional[str]:
        return self.assets.get("video_url") if self.assets else None


class EbayPublishWebhook(BaseModel):
    """Schema for eBay publishing completion webhook."""
    listing_id: str
    ebay_item_id: Optional[str] = None
    ebay_url: Optional[str] = None
    success: bool = True
    error_message: Optional[str] = None
    fees: Optional[dict] = None
