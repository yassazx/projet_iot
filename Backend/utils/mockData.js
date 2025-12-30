/**
 * Mock Data Generator
 * Génère des données simulées pour tester sans Raspberry Pi
 */

const { dataStore } = require('../services/dataStore');
const { broadcastTelemetry } = require('../services/websocket');

let intervalId = null;
let time = 0;

/**
 * Générer des données de télémétrie simulées
 * Simule un drone qui oscille doucement
 */
function generateMockData() {
    time += 0.1;

    // Simulation d'oscillations naturelles d'un drone
    const pitch = 15 * Math.sin(time * 0.5) + 5 * Math.sin(time * 1.3);
    const roll = 10 * Math.cos(time * 0.7) + 3 * Math.sin(time * 1.5);
    const yaw = 45 * Math.sin(time * 0.2);
    const temperature = 25 + 2 * Math.sin(time * 0.1);

    // Ajouter un peu de bruit
    const noise = () => (Math.random() - 0.5) * 2;

    const telemetry = {
        pitch: Math.round((pitch + noise()) * 100) / 100,
        roll: Math.round((roll + noise()) * 100) / 100,
        yaw: Math.round((yaw + noise()) * 100) / 100,
        temperature: Math.round((temperature + noise() * 0.5) * 10) / 10
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
        return;
    }

    intervalId = setInterval(() => {
        const data = generateMockData();
        // Log occasionnel
        if (Math.random() < 0.02) {
            console.log(`📊 Mock data: pitch=${data.pitch}°, roll=${data.roll}°, yaw=${data.yaw}°`);
        }
    }, intervalMs);

    console.log(`✅ Mock data generator démarré (intervalle: ${intervalMs}ms)`);
}

/**
 * Arrêter le générateur de données mock
 */
function stopMockDataGenerator() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        console.log('⏹️  Mock data generator arrêté');
    }
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
