import './DroneProfileCard.css';

interface DroneProfile {
    id: number;
    name: string;
    description: string;
    model_name: string;
    brand: string;
    model_file: string;
    specs: Record<string, string>;
    created_at: string;
}

interface DroneProfileCardProps {
    profile: DroneProfile;
    onConnect: () => void;
    onDelete: () => void;
}

function DroneProfileCard({ profile, onConnect, onDelete }: DroneProfileCardProps) {
    const specs = typeof profile.specs === 'string'
        ? JSON.parse(profile.specs)
        : profile.specs;

    return (
        <div className="drone-profile-card">
            <div className="card-header">
                <div className="drone-icon">🚁</div>
                <div className="card-info">
                    <h3>{profile.name}</h3>
                    <span className="model-badge">{profile.model_name}</span>
                </div>
                <button
                    className="delete-btn"
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    title="Supprimer"
                >
                    🗑️
                </button>
            </div>

            {profile.description && (
                <p className="card-description">{profile.description}</p>
            )}

            <div className="card-specs">
                <div className="spec-item">
                    <span className="spec-label">Marque</span>
                    <span className="spec-value">{profile.brand}</span>
                </div>
                {specs?.weight && (
                    <div className="spec-item">
                        <span className="spec-label">Poids</span>
                        <span className="spec-value">{specs.weight}</span>
                    </div>
                )}
                {specs?.flight_time && (
                    <div className="spec-item">
                        <span className="spec-label">Autonomie</span>
                        <span className="spec-value">{specs.flight_time}</span>
                    </div>
                )}
            </div>

            <button className="connect-btn" onClick={onConnect}>
                <span>🔗</span> Connecter
            </button>
        </div>
    );
}

export default DroneProfileCard;
