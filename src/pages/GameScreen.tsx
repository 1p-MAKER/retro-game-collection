import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BreakoutGame } from '../games/breakout/BreakoutGame';
import { SnakeGame } from '../games/snake/SnakeGame';
import { SkyNavigatorGame } from '../games/sky_navigator/SkyNavigatorGame';
import { LaneRaceGame } from '../games/lane_race/LaneRaceGame';
import { SpaceDefenderGame } from '../games/space_defender/SpaceDefenderGame';
import { EndlessJumperGame } from '../games/endless_jumper/EndlessJumperGame';
import { MemoryMatchGame } from '../games/memory_match/MemoryMatchGame';
import { WhacAMoleGame } from '../games/whac_a_mole/WhacAMoleGame';
import { CatchDropGame } from '../games/catch_drop/CatchDropGame';

import { MashGame } from '../games/mash/MashGame';
import { QuickReflexGame } from '../games/quick_reflex/QuickReflexGame';

import { useState } from 'react';
import { translations } from '../locales/translations';
import { useGameStore } from '../store/useGameStore';
import { RetroButton } from '../components/ui/RetroButton';
// Utility to clone element with paused prop
const PausableGame = ({ children, paused }: { children: React.ReactElement, paused: boolean }) => {
    return React.cloneElement(children, { paused: paused } as any);
};

export const GameScreen: React.FC = () => {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const { language } = useGameStore();
    const [paused, setPaused] = useState(false);



    const t = translations[language];

    const renderGame = () => {
        let gameComponent;
        switch (gameId) {
            case 'breakout': gameComponent = <BreakoutGame />; break;
            case 'snake': gameComponent = <SnakeGame />; break;
            case 'sky_navigator': gameComponent = <SkyNavigatorGame />; break;
            case 'lane_race': gameComponent = <LaneRaceGame />; break;
            case 'space_defender': gameComponent = <SpaceDefenderGame />; break;
            case 'endless_jumper': gameComponent = <EndlessJumperGame />; break;
            case 'memory_match': gameComponent = <MemoryMatchGame />; break;
            case 'whac_a_mole': gameComponent = <WhacAMoleGame />; break;
            case 'catch_drop': gameComponent = <CatchDropGame />; break;
            case 'mash': gameComponent = <MashGame />; break;
            case 'quick_reflex': gameComponent = <QuickReflexGame />; break;
            default:
                return (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <p>GAME NOT FOUND: {gameId}</p>
                        <RetroButton variant="secondary" onClick={() => navigate('/menu')}>EXIT</RetroButton>
                    </div>
                );
        }
        return <PausableGame paused={paused}>{gameComponent}</PausableGame>;
    };

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {/* Top Bar (Score/Time usually here, but avoiding overlap via padding) */}
            <div style={{
                height: 'var(--safe-top)',
                width: '100%',
                backgroundColor: 'rgba(0,0,0,0.2)', // Slight dim to show safe area
                zIndex: 50
            }} />

            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                {renderGame()}

                {/* Pause Button (Top Right, below Safe Area) */}
                <button
                    onClick={() => setPaused(true)}
                    style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        zIndex: 90,
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontSize: '24px',
                        cursor: 'pointer'
                    }}
                >
                    ⏸
                </button>

                {/* Pause Menu Overlay */}
                {paused && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        zIndex: 100,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        gap: '20px'
                    }}>
                        <h2 style={{ color: '#FFF1E8' }}>PAUSED</h2>
                        <RetroButton onClick={() => setPaused(false)}>RESUME</RetroButton>
                        <RetroButton variant="secondary" onClick={() => navigate('/menu')}>{t.ui.exit}</RetroButton>
                    </div>
                )}
            </div>
        </div>
    );
}
