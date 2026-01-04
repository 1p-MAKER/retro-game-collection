import React, { useEffect, useRef, useState } from 'react';
import { GameCanvas } from '../../components/layout/GameCanvas';
import { BreakoutLogic } from './BreakoutLogic';
import { soundManager } from '../../audio/SoundGenerator';
import { RetroButton } from '../../components/ui/RetroButton';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/useGameStore';

export const BreakoutGame: React.FC<{ paused?: boolean }> = ({ paused }) => {
    const navigate = useNavigate();
    const { updateGameProgress } = useGameStore();
    const gameLogic = useRef<BreakoutLogic | null>(null);
    // Forces re-render for UI updates (score, lives) - not for 60fps canvas
    const [uiState, setUiState] = useState({ score: 0, lives: 3, level: 1, state: 'paused' });

    useEffect(() => {
        // Init Logic
        gameLogic.current = new BreakoutLogic(soundManager, 1);
        setUiState({
            score: gameLogic.current.score,
            lives: gameLogic.current.lives,
            level: gameLogic.current.level,
            state: gameLogic.current.gameState
        });
    }, []);

    const handleUpdate = (deltaTime: number) => {
        if (!gameLogic.current) return;

        const prevState = gameLogic.current.gameState;

        gameLogic.current.update(deltaTime);

        // Sync UI roughly only when changes matter or throttled
        // For game over/clear, we need immediate React update
        if (gameLogic.current.gameState !== prevState) {
            setUiState({
                score: gameLogic.current.score,
                lives: gameLogic.current.lives,
                level: gameLogic.current.level,
                state: gameLogic.current.gameState // Cast logic state string to any if needed or match types
            } as any);

            if (gameLogic.current.gameState === 'cleared') {
                // Auto progress after delay?
                setTimeout(() => {
                    if (gameLogic.current) {
                        const newLevel = gameLogic.current.level + 1;
                        updateGameProgress('breakout', newLevel, gameLogic.current.score);
                        // Reset for next level
                        gameLogic.current = new BreakoutLogic(soundManager, newLevel);
                        gameLogic.current.score = uiState.score; // Keep score
                        setUiState(prev => ({ ...prev, level: newLevel, state: 'paused' }));
                    }
                }, 2000);
            } else if (gameLogic.current.gameState === 'gameover') {
                updateGameProgress('breakout', gameLogic.current.level, gameLogic.current.score);
            }
        }
    };

    const handleDraw = (ctx: CanvasRenderingContext2D) => {
        if (!gameLogic.current) return;
        const game = gameLogic.current;

        // Background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 320, 480);

        // Paddle
        ctx.fillStyle = '#29ADFF';
        ctx.fillRect(game.paddle.x, 480 - 30, game.paddle.width, game.paddle.height);

        // Ball
        ctx.fillStyle = '#FFF1E8';
        ctx.beginPath();
        ctx.arc(game.ball.x, game.ball.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Blocks
        for (const block of game.blocks) {
            if (block.active) {
                ctx.fillStyle = block.color;
                ctx.fillRect(block.x, block.y, block.width, block.height);

                // Hard block indicator
                if (block.type === 'hard' && block.hp > 1) {
                    ctx.strokeStyle = '#000000';
                    ctx.strokeRect(block.x + 2, block.y + 2, block.width - 4, block.height - 4);
                }
            }
        }
    };

    const handleTouch = (e: React.TouchEvent | React.MouseEvent | TouchEvent) => {
        if (!gameLogic.current || paused) return;

        // Calculate X relative to canvas
        const canvas = e.currentTarget as HTMLCanvasElement;
        const rect = canvas.getBoundingClientRect();

        let clientX;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
        } else {
            clientX = (e as React.MouseEvent).clientX;
        }

        const scaleX = 320 / rect.width;
        const x = (clientX - rect.left) * scaleX;

        gameLogic.current.setPaddleX(x);
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {/* HUD Overlay */}
            <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', padding: '10px',
                display: 'flex', gap: '20px', color: 'white', pointerEvents: 'none',
                fontFamily: 'monospace', fontSize: '16px', textShadow: '1px 1px 0 #000'
            }}>
                <span>SCORE: {uiState.score}</span>
                <span>LV: {uiState.level}</span>
            </div>

            <div
                style={{ width: '100%', height: '100%' }}
                onTouchMove={handleTouch}
                onTouchStart={(e) => {
                    handleTouch(e);
                    if (!paused) gameLogic.current?.launch();
                }}
                onMouseDown={(e) => {
                    handleTouch(e);
                    if (!paused) gameLogic.current?.launch();
                }}
                onMouseMove={(e) => {
                    if (paused) return;
                    if (e.buttons === 1) handleTouch(e);
                }}
            >
                <GameCanvas
                    width={320} height={480}
                    onUpdate={handleUpdate}
                    onDraw={handleDraw}
                    paused={paused}
                />
            </div>

            {/* Lives Indicator */}
            <div style={{
                position: 'absolute', bottom: 10, left: 10,
                color: 'white', pointerEvents: 'none'
            }}>
                LIVES: {gameLogic.current?.lives}
            </div>

            {/* Game Over / Clear Screens */}
            {(uiState.state === 'gameover' || uiState.state === 'cleared') && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: '20px'
                }}>
                    <h2 style={{ color: uiState.state === 'cleared' ? '#00E436' : '#FF004D', fontSize: '2rem' }}>
                        {uiState.state === 'cleared' ? 'STAGE CLEAR!' : 'GAME OVER'}
                    </h2>
                    {uiState.state === 'gameover' && (
                        <RetroButton onClick={() => window.location.reload()}>RETRY</RetroButton>
                    )}
                    <RetroButton variant="secondary" onClick={() => navigate('/menu')}>EXIT</RetroButton>
                </div>
            )}
        </div>
    );
};
