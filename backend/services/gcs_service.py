"""Google Cloud Storage service for uploading files."""
import os
import uuid
import httpx
from io import BytesIO
from typing import List
from fastapi import UploadFile
from google.cloud import storage


class GCSService:
    """Service for handling Google Cloud Storage operations."""
    
    def __init__(self, bucket_name: str = "prodcut_assets"):
        """
        Initialize GCS service.
        
        Args:
            bucket_name: Name of the GCS bucket
        """
        self.bucket_name = bucket_name
        self.client = storage.Client()
        self.bucket = self.client.bucket(bucket_name)
    
    def upload_file(self, file: UploadFile, folder: str = "listings") -> str:
        """
        Upload a file to GCS and return its public URL.
        
        Args:
            file: The file to upload
            folder: Folder path in the bucket
            
        Returns:
            Public URL of the uploaded file
        """
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1] if file.filename else ""
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        blob_name = f"{folder}/{unique_filename}"
        
        # Create blob and upload
        blob = self.bucket.blob(blob_name)
        blob.upload_from_file(file.file, content_type=file.content_type)
        
        # With uniform bucket-level access, individual object ACLs don't work
        # The bucket itself must be made public via IAM permissions
        # Return public URL - it will work if bucket has allUsers Storage Object Viewer role
        public_url = blob.public_url
        print(f"✅ Uploaded: {blob_name}")
        print(f"📎 Public URL: {public_url}")
        return public_url
    
    def upload_multiple_files(self, files: List[UploadFile], folder: str = "listings") -> List[str]:
        """
        Upload multiple files to GCS.
        
        Args:
            files: List of files to upload
            folder: Folder path in the bucket
            
        Returns:
            List of public URLs
        """
        urls = []
        for file in files:
            try:
                # Reset file pointer to beginning
                file.file.seek(0)
                url = self.upload_file(file, folder)
                urls.append(url)
            except Exception as e:
                print(f"Error uploading {file.filename}: {str(e)}")
                raise
        
        return urls
    
    def delete_file(self, file_url: str) -> bool:
        """
        Delete a file from GCS using its public URL.
        
        Args:
            file_url: Public URL of the file to delete
            
        Returns:
            True if deleted successfully
        """
        try:
            # Extract blob name from URL
            # Format: https://storage.googleapis.com/{bucket_name}/{blob_name}
            blob_name = file_url.split(f"{self.bucket_name}/")[-1]
            blob = self.bucket.blob(blob_name)
            blob.delete()
            return True
        except Exception as e:
            print(f"Error deleting file: {str(e)}")
            return False
    
    async def download_and_upload_from_url(self, source_url: str, folder: str = "generated") -> str:
        """
        Download an image from a URL and upload it to GCS.
        
        Args:
            source_url: URL of the image to download
            folder: Folder path in the bucket
            
        Returns:
            Public URL of the uploaded file in GCS
        """
        async with httpx.AsyncClient() as client:
            # Download the image
            response = await client.get(source_url, timeout=60.0)
            response.raise_for_status()
            
            # Get content type from response headers
            content_type = response.headers.get('content-type', 'image/png')
            
            # Determine file extension from content type or URL
            if 'png' in content_type or source_url.endswith('.png'):
                extension = '.png'
            elif 'jpeg' in content_type or 'jpg' in content_type or source_url.endswith(('.jpg', '.jpeg')):
                extension = '.jpg'
            elif 'webp' in content_type or source_url.endswith('.webp'):
                extension = '.webp'
            else:
                extension = '.png'  # default
            
            # Generate unique filename
            unique_filename = f"{uuid.uuid4()}{extension}"
            blob_name = f"{folder}/{unique_filename}"
            
            # Upload to GCS
            blob = self.bucket.blob(blob_name)
            blob.upload_from_file(BytesIO(response.content), content_type=content_type)
            
            public_url = blob.public_url
            print(f"✅ Downloaded and uploaded: {blob_name}")
            print(f"📎 Public URL: {public_url}")
            return public_url
    
    async def download_and_upload_multiple_from_urls(self, source_urls: List[str], folder: str = "generated") -> List[str]:
        """
        Download multiple images from URLs and upload them to GCS.
        
        Args:
            source_urls: List of URLs to download
            folder: Folder path in the bucket
            
        Returns:
            List of public URLs in GCS
        """
        uploaded_urls = []
        for url in source_urls:
            try:
                gcs_url = await self.download_and_upload_from_url(url, folder)
                uploaded_urls.append(gcs_url)
            except Exception as e:
                print(f"❌ Error downloading/uploading {url}: {str(e)}")
                # Continue with other images even if one fails
        
        return uploaded_urls


# Create a singleton instance
gcs_service = GCSService()
