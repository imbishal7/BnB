from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, JSON, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum
import secrets

from core.database import Base


def generate_listing_id():
    """Generate a random 12-character alphanumeric ID for listings."""
    return secrets.token_urlsafe(9)[:12]


class ListingStatus(str, enum.Enum):
    """Listing status enumeration."""
    DRAFT = "draft"
    GENERATING_MEDIA = "generating_media"
    MEDIA_READY = "media_ready"
    APPROVED = "approved"
    PUBLISHING = "publishing"
    PUBLISHED = "published"
    ERROR = "error"


class User(Base):
    """User model."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    ebay_access_token = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    listings = relationship("Listing", back_populates="user", cascade="all, delete-orphan")


class Listing(Base):
    """Listing model."""
    __tablename__ = "listings"
    
    id = Column(String(12), primary_key=True, index=True, default=generate_listing_id)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Basic product info
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category_id = Column(String(50), nullable=True)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    condition_id = Column(String(50), nullable=True)
    
    # Product media and UGC settings
    product_photo_url = Column(String, nullable=True)
    uploaded_image_urls = Column(JSON, nullable=True)  # User uploaded product images
    target_audience = Column(Text, nullable=True)  # ICP - ideal customer profile
    product_features = Column(Text, nullable=True)
    video_setting = Column(Text, nullable=True)  # Scene/setting for video
    
    # Enriched content
    enriched_description = Column(Text, nullable=True)
    
    # Status
    status = Column(Enum(ListingStatus), default=ListingStatus.DRAFT, nullable=False)
    error_message = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="listings")
    media = relationship("Media", back_populates="listing", uselist=False, cascade="all, delete-orphan")
    published_listing = relationship("PublishedListing", back_populates="listing", uselist=False, cascade="all, delete-orphan")


class Media(Base):
    """Media model."""
    __tablename__ = "media"
    
    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(String(12), ForeignKey("listings.id"), nullable=False, unique=True)
    
    # Media URLs (stored as JSON array for images)
    image_urls = Column(JSON, nullable=True)
    video_url = Column(String, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    listing = relationship("Listing", back_populates="media")


class PublishedListing(Base):
    """Published listing model."""
    __tablename__ = "published_listings"
    
    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(String(12), ForeignKey("listings.id"), nullable=False, unique=True)
    
    # eBay details
    ebay_item_id = Column(String, nullable=False)
    ebay_url = Column(String, nullable=False)
    ebay_fees = Column(JSON, nullable=True)
    
    # Timestamps
    published_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    listing = relationship("Listing", back_populates="published_listing")
