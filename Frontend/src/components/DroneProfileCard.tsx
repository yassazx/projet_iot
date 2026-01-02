import { useState, useEffect } from 'react';
import './DroneProfileCard.css';

interface DroneProfile {
    id: number;
    name: string;
    description: string;
    model_name: string;
    brand: string;
    model_file: string;
    is_manipulable: boolean;
    selected_skin: string | null;
    specs: Record<string, string>;
    created_at: string;
}

interface ContextMenuState {
    visible: boolean;
    x: number;
    y: number;
}

interface DroneProfileCardProps {
    profile: DroneProfile;
    onConnect: () => void;
    onDelete: () => void;
    onChangeSkin?: (profile: DroneProfile) => void;
}

function DroneProfileCard({ profile, onConnect, onDelete, onChangeSkin }: DroneProfileCardProps) {
    const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0 });

    const specs = typeof profile.specs === 'string'
        ? JSON.parse(profile.specs)
        : profile.specs;

    const handleContextMenu = (e: React.MouseEvent) => {
        // Only show context menu for non-manipulable (vision) drones
        if (!profile.is_manipulable && onChangeSkin) {
            e.preventDefault();
            setContextMenu({
                visible: true,
                x: e.clientX,
                y: e.clientY
            });
        }
    };

    const handleChangeSkin = () => {
        setContextMenu({ visible: false, x: 0, y: 0 });
        if (onChangeSkin) {
            onChangeSkin(profile);
        }
    };

    // Close context menu on click outside
    useEffect(() => {
        const handleClick = () => setContextMenu({ visible: false, x: 0, y: 0 });
        if (contextMenu.visible) {
            document.addEventListener('click', handleClick);
            return () => document.removeEventListener('click', handleClick);
        }
    }, [contextMenu.visible]);

    return (
        <>
            <div className="drone-profile-card" onContextMenu={handleContextMenu}>
                <div className="card-header">
                    <div className="drone-icon">{profile.is_manipulable ? 'M' : 'V'}</div>
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

                {/* Badge Type + Skin info pour Vision */}
                <div
                    className={`type-badge ${profile.is_manipulable ? 'manipulable' : 'vision'}`}
                    style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '0.75rem',
                        display: 'inline-block',
                        background: profile.is_manipulable
                            ? 'linear-gradient(135deg, #ff6b35, #f7931a)'
                            : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        color: 'white'
                    }}
                >
                    {profile.is_manipulable ? 'Manipulable' : 'Vision'}
                </div>

                {/* Skin indicator for vision drones */}
                {!profile.is_manipulable && (
                    <div
                        className="skin-indicator"
                        style={{
                            fontSize: '0.7rem',
                            color: '#9ca3af',
                            marginBottom: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <span>{profile.selected_skin ?
                            (profile.selected_skin.includes('camera') ? 'Skin: Caméra' : 'Skin: Design')
                            : 'Skin: Procédural'}</span>
                        <span style={{ opacity: 0.6, fontSize: '0.65rem' }}>(clic droit pour changer)</span>
                    </div>
                )}

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
                    Connecter
                </button>
            </div>

            {/* Context Menu */}
            {contextMenu.visible && (
                <div
                    className="context-menu"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="context-menu-item" onClick={handleChangeSkin}>
                        <span>Changer le skin 3D</span>
                    </div>
                </div>
            )}
        </>
    );
}

export default DroneProfileCard;
