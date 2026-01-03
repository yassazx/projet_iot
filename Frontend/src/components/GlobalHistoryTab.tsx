import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './GlobalHistoryTab.css';

interface HistoryItem {
    id: number;
    type: 'prediction' | 'recommendation' | 'rating';
    prototypeName: string;
    formData: Record<string, unknown>;
    result: Record<string, unknown>;
    createdAt: string;
}

function GlobalHistoryTab() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
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
                if (selectedItem?.id === id) {
                    setSelectedItem(null);
                }
            }
        } catch (err) {
            console.error('Error deleting:', err);
        }
    };

    const selectItem = (item: HistoryItem) => {
        setSelectedItem(selectedItem?.id === item.id ? null : item);
    };

    const formatDateTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return {
            date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        };
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'prediction': return 'Prédiction';
            case 'recommendation': return 'Recommandation';
            case 'rating': return 'Fiabilité';
            default: return type;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'prediction': return '#8b5cf6';
            case 'recommendation': return '#10b981';
            case 'rating': return '#f59e0b';
            default: return '#6b7280';
        }
    };

    if (loading) {
        return (
            <div className="global-history-tab">
                <div className="history-loading">
                    <p>Chargement de l'historique...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="global-history-tab">
            {/* Header */}
            <div className="history-header">
                <h2>Historique Global</h2>
                <span className="history-count">{total} entrée{total !== 1 ? 's' : ''}</span>
            </div>

            {history.length === 0 ? (
                <div className="history-empty">
                    <p>Aucun historique sauvegardé</p>
                    <p className="hint">Les prédictions et recommandations seront sauvegardées ici</p>
                </div>
            ) : (
                <div className={`history-content ${selectedItem ? 'split-view' : ''}`}>
                    {/* List Panel */}
                    <div className="history-list-panel">
                        <div className="history-list">
                            {history.map(item => {
                                const { date, time } = formatDateTime(item.createdAt);
                                const isSelected = selectedItem?.id === item.id;

                                return (
                                    <div
                                        key={item.id}
                                        className={`history-item ${item.type} ${isSelected ? 'selected' : ''}`}
                                        onClick={() => selectItem(item)}
                                        style={{ borderLeftColor: getTypeColor(item.type) }}
                                    >
                                        <div className="item-header">
                                            <span
                                                className="item-type-badge"
                                                style={{ backgroundColor: getTypeColor(item.type) }}
                                            >
                                                {getTypeLabel(item.type)}
                                            </span>
                                            <span className="item-datetime">{date} à {time}</span>
                                        </div>
                                        <div className="item-name">{item.prototypeName}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Details Panel */}
                    {selectedItem && (
                        <div className="history-details-panel">
                            <div className="details-header">
                                <div className="details-title">
                                    <span
                                        className="details-type-badge"
                                        style={{ backgroundColor: getTypeColor(selectedItem.type) }}
                                    >
                                        {getTypeLabel(selectedItem.type)}
                                    </span>
                                    <h3>{selectedItem.prototypeName}</h3>
                                </div>
                                <span className="details-datetime">
                                    {formatDateTime(selectedItem.createdAt).date} à {formatDateTime(selectedItem.createdAt).time}
                                </span>
                            </div>

                            <div className="details-content">
                                {/* Rating Details */}
                                {selectedItem.type === 'rating' && (
                                    <div className="details-section">
                                        <h4>Score de Fiabilité</h4>
                                        <div className="score-display">
                                            <span className="score-value">{(selectedItem.result as { score?: number }).score}/100</span>
                                            <span className="score-label">{(selectedItem.result as { label?: string }).label}</span>
                                        </div>
                                        <p className="score-explanation">{(selectedItem.result as { explanation?: string }).explanation}</p>
                                    </div>
                                )}

                                {/* Prediction Details */}
                                {selectedItem.type === 'prediction' && (
                                    <div className="details-section">
                                        <h4>Résultat de Prédiction</h4>
                                        <div className="score-display">
                                            <span className="score-value">{(selectedItem.result as { reliability?: number }).reliability}%</span>
                                            <span className="score-label">Fiabilité</span>
                                        </div>
                                    </div>
                                )}

                                {/* Recommendation Details */}
                                {selectedItem.type === 'recommendation' && (
                                    <div className="details-section">
                                        <h4>Pièces Recommandées</h4>
                                        <div className="parts-list">
                                            {Object.entries((selectedItem.result as { parts?: Record<string, string> }).parts || {}).map(([key, value]) => (
                                                value && (
                                                    <div key={key} className="part-item">
                                                        <strong>{key}:</strong> {value}
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Form Data */}
                                <div className="details-section">
                                    <h4>Paramètres d'entrée</h4>
                                    <div className="form-data-grid">
                                        {Object.entries(selectedItem.formData).filter(([key]) => key !== 'prototypeName').map(([key, value]) => (
                                            <div key={key} className="form-data-item">
                                                <span className="data-label">{key}</span>
                                                <span className="data-value">{String(value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Delete Button */}
                                <button
                                    className="delete-btn"
                                    onClick={() => handleDelete(selectedItem.id)}
                                >
                                    Supprimer cette entrée
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default GlobalHistoryTab;
