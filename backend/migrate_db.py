#!/usr/bin/env python3
"""
Database migration script to add image_prompt and video_prompt columns.
Run this script to update your existing database schema.
"""

import sqlite3
import sys
from pathlib import Path

def migrate_database():
    """Add image_prompt and video_prompt columns to listings table."""
    
    # Path to database
    db_path = Path(__file__).parent / "bnb.db"
    
    if not db_path.exists():
        print(f"❌ Database not found at {db_path}")
        print("ℹ️  Start the application first to create the database.")
        sys.exit(1)
    
    print(f"🔄 Migrating database at {db_path}...")
    
    try:
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(listings)")
        columns = [row[1] for row in cursor.fetchall()]
        
        migrations_applied = []
        
        # Add image_prompt column if it doesn't exist
        if "image_prompt" not in columns:
            print("  ➕ Adding image_prompt column...")
            cursor.execute("ALTER TABLE listings ADD COLUMN image_prompt TEXT")
            migrations_applied.append("image_prompt")
        else:
            print("  ✓ image_prompt column already exists")
        
        # Add video_prompt column if it doesn't exist
        if "video_prompt" not in columns:
            print("  ➕ Adding video_prompt column...")
            cursor.execute("ALTER TABLE listings ADD COLUMN video_prompt TEXT")
            migrations_applied.append("video_prompt")
        else:
            print("  ✓ video_prompt column already exists")
        
        # Add model_avatar_url column if it doesn't exist
        if "model_avatar_url" not in columns:
            print("  ➕ Adding model_avatar_url column...")
            cursor.execute("ALTER TABLE listings ADD COLUMN model_avatar_url VARCHAR")
            migrations_applied.append("model_avatar_url")
        else:
            print("  ✓ model_avatar_url column already exists")
        
        # Commit changes
        conn.commit()
        
        if migrations_applied:
            print(f"\n✅ Migration complete! Added columns: {', '.join(migrations_applied)}")
        else:
            print("\n✅ Database is already up to date!")
        
        # Display updated schema
        print("\n📋 Current listings table schema:")
        cursor.execute("PRAGMA table_info(listings)")
        for row in cursor.fetchall():
            col_id, name, col_type, not_null, default, pk = row
            nullable = "NOT NULL" if not_null else "NULL"
            pk_str = " PRIMARY KEY" if pk else ""
            print(f"  - {name}: {col_type} ({nullable}){pk_str}")
        
        conn.close()
        
    except sqlite3.Error as e:
        print(f"❌ Database error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("=" * 60)
    print("🗄️  Database Migration Script")
    print("=" * 60)
    print()
    migrate_database()
    print()
    print("=" * 60)

