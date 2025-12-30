/**
 * Telemetry Routes
 * Endpoints pour recevoir et consulter les données de télémétrie
 */

const express = require('express');
const router = express.Router();
const { dataStore } = require('../services/dataStore');
const { broadcastTelemetry } = require('../services/websocket');

/**
 * POST /api/telemetry
 * Recevoir des données du Raspberry Pi
 */
router.post('/', (req, res) => {
    try {
        const { pitch, roll, yaw, temperature } = req.body;

        // Validation
        if (pitch === undefined || roll === undefined || yaw === undefined) {
            return res.status(400).json({
                error: 'Données manquantes',
                required: ['pitch', 'roll', 'yaw'],
                optional: ['temperature', 'timestamp']
            });
        }

        // Valider les plages de valeurs
        if (Math.abs(pitch) > 180 || Math.abs(roll) > 180 || Math.abs(yaw) > 360) {
            return res.status(400).json({
                error: 'Valeurs hors limites',
                limits: {
                    pitch: '±180°',
                    roll: '±180°',
                    yaw: '±360°'
                }
            });
        }

        // Stocker les données
        const telemetry = dataStore.add({
            pitch: parseFloat(pitch),
            roll: parseFloat(roll),
            yaw: parseFloat(yaw),
            temperature: temperature ? parseFloat(temperature) : null
        });

        // Diffuser via WebSocket
        const clientsNotified = broadcastTelemetry(telemetry);

        res.status(201).json({
            success: true,
            data: telemetry,
            clientsNotified
        });

    } catch (error) {
        console.error('Erreur POST /telemetry:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * GET /api/telemetry/latest
 * Obtenir les dernières données
 */
router.get('/latest', (req, res) => {
    const latest = dataStore.getLatest();

    if (!latest) {
        return res.status(404).json({
            error: 'Aucune donnée disponible',
            message: 'Le Raspberry Pi n\'a pas encore envoyé de données'
        });
    }

    res.json({
        success: true,
        data: latest,
        stats: dataStore.getStats()
    });
});

/**
 * GET /api/telemetry/history
 * Obtenir l'historique des données
 */
router.get('/history', (req, res) => {
    const count = parseInt(req.query.count) || 50;
    const data = dataStore.getRecent(count);

    res.json({
        success: true,
        count: data.length,
        data: data,
        stats: dataStore.getStats()
    });
});

/**
 * GET /api/telemetry/stats
 * Obtenir les statistiques
 */
router.get('/stats', (req, res) => {
    res.json({
        success: true,
        totalMeasures: dataStore.getCount(),
        stats: dataStore.getStats()
    });
});

/**
 * DELETE /api/telemetry
 * Réinitialiser les données (pour les tests)
 */
router.delete('/', (req, res) => {
    dataStore.clear();
    res.json({
        success: true,
        message: 'Données réinitialisées'
    });
});

module.exports = router;
