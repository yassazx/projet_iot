/**
 * PostgreSQL Database Configuration
 */
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'drone_iot',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

// Test connection
pool.on('connect', () => {
    console.log('📦 Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('❌ PostgreSQL connection error:', err);
});

// Initialize database tables
const initDB = async () => {
    const client = await pool.connect();
    try {
        // Users table
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Drone models table (predefined models)
        await client.query(`
            CREATE TABLE IF NOT EXISTS drone_models (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                brand VARCHAR(100),
                image_url VARCHAR(255),
                model_file VARCHAR(255),
                is_manipulable BOOLEAN DEFAULT false,
                specs JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Add is_manipulable column if not exists
        await client.query(`
            ALTER TABLE drone_models 
            ADD COLUMN IF NOT EXISTS is_manipulable BOOLEAN DEFAULT false;
        `);

        // Drone profiles table (user's drones)
        await client.query(`
            CREATE TABLE IF NOT EXISTS drone_profiles (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                model_id INTEGER REFERENCES drone_models(id),
                name VARCHAR(100) NOT NULL,
                description TEXT,
                selected_skin VARCHAR(255) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Add selected_skin column if not exists
        await client.query(`
            ALTER TABLE drone_profiles 
            ADD COLUMN IF NOT EXISTS selected_skin VARCHAR(255) DEFAULT NULL;
        `);

        // ML History table for predictions and recommendations
        await client.query(`
            CREATE TABLE IF NOT EXISTS ml_history (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                type VARCHAR(20) NOT NULL,
                prototype_name VARCHAR(100) NOT NULL,
                form_data JSONB,
                result JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Add index for faster queries
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_ml_history_user_id 
            ON ml_history(user_id, created_at DESC);
        `);


        // Insert default drone models if empty
        const modelCount = await client.query('SELECT COUNT(*) FROM drone_models');
        if (parseInt(modelCount.rows[0].count) === 0) {
            await client.query(`
                INSERT INTO drone_models (name, brand, model_file, is_manipulable, specs) VALUES
                ('Drone Vision Standard', 'Vision', NULL, false, '{"weight": "1200g", "flight_time": "25min", "max_speed": "60km/h", "description": "Drone pour observation uniquement"}'),
                ('Drone Simulation Pro', 'Manipulable', NULL, true, '{"weight": "800g", "flight_time": "30min", "max_speed": "70km/h", "description": "Drone manipulable répondant aux données mock"}');
            `);
            console.log('📋 Default drone models inserted (Vision + Manipulable)');
        }

        console.log('✅ Database tables initialized');
    } catch (err) {
        console.error('❌ Error initializing database:', err);
    } finally {
        client.release();
    }
};

module.exports = { pool, initDB };
