import React, { useEffect, useRef, useState } from 'react';
import { GameCanvas } from '../../components/layout/GameCanvas';
import { LaneRaceLogic } from './LaneRaceLogic';
import { soundManager } from '../../audio/SoundGenerator';
import { RetroButton } from '../../components/ui/RetroButton';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/useGameStore';

export const LaneRaceGame: React.FC<{ paused?: boolean }> = ({ paused }) => {
    const navigate = useNavigate();
    const { updateGameProgress } = useGameStore();
    const gameLogic = useRef<LaneRaceLogic | null>(null);
    const [uiState, setUiState] = useState({ score: 0, state: 'paused' });

    useEffect(() => {
        gameLogic.current = new LaneRaceLogic(soundManager, 1);
        setUiState({ score: 0, state: 'paused' });
    }, []);

    const handleUpdate = (deltaTime: number) => {
        if (!gameLogic.current) return;
        gameLogic.current.update(deltaTime);

        if (gameLogic.current.score !== uiState.score || gameLogic.current.gameState !== uiState.state) {
            setUiState({
                score: gameLogic.current.score,
                state: gameLogic.current.gameState
            });

            if (gameLogic.current.gameState === 'gameover') {
                updateGameProgress('lane_race', 1, gameLogic.current.score);
            }
        }
    };

    const handleDraw = (ctx: CanvasRenderingContext2D) => {
        if (!gameLogic.current) return;
        const g = gameLogic.current;

        // Grass BG
        ctx.fillStyle = '#008751';
        ctx.fillRect(0, 0, 320, 480);

        // Road
        ctx.fillStyle = '#5F574F';
        ctx.fillRect(40, 0, 240, 480);

        // Lines
        ctx.strokeStyle = '#FFF1E8';
        ctx.setLineDash([20, 20]);
        ctx.beginPath();
        ctx.moveTo(120, 0);
        ctx.lineTo(120, 480);
        ctx.moveTo(200, 0);
        ctx.lineTo(200, 480);
        ctx.stroke();
        ctx.setLineDash([]);

        // Car
        const carX = [80, 160, 240][g.lane];
        ctx.fillStyle = '#FF004D';
        ctx.fillRect(carX - 20, 380, 40, 60);
        // Headlights
        ctx.fillStyle = '#FFEC27';
        ctx.fillRect(carX - 15, 382, 10, 5);
        ctx.fillRect(carX + 5, 382, 10, 5);

        // Obstacles
        g.obstacles.forEach(ob => {
            const ox = [80, 160, 240][ob.lane];
            if (ob.type === 'rock') {
                ctx.fillStyle = '#C2C3C7'; // Stone
                ctx.beginPath();
                ctx.arc(ox, ob.y + 20, 18, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillStyle = '#1D2B53'; // Oil
                ctx.beginPath();
                ctx.ellipse(ox, ob.y + 20, 18, 10, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    };

    const handleTouch = (e: React.TouchEvent | React.MouseEvent) => {
        if (!gameLogic.current || paused) return;

        let clientX;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
        } else {
            clientX = (e as React.MouseEvent).clientX;
        }

        const width = window.innerWidth;
        if (clientX < width / 2) {
            gameLogic.current.moveLeft();
        } else {
            gameLogic.current.moveRight();
        }
    };

    return (
        <div
            style={{ position: 'relative', width: '100%', height: '100%' }}
            onMouseDown={handleTouch}
            onTouchStart={handleTouch}
        >
            <div style={{ position: 'absolute', top: 10, left: 10, color: 'white', zIndex: 10, fontFamily: 'monospace' }}>Score: {uiState.score}</div>

            <GameCanvas width={320} height={480} onUpdate={handleUpdate} onDraw={handleDraw} paused={paused} />

            <div style={{ position: 'absolute', bottom: 20, width: '100%', display: 'flex', justifyContent: 'space-between', padding: '0 20px', pointerEvents: 'none', opacity: 0.5 }}>
                <span style={{ color: 'white', fontSize: '2rem' }}>◀ おす</span>
                <span style={{ color: 'white', fontSize: '2rem' }}>おす ▶</span>
            </div>

            {uiState.state === 'gameover' && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.8)', color: 'white', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center'
                }}>
                    <h2>GAME OVER</h2>
                    <RetroButton onClick={() => window.location.reload()}>もういちど</RetroButton>
                    <br />
                    <RetroButton variant="secondary" onClick={() => navigate('/menu')}>やめる</RetroButton>
                </div>
            )}
        </div>
    );
};
