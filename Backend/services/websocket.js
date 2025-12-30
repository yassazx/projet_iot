/**
 * WebSocket Service
 * Gestion des connexions WebSocket et diffusion temps réel
 */

const WebSocket = require('ws');

let wss = null;
let clients = new Set();

/**
 * Initialiser le serveur WebSocket
 */
function initWebSocket(server) {
    wss = new WebSocket.Server({ server });

    wss.on('connection', (ws, req) => {
        const clientId = Date.now().toString(36);
        clients.add(ws);

        console.log(`🔌 Client connecté: ${clientId} (Total: ${clients.size})`);

        // Envoyer un message de bienvenue
        ws.send(JSON.stringify({
            type: 'connection',
            status: 'connected',
            clientId: clientId,
            message: 'Connecté au serveur de télémétrie drone'
        }));

        // Gérer les messages entrants
        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                console.log(`📨 Message reçu de ${clientId}:`, data);

                // Répondre aux pings
                if (data.type === 'ping') {
                    ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                }
            } catch (error) {
                console.error('Erreur parsing message:', error);
            }
        });

        // Gérer la déconnexion
        ws.on('close', () => {
            clients.delete(ws);
            console.log(`🔌 Client déconnecté: ${clientId} (Total: ${clients.size})`);
        });

        // Gérer les erreurs
        ws.on('error', (error) => {
            console.error(`❌ Erreur WebSocket ${clientId}:`, error);
            clients.delete(ws);
        });
    });

    console.log('✅ Serveur WebSocket initialisé');
    return wss;
}

/**
 * Diffuser un message à tous les clients connectés
 */
function broadcast(data) {
    const message = JSON.stringify(data);
    let sentCount = 0;

    clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
            sentCount++;
        }
    });

    return sentCount;
}

/**
 * Diffuser des données de télémétrie
 */
function broadcastTelemetry(telemetry) {
    return broadcast({
        type: 'telemetry',
        data: telemetry,
        timestamp: Date.now()
    });
}

/**
 * Diffuser une alerte AI
 */
function broadcastAlert(alert) {
    return broadcast({
        type: 'alert',
        data: alert,
        timestamp: Date.now()
    });
}

/**
 * Obtenir le nombre de clients connectés
 */
function getClientCount() {
    return clients.size;
}

/**
 * Fermer toutes les connexions
 */
function closeAll() {
    clients.forEach((client) => {
        client.close();
    });
    clients.clear();
}

module.exports = {
    initWebSocket,
    broadcast,
    broadcastTelemetry,
    broadcastAlert,
    getClientCount,
    closeAll
};
