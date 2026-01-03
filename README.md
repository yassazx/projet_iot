# 🚁 Drone IOT - Guide d'exécution

## Prérequis

- **Node.js** 18+ 
- **PostgreSQL** 14+
- **Python** 3.10+ (pour l'API ML)

---

## 🚀 Démarrage rapide

### 1. Base de données PostgreSQL

```bash
# Créer la base de données
psql -U postgres -c "CREATE DATABASE drone_iot;"
```

### 2. Backend (Node.js)

```bash
cd Backend
npm install
npm run dev
```
→ Serveur sur **http://localhost:3000**

### 3. Frontend (React + Vite)

```bash
cd Frontend
npm install
npm run dev
```
→ Application sur **http://localhost:5173**

### 4. API ML Flask (optionnel)

```bash
cd "AI (benmchich)"
pip install -r requirements.txt
python app.py
```
→ API ML sur **http://localhost:5001**

---

## 📁 Structure du projet

```
Drone_IOT/
├── Backend/           # Serveur Node.js + Express
│   ├── config/        # Configuration DB
│   ├── routes/        # API REST
│   └── server.js      # Point d'entrée
├── Frontend/          # React + Vite + Three.js
│   └── src/
│       ├── components/
│       └── pages/
├── AI (benmchich)/    # Modèle ML Flask
│   ├── app.py         # Serveur Flask
│   └── drone_rating_model.pkl
└── docs/              # Documentation
```

---

## 🔧 Variables d'environnement

### Backend (`Backend/.env`)
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=drone_iot
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your_secret_key
```

---

## 🔗 URLs en développement

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| Flask ML API | http://localhost:5001 |
| WebSocket | ws://localhost:3000 |

---

## 📝 Commandes utiles

```bash
# Lancer tout le projet (3 terminaux)
# Terminal 1:
cd Backend && npm run dev

# Terminal 2:
cd Frontend && npm run dev

# Terminal 3 (optionnel):
cd "AI (benmchich)" && python app.py
```

---

## ✅ Checklist de démarrage

- [ ] PostgreSQL installé et démarré
- [ ] Base `drone_iot` créée
- [ ] `npm install` dans Backend et Frontend
- [ ] Backend démarré (port 3000)
- [ ] Frontend démarré (port 5173)
- [ ] (Optionnel) Flask API démarrée (port 5001)
