"""Google Cloud Storage service for uploading files."""
import os
import uuid
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


# Create a singleton instance
gcs_service = GCSService()
