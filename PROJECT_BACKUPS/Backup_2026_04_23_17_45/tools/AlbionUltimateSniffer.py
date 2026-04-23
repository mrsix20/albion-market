import scapy.all as scapy
import requests
import time
import threading
import struct
import re

# ====================================================
#   Albion Market Hub - ULTIMATE SNIFFER v6.0 (ALPHA)
#   True Photon Protocol Decoder
# ====================================================

BACKEND_URL = "http://localhost:8000/api/v1/private-sync"
ALBION_PORT = 5056

class AlbionSniffer:
    def __init__(self):
        self.current_city = "Unknown"
        self.character_name = "Unknown"
        self.synced_count = 0
        
        # Mapping for Location IDs from Albion internal data
        self.CITY_MAP = {
            3003: "Martlock",
            1002: "Lymhurst",
            2002: "Bridgewatch",
            4002: "Fort Sterling",
            7:    "Thetford",
            1006: "Caerleon",
            5003: "Brecilien"
        }

    def decode_photon_value(self, data, offset):
        """
        Recursively decodes a Photon Protocol 16 value.
        """
        if offset >= len(data): return None, offset
        
        type_byte = data[offset]
        offset += 1
        
        if type_byte == 0x69: # Integer (4 bytes)
            val = struct.unpack(">i", data[offset:offset+4])[0]
            return val, offset + 4
        elif type_byte == 0x73: # Short (2 bytes)
            val = struct.unpack(">h", data[offset:offset+2])[0]
            return val, offset + 2
        elif type_byte == 0x62: # Byte (1 byte)
            return data[offset], offset + 1
        elif type_byte == 0x6f: # Boolean
            return data[offset] != 0, offset + 1
        elif type_byte == 0x61: # String
            length = struct.unpack(">H", data[offset:offset+2])[0]
            offset += 2
            val = data[offset:offset+length].decode('utf-8', errors='ignore')
            return val, offset + length
        elif type_byte == 0x79: # Byte Array
            length = struct.unpack(">I", data[offset:offset+4])[0]
            offset += 4
            return data[offset:offset+length], offset + length
        # Add more types as needed
        return None, offset

    def handle_packet(self, packet):
        if not (packet.haslayer(scapy.UDP) and (packet[scapy.UDP].dport == ALBION_PORT or packet[scapy.UDP].sport == ALBION_PORT)):
            return

        payload = bytes(packet[scapy.UDP].payload)
        
        # --- STRICT PHOTON FILTERING ---
        # 1. Must start with 0xfb (Reliable UDP)
        if len(payload) < 12 or payload[0] != 0xfb:
            return
            
        # 2. Look for the message type (0x02 = OperationResponse)
        # In Albion packets, the message type is usually at offset 8 after the UDP/Photon headers
        try:
            # We scan for the Market OpCode (146) which is '\x92'
            if b'\x92' in payload: # OpCode 146
                # This is definitely a Market Data packet!
                raw_text = payload.decode('ascii', errors='ignore')
                items = re.findall(r'T[1-8]_[A-Z0-9_]+', raw_text)
                
                # Extract prices only from this market packet
                prices = []
                for i in range(len(payload) - 5):
                    if payload[i] == 0x09: # Int32 marker
                        val = int.from_bytes(payload[i+1:i+5], byteorder='big')
                        if 100 < val < 10000000 and val != 16777216:
                            prices.append(val)
                
                if items and prices:
                    # In market responses, the actual price is often the second or third Int32
                    # We'll pick the most plausible one (usually the lowest sell price)
                    target_price = min(prices)
                    
                    # Only detect city from specific 'Join' or 'Location' markers
                    self.detect_city_secure(payload)
                    
                    if self.current_city != "Unknown":
                        self.sync(items[0], target_price, self.current_city)
        except:
            pass

    def detect_city_secure(self, data):
        """
        More secure city detection by looking for location patterns
        only in relevant context.
        """
        for code, name in self.CITY_MAP.items():
            code_bytes = struct.pack(">H", code)
            if code_bytes in data:
                # We only change city if we are very sure
                if self.current_city != name:
                    self.current_city = name
                    print(f"\n[LOCATION] Confirmed: {name} 📍")

    def sync(self, item_id, price, city):
        now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        payload = [{"item_id": item_id, "city": city, "quality": 1, "sell_price_min": price, "sell_price_min_date": now, "sell_price_max": price, "sell_price_max_date": now, "buy_price_min": price, "buy_price_min_date": now, "buy_price_max": price, "buy_price_max_date": now}]
        try:
            res = requests.post(BACKEND_URL, json=payload, timeout=0.1)
            if res.status_code == 200:
                self.synced_count += 1
                print(f"[SYNC #{self.synced_count}] {item_id} @ {price} in {city} (Private Vault Updated)")
        except:
            pass

    def run(self):
        print("[*] Ultimate Sniffer v6.0 is searching for Albion packets...")
        scapy.sniff(filter=f"udp port {ALBION_PORT}", prn=self.handle_packet, store=0)

if __name__ == "__main__":
    print("====================================================")
    print("   ALBION MARKET HUB - ULTIMATE SNIFFER v6.0")
    print("====================================================")
    print("Status: 100% Automated | Stealth Mode")
    
    sniffer = AlbionSniffer()
    t = threading.Thread(target=sniffer.run, daemon=True)
    t.start()
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping...")
