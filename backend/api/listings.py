from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
import os
import sys
import subprocess
import tempfile
import json as json_module

from core.database import get_db
from models import User, Listing, ListingStatus, Media
from .dependencies import get_current_user
from .listing_schemas import ListingCreate, ListingUpdate, ListingResponse
from services.n8n_client import N8nClient
from services.gcs_service import gcs_service
from services.ebay_client import ebay_client
import json
router = APIRouter(prefix="/listings", tags=["listings"])
n8n_client = N8nClient()


@router.post("", response_model=ListingResponse, status_code=status.HTTP_201_CREATED)
async def create_listing(
    listing_data: ListingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    print("listing_data", listing_data)
    """Create a new listing and trigger media generation if requested."""
    new_listing = Listing(
        user_id=current_user.id,
        title=listing_data.title,
        description=listing_data.description,
        category_id=listing_data.category_id,
        price=listing_data.price,
        quantity=listing_data.quantity,
        condition_id=listing_data.condition_id,
        brand=listing_data.brand,
        mpn=listing_data.mpn,
        condition=listing_data.condition,
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
                product_photo_url=new_listing.product_photo_url,  # First uploaded image
                target_audience=new_listing.target_audience or "General audience",
                product_features=new_listing.product_features or new_listing.description,
                video_setting=new_listing.video_setting or "Casual indoor setting",
                generate_image=listing_data.generate_image,
                generate_video=listing_data.generate_video,
                image_prompt=new_listing.image_prompt,
                video_prompt=new_listing.video_prompt,
                model_avatar_url=new_listing.model_avatar_url,
                brand=new_listing.brand,
                mpn=new_listing.mpn,
                condition=new_listing.condition,
                price=new_listing.price,
                quantity=new_listing.quantity,
                description=new_listing.description,
                category_id=new_listing.category_id
            )
            print("UGC Response in listings.py", ugc_response)
            print(type(ugc_response))
            print(ugc_response[0])
            ugc_response = ugc_response[0]
            print(ugc_response)
            print(type(ugc_response))
            
            # Parse n8n response
            # N8N returns direct JSON object: {"sku": "...", "title": "...", "image_urls": [...], ...}
            if ugc_response and isinstance(ugc_response, dict):
                print(f"📦 Received n8n response")
                
                try:
                    ebay_config = ugc_response
                    
                    print(f"✅ Parsed eBay config from n8n:")
                    print(f"   SKU: {ebay_config.get('sku')}")
                    print(f"   Title: {ebay_config.get('title')}")
                    print(f"   Brand: {ebay_config.get('brand')}")
                    print(f"   MPN: {ebay_config.get('mpn')}")
                    print(f"   Price: {ebay_config.get('price')}")
                    print(f"   Quantity: {ebay_config.get('quantity')}")
                    print(f"   Category ID: {ebay_config.get('category_id')}")
                    print(f"   Condition: {ebay_config.get('condition')}")
                    print(f"   Images: {len(ebay_config.get('image_urls', []))} URLs")
                    print(f"   Video: {'Yes' if ebay_config.get('video_url') else 'No'}")
                    print(f"   Aspects: {ebay_config.get('aspects')}")
                    
                    # Extract image URLs
                    temp_image_urls = ebay_config.get('image_urls', [])
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
                    
                    # Extract video URL
                    temp_video_url = ebay_config.get('video_url')
                    if temp_video_url:
                        print(f"📥 Downloading video from n8n: {temp_video_url[:50]}...")
                        try:
                            generated_video_url = await gcs_service.download_and_upload_from_url(
                                temp_video_url,
                                folder=f"generated/listing_{new_listing.id}"
                            )
                            print(f"☁️ Video uploaded to GCS: {generated_video_url}")
                        except Exception as e:
                            print(f"❌ Failed to download/upload video: {str(e)}")
                    
                    # Update listing with enhanced data from n8n
                    if ebay_config.get('description'):
                        new_listing.enriched_description = ebay_config.get('description')
                    if ebay_config.get('title'):
                        # Update title with enhanced version if provided
                        new_listing.title = ebay_config.get('title')
                    if ebay_config.get('brand'):
                        new_listing.brand = ebay_config.get('brand')
                    if ebay_config.get('mpn'):
                        new_listing.mpn = ebay_config.get('mpn')
                    if ebay_config.get('condition'):
                        new_listing.condition = ebay_config.get('condition')
                    if ebay_config.get('price'):
                        new_listing.price = float(ebay_config.get('price'))
                    if ebay_config.get('quantity'):
                        new_listing.quantity = ebay_config.get('quantity')
                    if ebay_config.get('category_id'):
                        new_listing.category_id = ebay_config.get('category_id')
                    if ebay_config.get('sku'):
                        new_listing.enriched_sku = ebay_config.get('sku')
                    if ebay_config.get('aspects'):
                        new_listing.ebay_aspects = ebay_config.get('aspects')
                    
                    print(f"✅ Updated listing with enhanced data from n8n")
                        
                except Exception as e:
                    print(f"❌ Error parsing n8n response: {str(e)}")
                    import traceback
                    traceback.print_exc()
            
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


@router.post("/{listing_id}/publish-to-ebay", response_model=ListingResponse)
async def publish_to_ebay(
    listing_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Publish a listing directly to eBay using eBay Inventory API
    
    This endpoint:
    1. Creates an inventory item on eBay
    2. Creates an offer
    3. Publishes the offer to create a live listing
    """
    # Get the listing
    listing = db.query(Listing).filter(
        Listing.id == listing_id,
        Listing.user_id == current_user.id
    ).first()
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    # Check if listing has media
    if not listing.media or (not listing.media.image_urls and not listing.media.video_url):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Listing must have at least images or video before publishing to eBay"
        )
    
    # Check if already published to eBay
    if listing.ebay_listing_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Listing already published to eBay with ID: {listing.ebay_listing_id}"
        )
    
    # Generate SKU (use our listing ID as base)
    sku = f"BNB-{listing.id}"
    
    # Update status
    listing.status = ListingStatus.PUBLISHING
    db.commit()
    
    try:
        # Get image and video URLs
        image_urls = listing.media.image_urls or []
        video_url = listing.media.video_url
        
        # Map our condition to eBay condition
        condition_map = {
            "new": "NEW",
            "like-new": "LIKE_NEW",
            "used": "USED_EXCELLENT",
            "refurbished": "REFURBISHED"
        }
        ebay_condition = condition_map.get(listing.condition_id, "NEW")
        
        # Default category if not provided (you should map your categories to eBay categories)
        ebay_category_id = getattr(listing, 'ebay_category_id', "11450")  # Default: Clothing, Shoes & Accessories > Men's
        
        print(f"🚀 Publishing listing {listing.id} to eBay...")
        print(f"   SKU: {sku}")
        print(f"   Title: {listing.title}")
        print(f"   Price: ${listing.price}")
        print(f"   Images: {len(image_urls)}")
        print(f"   Video: {'Yes' if video_url else 'No'}")
        
        # Publish to eBay with aspects if available
        result = await ebay_client.publish_listing_to_ebay(
            listing_id=listing.id,
            sku=sku,
            title=listing.title,
            description=listing.enriched_description or listing.description,
            price=float(listing.price),
            quantity=listing.quantity,
            category_id=ebay_category_id,
            image_urls=image_urls,
            video_url=video_url,
            condition=ebay_condition,
            product_aspects=listing.ebay_aspects  # Use aspects from n8n if available
        )
        
        if result["success"]:
            # Update listing with eBay info
            listing.ebay_listing_id = result["ebay_listing_id"]
            listing.ebay_offer_id = result.get("offer_id")
            listing.ebay_sku = result["sku"]
            listing.status = ListingStatus.PUBLISHED
            listing.published_at = datetime.utcnow()
            db.commit()
            
            print(f"✅ Successfully published to eBay: {listing.ebay_listing_id}")
        else:
            # Update with error
            listing.status = ListingStatus.ERROR
            listing.error_message = result.get("error", "Unknown error publishing to eBay")
            db.commit()
            
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("message", "Failed to publish to eBay")
            )
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error publishing to eBay: {str(e)}")
        listing.status = ListingStatus.ERROR
        listing.error_message = f"eBay API Error: {str(e)}"
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to publish to eBay: {str(e)}"
        )
    
    db.refresh(listing)
    return listing


@router.post("/{listing_id}/publish-with-script")
async def publish_with_script(
    listing_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Publish listing to eBay using the standalone ebay.py script.
    This endpoint creates a temporary product_config.py and runs ebay.py.
    """
    # Get the listing
    listing = db.query(Listing).filter(
        Listing.id == listing_id,
        Listing.user_id == current_user.id
    ).first()
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    # Check if listing has media
    if not listing.media or (not listing.media.image_urls and not listing.media.video_url):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Listing must have at least images or video before publishing"
        )
    
    # Prepare product data from listing
    product_data = {
        "sku": listing.enriched_sku or f"BNB-{listing.id}",
        "title": listing.title,
        "description": listing.enriched_description or listing.description,
        "price": str(listing.price),
        "quantity": listing.quantity,
        "category_id": listing.category_id or "88433",
        "image_urls": listing.media.image_urls or [],
        "brand": listing.brand or "Generic",
        "mpn": listing.mpn or "Does Not Apply",
        "condition": listing.condition or "NEW"
    }
    
    # Add video URL if available
    if listing.media.video_url:
        product_data["video_url"] = listing.media.video_url
    
    # Add aspects if available
    if listing.ebay_aspects:
        product_data["aspects"] = listing.ebay_aspects
    else:
        # Default aspects
        product_data["aspects"] = {
            "Brand": [product_data["brand"]],
            "MPN": [product_data["mpn"]],
        }
    
    print(f"🚀 Publishing listing {listing_id} to eBay using script...")
    print(f"   Product data: {json_module.dumps(product_data, indent=2)}")
    
    # Update listing status
    listing.status = ListingStatus.PUBLISHING
    db.commit()
    
    try:
        # Create temporary config file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, dir=os.path.dirname(__file__)) as temp_config:
            temp_config.write(f"product_data = {json_module.dumps(product_data, indent=2)}\n")
            temp_config_path = temp_config.name
        
        print(f"📝 Created temp config: {temp_config_path}")
        
        # Get path to ebay.py (in BnB root directory)
        backend_dir = os.path.dirname(os.path.dirname(__file__))  # Go up from api/ to backend/
        bnb_dir = os.path.dirname(backend_dir)  # Go up from backend/ to BnB/
        ebay_script_path = os.path.join(bnb_dir, "ebay.py")
        
        if not os.path.exists(ebay_script_path):
            raise Exception(f"ebay.py not found at {ebay_script_path}")
        
        print(f"📍 Using ebay.py at: {ebay_script_path}")
        
        # Run ebay.py with the temp config
        result = subprocess.run(
            [sys.executable, ebay_script_path, temp_config_path],
            capture_output=True,
            text=True,
            timeout=120  # 2 minute timeout
        )
        
        # Clean up temp file
        try:
            os.unlink(temp_config_path)
        except Exception as e:
            print(f"⚠️  Failed to delete temp config: {e}")
        
        print(f"📤 Script output:\n{result.stdout}")
        
        if result.returncode != 0:
            print(f"❌ Script error:\n{result.stderr}")
            raise Exception(f"Script failed with return code {result.returncode}: {result.stderr}")
        
        # Parse output to extract listing ID and URL
        # The script prints: "Listing ID: <id>" and "View your listing: <url>"
        listing_id_match = None
        ebay_url = None
        offer_id_match = None
        
        for line in result.stdout.split('\n'):
            if "Listing ID:" in line:
                listing_id_match = line.split("Listing ID:")[1].strip()
            elif "Offer ID:" in line:
                offer_id_match = line.split("Offer ID:")[1].strip()
            elif "View your listing:" in line or "https://sandbox.ebay.com/itm/" in line:
                # Extract URL from line
                for word in line.split():
                    if "https://" in word:
                        ebay_url = word.strip()
                        break
        
        if not listing_id_match or not ebay_url:
            raise Exception("Could not extract listing ID or URL from script output")
        
        # Update listing with eBay info
        listing.ebay_listing_id = listing_id_match
        if offer_id_match:
            listing.ebay_offer_id = offer_id_match
        listing.ebay_sku = product_data["sku"]
        listing.status = ListingStatus.PUBLISHED
        listing.published_at = datetime.utcnow()
        db.commit()
        
        print(f"✅ Successfully published to eBay: {listing_id_match}")
        print(f"🔗 URL: {ebay_url}")
        
        return {
            "success": True,
            "listing_id": listing_id_match,
            "offer_id": offer_id_match,
            "ebay_url": ebay_url,
            "message": "Successfully published to eBay Sandbox"
        }
        
    except subprocess.TimeoutExpired:
        listing.status = ListingStatus.ERROR
        listing.error_message = "Publishing timed out after 2 minutes"
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Publishing timed out - eBay API might be slow or unresponsive"
        )
    except Exception as e:
        print(f"❌ Error running ebay.py: {str(e)}")
        listing.status = ListingStatus.ERROR
        listing.error_message = f"Script Error: {str(e)}"
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to publish to eBay: {str(e)}"
        )
