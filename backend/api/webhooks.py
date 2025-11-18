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
    print("\n" + "="*80)
    print("🔔 WEBHOOK RECEIVED FROM N8N")
    print("="*80)
    print(f"📦 Raw webhook data:")
    print(f"   listing_id: {webhook_data.listing_id}")
    print(f"   status: {webhook_data.status}")
    print(f"   title: {webhook_data.title}")
    print(f"   description: {webhook_data.description[:100] if webhook_data.description else None}...")
    print(f"   brand: {webhook_data.brand}")
    print(f"   mpn: {webhook_data.mpn}")
    print(f"   condition: {webhook_data.condition}")
    print(f"   price: {webhook_data.price}")
    print(f"   quantity: {webhook_data.quantity}")
    print(f"   category_id: {webhook_data.category_id}")
    print(f"   sku: {webhook_data.sku}")
    print(f"   image_urls: {len(webhook_data.image_urls) if webhook_data.image_urls else 0} images")
    if webhook_data.image_urls:
        for i, url in enumerate(webhook_data.image_urls[:3], 1):  # Show first 3
            print(f"      Image {i}: {url[:80]}...")
    print(f"   video_url: {webhook_data.video_url[:80] if webhook_data.video_url else None}...")
    print(f"   aspects: {webhook_data.aspects}")
    print(f"   error_message: {webhook_data.error_message}")
    print("="*80 + "\n")
    
    listing = db.query(Listing).filter(Listing.id == str(webhook_data.listing_id)).first()
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    if webhook_data.success:
        # Update listing with enhanced data from n8n (if provided)
        if webhook_data.has_enhanced_data:
            if webhook_data.description:
                listing.enriched_description = webhook_data.description
            if webhook_data.title:
                # Update title with enhanced version from n8n
                listing.title = webhook_data.title
            if webhook_data.brand:
                listing.brand = webhook_data.brand
            if webhook_data.mpn:
                listing.mpn = webhook_data.mpn
            if webhook_data.condition:
                listing.condition = webhook_data.condition
            if webhook_data.price:
                # Convert price string to float
                try:
                    listing.price = float(webhook_data.price)
                except (ValueError, TypeError):
                    print(f"⚠️ Could not convert price '{webhook_data.price}' to float")
            if webhook_data.quantity is not None:
                listing.quantity = webhook_data.quantity
            if webhook_data.category_id:
                listing.category_id = webhook_data.category_id
            if webhook_data.sku:
                listing.enriched_sku = webhook_data.sku
            if webhook_data.aspects:
                listing.ebay_aspects = webhook_data.aspects
        
        # Create or update media record
        media = db.query(Media).filter(Media.listing_id == listing.id).first()
        
        # Handle multiple image URLs from n8n
        image_urls = webhook_data.image_urls if webhook_data.image_urls else []
        video_url = webhook_data.video_url
        
        if media:
            media.image_urls = image_urls
            media.video_url = video_url
        else:
            media = Media(
                listing_id=listing.id,
                image_urls=image_urls,
                video_url=video_url
            )
            db.add(media)
        
        # Update listing status
        listing.status = ListingStatus.MEDIA_READY
        listing.error_message = None
        
        print(f"✅ Media ready for listing {listing.id}")
        print(f"   📸 Images: {len(image_urls)} URLs")
        print(f"   🎥 Video: {'Yes' if video_url else 'No'}")
        if webhook_data.has_enhanced_data:
            print(f"   ✨ Enhanced description: Yes")
            print(f"   🏷️  eBay aspects: {len(webhook_data.aspects or {})} attributes")
        
        print("\n💾 SAVED TO DATABASE:")
        print(f"   Listing ID: {listing.id}")
        print(f"   Status: {listing.status}")
        print(f"   Brand: {listing.brand}")
        print(f"   MPN: {listing.mpn}")
        print(f"   Condition: {listing.condition}")
        print(f"   Images in DB: {len(media.image_urls) if media.image_urls else 0}")
        print(f"   Video in DB: {'Yes' if media.video_url else 'No'}")
        print(f"   Enriched description: {'Yes' if listing.enriched_description else 'No'}")
        print("="*80 + "\n")
    else:
        # Handle error
        listing.status = ListingStatus.ERROR
        listing.error_message = webhook_data.error_message or "Media generation failed"
        print(f"❌ Media generation failed for listing {listing.id}: {listing.error_message}")
    
    db.commit()
    
    return {
        "status": "success",
        "message": "Media completion processed",
        "listing_id": listing.id,
        "listing_status": listing.status.value,
        "media_count": len(image_urls) if webhook_data.success else 0,
        "has_video": bool(video_url) if webhook_data.success else False,
        "enhanced": webhook_data.has_enhanced_data
    }


@router.post("/ebay-complete")
def handle_ebay_complete(
    webhook_data: EbayPublishWebhook,
    db: Session = Depends(get_db)
):
    """Handle eBay publishing completion webhook from n8n."""
    listing = db.query(Listing).filter(Listing.id == str(webhook_data.listing_id)).first()
    
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
