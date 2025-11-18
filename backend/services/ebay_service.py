"""
eBay API Service
Handles authentication and publishing items to eBay marketplace.
"""
import os
import requests
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

try:
    from core.config import settings
    EBAY_CLIENT_ID = settings.ebay_client_id
    EBAY_CLIENT_SECRET = settings.ebay_client_secret
    EBAY_SANDBOX = settings.ebay_sandbox.lower() == 'true'
except ImportError:
    # Fallback for standalone usage
    EBAY_CLIENT_ID = os.getenv('EBAY_CLIENT_ID', '')
    EBAY_CLIENT_SECRET = os.getenv('EBAY_CLIENT_SECRET', '')
    EBAY_SANDBOX = os.getenv('EBAY_SANDBOX', 'true').lower() == 'true'


class EbayService:
    """Service for interacting with eBay APIs."""
    
    def __init__(self):
        """Initialize eBay service with credentials from environment."""
        self.client_id = EBAY_CLIENT_ID
        self.client_secret = EBAY_CLIENT_SECRET
        self.sandbox_mode = EBAY_SANDBOX
        
        # API endpoints
        if self.sandbox_mode:
            self.auth_url = 'https://api.sandbox.ebay.com/identity/v1/oauth2/token'
            self.inventory_base = 'https://api.sandbox.ebay.com/sell/inventory/v1'
        else:
            self.auth_url = 'https://api.ebay.com/identity/v1/oauth2/token'
            self.inventory_base = 'https://api.ebay.com/sell/inventory/v1'
        
        self.access_token = None
        self.token_expiry = None
    
    def get_access_token(self) -> Optional[str]:
        """
        Get OAuth2 access token for eBay API.
        Uses client credentials grant type.
        
        Returns:
            Access token string or None if failed
        """
        try:
            # Check if we have a valid cached token
            if self.access_token and self.token_expiry and datetime.now() < self.token_expiry:
                return self.access_token
            
            headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
            }
            data = {
                'grant_type': 'client_credentials',
                'scope': 'https://api.ebay.com/oauth/api_scope',
            }
            
            response = requests.post(
                self.auth_url,
                headers=headers,
                auth=(self.client_id, self.client_secret),
                data=data,
                timeout=30
            )
            response.raise_for_status()
            
            token_data = response.json()
            self.access_token = token_data.get('access_token')
            expires_in = token_data.get('expires_in', 7200)  # Default 2 hours
            self.token_expiry = datetime.now() + timedelta(seconds=expires_in - 300)  # 5 min buffer
            
            print(f"✅ eBay access token obtained (expires in {expires_in}s)")
            return self.access_token
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Failed to get eBay access token: {e}")
            return None
    
    def create_inventory_item(self, sku: str, product_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create or update an inventory item in eBay.
        
        Args:
            sku: Stock Keeping Unit (unique identifier)
            product_data: Product details including title, description, price, etc.
            
        Returns:
            API response dictionary
        """
        token = self.get_access_token()
        if not token:
            return {'errors': [{'message': 'Failed to authenticate with eBay'}]}
        
        try:
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json',
                'Content-Language': 'en-US',
            }
            
            # Format product data according to eBay Inventory API schema
            inventory_item = {
                "availability": {
                    "shipToLocationAvailability": {
                        "quantity": product_data.get('quantity', 1)
                    }
                },
                "condition": product_data.get('condition', 'NEW'),
                "product": {
                    "title": product_data.get('title'),
                    "description": product_data.get('description'),
                    "aspects": product_data.get('aspects', {}),
                    "imageUrls": product_data.get('image_urls', []),
                    "videoIds": product_data.get('video_ids', [])
                }
            }
            
            response = requests.put(
                f'{self.inventory_base}/inventory_item/{sku}',
                headers=headers,
                json=inventory_item,
                timeout=30
            )
            
            if response.status_code in [200, 201, 204]:
                print(f"✅ Inventory item created: {sku}")
                return {'success': True, 'sku': sku}
            else:
                error_data = response.json() if response.text else {}
                print(f"⚠️ Error creating inventory item: {error_data}")
                return error_data
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Failed to create inventory item: {e}")
            return {'errors': [{'message': str(e)}]}
    
    def create_offer(self, sku: str, offer_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create an offer for an inventory item.
        
        Args:
            sku: Stock Keeping Unit
            offer_data: Offer details including price, marketplace, listing policies
            
        Returns:
            API response with offer_id
        """
        token = self.get_access_token()
        if not token:
            return {'errors': [{'message': 'Failed to authenticate with eBay'}]}
        
        try:
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json',
                'Content-Language': 'en-US',
            }
            
            offer = {
                "sku": sku,
                "marketplaceId": offer_data.get('marketplace_id', 'EBAY_US'),
                "format": offer_data.get('format', 'FIXED_PRICE'),
                "availableQuantity": offer_data.get('quantity', 1),
                "categoryId": offer_data.get('category_id'),
                "listingDescription": offer_data.get('description'),
                "listingPolicies": {
                    "fulfillmentPolicyId": offer_data.get('fulfillment_policy_id'),
                    "paymentPolicyId": offer_data.get('payment_policy_id'),
                    "returnPolicyId": offer_data.get('return_policy_id')
                },
                "pricingSummary": {
                    "price": {
                        "currency": offer_data.get('currency', 'USD'),
                        "value": str(offer_data.get('price'))
                    }
                }
            }
            
            response = requests.post(
                f'{self.inventory_base}/offer',
                headers=headers,
                json=offer,
                timeout=30
            )
            response.raise_for_status()
            
            result = response.json()
            offer_id = result.get('offerId')
            print(f"✅ Offer created: {offer_id}")
            return {'success': True, 'offer_id': offer_id}
            
        except requests.exceptions.RequestException as e:
            error_data = e.response.json() if hasattr(e, 'response') and e.response.text else {}
            print(f"❌ Failed to create offer: {error_data or str(e)}")
            return {'errors': [error_data or {'message': str(e)}]}
    
    def publish_offer(self, offer_id: str) -> Dict[str, Any]:
        """
        Publish an offer to make it live on eBay.
        
        Args:
            offer_id: The offer ID to publish
            
        Returns:
            API response with listing_id and eBay URL
        """
        token = self.get_access_token()
        if not token:
            return {'errors': [{'message': 'Failed to authenticate with eBay'}]}
        
        try:
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json',
                'Content-Language': 'en-US',
            }
            
            response = requests.post(
                f'{self.inventory_base}/offer/{offer_id}/publish',
                headers=headers,
                timeout=30
            )
            response.raise_for_status()
            
            result = response.json()
            listing_id = result.get('listingId')
            
            # Construct eBay URL
            if self.sandbox_mode:
                ebay_url = f"https://www.sandbox.ebay.com/itm/{listing_id}"
            else:
                ebay_url = f"https://www.ebay.com/itm/{listing_id}"
            
            print(f"✅ Offer published: {listing_id}")
            print(f"🔗 eBay URL: {ebay_url}")
            
            return {
                'success': True,
                'listing_id': listing_id,
                'ebay_url': ebay_url,
                'offer_id': offer_id
            }
            
        except requests.exceptions.RequestException as e:
            error_data = e.response.json() if hasattr(e, 'response') and e.response.text else {}
            print(f"❌ Failed to publish offer: {error_data or str(e)}")
            return {'errors': [error_data or {'message': str(e)}]}
    
    def publish_item_to_ebay(
        self,
        title: str,
        description: str,
        price: float,
        quantity: int,
        category_id: str,
        image_urls: list,
        condition: str = 'NEW',
        sku: Optional[str] = None,
        video_ids: Optional[list] = None,
        fulfillment_policy_id: Optional[str] = None,
        payment_policy_id: Optional[str] = None,
        return_policy_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Complete workflow to publish an item on eBay.
        
        Args:
            title: Product title
            description: Product description
            price: Product price in USD
            quantity: Available quantity
            category_id: eBay category ID
            image_urls: List of image URLs
            condition: Item condition (NEW, USED, etc.)
            sku: Stock Keeping Unit (auto-generated if not provided)
            video_ids: List of eBay video IDs
            fulfillment_policy_id: Shipping policy ID
            payment_policy_id: Payment policy ID
            return_policy_id: Return policy ID
            
        Returns:
            Dictionary with success status, listing_id, and ebay_url
        """
        try:
            # Generate SKU if not provided
            if not sku:
                sku = f"SKU-{datetime.now().strftime('%Y%m%d%H%M%S')}"
            
            print(f"📦 Publishing item to eBay: {title}")
            
            # Step 1: Create inventory item
            product_data = {
                'title': title,
                'description': description,
                'quantity': quantity,
                'condition': condition,
                'image_urls': image_urls,
                'video_ids': video_ids or []
            }
            
            inventory_result = self.create_inventory_item(sku, product_data)
            if inventory_result.get('errors'):
                return inventory_result
            
            # Step 2: Create offer
            offer_data = {
                'marketplace_id': 'EBAY_US',
                'category_id': category_id,
                'description': description,
                'price': price,
                'quantity': quantity,
                'currency': 'USD',
                'format': 'FIXED_PRICE',
                'fulfillment_policy_id': fulfillment_policy_id,
                'payment_policy_id': payment_policy_id,
                'return_policy_id': return_policy_id
            }
            
            offer_result = self.create_offer(sku, offer_data)
            if offer_result.get('errors'):
                return offer_result
            
            offer_id = offer_result.get('offer_id')
            
            # Step 3: Publish offer
            publish_result = self.publish_offer(offer_id)
            
            return publish_result
            
        except Exception as e:
            print(f"❌ Error in publish workflow: {e}")
            return {'errors': [{'message': str(e)}]}


# Singleton instance
ebay_service = EbayService()
