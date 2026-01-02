/**
 * Drone Telemetry Backend - Main Server
 * Serveur Express + WebSocket pour la télémétrie drone
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');

const { initWebSocket } = require('./services/websocket');
const { dataStore } = require('./services/dataStore');
const { initDB } = require('./config/db');
const telemetryRoutes = require('./routes/telemetry');
const aiRoutes = require('./routes/ai');
const authRoutes = require('./routes/auth');
const dronesRoutes = require('./routes/drones');
const mockRoutes = require('./routes/mock');
const recommendRoutes = require('./routes/recommend');
const historyRoutes = require('./routes/history');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
const MOCK_MODE = process.env.MOCK_MODE === 'true';

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
}));
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/drones', dronesRoutes);
app.use('/api/mock', mockRoutes);
app.use('/api/recommend', recommendRoutes);
app.use('/api/history', historyRoutes);

// Health check
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        mockMode: MOCK_MODE,
        connectedClients: require('./services/websocket').getClientCount(),
        dataPoints: dataStore.getCount(),
        uptime: process.uptime()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'Drone Telemetry Backend',
        version: '1.0.0',
        endpoints: {
            status: '/api/status',
            telemetry: '/api/telemetry',
            ai: '/api/ai/alert'
        }
    });
});

// Initialize WebSocket (no auto-start mock data)
initWebSocket(server);

// Start server
server.listen(PORT, async () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║          🚁 Drone Telemetry Backend Server 🚁            ║
╠══════════════════════════════════════════════════════════╣
║  HTTP Server:  http://localhost:${PORT}                    ║
║  WebSocket:    ws://localhost:${PORT}                      ║
║  Mock Control: MANUAL (via UI toggle)                    ║
╚══════════════════════════════════════════════════════════╝
    `);

    // Initialize database tables
    await initDB();

    console.log('📡 Mock data contrôlé manuellement via /api/mock/toggle');
});

module.exports = { app, server };

