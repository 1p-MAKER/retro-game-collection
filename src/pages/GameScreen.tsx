import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RetroButton } from '../components/ui/RetroButton';
import { BreakoutGame } from '../games/breakout/BreakoutGame';

export const GameScreen: React.FC = () => {
    const { gameId } = useParams();
    const navigate = useNavigate();

    const renderGame = () => {
        switch (gameId) {
            case 'breakout':
                return <BreakoutGame />;
            default:
                return (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <p>GAME NOT FOUND: {gameId}</p>
                        <RetroButton variant="secondary" onClick={() => navigate('/menu')}>EXIT</RetroButton>
                    </div>
                );
        }
    };

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                {renderGame()}
            </div>
        </div>
    );
}
