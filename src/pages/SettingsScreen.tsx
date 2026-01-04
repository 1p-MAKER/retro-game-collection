import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RetroButton } from '../components/ui/RetroButton';
import { useGameStore } from '../store/useGameStore';

export const SettingsScreen: React.FC = () => {
    const navigate = useNavigate();
    const { language, setLanguage, soundEnabled, toggleSound } = useGameStore();

    return (
        <div style={{ padding: '20px' }}>
            <h2>SETTINGS</h2>

            <div style={{ marginBottom: '20px' }}>
                <p>LANGUAGE: {language}</p>
                <div style={{ display: 'flex', gap: '5px' }}>
                    <RetroButton size="sm" onClick={() => setLanguage('ja')}>日本語</RetroButton>
                    <RetroButton size="sm" onClick={() => setLanguage('ja-kana')}>かな</RetroButton>
                    <RetroButton size="sm" onClick={() => setLanguage('en')}>EN</RetroButton>
                </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <p>SOUND: {soundEnabled ? 'ON' : 'OFF'}</p>
                <RetroButton size="sm" onClick={toggleSound}>TOGGLE</RetroButton>
            </div>

            <RetroButton variant="secondary" onClick={() => navigate('/')}>BACK</RetroButton>
        </div>
    );
}
