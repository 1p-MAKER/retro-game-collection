import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RetroButton } from '../components/ui/RetroButton';
import { translations } from '../locales/translations';
import { useGameStore } from '../store/useGameStore';

const GAMES = [
    { id: 'breakout', key: 'breakout' },
    { id: 'snake', key: 'snake' },
    { id: 'sky_navigator', key: 'sky_navigator' },
    { id: 'lane_race', key: 'lane_race' },
    { id: 'space_defender', key: 'space_defender' },
    { id: 'endless_jumper', key: 'endless_jumper' },
    { id: 'memory_match', key: 'memory_match' },
    { id: 'whac_a_mole', key: 'whac_a_mole' },
    { id: 'catch_drop', key: 'catch_drop' },
    { id: 'mash', key: 'mash' },
    { id: 'quick_reflex', key: 'quick_reflex' },
] as const;

export const MenuScreen: React.FC = () => {
    const navigate = useNavigate();
    const { language } = useGameStore();
    const t = translations[language];

    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#FFF1E8' }}>GAME MENU</h2>

            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                overflowY: 'auto',
                paddingBottom: '20px',
                flex: 1
            }}>
                {GAMES.map(game => (
                    <RetroButton
                        key={game.id}
                        onClick={() => navigate(`/game/${game.id}`)}
                        size="sm"
                        style={{ minHeight: '80px', fontSize: '0.9rem', lineHeight: '1.2' }}
                    >
                        {t.titles[game.key as keyof typeof t.titles]}
                    </RetroButton>
                ))}
            </div>

            <div style={{ flexShrink: 0, marginTop: '10px' }}>
                <RetroButton variant="secondary" onClick={() => navigate('/')}>{t.ui.back}</RetroButton>
            </div>
        </div>
    );
}
