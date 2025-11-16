from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from models import Listing, Media, PublishedListing, ListingStatus
from .webhook_schemas import MediaCompleteWebhook, EbayPublishWebhook

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/media-complete")
def handle_media_complete(
    webhook_data: MediaCompleteWebhook,
    db: Session = Depends(get_db)
):
    """Handle media generation completion webhook from n8n."""
    listing = db.query(Listing).filter(Listing.id == webhook_data.listing_id).first()
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    if webhook_data.success:
        # Create or update media record
        media = db.query(Media).filter(Media.listing_id == listing.id).first()
        
        image_urls = [webhook_data.image_url] if webhook_data.image_url else []
        
        if media:
            media.image_urls = image_urls
            media.video_url = webhook_data.video_url
        else:
            media = Media(
                listing_id=listing.id,
                image_urls=image_urls,
                video_url=webhook_data.video_url
            )
            db.add(media)
        
        # Update listing status
        listing.status = ListingStatus.MEDIA_READY
        listing.error_message = None
    else:
        # Handle error
        listing.status = ListingStatus.ERROR
        listing.error_message = webhook_data.error_message or "Media generation failed"
    
    db.commit()
    
    return {
        "status": "success",
        "message": "Media completion processed",
        "listing_id": listing.id,
        "listing_status": listing.status.value
    }


@router.post("/ebay-complete")
def handle_ebay_complete(
    webhook_data: EbayPublishWebhook,
    db: Session = Depends(get_db)
):
    """Handle eBay publishing completion webhook from n8n."""
    listing = db.query(Listing).filter(Listing.id == webhook_data.listing_id).first()
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    if webhook_data.success:
        # Create published listing record
        published_listing = PublishedListing(
            listing_id=listing.id,
            ebay_item_id=webhook_data.ebay_item_id,
            ebay_url=webhook_data.ebay_url,
            ebay_fees=webhook_data.fees
        )
        db.add(published_listing)
        
        # Update listing status
        listing.status = ListingStatus.PUBLISHED
        listing.error_message = None
    else:
        # Handle error
        listing.status = ListingStatus.ERROR
        listing.error_message = webhook_data.error_message or "eBay publishing failed"
    
    db.commit()
    
    return {
        "status": "success",
        "message": "eBay publish completion processed",
        "listing_id": listing.id,
        "listing_status": listing.status.value,
        "ebay_item_id": webhook_data.ebay_item_id if webhook_data.success else None
    }
