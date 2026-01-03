/**
 * Drone Rating Routes
 * Proxy to Flask ML API for drone configuration rating
 */

const express = require('express');
const axios = require('axios');
const router = express.Router();

// Flask API URL
const FLASK_API_URL = process.env.FLASK_RATING_URL || 'http://localhost:5001';

/**
 * POST /api/drone-rating/predict
 * Proxy to Flask ML API for prediction
 */
router.post('/predict', async (req, res) => {
    try {
        const {
            total_weight,
            center_of_mass_offset,
            thrust_to_weight,
            arm_length,
            propeller_size,
            motor_kv,
            prototypeName
        } = req.body;

        // Validation
        if (!total_weight || !thrust_to_weight || !propeller_size || !motor_kv) {
            return res.status(400).json({
                error: 'Paramètres requis manquants',
                required: ['total_weight', 'thrust_to_weight', 'propeller_size', 'motor_kv']
            });
        }

        const payload = {
            total_weight: parseFloat(total_weight),
            center_of_mass_offset: parseFloat(center_of_mass_offset) || 0,
            thrust_to_weight: parseFloat(thrust_to_weight),
            arm_length: parseFloat(arm_length) || 200,
            propeller_size: parseInt(propeller_size),
            motor_kv: parseInt(motor_kv)
        };

        // Call Flask API
        const response = await axios.post(`${FLASK_API_URL}/predict`, payload);

        console.log(`🎯 Drone Rating [ML]: ${prototypeName || 'Config'} → Score: ${response.data.rating.score}/100`);

        res.json({
            success: true,
            rating: response.data.rating
        });

    } catch (error) {
        console.error('Erreur POST /drone-rating/predict:', error.message);

        // If Flask API is not available, use fallback calculation
        if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
            console.log('⚠️ Flask API non disponible, utilisation du calcul local');
            return handleFallbackPrediction(req, res);
        }

        res.status(500).json({ error: 'Erreur lors du calcul du score' });
    }
});

/**
 * Fallback calculation if Flask API is not available
 */
function handleFallbackPrediction(req, res) {
    const {
        total_weight,
        center_of_mass_offset,
        thrust_to_weight,
        arm_length,
        propeller_size,
        motor_kv,
        prototypeName
    } = req.body;

    const params = {
        total_weight: parseFloat(total_weight),
        center_of_mass_offset: parseFloat(center_of_mass_offset) || 0,
        thrust_to_weight: parseFloat(thrust_to_weight),
        arm_length: parseFloat(arm_length) || 200,
        propeller_size: parseInt(propeller_size),
        motor_kv: parseInt(motor_kv)
    };

    let score = 100.0;

    // Pénalité Centre de Masse
    if (params.center_of_mass_offset > 0.5) {
        score -= Math.pow(params.center_of_mass_offset, 1.8) * 5;
    }

    // Pénalité Thrust/Weight
    if (params.thrust_to_weight < 1.2) {
        score -= 50;
    } else if (params.thrust_to_weight < 1.5) {
        score -= 20;
    } else if (params.thrust_to_weight > 3.0) {
        score -= 10;
    }

    // Pénalité Incohérence Moteur/Hélice
    const idealProduct = 12000;
    const actualProduct = params.motor_kv * params.propeller_size;
    const deviation = Math.abs(actualProduct - idealProduct) / idealProduct;
    if (deviation > 0.2) {
        score -= deviation * 40;
    }

    // Pénalité Surcharge Hélice
    const maxLoad = params.propeller_size * 250 * 1.5;
    if (params.total_weight > maxLoad) {
        score -= ((params.total_weight - maxLoad) / maxLoad) * 60;
    }

    score = Math.max(0, Math.min(100, score));
    score = Math.round(score * 10) / 10;

    let label, explanation;
    if (score < 40) {
        label = '❌ Mauvais';
        explanation = 'Drone mal équilibré ou sous-motorisé';
    } else if (score < 60) {
        label = '⚠️ Acceptable';
        explanation = 'Configuration utilisable mais perfectible';
    } else if (score < 80) {
        label = '✅ Bon';
        explanation = 'Bonne configuration globale';
    } else {
        label = '🏆 Excellent';
        explanation = 'Configuration optimale et stable';
    }

    console.log(`🎯 Drone Rating [Fallback]: ${prototypeName || 'Config'} → Score: ${score}/100`);

    res.json({
        success: true,
        rating: {
            score,
            label,
            explanation
        },
        fallback: true
    });
}

/**
 * GET /api/drone-rating/health
 * Check Flask API health
 */
router.get('/health', async (req, res) => {
    try {
        const response = await axios.get(`${FLASK_API_URL}/health`);
        res.json({
            status: 'ok',
            flask_api: response.data
        });
    } catch (error) {
        res.json({
            status: 'flask_unavailable',
            fallback: 'enabled',
            message: 'Flask API non disponible, mode fallback actif'
        });
    }
});

module.exports = router;
