"""Upload endpoints for handling file uploads."""
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends
from pydantic import BaseModel

from services.gcs_service import gcs_service
from .dependencies import get_current_user
from models import User

router = APIRouter(prefix="/upload", tags=["upload"])


class UploadResponse(BaseModel):
    """Schema for upload response."""
    urls: List[str]
    count: int


@router.post("/images", response_model=UploadResponse)
async def upload_images(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Upload multiple product images to Google Cloud Storage.
    
    Args:
        files: List of image files to upload
        current_user: Authenticated user
        
    Returns:
        List of public URLs for uploaded images
    """
    # Validate file types
    allowed_types = {"image/jpeg", "image/png", "image/jpg", "image/webp", "image/gif"}
    for file in files:
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type: {file.content_type}. Allowed types: {', '.join(allowed_types)}"
            )
    
    # Validate file sizes (max 10MB per file)
    max_size = 10 * 1024 * 1024  # 10MB
    for file in files:
        file.file.seek(0, 2)  # Seek to end
        size = file.file.tell()
        file.file.seek(0)  # Reset to beginning
        
        if size > max_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File {file.filename} is too large. Maximum size is 10MB."
            )
    
    try:
        # Upload to GCS - store directly in listings folder without user subdirectory
        urls = gcs_service.upload_multiple_files(files, folder="listings")
        
        return UploadResponse(urls=urls, count=len(urls))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload images: {str(e)}"
        )
