import { useState, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
    useGLTF, Center, OrbitControls
} from '@react-three/drei';
import { Group, Box3, Vector3 } from 'three';
import './SkinSelectorModal.css';

interface Skin {
    id: string;
    name: string;
    file: string | null;
    preview: string;
}

interface SkinSelectorModalProps {
    isOpen: boolean;
    profileId: number;
    currentSkin: string | null;
    onClose: () => void;
    onSkinChange: (profileId: number, skinFile: string | null) => void;
}

/**
 * Mini 3D preview for procedural drone
 */
function ProceduralPreview() {
    const groupRef = useRef<Group>(null);

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = state.clock.elapsedTime * 0.5;
        }
    });

    return (
        <group ref={groupRef} scale={1.5}>
            <mesh>
                <boxGeometry args={[0.5, 0.1, 0.5]} />
                <meshStandardMaterial color="#1e3a5f" metalness={0.7} roughness={0.3} />
            </mesh>
            {[[-0.4, 0, -0.4], [0.4, 0, -0.4], [-0.4, 0, 0.4], [0.4, 0, 0.4]].map((pos, i) => (
                <mesh key={i} position={pos as [number, number, number]}>
                    <cylinderGeometry args={[0.08, 0.08, 0.05, 16]} />
                    <meshStandardMaterial color="#333" metalness={0.8} />
                </mesh>
            ))}
        </group>
    );
}

/**
 * Mini 3D preview for GLB model
 */
function GLBPreview({ modelFile }: { modelFile: string }) {
    const groupRef = useRef<Group>(null);
    const { scene } = useGLTF(`/models/${modelFile}`);

    const scale = (() => {
        const box = new Box3().setFromObject(scene);
        const size = box.getSize(new Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        return 1.5 / maxDim;
    })();

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = state.clock.elapsedTime * 0.5;
        }
    });

    return (
        <group ref={groupRef}>
            <primitive object={scene.clone()} scale={scale} />
        </group>
    );
}

/**
 * Loading fallback
 */
function LoadingPreview() {
    const meshRef = useRef<any>(null);

    useFrame((_, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * 2;
        }
    });

    return (
        <mesh ref={meshRef}>
            <octahedronGeometry args={[0.4, 0]} />
            <meshStandardMaterial color="#6366f1" wireframe />
        </mesh>
    );
}

/**
 * SkinSelectorModal - Modal for selecting 3D skin on vision drones
 */
function SkinSelectorModal({ isOpen, profileId, currentSkin, onClose, onSkinChange }: SkinSelectorModalProps) {
    const [selectedSkin, setSelectedSkin] = useState<string | null>(currentSkin);
    const [hoveredSkin, setHoveredSkin] = useState<Skin | null>(null);
    const [loading, setLoading] = useState(false);

    const skins: Skin[] = [
        { id: 'procedural', name: 'Procédural (Défaut)', file: null, preview: '🚁' },
        { id: 'camera', name: 'Drone Caméra', file: 'animated_drone_with_camera_free.glb', preview: '📷' },
        { id: 'design', name: 'Drone Design', file: 'drone_design.glb', preview: '✨' }
    ];

    const handleApply = async () => {
        setLoading(true);
        await onSkinChange(profileId, selectedSkin);
        setLoading(false);
        onClose();
    };

    const previewSkin = hoveredSkin || skins.find(s => s.file === selectedSkin) || skins[0];

    if (!isOpen) return null;

    return (
        <div className="skin-modal-overlay" onClick={onClose}>
            <div className="skin-modal" onClick={(e) => e.stopPropagation()}>
                <div className="skin-modal-header">
                    <h2>🎨 Changer le Skin 3D</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="skin-modal-content">
                    {/* Mini 3D Preview */}
                    <div className="skin-preview-container">
                        <Canvas camera={{ position: [2, 1.5, 2], fov: 50 }}>
                            <ambientLight intensity={0.5} />
                            <directionalLight position={[5, 5, 5]} intensity={1} />
                            <pointLight position={[-5, -5, -5]} intensity={0.3} color="#4a9eff" />
                            <Suspense fallback={<LoadingPreview />}>
                                <Center>
                                    {previewSkin.file ? (
                                        <GLBPreview modelFile={previewSkin.file} />
                                    ) : (
                                        <ProceduralPreview />
                                    )}
                                </Center>
                            </Suspense>
                            <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={2} />
                        </Canvas>
                        <div className="preview-label">{previewSkin.name}</div>
                    </div>

                    {/* Skin Grid */}
                    <div className="skin-grid">
                        {skins.map((skin) => (
                            <div
                                key={skin.id}
                                className={`skin-card ${selectedSkin === skin.file ? 'selected' : ''}`}
                                onClick={() => setSelectedSkin(skin.file)}
                                onMouseEnter={() => setHoveredSkin(skin)}
                                onMouseLeave={() => setHoveredSkin(null)}
                            >
                                <span className="skin-icon">{skin.preview}</span>
                                <span className="skin-name">{skin.name}</span>
                                {selectedSkin === skin.file && <span className="check-mark">✓</span>}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="skin-modal-actions">
                    <button className="cancel-btn" onClick={onClose}>Annuler</button>
                    <button
                        className="apply-btn"
                        onClick={handleApply}
                        disabled={loading}
                    >
                        {loading ? 'Application...' : 'Appliquer'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SkinSelectorModal;
