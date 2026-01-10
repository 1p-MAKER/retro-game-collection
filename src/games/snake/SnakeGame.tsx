import React, { useEffect, useRef, useState } from 'react';
import { GameCanvas } from '../../components/layout/GameCanvas';
import { RetroFrame } from '../../components/layout/RetroFrame';
import { SnakeLogic } from './SnakeLogic';
import { soundManager } from '../../audio/SoundGenerator';
import { loadTransparentSprite } from '../../utils/imageProcessing';
import { RetroButton } from '../../components/ui/RetroButton';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/useGameStore';

export const SnakeGame: React.FC<{ paused?: boolean }> = ({ paused }) => {
    const navigate = useNavigate();
    const { updateGameProgress } = useGameStore();
    const gameLogic = useRef<SnakeLogic | null>(null);
    const [uiState, setUiState] = useState({ score: 0, state: 'paused', level: 1 });

    const headSprite = useRef<HTMLImageElement | HTMLCanvasElement | null>(null);
    const bodySprite = useRef<HTMLImageElement | HTMLCanvasElement | null>(null);
    const foodSprite = useRef<HTMLImageElement | HTMLCanvasElement | null>(null);
    const bgSprite = useRef<HTMLImageElement | HTMLCanvasElement | null>(null);

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
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [paused]);

    useEffect(() => {
        const load = async () => {
            headSprite.current = await loadTransparentSprite('/sprites/snake_head.png');
            bodySprite.current = await loadTransparentSprite('/sprites/snake_body.png');
            foodSprite.current = await loadTransparentSprite('/sprites/snake_food.png');

            const bg = new Image();
            bg.src = '/sprites/snake_bg.png';
            bg.onload = () => bgSprite.current = bg;
        };
        load();
    }, []);

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

        // 背景（砂色）
        ctx.fillStyle = '#E6D7AA';
        ctx.fillRect(0, 0, 320, 480);

        // グリッド線
        ctx.strokeStyle = '#D4C89A';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 8; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 40, 0);
            ctx.lineTo(i * 40, 480);
            ctx.stroke();
        }
        for (let i = 0; i <= 12; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * 40);
            ctx.lineTo(320, i * 40);
            ctx.stroke();
        }

        const CELL = 40;

        // Walls
        ctx.fillStyle = '#AB5236';
        g['walls'].forEach(w => {
            // Can add wall texture later if needed
            ctx.fillRect(w.x * CELL, w.y * CELL, CELL, CELL);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(w.x * CELL, w.y * CELL, CELL, CELL);
        });

        // Food
        if (foodSprite.current) {
            ctx.drawImage(foodSprite.current, g.food.x * CELL, g.food.y * CELL, CELL, CELL);
        } else {
            ctx.fillStyle = '#FF004D';
            ctx.beginPath();
            ctx.arc(g.food.x * CELL + CELL / 2, g.food.y * CELL + CELL / 2, CELL / 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Snake
        g.snake.forEach((s, i) => {
            if (i === 0 && headSprite.current) {
                // Head
                ctx.save();
                ctx.translate(s.x * CELL + CELL / 2, s.y * CELL + CELL / 2);
                // Rotate based on direction
                // Rotate based on direction
                let angle = 0;
                if (g.direction === 'UP') angle = 180;
                if (g.direction === 'DOWN') angle = 0;
                if (g.direction === 'LEFT') angle = 90;
                if (g.direction === 'RIGHT') angle = -90;

                ctx.rotate(angle * Math.PI / 180);
                // Draw image centered
                ctx.drawImage(headSprite.current, -CELL / 2, -CELL / 2, CELL, CELL);
                ctx.restore();
            } else if (i > 0 && bodySprite.current) {
                ctx.drawImage(bodySprite.current, s.x * CELL, s.y * CELL, CELL, CELL);
            } else {
                ctx.fillStyle = i === 0 ? '#00E436' : '#008751';
                ctx.fillRect(s.x * CELL, s.y * CELL, CELL, CELL);
                if (i === 0) {
                    ctx.fillStyle = '#000';
                    ctx.fillRect(s.x * CELL + 4, s.y * CELL + 4, 2, 2);
                    ctx.fillRect(s.x * CELL + 14, s.y * CELL + 4, 2, 2);
                }
            }
        });
    };



    return (
        <RetroFrame
            title="SNAKE"
            onBack={() => navigate('/')}
        // className={styles.retroFrame} // styles import missing, skipping class for now as inline style works
        >
            <div style={{ position: 'relative', width: '100%', height: '100%', touchAction: 'none' }}>
                <div style={{ position: 'absolute', top: 10, left: 10, color: 'white', zIndex: 10, fontFamily: 'monospace' }}>Score: {uiState.score} LV: {uiState.level}</div>

                <GameCanvas width={320} height={480} onUpdate={handleUpdate} onDraw={handleDraw} paused={paused} />

                <div style={{
                    position: 'absolute',
                    bottom: 10,
                    width: '100%',
                    textAlign: 'center',
                    color: '#83769C',
                    fontFamily: '"Pico8", sans-serif',
                    fontSize: '14px',
                    opacity: 0.8,
                    pointerEvents: 'none'
                }}>
                    スワイプで移動
                </div>

                {(uiState.state === 'gameover' || uiState.state === 'cleared') && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        backgroundColor: 'rgba(0,0,0,0.8)', color: 'white', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center'
                    }}>
                        <h2>{uiState.state === 'cleared' ? 'NEXT STAGE!' : 'GAME OVER'}</h2>
                        {uiState.state === 'gameover' && <RetroButton onClick={() => window.location.reload()}>もういちど</RetroButton>}
                        <br />
                        <RetroButton variant="secondary" onClick={() => navigate('/menu')}>やめる</RetroButton>
                    </div>
                )}
            </div>
        </RetroFrame>
    );
};
