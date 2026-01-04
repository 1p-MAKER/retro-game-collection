import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RetroButton } from '../components/ui/RetroButton';
import { translations } from '../locales/translations';
import { useGameStore } from '../store/useGameStore';

const GAMES = [
    { id: 'breakout', key: 'breakout', color: 'var(--color-red)' },
    { id: 'snake', key: 'snake', color: 'var(--color-green)' },
    { id: 'sky_navigator', key: 'sky_navigator', color: 'var(--color-blue)' },
    { id: 'lane_race', key: 'lane_race', color: 'var(--color-orange)' },
    { id: 'space_defender', key: 'space_defender', color: 'var(--color-indigo)' },
    { id: 'endless_jumper', key: 'endless_jumper', color: 'var(--color-pink)' },
    { id: 'memory_match', key: 'memory_match', color: 'var(--color-yellow)' },
    { id: 'whac_a_mole', key: 'whac_a_mole', color: 'var(--color-brown)' },
    { id: 'catch_drop', key: 'catch_drop', color: 'var(--color-peach)' },
    { id: 'mash', key: 'mash', color: 'var(--color-red)' },
    { id: 'quick_reflex', key: 'quick_reflex', color: 'var(--color-blue)' },
] as const;

export const MenuScreen: React.FC = () => {
    const navigate = useNavigate();
    const { language } = useGameStore();
    const t = translations[language];

    return (
        <div style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            boxSizing: 'border-box',
            background: 'radial-gradient(circle at center, #1a1a2e 0%, #000 100%)'
        }}>
            <h2 style={{
                textAlign: 'center',
                marginBottom: '30px',
                color: 'var(--color-blue)',
                fontSize: '2rem',
                textShadow: '0 0 10px var(--color-blue), 0 0 20px var(--color-blue)',
                letterSpacing: '4px',
                fontFamily: 'monospace'
            }}>
                ARCADE MENU
            </h2>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: '20px',
                overflowY: 'auto',
                paddingBottom: '20px',
                flex: 1,
                paddingRight: '5px' // Space for scrollbar
            }}>
                {GAMES.map(game => (
                    <div
                        key={game.id}
                        onClick={() => navigate(`/game/${game.id}`)}
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: `1px solid ${game.color}`,
                            borderRadius: '8px',
                            minHeight: '120px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: `0 0 5px ${game.color}, inset 0 0 10px rgba(0,0,0,0.5)`,
                            padding: '10px',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = `0 0 20px ${game.color}, inset 0 0 20px rgba(255,255,255,0.1)`;
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = `0 0 5px ${game.color}, inset 0 0 10px rgba(0,0,0,0.5)`;
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        }}
                    >
                        {/* Neon Line Decoration */}
                        <div style={{
                            width: '100%', height: '2px', background: game.color,
                            boxShadow: `0 0 5px ${game.color}`, marginBottom: '15px', opacity: 0.8
                        }} />

                        <span style={{
                            color: 'var(--color-white)',
                            fontSize: '1rem',
                            textAlign: 'center',
                            fontWeight: 'bold',
                            textShadow: '0 0 5px black'
                        }}>
                            {t.titles[game.key as keyof typeof t.titles]}
                        </span>

                        <div style={{
                            marginTop: '10px',
                            fontSize: '0.7rem',
                            color: game.color,
                            opacity: 0.8,
                            letterSpacing: '1px'
                        }}>START ▶</div>
                    </div>
                ))}
            </div>

            <div style={{ flexShrink: 0, marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                <RetroButton variant="secondary" onClick={() => navigate('/')} style={{ width: '200px', border: '1px solid var(--color-red)', color: 'var(--color-red)', boxShadow: '0 0 5px var(--color-red)' }}>
                    {t.ui.back}
                </RetroButton>
            </div>
        </div>
    );
}
