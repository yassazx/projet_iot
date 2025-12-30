/**
 * AI Routes
 * Endpoints pour l'intégration avec le module AI
 */

const express = require('express');
const router = express.Router();
const { broadcastAlert } = require('../services/websocket');

// Historique des alertes (en mémoire)
const alertHistory = [];
const MAX_ALERTS = 50;

/**
 * POST /api/ai/alert
 * Recevoir une alerte du modèle AI
 */
router.post('/alert', (req, res) => {
    try {
        const { severity, message, angle, type } = req.body;

        // Validation
        if (!message) {
            return res.status(400).json({
                error: 'Message requis',
                example: {
                    severity: 'warning',
                    message: 'Inclinaison maximale détectée',
                    angle: 45.5,
                    type: 'max_inclination'
                }
            });
        }

        // Créer l'alerte
        const alert = {
            id: Date.now().toString(36),
            severity: severity || 'warning', // 'info', 'warning', 'danger'
            message,
            angle: angle || null,
            type: type || 'general',
            timestamp: Date.now()
        };

        // Ajouter à l'historique
        alertHistory.unshift(alert);
        if (alertHistory.length > MAX_ALERTS) {
            alertHistory.pop();
        }

        // Diffuser via WebSocket
        const clientsNotified = broadcastAlert(alert);

        console.log(`🚨 Alerte AI [${alert.severity}]: ${alert.message}`);

        res.status(201).json({
            success: true,
            alert,
            clientsNotified
        });

    } catch (error) {
        console.error('Erreur POST /ai/alert:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * GET /api/ai/alerts
 * Obtenir l'historique des alertes
 */
router.get('/alerts', (req, res) => {
    const count = parseInt(req.query.count) || 20;

    res.json({
        success: true,
        count: Math.min(count, alertHistory.length),
        alerts: alertHistory.slice(0, count)
    });
});

/**
 * DELETE /api/ai/alerts
 * Effacer l'historique des alertes
 */
router.delete('/alerts', (req, res) => {
    alertHistory.length = 0;
    res.json({
        success: true,
        message: 'Historique des alertes effacé'
    });
});

module.exports = router;
