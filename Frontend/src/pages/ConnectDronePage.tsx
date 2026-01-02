import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ConnectDronePage.css';

interface DroneProfile {
    id: number;
    name: string;
    description: string;
    model_name: string;
    brand: string;
    model_file: string;
    specs: Record<string, string>;
}

function ConnectDronePage() {
    const { profileId } = useParams<{ profileId: string }>();
    const [profile, setProfile] = useState<DroneProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState('');

    const { token } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchProfile();
    }, [profileId]);

    const fetchProfile = async () => {
        try {
            const res = await fetch(`http://localhost:3000/api/drones/profiles/${profileId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                throw new Error('Profil non trouvé');
            }

            const data = await res.json();
            setProfile(data.profile);
        } catch (err) {
            setError('Impossible de charger le profil');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = () => {
        setConnecting(true);

        // Simulate connection delay
        setTimeout(() => {
            navigate(`/telemetry/${profileId}`);
        }, 1500);
    };

    if (loading) {
        return (
            <div className="connect-page">
                <div className="loading-container">
                    <span className="loading-icon">🔄</span>
                    <p>Chargement...</p>
                </div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="connect-page">
                <div className="error-container">
                    <span className="error-icon">❌</span>
                    <h2>Erreur</h2>
                    <p>{error || 'Profil non trouvé'}</p>
                    <button onClick={() => navigate('/dashboard')}>
                        Retour au dashboard
                    </button>
                </div>
            </div>
        );
    }

    const specs = typeof profile.specs === 'string'
        ? JSON.parse(profile.specs)
        : profile.specs;

    return (
        <div className="connect-page">
            <div className="connect-container">
                {/* Header */}
                <button className="back-btn" onClick={() => navigate('/dashboard')}>
                    ← Retour
                </button>

                {/* Drone Info */}
                <div className="drone-info-card">
                    <div className="drone-visual">
                        <div className="drone-icon-large">🚁</div>
                        <div className="pulse-ring"></div>
                    </div>

                    <div className="drone-details">
                        <h1>{profile.name}</h1>
                        <div className="model-info">
                            <span className="model-name">{profile.model_name}</span>
                            <span className="brand">{profile.brand}</span>
                        </div>

                        {profile.description && (
                            <p className="description">{profile.description}</p>
                        )}

                        <div className="specs-list">
                            {specs?.weight && (
                                <div className="spec">
                                    <span className="spec-icon">⚖️</span>
                                    <span className="spec-label">Poids</span>
                                    <span className="spec-value">{specs.weight}</span>
                                </div>
                            )}
                            {specs?.flight_time && (
                                <div className="spec">
                                    <span className="spec-icon">🔋</span>
                                    <span className="spec-label">Autonomie</span>
                                    <span className="spec-value">{specs.flight_time}</span>
                                </div>
                            )}
                            {specs?.max_speed && (
                                <div className="spec">
                                    <span className="spec-icon">💨</span>
                                    <span className="spec-label">Vitesse max</span>
                                    <span className="spec-value">{specs.max_speed}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Connection Section - Two Cards */}
                <div className="connection-section">
                    <h2>Connexion au drone</h2>
                    <p>Assurez-vous que votre drone est allumé et à portée</p>

                    <div className="connection-cards">
                        {/* Status Card */}
                        <div className="connection-card status-card">
                            <div className={`status-icon ${connecting ? 'connecting' : 'ready'}`}>
                                {connecting ? '🔄' : '✓'}
                            </div>
                            <span className="card-label">
                                {connecting ? 'Connexion...' : 'Prêt'}
                            </span>
                        </div>

                        {/* Connect Button Card */}
                        <div
                            className={`connection-card action-card ${connecting ? 'disabled' : ''}`}
                            onClick={!connecting ? handleConnect : undefined}
                        >
                            <div className="action-icon">
                                {connecting ? '⏳' : '🔗'}
                            </div>
                            <span className="card-label">
                                {connecting ? 'Patientez...' : 'Connecter'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ConnectDronePage;
