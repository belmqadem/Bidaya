"""
LqahCare — AI Neonatal Risk Prediction Script
Uses MiniMax LLM API to predict baby birth weight from maternal data.

Usage:
  1. Ensure .env file exists at project root with MINIMAX_API_KEY
  2. Activate venv:  source ML/venv/bin/activate
  3. Run:  python ML/Predict.py
"""

import os
import re
import sys
import json
import time
import pathlib

import pandas as pd
import requests

# ── Resolve paths ────────────────────────────────────────────────────────────
SCRIPT_DIR = pathlib.Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
ENV_FILE = PROJECT_ROOT / ".env"
DATA_FILE = SCRIPT_DIR / "babies_cleaned.csv"

# ── Load .env manually (no extra dependency) ─────────────────────────────────
def load_env(path: pathlib.Path) -> None:
    """Parse a simple .env file and inject vars into os.environ."""
    if not path.exists():
        return
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            os.environ.setdefault(key, value)

load_env(ENV_FILE)

# ── Config from environment ──────────────────────────────────────────────────
API_KEY = os.environ.get("MINIMAX_API_KEY")
BASE_URL = os.environ.get("MINIMAX_BASE_URL", "https://api.minimax.io/v1/chat/completions")
MODEL = os.environ.get("MINIMAX_MODEL", "MiniMax-M2.5")

if not API_KEY:
    print("ERROR: MINIMAX_API_KEY not found.")
    print(f"Create a .env file at {ENV_FILE} with:")
    print('  MINIMAX_API_KEY="your-key-here"')
    sys.exit(1)

# ── Quick API key check ──────────────────────────────────────────────────────
print("Testing API key...")
test_resp = requests.post(
    BASE_URL,
    headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
    json={"model": MODEL, "messages": [{"role": "user", "content": "Say hello"}], "max_tokens": 5},
)
test_result = test_resp.json()
print(f"Status code: {test_resp.status_code}")

if test_result.get("type") == "error":
    print(f"\n*** API ERROR: {test_result['error']['message']} ***")
    print("Fix your API key or account balance before continuing.")
    sys.exit(1)
print("API key is valid!\n")

# ── Load cleaned data ────────────────────────────────────────────────────────
if not DATA_FILE.exists():
    print(f"ERROR: Data file not found at {DATA_FILE}")
    sys.exit(1)

df = pd.read_csv(DATA_FILE)
print(f"Loaded {len(df)} rows from {DATA_FILE.name}")
print(df.head())


# ── System prompt ─────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are a neonatal risk assessment assistant used in a Moroccan primary healthcare clinic.

All measurements use the metric system.

Given maternal and pregnancy data, estimate newborn birth weight in grams and classify neonatal risk.

Return ONLY valid JSON in this exact format:

{
  "predicted_weight_grams": number,
  "risk_level": "LOW" | "MODERATE" | "HIGH",
  "clinical_note": string
}

Risk classification:
- LOW: predicted weight > 3000 grams
- MODERATE: 2500–3000 grams
- HIGH: < 2500 grams

Guidelines:
- Use realistic clinical reasoning
- Do NOT include units in numbers
- Do NOT include text outside JSON
- Keep clinical_note short and neutral"""


# ── Prediction function ──────────────────────────────────────────────────────
_debug_count = 0

def predict_bwt(row):
    """Ask MiniMax to predict birth weight (in grams) for one record."""
    global _debug_count

    # Convert dataset units (imperial) to metric for the prompt
    gestation_weeks = round(row["gestation"] / 7, 1)
    height_cm = round(row["height"] * 2.54, 1)
    weight_kg = round(row["weight"] * 0.453592, 1)

    user_msg = (
        f"Maternal and pregnancy data for newborn registration:\n\n"
        f"Gestation: {gestation_weeks} weeks\n"
        f"Parity: {int(row['parity'])}\n"
        f"Mother age: {row['age']} years\n"
        f"Mother height: {height_cm} cm\n"
        f"Mother weight: {weight_kg} kg\n"
        f"Smoking during pregnancy: {'yes' if row['smoke'] == 1 else 'no'}\n\n"
        f"Estimate newborn birth weight and risk classification."
    )

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }
    body = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        "max_tokens": 4000,
        "temperature": 0.1,
    }

    try:
        response = requests.post(BASE_URL, headers=headers, json=body)
        result = response.json()
        raw = result["choices"][0]["message"]["content"]

        # Debug: print raw response for first 2 calls
        if _debug_count < 2:
            print(f"  [DEBUG] Raw response length: {len(raw)} chars")
            print(f"  [DEBUG] End of response: {repr(raw[-300:])}")
            _debug_count += 1

        # Strip <think>...</think> blocks (closed and unclosed)
        cleaned = re.sub(r"<think>.*?</think>", "", raw, flags=re.DOTALL)
        cleaned = re.sub(r"<think>.*", "", cleaned, flags=re.DOTALL)
        cleaned = cleaned.strip()

        # Strategy 1: parse JSON response
        parsed = None
        try:
            parsed = json.loads(cleaned)
        except json.JSONDecodeError:
            json_match = re.search(r"\{[\s\S]*\}", cleaned)
            if json_match:
                try:
                    parsed = json.loads(json_match.group())
                except json.JSONDecodeError:
                    pass

        # Strategy 2: look for JSON inside full raw (including think block)
        if not parsed:
            json_match = re.search(r'\{\s*"predicted_weight_grams"\s*:\s*\d[\s\S]*?\}', raw)
            if json_match:
                try:
                    parsed = json.loads(json_match.group())
                except json.JSONDecodeError:
                    pass

        if parsed and "predicted_weight_grams" in parsed:
            return {
                "weight_g": parsed["predicted_weight_grams"],
                "risk": parsed.get("risk_level", "UNKNOWN"),
                "note": parsed.get("clinical_note", ""),
            }

        # Strategy 3: fallback — extract a plausible gram number
        all_numbers = re.findall(r"\b(\d{3,4})\b", raw)
        plausible = [int(n) for n in all_numbers if 1000 <= int(n) <= 6000]
        if plausible:
            weight = plausible[-1]
            return {"weight_g": weight, "risk": "UNKNOWN", "note": "Extracted from reasoning"}

        print(f"  Warning: no prediction found in response ({len(raw)} chars)")
        return None
    except Exception as e:
        print(f"  Error on row: {e}")
        return None


# ── Run predictions on sample ────────────────────────────────────────────────
SAMPLE_SIZE = 10
print(f"\nRunning predictions on first {SAMPLE_SIZE} rows...\n")

sample = df.head(SAMPLE_SIZE).copy()
predictions_g = []
risks = []

for i, row in sample.iterrows():
    pred = predict_bwt(row)
    actual_g = round(row["bwt"] * 28.3495)
    if pred:
        predictions_g.append(pred["weight_g"])
        risks.append(pred["risk"])
        print(f"  Row {i + 1} | Actual: {actual_g}g | Predicted: {pred['weight_g']}g | Risk: {pred['risk']}")
        if pred.get("note"):
            print(f"           Note: {pred['note']}")
    else:
        predictions_g.append(None)
        risks.append(None)
        print(f"  Row {i + 1} | Actual: {actual_g}g | Predicted: FAILED")
    time.sleep(0.5)  # respect API rate limits

# ── Results summary ──────────────────────────────────────────────────────────
sample["actual_g"] = (sample["bwt"] * 28.3495).round()
sample["predicted_g"] = predictions_g
sample["risk_level"] = risks
sample["error_g"] = (sample["predicted_g"] - sample["actual_g"]).abs()

print("\n── RESULTS ──────────────────────────────────────────────────────────")
print(sample[["actual_g", "predicted_g", "risk_level", "error_g"]])
valid = sample.dropna(subset=["error_g"])
if len(valid) > 0:
    print(f"\nAverage prediction error: {valid['error_g'].mean():.0f} g")

# ── Save results ─────────────────────────────────────────────────────────────
output_file = SCRIPT_DIR / "predictions_output.csv"
sample.to_csv(output_file, index=False)
print(f"\nSaved to {output_file}")
