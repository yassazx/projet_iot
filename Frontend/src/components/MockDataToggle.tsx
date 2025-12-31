import { useState, useEffect } from 'react';
import './MockDataToggle.css';

interface MockDataToggleProps {
    onStatusChange?: (running: boolean) => void;
}

function MockDataToggle({ onStatusChange }: MockDataToggleProps) {
    const [isRunning, setIsRunning] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Check initial status on mount
    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/mock/status');
            const data = await res.json();
            setIsRunning(data.running);
            onStatusChange?.(data.running);
        } catch (err) {
            console.error('Error checking mock status:', err);
        }
    };

    const toggleMock = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('http://localhost:3000/api/mock/toggle', {
                method: 'POST'
            });
            const data = await res.json();
            setIsRunning(data.running);
            onStatusChange?.(data.running);
        } catch (err) {
            console.error('Error toggling mock:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mock-toggle-container">
            <div className="mock-toggle-header">
                <span className="mock-icon">📡</span>
                <span className="mock-label">Simulation Données</span>
            </div>

            <div className="mock-toggle-content">
                <div className="mock-status">
                    <span className={`status-indicator ${isRunning ? 'active' : 'inactive'}`}></span>
                    <span className="status-text">
                        {isRunning ? 'En cours' : 'Arrêté'}
                    </span>
                </div>

                <button
                    className={`toggle-btn ${isRunning ? 'stop' : 'start'} ${isLoading ? 'loading' : ''}`}
                    onClick={toggleMock}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <span className="spinner"></span>
                    ) : isRunning ? (
                        <>⏹ Arrêter</>
                    ) : (
                        <>▶ Démarrer</>
                    )}
                </button>
            </div>

            <div className="mock-info">
                <small>MPU6050 · Arduino · DHT22</small>
            </div>
        </div>
    );
}

export default MockDataToggle;
