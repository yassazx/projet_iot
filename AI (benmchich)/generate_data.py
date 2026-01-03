import pandas as pd
import numpy as np

# 1. Configuration
N_SAMPLES = 50000
np.random.seed(42)

# 2. Génération des Features (Entrées)
propeller_size = np.random.choice([5, 6, 7, 8, 9], size=N_SAMPLES)
motor_kv = np.random.randint(1400, 2700, size=N_SAMPLES)

# Poids de base dépendant de la taille hélice + variation
base_weight = propeller_size * 150 
total_weight = np.random.normal(loc=base_weight, scale=300, size=N_SAMPLES)
total_weight = np.clip(total_weight, 500, 2500)

# Longueur de bras cohérente avec l'hélice
min_arm = (propeller_size * 25.4) / 2 + 20 
arm_length = np.random.uniform(min_arm, min_arm + 100, size=N_SAMPLES)

# Thrust to weight (Poussée/Poids)
thrust_to_weight = np.random.uniform(0.8, 3.5, size=N_SAMPLES)

# Décalage centre de masse (Distribution exponentielle)
center_of_mass_offset = np.random.exponential(scale=1.0, size=N_SAMPLES)
center_of_mass_offset = np.clip(center_of_mass_offset, 0, 10)

df = pd.DataFrame({
    'total_weight': total_weight.round(1),
    'center_of_mass_offset': center_of_mass_offset.round(2),
    'thrust_to_weight': thrust_to_weight.round(2),
    'arm_length': arm_length.round(1),
    'propeller_size': propeller_size,
    'motor_kv': motor_kv
})

# 3. Calcul du Score (Vérité Terrain / Logique Expert)
def calculate_score(row):
    score = 100.0
    
    # Pénalité Centre de Masse (Critique)
    if row['center_of_mass_offset'] > 0.5:
        score -= (row['center_of_mass_offset'] ** 1.8) * 5

    # Pénalité Thrust/Weight
    tw = row['thrust_to_weight']
    if tw < 1.2: score -= 50
    elif tw < 1.5: score -= 20
    elif tw > 3.0: score -= 10
    
    # Pénalité Incohérence Moteur/Hélice (KV * Size)
    ideal_product = 12000 
    actual_product = row['motor_kv'] * row['propeller_size']
    deviation = abs(actual_product - ideal_product) / ideal_product
    if deviation > 0.2: score -= deviation * 40

    # Pénalité Surcharge Hélice
    max_load = row['propeller_size'] * 250 * 1.5
    if row['total_weight'] > max_load:
        score -= ((row['total_weight'] - max_load) / max_load) * 60
        
    # Bruit aléatoire (Noise)
    score += np.random.normal(0, 3)
    return max(0, min(100, score))

df['score'] = df.apply(calculate_score, axis=1).round(1)

# 4. Export CSV
df.to_csv('drone_config_rating.csv', index=False)
print("Fichier 'drone_config_rating.csv' généré avec 50,000 lignes.")