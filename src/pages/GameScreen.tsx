import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RetroButton } from '../components/ui/RetroButton';
import { BreakoutGame } from '../games/breakout/BreakoutGame';
import { SnakeGame } from '../games/snake/SnakeGame';
import { SkyNavigatorGame } from '../games/sky_navigator/SkyNavigatorGame';
import { LaneRaceGame } from '../games/lane_race/LaneRaceGame';
import { SpaceDefenderGame } from '../games/space_defender/SpaceDefenderGame';
import { EndlessJumperGame } from '../games/endless_jumper/EndlessJumperGame';
import { MemoryMatchGame } from '../games/memory_match/MemoryMatchGame';
import { WhacAMoleGame } from '../games/whac_a_mole/WhacAMoleGame';
import { CatchDropGame } from '../games/catch_drop/CatchDropGame';

export const GameScreen: React.FC = () => {
    const { gameId } = useParams();
    const navigate = useNavigate();

    const renderGame = () => {
        switch (gameId) {
            case 'breakout':
                return <BreakoutGame />;
            case 'snake':
                return <SnakeGame />;
            case 'sky_navigator':
                return <SkyNavigatorGame />;
            case 'lane_race':
                return <LaneRaceGame />;
            case 'space_defender':
                return <SpaceDefenderGame />;
            case 'endless_jumper':
                return <EndlessJumperGame />;
            case 'memory_match':
                return <MemoryMatchGame />;
            case 'whac_a_mole':
                return <WhacAMoleGame />;
            case 'catch_drop':
                return <CatchDropGame />;
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
