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
                specs JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Drone profiles table (user's drones)
        await client.query(`
            CREATE TABLE IF NOT EXISTS drone_profiles (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                model_id INTEGER REFERENCES drone_models(id),
                name VARCHAR(100) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Insert default drone models if empty
        const modelCount = await client.query('SELECT COUNT(*) FROM drone_models');
        if (parseInt(modelCount.rows[0].count) === 0) {
            await client.query(`
                INSERT INTO drone_models (name, brand, model_file, specs) VALUES
                ('Drone Caméra', 'Standard', 'animated_drone_with_camera_free.glb', '{"weight": "1200g", "flight_time": "25min", "max_speed": "60km/h"}'),
                ('Drone Design', 'Custom', 'drone_design.glb', '{"weight": "800g", "flight_time": "30min", "max_speed": "70km/h"}'),
                ('Drone Générique', 'DIY', 'generic.glb', '{"weight": "variable", "flight_time": "variable", "max_speed": "variable"}');
            `);
            console.log('📋 Default drone models inserted');
        }

        console.log('✅ Database tables initialized');
    } catch (err) {
        console.error('❌ Error initializing database:', err);
    } finally {
        client.release();
    }
};

module.exports = { pool, initDB };
