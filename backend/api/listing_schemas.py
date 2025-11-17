from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class ListingCreate(BaseModel):
    """Schema for creating a listing."""
    title: str
    description: str
    category_id: Optional[str] = None
    price: float
    quantity: int
    condition_id: Optional[str] = None
    product_photo_url: Optional[str] = None
    uploaded_image_urls: Optional[list[str]] = None
    model_avatar_url: Optional[str] = None
    target_audience: Optional[str] = None
    product_features: Optional[str] = None
    video_setting: Optional[str] = None
    image_prompt: Optional[str] = None
    video_prompt: Optional[str] = None
    generate_image: Optional[bool] = False
    generate_video: Optional[bool] = False


class ListingUpdate(BaseModel):
    """Schema for updating a listing."""
    title: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[str] = None
    price: Optional[float] = None
    quantity: Optional[int] = None
    condition_id: Optional[str] = None
    product_photo_url: Optional[str] = None
    uploaded_image_urls: Optional[list[str]] = None
    model_avatar_url: Optional[str] = None
    target_audience: Optional[str] = None
    product_features: Optional[str] = None
    video_setting: Optional[str] = None
    image_prompt: Optional[str] = None
    video_prompt: Optional[str] = None
    status: Optional[str] = None


class MediaResponse(BaseModel):
    """Schema for media response."""
    id: int
    listing_id: str
    image_urls: Optional[list[str]] = None
    video_url: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class PublishedListingResponse(BaseModel):
    """Schema for published listing response."""
    id: int
    listing_id: str
    ebay_item_id: str
    ebay_url: str
    published_at: datetime
    
    class Config:
        from_attributes = True


class ListingResponse(BaseModel):
    """Schema for listing response."""
    id: str
    user_id: int
    title: str
    description: str
    category_id: Optional[str] = None
    price: float
    quantity: int
    condition_id: Optional[str] = None
    product_photo_url: Optional[str] = None
    uploaded_image_urls: Optional[list[str]] = None
    model_avatar_url: Optional[str] = None
    target_audience: Optional[str] = None
    product_features: Optional[str] = None
    video_setting: Optional[str] = None
    image_prompt: Optional[str] = None
    video_prompt: Optional[str] = None
    enriched_description: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    media: Optional[MediaResponse] = None
    published_listing: Optional[PublishedListingResponse] = None
    
    class Config:
        from_attributes = True
