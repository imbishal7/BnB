# Image Upload Feature - Implementation Guide

## Overview

Added functionality to upload multiple product images to Google Cloud Storage when creating a listing.

## Backend Changes

### 1. New Dependencies
- Added `google-cloud-storage==2.18.2` to `requirements.txt`

### 2. New Service: `services/gcs_service.py`
- **GCSService class**: Handles all GCS operations
  - `upload_file()`: Upload single file to GCS
  - `upload_multiple_files()`: Upload multiple files
  - `delete_file()`: Delete file from GCS
  - Bucket name: `prodcut_assets`
  - Files are made publicly accessible
  - Returns public URLs

### 3. New API Endpoint: `api/upload.py`
- **POST `/upload/images`**: Upload product images
  - Accepts multiple files via multipart/form-data
  - Validates file types (JPEG, PNG, WebP, GIF)
  - Validates file sizes (max 10MB per file)
  - Requires authentication
  - Stores files in `listings/user_{user_id}/` folder
  - Returns: `{ urls: string[], count: number }`

### 4. Database Model Update
- Added `uploaded_image_urls` (JSON) field to `Listing` model
- Stores array of public GCS URLs

### 5. Schema Updates
- Updated `ListingCreate`, `ListingUpdate`, `ListingResponse` schemas
- Added `uploaded_image_urls: Optional[list[str]]` field

## Frontend Changes

### 1. API Client (`lib/api.ts`)
- Added `UploadResponse` interface
- Added `uploadImages(files: File[]): Promise<UploadResponse>` function
- Sends multipart/form-data with authentication token

### 2. Listing Creation Page
New state:
- `uploadedImages`: Array of File objects
- `uploadedImageUrls`: Array of GCS URLs after upload
- `isUploading`: Upload progress indicator

New handlers:
- `handleImageUpload()`: Validates and adds images
- `removeUploadedImage()`: Remove image from list
- `uploadImagesToCloud()`: Upload to GCS before creating listing

New UI section:
- Drag & drop upload area
- Image preview grid with remove buttons
- Upload progress indicator
- File validation messages

## Google Cloud Setup

### Option 1: Application Default Credentials (Development)
```bash
gcloud auth application-default login
```

### Option 2: Service Account Key (Production)
1. Create a service account in Google Cloud Console
2. Grant "Storage Object Admin" role for the bucket
3. Download JSON key file
4. Set environment variable:
```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

### Bucket Setup
1. Create bucket named `prodcut_assets` in GCS
2. Set appropriate permissions (public read if needed)
3. Configure CORS if uploading from browser directly

## Installation

Run the setup script:
```bash
chmod +x setup_image_upload.sh
./setup_image_upload.sh
```

Or manually:
```bash
cd backend
source venv/bin/activate
pip install google-cloud-storage==2.18.2
```

## Usage Flow

1. **User uploads images**: 
   - Click upload area or drag & drop
   - Multiple images can be selected
   - Preview shown immediately

2. **Validation**:
   - File type checked (must be image)
   - File size checked (max 10MB each)
   - Errors displayed if validation fails

3. **Form submission**:
   - Images uploaded to GCS first
   - Returns public URLs
   - URLs included in listing creation request
   - Stored in `uploaded_image_urls` field

4. **Access images**:
   - URLs are publicly accessible
   - Can be used for listing display
   - Can be used as source for AI generation

## File Naming

- Each file gets unique UUID-based name
- Original extension preserved
- Stored in user-specific folders: `listings/user_{user_id}/{uuid}.{ext}`
- Example: `listings/user_1/a7f3c8b9-4e5d-6f7a-8b9c-0d1e2f3a4b5c.jpg`

## Security Considerations

1. **File validation**: Type and size checked on both frontend and backend
2. **Authentication**: Upload endpoint requires valid JWT token
3. **Isolation**: Each user's files stored in separate folders
4. **Cleanup**: Consider implementing deletion when listing is deleted

## API Examples

### Upload Images
```bash
curl -X POST http://localhost:8000/upload/images \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@/path/to/image1.jpg" \
  -F "files=@/path/to/image2.png"
```

Response:
```json
{
  "urls": [
    "https://storage.googleapis.com/prodcut_assets/listings/user_1/abc123.jpg",
    "https://storage.googleapis.com/prodcut_assets/listings/user_1/def456.png"
  ],
  "count": 2
}
```

### Create Listing with Uploaded Images
```bash
curl -X POST http://localhost:8000/listings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Product Name",
    "description": "Description",
    "price": 29.99,
    "quantity": 10,
    "category_id": "1",
    "condition_id": "1000",
    "uploaded_image_urls": [
      "https://storage.googleapis.com/prodcut_assets/listings/user_1/abc123.jpg",
      "https://storage.googleapis.com/prodcut_assets/listings/user_1/def456.png"
    ]
  }'
```

## Troubleshooting

### "Could not authenticate" error
- Make sure ADC is set up: `gcloud auth application-default login`
- Or set `GOOGLE_APPLICATION_CREDENTIALS` environment variable

### "Bucket not found" error
- Verify bucket name is correct: `prodcut_assets`
- Check if bucket exists in your GCP project
- Verify service account has permissions

### Upload fails in frontend
- Check backend is running and accessible
- Verify JWT token is valid
- Check file size and type constraints
- Look at browser console for detailed errors

### Images not displaying
- Verify URLs are publicly accessible
- Check bucket permissions
- Try accessing URL directly in browser

## Future Enhancements

1. **Image optimization**: Resize/compress before upload
2. **Direct browser upload**: Upload to GCS directly from browser
3. **Progress tracking**: Show upload progress per file
4. **Image cropping**: Allow users to crop images
5. **Cleanup**: Automatically delete images when listing deleted
6. **CDN**: Use Cloud CDN for faster image delivery
