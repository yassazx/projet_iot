
import pickle
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
import os

app = Flask(__name__)

# Load model and scaler
MODEL_PATH = 'drone_tilt_random_forest_model.pkl'
SCALER_PATH = 'scaler.pkl'

model = None
scaler = None

def load_artifacts():
    global model, scaler
    try:
        with open(MODEL_PATH, 'rb') as f:
            model = pickle.load(f)
        with open(SCALER_PATH, 'rb') as f:
            scaler = pickle.load(f)
        print("Model and Scaler loaded successfully.")
    except Exception as e:
        print(f"Error loading artifacts: {e}")

load_artifacts()

LABEL_MAP = {
    0: "Stable",
    1: "Risque",
    2: "Renversement"
}

@app.route('/predict', methods=['POST'])
def predict():
    if not model or not scaler:
        return jsonify({'error': 'Model not loaded'}), 500

    try:
        data = request.get_json()
        angle_x = float(data.get('angle_x', 0))
        angle_y = float(data.get('angle_y', 0))
        angle_z = float(data.get('angle_z', 0))

        # Feature engineering: calculate max_tilt
        max_tilt = max(abs(angle_x), abs(angle_y))

        # Create dataframe for scaler (expects feature names)
        # Features from metadata: angle_x, angle_y, angle_z, max_tilt
        features = pd.DataFrame([{
            'angle_x': angle_x,
            'angle_y': angle_y,
            'angle_z': angle_z,
            'max_tilt': max_tilt
        }])

        # Scale features
        features_scaled = scaler.transform(features)

        # Predict
        prediction = model.predict(features_scaled)[0]
        label = LABEL_MAP.get(prediction, "Unknown")

        # Get probabilities if supported
        # probabilities = model.predict_proba(features_scaled)[0].tolist()

        return jsonify({
            'success': True,
            'prediction': int(prediction),
            'label': label,
            'features': {
                'angle_x': angle_x,
                'angle_y': angle_y,
                'max_tilt': max_tilt
            }
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(port=5000, debug=True)
