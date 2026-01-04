import React, { useEffect, useRef, useState } from 'react';
import { GameCanvas } from '../../components/layout/GameCanvas';
import { SpaceDefenderLogic } from './SpaceDefenderLogic';
import { soundManager } from '../../audio/SoundGenerator';
import { RetroButton } from '../../components/ui/RetroButton';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/useGameStore';

export const SpaceDefenderGame: React.FC<{ paused?: boolean }> = ({ paused }) => {
    const navigate = useNavigate();
    const { updateGameProgress } = useGameStore();
    const gameLogic = useRef<SpaceDefenderLogic | null>(null);
    const [uiState, setUiState] = useState({ score: 0, state: 'paused' });

    const shipSprite = useRef<HTMLImageElement | null>(null);
    const alienSprite = useRef<HTMLImageElement | null>(null);

    useEffect(() => {
        gameLogic.current = new SpaceDefenderLogic(soundManager, 1);
        setUiState({ score: 0, state: 'paused' });

        const ship = new Image();
        ship.src = '/sprites/ship.png';
        ship.onload = () => shipSprite.current = ship;

        const alien = new Image();
        alien.src = '/sprites/alien.png';
        alien.onload = () => alienSprite.current = alien;
    }, []);

    const handleUpdate = (deltaTime: number) => {
        if (!gameLogic.current) return;
        gameLogic.current.update(deltaTime);

        if (gameLogic.current.score !== uiState.score || gameLogic.current.gameState !== uiState.state) {
            setUiState({
                score: gameLogic.current.score,
                state: gameLogic.current.gameState
            });

            if (gameLogic.current.gameState === 'cleared') {
                setTimeout(() => {
                    if (gameLogic.current) {
                        const nextLevel = gameLogic.current.level + 1;
                        updateGameProgress('space_defender', nextLevel, gameLogic.current.score);

                        // Restart with next level
                        const currentScore = gameLogic.current.score;
                        gameLogic.current = new SpaceDefenderLogic(soundManager, nextLevel);
                        gameLogic.current.score = currentScore;

                        setUiState(prev => ({ ...prev, state: 'paused' }));
                    }
                }, 2000);
            } else if (gameLogic.current.gameState === 'gameover') {
                updateGameProgress('space_defender', 1, gameLogic.current.score);
            }
        }
    };

    const handleDraw = (ctx: CanvasRenderingContext2D) => {
        if (!gameLogic.current) return;
        const g = gameLogic.current;

        // Space BG
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 320, 480);
        // Stars (Simple random points, fixed for now)
        ctx.fillStyle = '#5F574F';
        for (let i = 0; i < 20; i++) ctx.fillRect((i * 37) % 320, (i * 91) % 480, 2, 2);

        // Player Ship
        const sx = g.x;
        const sy = 420;
        if (shipSprite.current) {
            // Draw Sprite
            ctx.drawImage(shipSprite.current, sx - 20, sy - 20, 40, 40);
        } else {
            // Fallback
            ctx.fillStyle = '#29ADFF';
            ctx.beginPath();
            ctx.moveTo(sx, sy - 15);
            ctx.lineTo(sx - 15, sy + 10);
            ctx.lineTo(sx + 15, sy + 10);
            ctx.fill();
        }

        // Player Bullets
        g.bullets.forEach(b => {
            if (!b.active) return;
            ctx.fillStyle = '#FFEC27';
            ctx.fillRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);
        });

        // Enemies
        g.enemies.forEach(e => {
            if (!e.active) return;
            if (alienSprite.current) {
                ctx.drawImage(alienSprite.current, e.x - 12, e.y - 12, 24, 24);
            } else {
                ctx.fillStyle = '#FF004D';
                // Invader shape placeholder
                ctx.fillRect(e.x - 10, e.y - 10, 20, 20);
                ctx.fillStyle = '#FFF';
                ctx.fillRect(e.x - 5, e.y - 5, 4, 4);
                ctx.fillRect(e.x + 1, e.y - 5, 4, 4);
            }
        });

        // Enemy Bullets
        ctx.fillStyle = '#FF77A8';
        g.enemyBullets.forEach(b => {
            if (b.active) ctx.fillRect(b.x - 2, b.y - 4, 4, 8);
        });

        // Charge Indicator
        if (g.isCharging) {
            const chargeTime = Date.now() - g.chargeStart;
            const power = Math.min(chargeTime / 1000, 1);
            ctx.fillStyle = power >= 1 ? '#FFEC27' : '#29ADFF';
            ctx.fillRect(sx - 15, sy + 20, 30 * power, 4);
        }
    };

    const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
        if (!gameLogic.current) return;
        let clientX;
        if ('touches' in e) clientX = e.touches[0].clientX;
        else clientX = (e as React.MouseEvent).clientX;

        // Map screen X to canvas X (simplified)
        // Better:
        const x = (clientX / window.innerWidth) * 320;
        gameLogic.current.setX(x);
    };

    return (
        <div
            style={{ position: 'relative', width: '100%', height: '100%' }}
            onTouchStart={(e) => {
                if (paused) return;
                gameLogic.current?.startCharge();
                handleTouchMove(e);
            }}
            onTouchEnd={() => {
                if (paused) return;
                gameLogic.current?.releaseCharge();
            }}
            onTouchMove={handleTouchMove}
            onMouseDown={(e) => {
                if (paused) return;
                gameLogic.current?.startCharge();
                handleTouchMove(e);
            }}
            onMouseUp={() => {
                if (paused) return;
                gameLogic.current?.releaseCharge();
            }}
            onMouseMove={(e) => {
                if (!paused && e.buttons === 1) handleTouchMove(e);
            }}
        >
            <div style={{ position: 'absolute', top: 10, left: 10, color: 'white', zIndex: 10, fontFamily: 'monospace' }}>Score: {uiState.score}</div>

            <GameCanvas width={320} height={480} onUpdate={handleUpdate} onDraw={handleDraw} paused={paused} />

            {/* HUD */}
            <div style={{ position: 'absolute', bottom: 10, left: 10, color: 'white', opacity: 0.7, pointerEvents: 'none' }}>
                DRAG TO MOVE / RELEASE TO SHOOT
            </div>

            {(uiState.state === 'gameover' || uiState.state === 'cleared') && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.8)', color: 'white', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center'
                }}>
                    <h2>{uiState.state === 'cleared' ? 'WAVE CLEARED!' : 'GAME OVER'}</h2>
                    {uiState.state === 'gameover' && <RetroButton onClick={() => window.location.reload()}>RETRY</RetroButton>}
                    <br />
                    <RetroButton variant="secondary" onClick={() => navigate('/menu')}>EXIT</RetroButton>
                </div>
            )}
        </div>
    );
};
