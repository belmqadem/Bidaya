import pandas as pd
import requests
import json
import time

# ── CONFIG ───────────────────────────────────────────────────────────────────
API_KEY = "my-api"   # paste your key here
BASE_URL = "https://api.minimax.io/v1"
MODEL = "MiniMax-M2.5"

# ── LOAD CLEANED DATA ─────────────────────────────────────────────────────────
df = pd.read_csv('ikram/babies_cleaned.csv')
print(f"Loaded {len(df)} rows")
print(df.head())

# ── DEBUG: test raw API response first ────────────────────────────────────────
def test_raw_response():
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    body = {
        "model": MODEL,
        "messages": [
            {"role": "user", "content": "Reply with just the number 42"}
        ],
        "max_tokens": 20,
        "temperature": 0.1
    }
    response = requests.post(BASE_URL, headers=headers, json=body)
    print("Status code:", response.status_code)
    print("Raw response:", response.text)  # this shows us exactly what MiniMax returns

print("\nTesting raw API response...")
test_raw_response()