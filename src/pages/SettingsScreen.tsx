import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RetroButton } from '../components/ui/RetroButton';
import { useGameStore } from '../store/useGameStore';
import { translations } from '../locales/translations';

export const SettingsScreen: React.FC = () => {
    const navigate = useNavigate();
    const {
        language, setLanguage,
        soundEnabled, toggleSound,
        bgmEnabled, toggleBgm,
        playTimeLimitMin, setPlayTimeLimit,
        resetAllData
    } = useGameStore();

    const t = translations[language];

    const cycleTimer = () => {
        // 0 -> 15 -> 30 -> 60 -> 0
        if (playTimeLimitMin === 0) setPlayTimeLimit(15);
        else if (playTimeLimitMin === 15) setPlayTimeLimit(30);
        else if (playTimeLimitMin === 30) setPlayTimeLimit(60);
        else setPlayTimeLimit(0);
    };

    const handleReset = () => {
        if (window.confirm(t.ui.reset_confirm)) {
            resetAllData();
        }
    };

    return (
        <div style={{ padding: '20px', height: '100%', boxSizing: 'border-box', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '20px', color: '#FFF1E8' }}>{t.ui.settings}</h2>

            <div style={{ marginBottom: '20px' }}>
                <p style={{ marginBottom: 5 }}>{t.ui.language}</p>
                <div style={{ display: 'flex', gap: '5px' }}>
                    <RetroButton size="sm" onClick={() => setLanguage('ja')} variant={language === 'ja' ? 'primary' : 'secondary'}>日本語</RetroButton>
                    <RetroButton size="sm" onClick={() => setLanguage('ja-kana')} variant={language === 'ja-kana' ? 'primary' : 'secondary'}>かな</RetroButton>
                    <RetroButton size="sm" onClick={() => setLanguage('en')} variant={language === 'en' ? 'primary' : 'secondary'}>EN</RetroButton>
                </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <p>{t.ui.sound}: {soundEnabled ? 'ON' : 'OFF'}</p>
                    <RetroButton size="sm" onClick={toggleSound}>Toggle</RetroButton>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p>{t.ui.bgm}: {bgmEnabled ? 'ON' : 'OFF'}</p>
                    <RetroButton size="sm" onClick={toggleBgm}>Toggle</RetroButton>
                </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <p style={{ marginBottom: 5 }}>{t.ui.timer}</p>
                <RetroButton size="sm" onClick={cycleTimer}>
                    {playTimeLimitMin === 0 ? t.ui.unlimited : `${playTimeLimitMin} min`}
                </RetroButton>
            </div>

            <div style={{ marginBottom: '20px', borderTop: '2px dashed #FFF1E8', paddingTop: 10 }}>
                <RetroButton size="sm" onClick={handleReset} style={{ backgroundColor: '#FF004D' }}>
                    {t.ui.reset}
                </RetroButton>
            </div>

            <RetroButton variant="secondary" onClick={() => navigate('/')}>{t.ui.back}</RetroButton>
        </div>
    );
}
