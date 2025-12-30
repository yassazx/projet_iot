import type { Alert } from '../hooks/useWebSocket'

interface AlertPanelProps {
    alerts: Alert[]
    onClear: () => void
}

/**
 * Composant Panneau d'Alertes
 * Affiche les alertes reçues du module AI
 */
function AlertPanel({ alerts, onClear }: AlertPanelProps) {
    const getAlertIcon = (severity: string): string => {
        switch (severity) {
            case 'danger': return '🚨'
            case 'warning': return '⚠️'
            case 'info': return 'ℹ️'
            default: return '📢'
        }
    }

    const formatTime = (timestamp: number): string => {
        return new Date(timestamp).toLocaleTimeString()
    }

    return (
        <div className="card alerts-panel">
            <div className="card-header">
                <h2 className="card-title">
                    <span>🔔</span> Alertes AI
                </h2>
                {alerts.length > 0 && (
                    <button className="clear-btn" onClick={onClear}>
                        Effacer
                    </button>
                )}
            </div>
            <div className="card-body">
                {alerts.length === 0 ? (
                    <div className="alerts-empty">
                        <p>✅ Aucune alerte</p>
                        <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                            Les alertes du module AI apparaîtront ici
                        </p>
                    </div>
                ) : (
                    <div className="alerts-list">
                        {alerts.map((alert) => (
                            <div key={alert.id} className={`alert-item ${alert.severity}`}>
                                <span className="alert-icon">{getAlertIcon(alert.severity)}</span>
                                <div className="alert-content">
                                    <p className="alert-message">{alert.message}</p>
                                    {alert.angle !== undefined && alert.angle !== null && (
                                        <p className="alert-angle" style={{
                                            fontSize: '0.75rem',
                                            color: 'var(--text-secondary)',
                                            marginTop: '0.25rem'
                                        }}>
                                            Angle: {alert.angle.toFixed(1)}°
                                        </p>
                                    )}
                                    <p className="alert-time">{formatTime(alert.timestamp)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default AlertPanel
