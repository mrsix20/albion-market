import sqlite3
import os
import threading
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from schemas.market import AODPPriceData

# Path to SQLite database file inside the workspace
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "private_market.db")
db_lock = threading.Lock()

def init_db():
    """Initializes the SQLite database and ensures WAL mode for high concurrency."""
    try:
        with db_lock:
            conn = sqlite3.connect(DB_PATH, check_same_thread=False)
            cursor = conn.cursor()
            # Enable WAL mode for performance
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
            
            # Create table for private prices
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS private_prices (
                    user_id TEXT,
                    item_id TEXT,
                    city TEXT,
                    quality INTEGER,
                    sell_price_min INTEGER,
                    sell_price_min_date TEXT,
                    sell_price_max INTEGER,
                    sell_price_max_date TEXT,
                    buy_price_min INTEGER,
                    buy_price_min_date TEXT,
                    buy_price_max INTEGER,
                    buy_price_max_date TEXT,
                    buy_price_max_quantity INTEGER,
                    sell_price_min_quantity INTEGER,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (user_id, item_id, city, quality)
                )
            """)
            
            # Create table for BM tiers
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS bm_tiers (
                    user_id TEXT,
                    item_id TEXT,
                    quality INTEGER,
                    price INTEGER,
                    qty INTEGER,
                    date TEXT,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (user_id, item_id, quality, price)
                )
            """)
            
            conn.commit()
            conn.close()
    except Exception as e:
        print(f"DB Init Error: {e}")

# Initialize DB on module load
init_db()

def cleanup_old_data():
    """Deletes data older than 12 hours to prevent disk bloating."""
    try:
        with db_lock:
            conn = sqlite3.connect(DB_PATH, check_same_thread=False)
            cursor = conn.cursor()
            expiry_time = (datetime.now() - timedelta(hours=12)).isoformat()
            cursor.execute("DELETE FROM private_prices WHERE last_updated < ?", (expiry_time,))
            cursor.execute("DELETE FROM bm_tiers WHERE last_updated < ?", (expiry_time,))
            conn.commit()
            conn.close()
    except Exception as e:
        print(f"Cleanup Error: {e}")

def ingest_private_data(user_id: str, data: List[AODPPriceData]):
    """Stores incoming private scan data into SQLite."""
    # Run cleanup with 10% chance per ingest
    if os.urandom(1)[0] % 10 == 0:
        cleanup_old_data()

    try:
        with db_lock:
            conn = sqlite3.connect(DB_PATH, check_same_thread=False)
            cursor = conn.cursor()
            now_iso = datetime.now().isoformat()
            
            for item in data:
                cursor.execute("""
                    INSERT INTO private_prices (
                        user_id, item_id, city, quality, 
                        sell_price_min, sell_price_min_date, 
                        sell_price_max, sell_price_max_date, 
                        buy_price_min, buy_price_min_date, 
                        buy_price_max, buy_price_max_date, 
                        buy_price_max_quantity, sell_price_min_quantity,
                        last_updated
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(user_id, item_id, city, quality) DO UPDATE SET
                        sell_price_min=excluded.sell_price_min,
                        sell_price_min_date=excluded.sell_price_min_date,
                        sell_price_max=excluded.sell_price_max,
                        sell_price_max_date=excluded.sell_price_max_date,
                        buy_price_min=excluded.buy_price_min,
                        buy_price_min_date=excluded.buy_price_min_date,
                        buy_price_max=excluded.buy_price_max,
                        buy_price_max_date=excluded.buy_price_max_date,
                        buy_price_max_quantity=excluded.buy_price_max_quantity,
                        sell_price_min_quantity=excluded.sell_price_min_quantity,
                        last_updated=?
                """, (
                    user_id, item.item_id, item.city, item.quality,
                    item.sell_price_min, item.sell_price_min_date,
                    item.sell_price_max, item.sell_price_max_date,
                    item.buy_price_min, item.buy_price_min_date,
                    item.buy_price_max, item.buy_price_max_date,
                    item.buy_price_max_quantity, item.sell_price_min_quantity,
                    now_iso, now_iso
                ))
            
            conn.commit()
            conn.close()
    except Exception as e:
        print(f"DB Ingest Error: {e}")

def update_bm_tiers(item_id: str, quality: int, price: int, qty: int, date: str, user_id: str = "global"):
    """Stores BM price tiers into SQLite."""
    try:
        with db_lock:
            conn = sqlite3.connect(DB_PATH, check_same_thread=False)
            cursor = conn.cursor()
            now_iso = datetime.now().isoformat()
            cursor.execute("""
                INSERT INTO bm_tiers (user_id, item_id, quality, price, qty, date, last_updated)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(user_id, item_id, quality, price) DO UPDATE SET
                    qty=excluded.qty,
                    date=excluded.date,
                    last_updated=?
            """, (user_id, item_id, quality, price, qty, date, now_iso, now_iso))
            conn.commit()
            conn.close()
    except Exception as e:
        print(f"DB Tier Update Error: {e}")

def merge_prices(public_data: List[AODPPriceData], items: List[str], locations: List[str], user_id: str = "global") -> List[AODPPriceData]:
    """Merges public AODP data with private SQLite data, prioritizing the latter."""
    private_data_map = {}
    if not items or not locations:
        return public_data

    try:
        # SQLite has a limit of 999 variables per query. Chunk items to avoid crashes.
        CHUNK_SIZE = 500
        with db_lock:
            conn = sqlite3.connect(DB_PATH, check_same_thread=False)
            cursor = conn.cursor()
            
            for i in range(0, len(items), CHUNK_SIZE):
                chunk = items[i:i + CHUNK_SIZE]
                item_placeholders = ",".join(["?"] * len(chunk))
                loc_placeholders = ",".join(["?"] * len(locations))
                
                query = f"SELECT * FROM private_prices WHERE user_id = ? AND item_id IN ({item_placeholders}) AND city IN ({loc_placeholders})"
                cursor.execute(query, [user_id] + chunk + locations)
                
                rows = cursor.fetchall()
                for row in rows:
                    p_item = AODPPriceData(
                        item_id=row[1],
                        city=row[2],
                        quality=row[3],
                        sell_price_min=row[4],
                        sell_price_min_date=row[5],
                        sell_price_max=row[6],
                        sell_price_max_date=row[7],
                        buy_price_min=row[8],
                        buy_price_min_date=row[9],
                        buy_price_max=row[10],
                        buy_price_max_date=row[11],
                        buy_price_max_quantity=row[12],
                        sell_price_min_quantity=row[13],
                        is_private=True
                    )
                    private_data_map[(p_item.item_id, p_item.city, p_item.quality)] = p_item
            conn.close()
    except Exception as e:
        print(f"DB Merge Error: {e}")

    merged_results = []
    seen_keys = set()

    for key, p_item in private_data_map.items():
        merged_results.append(p_item)
        seen_keys.add(key)

    for item in public_data:
        key = (item.item_id, item.city, item.quality)
        if key not in seen_keys:
            merged_results.append(item)
            seen_keys.add(key)

    return merged_results

def get_all_private_item_ids(user_id: str) -> List[str]:
    """Returns a list of all item IDs this user has privately scanned."""
    try:
        with db_lock:
            conn = sqlite3.connect(DB_PATH, check_same_thread=False)
            cursor = conn.cursor()
            cursor.execute("SELECT DISTINCT item_id FROM private_prices WHERE user_id = ?", (user_id,))
            items = [row[0] for row in cursor.fetchall()]
            conn.close()
            return items
    except:
        return []

def get_bm_tiers(item_id: str, quality: int, user_id: str = "global") -> List[Dict]:
    """Retrieves BM tiers from SQLite for the specific user."""
    try:
        with db_lock:
            conn = sqlite3.connect(DB_PATH, check_same_thread=False)
            cursor = conn.cursor()
            cursor.execute("""
                SELECT price, qty, date FROM bm_tiers 
                WHERE user_id = ? AND item_id = ? AND quality = ? 
                ORDER BY price DESC
            """, (user_id, item_id, quality))
            rows = cursor.fetchall()
            conn.close()
            return [{"price": r[0], "qty": r[1], "date": r[2]} for r in rows]
    except:
        return []

def get_all_bm_tier_item_ids(user_id: str) -> List[str]:
    """Returns all unique item IDs that have BM tiers stored."""
    try:
        with db_lock:
            conn = sqlite3.connect(DB_PATH, check_same_thread=False)
            cursor = conn.cursor()
            cursor.execute("SELECT DISTINCT item_id FROM bm_tiers WHERE user_id = ?", (user_id,))
            items = [row[0] for row in cursor.fetchall()]
            conn.close()
            return items
    except:
        return []

def get_fresh_private_item_ids(user_id: str, items: List[str], minutes: int = 30) -> List[str]:
    """Returns a list of item IDs that have private data newer than 'minutes' ago."""
    if not items:
        return []
    try:
        CHUNK_SIZE = 500
        fresh_items = []
        with db_lock:
            conn = sqlite3.connect(DB_PATH, check_same_thread=False)
            cursor = conn.cursor()
            
            for i in range(0, len(items), CHUNK_SIZE):
                chunk = items[i:i + CHUNK_SIZE]
                placeholders = ",".join(["?"] * len(chunk))
                expiry_limit = (datetime.now() - timedelta(minutes=minutes)).isoformat()
                
                # If any quality/city for this item is fresh, we consider the item "tracked" privately
                cursor.execute(f"""
                    SELECT DISTINCT item_id FROM private_prices 
                    WHERE user_id = ? AND item_id IN ({placeholders}) AND last_updated > ?
                """, [user_id] + chunk + [expiry_limit])
                
                fresh_items.extend([row[0] for row in cursor.fetchall()])
            
            conn.close()
            return list(set(fresh_items)) # Remove duplicates across chunks
    except Exception as e:
        print(f"Freshness Check Error: {e}")
        return []

def update_private_prices(prices: List[AODPPriceData], user_id: str = "global"):
    """Legacy wrapper for ingest_private_data."""
    ingest_private_data(user_id, prices)

def clear_all_private_data(user_id: str):
    """Deletes all private market data for the specified user."""
    try:
        with db_lock:
            conn = sqlite3.connect(DB_PATH, check_same_thread=False)
            cursor = conn.cursor()
            cursor.execute("DELETE FROM private_prices WHERE user_id = ?", (user_id,))
            cursor.execute("DELETE FROM bm_tiers WHERE user_id = ?", (user_id,))
            conn.commit()
            conn.close()
            return True
    except Exception as e:
        print(f"Clear DB Error: {e}")
        return False

def delete_specific_deal(user_id: str, item_id: str, quality: int, city: str):
    """Deletes a specific price record from the database."""
    try:
        with db_lock:
            conn = sqlite3.connect(DB_PATH, check_same_thread=False)
            cursor = conn.cursor()
            # Delete from main prices
            cursor.execute("""
                DELETE FROM private_prices 
                WHERE user_id = ? AND item_id = ? AND quality = ? AND city = ?
            """, (user_id, item_id, quality, city))
            
            # If the city is Black Market, also delete all tiers for this item+quality
            # This ensures Bulk Deals for this item also disappear
            if city == "Black Market":
                cursor.execute("""
                    DELETE FROM bm_tiers 
                    WHERE user_id = ? AND item_id = ? AND quality = ?
                """, (user_id, item_id, quality))
                
            conn.commit()
            conn.close()
            return True
    except Exception as e:
        print(f"Delete Deal Error: {e}")
        return False
