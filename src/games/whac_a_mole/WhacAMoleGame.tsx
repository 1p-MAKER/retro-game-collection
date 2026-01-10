import React, { useEffect, useRef, useState } from 'react';
import { WhacAMoleLogic } from './WhacAMoleLogic';
import { soundManager } from '../../audio/SoundGenerator';
import { loadTransparentSprite } from '../../utils/imageProcessing';
import { RetroButton } from '../../components/ui/RetroButton';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/useGameStore';
import { GameCanvas } from '../../components/layout/GameCanvas';

export const WhacAMoleGame: React.FC<{ paused?: boolean }> = ({ paused }) => {
    const navigate = useNavigate();
    const { updateGameProgress } = useGameStore();
    const gameLogic = useRef<WhacAMoleLogic | null>(null);
    const [uiState, setUiState] = useState({ score: 0, state: 'paused', timeLeft: 30 });

    const moleSprite = useRef<HTMLImageElement | HTMLCanvasElement | null>(null);
    const bombSprite = useRef<HTMLImageElement | HTMLCanvasElement | null>(null);
    const holeSprite = useRef<HTMLImageElement | HTMLCanvasElement | null>(null);
    const bgSprite = useRef<HTMLImageElement | HTMLCanvasElement | null>(null);

    useEffect(() => {
        gameLogic.current = new WhacAMoleLogic(soundManager, 1);
        setUiState({ score: 0, state: 'playing', timeLeft: 30 });

        const load = async () => {
            moleSprite.current = await loadTransparentSprite('/sprites/mole_mole.png');
            bombSprite.current = await loadTransparentSprite('/sprites/mole_bomb.png');
            holeSprite.current = await loadTransparentSprite('/sprites/mole_hole.png');

            const bg = new Image();
            bg.src = '/sprites/mole_bg.png';
            bg.onload = () => bgSprite.current = bg;
        };
        load();

        return () => gameLogic.current?.cleanup();
    }, []);

    const handleUpdate = (deltaTime: number) => {
        if (!gameLogic.current) return;
        gameLogic.current.update(deltaTime);

        // Sync state
        if (gameLogic.current.score !== uiState.score ||
            gameLogic.current.gameState !== uiState.state ||
            gameLogic.current.timeLeft !== uiState.timeLeft) {

            setUiState({
                score: gameLogic.current.score,
                state: gameLogic.current.gameState,
                timeLeft: gameLogic.current.timeLeft
            });

            if (gameLogic.current.gameState === 'cleared') {
                setTimeout(() => {
                    if (gameLogic.current) {
                        const nextLevel = gameLogic.current.level + 1;
                        updateGameProgress('whac_a_mole', nextLevel, gameLogic.current.score);

                        const currentScore = gameLogic.current.score;
                        gameLogic.current.cleanup();
                        gameLogic.current = new WhacAMoleLogic(soundManager, nextLevel);
                        gameLogic.current.score = currentScore; // Inherit

                        setUiState(prev => ({ ...prev, timeLeft: 30, state: 'playing' })); // Reset time
                    }
                }, 2000);
            }
        }
    };

    const handleDraw = (ctx: CanvasRenderingContext2D) => {
        if (!gameLogic.current) return;
        const g = gameLogic.current;

        // Grass BG
        if (bgSprite.current) {
            ctx.drawImage(bgSprite.current, 0, 0, 320, 480);
        } else {
            ctx.fillStyle = '#00E436';
            ctx.fillRect(0, 0, 320, 480);
        }

        // Holes
        const COLS = 3;
        const SIZE = 80;
        const GAP = 20;
        const START_X = (320 - (COLS * SIZE + (COLS - 1) * GAP)) / 2;
        const START_Y = 120;

        g.moles.forEach((m, i) => {
            const col = i % COLS;
            const row = Math.floor(i / COLS);
            const x = START_X + col * (SIZE + GAP);
            const y = START_Y + row * (SIZE + GAP);

            // Hole
            if (holeSprite.current) {
                // Draw hole slightly flattened or as is. Sprite is oval checked
                ctx.drawImage(holeSprite.current, x, y + SIZE / 2, SIZE, SIZE / 2);
            } else {
                ctx.fillStyle = '#1D2B53';
                ctx.beginPath();
                ctx.ellipse(x + SIZE / 2, y + SIZE - 10, SIZE / 2 - 5, SIZE / 4, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            if (['up', 'hit', 'miss'].includes(m.state)) {
                const isBomb = m.type === 'bomb';

                let sprite = isBomb ? bombSprite.current : moleSprite.current;

                if (sprite) {
                    // Animate pop up? For now just draw
                    // Center sprite in hole
                    const sW = SIZE;
                    const sH = SIZE;
                    // Offset Y based on state if we want animation, but logic handles 'up' state.
                    // We can just draw immediately above hole center
                    ctx.drawImage(sprite, x, y, sW, sH);
                } else {
                    const color = isBomb ? '#FF004D' : '#AB5236';
                    // Mole/Bomb Body
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(x + SIZE / 2, y + SIZE / 2 + 10, 30, Math.PI, 0); // Semicircleish
                    ctx.lineTo(x + SIZE / 2 + 30, y + SIZE / 2 + 30);
                    ctx.lineTo(x + SIZE / 2 - 30, y + SIZE / 2 + 30);
                    ctx.fill();

                    // Eyes (only simple fallback)
                    ctx.fillStyle = '#FFF';
                    ctx.fillRect(x + SIZE / 2 - 15, y + SIZE / 2, 10, 10);
                    ctx.fillRect(x + SIZE / 2 + 5, y + SIZE / 2, 10, 10);
                }

                // Feedback
                if (m.state === 'hit') {
                    ctx.fillStyle = '#FFCCAA';
                    ctx.font = '30px "Pico8"';
                    ctx.textAlign = 'center';
                    ctx.fillText('HIT!', x + SIZE / 2, y);
                } else if (m.state === 'miss') {
                    if (isBomb && m.state === 'miss') {
                        ctx.fillStyle = '#000';
                        ctx.fillText('OUCH!', x + SIZE / 2, y);
                    }
                }
            }
        });
    };

    const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
        if (!gameLogic.current || paused) return;
        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        const rect = (e.target as HTMLElement).getBoundingClientRect();
        const scaleX = 320 / rect.width;
        const scaleY = 480 / rect.height;
        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;

        const COLS = 3;
        const SIZE = 80;
        const GAP = 20;
        const START_X = (320 - (COLS * SIZE + (COLS - 1) * GAP)) / 2;
        const START_Y = 120;

        gameLogic.current.moles.forEach((_, i) => {
            const col = i % COLS;
            const row = Math.floor(i / COLS);
            const cx = START_X + col * (SIZE + GAP);
            const cy = START_Y + row * (SIZE + GAP);

            if (x >= cx && x <= cx + SIZE && y >= cy && y <= cy + SIZE) {
                gameLogic.current?.hit(i);
            }
        });
    };

    return (
        <div
            style={{ position: 'relative', width: '100%', height: '100%' }}
            onMouseDown={handleClick}
            onTouchStart={handleClick}
        >
            <div style={{ position: 'absolute', top: 10, left: 10, color: 'white', zIndex: 10, fontFamily: 'monospace', pointerEvents: 'none' }}>
                Time: {uiState.timeLeft}  Score: {uiState.score}
            </div>

            <GameCanvas width={320} height={480} onUpdate={handleUpdate} onDraw={handleDraw} paused={paused} />

            {(uiState.state === 'gameover' || uiState.state === 'cleared') && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.8)', color: 'white', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center'
                }}>
                    <h2>{uiState.state === 'cleared' ? 'CLEARED!' : 'GAME OVER'}</h2>
                    <RetroButton onClick={() => window.location.reload()}>もういちど</RetroButton>
                    <br />
                    <RetroButton variant="secondary" onClick={() => navigate('/menu')}>やめる</RetroButton>
                </div>
            )}
        </div>
    );
};
