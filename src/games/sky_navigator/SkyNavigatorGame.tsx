import React, { useEffect, useRef, useState } from 'react';
import { GameCanvas } from '../../components/layout/GameCanvas';
import { SkyNavigatorLogic } from './SkyNavigatorLogic';
import { soundManager } from '../../audio/SoundGenerator';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/useGameStore';
import { RankingDisplay } from '../../components/ui/RankingDisplay';

export const SkyNavigatorGame: React.FC<{ paused?: boolean }> = ({ paused }) => {
    const navigate = useNavigate();
    const { } = useGameStore();
    const gameLogic = useRef<SkyNavigatorLogic | null>(null);
    const [uiState, setUiState] = useState({ score: 0, state: 'paused' });
    const isPressing = useRef(false);

    useEffect(() => {
        gameLogic.current = new SkyNavigatorLogic(soundManager);
        setUiState({ score: 0, state: 'paused' });
    }, []);

    const handleUpdate = (deltaTime: number) => {
        if (!gameLogic.current) return;

        if (isPressing.current && !paused) {
            gameLogic.current.thrust();
        }

        gameLogic.current.update(deltaTime);

        if (gameLogic.current.score !== uiState.score || gameLogic.current.gameState !== uiState.state) {
            setUiState({
                score: gameLogic.current.score,
                state: gameLogic.current.gameState
            });

            // Logic class handles death; Game component handles high score submission via RankingDisplay
            // We just need to ensure we don't double-submit or anything, but RankingDisplay handles input
        }
    };

    const handleDraw = (ctx: CanvasRenderingContext2D) => {
        if (!gameLogic.current) return;
        const g = gameLogic.current;

        // 洞窟背景（暗め）
        ctx.fillStyle = '#2c2c3e';
        ctx.fillRect(0, 0, 320, 480);

        // 地形（茶色の岩）
        ctx.fillStyle = '#8B5E3C';
        ctx.strokeStyle = '#5D4037';

        // Draw ceiling and floor polygons
        // Optimization: draw connected polygon for better visual

        // Ceiling
        ctx.beginPath();
        ctx.moveTo(0, 0);
        g.terrain.forEach(t => {
            ctx.lineTo(t.x, t.topH);
        });
        ctx.lineTo(320, 0);
        ctx.fill();
        ctx.stroke();

        // Floor
        ctx.beginPath();
        ctx.moveTo(0, 480);
        g.terrain.forEach(t => {
            ctx.lineTo(t.x, t.bottomY);
        });
        ctx.lineTo(320, 480);
        ctx.fill();
        ctx.stroke();

        // Player Ship
        const px = 50;
        const py = g.y;
        ctx.fillStyle = '#FF004D';
        ctx.beginPath();
        ctx.moveTo(px + 10, py);
        ctx.lineTo(px - 10, py - 6);
        ctx.lineTo(px - 10, py + 6);
        ctx.fill();

        // Engine flame
        if (isPressing.current && !paused) {
            ctx.fillStyle = '#FFEC27';
            ctx.beginPath();
            ctx.moveTo(px - 10, py);
            ctx.lineTo(px - 20, py - 4);
            ctx.lineTo(px - 20, py + 4);
            ctx.fill();
        }
    };

    const handleStartPress = () => { if (!paused) isPressing.current = true; };
    const handleEndPress = () => { isPressing.current = false; };

    return (
        <div
            style={{ position: 'relative', width: '100%', height: '100%' }}
            onMouseDown={handleStartPress}
            onMouseUp={handleEndPress}
            onMouseLeave={handleEndPress}
            onTouchStart={handleStartPress}
            onTouchEnd={handleEndPress}
        >
            <div style={{ position: 'absolute', top: 10, left: 10, color: 'white', zIndex: 10, fontFamily: 'monospace' }}>Score: {uiState.score}</div>

            <GameCanvas width={320} height={480} onUpdate={handleUpdate} onDraw={handleDraw} paused={paused} />

            <div style={{ position: 'absolute', bottom: 20, width: '100%', textAlign: 'center', color: '#83769C', opacity: 0.8, pointerEvents: 'none', fontFamily: '"Pico8", sans-serif' }}>
                おしてとぶ
            </div>

            {uiState.state === 'gameover' && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.85)', color: 'white', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', zIndex: 100
                }}>
                    <RankingDisplay
                        gameId="sky_navigator"
                        highlightScore={uiState.score}
                        inputScore={uiState.score} // Always offer input for simplicity or check if highscore
                        onScoreSubmitted={() => { }}
                        onRetry={() => window.location.reload()}
                        onExit={() => navigate('/')}
                    />
                </div>
            )}
        </div>
    );
};
