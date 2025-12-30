# Drone Telemetry Backend

Backend Node.js pour le système de télémétrie drone avec capteur MPU6050.

## Installation

```bash
npm install
```

## Démarrage

```bash
# Mode développement (avec hot-reload)
npm run dev

# Mode production
npm start
```

## API Endpoints

### Télémétrie
- `POST /api/telemetry` - Envoyer des données du Raspberry Pi
- `GET /api/telemetry/latest` - Obtenir les dernières données
- `GET /api/status` - État du système

### AI Interface
- `POST /api/ai/alert` - Recevoir des alertes du modèle AI

## WebSocket

Le serveur WebSocket écoute sur le port 3001 et diffuse les données en temps réel.

## Variables d'environnement

Créer un fichier `.env` :
```
PORT=3000
WS_PORT=3001
MOCK_MODE=true
```
