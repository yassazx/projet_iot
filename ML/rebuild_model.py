
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import pickle
import os

# Paths
DATA_PATH = '../AI (benmchich)/gyro_angles_labeled.csv'
MODEL_PATH = 'drone_tilt_random_forest_model.pkl'
SCALER_PATH = 'scaler.pkl'

def train_and_save():
    print("Loading data...")
    if not os.path.exists(DATA_PATH):
        print(f"Error: Data file not found at {DATA_PATH}")
        return

    df = pd.read_csv(DATA_PATH)
    
    # Features and Target
    X = df[['angle_x', 'angle_y', 'angle_z', 'max_tilt']]
    y = df['label']
    
    print("Training model...")
    # Scaler
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Model
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_scaled, y)
    
    print("Saving artifacts...")
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(model, f)
        
    with open(SCALER_PATH, 'wb') as f:
        pickle.dump(scaler, f)
        
    print("Done! Model and scaler saved using pickle.")

if __name__ == "__main__":
    train_and_save()
