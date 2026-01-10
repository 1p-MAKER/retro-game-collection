import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { RetroButton } from './RetroButton';
import { translations } from '../../locales/translations';

interface RankingDisplayProps {
    gameId: string;
    highlightScore: number;
    inputScore?: number;
    onScoreSubmitted?: () => void;
    onRetry: () => void;
    onExit: () => void;
}

export const RankingDisplay: React.FC<RankingDisplayProps> = ({
    gameId,
    highlightScore,
    inputScore,
    onScoreSubmitted,
    onRetry,
    onExit
}) => {
    const { gamesProgress, updateGameProgress, language } = useGameStore();
    const t = translations[language].ui;
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get current rankings
    const rankings = gamesProgress[gameId]?.rankings || [];

    const handleSubmit = () => {
        if (!name.trim() || !inputScore) return;
        setIsSubmitting(true);

        // Update game progress with name
        updateGameProgress(gameId, 0, inputScore, name.trim().substring(0, 10).toUpperCase());

        if (onScoreSubmitted) {
            onScoreSubmitted();
        }
        setIsSubmitting(false);
    };

    return (
        <div style={{
            width: '80%',
            maxWidth: '300px',
            backgroundColor: '#1D2B53',
            border: '2px solid #FFF1E8',
            padding: '15px',
            color: '#FFF1E8',
            fontFamily: 'monospace',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
        }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#FF004D' }}>RANKING</h3>

            {/* Input Form for New Record */}
            {inputScore !== undefined && !isSubmitting && (
                <div style={{ marginBottom: '15px', borderBottom: '1px dashed #555', paddingBottom: '10px' }}>
                    <p style={{ margin: '5px 0', color: '#00E436' }}>NEW RECORD!</p>
                    <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                        <input
                            type="text"
                            maxLength={10}
                            value={name}
                            onChange={(e) => setName(e.target.value.toUpperCase())}
                            placeholder="NAME"
                            style={{
                                backgroundColor: '#000',
                                color: '#fff',
                                border: '1px solid #fff',
                                padding: '5px',
                                width: '100px',
                                fontFamily: 'monospace',
                                textTransform: 'uppercase'
                            }}
                        />
                        <RetroButton size="sm" onClick={handleSubmit} disabled={!name.trim()}>OK</RetroButton>
                    </div>
                </div>
            )}

            {/* Ranking List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '14px' }}>
                {rankings.length === 0 ? (
                    <div>NO RECORDS</div>
                ) : (
                    rankings.map((r: any, i: number) => (
                        <div key={i} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            color: r.score === highlightScore ? '#FFEC27' : '#FFF1E8',
                            backgroundColor: r.score === highlightScore ? '#5f574f' : 'transparent'
                        }}>
                            <span>{i + 1}. {r.name || 'PLR'}</span>
                            <span>{r.score}</span>
                        </div>
                    ))
                )}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '15px' }}>
                <RetroButton size="sm" onClick={onRetry}>{t.retry || 'RETRY'}</RetroButton>
                <RetroButton size="sm" variant="secondary" onClick={onExit}>{t.exit || 'EXIT'}</RetroButton>
            </div>
        </div>
    );
};
