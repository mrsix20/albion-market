import scapy.all as scapy
import json
import requests
import time
import threading
import re

# --- Configuration ---
BACKEND_URL = "https://albion-market-production-d5f2.up.railway.app/api/v1/private-sync"
ALBION_PORT = 5056 

print("====================================================")
print("   Albion Market Hub - Reliable Sync (v4.1)")
print("====================================================")

# Manual city selection for 100% accuracy
CURRENT_CITY = input("Enter your current city (e.g., Martlock): ") or "Martlock"
print(f"[*] Targeting City: {CURRENT_CITY}")

ITEM_REGEX = re.compile(rb'T[1-8]_[A-Z0-9_]+')

def extract_valid_prices(data):
    """
    Improved price extraction - only looks for prices in a logical range
    and ignores common junk values like stack sizes or durability.
    """
    prices = []
    for i in range(len(data) - 5):
        if data[i] == 0x09: # Int32 marker
            val = int.from_bytes(data[i+1:i+5], byteorder='big')
            # Realistic price filter for most items
            if 100 < val < 20000000 and val != 16777216:
                prices.append(val)
    return list(set(prices)) # Unique prices only

def packet_callback(packet):
    if packet.haslayer(scapy.UDP) and (packet[scapy.UDP].dport == ALBION_PORT or packet[scapy.UDP].sport == ALBION_PORT):
        raw_data = bytes(packet[scapy.UDP].payload)
        
        matches = list(ITEM_REGEX.finditer(raw_data))
        if matches:
            items = [m.group().decode('utf-8', errors='ignore') for m in matches]
            prices = extract_valid_prices(raw_data)
            
            if items and prices:
                # In most market responses, the first item matches the first price
                # We will pick the most reasonable price found
                for item in items:
                    for price in prices:
                        sync_to_backend(item, price, CURRENT_CITY)
                        break # Only sync the first match to keep it clean

def sync_to_backend(item_id, price, city):
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    payload = [{"item_id": item_id, "city": city, "quality": 1, "sell_price_min": price, "sell_price_min_date": now, "sell_price_max": price, "sell_price_max_date": now, "buy_price_min": price, "buy_price_min_date": now, "buy_price_max": price, "buy_price_max_date": now}]
    try:
        requests.post(BACKEND_URL, json=payload, timeout=0.1)
        print(f"[CAPTURED] {item_id} @ {price} in {city}")
    except:
        pass

# Start
sniffer = threading.Thread(target=lambda: scapy.sniff(filter=f"udp port {ALBION_PORT}", prn=packet_callback, store=0), daemon=True)
sniffer.start()

print(f"\n[HUNTING] Monitoring market in {CURRENT_CITY}...")
print("Maintenance starting soon! Quick test before server goes down.")
print("----------------------------------------------------")

while True:
    time.sleep(1)
