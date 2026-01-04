import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RetroButton } from '../components/ui/RetroButton';

export const GameScreen: React.FC = () => {
    const { gameId } = useParams();
    const navigate = useNavigate();

    return (
        <div style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h2>GAME: {gameId?.toUpperCase()}</h2>
            <div style={{ flex: 1, border: '2px dashed gray', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                GAME CANVAS AREA
            </div>
            <div style={{ marginTop: '10px' }}>
                <RetroButton variant="secondary" onClick={() => navigate('/menu')}>EXIT</RetroButton>
            </div>
        </div>
    );
}
