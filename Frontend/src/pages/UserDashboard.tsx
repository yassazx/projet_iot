import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DroneProfileCard from '../components/DroneProfileCard';
import CreateProfileModal from '../components/CreateProfileModal';
import './UserDashboard.css';

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

interface DroneModel {
    id: number;
    name: string;
    brand: string;
    model_file: string;
    specs: Record<string, string>;
}

function UserDashboard() {
    const [profiles, setProfiles] = useState<DroneProfile[]>([]);
    const [models, setModels] = useState<DroneModel[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

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

    return (
        <div className="user-dashboard">
            {/* Header */}
            <header className="dashboard-header">
                <div className="header-left">
                    <span className="logo-icon">🚁</span>
                    <h1>Mes Drones</h1>
                </div>
                <div className="header-right">
                    <span className="user-greeting">👤 {user?.name}</span>
                    <button className="logout-btn" onClick={handleLogout}>
                        Déconnexion
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="dashboard-main">
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
                            />
                        ))}
                    </div>
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
        </div>
    );
}

export default UserDashboard;
