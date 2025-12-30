/**
 * Data Store Service
 * Stockage en mémoire des données de télémétrie avec buffer circulaire
 */

class DataStore {
    constructor(maxSize = 100) {
        this.maxSize = maxSize;
        this.data = [];
        this.stats = {
            pitch: { min: 0, max: 0, avg: 0 },
            roll: { min: 0, max: 0, avg: 0 },
            yaw: { min: 0, max: 0, avg: 0 }
        };
    }

    /**
     * Ajouter une nouvelle mesure
     */
    add(telemetry) {
        const entry = {
            ...telemetry,
            timestamp: telemetry.timestamp || Date.now()
        };

        this.data.push(entry);

        // Buffer circulaire - supprimer les anciennes données
        if (this.data.length > this.maxSize) {
            this.data.shift();
        }

        // Mettre à jour les statistiques
        this.updateStats();

        return entry;
    }

    /**
     * Obtenir la dernière mesure
     */
    getLatest() {
        return this.data.length > 0 ? this.data[this.data.length - 1] : null;
    }

    /**
     * Obtenir les N dernières mesures
     */
    getRecent(count = 10) {
        return this.data.slice(-count);
    }

    /**
     * Obtenir toutes les données
     */
    getAll() {
        return [...this.data];
    }

    /**
     * Obtenir le nombre de mesures
     */
    getCount() {
        return this.data.length;
    }

    /**
     * Obtenir les statistiques
     */
    getStats() {
        return { ...this.stats };
    }

    /**
     * Mettre à jour les statistiques
     */
    updateStats() {
        if (this.data.length === 0) return;

        const pitchValues = this.data.map(d => d.pitch);
        const rollValues = this.data.map(d => d.roll);
        const yawValues = this.data.map(d => d.yaw);

        this.stats = {
            pitch: this.calculateStats(pitchValues),
            roll: this.calculateStats(rollValues),
            yaw: this.calculateStats(yawValues)
        };
    }

    /**
     * Calculer min, max, moyenne
     */
    calculateStats(values) {
        const min = Math.min(...values);
        const max = Math.max(...values);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        return { min, max, avg: Math.round(avg * 100) / 100 };
    }

    /**
     * Réinitialiser le store
     */
    clear() {
        this.data = [];
        this.stats = {
            pitch: { min: 0, max: 0, avg: 0 },
            roll: { min: 0, max: 0, avg: 0 },
            yaw: { min: 0, max: 0, avg: 0 }
        };
    }
}

// Singleton instance
const dataStore = new DataStore();

module.exports = { dataStore, DataStore };
