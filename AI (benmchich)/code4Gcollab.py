import pandas as pd
import numpy as np

from scipy.signal import savgol_filter
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix

# 1. Chargement de la dataset
df = pd.read_csv("gyro_angles_labeled.csv")

 
# 2. Prétraitement des données
# Lissage des angles (réduction du bruit)
df["angle_x_smooth"] = savgol_filter(df["angle_x"], 21, 3)
df["angle_y_smooth"] = savgol_filter(df["angle_y"], 21, 3)

# Calcul de l'inclinaison maximale
df["max_tilt"] = df[["angle_x_smooth", "angle_y_smooth"]].abs().max(axis=1)

 
# 3. Analyse statistique descriptive
print("\n--- Analyse statistique ---")
print(df[["angle_x_smooth", "angle_y_smooth", "max_tilt"]].describe())

 
# 4. Préparation des données pour le Machine Learning
X = df[["angle_x_smooth", "angle_y_smooth", "max_tilt"]]
y = df["label"]  # 0: Stable | 1: Instable | 2: Critique

# Normalisation
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Séparation Train / Test
X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.2, random_state=42, stratify=y
)

 
# 5. Entraînement du modèle ML
model = LogisticRegression(
    multi_class="multinomial",
    solver="lbfgs",
    max_iter=500
)

model.fit(X_train, y_train)

 
# 6. Évaluation du modèle
y_pred = model.predict(X_test)

print("\n--- Matrice de confusion ---")
print(confusion_matrix(y_test, y_pred))

print("\n--- Rapport de classification ---")
print(classification_report(y_test, y_pred))

 
# 7. Système d’alertes intelligent
def generate_alert(angle_x, angle_y):
    max_tilt = max(abs(angle_x), abs(angle_y))

    if max_tilt < 15:
        return "✅ Drone stable"
    elif max_tilt < 30:
        direction = "Droite" if angle_x > 0 else "Gauche"
        return f"⚠️ Correction nécessaire vers la {direction} augmente la vitesse des moteurs a {direction} par rapport aux autre"
    else:
        return "🚨 ALERTE CRITIQUE : Drone proche du renversement"

 
# 8. Test du système avec des valeurs simulées
test_angle_x = 28.0
test_angle_y = 6.0

alert = generate_alert(test_angle_x, test_angle_y)
print("\nAlerte générée :", alert)
