import { useRef, Suspense, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Center, useAnimations, Clone } from '@react-three/drei';
import { Group, MathUtils, Box3, Vector3, LoopRepeat } from 'three';

interface DroneModelViewerProps {
    modelFile: string;
    pitch: number;
    roll: number;
    yaw: number;
}

/**
 * Loading fallback - spinning octahedron
 */
function LoadingFallback() {
    const meshRef = useRef<any>(null);

    useFrame((_, delta) => {
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

/**
 * GLB Model Loader with native animation support using <Clone>
 */
function GLBDrone({ modelFile, pitch, roll, yaw }: DroneModelViewerProps) {
    const groupRef = useRef<Group>(null);
    const targetRotation = useRef({ x: 0, y: 0, z: 0 });
    const time = useRef(0);

    // Load the GLB model
    // Warning: we clone it via <Clone> component to allow independent animations
    const { scene, animations } = useGLTF(`/models/${modelFile}`);

    // Determine scale based on the original cached scene
    const scale = useMemo(() => {
        const box = new Box3().setFromObject(scene);
        const size = box.getSize(new Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        return 2 / maxDim;
    }, [scene]);

    // Setup animations on the group (which wraps the Clone)
    const { actions } = useAnimations(animations, groupRef);

    // Track if a native animation is playing
    const isNativeAnimPlaying = useRef(false);

    // Play animations
    useEffect(() => {
        if (actions) {
            console.log('🎬 Animations:', Object.keys(actions));

            // Try to find a hover/idle/fly animation
            const actionNames = Object.keys(actions);
            const hoverName = actionNames.find(name =>
                name.toLowerCase().includes('hover') ||
                name.toLowerCase().includes('idle') ||
                name.toLowerCase().includes('fly')
            );

            if (hoverName) {
                console.log('✅ Playing:', hoverName);
                actions[hoverName]?.reset().fadeIn(0.5).play();
                isNativeAnimPlaying.current = true;
            } else if (actionNames.length > 0) {
                // Determine a default if no hover found
                console.log('▶️ Playing default:', actionNames[0]);
                actions[actionNames[0]]?.reset().fadeIn(0.5).play();
                isNativeAnimPlaying.current = true;
            } else {
                isNativeAnimPlaying.current = false;
            }
        }

        return () => {
            // Cleanup handled by useAnimations
        };
    }, [actions]);

    // Update target rotation based on telemetry
    targetRotation.current = {
        x: MathUtils.degToRad(pitch),
        y: MathUtils.degToRad(yaw),
        z: MathUtils.degToRad(roll)
    };

    // Animation loop
    useFrame((_, delta) => {
        time.current += delta;

        // Smooth rotation interpolation for drone body
        if (groupRef.current) {
            // Add subtle floating animation if no native animation is playing
            if (!isNativeAnimPlaying.current) {
                const floatY = Math.sin(time.current * 1.5) * 0.1; // Vertical float
                const wobbleX = Math.sin(time.current * 1) * 0.02; // Slight tilt

                groupRef.current.position.y = floatY;
                groupRef.current.rotation.x = MathUtils.lerp(
                    groupRef.current.rotation.x,
                    targetRotation.current.x + wobbleX,
                    0.1
                );
            } else {
                groupRef.current.rotation.x = MathUtils.lerp(
                    groupRef.current.rotation.x,
                    targetRotation.current.x,
                    0.1
                );
            }

            groupRef.current.rotation.y = MathUtils.lerp(
                groupRef.current.rotation.y,
                targetRotation.current.y,
                0.1
            );
            groupRef.current.rotation.z = MathUtils.lerp(
                groupRef.current.rotation.z,
                targetRotation.current.z,
                0.1
            );
        }
    });

    return (
        <group ref={groupRef} position={[0, 0, 0]}>
            <Clone object={scene} scale={scale} deep castShadow receiveShadow />
        </group>
    );
}

/**
 * Main DroneModelViewer component
 */
function DroneModelViewer({ modelFile, pitch, roll, yaw }: DroneModelViewerProps) {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <Center>
                <GLBDrone
                    modelFile={modelFile}
                    pitch={pitch}
                    roll={roll}
                    yaw={yaw}
                />
            </Center>
        </Suspense>
    );
}

export default DroneModelViewer;
