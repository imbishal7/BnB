#!/bin/bash

# Setup script for image upload functionality

echo "Installing Google Cloud Storage dependency..."
cd backend
source venv/bin/activate
pip install google-cloud-storage==2.18.2

echo ""
echo "✅ Google Cloud Storage SDK installed!"
echo ""
echo "📝 Next steps:"
echo "1. Make sure you have Google Cloud credentials configured"
echo "2. Set up Application Default Credentials (ADC):"
echo "   gcloud auth application-default login"
echo "3. Or set GOOGLE_APPLICATION_CREDENTIALS environment variable:"
echo "   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json"
echo ""
echo "4. Verify the GCS bucket 'prodcut_assets' exists in your project"
echo "5. Restart the backend server"
echo ""
echo "For more info: https://cloud.google.com/docs/authentication/application-default-credentials"
