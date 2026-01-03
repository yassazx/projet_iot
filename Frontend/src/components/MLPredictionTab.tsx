import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './MLPredictionTab.css';

interface PredictionResult {
    id: number;
    type: 'prediction' | 'recommendation' | 'rating';
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
    // For rating
    ratingScore?: number;
    ratingLabel?: string;
    ratingExplanation?: string;
    ratingParams?: {
        total_weight: number;
        center_of_mass_offset: number;
        thrust_to_weight: number;
        arm_length: number;
        propeller_size: number;
        motor_kv: number;
    };
}

// Form data for recommendation (existing)
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

// Form data for rating (new)
interface RatingFormData {
    prototypeName: string;
    total_weight: number;
    center_of_mass_offset: number;
    thrust_to_weight: number;
    arm_length: number;
    propeller_size: number;
    motor_kv: number;
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

const initialRatingFormData: RatingFormData = {
    prototypeName: '',
    total_weight: 900,
    center_of_mass_offset: 0.5,
    thrust_to_weight: 2.0,
    arm_length: 220,
    propeller_size: 5,
    motor_kv: 2300,
};

function MLPredictionTab() {
    // Sub-tab state
    const [subTab, setSubTab] = useState<'rating' | 'recommendation'>('rating');

    // Form states
    const [formData, setFormData] = useState<DroneFormData>(initialFormData);
    const [ratingFormData, setRatingFormData] = useState<RatingFormData>(initialRatingFormData);

    // Shared history
    const [history, setHistory] = useState<PredictionResult[]>([]);
    const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

    // Loading states
    const [isLoadingPrediction, setIsLoadingPrediction] = useState(false);
    const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);
    const [isLoadingRating, setIsLoadingRating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { token } = useAuth();

    // Save to global database (silent, non-blocking)
    const saveToDatabase = async (type: 'prediction' | 'recommendation' | 'rating', result: object, name: string) => {
        try {
            await fetch('http://localhost:3000/api/history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    type,
                    prototypeName: name || 'Prototype Sans Nom',
                    formData: subTab === 'rating' ? ratingFormData : formData,
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

    // Handler for recommendation form (existing)
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

    // Handler for rating form (new)
    const handleRatingInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setRatingFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    // Handle Rating Prediction (new)
    const handleRatingPrediction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ratingFormData.prototypeName) {
            setError('Veuillez entrer un nom de prototype');
            return;
        }

        setIsLoadingRating(true);
        setError(null);

        try {
            const response = await fetch('http://localhost:3000/api/drone-rating/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ratingFormData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur API');
            }

            const ratingResult: PredictionResult = {
                id: Date.now(),
                type: 'rating',
                prototypeName: ratingFormData.prototypeName || 'Prototype Sans Nom',
                timestamp: new Date(),
                ratingScore: data.rating.score,
                ratingLabel: data.rating.label,
                ratingExplanation: data.rating.explanation,
                ratingParams: {
                    total_weight: ratingFormData.total_weight,
                    center_of_mass_offset: ratingFormData.center_of_mass_offset,
                    thrust_to_weight: ratingFormData.thrust_to_weight,
                    arm_length: ratingFormData.arm_length,
                    propeller_size: ratingFormData.propeller_size,
                    motor_kv: ratingFormData.motor_kv
                }
            };

            setHistory(prev => [ratingResult, ...prev]);

            // Save to global history
            saveToDatabase('rating', {
                score: data.rating.score,
                label: data.rating.label,
                explanation: data.rating.explanation
            }, ratingFormData.prototypeName);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur réseau');
            console.error('Rating error:', err);
        } finally {
            setIsLoadingRating(false);
        }
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

        saveToDatabase('prediction', {
            reliability: prediction.reliability,
            riskLevel: prediction.riskLevel,
            details: prediction.details
        }, formData.prototypeName);

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

            saveToDatabase('recommendation', {
                parts: data.recommendation.parts
            }, formData.prototypeName);
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

    const getRatingColor = (score: number) => {
        if (score >= 80) return '#10b981';
        if (score >= 60) return '#22c55e';
        if (score >= 40) return '#f59e0b';
        return '#ef4444';
    };

    const isLoading = isLoadingPrediction || isLoadingRecommendation || isLoadingRating;

    return (
        <div className="ml-prediction-tab">

            {error && (
                <div className="error-banner">
                    <span>Erreur:</span> {error}
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            <div className="prediction-content">
                {/* Form Section with Sub-tabs */}
                <div className="prediction-form-section">
                    {/* Sub-tabs Navigation */}
                    <div className="sub-tabs">
                        <button
                            className={`sub-tab ${subTab === 'rating' ? 'active' : ''}`}
                            onClick={() => setSubTab('rating')}
                        >
                            Prédiction de Fiabilité
                        </button>
                        <button
                            className={`sub-tab ${subTab === 'recommendation' ? 'active' : ''}`}
                            onClick={() => setSubTab('recommendation')}
                        >
                            Recommandation de Pièces
                        </button>
                    </div>

                    {/* Rating Form (New) */}
                    {subTab === 'rating' && (
                        <>
                            <h2>Configuration Physique du Drone</h2>
                            <form onSubmit={handleRatingPrediction} className="prediction-form">
                                <div className="form-group full-width">
                                    <label>Nom du Prototype *</label>
                                    <input
                                        type="text"
                                        name="prototypeName"
                                        value={ratingFormData.prototypeName}
                                        onChange={handleRatingInputChange}
                                        placeholder="Ex: DroneRacing X5"
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Poids Total (g)</label>
                                        <input
                                            type="number"
                                            name="total_weight"
                                            value={ratingFormData.total_weight}
                                            onChange={handleRatingInputChange}
                                            min="500"
                                            max="2500"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Décalage Centre de Masse (cm)</label>
                                        <input
                                            type="number"
                                            name="center_of_mass_offset"
                                            value={ratingFormData.center_of_mass_offset}
                                            onChange={handleRatingInputChange}
                                            min="0"
                                            max="10"
                                            step="0.1"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Ratio Poussée/Poids</label>
                                        <input
                                            type="number"
                                            name="thrust_to_weight"
                                            value={ratingFormData.thrust_to_weight}
                                            onChange={handleRatingInputChange}
                                            min="0.8"
                                            max="3.5"
                                            step="0.1"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Longueur des Bras (mm)</label>
                                        <input
                                            type="number"
                                            name="arm_length"
                                            value={ratingFormData.arm_length}
                                            onChange={handleRatingInputChange}
                                            min="100"
                                            max="500"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Taille Hélice (pouces)</label>
                                        <select
                                            name="propeller_size"
                                            value={ratingFormData.propeller_size}
                                            onChange={handleRatingInputChange}
                                        >
                                            <option value={5}>5"</option>
                                            <option value={6}>6"</option>
                                            <option value={7}>7"</option>
                                            <option value={8}>8"</option>
                                            <option value={9}>9"</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Vitesse Moteur (KV)</label>
                                        <input
                                            type="number"
                                            name="motor_kv"
                                            value={ratingFormData.motor_kv}
                                            onChange={handleRatingInputChange}
                                            min="1400"
                                            max="2700"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="predict-btn rating-btn"
                                    disabled={isLoading}
                                >
                                    {isLoadingRating ? (
                                        <>
                                            <span className="spinner"></span>
                                            Analyse...
                                        </>
                                    ) : (
                                        <>
                                            Prédire Score de Fiabilité
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    )}

                    {/* Recommendation Form (Existing) */}
                    {subTab === 'recommendation' && (
                        <>
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

                                {/* Recommend Button Only */}
                                <button
                                    type="button"
                                    className="recommend-btn full-width"
                                    onClick={handleRecommendation}
                                    disabled={isLoading}
                                >
                                    {isLoadingRecommendation ? (
                                        <>
                                            <span className="spinner"></span>
                                            Analyse en cours...
                                        </>
                                    ) : (
                                        <>
                                            Recommander Pièces
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    )}
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
                                                ) : item.type === 'recommendation' ? (
                                                    <span className="type-badge recommendation">R</span>
                                                ) : (
                                                    <span className="type-badge rating">F</span>
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
                                                {item.type === 'rating' && item.ratingScore !== undefined && (
                                                    <span
                                                        className="score-mini"
                                                        style={{ color: getRatingColor(item.ratingScore) }}
                                                    >
                                                        {item.ratingScore}/100
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

                                                {/* Rating Details (New) */}
                                                {item.type === 'rating' && item.ratingScore !== undefined && (
                                                    <>
                                                        <div className="compact-score">
                                                            <div
                                                                className="score-bar"
                                                                style={{
                                                                    width: `${item.ratingScore}%`,
                                                                    background: getRatingColor(item.ratingScore)
                                                                }}
                                                            />
                                                            <span>Score: {item.ratingScore}/100 {item.ratingLabel}</span>
                                                        </div>
                                                        <div className="rating-explanation">
                                                            <p>{item.ratingExplanation}</p>
                                                        </div>

                                                        {/* Parameters Display - Simple values */}
                                                        {item.ratingParams && (
                                                            <div className="rating-params">
                                                                <h4>Paramètres de configuration</h4>
                                                                <div className="params-grid-simple">
                                                                    <div className="param-item-simple">
                                                                        <span className="param-label">Poids</span>
                                                                        <span className="param-value">{item.ratingParams.total_weight}g</span>
                                                                    </div>
                                                                    <div className="param-item-simple">
                                                                        <span className="param-label">Décalage CoM</span>
                                                                        <span className="param-value">{item.ratingParams.center_of_mass_offset}cm</span>
                                                                    </div>
                                                                    <div className="param-item-simple">
                                                                        <span className="param-label">Ratio P/P</span>
                                                                        <span className="param-value">{item.ratingParams.thrust_to_weight}</span>
                                                                    </div>
                                                                    <div className="param-item-simple">
                                                                        <span className="param-label">Bras</span>
                                                                        <span className="param-value">{item.ratingParams.arm_length}mm</span>
                                                                    </div>
                                                                    <div className="param-item-simple">
                                                                        <span className="param-label">Hélice</span>
                                                                        <span className="param-value">{item.ratingParams.propeller_size}"</span>
                                                                    </div>
                                                                    <div className="param-item-simple">
                                                                        <span className="param-label">Moteur KV</span>
                                                                        <span className="param-value">{item.ratingParams.motor_kv}</span>
                                                                    </div>
                                                                </div>
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
