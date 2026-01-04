import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RetroButton } from '../components/ui/RetroButton';
import { useGameStore } from '../store/useGameStore';

import { translations } from '../locales/translations';

export const TitleScreen: React.FC = () => {
    const navigate = useNavigate();
    const { language } = useGameStore();

    const t = translations[language];
    const titleText = language === 'ja' || language === 'ja-kana'
        ? "まるごと！\nなつかしミニゲーム11"
        : "RETRO GAME\nCOLLECTION 11";

    return (
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
            textAlign: 'center',
            whiteSpace: 'pre-wrap'
        }}>
            <h1 style={{
                color: 'var(--color-yellow)',
                fontSize: '2rem',
                textShadow: '4px 4px var(--color-dark-blue)'
            }}>
                {titleText}
            </h1>

            <RetroButton size="lg" onClick={() => navigate('/menu')}>
                {t.ui.start}
            </RetroButton>

            <RetroButton variant="secondary" onClick={() => navigate('/settings')}>
                {t.ui.settings}
            </RetroButton>
        </div>
    );
};
