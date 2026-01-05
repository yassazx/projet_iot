const { createClient } = require('redis');
const { broadcastTelemetry } = require('./websocket');
const { dataStore } = require('./dataStore');

let client = null;
let intervalId = null;

// Initialize Redis Client
async function initRedis() {
    if (client && client.isOpen) return client;

    const REDIS_HOST = process.env.REDIS_HOST;
    const REDIS_PORT = process.env.REDIS_PORT;
    const REDIS_KEY = process.env.REDIS_KEY;

    if (!REDIS_HOST || !REDIS_KEY) {
        console.warn("⚠️ Redis credentials missing in .env (REDIS_HOST, REDIS_KEY)");
        return null; // Handle missing config
    }

    client = createClient({
        password: REDIS_KEY,
        socket: {
            host: REDIS_HOST,
            port: REDIS_PORT ? parseInt(REDIS_PORT) : 6380,
            tls: true, // ssl=True in python
            connectTimeout: 5000
        }
    });

    client.on('error', (err) => console.error('❌ Redis Client Error:', err));

    await client.connect();
    console.log("✅ Connexion à Redis réussie (Service Node.js) !");
    return client;
}

// Fetch Live Data
async function fetchLiveDroneData() {
    try {
        if (!client || !client.isOpen) {
            const c = await initRedis();
            if (!c) return; // Retry next tick
        }

        // Fetch "drone:live" as per data_fetch.py
        const data = await client.get('drone:live');

        if (data) {
            const parsed = JSON.parse(data);

            // Map to application telemetry format
            // Python: timestamp, mpu6050.calculated_angles.pitch/roll, dht22.temp/humidity, status
            const telemetry = {
                pitch: parsed.mpu6050?.calculated_angles?.pitch || 0,
                roll: parsed.mpu6050?.calculated_angles?.roll || 0,
                yaw: parsed.mpu6050?.calculated_angles?.yaw || 0, // Fallback if added later
                motorSpeed: 0, // Not available in current Redis schema
                temperature: parsed.dht22?.temp || 0,
                humidity: parsed.dht22?.humidity || 0,
                source: 'redis',
                status: parsed.status,
                timestamp: Date.now()
            };

            // Store and Broadcast
            dataStore.add(telemetry);
            broadcastTelemetry(telemetry);
        }
    } catch (err) {
        console.error("❌ Error fetching from Redis:", err);
    }
}

// Interface compatible with mockDataController
function start(intervalMs = 200) {
    if (intervalId) return;

    console.log(`📡 Starting Redis data fetcher (interval: ${intervalMs}ms)...`);

    initRedis().then((c) => {
        if (c) {
            intervalId = setInterval(fetchLiveDroneData, intervalMs);
        } else {
            console.warn("⚠️ Redis not configured, data fetcher not started.");
        }
    }).catch(e => console.error("Failed to start redis fetcher", e));
}

function stop() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        console.log("⏹️ Redis data fetcher stopped");
    }
    if (client && client.isOpen) {
        client.disconnect();
    }
}

// Used by websocket.js to determine if it should auto-start this controller
function shouldUseMock() {
    // If we are using this service, we want it to run when clients connect.
    // We return true so websocket.js calls start().
    return true;
}

module.exports = {
    start,
    stop,
    shouldUseMock,
    initRedis
};
