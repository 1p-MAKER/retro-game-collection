import React, { useEffect, useRef, useState } from 'react';
import { CatchDropLogic } from './CatchDropLogic';
import { soundManager } from '../../audio/SoundGenerator';
import { RetroButton } from '../../components/ui/RetroButton';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/useGameStore';
import { GameCanvas } from '../../components/layout/GameCanvas';

export const CatchDropGame: React.FC = () => {
    const navigate = useNavigate();
    const { updateGameProgress } = useGameStore();
    const gameLogic = useRef<CatchDropLogic | null>(null);
    const [uiState, setUiState] = useState({ score: 0, state: 'paused' });

    useEffect(() => {
        gameLogic.current = new CatchDropLogic(soundManager, 1);
        setUiState({ score: 0, state: 'playing' });
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
                updateGameProgress('catch_drop', 1, gameLogic.current.score); // Level handling TBD
            }
        }
    };

    const handleDraw = (ctx: CanvasRenderingContext2D) => {
        if (!gameLogic.current) return;
        const g = gameLogic.current;

        // Sky BG
        ctx.fillStyle = '#29ADFF';
        ctx.fillRect(0, 0, 320, 480);

        // Bucket
        ctx.fillStyle = '#83769C';
        ctx.beginPath();
        const bx = g.x;
        const by = 400;
        ctx.moveTo(bx - 30, by - 20);
        ctx.lineTo(bx + 30, by - 20);
        ctx.lineTo(bx + 20, by + 20);
        ctx.lineTo(bx - 20, by + 20);
        ctx.fill();

        // Items
        g.items.forEach(item => {
            if (!item.active) return;
            if (item.type === 'bomb') {
                ctx.fillStyle = '#1D2B53';
                ctx.beginPath();
                ctx.arc(item.x, item.y, 15, 0, Math.PI * 2);
                ctx.fill();
                // Fuse
                ctx.strokeStyle = '#FFEC27';
                ctx.beginPath();
                ctx.moveTo(item.x, item.y - 15);
                ctx.lineTo(item.x + 5, item.y - 25);
                ctx.stroke();
            } else if (item.type === 'gem') {
                ctx.fillStyle = '#FFCCAA'; // Shine
                ctx.beginPath();
                ctx.moveTo(item.x, item.y - 15);
                ctx.lineTo(item.x + 15, item.y);
                ctx.lineTo(item.x, item.y + 15);
                ctx.lineTo(item.x - 15, item.y);
                ctx.fill();
            } else {
                // Apple
                ctx.fillStyle = '#FF004D';
                ctx.beginPath();
                ctx.arc(item.x, item.y, 15, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    };

    const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
        if (!gameLogic.current) return;
        let clientX;
        if ('touches' in e) clientX = e.touches[0].clientX;
        else clientX = (e as React.MouseEvent).clientX;

        // Map screen X to canvas X 
        const x = (clientX / window.innerWidth) * 320;
        gameLogic.current.setX(x);
    };

    return (
        <div
            style={{ position: 'relative', width: '100%', height: '100%' }}
            onTouchStart={handleTouchMove}
            onTouchMove={handleTouchMove}
            onMouseDown={handleTouchMove}
            onMouseMove={(e) => {
                if (e.buttons === 1) handleTouchMove(e);
            }}
        >
            <div style={{ position: 'absolute', top: 5, right: 10, color: 'white', zIndex: 10 }}>Score: {uiState.score}</div>

            <GameCanvas width={320} height={480} onUpdate={handleUpdate} onDraw={handleDraw} />

            {(uiState.state === 'gameover' || uiState.state === 'cleared') && (
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
