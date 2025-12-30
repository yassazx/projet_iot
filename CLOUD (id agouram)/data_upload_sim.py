import redis
import json
import time
import random
import math
from dotenv import load_dotenv
load_dotenv()

# --- CONFIGURATION AZURE REDIS (À MODIFIER) ---
REDIS_HOST = os.getenv("REDIS_HOST")
REDIS_KEY = os.getenv("REDIS_KEY")
REDIS_PORT = int(os.getenv("REDIS_PORT"))

print(f"Tentative de connexion à Azure Redis sur {REDIS_HOST}...")

try:
    r = redis.StrictRedis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        password=REDIS_KEY,
        ssl=True, 
        decode_responses=True,
        socket_timeout=5 # Évite de rester bloqué si le réseau est lent
    )
    # Test réel de ping
    if r.ping():
        print("✅ Connexion établie et vérifiée avec succès !")
except Exception as e:
    print(f"❌ Erreur de connexion : {e}")
    exit()

def generate_simulated_data():
    t = time.time()
    pitch = round(15 * math.sin(t * 0.5), 2)
    roll = round(10 * math.cos(t * 0.3), 2)
    
    payload = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "mpu6050": {
            "accel": {"x": 0.01, "y": 0.02, "z": 0.98},
            "gyro": {"x": 0.1, "y": 0.1, "z": 0.05},
            "calculated_angles": {"pitch": pitch, "roll": roll}
        },
        "dht22": {
            "temp": round(23.0 + random.uniform(-0.5, 0.5), 1),
            "humidity": round(45 + random.uniform(-1, 1), 1)
        },
        "motors": {
            "m1": 1500 + int(pitch), "m2": 1500 + int(pitch),
            "m3": 1500 - int(pitch), "m4": 1500 - int(pitch)
        },
        "status": "MANUAL_SIMULATION"
    }
    return payload

print("\n--- MODE MANUEL ACTIVÉ ---")
print("Appuyez sur 'y' puis ENTREE pour envoyer une donnée.")
print("Appuyez sur 'q' puis ENTREE pour quitter.")

try:
    while True:
        user_input = input("\nAction (y pour envoyer) : ").lower()

        if user_input == 'y':
            data = generate_simulated_data()
            json_data = json.dumps(data)
            
            # Envoi vers Redis
            r.set("drone:live", json_data)
            r.lpush("drone:history", json_data)
            r.ltrim("drone:history", 0, 50) # On garde les 50 derniers points
            
            print(f"🚀 [ENVOYÉ] Pitch: {data['mpu6050']['calculated_angles']['pitch']} | Temp: {data['dht22']['temp']}°C")
        
        elif user_input == 'q':
            print("Fermeture du script...")
            break
        else:
            print("Commande non reconnue. Utilisez 'y' pour envoyer ou 'q' pour quitter.")

except KeyboardInterrupt:
    print("\nInterrompu.")