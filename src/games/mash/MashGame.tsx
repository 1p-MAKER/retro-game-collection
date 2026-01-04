import React, { useEffect, useRef, useState } from 'react';
import { MashLogic } from './MashLogic';
import { soundManager } from '../../audio/SoundGenerator';
import { RetroButton } from '../../components/ui/RetroButton';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/useGameStore';
import { GameCanvas } from '../../components/layout/GameCanvas';

export const MashGame: React.FC<{ paused?: boolean }> = ({ paused }) => {
    const navigate = useNavigate();
    const { updateGameProgress } = useGameStore();
    const gameLogic = useRef<MashLogic | null>(null);
    const [uiState, setUiState] = useState({ count: 0, timeLeft: 10.0, state: 'ready' });

    useEffect(() => {
        gameLogic.current = new MashLogic(soundManager);
        setUiState({ count: 0, timeLeft: 10.0, state: 'ready' });
    }, []);

    const handleUpdate = (deltaTime: number) => {
        if (!gameLogic.current) return;
        gameLogic.current.update(deltaTime);

        if (gameLogic.current.count !== uiState.count ||
            gameLogic.current.gameState !== uiState.state ||
            Math.abs(gameLogic.current.timeLeft - uiState.timeLeft) > 0.1) {

            setUiState({
                count: gameLogic.current.count,
                state: gameLogic.current.gameState,
                timeLeft: gameLogic.current.timeLeft
            });

            if (gameLogic.current.gameState === 'gameover' && uiState.state !== 'gameover') {
                updateGameProgress('mash', 1, gameLogic.current.count);
            }
        }
    };

    const handleDraw = (ctx: CanvasRenderingContext2D) => {
        if (!gameLogic.current) return;

        ctx.fillStyle = '#FFA300';
        ctx.fillRect(0, 0, 320, 480);

        // Just visual effects like particles could be added here
        if (gameLogic.current.gameState === 'playing') {
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.2})`;
            ctx.fillRect(0, 0, 320, 480);
        }
    };

    const handleMash = () => {
        if (paused) return;
        if (uiState.state === 'ready') gameLogic.current?.start();
        gameLogic.current?.masher();
    };

    const getRank = (score: number) => {
        if (score > 130) return "S - GODLIKE";
        if (score > 100) return "A - AMAZING";
        if (score > 80) return "B - GREAT";
        if (score > 50) return "C - GOOD";
        return "D - TRY HARDER";
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <GameCanvas width={320} height={480} onUpdate={handleUpdate} onDraw={handleDraw} paused={paused} />

            <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 10, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '2rem', color: 'white', marginBottom: 20 }}>
                    TIME: {uiState.timeLeft.toFixed(1)}
                </div>

                <div style={{ fontSize: '4rem', color: '#FF004D', marginBottom: 40 }}>
                    {uiState.count}
                </div>

                {uiState.state !== 'gameover' ? (
                    <button
                        onMouseDown={handleMash}
                        onTouchStart={handleMash}
                        style={{
                            width: 200, height: 200, borderRadius: '50%',
                            backgroundColor: '#FF004D', border: '10px solid #FFF',
                            color: 'white', fontSize: '2rem', fontFamily: '"Pico8", sans-serif',
                            boxShadow: '0 10px 0 #7F002A'
                        }}
                    >
                        PUSH!
                    </button>
                ) : (
                    <div style={{ textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.8)', padding: 20, borderRadius: 10, color: 'white' }}>
                        <h2>FINISHED!</h2>
                        <p>SCORE: {uiState.count}</p>
                        <p>RANK: {getRank(uiState.count)}</p>
                        <RetroButton onClick={() => window.location.reload()}>RETRY</RetroButton>
                        <br />
                        <RetroButton variant="secondary" onClick={() => navigate('/menu')}>EXIT</RetroButton>
                    </div>
                )}
            </div>
        </div>
    );
};
