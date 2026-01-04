import React, { useEffect, useRef, useState } from 'react';
import { WhacAMoleLogic } from './WhacAMoleLogic';
import { soundManager } from '../../audio/SoundGenerator';
import { RetroButton } from '../../components/ui/RetroButton';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/useGameStore';
import { GameCanvas } from '../../components/layout/GameCanvas';

export const WhacAMoleGame: React.FC<{ paused?: boolean }> = ({ paused }) => {
    const navigate = useNavigate();
    const { } = useGameStore();
    const gameLogic = useRef<WhacAMoleLogic | null>(null);
    const [uiState, setUiState] = useState({ score: 0, state: 'paused', timeLeft: 30 });

    useEffect(() => {
        gameLogic.current = new WhacAMoleLogic(soundManager, 1);
        setUiState({ score: 0, state: 'playing', timeLeft: 30 });
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
                // Next level stub
            }
        }
    };

    const handleDraw = (ctx: CanvasRenderingContext2D) => {
        if (!gameLogic.current) return;
        const g = gameLogic.current;

        // Grass BG
        ctx.fillStyle = '#00E436';
        ctx.fillRect(0, 0, 320, 480);

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
            ctx.fillStyle = '#1D2B53';
            ctx.beginPath();
            ctx.ellipse(x + SIZE / 2, y + SIZE - 10, SIZE / 2 - 5, SIZE / 4, 0, 0, Math.PI * 2);
            ctx.fill();

            if (['up', 'hit', 'miss'].includes(m.state)) {
                const isBomb = m.type === 'bomb';
                const color = isBomb ? '#FF004D' : '#AB5236';

                // Mole/Bomb Body
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(x + SIZE / 2, y + SIZE / 2 + 10, 30, Math.PI, 0); // Semicircleish
                ctx.lineTo(x + SIZE / 2 + 30, y + SIZE / 2 + 30);
                ctx.lineTo(x + SIZE / 2 - 30, y + SIZE / 2 + 30);
                ctx.fill();

                // Eyes
                ctx.fillStyle = '#FFF';
                ctx.fillRect(x + SIZE / 2 - 15, y + SIZE / 2, 10, 10);
                ctx.fillRect(x + SIZE / 2 + 5, y + SIZE / 2, 10, 10);
                ctx.fillStyle = '#000';
                ctx.fillRect(x + SIZE / 2 - 12, y + SIZE / 2 + 3, 4, 4);
                ctx.fillRect(x + SIZE / 2 + 8, y + SIZE / 2 + 3, 4, 4);

                // Feedback
                if (m.state === 'hit') {
                    ctx.fillStyle = '#FFCCAA';
                    ctx.font = '30px "Pico8"';
                    ctx.textAlign = 'center';
                    ctx.fillText('HIT!', x + SIZE / 2, y);
                } else if (m.state === 'miss') {
                    // This logic is slightly weird in rendering, logic handles state
                    // If bomb hit -> miss visual
                    if (isBomb && m.state === 'miss') { // logic sets miss for bomb hit
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
                    <RetroButton onClick={() => window.location.reload()}>RETRY</RetroButton>
                    <br />
                    <RetroButton variant="secondary" onClick={() => navigate('/menu')}>EXIT</RetroButton>
                </div>
            )}
        </div>
    );
};
