
import React, { useState, useRef, useEffect } from 'react';

interface SimulationWheelProps {
    onAngleChange: (angle: number) => void;
    onLiveRotation?: (angle: number) => void;
    isLoading?: boolean;
}

const SimulationWheel: React.FC<SimulationWheelProps> = ({ onAngleChange, onLiveRotation, isLoading = false }) => {
    const [rotation, setRotation] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const wheelRef = useRef<HTMLDivElement>(null);
    const centerRef = useRef<{ x: number, y: number }>({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        if (wheelRef.current) {
            const rect = wheelRef.current.getBoundingClientRect();
            centerRef.current = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
        }
    };

    // Use a ref to store the current angle so it's accessible in handleMouseUp
    // without triggering re-renders or dependency issues for the listener
    const currentAngleRef = useRef(0);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;

            const deltaX = e.clientX - centerRef.current.x;
            const deltaY = e.clientY - centerRef.current.y;

            // Calculate angle in degrees
            let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

            // Current implementation: direct mapping
            const currentAngle = angle + 90; // Rotate so 0 is at top (if 0 was right)
            setRotation(currentAngle);

            // Normalize to -180 to 180 (roughly)
            let normalizedAngle = currentAngle;
            while (normalizedAngle > 180) normalizedAngle -= 360;
            while (normalizedAngle <= -180) normalizedAngle += 360;

            // Store for use in mouse up
            currentAngleRef.current = normalizedAngle;

            // Trigger live rotation callback if provided
            if (onLiveRotation) {
                onLiveRotation(normalizedAngle);
            }
        };

        const handleMouseUp = () => {
            if (isDragging) {
                setIsDragging(false);
                // Only trigger prediction when the user releases the wheel
                onAngleChange(currentAngleRef.current);
            }
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, onAngleChange]);

    return (
        <div className="simulation-container">
            <h3 className="card-title mb-4">Simulateur d'Inclinaison</h3>

            <div
                ref={wheelRef}
                onMouseDown={handleMouseDown}
                className="simulation-wheel-wrapper"
            >
                {/* Wheel Body */}
                <div
                    className="simulation-wheel"
                    style={{ transform: `rotate(${rotation}deg)` }}
                >
                    {/* Visual Indicator (Top) */}
                    <div className="wheel-indicator"></div>

                    {/* Cross lines for rotation visibility */}
                    <div className="wheel-cross-h"></div>
                    <div className="wheel-cross-v"></div>

                    {/* Inner Circle */}
                    <div className="wheel-pivot">
                        <span>Pivot</span>
                    </div>
                </div>
            </div>

            <div className="simulation-info">
                <p>Angle: <span className="simulation-angle">{rotation.toFixed(1)}°</span></p>
                <p className="simulation-status">
                    {isLoading ? 'Analyse en cours...' : 'Tournez pour simuler'}
                </p>
            </div>
        </div>
    );
};

export default SimulationWheel;
