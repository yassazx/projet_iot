import redis
import json
import time
from dotenv import load_dotenv
load_dotenv()


# --- CONFIGURATION AZURE REDIS ---
REDIS_HOST = os.getenv("REDIS_HOST")
REDIS_KEY = os.getenv("REDIS_KEY")
REDIS_PORT = int(os.getenv("REDIS_PORT"))

# --- CONNEXION À REDIS ---
try:
    r = redis.StrictRedis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        password=REDIS_KEY,
        ssl=True,
        decode_responses=True,
        socket_timeout=5
    )
    if r.ping():
        print("✅ Connexion à Redis réussie !")
    else:
        print("❌ Impossible de se connecter à Redis.")
        exit()
except Exception as e:
    print(f"❌ Erreur de connexion : {e}")
    exit()

print("📡 Affichage des données en temps réel. Ctrl+C pour arrêter.")

try:
    while True:
        # Récupère la dernière donnée live
        live_data_json = r.get("drone:live")
        if live_data_json:
            live_data = json.loads(live_data_json)
            print(f"\n--- DONNÉE LIVE ---")
            print(f"Timestamp : {live_data['timestamp']}")
            print(f"Pitch : {live_data['mpu6050']['calculated_angles']['pitch']}")
            print(f"Roll : {live_data['mpu6050']['calculated_angles']['roll']}")
            print(f"Température : {live_data['dht22']['temp']}°C")
            print(f"Humidité : {live_data['dht22']['humidity']}%")
            print(f"Status : {live_data['status']}")
        else:
            print("⚠️ Pas de donnée live disponible.")

        # Affiche les 5 dernières données de l'historique
        history = r.lrange("drone:history", 0, 4)
        print("\n--- 5 DERNIÈRES DONNÉES HISTORIQUES ---")
        for idx, item in enumerate(history):
            data = json.loads(item)
            print(f"{idx+1}. Timestamp: {data['timestamp']}, Pitch: {data['mpu6050']['calculated_angles']['pitch']}, Temp: {data['dht22']['temp']}°C")

        time.sleep(5)

except KeyboardInterrupt:
    print("\nArrêt de l'affichage.")
