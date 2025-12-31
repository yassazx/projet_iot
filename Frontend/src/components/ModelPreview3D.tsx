import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center } from '@react-three/drei';
import * as THREE from 'three';

interface ModelPreview3DProps {
    modelFile: string;
    size?: number;
}

// Component to load and display the 3D model
function DroneModel({ modelFile }: { modelFile: string }) {
    const modelRef = useRef<THREE.Group>(null);

    // Try to load the model, fallback to a simple geometry if not found
    let scene: THREE.Group | null = null;

    try {
        const gltf = useGLTF(`/models/${modelFile}`);
        scene = gltf.scene;
    } catch (error) {
        console.warn(`Model ${modelFile} not found, using fallback`);
    }

    // Auto-rotate the model
    useFrame((_state, delta) => {
        if (modelRef.current) {
            modelRef.current.rotation.y += delta * 0.5;
        }
    });

    if (!scene) {
        // Fallback: simple drone-like shape
        return (
            <group ref={modelRef}>
                <mesh>
                    <boxGeometry args={[0.8, 0.15, 0.8]} />
                    <meshStandardMaterial color="#6366f1" />
                </mesh>
                {/* Propeller arms */}
                {[0, 1, 2, 3].map((i) => (
                    <mesh key={i} position={[
                        Math.cos((i * Math.PI) / 2) * 0.5,
                        0.1,
                        Math.sin((i * Math.PI) / 2) * 0.5
                    ]}>
                        <cylinderGeometry args={[0.15, 0.15, 0.05, 16]} />
                        <meshStandardMaterial color="#4f46e5" />
                    </mesh>
                ))}
            </group>
        );
    }

    // Clone and scale the model
    const clonedScene = scene.clone();

    // Calculate bounding box to auto-scale
    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 1.5 / maxDim;

    return (
        <group ref={modelRef}>
            <primitive object={clonedScene} scale={scale} />
        </group>
    );
}

// Loading fallback
function LoadingFallback() {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((_state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * 2;
        }
    });

    return (
        <mesh ref={meshRef}>
            <octahedronGeometry args={[0.5, 0]} />
            <meshStandardMaterial color="#6366f1" wireframe />
        </mesh>
    );
}

function ModelPreview3D({ modelFile, size = 100 }: ModelPreview3DProps) {
    return (
        <div
            style={{
                width: size,
                height: size,
                borderRadius: '12px',
                overflow: 'hidden',
                background: 'radial-gradient(ellipse at center, #1a1f2e 0%, #0a0e17 100%)'
            }}
        >
            <Canvas
                camera={{ position: [2, 1, 2], fov: 45 }}
                gl={{ antialias: true, alpha: true }}
            >
                <ambientLight intensity={0.5} />
                <directionalLight position={[5, 5, 5]} intensity={1} />
                <pointLight position={[-5, -5, -5]} intensity={0.3} />

                <Suspense fallback={<LoadingFallback />}>
                    <Center>
                        <DroneModel modelFile={modelFile} />
                    </Center>
                </Suspense>

                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    autoRotate={false}
                />
            </Canvas>
        </div>
    );
}

export default ModelPreview3D;
