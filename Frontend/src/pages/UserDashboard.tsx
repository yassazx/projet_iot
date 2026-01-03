import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DroneProfileCard from '../components/DroneProfileCard';
import CreateProfileModal from '../components/CreateProfileModal';
import SkinSelectorModal from '../components/SkinSelectorModal';
import MLPredictionTab from '../components/MLPredictionTab';
import GlobalHistoryTab from '../components/GlobalHistoryTab';
import './UserDashboard.css';

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

interface DroneModel {
    id: number;
    name: string;
    brand: string;
    model_file: string;
    is_manipulable: boolean;
    specs: Record<string, string>;
}

function UserDashboard() {
    const [profiles, setProfiles] = useState<DroneProfile[]>([]);
    const [models, setModels] = useState<DroneModel[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // Tab navigation
    const [activeTab, setActiveTab] = useState<'drones' | 'ml' | 'history'>('drones');

    // Skin selector state
    const [skinModalProfile, setSkinModalProfile] = useState<DroneProfile | null>(null);

    const { user, token, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchProfiles();
        fetchModels();
    }, []);

    const fetchProfiles = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/drones/profiles', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setProfiles(data.profiles || []);
        } catch (err) {
            console.error('Error fetching profiles:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchModels = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/drones/models');
            const data = await res.json();
            setModels(data.models || []);
        } catch (err) {
            console.error('Error fetching models:', err);
        }
    };

    const handleCreateProfile = async (modelId: number, name: string, description: string) => {
        try {
            const res = await fetch('http://localhost:3000/api/drones/profiles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ model_id: modelId, name, description })
            });

            if (res.ok) {
                const data = await res.json();
                setProfiles([data.profile, ...profiles]);
                setIsModalOpen(false);
            }
        } catch (err) {
            console.error('Error creating profile:', err);
        }
    };

    const handleDeleteProfile = async (id: number) => {
        try {
            const res = await fetch(`http://localhost:3000/api/drones/profiles/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setProfiles(profiles.filter(p => p.id !== id));
            }
        } catch (err) {
            console.error('Error deleting profile:', err);
        }
    };

    const handleConnect = (profileId: number) => {
        navigate(`/connect/${profileId}`);
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // Handle skin change
    const handleChangeSkin = (profile: DroneProfile) => {
        setSkinModalProfile(profile);
    };

    const handleSkinUpdate = async (profileId: number, skinFile: string | null) => {
        try {
            const res = await fetch(`http://localhost:3000/api/drones/profiles/${profileId}/skin`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ selected_skin: skinFile })
            });

            if (res.ok) {
                // Update local state
                setProfiles(profiles.map(p =>
                    p.id === profileId ? { ...p, selected_skin: skinFile } : p
                ));
            }
        } catch (err) {
            console.error('Error updating skin:', err);
        }
    };

    return (
        <div className="user-dashboard">
            {/* Unified Navigation Bar */}
            <nav className="unified-navbar">
                <div className="nav-tabs">
                    <button
                        className={`nav-tab ${activeTab === 'drones' ? 'active' : ''}`}
                        onClick={() => setActiveTab('drones')}
                    >
                        Mes Drones
                    </button>
                    <button
                        className={`nav-tab ${activeTab === 'ml' ? 'active' : ''}`}
                        onClick={() => setActiveTab('ml')}
                    >
                        Analyse IA
                    </button>
                    <button
                        className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        Historique
                    </button>
                </div>
                <div className="nav-user">
                    <span className="user-name">{user?.name}</span>
                    <button className="logout-btn" onClick={handleLogout}>
                        Déconnexion
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="dashboard-main">
                {activeTab === 'drones' ? (
                    <>
                        {/* Action Bar */}
                        <div className="action-bar">
                            <div className="stats">
                                <span className="stat-item">
                                    <strong>{profiles.length}</strong> drone{profiles.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <button className="create-btn" onClick={() => setIsModalOpen(true)}>
                                <span>+</span> Nouveau Drone
                            </button>
                        </div>

                        {/* Profiles Grid */}
                        {loading ? (
                            <div className="loading-state">
                                <span className="loading-icon">🔄</span>
                                <p>Chargement...</p>
                            </div>
                        ) : profiles.length === 0 ? (
                            <div className="empty-state">
                                <span className="empty-icon">🚁</span>
                                <h2>Aucun drone configuré</h2>
                                <p>Créez votre premier profil de drone pour commencer</p>
                                <button className="create-btn-large" onClick={() => setIsModalOpen(true)}>
                                    Créer mon premier drone
                                </button>
                            </div>
                        ) : (
                            <div className="profiles-grid">
                                {profiles.map(profile => (
                                    <DroneProfileCard
                                        key={profile.id}
                                        profile={profile}
                                        onConnect={() => handleConnect(profile.id)}
                                        onDelete={() => handleDeleteProfile(profile.id)}
                                        onChangeSkin={handleChangeSkin}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                ) : activeTab === 'ml' ? (
                    <MLPredictionTab />
                ) : (
                    <GlobalHistoryTab />
                )}
            </main>

            {/* Create Modal */}
            {isModalOpen && (
                <CreateProfileModal
                    models={models}
                    onClose={() => setIsModalOpen(false)}
                    onCreate={handleCreateProfile}
                />
            )}

            {/* Skin Selector Modal */}
            {skinModalProfile && (
                <SkinSelectorModal
                    isOpen={true}
                    profileId={skinModalProfile.id}
                    currentSkin={skinModalProfile.selected_skin}
                    onClose={() => setSkinModalProfile(null)}
                    onSkinChange={handleSkinUpdate}
                />
            )}
        </div>
    );
}

export default UserDashboard;

