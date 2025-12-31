/**
 * Mock Data Generator
 * Simule les données du Raspberry Pi avec:
 * - MPU6050 IMU: pitch, roll, yaw
 * - Arduino Uno: vitesse moteur
 * - DHT22: température, humidité
 */

const { dataStore } = require('../services/dataStore');
const { broadcastTelemetry } = require('../services/websocket');

let intervalId = null;
let time = 0;

/**
 * Générer des données de télémétrie simulées
 * Architecture: Raspberry Pi + MPU6050 + Arduino Uno + DHT22
 */
function generateMockData() {
    time += 0.1;

    // Ajouter un peu de bruit réaliste
    const noise = () => (Math.random() - 0.5) * 2;

    // === MPU6050 IMU (Raspberry Pi) ===
    // Pitch: -30° à +30° (oscillations naturelles)
    const pitch = 20 * Math.sin(time * 0.5) + 10 * Math.sin(time * 1.3);

    // Roll: -30° à +30°
    const roll = 15 * Math.cos(time * 0.7) + 10 * Math.sin(time * 1.5);

    // Yaw: 0° à 360° (rotation continue lente)
    const yaw = (180 + 180 * Math.sin(time * 0.2)) % 360;

    // === Arduino Uno - Vitesse Moteur ===
    // 0% à 100% (variation selon pitch/roll)
    const baseMotorSpeed = 50; // Vol stationnaire = 50%
    const motorAdjustment = Math.abs(pitch) + Math.abs(roll);
    const motorSpeed = Math.min(100, Math.max(0, baseMotorSpeed + motorAdjustment * 0.5));

    // === DHT22 - Température & Humidité ===
    // Température: 20°C à 40°C
    const temperature = 30 + 5 * Math.sin(time * 0.05) + noise() * 0.5;

    // Humidité: 30% à 80%
    const humidity = 55 + 20 * Math.sin(time * 0.08) + noise() * 2;

    const telemetry = {
        // MPU6050
        pitch: Math.round((pitch + noise()) * 100) / 100,
        roll: Math.round((roll + noise()) * 100) / 100,
        yaw: Math.round((yaw + noise()) * 100) / 100,
        // Arduino
        motorSpeed: Math.round(motorSpeed * 10) / 10,
        // DHT22
        temperature: Math.round(temperature * 10) / 10,
        humidity: Math.round(humidity * 10) / 10,
        // Metadata
        source: 'mock',
        timestamp: Date.now()
    };

    // Stocker et diffuser
    dataStore.add(telemetry);
    broadcastTelemetry(telemetry);

    return telemetry;
}

/**
 * Démarrer le générateur de données mock
 * @param {number} intervalMs - Intervalle en millisecondes (défaut: 100ms)
 */
function startMockDataGenerator(intervalMs = 100) {
    if (intervalId) {
        console.log('⚠️  Mock generator déjà en cours');
        return false;
    }

    time = 0; // Reset time on start
    intervalId = setInterval(() => {
        const data = generateMockData();
        // Log occasionnel
        if (Math.random() < 0.02) {
            console.log(`📊 Mock: pitch=${data.pitch}° roll=${data.roll}° motor=${data.motorSpeed}% temp=${data.temperature}°C`);
        }
    }, intervalMs);

    console.log(`✅ Mock data generator DÉMARRÉ (intervalle: ${intervalMs}ms)`);
    return true;
}

/**
 * Arrêter le générateur de données mock
 */
function stopMockDataGenerator() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        console.log('⏹️  Mock data generator ARRÊTÉ');
        return true;
    }
    return false;
}

/**
 * Vérifier si le générateur est actif
 */
function isMockGeneratorRunning() {
    return intervalId !== null;
}

module.exports = {
    generateMockData,
    startMockDataGenerator,
    stopMockDataGenerator,
    isMockGeneratorRunning
};
