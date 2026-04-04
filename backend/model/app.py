"""
Flask REST API wrapper for the NANITH777 Disaster_Prediction_Model.
Exposes a POST /predict endpoint that Node.js backend calls.

Requirements:
  pip install flask transformers torch
  (Your fine-tuned BERT model must be saved locally — see README)
"""

from flask import Flask, request, jsonify
from transformers import BertTokenizer, BertForSequenceClassification
import torch
import torch.nn.functional as F

app = Flask(__name__)

# ── Model config ──────────────────────────────────────────────────────────────
MODEL_PATH = "./saved_model"   # path to your fine-tuned BERT folder
LABELS = ["Drought", "Earthquake", "Wildfire", "Floods", "Hurricanes", "Tornadoes"]

# Risk heuristic: based on disaster type + confidence score
RISK_MAP = {
    "Drought":   {"High": 0.85, "Medium": 0.60},
    "Earthquake":{"High": 0.75, "Medium": 0.50},
    "Wildfire":  {"High": 0.80, "Medium": 0.55},
    "Floods":    {"High": 0.80, "Medium": 0.55},
    "Hurricanes":{"High": 0.70, "Medium": 0.45},
    "Tornadoes": {"High": 0.75, "Medium": 0.50},
}

# ── Load model once at startup ────────────────────────────────────────────────
print("Loading BERT model...")
tokenizer = BertTokenizer.from_pretrained(MODEL_PATH)
model = BertForSequenceClassification.from_pretrained(MODEL_PATH)
model.eval()
print("Model ready.")


def infer_risk(disaster_type: str, confidence: float) -> str:
    thresholds = RISK_MAP.get(disaster_type, {"High": 0.80, "Medium": 0.55})
    if confidence >= thresholds["High"]:
        return "High"
    elif confidence >= thresholds["Medium"]:
        return "Medium"
    return "Low"


def make_summary(disaster_type: str, risk_level: str, confidence: float) -> str:
    pct = round(confidence * 100, 1)
    return (
        f"The input text has been classified as a {disaster_type} event "
        f"with {pct}% confidence. Risk level is assessed as {risk_level}."
    )


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"ok": True, "model": MODEL_PATH})


@app.route("/predict", methods=["POST"])
def predict():
    body = request.get_json(silent=True)
    if not body or "text" not in body:
        return jsonify({"error": "Request body must contain a 'text' field."}), 400

    text = body["text"].strip()
    if not text:
        return jsonify({"error": "'text' field must not be empty."}), 400

    # Tokenise & run inference
    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        padding=True,
        max_length=128,
    )
    with torch.no_grad():
        logits = model(**inputs).logits

    probs = F.softmax(logits, dim=-1).squeeze()
    confidence = float(probs.max().item())
    predicted_idx = int(probs.argmax().item())
    disaster_type = LABELS[predicted_idx]
    risk_level = infer_risk(disaster_type, confidence)

    return jsonify({
        "disaster_type": disaster_type,
        "risk_level": risk_level,
        "confidence": f"{round(confidence * 100, 1)}%",
        "summary": make_summary(disaster_type, risk_level, confidence),
    })


if __name__ == "__main__":
    # Default: http://localhost:5001
    app.run(host="0.0.0.0", port=5001, debug=False)
