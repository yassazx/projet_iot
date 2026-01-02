import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei'
import Drone3D from './components/Drone3D'
import DroneSimple from './components/DroneSimple'
import DroneModelViewer from './components/DroneModelViewer'
import Dashboard from './components/Dashboard'
import AlertPanel from './components/AlertPanel'
import { useWebSocket } from './hooks/useWebSocket'
import { useAuth } from './context/AuthContext'
import './App.css'

import SimulationWheel from './components/SimulationWheel'
import MockDataToggle from './components/MockDataToggle'

function App() {
  const { telemetry, alerts, connectionStatus, clearAlerts, disconnect } = useWebSocket('ws://localhost:3000')
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { profileId } = useParams<{ profileId: string }>()

  // Profile state
  const [droneProfile, setDroneProfile] = useState<any>(null)

  // State for resizable panels
  const [viewerWidth, setViewerWidth] = useState(60) // percentage
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLElement>(null)

  // Disconnect confirmation modal
  const [showDisconnectModal, setShowDisconnectModal] = useState(false)

  // Simulation State
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [simulatedRoll, setSimulatedRoll] = useState<number | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100

    // Clamp between 30% and 80%
    const clampedWidth = Math.min(80, Math.max(30, newWidth))
    setViewerWidth(clampedWidth)
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    } else {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Fetch drone profile when profileId changes
  useEffect(() => {
    const fetchProfile = async () => {
      if (!profileId) return;

      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:3000/api/drones/profiles/${profileId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setDroneProfile(data.profile);
          console.log('📦 Profile chargé:', data.profile);
        }
      } catch (err) {
        console.error('Erreur chargement profil:', err);
      }
    };

    fetchProfile();
  }, [profileId]);

  const handleSimulationAngle = async (angle: number) => {
    // Only send requests periodically or debounce? 
    // For now, let's just send it. If it's too frequent, we might need debounce.
    // The wheel might trigger many updates.

    // We can debounce here or in the component. 
    // Let's assume the component triggers often.

    // Simple throttle/debounce ref

    setSimulationLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/ai/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          angle_x: angle, // Map wheel rotation to X angle
          angle_y: 0,
          angle_z: 0
        })
      });
      await response.json();
      // The backend broadcasts alerts, so we don't need to manually update alerts here
      // unless we want to show non-alert predictions.

    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setSimulationLoading(false);
    }
  };

  // Live update for visual feedback without api call
  const handleLiveSimulation = (angle: number) => {
    setSimulatedRoll(angle);
  };

  const handleResetSimulation = () => {
    setSimulatedRoll(null);
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <button
            className="back-to-dashboard disconnect-icon"
            onClick={() => setShowDisconnectModal(true)}
            title="Déconnecter le drone"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
              <line x1="12" y1="2" x2="12" y2="12"></line>
            </svg>
          </button>
          <span className="logo-icon">🚁</span>
          <h1>Drone Telemetry System</h1>
        </div>
        <div className="header-right">
          <div className={`connection-status ${connectionStatus}`}>
            <span className="status-dot"></span>
            <span className="status-text">
              {connectionStatus === 'connected' ? 'Connecté' :
                connectionStatus === 'connecting' ? 'Connexion...' : 'Déconnecté'}
            </span>
          </div>
          {user && (
            <div className="user-menu">
              <span className="user-name">👤 {user.name}</span>
              <button
                className="logout-btn"
                onClick={() => {
                  logout()
                  navigate('/')
                }}
              >
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content" ref={containerRef}>
        {/* 3D Viewer */}
        <section className="viewer-section" style={{ width: `${viewerWidth}%` }}>
          <div className="viewer-container">
            <Canvas shadows>
              <PerspectiveCamera makeDefault position={[5, 5, 5]} />
              <OrbitControls
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                minDistance={3}
                maxDistance={15}
              />

              {/* Lighting */}
              <ambientLight intensity={0.4} />
              <directionalLight
                position={[10, 10, 5]}
                intensity={1}
                castShadow
                shadow-mapSize={[1024, 1024]}
              />
              <pointLight position={[-10, -10, -5]} intensity={0.5} color="#4a9eff" />

              {/* Environment */}
              <Environment preset="city" />

              {/* Grid */}
              <gridHelper args={[20, 20, '#444', '#333']} />

              {/* Choix du modèle de drone */}
              {droneProfile?.is_manipulable ? (
                // Drone MANIPULABLE - Répond aux données mock
                <DroneSimple
                  pitch={telemetry?.pitch || 0}
                  roll={simulatedRoll !== null ? simulatedRoll : (telemetry?.roll || 0)}
                  yaw={telemetry?.yaw || 0}
                />
              ) : droneProfile?.selected_skin ? (
                // Drone VISION avec skin GLB sélectionné
                <DroneModelViewer
                  modelFile={droneProfile.selected_skin}
                  pitch={telemetry?.pitch || 0}
                  roll={telemetry?.roll || 0}
                  yaw={telemetry?.yaw || 0}
                />
              ) : (
                // Drone VISION procédural (défaut)
                <Drone3D
                  pitch={telemetry?.pitch || 0}
                  roll={telemetry?.roll || 0}
                  yaw={telemetry?.yaw || 0}
                />
              )}
            </Canvas>

            {/* Overlay Info */}
            <div className="viewer-overlay">
              <span>🖱️ Utilisez la souris pour tourner la vue</span>
            </div>
          </div>
        </section>

        {/* Resizer Handle */}
        <div
          className={`resizer ${isDragging ? 'active' : ''}`}
          onMouseDown={handleMouseDown}
        />

        {/* Side Panel */}
        <aside className="side-panel" style={{ width: `${100 - viewerWidth}%` }}>
          {/* Mock Data Control - SEULEMENT pour drone manipulable */}
          {droneProfile?.is_manipulable ? (
            <>
              <MockDataToggle />

              <div className="p-4 border-b border-gray-700 bg-gray-900">
                <h2 className="text-xl font-bold mb-4 text-blue-400">Simulation</h2>
                <div className="flex flex-col items-center fade-in">
                  <SimulationWheel
                    onAngleChange={handleSimulationAngle}
                    onLiveRotation={handleLiveSimulation}
                    isLoading={simulationLoading}
                  />
                  {simulatedRoll !== null && (
                    <button
                      onClick={handleResetSimulation}
                      className="w-full mt-2 text-xs text-blue-400 hover:text-blue-300 underline"
                    >
                      Réinitialiser (Retour Télémétrie)
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="card" style={{ marginBottom: '1rem', textAlign: 'center', padding: '1rem' }}>
              <span style={{ fontSize: '1.5rem' }}>👁️</span>
              <p style={{ color: '#a1a1aa', marginTop: '0.5rem' }}>Mode Vision Uniquement</p>
              <p style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                {droneProfile?.selected_skin
                  ? `Skin: ${droneProfile.selected_skin.includes('camera') ? 'Caméra' : 'Design'}`
                  : 'Skin: Procédural (défaut)'}
              </p>
            </div>
          )}

          <Dashboard telemetry={telemetry} />
          <AlertPanel alerts={alerts} onClear={clearAlerts} />
        </aside>
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>Projet IoT - Système de Télémétrie Drone avec MPU6050</p>
      </footer>

      {/* Disconnect Confirmation Modal */}
      {showDisconnectModal && (
        <div className="disconnect-modal-overlay">
          <div className="disconnect-modal">
            <div className="disconnect-icon">🔌</div>
            <h2>Déconnecter le drone ?</h2>
            <p>Vous êtes sur le point de quitter la session de télémétrie et de déconnecter le drone.</p>
            <div className="disconnect-modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowDisconnectModal(false)}
              >
                Annuler
              </button>
              <button
                className="confirm-btn"
                onClick={() => {
                  disconnect() // Ferme le WebSocket explicitement
                  setShowDisconnectModal(false)
                  // Small delay to ensure WebSocket closes before navigation
                  setTimeout(() => navigate('/dashboard'), 100)
                }}
              >
                Confirmer la déconnexion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
