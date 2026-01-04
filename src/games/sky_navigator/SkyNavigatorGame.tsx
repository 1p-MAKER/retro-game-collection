import React, { useEffect, useRef, useState } from 'react';
import { GameCanvas } from '../../components/layout/GameCanvas';
import { SkyNavigatorLogic } from './SkyNavigatorLogic';
import { soundManager } from '../../audio/SoundGenerator';
import { RetroButton } from '../../components/ui/RetroButton';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/useGameStore';

export const SkyNavigatorGame: React.FC = () => {
    const navigate = useNavigate();
    const { updateGameProgress } = useGameStore();
    const gameLogic = useRef<SkyNavigatorLogic | null>(null);
    const [uiState, setUiState] = useState({ score: 0, state: 'paused' });
    const isPressing = useRef(false);

    useEffect(() => {
        gameLogic.current = new SkyNavigatorLogic(soundManager, 1);
        setUiState({ score: 0, state: 'paused' });
    }, []);

    const handleUpdate = (deltaTime: number) => {
        if (!gameLogic.current) return;

        if (isPressing.current) {
            gameLogic.current.thrust();
        }

        gameLogic.current.update(deltaTime);

        if (gameLogic.current.score !== uiState.score || gameLogic.current.gameState !== uiState.state) {
            setUiState({
                score: gameLogic.current.score,
                state: gameLogic.current.gameState
            });

            if (gameLogic.current.gameState === 'gameover') {
                // Save high score
                updateGameProgress('sky_navigator', 1, gameLogic.current.score);
            }
        }
    };

    const handleDraw = (ctx: CanvasRenderingContext2D) => {
        if (!gameLogic.current) return;
        const g = gameLogic.current;

        // Sky BG
        ctx.fillStyle = '#29ADFF';
        ctx.fillRect(0, 0, 320, 480);

        // Obstacles
        ctx.fillStyle = '#008751';
        g.obstacles.forEach(ob => {
            // Top pole
            ctx.fillRect(ob.x, 0, 40, ob.topH);
            // Bottom pole
            ctx.fillRect(ob.x, ob.bottomY, 40, 480 - ob.bottomY);

            // Outline
            ctx.strokeStyle = '#000';
            ctx.strokeRect(ob.x, 0, 40, ob.topH);
            ctx.strokeRect(ob.x, ob.bottomY, 40, 480 - ob.bottomY);
        });

        // Player Plane
        const px = 50;
        const py = g.y;
        ctx.fillStyle = '#FFEC27';
        ctx.beginPath();
        ctx.moveTo(px + 10, py);
        ctx.lineTo(px - 10, py - 8);
        ctx.lineTo(px - 10, py + 8);
        ctx.fill();
        ctx.stroke();
    };

    const handleStartPress = () => { isPressing.current = true; };
    const handleEndPress = () => { isPressing.current = false; };

    return (
        <div
            style={{ position: 'relative', width: '100%', height: '100%' }}
            onMouseDown={handleStartPress}
            onMouseUp={handleEndPress}
            onMouseLeave={handleEndPress}
            onTouchStart={handleStartPress}
            onTouchEnd={handleEndPress}
        >
            <div style={{ position: 'absolute', top: 5, right: 10, color: 'white', zIndex: 10 }}>Score: {uiState.score}</div>

            <GameCanvas width={320} height={480} onUpdate={handleUpdate} onDraw={handleDraw} />

            <div style={{ position: 'absolute', bottom: 20, width: '100%', textAlign: 'center', color: 'white', opacity: 0.8, pointerEvents: 'none' }}>
                HOLD TO FLY UP
            </div>

            {uiState.state === 'gameover' && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.8)', color: 'white', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center'
                }}>
                    <h2>GAME OVER</h2>
                    <RetroButton onClick={() => window.location.reload()}>RETRY</RetroButton>
                    <br />
                    <RetroButton variant="secondary" onClick={() => navigate('/menu')}>EXIT</RetroButton>
                </div>
            )}
        </div>
    );
};
