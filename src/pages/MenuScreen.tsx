import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RetroButton } from '../components/ui/RetroButton';

export const MenuScreen: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h2>GAME MENU</h2>
            {/* Wraps list of games roughly */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <RetroButton onClick={() => navigate('/game/breakout')} size="sm">
                    BLOCK BREAK
                </RetroButton>
                <div style={{ color: 'gray' }}>More Coming Soon...</div>
            </div>
            <br />
            <RetroButton variant="secondary" onClick={() => navigate('/')}>BACK</RetroButton>
        </div>
    );
}
