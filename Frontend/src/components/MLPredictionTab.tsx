import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './MLPredictionTab.css';

interface PredictionResult {
    id: number;
    type: 'prediction' | 'recommendation';
    prototypeName: string;
    timestamp: Date;
    // For predictions
    reliability?: number;
    riskLevel?: 'low' | 'medium' | 'high';
    details?: {
        structuralScore: number;
        performanceScore: number;
        durabilityScore: number;
    };
    // For recommendations
    parts?: {
        motor: string | null;
        esc: string | null;
        flightController: string | null;
        battery: string | null;
        propellers: string | null;
        frame: string | null;
        sensors: string | null;
    };
    rawRecommendation?: string;
}

interface DroneFormData {
    prototypeName: string;
    weight: number;
    maxMotorSpeed: number;
    batteryCapacity: number;
    flightTime: number;
    maxAltitude: number;
    numberOfMotors: number;
    frameMaterial: string;
    hasGPS: boolean;
    droneAge: number;
}

const initialFormData: DroneFormData = {
    prototypeName: '',
    weight: 1200,
    maxMotorSpeed: 8000,
    batteryCapacity: 5000,
    flightTime: 25,
    maxAltitude: 500,
    numberOfMotors: 4,
    frameMaterial: 'carbon',
    hasGPS: true,
    droneAge: 0,
};

function MLPredictionTab() {
    const [formData, setFormData] = useState<DroneFormData>(initialFormData);
    const [history, setHistory] = useState<PredictionResult[]>([]);
    const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
    const [isLoadingPrediction, setIsLoadingPrediction] = useState(false);
    const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { token } = useAuth();

    // Save to global database (silent, non-blocking)
    const saveToDatabase = async (type: 'prediction' | 'recommendation', result: object) => {
        try {
            await fetch('http://localhost:3000/api/history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    type,
                    prototypeName: formData.prototypeName || 'Prototype Sans Nom',
                    formData,
                    result
                })
            });
        } catch (err) {
            console.error('Failed to save to history:', err);
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox'
                ? (e.target as HTMLInputElement).checked
                : type === 'number'
                    ? parseFloat(value) || 0
                    : value
        }));
    };

    const calculateMockPrediction = (): PredictionResult => {
        let score = 100;
        if (formData.weight < 500) score -= 10;
        else if (formData.weight > 2000) score -= 15;
        if (formData.maxMotorSpeed > 10000) score += 5;
        if (formData.maxMotorSpeed < 5000) score -= 10;
        if (formData.batteryCapacity > 6000) score += 8;
        if (formData.batteryCapacity < 3000) score -= 12;
        if (formData.flightTime > 30) score += 5;
        if (formData.flightTime < 15) score -= 10;
        if (formData.numberOfMotors === 4) score += 5;
        if (formData.frameMaterial === 'carbon') score += 10;
        if (formData.frameMaterial === 'plastic') score -= 8;
        if (formData.hasGPS) score += 5;
        score -= formData.droneAge * 1.5;
        score = Math.max(0, Math.min(100, score));

        const riskLevel: 'low' | 'medium' | 'high' =
            score >= 75 ? 'low' : score >= 50 ? 'medium' : 'high';

        return {
            id: Date.now(),
            type: 'prediction',
            prototypeName: formData.prototypeName || 'Prototype Sans Nom',
            reliability: Math.round(score),
            riskLevel,
            timestamp: new Date(),
            details: {
                structuralScore: Math.round(score * 0.9 + Math.random() * 10),
                performanceScore: Math.round(score * 0.85 + Math.random() * 15),
                durabilityScore: Math.round(score * 0.95 + Math.random() * 5),
            }
        };
    };

    const handlePrediction = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoadingPrediction(true);
        setError(null);

        await new Promise(resolve => setTimeout(resolve, 1500));
        const prediction = calculateMockPrediction();
        setHistory(prev => [prediction, ...prev]);

        // Save to global history (non-blocking)
        saveToDatabase('prediction', {
            reliability: prediction.reliability,
            riskLevel: prediction.riskLevel,
            details: prediction.details
        });

        setIsLoadingPrediction(false);
    };

    const handleRecommendation = async () => {
        if (!formData.prototypeName) {
            setError('Veuillez entrer un nom de prototype');
            return;
        }

        setIsLoadingRecommendation(true);
        setError(null);

        try {
            const response = await fetch('http://localhost:3000/api/recommend/parts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Erreur API');
            }

            const recommendation: PredictionResult = {
                id: Date.now(),
                type: 'recommendation',
                prototypeName: formData.prototypeName || 'Prototype Sans Nom',
                timestamp: new Date(),
                parts: data.recommendation.parts,
                rawRecommendation: data.recommendation.raw
            };

            setHistory(prev => [recommendation, ...prev]);

            // Save to global history (non-blocking)
            saveToDatabase('recommendation', {
                parts: data.recommendation.parts
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur réseau');
            console.error('Recommendation error:', err);
        } finally {
            setIsLoadingRecommendation(false);
        }
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

    const isLoading = isLoadingPrediction || isLoadingRecommendation;

    return (
        <div className="ml-prediction-tab">
            {/* ML Info Banner */}
            <div className="ml-info-banner">
                <div className="ml-info-text">
                    <h3>Prédiction ML & Recommandations IA</h3>
                    <p>Analysez votre drone et obtenez des recommandations de pièces via LLaMA</p>
                </div>
            </div>

            {error && (
                <div className="error-banner">
                    <span>Erreur:</span> {error}
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            <div className="prediction-content">
                {/* Prediction Form */}
                <div className="prediction-form-section">
                    <h2>Spécifications du Drone</h2>

                    <form onSubmit={handlePrediction} className="prediction-form">
                        <div className="form-group full-width">
                            <label>Nom du Prototype *</label>
                            <input
                                type="text"
                                name="prototypeName"
                                value={formData.prototypeName}
                                onChange={handleInputChange}
                                placeholder="Ex: DronePro X500"
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Poids (g)</label>
                                <input
                                    type="number"
                                    name="weight"
                                    value={formData.weight}
                                    onChange={handleInputChange}
                                    min="100"
                                    max="10000"
                                />
                            </div>
                            <div className="form-group">
                                <label>Vitesse Max Moteur (RPM)</label>
                                <input
                                    type="number"
                                    name="maxMotorSpeed"
                                    value={formData.maxMotorSpeed}
                                    onChange={handleInputChange}
                                    min="1000"
                                    max="30000"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Capacité Batterie (mAh)</label>
                                <input
                                    type="number"
                                    name="batteryCapacity"
                                    value={formData.batteryCapacity}
                                    onChange={handleInputChange}
                                    min="1000"
                                    max="20000"
                                />
                            </div>
                            <div className="form-group">
                                <label>Temps de Vol (min)</label>
                                <input
                                    type="number"
                                    name="flightTime"
                                    value={formData.flightTime}
                                    onChange={handleInputChange}
                                    min="5"
                                    max="120"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Altitude Max (m)</label>
                                <input
                                    type="number"
                                    name="maxAltitude"
                                    value={formData.maxAltitude}
                                    onChange={handleInputChange}
                                    min="50"
                                    max="5000"
                                />
                            </div>
                            <div className="form-group">
                                <label>Nombre de Moteurs</label>
                                <select
                                    name="numberOfMotors"
                                    value={formData.numberOfMotors}
                                    onChange={handleInputChange}
                                >
                                    <option value={2}>2 (Bi-rotor)</option>
                                    <option value={3}>3 (Tri-rotor)</option>
                                    <option value={4}>4 (Quadrirotor)</option>
                                    <option value={6}>6 (Hexarotor)</option>
                                    <option value={8}>8 (Octorotor)</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Matériau du Châssis</label>
                                <select
                                    name="frameMaterial"
                                    value={formData.frameMaterial}
                                    onChange={handleInputChange}
                                >
                                    <option value="carbon">Fibre de Carbone</option>
                                    <option value="aluminum">Aluminium</option>
                                    <option value="plastic">Plastique ABS</option>
                                    <option value="composite">Composite</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Âge du Drone (mois)</label>
                                <input
                                    type="number"
                                    name="droneAge"
                                    value={formData.droneAge}
                                    onChange={handleInputChange}
                                    min="0"
                                    max="120"
                                />
                            </div>
                        </div>

                        <div className="form-group checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="hasGPS"
                                    checked={formData.hasGPS}
                                    onChange={handleInputChange}
                                />
                                <span className="checkmark"></span>
                                Module GPS intégré
                            </label>
                        </div>

                        {/* Two Action Buttons */}
                        <div className="action-buttons">
                            <button
                                type="submit"
                                className="predict-btn"
                                disabled={isLoading}
                            >
                                {isLoadingPrediction ? (
                                    <>
                                        <span className="spinner"></span>
                                        Analyse...
                                    </>
                                ) : (
                                    <>
                                        Prédire Fiabilité
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                className="recommend-btn"
                                onClick={handleRecommendation}
                                disabled={isLoading}
                            >
                                {isLoadingRecommendation ? (
                                    <>
                                        <span className="spinner"></span>
                                        LLaMA analyse...
                                    </>
                                ) : (
                                    <>
                                        Recommander Pièces
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Groq Info */}
                    <div className="groq-info">
                        <span className="groq-badge">Powered by Groq + LLaMA</span>
                    </div>
                </div>

                {/* History Section */}
                <div className="prediction-history-section">
                    <h2>Historique de Session</h2>

                    {history.length === 0 ? (
                        <div className="empty-history">
                            <p>Aucun résultat</p>
                            <p className="hint">Utilisez les boutons pour analyser votre drone</p>
                        </div>
                    ) : (
                        <div className="predictions-list">
                            {history.map(item => {
                                const isExpanded = expandedCards.has(item.id);
                                return (
                                    <div
                                        key={item.id}
                                        className={`history-card ${item.type} ${isExpanded ? 'expanded' : 'collapsed'}`}
                                    >
                                        {/* Clickable Header - Always Visible */}
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
                                                {item.type === 'prediction' && item.reliability !== undefined && (
                                                    <span
                                                        className="score-mini"
                                                        style={{ color: getRiskColor(item.riskLevel || 'medium') }}
                                                    >
                                                        {item.reliability}%
                                                    </span>
                                                )}
                                            </div>
                                            <div className="header-right">
                                                <span className="timestamp-mini">
                                                    {item.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span className={`chevron ${isExpanded ? 'open' : ''}`}>▼</span>
                                            </div>
                                        </div>

                                        {/* Expandable Content */}
                                        {isExpanded && (
                                            <div className="card-content-expanded">
                                                {/* Prediction Details */}
                                                {item.type === 'prediction' && item.reliability !== undefined && (
                                                    <>
                                                        <div className="compact-score">
                                                            <div
                                                                className="score-bar"
                                                                style={{
                                                                    width: `${item.reliability}%`,
                                                                    background: getRiskColor(item.riskLevel || 'medium')
                                                                }}
                                                            />
                                                            <span>Fiabilité: {item.reliability}% - Risque {getRiskLabel(item.riskLevel || 'medium')}</span>
                                                        </div>
                                                        {item.details && (
                                                            <div className="mini-details">
                                                                <span>Structure: {item.details.structuralScore}%</span>
                                                                <span>Performance: {item.details.performanceScore}%</span>
                                                                <span>Durabilité: {item.details.durabilityScore}%</span>
                                                            </div>
                                                        )}
                                                    </>
                                                )}

                                                {/* Recommendation Parts */}
                                                {item.type === 'recommendation' && item.parts && (
                                                    <div className="parts-compact">
                                                        {item.parts.motor && <div className="part-row"><strong>Moteur:</strong> {item.parts.motor}</div>}
                                                        {item.parts.esc && <div className="part-row"><strong>ESC:</strong> {item.parts.esc}</div>}
                                                        {item.parts.flightController && <div className="part-row"><strong>Contrôleur:</strong> {item.parts.flightController}</div>}
                                                        {item.parts.battery && <div className="part-row"><strong>Batterie:</strong> {item.parts.battery}</div>}
                                                        {item.parts.propellers && <div className="part-row"><strong>Hélices:</strong> {item.parts.propellers}</div>}
                                                        {item.parts.frame && <div className="part-row"><strong>Châssis:</strong> {item.parts.frame}</div>}
                                                        {item.parts.sensors && <div className="part-row"><strong>Capteurs:</strong> {item.parts.sensors}</div>}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MLPredictionTab;
