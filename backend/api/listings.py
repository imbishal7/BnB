from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from models import User, Listing, ListingStatus
from .dependencies import get_current_user
from .listing_schemas import ListingCreate, ListingUpdate, ListingResponse
from services.n8n_client import N8nClient

router = APIRouter(prefix="/listings", tags=["listings"])
n8n_client = N8nClient()


@router.post("", response_model=ListingResponse, status_code=status.HTTP_201_CREATED)
def create_listing(
    listing_data: ListingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new listing."""
    new_listing = Listing(
        user_id=current_user.id,
        title=listing_data.title,
        description=listing_data.description,
        category_id=listing_data.category_id,
        price=listing_data.price,
        quantity=listing_data.quantity,
        condition_id=listing_data.condition_id,
        product_photo_url=listing_data.product_photo_url,
        uploaded_image_urls=listing_data.uploaded_image_urls,
        target_audience=listing_data.target_audience,
        product_features=listing_data.product_features,
        video_setting=listing_data.video_setting,
        status=ListingStatus.DRAFT
    )
    
    db.add(new_listing)
    db.commit()
    db.refresh(new_listing)
    
    return new_listing


@router.get("", response_model=List[ListingResponse])
def get_listings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all listings for the current user."""
    listings = db.query(Listing).filter(Listing.user_id == current_user.id).all()
    return listings


@router.get("/{listing_id}", response_model=ListingResponse)
def get_listing(
    listing_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific listing."""
    listing = db.query(Listing).filter(
        Listing.id == listing_id,
        Listing.user_id == current_user.id
    ).first()
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    return listing


@router.patch("/{listing_id}", response_model=ListingResponse)
def update_listing(
    listing_id: str,
    listing_data: ListingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a listing."""
    listing = db.query(Listing).filter(
        Listing.id == listing_id,
        Listing.user_id == current_user.id
    ).first()
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    # Update fields
    update_data = listing_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(listing, field, value)
    
    db.commit()
    db.refresh(listing)
    
    return listing


@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_listing(
    listing_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a listing."""
    listing = db.query(Listing).filter(
        Listing.id == listing_id,
        Listing.user_id == current_user.id
    ).first()
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    db.delete(listing)
    db.commit()
    return None


@router.post("/{listing_id}/generate-media", response_model=ListingResponse)
async def generate_media(
    listing_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Trigger media generation via n8n workflow."""
    listing = db.query(Listing).filter(
        Listing.id == listing_id,
        Listing.user_id == current_user.id
    ).first()
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    if not listing.product_photo_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product photo URL is required"
        )
    
    # Update status
    listing.status = ListingStatus.GENERATING_MEDIA
    db.commit()
    
    # Trigger n8n workflow
    try:
        await n8n_client.trigger_media_generation(
            listing_id=listing.id,
            product_name=listing.title,
            product_photo_url=listing.product_photo_url,
            target_audience=listing.target_audience or "General audience",
            product_features=listing.product_features or listing.description,
            video_setting=listing.video_setting or "Casual indoor setting"
        )
    except Exception as e:
        listing.status = ListingStatus.ERROR
        listing.error_message = str(e)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to trigger media generation: {str(e)}"
        )
    
    db.refresh(listing)
    return listing


@router.post("/{listing_id}/approve-media", response_model=ListingResponse)
def approve_media(
    listing_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Approve generated media."""
    listing = db.query(Listing).filter(
        Listing.id == listing_id,
        Listing.user_id == current_user.id
    ).first()
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    if listing.status != ListingStatus.MEDIA_READY:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Media is not ready for approval"
        )
    
    # Update status
    listing.status = ListingStatus.APPROVED
    db.commit()
    db.refresh(listing)
    
    return listing


@router.post("/{listing_id}/publish", response_model=ListingResponse)
async def publish_listing(
    listing_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Trigger eBay publishing via n8n workflow."""
    listing = db.query(Listing).filter(
        Listing.id == listing_id,
        Listing.user_id == current_user.id
    ).first()
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    if listing.status != ListingStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Listing must be approved before publishing"
        )
    
    if not listing.media:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Listing must have media before publishing"
        )
    
    # Update status
    listing.status = ListingStatus.PUBLISHING
    db.commit()
    
    # Trigger n8n workflow
    try:
        await n8n_client.trigger_ebay_publish(
            listing_id=listing.id,
            title=listing.title,
            description=listing.enriched_description or listing.description,
            category_id=listing.category_id,
            condition_id=listing.condition_id,
            price=listing.price,
            quantity=listing.quantity,
            image_urls=listing.media.image_urls or [],
            ebay_token=current_user.ebay_access_token
        )
    except Exception as e:
        listing.status = ListingStatus.ERROR
        listing.error_message = str(e)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to trigger eBay publishing: {str(e)}"
        )
    
    db.refresh(listing)
    return listing
