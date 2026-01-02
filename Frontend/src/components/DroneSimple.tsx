import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, MathUtils } from 'three'

interface DroneSimpleProps {
    pitch: number
    roll: number
    yaw: number
}

/**
 * Hélice simple avec rotation rapide
 */
function SimplePropeller({ position, direction, color }: {
    position: [number, number, number],
    direction: number,
    color: string
}) {
    const propRef = useRef<Group>(null)

    useFrame((_, delta) => {
        if (propRef.current) {
            propRef.current.rotation.y += delta * 40 * direction
        }
    })

    return (
        <group position={position}>
            <mesh>
                <cylinderGeometry args={[0.06, 0.08, 0.08, 12]} />
                <meshStandardMaterial color="#333" metalness={0.9} roughness={0.2} />
            </mesh>
            <group ref={propRef} position={[0, 0.06, 0]}>
                <mesh>
                    <boxGeometry args={[0.4, 0.01, 0.05]} />
                    <meshStandardMaterial color={color} metalness={0.4} roughness={0.6} transparent opacity={0.85} />
                </mesh>
                <mesh rotation={[0, Math.PI / 2, 0]}>
                    <boxGeometry args={[0.4, 0.01, 0.05]} />
                    <meshStandardMaterial color={color} metalness={0.4} roughness={0.6} transparent opacity={0.85} />
                </mesh>
            </group>
        </group>
    )
}

/**
 * DroneSimple - Drone Manipulable (répond aux mock data)
 */
function DroneSimple({ pitch, roll, yaw }: DroneSimpleProps) {
    const groupRef = useRef<Group>(null)
    const targetRotation = useRef({ x: 0, y: 0, z: 0 })

    useFrame((state) => {
        if (groupRef.current) {
            const safePitch = (pitch !== undefined && pitch !== null && !isNaN(pitch)) ? pitch : 0
            const safeRoll = (roll !== undefined && roll !== null && !isNaN(roll)) ? roll : 0
            const safeYaw = (yaw !== undefined && yaw !== null && !isNaN(yaw)) ? yaw : 0

            targetRotation.current = {
                x: MathUtils.degToRad(safePitch),
                y: MathUtils.degToRad(safeYaw),
                z: MathUtils.degToRad(safeRoll)
            }

            groupRef.current.rotation.x = MathUtils.lerp(groupRef.current.rotation.x, targetRotation.current.x, 0.08)
            groupRef.current.rotation.y = MathUtils.lerp(groupRef.current.rotation.y, targetRotation.current.y, 0.08)
            groupRef.current.rotation.z = MathUtils.lerp(groupRef.current.rotation.z, targetRotation.current.z, 0.08)

            const hoverOffset = Math.sin(state.clock.elapsedTime * 1.2) * 0.1
            groupRef.current.position.y = 1 + hoverOffset
        }
    })

    return (
        <group ref={groupRef}>
            <mesh castShadow>
                <boxGeometry args={[0.5, 0.12, 0.5]} />
                <meshStandardMaterial color="#ff6b35" metalness={0.6} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.08, 0]} castShadow>
                <boxGeometry args={[0.4, 0.04, 0.4]} />
                <meshStandardMaterial color="#1a1a2e" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0.12, 0]}>
                <sphereGeometry args={[0.03, 8, 8]} />
                <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={2} />
            </mesh>
            {[
                { armPos: [0.35, 0, 0.35], propPos: [0.45, 0.02, 0.45], dir: 1, color: '#ff3366' },
                { armPos: [-0.35, 0, 0.35], propPos: [-0.45, 0.02, 0.45], dir: -1, color: '#ff3366' },
                { armPos: [0.35, 0, -0.35], propPos: [0.45, 0.02, -0.45], dir: -1, color: '#33ff66' },
                { armPos: [-0.35, 0, -0.35], propPos: [-0.45, 0.02, -0.45], dir: 1, color: '#33ff66' },
            ].map((arm, i) => (
                <group key={i}>
                    <mesh position={arm.armPos as [number, number, number]} rotation={[0, i < 2 ? Math.PI / 4 : -Math.PI / 4, 0]} castShadow>
                        <boxGeometry args={[0.45, 0.035, 0.06]} />
                        <meshStandardMaterial color="#1a1a2e" metalness={0.7} roughness={0.3} />
                    </mesh>
                    <SimplePropeller position={arm.propPos as [number, number, number]} direction={arm.dir} color={arm.color} />
                </group>
            ))}
            <mesh position={[0, 0, 0.28]}>
                <sphereGeometry args={[0.025, 8, 8]} />
                <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={1.5} />
            </mesh>
            <mesh position={[0, 0, -0.28]}>
                <sphereGeometry args={[0.02, 8, 8]} />
                <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.8} />
            </mesh>
        </group>
    )
}

export default DroneSimple
