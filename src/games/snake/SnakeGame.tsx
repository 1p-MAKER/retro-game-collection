import React, { useEffect, useRef, useState } from 'react';
import { GameCanvas } from '../../components/layout/GameCanvas';
import { SnakeLogic, type Direction } from './SnakeLogic';
import { soundManager } from '../../audio/SoundGenerator';
import { RetroButton } from '../../components/ui/RetroButton';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/useGameStore';

export const SnakeGame: React.FC<{ paused?: boolean }> = ({ paused }) => {
    const navigate = useNavigate();
    const { updateGameProgress } = useGameStore();
    const gameLogic = useRef<SnakeLogic | null>(null);
    const [uiState, setUiState] = useState({ score: 0, state: 'paused', level: 1 });

    useEffect(() => {
        gameLogic.current = new SnakeLogic(soundManager, 1);
        setUiState({ score: 0, state: 'paused', level: 1 });

        const handleKeyDown = (e: KeyboardEvent) => {
            if (!gameLogic.current || paused) return;
            switch (e.key) {
                case 'ArrowUp': gameLogic.current.setDirection('UP'); break;
                case 'ArrowDown': gameLogic.current.setDirection('DOWN'); break;
                case 'ArrowLeft': gameLogic.current.setDirection('LEFT'); break;
                case 'ArrowRight': gameLogic.current.setDirection('RIGHT'); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [paused]);

    const handleUpdate = (deltaTime: number) => {
        if (!gameLogic.current) return;
        gameLogic.current.update(deltaTime);

        if (gameLogic.current.score !== uiState.score || gameLogic.current.gameState !== uiState.state) {
            setUiState({
                score: gameLogic.current.score,
                state: gameLogic.current.gameState,
                level: gameLogic.current.level
            });

            if (gameLogic.current.gameState === 'cleared') {
                setTimeout(() => {
                    if (gameLogic.current) {
                        const nextLevel = gameLogic.current.level + 1;
                        updateGameProgress('snake', nextLevel, gameLogic.current.score);
                        gameLogic.current = new SnakeLogic(soundManager, nextLevel);
                        gameLogic.current.score = uiState.score; // Inherit score
                        setUiState(prev => ({ ...prev, level: nextLevel, state: 'paused' }));
                    }
                }, 2000);
            } else if (gameLogic.current.gameState === 'gameover') {
                updateGameProgress('snake', gameLogic.current.level, gameLogic.current.score);
            }
        }
    };

    const handleDraw = (ctx: CanvasRenderingContext2D) => {
        if (!gameLogic.current) return;
        const g = gameLogic.current;

        // BG
        ctx.fillStyle = '#1D2B53';
        ctx.fillRect(0, 0, 320, 480);

        const CELL = 20;

        // Walls
        ctx.fillStyle = '#AB5236';
        g['walls'].forEach(w => { // Access private/protected via bracket if needed or make public
            ctx.fillRect(w.x * CELL, w.y * CELL, CELL, CELL);
            // Brick pattern detail
            ctx.strokeStyle = '#000';
            ctx.strokeRect(w.x * CELL, w.y * CELL, CELL, CELL);
        });

        // Food
        ctx.fillStyle = '#FF004D';
        ctx.beginPath();
        ctx.arc(g.food.x * CELL + CELL / 2, g.food.y * CELL + CELL / 2, CELL / 3, 0, Math.PI * 2);
        ctx.fill();

        // Snake
        g.snake.forEach((s, i) => {
            ctx.fillStyle = i === 0 ? '#00E436' : '#008751';
            ctx.fillRect(s.x * CELL, s.y * CELL, CELL, CELL);
            if (i === 0) {
                // Eyes
                ctx.fillStyle = '#000';
                ctx.fillRect(s.x * CELL + 4, s.y * CELL + 4, 2, 2);
                ctx.fillRect(s.x * CELL + 14, s.y * CELL + 4, 2, 2);
            }
        });
    };

    const handleDir = (d: Direction) => {
        if (paused) return;
        gameLogic.current?.setDirection(d);
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <div style={{ position: 'absolute', top: 10, left: 10, color: 'white', zIndex: 10, fontFamily: 'monospace' }}>Score: {uiState.score} LV: {uiState.level}</div>

            <GameCanvas width={320} height={480} onUpdate={handleUpdate} onDraw={handleDraw} paused={paused} />

            {/* D-Pad Overlay for Mobile */}
            <div style={{
                position: 'absolute', bottom: 20, left: 20,
                display: 'grid', gridTemplateColumns: 'repeat(3, 50px)', gridTemplateRows: 'repeat(2, 50px)',
                gap: '5px', opacity: 0.7
            }}>
                <div />
                <RetroButton size="sm" onClick={() => handleDir('UP')}>▲</RetroButton>
                <div />
                <RetroButton size="sm" onClick={() => handleDir('LEFT')}>◀</RetroButton>
                <RetroButton size="sm" onClick={() => handleDir('DOWN')}>▼</RetroButton>
                <RetroButton size="sm" onClick={() => handleDir('RIGHT')}>▶</RetroButton>
            </div>

            {(uiState.state === 'gameover' || uiState.state === 'cleared') && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.8)', color: 'white', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center'
                }}>
                    <h2>{uiState.state === 'cleared' ? 'NEXT STAGE!' : 'GAME OVER'}</h2>
                    {uiState.state === 'gameover' && <RetroButton onClick={() => window.location.reload()}>RETRY</RetroButton>}
                    <br />
                    <RetroButton variant="secondary" onClick={() => navigate('/menu')}>EXIT</RetroButton>
                </div>
            )}
        </div>
    );
};
