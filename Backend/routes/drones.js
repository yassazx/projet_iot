/**
 * Drone Routes
 * Handles drone models and user profiles
 */
const express = require('express');
const { pool } = require('../config/db');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * GET /api/drones/models
 * Get all available drone models
 */
router.get('/models', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM drone_models ORDER BY name ASC'
        );
        res.json({ models: result.rows });
    } catch (err) {
        console.error('Error fetching models:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération des modèles' });
    }
});

/**
 * GET /api/drones/profiles
 * Get user's drone profiles (protected)
 */
router.get('/profiles', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT dp.*, dm.name as model_name, dm.brand, dm.model_file, dm.is_manipulable, dm.specs
             FROM drone_profiles dp
             LEFT JOIN drone_models dm ON dp.model_id = dm.id
             WHERE dp.user_id = $1
             ORDER BY dp.created_at DESC`,
            [req.user.id]
        );
        res.json({ profiles: result.rows });
    } catch (err) {
        console.error('Error fetching profiles:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération des profils' });
    }
});

/**
 * GET /api/drones/profiles/:id
 * Get a specific drone profile (protected)
 */
router.get('/profiles/:id', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT dp.*, dm.name as model_name, dm.brand, dm.model_file, dm.specs
             FROM drone_profiles dp
             LEFT JOIN drone_models dm ON dp.model_id = dm.id
             WHERE dp.id = $1 AND dp.user_id = $2`,
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Profil non trouvé' });
        }

        res.json({ profile: result.rows[0] });
    } catch (err) {
        console.error('Error fetching profile:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
    }
});

/**
 * POST /api/drones/profiles
 * Create a new drone profile (protected)
 */
router.post('/profiles', authMiddleware, async (req, res) => {
    try {
        const { model_id, name, description } = req.body;

        if (!model_id || !name) {
            return res.status(400).json({
                error: 'Le modèle et le nom sont requis'
            });
        }

        // Verify model exists
        const modelCheck = await pool.query(
            'SELECT id FROM drone_models WHERE id = $1',
            [model_id]
        );

        if (modelCheck.rows.length === 0) {
            return res.status(400).json({ error: 'Modèle invalide' });
        }

        const result = await pool.query(
            `INSERT INTO drone_profiles (user_id, model_id, name, description)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [req.user.id, model_id, name, description || '']
        );

        // Fetch with model info
        const profile = await pool.query(
            `SELECT dp.*, dm.name as model_name, dm.brand, dm.model_file, dm.specs
             FROM drone_profiles dp
             LEFT JOIN drone_models dm ON dp.model_id = dm.id
             WHERE dp.id = $1`,
            [result.rows[0].id]
        );

        res.status(201).json({
            message: 'Profil créé avec succès',
            profile: profile.rows[0]
        });
    } catch (err) {
        console.error('Error creating profile:', err);
        res.status(500).json({ error: 'Erreur lors de la création du profil' });
    }
});

/**
 * DELETE /api/drones/profiles/:id
 * Delete a drone profile (protected)
 */
router.delete('/profiles/:id', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM drone_profiles WHERE id = $1 AND user_id = $2 RETURNING id',
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Profil non trouvé' });
        }

        res.json({ message: 'Profil supprimé avec succès' });
    } catch (err) {
        console.error('Error deleting profile:', err);
        res.status(500).json({ error: 'Erreur lors de la suppression du profil' });
    }
});

/**
 * POST /api/drones/reset-models
 * Reset drone models to match Vision/Manipulable profiles
 */
router.post('/reset-models', async (req, res) => {
    try {
        await pool.query('DELETE FROM drone_profiles');
        await pool.query('DELETE FROM drone_models');

        await pool.query(`
            INSERT INTO drone_models (name, brand, model_file, is_manipulable, specs) VALUES
            ('Drone Vision Standard', 'Vision', NULL, false, '{"weight": "1200g", "flight_time": "25min", "max_speed": "60km/h", "description": "Drone pour observation uniquement"}'),
            ('Drone Simulation Pro', 'Manipulable', NULL, true, '{"weight": "800g", "flight_time": "30min", "max_speed": "70km/h", "description": "Drone manipulable avec mock data"}')
        `);

        const models = await pool.query('SELECT * FROM drone_models ORDER BY name');

        res.json({
            success: true,
            message: 'Modèles réinitialisés (Vision + Manipulable)',
            models: models.rows
        });
    } catch (err) {
        console.error('Error resetting models:', err);
        res.status(500).json({ error: 'Erreur lors de la réinitialisation' });
    }
});

/**
 * PATCH /api/drones/profiles/:id/skin
 * Update selected skin for a drone profile (protected)
 */
router.patch('/profiles/:id/skin', authMiddleware, async (req, res) => {
    try {
        const { selected_skin } = req.body;

        const result = await pool.query(
            `UPDATE drone_profiles 
             SET selected_skin = $1 
             WHERE id = $2 AND user_id = $3 
             RETURNING *`,
            [selected_skin, req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Profil non trouvé' });
        }

        res.json({
            message: 'Skin mis à jour avec succès',
            profile: result.rows[0]
        });
    } catch (err) {
        console.error('Error updating skin:', err);
        res.status(500).json({ error: 'Erreur lors de la mise à jour du skin' });
    }
});

/**
 * GET /api/drones/available-skins
 * Get list of available 3D skins
 */
router.get('/available-skins', (req, res) => {
    const skins = [
        { id: 'procedural', name: 'Procédural (Défaut)', file: null, preview: '🚁' },
        { id: 'camera', name: 'Drone Caméra', file: 'animated_drone_with_camera_free.glb', preview: '📷' },
        { id: 'design', name: 'Drone Design', file: 'drone_design.glb', preview: '✨' }
    ];
    res.json({ skins });
});

module.exports = router;
