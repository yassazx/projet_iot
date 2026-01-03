"""
Flask API for Drone Rating ML Model
Serves predictions using the trained Random Forest model
"""

import os
import pickle
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Get the directory of this script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load model and scaler
MODEL_PATH = os.path.join(BASE_DIR, 'drone_rating_model.pkl')
SCALER_PATH = os.path.join(BASE_DIR, 'scaler.pkl')

model = None
scaler = None

def load_model():
    global model, scaler
    try:
        with open(MODEL_PATH, 'rb') as f:
            model = pickle.load(f)
        with open(SCALER_PATH, 'rb') as f:
            scaler = pickle.load(f)
        print("✅ Modèle et scaler chargés avec succès")
        return True
    except Exception as e:
        print(f"❌ Erreur de chargement du modèle: {e}")
        return False

def interpret_score(score):
    """Interprète le score en label et explication"""
    if score < 40:
        return "❌ Mauvais", "Drone mal équilibré ou sous-motorisé"
    elif score < 60:
        return "⚠️ Acceptable", "Configuration utilisable mais perfectible"
    elif score < 80:
        return "✅ Bon", "Bonne configuration globale"
    else:
        return "🏆 Excellent", "Configuration optimale et stable"

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'scaler_loaded': scaler is not None
    })

@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict drone configuration rating
    
    Expected JSON body:
    {
        "total_weight": 900,
        "center_of_mass_offset": 0.7,
        "thrust_to_weight": 2.1,
        "arm_length": 220,
        "propeller_size": 5,
        "motor_kv": 2300
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        # Extract features in the correct order (matching training data)
        required_fields = ['total_weight', 'center_of_mass_offset', 'thrust_to_weight', 
                          'arm_length', 'propeller_size', 'motor_kv']
        
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Create feature array
        features = np.array([[
            float(data['total_weight']),
            float(data['center_of_mass_offset']),
            float(data['thrust_to_weight']),
            float(data['arm_length']),
            int(data['propeller_size']),
            int(data['motor_kv'])
        ]])
        
        # Scale features
        features_scaled = scaler.transform(features)
        
        # Predict
        score = model.predict(features_scaled)[0]
        score = float(np.clip(score, 0, 100))
        score = round(score, 1)
        
        # Interpret
        label, explanation = interpret_score(score)
        
        print(f"🎯 Prediction: Score={score}/100 ({label})")
        
        return jsonify({
            'success': True,
            'rating': {
                'score': score,
                'label': label,
                'explanation': explanation
            },
            'input': data
        })
        
    except Exception as e:
        print(f"❌ Prediction error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    if load_model():
        print("""
╔══════════════════════════════════════════════════════════╗
║          🤖 Drone Rating ML API Server 🤖                ║
╠══════════════════════════════════════════════════════════╣
║  Endpoint:  http://localhost:5001/predict                ║
║  Health:    http://localhost:5001/health                 ║
╚══════════════════════════════════════════════════════════╝
        """)
        app.run(host='0.0.0.0', port=5001, debug=True)
    else:
        print("❌ Impossible de démarrer le serveur sans modèle")
