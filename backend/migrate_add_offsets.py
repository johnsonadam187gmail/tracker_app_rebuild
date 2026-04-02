"""Migration script to add image_offset_x and image_offset_y columns to users table."""

import sqlite3
import os


def migrate():
    # Database is in the backend folder
    db_path = os.path.join(os.path.dirname(__file__), "ckb_tracker.db")

    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Check if columns exist
    cursor.execute("PRAGMA table_info(users)")
    columns = [col[1] for col in cursor.fetchall()]

    if "image_offset_x" not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN image_offset_x FLOAT DEFAULT 0.0")
        print("Added image_offset_x column")

    if "image_offset_y" not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN image_offset_y FLOAT DEFAULT 0.0")
        print("Added image_offset_y column")

    conn.commit()
    conn.close()
    print("Migration complete!")


if __name__ == "__main__":
    migrate()
