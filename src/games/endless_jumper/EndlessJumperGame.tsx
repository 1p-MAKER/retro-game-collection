import React, { useEffect, useRef, useState } from 'react';
import { GameCanvas } from '../../components/layout/GameCanvas';
import { EndlessJumperLogic } from './EndlessJumperLogic';
import { soundManager } from '../../audio/SoundGenerator';
import { RetroButton } from '../../components/ui/RetroButton';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/useGameStore';

export const EndlessJumperGame: React.FC<{ paused?: boolean }> = ({ paused }) => {
    const navigate = useNavigate();
    const { updateGameProgress } = useGameStore();
    const gameLogic = useRef<EndlessJumperLogic | null>(null);
    const [uiState, setUiState] = useState({ score: 0, state: 'paused' });
    const moveDir = useRef<'LEFT' | 'RIGHT' | null>(null);

    const jumperSprite = useRef<HTMLImageElement | null>(null);

    useEffect(() => {
        gameLogic.current = new EndlessJumperLogic(soundManager);
        setUiState({ score: 0, state: 'paused' });

        const jumper = new Image();
        jumper.src = '/sprites/jumper.png';
        jumper.onload = () => jumperSprite.current = jumper;
    }, []);

    const handleUpdate = (deltaTime: number) => {
        if (!gameLogic.current) return;

        if (moveDir.current === 'LEFT') gameLogic.current.moveLeft();
        if (moveDir.current === 'RIGHT') gameLogic.current.moveRight();

        gameLogic.current.update(deltaTime);

        if (gameLogic.current.score !== uiState.score || gameLogic.current.gameState !== uiState.state) {
            setUiState({
                score: gameLogic.current.score,
                state: gameLogic.current.gameState
            });

            if (gameLogic.current.gameState === 'gameover') {
                updateGameProgress('endless_jumper', 1, gameLogic.current.score);
            }
        }
    };

    const handleDraw = (ctx: CanvasRenderingContext2D) => {
        if (!gameLogic.current) return;
        const g = gameLogic.current;

        // Sky BG
        ctx.fillStyle = '#83769C';
        ctx.fillRect(0, 0, 320, 480);

        ctx.save();
        ctx.translate(0, -g.cameraY);

        // Platforms
        ctx.fillStyle = '#FFCCAA';
        g.platforms.forEach(p => {
            ctx.fillRect(p.x, p.y, p.w, 10);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(p.x, p.y, p.w, 10);
        });

        // Player
        if (jumperSprite.current) {
            ctx.drawImage(jumperSprite.current, g.x - 12, g.y - 12, 24, 24);
        } else {
            ctx.fillStyle = '#00E436';
            ctx.fillRect(g.x - 10, g.y - 10, 20, 20);
            // Face
            ctx.fillStyle = '#000';
            ctx.fillRect(g.x - 4, g.y - 4, 3, 3);
            ctx.fillRect(g.x + 2, g.y - 4, 3, 3);
        }

        ctx.restore();
    };

    const handleTouch = (e: React.TouchEvent | React.MouseEvent) => {
        if (paused) return;
        let clientX;
        if ('touches' in e) clientX = e.touches[0].clientX;
        else clientX = (e as React.MouseEvent).clientX;

        const width = window.innerWidth;
        if (clientX < width / 2) moveDir.current = 'LEFT';
        else moveDir.current = 'RIGHT';
    };

    const handleStop = () => { moveDir.current = null; };

    return (
        <div
            style={{ position: 'relative', width: '100%', height: '100%' }}
            onMouseDown={handleTouch}
            onMouseUp={handleStop}
            onMouseLeave={handleStop}
            onTouchStart={handleTouch}
            onTouchEnd={handleStop}
        >
            <div style={{ position: 'absolute', top: 10, left: 10, color: 'white', zIndex: 10, fontFamily: 'monospace' }}>Score: {uiState.score}</div>

            <GameCanvas width={320} height={480} onUpdate={handleUpdate} onDraw={handleDraw} paused={paused} />

            <div style={{ position: 'absolute', bottom: 20, width: '100%', display: 'flex', justifyContent: 'space-between', padding: '0 20px', pointerEvents: 'none', opacity: 0.5 }}>
                <span style={{ color: 'white', fontSize: '2rem' }}>◀ なが押し</span>
                <span style={{ color: 'white', fontSize: '2rem' }}>なが押し ▶</span>
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
