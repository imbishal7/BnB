"""
Product configuration template for eBay listings.
Fill in this dictionary and pass it to ebay.py to create a listing.
"""

product_data = {
    # Required fields
    "sku": "VACUUM-FLASK-easy-SS-0000005",
    "title": "32oz Stainless Steel Vacuum Insulated Water big new  - Hot/Cold 24H",
    "description": "Experience ultimate temperature control with this premium 32oz vacuum insulated water bottle! Crafted from high-grade 18/8 stainless steel with double-wall construction, this bottle keeps your drinks ice-cold for up to 24 hours or piping hot for 12+ hours. The leak-proof, BPA-free lid ensures worry-free transport, while the wide mouth opening makes filling, drinking, and cleaning incredibly easy. Perfect companion for fitness enthusiasts, outdoor adventurers, office professionals, and daily commuters. Durable rust-proof finish stands up to years of use. Eco-friendly design helps reduce single-use plastic waste. Fits most car cup holders. FDA-approved food-grade materials. Whether you're hitting the gym, hiking trails, or staying hydrated at your desk, this versatile flask delivers reliable performance every time.",
    "price": "29.99",
    "quantity": 50,
    "category_id": "88433",
    
    # Images
    "image_urls": [
        "https://tempfile.aiquickdraw.com/workers/nano/image_1763341194687_cv1jv0_1x1_1024x1024.png",
        "https://tempfile.aiquickdraw.com/workers/nano/image_1763341193895_pdrn6c_1x1_1024x1024.png"
    ],
    
    # Video (optional) - Provide video URL, script will upload to eBay automatically
    "video_url": "https://tempfile.aiquickdraw.com/v/3de204b84dce54e140b9e45a5b7f4ceb_1763340809.mp4",
    
    # Product aspects/attributes
    "aspects": {
        "Brand": ["Generic"],
        "MPN": ["Does Not Apply"],
        "Type": ["Water Bottle"],
        "Material": ["Stainless Steel"],
        "Capacity": ["32 oz"],
        "Features": ["Insulated", "Leak-Proof", "BPA-Free", "Vacuum Flask"],
        "Color": ["Silver"],
        "Country of Origin": ["China"]
    },
    
    # Additional required fields
    "brand": "Generic",
    "mpn": "Does Not Apply",
    "condition": "NEW"
}