import React, { useEffect, useState } from 'react';
import { playCelebrationSound } from '../lib/audio/celebration-sounds';

interface ConfettiProps {
    show: boolean;
    onComplete?: () => void;
    duration?: number;
    playSound?: boolean;
}

interface ConfettiPiece {
    id: number;
    x: number;
    y: number;
    rotation: number;
    scale: number;
    color: string;
    velocityX: number;
    velocityY: number;
    rotationSpeed: number;
}

export function DraftConfetti({ show, onComplete, duration = 3000, playSound = true }: ConfettiProps) {
    const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
    const [isActive, setIsActive] = useState(false);

    const colors = [
        '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
        '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd',
        '#00d2d3', '#ff9f43', '#10ac84', '#ee5a24'
    ];

    const createConfettiPiece = (id: number): ConfettiPiece => ({
        id,
        x: Math.random() * window.innerWidth,
        y: -10,
        rotation: Math.random() * 360,
        scale: Math.random() * 0.8 + 0.4,
        color: colors[Math.floor(Math.random() * colors.length)],
        velocityX: (Math.random() - 0.5) * 4,
        velocityY: Math.random() * 3 + 2,
        rotationSpeed: (Math.random() - 0.5) * 8
    });

    useEffect(() => {
        if (!show) {
            setIsActive(false);
            setConfetti([]);
            return;
        }

        setIsActive(true);

        // Play celebration sound when confetti starts
        if (playSound) {
            // Small delay to ensure user interaction has occurred
            setTimeout(() => {
                playCelebrationSound();
            }, 100);
        }

        // Create initial burst of confetti
        const initialConfetti = Array.from({ length: 50 }, (_, i) => createConfettiPiece(i));
        setConfetti(initialConfetti);

        // Add more confetti pieces over time
        const addInterval = setInterval(() => {
            setConfetti(prev => [
                ...prev,
                ...Array.from({ length: 8 }, (_, i) => createConfettiPiece(prev.length + i))
            ]);
        }, 200);

        // Stop adding confetti and start cleanup
        const stopTimeout = setTimeout(() => {
            clearInterval(addInterval);

            // Clean up after animation completes
            setTimeout(() => {
                setIsActive(false);
                setConfetti([]);
                onComplete?.();
            }, 2000);
        }, duration);

        return () => {
            clearInterval(addInterval);
            clearTimeout(stopTimeout);
        };
    }, [show, duration, onComplete, playSound]);

    useEffect(() => {
        if (!isActive || confetti.length === 0) return;

        const animationFrame = setInterval(() => {
            setConfetti(prev =>
                prev
                    .map(piece => ({
                        ...piece,
                        x: piece.x + piece.velocityX,
                        y: piece.y + piece.velocityY,
                        rotation: piece.rotation + piece.rotationSpeed,
                        velocityY: piece.velocityY + 0.1 // gravity
                    }))
                    .filter(piece => piece.y < window.innerHeight + 20) // Remove pieces that fall off screen
            );
        }, 16); // ~60fps

        return () => clearInterval(animationFrame);
    }, [isActive, confetti.length]);

    if (!isActive) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            pointerEvents: 'none',
            zIndex: 9999,
            overflow: 'hidden'
        }}>
            {confetti.map(piece => (
                <div
                    key={piece.id + piece.x}
                    style={{
                        position: 'absolute',
                        left: piece.x,
                        top: piece.y,
                        width: '8px',
                        height: '8px',
                        backgroundColor: piece.color,
                        transform: `rotate(${piece.rotation}deg) scale(${piece.scale})`,
                        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                        transition: 'none'
                    }}
                />
            ))}

            {/* Celebration Text Overlay */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none',
                animation: 'celebrationBounce 1s ease-out'
            }}>
                <div style={{
                    fontSize: '4rem',
                    fontWeight: 'bold',
                    color: '#fff',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                    marginBottom: '1rem'
                }}>
                    🎉 DRAFT COMPLETE! 🎉
                </div>
                <div style={{
                    fontSize: '1.5rem',
                    color: '#fff',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                }}>
                    All picks are in! Time to dominate! 🏆
                </div>
            </div>

            <style>
                {`
          @keyframes celebrationBounce {
            0% {
              transform: translate(-50%, -50%) scale(0.3);
              opacity: 0;
            }
            50% {
              transform: translate(-50%, -50%) scale(1.1);
              opacity: 1;
            }
            100% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 1;
            }
          }
        `}
            </style>
        </div>
    );
}
