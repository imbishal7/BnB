from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from models import User, Listing, ListingStatus, Media
from .dependencies import get_current_user
from .listing_schemas import ListingCreate, ListingUpdate, ListingResponse
from services.n8n_client import N8nClient
from services.gcs_service import gcs_service

router = APIRouter(prefix="/listings", tags=["listings"])
n8n_client = N8nClient()


@router.post("", response_model=ListingResponse, status_code=status.HTTP_201_CREATED)
async def create_listing(
    listing_data: ListingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new listing and trigger media generation if requested."""
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
        model_avatar_url=listing_data.model_avatar_url,
        target_audience=listing_data.target_audience,
        product_features=listing_data.product_features,
        video_setting=listing_data.video_setting,
        image_prompt=listing_data.image_prompt,
        video_prompt=listing_data.video_prompt,
        status=ListingStatus.DRAFT
    )
    
    db.add(new_listing)
    db.commit()
    db.refresh(new_listing)
    
    # Trigger media generation if requested
    if listing_data.generate_image or listing_data.generate_video:
        if not listing_data.product_photo_url:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product photo is required for media generation"
            )
        
        # Update status to generating
        new_listing.status = ListingStatus.GENERATING_MEDIA
        db.commit()
        
        # Trigger n8n workflows asynchronously
        try:
            generated_image_urls = []
            generated_video_url = None
            
            # Trigger unified UGC generation
            media_types = []
            if listing_data.generate_image:
                media_types.append("images")
            if listing_data.generate_video:
                media_types.append("video")
            
            print(f"🎨 Generating {' and '.join(media_types)} for listing {new_listing.id}...")
            
            ugc_response = await n8n_client.trigger_ugc_generation(
                listing_id=new_listing.id,
                product_name=new_listing.title,
                product_photo_url=new_listing.product_photo_url,
                target_audience=new_listing.target_audience or "General audience",
                product_features=new_listing.product_features or new_listing.description,
                video_setting=new_listing.video_setting or "Casual indoor setting",
                generate_image=listing_data.generate_image,
                generate_video=listing_data.generate_video,
                image_prompt=new_listing.image_prompt,
                video_prompt=new_listing.video_prompt,
                model_avatar_url=new_listing.model_avatar_url
            )
            
            # Parse n8n response
            # Response format when both are generated: 
            # [{"video_url": "..."}, {"data": [{"image_url": "..."}, ...]}]
            if ugc_response and isinstance(ugc_response, list):
                print(f"📦 Received n8n response with {len(ugc_response)} item(s)")
                
                # Parse video from response
                if listing_data.generate_video:
                    video_obj = None
                    # Look for video_url in any of the array items
                    for item in ugc_response:
                        if isinstance(item, dict) and "video_url" in item:
                            video_obj = item
                            break
                    
                    if video_obj and video_obj.get("video_url"):
                        temp_video_url = video_obj["video_url"]
                        print(f"📥 Downloading video from n8n: {temp_video_url[:50]}...")
                        try:
                            generated_video_url = await gcs_service.download_and_upload_from_url(
                                temp_video_url,
                                folder=f"generated/listing_{new_listing.id}"
                            )
                            print(f"☁️ Video uploaded to GCS: {generated_video_url}")
                        except Exception as e:
                            print(f"❌ Failed to download/upload video: {str(e)}")
                
                # Parse images from response
                if listing_data.generate_image:
                    image_obj = None
                    # Look for data array with image_urls in any of the array items
                    for item in ugc_response:
                        if isinstance(item, dict) and "data" in item:
                            image_obj = item
                            break
                    
                    if image_obj and image_obj.get("data"):
                        data_array = image_obj["data"]
                        if isinstance(data_array, list):
                            temp_image_urls = [
                                item.get("image_url") 
                                for item in data_array 
                                if isinstance(item, dict) and item.get("image_url")
                            ]
                            
                            if temp_image_urls:
                                print(f"📥 Downloading {len(temp_image_urls)} images from n8n")
                                try:
                                    generated_image_urls = await gcs_service.download_and_upload_multiple_from_urls(
                                        temp_image_urls,
                                        folder=f"generated/listing_{new_listing.id}"
                                    )
                                    print(f"☁️ Uploaded {len(generated_image_urls)} images to GCS")
                                except Exception as e:
                                    print(f"❌ Failed to download/upload images: {str(e)}")
            
            # Save media to database if any generated
            if generated_image_urls or generated_video_url:
                # Check if media record exists
                media = db.query(Media).filter(Media.listing_id == new_listing.id).first()
                if media:
                    # Update existing media
                    if generated_image_urls:
                        media.image_urls = generated_image_urls
                    if generated_video_url:
                        media.video_url = generated_video_url
                else:
                    # Create new media record
                    media = Media(
                        listing_id=new_listing.id,
                        image_urls=generated_image_urls if generated_image_urls else None,
                        video_url=generated_video_url
                    )
                    db.add(media)
                
                # Update listing status to media ready
                new_listing.status = ListingStatus.MEDIA_READY
                db.commit()
                print(f"✅ Media saved to database for listing {new_listing.id}")
            else:
                # No media generated, but no error either
                new_listing.status = ListingStatus.DRAFT
                db.commit()
                
        except Exception as e:
            # Log error but don't fail the listing creation
            print(f"❌ Error in media generation: {str(e)}")
            new_listing.status = ListingStatus.ERROR
            new_listing.error_message = f"Failed to trigger media generation: {str(e)}"
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
    generate_image: bool = True,
    generate_video: bool = True,
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
    
    # Validate at least one generation type is requested
    if not generate_image and not generate_video:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must request at least image or video generation"
        )
    
    # Update status
    listing.status = ListingStatus.GENERATING_MEDIA
    db.commit()
    
    # Trigger n8n unified workflow
    try:
        result = await n8n_client.trigger_ugc_generation(
            listing_id=listing.id,
            product_name=listing.title,
            product_photo_url=listing.product_photo_url,
            target_audience=listing.target_audience or "General audience",
            product_features=listing.product_features or listing.description,
            video_setting=listing.video_setting or "Casual indoor setting",
            generate_image=generate_image,
            generate_video=generate_video,
            image_prompt=listing.image_prompt,
            video_prompt=listing.video_prompt,
            model_avatar_url=listing.model_avatar_url
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
