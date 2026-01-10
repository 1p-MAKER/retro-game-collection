import React, { useEffect, useState } from 'react';
import styles from './RetroFrame.module.css';
import { useGameStore } from '../../store/useGameStore';
import { MathGate } from '../ui/MathGate';
import { RetroButton } from '../ui/RetroButton';

interface RetroFrameProps {
    children: React.ReactNode;
    title?: string;
    onBack?: () => void;
    className?: string;
}

export const RetroFrame: React.FC<RetroFrameProps> = ({ children, title, onBack, className }) => {
    const { playTimeLimitMin } = useGameStore();
    const [_, setElapsed] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [showMathGate, setShowMathGate] = useState(false);

    useEffect(() => {
        if (playTimeLimitMin === 0) {
            setIsLocked(false);
            setElapsed(0);
            return;
        }

        const interval = setInterval(() => {
            setElapsed(prev => {
                const next = prev + 1;
                if (next >= playTimeLimitMin * 60) { // minutes to seconds
                    setIsLocked(true);
                }
                return next;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [playTimeLimitMin, isLocked]);

    const handleUnlock = () => {
        setIsLocked(false);
        setElapsed(0); // Reset timer
        setShowMathGate(false);
    };

    return (
        <div className={`${styles.container} ${className || ''}`}>
            <div className={styles.bezel}>
                <div className={styles.screen}>
                    {children}

                    {isLocked && (
                        <div style={{
                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                            backgroundColor: 'rgba(29, 43, 83, 0.95)', zIndex: 100,
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            color: '#FFF1E8', textAlign: 'center', padding: 20
                        }}>
                            <h2 style={{ color: '#FF004D' }}>TIME'S UP!</h2>
                            <p style={{ marginBottom: 20 }}>You have played for {playTimeLimitMin} minutes.</p>

                            {!showMathGate ? (
                                <RetroButton onClick={() => setShowMathGate(true)}>
                                    ASK PARENTS
                                </RetroButton>
                            ) : (
                                <MathGate onSuccess={handleUnlock} onCancel={() => setShowMathGate(false)} />
                            )}
                        </div>
                    )}

                    {onBack && (
                        <RetroButton
                            style={{ position: 'absolute', top: 10, right: 10, zIndex: 90 }}
                            size="sm"
                            onClick={onBack}
                        >
                            EXIT
                        </RetroButton>
                    )}
                </div>
                <div className={styles.logo}>{title || 'RETRO-11'}</div>
            </div>
        </div>
    );
};
