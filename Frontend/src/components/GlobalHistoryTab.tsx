import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './MLPredictionTab.css'; // Reuse existing styles

interface HistoryItem {
    id: number;
    type: 'prediction' | 'recommendation';
    prototypeName: string;
    formData: Record<string, unknown>;
    result: Record<string, unknown>;
    createdAt: string;
}

function GlobalHistoryTab() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
    const [total, setTotal] = useState(0);

    const { token } = useAuth();

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/history?limit=100', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setHistory(data.history);
                setTotal(data.total);
            }
        } catch (err) {
            console.error('Error fetching history:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Supprimer cette entrée ?')) return;

        try {
            const res = await fetch(`http://localhost:3000/api/history/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setHistory(prev => prev.filter(h => h.id !== id));
                setTotal(prev => prev - 1);
            }
        } catch (err) {
            console.error('Error deleting:', err);
        }
    };

    const toggleCard = (id: number) => {
        setExpandedCards(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case 'low': return '#10b981';
            case 'medium': return '#f59e0b';
            case 'high': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getRiskLabel = (risk: string) => {
        switch (risk) {
            case 'low': return 'Faible';
            case 'medium': return 'Moyen';
            case 'high': return 'Élevé';
            default: return 'Inconnu';
        }
    };

    if (loading) {
        return (
            <div className="ml-prediction-tab">
                <div className="empty-history">
                    <p>Chargement de l'historique...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="ml-prediction-tab">
            {/* Header */}
            <div className="ml-info-banner">
                <div className="ml-info-text">
                    <h3>Historique Global</h3>
                    <p>{total} entrée{total !== 1 ? 's' : ''} sauvegardée{total !== 1 ? 's' : ''}</p>
                </div>
            </div>

            {/* History List */}
            <div className="prediction-history-section" style={{ maxWidth: '800px', margin: '0 auto' }}>
                {history.length === 0 ? (
                    <div className="empty-history">
                        <p>Aucun historique sauvegardé</p>
                        <p className="hint">Les prédictions et recommandations seront sauvegardées ici</p>
                    </div>
                ) : (
                    <div className="predictions-list">
                        {history.map(item => {
                            const isExpanded = expandedCards.has(item.id);
                            const result = item.result as Record<string, unknown>;
                            const reliability = result?.reliability as number | undefined;
                            const riskLevel = result?.riskLevel as string | undefined;
                            const parts = result?.parts as Record<string, string> | undefined;

                            return (
                                <div
                                    key={item.id}
                                    className={`history-card ${item.type} ${isExpanded ? 'expanded' : 'collapsed'}`}
                                >
                                    {/* Clickable Header */}
                                    <div
                                        className="card-header-clickable"
                                        onClick={() => toggleCard(item.id)}
                                    >
                                        <div className="header-left">
                                            {item.type === 'prediction' ? (
                                                <span className="type-badge prediction">P</span>
                                            ) : (
                                                <span className="type-badge recommendation">R</span>
                                            )}
                                            <span className="prototype-name-mini">{item.prototypeName}</span>
                                            {item.type === 'prediction' && reliability !== undefined && (
                                                <span
                                                    className="score-mini"
                                                    style={{ color: getRiskColor(riskLevel || 'medium') }}
                                                >
                                                    {reliability}%
                                                </span>
                                            )}
                                        </div>
                                        <div className="header-right">
                                            <span className="timestamp-mini">
                                                {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                                            </span>
                                            <span className={`chevron ${isExpanded ? 'open' : ''}`}>▼</span>
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    {isExpanded && (
                                        <div className="card-content-expanded">
                                            {/* Prediction Details */}
                                            {item.type === 'prediction' && reliability !== undefined && (
                                                <>
                                                    <div className="compact-score">
                                                        <div
                                                            className="score-bar"
                                                            style={{
                                                                width: `${reliability}%`,
                                                                background: getRiskColor(riskLevel || 'medium')
                                                            }}
                                                        />
                                                        <span>Fiabilité: {reliability}% - Risque {getRiskLabel(riskLevel || 'medium')}</span>
                                                    </div>
                                                </>
                                            )}

                                            {/* Recommendation Parts */}
                                            {item.type === 'recommendation' && parts && (
                                                <div className="parts-compact">
                                                    {parts.motor && <div className="part-row"><strong>Moteur:</strong> {parts.motor}</div>}
                                                    {parts.esc && <div className="part-row"><strong>ESC:</strong> {parts.esc}</div>}
                                                    {parts.flightController && <div className="part-row"><strong>Contrôleur:</strong> {parts.flightController}</div>}
                                                    {parts.battery && <div className="part-row"><strong>Batterie:</strong> {parts.battery}</div>}
                                                </div>
                                            )}

                                            {/* Delete Button */}
                                            <button
                                                className="delete-entry-btn"
                                                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                            >
                                                Supprimer
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default GlobalHistoryTab;
