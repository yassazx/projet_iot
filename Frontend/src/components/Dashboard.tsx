import type { TelemetryData } from '../hooks/useWebSocket'

interface DashboardProps {
    telemetry: TelemetryData | null
}

/**
 * Composant Dashboard
 * Affiche les métriques de télémétrie en temps réel
 */
function Dashboard({ telemetry }: DashboardProps) {
    const formatAngle = (value: number | undefined): string => {
        if (value === undefined || value === null) return '--'
        return value.toFixed(1)
    }

    const formatTemp = (value: number | undefined | null): string => {
        if (value === undefined || value === null) return '--'
        return value.toFixed(1)
    }

    return (
        <div className="card dashboard">
            <div className="card-header">
                <h2 className="card-title">
                    <span>📊</span> Télémétrie
                </h2>
            </div>
            <div className="card-body">
                <div className="metrics-grid">
                    {/* Pitch */}
                    <div className="metric-card">
                        <div className="metric-label">Pitch</div>
                        <div className="metric-value pitch">
                            {formatAngle(telemetry?.pitch)}
                            <span className="metric-unit">°</span>
                        </div>
                        <div className="metric-axis">↕ Avant/Arrière</div>
                    </div>

                    {/* Roll */}
                    <div className="metric-card">
                        <div className="metric-label">Roll</div>
                        <div className="metric-value roll">
                            {formatAngle(telemetry?.roll)}
                            <span className="metric-unit">°</span>
                        </div>
                        <div className="metric-axis">↔ Gauche/Droite</div>
                    </div>

                    {/* Yaw */}
                    <div className="metric-card">
                        <div className="metric-label">Yaw</div>
                        <div className="metric-value yaw">
                            {formatAngle(telemetry?.yaw)}
                            <span className="metric-unit">°</span>
                        </div>
                        <div className="metric-axis">↻ Rotation</div>
                    </div>
                </div>

                {/* Température (si disponible) */}
                {telemetry?.temperature !== undefined && telemetry?.temperature !== null && (
                    <div className="metric-card temperature" style={{ marginTop: '1rem' }}>
                        <div className="metric-label">🌡️ Température</div>
                        <div className="metric-value">
                            {formatTemp(telemetry.temperature)}
                            <span className="metric-unit">°C</span>
                        </div>
                    </div>
                )}

                {/* Humidité DHT22 */}
                {(telemetry as any)?.humidity !== undefined && (telemetry as any)?.humidity !== null && (
                    <div className="metric-card humidity" style={{ marginTop: '0.5rem' }}>
                        <div className="metric-label">💧 Humidité</div>
                        <div className="metric-value">
                            {formatTemp((telemetry as any).humidity)}
                            <span className="metric-unit">%</span>
                        </div>
                    </div>
                )}

                {/* Vitesse Moteur Arduino */}
                {(telemetry as any)?.motorSpeed !== undefined && (telemetry as any)?.motorSpeed !== null && (
                    <div className="metric-card motor" style={{ marginTop: '0.5rem' }}>
                        <div className="metric-label">⚡ Moteur</div>
                        <div className="metric-value">
                            {formatTemp((telemetry as any).motorSpeed)}
                            <span className="metric-unit">%</span>
                        </div>
                    </div>
                )}

                {/* Timestamp */}
                {telemetry?.timestamp && (
                    <div className="timestamp" style={{
                        marginTop: '1rem',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        textAlign: 'center'
                    }}>
                        Dernière mise à jour: {new Date(telemetry.timestamp).toLocaleTimeString()}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Dashboard
