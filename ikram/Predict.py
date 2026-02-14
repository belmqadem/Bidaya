import pandas as pd
import requests
import json
import time
import sys
import io

# Fix Windows console encoding for special characters
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# ── CONFIG ──────────────────────────────────────────────────────────────────
API_KEY = "sk-api-YrwQeczrafF1RlOexfquiLyKCU2ZOBOAGSHjVy5vuczaNNV8A9iFFvNClk7BxoIcVqYeFcOp4CyFYsZEz1kxdy4fIvJujuGumHP74drAr6VZvMcpSkIz3qk"   
BASE_URL = "https://api.minimax.io/v1/chat/completions"
MODEL = "MiniMax-M2.5"

# ── QUICK API KEY CHECK ────────────────────────────────────────────────────────
print("Testing API key...")
test_resp = requests.post(
    BASE_URL,
    headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
    json={"model": MODEL, "messages": [{"role": "user", "content": "Say hello"}], "max_tokens": 5}
)
test_result = test_resp.json()
print(f"Status code: {test_resp.status_code}")
print(f"Response: {json.dumps(test_result, indent=2)}")
if test_result.get("type") == "error":
    print(f"\n*** API ERROR: {test_result['error']['message']} ***")
    print("Fix your API key or account balance before continuing.")
    sys.exit(1)
print("API key is valid!\n")

# ── LOAD CLEANED DATA ────────────────────────────────────────────────────────
df = pd.read_csv('ikram/babies_cleaned.csv')
print(f"Loaded {len(df)} rows")
print(df.head())

# ── FUNCTION: ask MiniMax to predict bwt for one row ────────────────────────
def predict_bwt(row):
    prompt = f"""
You are a medical AI assistant. Based on the following mother and pregnancy data, 
predict the baby's birth weight in ounces (bwt). 
Return ONLY a single number. No explanation, no text, just the number.

Data:
- Gestation period: {row['gestation']} days
- Mother's previous pregnancies (parity): {int(row['parity'])} (0=first child, 1=has other children)
- Mother's age: {row['age']} years
- Mother's height: {row['height']} inches
- Mother's weight: {row['weight']} pounds
- Mother smokes: {'Yes' if row['smoke'] == 1 else 'No'}

Predicted birth weight in ounces:
"""

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    body = {
        "model": MODEL,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 20,
        "temperature": 0.1   # low temperature = more consistent/precise answers
    }

    try:
        response = requests.post(BASE_URL, headers=headers, json=body)
        result = response.json()
        # Debug: print the raw API response on the first call to diagnose issues
        if not hasattr(predict_bwt, '_debug_printed'):
            print(f"[DEBUG] API response: {json.dumps(result, indent=2)[:500]}")
            predict_bwt._debug_printed = True
        predicted = result['choices'][0]['message']['content'].strip()
        return float(predicted)
    except Exception as e:
        print(f"Error on row: {e}")
        return None

# ── RUN ON FIRST 10 ROWS (test before running full dataset) ──────────────────
print("\nRunning predictions on first 10 rows...\n")

sample = df.head(10).copy()
predictions = []

for i, row in sample.iterrows():
    pred = predict_bwt(row)
    predictions.append(pred)
    print(f"Row {i+1} | Actual bwt: {row['bwt']} oz | Predicted: {pred} oz")
    time.sleep(0.5)  # small pause to respect API rate limits

# ── ADD PREDICTIONS TO DATAFRAME ─────────────────────────────────────────────
sample['predicted_bwt'] = predictions
sample['error_oz'] = (sample['predicted_bwt'] - sample['bwt']).abs()

print("\n── RESULTS ──────────────────────────────────────────────────────────")
print(sample[['bwt', 'predicted_bwt', 'error_oz']])
print(f"\nAverage prediction error: {sample['error_oz'].mean():.2f} oz")

# ── SAVE RESULTS ─────────────────────────────────────────────────────────────
sample.to_csv('ikram/babies_predictions.csv', index=False)
print("\nSaved to ikram/babies_predictions.csv")