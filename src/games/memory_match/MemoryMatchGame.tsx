import React, { useEffect, useRef, useState } from 'react';
import { MemoryMatchLogic } from './MemoryMatchLogic';
import { soundManager } from '../../audio/SoundGenerator';
import { RetroButton } from '../../components/ui/RetroButton';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/useGameStore';
import { GameCanvas } from '../../components/layout/GameCanvas'; // Using for consistency, though DOM might be easier? No, stick to Canvas for retro feel or strict timing?
// Actually DOM is easier for flip animations but Canvas is good for unified game loop.
// Let's use Canvas for consistency with other games.

export const MemoryMatchGame: React.FC = () => {
    const navigate = useNavigate();
    const { updateGameProgress } = useGameStore();
    const gameLogic = useRef<MemoryMatchLogic | null>(null);
    const [uiState, setUiState] = useState({ score: 0, state: 'paused', timeLeft: 60, level: 1 });

    useEffect(() => {
        gameLogic.current = new MemoryMatchLogic(soundManager, 1);
        setUiState({ score: 0, state: 'playing', timeLeft: 60, level: 1 });
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
                timeLeft: gameLogic.current.timeLeft,
                level: gameLogic.current.level
            });

            if (gameLogic.current.gameState === 'cleared') {
                // Auto next level stub
                setTimeout(() => {
                    if (gameLogic.current) {
                        const nextLevel = gameLogic.current.level + 1;
                        updateGameProgress('memorycmatch', nextLevel, gameLogic.current.score);
                        gameLogic.current = new MemoryMatchLogic(soundManager, nextLevel);
                        gameLogic.current.score = uiState.score; // Keep score
                    }
                }, 2000);
            } else if (gameLogic.current.gameState === 'gameover') {
                updateGameProgress('memorycmatch', gameLogic.current.level, gameLogic.current.score);
            }
        }
    };

    const handleDraw = (ctx: CanvasRenderingContext2D) => {
        if (!gameLogic.current) return;
        const g = gameLogic.current;

        // BG
        ctx.fillStyle = '#FFCCAA';
        ctx.fillRect(0, 0, 320, 480);

        // Grid
        // 4 cols. Width 320. 
        // 4x3 => rows start somewhat center.
        const COLS = 4;
        const SIZE = 60;
        const GAP = 10;
        const STARTcX = (320 - (COLS * SIZE + (COLS - 1) * GAP)) / 2;
        const STARTcY = 120;

        g.cards.forEach((c, i) => {
            const col = i % COLS;
            const row = Math.floor(i / COLS);
            const x = STARTcX + col * (SIZE + GAP);
            const y = STARTcY + row * (SIZE + GAP);

            if (c.flipped || c.matched) {
                // Front
                ctx.fillStyle = '#FFF1E8';
                ctx.fillRect(x, y, SIZE, SIZE);
                // Icon/Pattern based on value
                ctx.fillStyle = ['#FF004D', '#FFA300', '#FFEC27', '#00E436', '#29ADFF', '#83769C', '#FF77A8', '#000'][c.value];
                ctx.beginPath();
                // Simple shapes
                if (c.value === 0) ctx.arc(x + SIZE / 2, y + SIZE / 2, 20, 0, Math.PI * 2);
                else if (c.value === 1) ctx.fillRect(x + 15, y + 15, 30, 30);
                else {
                    // Number fallback
                    ctx.font = '30px "Pico8"';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(c.value.toString(), x + SIZE / 2, y + SIZE / 2);
                }
                ctx.fill();
            } else {
                // Back
                ctx.fillStyle = '#1D2B53';
                ctx.fillRect(x, y, SIZE, SIZE);
                ctx.fillStyle = '#000';
                ctx.font = '20px "Pico8"';
                ctx.fillText("?", x + SIZE / 2 - 5, y + SIZE / 2 + 5); // Rough centering
            }
        });
    };

    const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
        if (!gameLogic.current) return;
        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        // Map coords
        // Assume canvas is full width/height relative to window for now
        // But better to use simple scaling based on 320x480 ratio
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        const scaleX = 320 / rect.width;
        const scaleY = 480 / rect.height;
        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;

        // Hit test
        const COLS = 4;
        const SIZE = 60;
        const GAP = 10;
        const STARTcX = (320 - (COLS * SIZE + (COLS - 1) * GAP)) / 2;
        const STARTcY = 120;

        gameLogic.current.cards.forEach((_, i) => {
            const col = i % COLS;
            const row = Math.floor(i / COLS);
            const cx = STARTcX + col * (SIZE + GAP);
            const cy = STARTcY + row * (SIZE + GAP);

            if (x >= cx && x <= cx + SIZE && y >= cy && y <= cy + SIZE) {
                gameLogic.current?.flipCard(i);
            }
        });
    };

    return (
        <div
            style={{ position: 'relative', width: '100%', height: '100%' }}
            onMouseDown={handleClick}
            onTouchStart={handleClick}
        >
            <div style={{ position: 'absolute', top: 5, right: 10, color: 'white', zIndex: 10 }}>Score: {uiState.score}</div>
            <div style={{ position: 'absolute', top: 5, left: 10, color: 'white', zIndex: 10 }}>Time: {uiState.timeLeft}</div>

            <GameCanvas width={320} height={480} onUpdate={handleUpdate} onDraw={handleDraw} />

            {(uiState.state === 'gameover' || uiState.state === 'cleared') && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.8)', color: 'white', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center'
                }}>
                    <h2>{uiState.state === 'cleared' ? 'CLEARED!' : 'GAME OVER'}</h2>
                    {uiState.state === 'gameover' && <RetroButton onClick={() => window.location.reload()}>RETRY</RetroButton>}
                    <br />
                    <RetroButton variant="secondary" onClick={() => navigate('/menu')}>EXIT</RetroButton>
                </div>
            )}
        </div>
    );
};
