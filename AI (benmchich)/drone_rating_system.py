#!/usr/bin/env python3

import pandas as pd
import numpy as np
import pickle
import warnings
warnings.filterwarnings("ignore")

# ML
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score


class DroneRatingSystem:

    def __init__(self):
        self.model = None
        self.scaler = None

    # =============================
    # 1️⃣ DATASET
    # =============================
    def load_dataset(self, drone_config_rating):
        df = pd.read_csv('drone_config_rating.csv')
        print(f"Dataset chargé : {df.shape}")
        return df

    # =============================
    # 2️⃣ PREPARATION
    # =============================
    def prepare_data(self, df):
        X = df.drop("score", axis=1)
        y = df["score"]

        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)

        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled,
            y,
            test_size=0.2,
            random_state=42
        )

        print("Données préparées")
        return X_train, X_test, y_train, y_test, X.columns

    # =============================
    # 3️⃣ MODEL
    # =============================
    def build_model(self):
        self.model = RandomForestRegressor(
            n_estimators=300,
            max_depth=12,
            random_state=42
        )
        print("Modèle RandomForestRegressor créé")

    # =============================
    # 4️⃣ TRAINING
    # =============================
    def train_model(self, X_train, y_train):
        self.model.fit(X_train, y_train)
        print("Entraînement terminé")

    # =============================
    # 5️⃣ EVALUATION
    # =============================
    def evaluate_model(self, X_test, y_test):
        preds = self.model.predict(X_test)

        mae = mean_absolute_error(y_test, preds)
        r2 = r2_score(y_test, preds)

        print("\n📊 ÉVALUATION")
        print(f"MAE : {mae:.2f}")
        print(f"R²  : {r2:.2f}")

        return mae, r2

    # =============================
    # 6️⃣ INTERPRÉTATION HYBRIDE
    # =============================
    def _interpret_score(self, score):
        if score < 40:
            return "❌ Mauvais", "Drone mal équilibré ou sous-motorisé"
        elif score < 60:
            return "⚠️ Acceptable", "Configuration utilisable mais perfectible"
        elif score < 80:
            return "✅ Bon", "Bonne configuration globale"
        else:
            return "🏆 Excellent", "Configuration optimale et stable"

    # =============================
    # 7️⃣ PREDICTION
    # =============================
    def predict_rating(self, drone_params: dict):
        if self.model is None or self.scaler is None:
            raise ValueError("Modèle non chargé ou non entraîné")

        df = pd.DataFrame([drone_params])
        X_scaled = self.scaler.transform(df)

        score = float(self.model.predict(X_scaled)[0])
        score = np.clip(score, 0, 100)

        label, explanation = self._interpret_score(score)

        return {
            "score": round(score, 1),
            "label": label,
            "explanation": explanation
        }

    # =============================
    # 8️⃣ SAUVEGARDE
    # =============================
    def save_model(self, model_path="drone_rating_model.pkl", scaler_path="scaler.pkl"):
        with open(model_path, "wb") as f:
            pickle.dump(self.model, f)

        with open(scaler_path, "wb") as f:
            pickle.dump(self.scaler, f)

        print("Modèle et scaler sauvegardés")

    # =============================
    # 9️⃣ CHARGEMENT
    # =============================
    def load_model(self, model_path="drone_rating_model.pkl", scaler_path="scaler.pkl"):
        with open(model_path, "rb") as f:
            self.model = pickle.load(f)

        with open(scaler_path, "rb") as f:
            self.scaler = pickle.load(f)

        print("Modèle et scaler chargés")


from drone_rating_system import DroneRatingSystem

def main():

    system = DroneRatingSystem()

    # 1️⃣ Load dataset
    df = system.load_dataset("drone_config_rating.csv")

    # 2️⃣ Prepare data
    X_train, X_test, y_train, y_test, features = system.prepare_data(df)

    # 3️⃣ Build & Train
    system.build_model()
    system.train_model(X_train, y_train)

    # 4️⃣ Evaluate
    system.evaluate_model(X_test, y_test)

    # 5️⃣ Save model
    system.save_model()

    # 6️⃣ Reload (test persistance)
    system.load_model()

    # 7️⃣ Test prediction
    drone_config = {
        "total_weight": 900,
        "center_of_mass_offset": 0.7,
        "thrust_to_weight": 2.1,
        "arm_length": 220,
        "propeller_size": 5,
        "motor_kv": 2300
    }

    result = system.predict_rating(drone_config)

    print("\n🎯 RATING DRONE")
    print("Score :", result["score"], "/100")
    print("Classe :", result["label"])
    print("Explication :", result["explanation"])


if __name__ == "__main__":
    main()
