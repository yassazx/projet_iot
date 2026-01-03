# 🗄️ Guide d'implémentation PostgreSQL sur Azure

## 📋 Vue d'ensemble

Ce document décrit comment migrer la base de données PostgreSQL locale du projet **Drone_IOT** vers **Azure Database for PostgreSQL**.

---

## 🏗️ Schéma de la base de données

### Tables

#### 1. `users` - Utilisateurs
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,  -- Hash bcrypt
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. `drone_models` - Modèles de drones prédéfinis
```sql
CREATE TABLE drone_models (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    brand VARCHAR(100),
    image_url VARCHAR(255),
    model_file VARCHAR(255),
    is_manipulable BOOLEAN DEFAULT false,
    specs JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. `drone_profiles` - Profils de drones utilisateur
```sql
CREATE TABLE drone_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    model_id INTEGER REFERENCES drone_models(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    selected_skin VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4. `ml_history` - Historique des prédictions ML
```sql
CREATE TABLE ml_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,  -- 'prediction', 'recommendation', 'rating'
    prototype_name VARCHAR(100) NOT NULL,
    form_data JSONB,   -- Paramètres d'entrée
    result JSONB,      -- Résultat de l'analyse
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour performances
CREATE INDEX idx_ml_history_user_id ON ml_history(user_id, created_at DESC);
```

### Diagramme des relations

```
┌─────────────┐       ┌─────────────────┐       ┌──────────────┐
│   users     │───1:N─│  drone_profiles │───N:1─│ drone_models │
└─────────────┘       └─────────────────┘       └──────────────┘
      │
      │ 1:N
      ▼
┌─────────────┐
│ ml_history  │
└─────────────┘
```

---

## ☁️ Création sur Azure

### Étape 1: Créer le serveur PostgreSQL

1. Aller sur **Azure Portal** → **Créer une ressource**
2. Rechercher **"Azure Database for PostgreSQL"**
3. Choisir **"Serveur flexible"** (recommandé)
4. Configurer:

| Paramètre | Valeur recommandée |
|-----------|-------------------|
| **Nom du serveur** | `drone-iot-db-server` |
| **Région** | `France Central` |
| **Version PostgreSQL** | `15` ou `16` |
| **Charge de travail** | `Développement` (moins cher) |
| **Calcul + stockage** | `Burstable B1ms` (1 vCore, 2 Go RAM) |
| **Stockage** | `32 Go` |

5. Authentification:
   - **Nom d'admin**: `drone_admin`
   - **Mot de passe**: (générer un mot de passe fort)

### Étape 2: Configurer le réseau

1. Aller dans **Mise en réseau** du serveur
2. Ajouter votre **IP publique** aux règles de pare-feu
3. Cocher **"Autoriser l'accès public depuis n'importe quel service Azure"**

### Étape 3: Créer la base de données

```bash
# Via Azure CLI
az postgres flexible-server db create \
  --resource-group <votre-resource-group> \
  --server-name drone-iot-db-server \
  --database-name drone_iot
```

Ou via **pgAdmin** / **Azure Data Studio**:
```sql
CREATE DATABASE drone_iot;
```

### Étape 4: Exécuter le schéma

Connectez-vous et exécutez les commandes `CREATE TABLE` ci-dessus.

---

## 🔧 Configuration Backend

### Variables d'environnement

Créer un fichier `.env` dans `Backend/`:

```env
# Azure PostgreSQL
DB_HOST=drone-iot-db-server.postgres.database.azure.com
DB_PORT=5432
DB_NAME=drone_iot
DB_USER=drone_admin
DB_PASSWORD=<votre-mot-de-passe>

# SSL requis pour Azure
DB_SSL=true
```

### Modifier `config/db.js`

```javascript
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    // SSL obligatoire pour Azure
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});
```

---

## 💰 Estimation des coûts

| Tier | Specs | Coût mensuel estimé |
|------|-------|---------------------|
| **Burstable B1ms** | 1 vCore, 2 Go RAM | ~15-20€/mois |
| **General Purpose D2s** | 2 vCores, 8 Go RAM | ~80-100€/mois |

> 💡 Pour le développement/tests, utiliser **Burstable B1ms**

---

## 🔐 Bonnes pratiques de sécurité

1. **Ne jamais committer les credentials** dans Git
2. Utiliser **Azure Key Vault** pour les secrets en production
3. Restreindre les **IP autorisées** dans le pare-feu
4. Activer les **sauvegardes automatiques** (7-35 jours)
5. Utiliser un **utilisateur dédié** par application (pas l'admin)

---

## 📝 Commandes utiles

### Connexion via psql
```bash
psql "host=drone-iot-db-server.postgres.database.azure.com port=5432 dbname=drone_iot user=drone_admin password=<pwd> sslmode=require"
```

### Export de la DB locale
```bash
pg_dump -h localhost -U postgres -d drone_iot > backup.sql
```

### Import vers Azure
```bash
psql "host=drone-iot-db-server.postgres.database.azure.com user=drone_admin dbname=drone_iot sslmode=require" < backup.sql
```

---

## ✅ Checklist de migration

- [ ] Créer le serveur Azure PostgreSQL Flexible
- [ ] Configurer les règles de pare-feu
- [ ] Créer la base de données `drone_iot`
- [ ] Exécuter les scripts de création de tables
- [ ] Mettre à jour les variables d'environnement du Backend
- [ ] Activer SSL dans la configuration pg Pool
- [ ] Tester la connexion depuis le Backend
- [ ] Configurer les sauvegardes automatiques
