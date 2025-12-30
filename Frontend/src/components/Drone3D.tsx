import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, MathUtils } from 'three'

interface Drone3DProps {
    pitch: number
    roll: number
    yaw: number
}

/**
 * Composant Hélice avec rotation
 */
function Propeller({ position, direction, color }: { 
    position: [number, number, number], 
    direction: number,
    color: string 
}) {
    const propRef = useRef<Group>(null)
    
    useFrame((_, delta) => {
        if (propRef.current) {
            propRef.current.rotation.y += delta * 35 * direction
        }
    })
    
    return (
        <group position={position}>
            {/* Base du moteur */}
            <mesh castShadow>
                <cylinderGeometry args={[0.08, 0.1, 0.12, 16]} />
                <meshStandardMaterial color="#2a2a2a" metalness={0.9} roughness={0.2} />
            </mesh>
            
            {/* Capuchon du moteur */}
            <mesh position={[0, 0.08, 0]} castShadow>
                <cylinderGeometry args={[0.05, 0.07, 0.04, 16]} />
                <meshStandardMaterial color="#1a1a1a" metalness={0.95} roughness={0.1} />
            </mesh>
            
            {/* Hélices qui tournent */}
            <group ref={propRef} position={[0, 0.12, 0]}>
                {/* Pale 1 */}
                <mesh rotation={[0, 0, Math.PI * 0.05]} castShadow>
                    <boxGeometry args={[0.5, 0.015, 0.06]} />
                    <meshStandardMaterial 
                        color={color} 
                        metalness={0.3} 
                        roughness={0.6}
                        transparent
                        opacity={0.9}
                    />
                </mesh>
                {/* Pale 2 */}
                <mesh rotation={[0, Math.PI / 2, -Math.PI * 0.05]} castShadow>
                    <boxGeometry args={[0.5, 0.015, 0.06]} />
                    <meshStandardMaterial 
                        color={color} 
                        metalness={0.3} 
                        roughness={0.6}
                        transparent
                        opacity={0.9}
                    />
                </mesh>
                {/* Centre de l'hélice */}
                <mesh>
                    <cylinderGeometry args={[0.03, 0.03, 0.02, 8]} />
                    <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
                </mesh>
            </group>
        </group>
    )
}

/**
 * Composant 3D du drone - Modèle procédural détaillé
 */
function Drone3D({ pitch, roll, yaw }: Drone3DProps) {
    const groupRef = useRef<Group>(null)
    const targetRotation = useRef({ x: 0, y: 0, z: 0 })
    
    targetRotation.current = {
        x: MathUtils.degToRad(pitch),
        y: MathUtils.degToRad(yaw),
        z: MathUtils.degToRad(roll)
    }
    
    useFrame(() => {
        if (groupRef.current) {
            groupRef.current.rotation.x = MathUtils.lerp(groupRef.current.rotation.x, targetRotation.current.x, 0.1)
            groupRef.current.rotation.y = MathUtils.lerp(groupRef.current.rotation.y, targetRotation.current.y, 0.1)
            groupRef.current.rotation.z = MathUtils.lerp(groupRef.current.rotation.z, targetRotation.current.z, 0.1)
        }
    })

    return (
        <group ref={groupRef} position={[0, 1, 0]}>
            {/* Corps central - Partie supérieure */}
            <mesh position={[0, 0.05, 0]} castShadow>
                <boxGeometry args={[0.6, 0.1, 0.6]} />
                <meshStandardMaterial color="#1e3a5f" metalness={0.7} roughness={0.3} />
            </mesh>
            
            {/* Corps central - Partie inférieure */}
            <mesh position={[0, -0.05, 0]} castShadow>
                <boxGeometry args={[0.5, 0.08, 0.5]} />
                <meshStandardMaterial color="#0d2137" metalness={0.8} roughness={0.2} />
            </mesh>
            
            {/* Dôme supérieur */}
            <mesh position={[0, 0.12, 0]} castShadow>
                <sphereGeometry args={[0.15, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#2a4a6a" metalness={0.6} roughness={0.4} />
            </mesh>
            
            {/* LED centrale */}
            <mesh position={[0, 0.18, 0]}>
                <sphereGeometry args={[0.03, 8, 8]} />
                <meshStandardMaterial 
                    color="#00ff88" 
                    emissive="#00ff88" 
                    emissiveIntensity={2} 
                />
            </mesh>
            
            {/* Bras du drone */}
            {[
                { pos: [0.4, 0, 0.4], rot: Math.PI / 4, propPos: [0.5, 0, 0.5], dir: 1, color: '#e74c3c' },
                { pos: [-0.4, 0, 0.4], rot: -Math.PI / 4, propPos: [-0.5, 0, 0.5], dir: -1, color: '#e74c3c' },
                { pos: [0.4, 0, -0.4], rot: -Math.PI / 4, propPos: [0.5, 0, -0.5], dir: -1, color: '#2ecc71' },
                { pos: [-0.4, 0, -0.4], rot: Math.PI / 4, propPos: [-0.5, 0, -0.5], dir: 1, color: '#2ecc71' },
            ].map((arm, i) => (
                <group key={i}>
                    {/* Bras */}
                    <mesh 
                        position={arm.pos as [number, number, number]} 
                        rotation={[0, arm.rot, 0]}
                        castShadow
                    >
                        <boxGeometry args={[0.5, 0.04, 0.08]} />
                        <meshStandardMaterial color="#1a2a3a" metalness={0.7} roughness={0.3} />
                    </mesh>
                    
                    {/* Hélice */}
                    <Propeller 
                        position={arm.propPos as [number, number, number]} 
                        direction={arm.dir}
                        color={arm.color}
                    />
                </group>
            ))}
            
            {/* Caméra/Gimbal */}
            <group position={[0, -0.12, 0.2]}>
                <mesh castShadow>
                    <boxGeometry args={[0.12, 0.08, 0.1]} />
                    <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.1} />
                </mesh>
                <mesh position={[0, 0, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.025, 0.025, 0.03, 16]} />
                    <meshStandardMaterial color="#333" metalness={1} roughness={0} />
                </mesh>
                {/* Lentille */}
                <mesh position={[0, 0, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.015, 0.02, 0.01, 16]} />
                    <meshStandardMaterial color="#0066cc" metalness={0.5} roughness={0.1} />
                </mesh>
            </group>
            
            {/* Pattes d'atterrissage */}
            {[
                [0.25, -0.2, 0.3],
                [-0.25, -0.2, 0.3],
                [0.25, -0.2, -0.3],
                [-0.25, -0.2, -0.3],
            ].map((pos, i) => (
                <group key={`leg-${i}`} position={pos as [number, number, number]}>
                    {/* Pied vertical */}
                    <mesh castShadow>
                        <cylinderGeometry args={[0.015, 0.015, 0.15, 8]} />
                        <meshStandardMaterial color="#2a2a2a" metalness={0.6} roughness={0.4} />
                    </mesh>
                    {/* Pied horizontal */}
                    <mesh position={[0, -0.08, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                        <capsuleGeometry args={[0.012, 0.08, 4, 8]} />
                        <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.5} />
                    </mesh>
                </group>
            ))}
            
            {/* LEDs de navigation - Avant (Rouge) */}
            <mesh position={[0, 0, 0.32]}>
                <sphereGeometry args={[0.02, 8, 8]} />
                <meshStandardMaterial 
                    color="#ff0000" 
                    emissive="#ff0000" 
                    emissiveIntensity={2} 
                />
            </mesh>
            
            {/* LEDs de navigation - Arrière (Blanc) */}
            <mesh position={[0, 0, -0.32]}>
                <sphereGeometry args={[0.02, 8, 8]} />
                <meshStandardMaterial 
                    color="#ffffff" 
                    emissive="#ffffff" 
                    emissiveIntensity={1} 
                />
            </mesh>
            
            {/* Antenne */}
            <mesh position={[0.15, 0.15, -0.15]} castShadow>
                <cylinderGeometry args={[0.008, 0.008, 0.12, 8]} />
                <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0.15, 0.22, -0.15]}>
                <sphereGeometry args={[0.015, 8, 8]} />
                <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
            </mesh>
        </group>
    )
}

export default Drone3D
