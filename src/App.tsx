
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { RetroFrame } from './components/layout/RetroFrame';
import { TitleScreen } from './pages/TitleScreen';
import { MenuScreen } from './pages/MenuScreen';
import { SettingsScreen } from './pages/SettingsScreen';
import { GameScreen } from './pages/GameScreen';

function App() {
  return (
    <Router>
      <RetroFrame>
        <Routes>
          <Route path="/" element={<TitleScreen />} />
          <Route path="/menu" element={<MenuScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="/game/:gameId" element={<GameScreen />} />
        </Routes>
      </RetroFrame>
    </Router>
  );
}

export default App;
