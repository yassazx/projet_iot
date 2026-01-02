const express = require('express');
const router = express.Router();
const pool = require('../config/db').pool;
const { authMiddleware } = require('../middleware/authMiddleware');

// Save prediction/recommendation to global history
router.post('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            type,
            prototypeName,
            formData,
            result
        } = req.body;

        const query = `
            INSERT INTO ml_history (user_id, type, prototype_name, form_data, result)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, created_at
        `;

        const values = [
            userId,
            type,
            prototypeName,
            JSON.stringify(formData),
            JSON.stringify(result)
        ];

        const { rows } = await pool.query(query, values);

        res.json({
            success: true,
            id: rows[0].id,
            created_at: rows[0].created_at
        });
    } catch (error) {
        console.error('Error saving to history:', error);
        res.status(500).json({ error: 'Failed to save history' });
    }
});

// Get user's global history
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        const query = `
            SELECT id, type, prototype_name, form_data, result, created_at
            FROM ml_history
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `;

        const { rows } = await pool.query(query, [userId, limit, offset]);

        // Get total count
        const countResult = await pool.query(
            'SELECT COUNT(*) FROM ml_history WHERE user_id = $1',
            [userId]
        );
        const total = parseInt(countResult.rows[0].count);

        res.json({
            success: true,
            history: rows.map(row => ({
                id: row.id,
                type: row.type,
                prototypeName: row.prototype_name,
                formData: row.form_data,
                result: row.result,
                createdAt: row.created_at
            })),
            total,
            limit,
            offset
        });
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

// Delete a history entry
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const historyId = req.params.id;

        const result = await pool.query(
            'DELETE FROM ml_history WHERE id = $1 AND user_id = $2 RETURNING id',
            [historyId, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Entry not found' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting history:', error);
        res.status(500).json({ error: 'Failed to delete entry' });
    }
});

module.exports = router;
