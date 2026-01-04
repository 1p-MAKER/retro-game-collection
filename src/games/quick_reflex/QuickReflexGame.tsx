import React, { useEffect, useRef, useState } from 'react';
import { QuickReflexLogic } from './QuickReflexLogic';
import { soundManager } from '../../audio/SoundGenerator';
import { RetroButton } from '../../components/ui/RetroButton';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/useGameStore';
import { GameCanvas } from '../../components/layout/GameCanvas';

export const QuickReflexGame: React.FC = () => {
    const navigate = useNavigate();
    const { updateGameProgress } = useGameStore();
    const gameLogic = useRef<QuickReflexLogic | null>(null);
    const [uiState, setUiState] = useState({ state: 'wait', time: 0 });

    useEffect(() => {
        gameLogic.current = new QuickReflexLogic(soundManager);
        setUiState({ state: 'wait', time: 0 });
    }, []);

    const handleUpdate = (deltaTime: number) => {
        if (!gameLogic.current) return;
        gameLogic.current.update(deltaTime);

        if (gameLogic.current.state !== uiState.state) {
            setUiState({
                state: gameLogic.current.state as any,
                time: gameLogic.current.reactionTime
            });

            if (gameLogic.current.state === 'result') {
                // Inverse score: lower is better. Store raw ms? Or convert to score?
                // Let's store raw ms but negative? System expects high score?
                // Or just transform: 1000 - ms.
                const score = Math.max(0, 1000 - gameLogic.current.reactionTime);
                updateGameProgress('quick_reflex', 1, score);
            }
        }
    };

    const handleDraw = (ctx: CanvasRenderingContext2D) => {
        if (!gameLogic.current) return;

        let color = '#1D2B53';
        if (gameLogic.current.state === 'go') color = '#FF004D'; // FLASH RED
        if (gameLogic.current.state === 'result') color = '#00E436';
        if (gameLogic.current.state === 'falsestart') color = '#5F574F';

        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 320, 480);
    };

    const handleTap = () => {
        gameLogic.current?.tap();
    };

    return (
        <div
            style={{ position: 'relative', width: '100%', height: '100%' }}
            onMouseDown={handleTap}
            onTouchStart={handleTap}
        >
            <GameCanvas width={320} height={480} onUpdate={handleUpdate} onDraw={handleDraw} />

            <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                {uiState.state === 'wait' && <h1 style={{ color: 'white' }}>WAIT...</h1>}
                {uiState.state === 'go' && <h1 style={{ color: 'white', fontSize: '4rem' }}>GO!!!</h1>}

                {uiState.state === 'result' && (
                    <div style={{ textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.8)', padding: 20, borderRadius: 10, color: 'white', pointerEvents: 'auto' }}>
                        <h2>{uiState.time} ms</h2>
                        <p>{uiState.time < 200 ? 'GODLIKE!' : uiState.time < 300 ? 'FAST!' : 'AVERAGE'}</p>
                        <RetroButton onClick={() => window.location.reload()}>RETRY</RetroButton>
                        <br />
                        <RetroButton variant="secondary" onClick={() => navigate('/menu')}>EXIT</RetroButton>
                    </div>
                )}

                {uiState.state === 'falsestart' && (
                    <div style={{ textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.8)', padding: 20, borderRadius: 10, color: 'white', pointerEvents: 'auto' }}>
                        <h2>TOO EARLY!</h2>
                        <RetroButton onClick={() => window.location.reload()}>RETRY</RetroButton>
                        <br />
                        <RetroButton variant="secondary" onClick={() => navigate('/menu')}>EXIT</RetroButton>
                    </div>
                )}
            </div>
        </div>
    );
};
