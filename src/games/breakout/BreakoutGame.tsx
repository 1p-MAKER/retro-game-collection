import React, { useEffect, useRef, useState } from 'react';
import { GameCanvas } from '../../components/layout/GameCanvas';
import { BreakoutLogic } from './BreakoutLogic';
import type { Item, ItemType } from './BreakoutLogic';
import { soundManager } from '../../audio/SoundGenerator';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/useGameStore';
import { RankingDisplay } from '../../components/ui/RankingDisplay';

// アイテムのアイコンと色
const ITEM_VISUALS: Record<ItemType, { icon: string; color: string }> = {
    expand: { icon: '⟷', color: '#00E436' },
    shrink: { icon: '⟵⟶', color: '#FF004D' },
    slow: { icon: '🐢', color: '#29ADFF' },
    fast: { icon: '⚡', color: '#FFA300' },
    multi: { icon: '●●●', color: '#FFEC27' },
    laser: { icon: '⚡', color: '#FF004D' },
    catch: { icon: '🧲', color: '#83769C' },
    life: { icon: '♡', color: '#FF77A8' },
    barrier: { icon: '▬', color: '#00E436' },
    penetrate: { icon: '◆', color: '#FF6C24' }
};

export const BreakoutGame: React.FC<{ paused?: boolean }> = ({ paused }) => {
    const navigate = useNavigate();
    const { updateGameProgress } = useGameStore();
    const gameLogic = useRef<BreakoutLogic | null>(null);
    const [uiState, setUiState] = useState({ score: 0, lives: 3, level: 1, state: 'paused', isNewRecord: false });

    useEffect(() => {
        gameLogic.current = new BreakoutLogic(soundManager, 1);
        setUiState({
            score: gameLogic.current.score,
            lives: gameLogic.current.lives,
            level: gameLogic.current.level,
            state: gameLogic.current.gameState,
            isNewRecord: false
        });
    }, []);

    const handleUpdate = (deltaTime: number) => {
        if (!gameLogic.current) return;

        const prevState = gameLogic.current.gameState;
        const prevLives = gameLogic.current.lives;
        const prevScore = gameLogic.current.score;

        gameLogic.current.update(deltaTime);

        // UIの同期（変化があった場合のみ）
        if (
            gameLogic.current.gameState !== prevState ||
            gameLogic.current.lives !== prevLives ||
            gameLogic.current.score !== prevScore
        ) {
            setUiState({
                score: gameLogic.current.score,
                lives: gameLogic.current.lives,
                level: gameLogic.current.level,
                state: gameLogic.current.gameState,
                isNewRecord: false
            });

            if (gameLogic.current.gameState === 'cleared') {
                setTimeout(() => {
                    if (gameLogic.current) {
                        const newLevel = gameLogic.current.level + 1;
                        const currentScore = gameLogic.current.score;
                        updateGameProgress('breakout', newLevel, currentScore);
                        gameLogic.current = new BreakoutLogic(soundManager, newLevel);
                        gameLogic.current.score = currentScore;
                        setUiState(prev => ({ ...prev, level: newLevel, state: 'paused' }));
                    }
                }, 2000);
            } else if (gameLogic.current.gameState === 'gameover') {
                updateGameProgress('breakout', gameLogic.current.level, gameLogic.current.score);
            }
        }
    };

    const drawItem = (ctx: CanvasRenderingContext2D, item: Item) => {
        const visual = ITEM_VISUALS[item.type];

        // カプセル背景
        ctx.fillStyle = '#1D2B53';
        ctx.beginPath();
        ctx.roundRect(item.x - 15, item.y - 8, 30, 16, 8);
        ctx.fill();

        // ネオン枠
        ctx.strokeStyle = visual.color;
        ctx.lineWidth = 2;
        ctx.shadowColor = visual.color;
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // アイコン
        ctx.fillStyle = visual.color;
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(visual.icon, item.x, item.y);
    };

    const handleDraw = (ctx: CanvasRenderingContext2D) => {
        if (!gameLogic.current) return;
        const game = gameLogic.current;

        // 背景（暗め）
        ctx.fillStyle = '#0D0D15';
        ctx.fillRect(0, 0, 320, 480);

        // バリア表示
        if (game.barrierActive) {
            ctx.fillStyle = '#00E436';
            ctx.shadowColor = '#00E436';
            ctx.shadowBlur = 10;
            ctx.fillRect(0, 475, 320, 5);
            ctx.shadowBlur = 0;
        }

        // パドル
        ctx.fillStyle = game.laserActive ? '#FF004D' : '#29ADFF';
        ctx.shadowColor = game.laserActive ? '#FF004D' : '#29ADFF';
        ctx.shadowBlur = 5;
        ctx.fillRect(game.paddle.x, 450, game.paddle.width, game.paddle.height);
        ctx.shadowBlur = 0;

        // レーザー
        ctx.fillStyle = '#FF004D';
        for (const laser of game.lasers) {
            ctx.fillRect(laser.x - 2, laser.y, 4, 10);
        }

        // ボール（複数対応）
        ctx.fillStyle = '#FFF1E8';
        for (const ball of game.balls) {
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // ブロック
        for (const block of game.blocks) {
            if (block.active) {
                ctx.fillStyle = block.color;
                ctx.fillRect(block.x, block.y, block.width, block.height);
                if (block.type === 'hard' && block.hp > 1) {
                    ctx.strokeStyle = '#000000';
                    ctx.strokeRect(block.x + 2, block.y + 2, block.width - 4, block.height - 4);
                }
            }
        }

        // アイテム
        for (const item of game.items) {
            if (item.active) {
                drawItem(ctx, item);
            }
        }

        // アイテム取得テキスト
        if (game.lastItemName && Date.now() - game.lastItemTime < 1000) {
            ctx.fillStyle = '#FFEC27';
            ctx.font = 'bold 16px monospace';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 4;
            ctx.fillText(game.lastItemName, 160, 240);
            ctx.shadowBlur = 0;
        }
    };

    const handleTouch = (e: React.TouchEvent | React.MouseEvent | TouchEvent) => {
        if (!gameLogic.current || paused) return;

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

    const handleTap = () => {
        if (!gameLogic.current || paused) return;
        gameLogic.current.launch();
        // レーザー発射（レーザーモード時）
        if (gameLogic.current.laserActive) {
            gameLogic.current.fireLaser();
        }
    };

    // 残機表示（ハート）
    const livesDisplay = '❤'.repeat(Math.max(0, uiState.lives));

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {/* HUD */}
            <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', padding: '10px',
                display: 'flex', justifyContent: 'space-between', color: 'white', pointerEvents: 'none',
                fontFamily: 'monospace', fontSize: '24px', textShadow: '1px 1px 0 #000'
            }}>
                <span>スコア: {uiState.score}</span>
                <span>Lv.{uiState.level}</span>
            </div>

            <div
                style={{ width: '100%', height: '100%' }}
                onTouchMove={handleTouch}
                onTouchStart={(e) => { handleTouch(e); handleTap(); }}
                onMouseDown={(e) => { handleTouch(e); handleTap(); }}
                onMouseMove={(e) => { if (e.buttons === 1) handleTouch(e); }}
            >
                <GameCanvas
                    width={320} height={480}
                    onUpdate={handleUpdate}
                    onDraw={handleDraw}
                    paused={paused}
                />
            </div>

            {/* 残機（ハート） */}
            <div style={{
                position: 'absolute', bottom: 10, left: 10,
                color: '#FF77A8', fontSize: '20px', pointerEvents: 'none'
            }}>
                {livesDisplay}
            </div>

            {/* ゲームオーバー / ステージクリア */}
            {uiState.state === 'cleared' && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: '20px'
                }}>
                    <h2 style={{ color: '#FFEC27', fontSize: '2rem' }}>ステージクリア！</h2>
                </div>
            )}

            {uiState.state === 'gameover' && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center'
                }}>
                    <RankingDisplay
                        gameId="breakout"
                        highlightScore={uiState.score}
                        inputScore={uiState.score}
                        onRetry={() => window.location.reload()}
                        onExit={() => navigate('/menu')}
                    />
                </div>
            )}
        </div>
    );
};
