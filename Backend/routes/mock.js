/**
 * Mock Control Routes
 * API pour contrôler manuellement le mock data generator
 */
const express = require('express');
const {
    startMockDataGenerator,
    stopMockDataGenerator,
    isMockGeneratorRunning
} = require('../utils/mockData');

const router = express.Router();

/**
 * GET /api/mock/status
 * Obtenir l'état du mock generator
 */
router.get('/status', (req, res) => {
    res.json({
        running: isMockGeneratorRunning(),
        message: isMockGeneratorRunning() ? 'Mock data en cours' : 'Mock data arrêté'
    });
});

/**
 * POST /api/mock/start
 * Démarrer le mock generator
 */
router.post('/start', (req, res) => {
    if (isMockGeneratorRunning()) {
        return res.status(400).json({
            success: false,
            message: 'Mock data déjà en cours'
        });
    }

    startMockDataGenerator();
    res.json({
        success: true,
        running: true,
        message: 'Mock data démarré'
    });
});

/**
 * POST /api/mock/stop
 * Arrêter le mock generator
 */
router.post('/stop', (req, res) => {
    if (!isMockGeneratorRunning()) {
        return res.status(400).json({
            success: false,
            message: 'Mock data déjà arrêté'
        });
    }

    stopMockDataGenerator();
    res.json({
        success: true,
        running: false,
        message: 'Mock data arrêté'
    });
});

/**
 * POST /api/mock/toggle
 * Basculer l'état du mock generator
 */
router.post('/toggle', (req, res) => {
    if (isMockGeneratorRunning()) {
        stopMockDataGenerator();
        res.json({
            success: true,
            running: false,
            message: 'Mock data arrêté'
        });
    } else {
        startMockDataGenerator();
        res.json({
            success: true,
            running: true,
            message: 'Mock data démarré'
        });
    }
});

module.exports = router;
