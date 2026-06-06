import { AnimatePresence } from 'framer-motion';
import { useGameStore } from './stores/gameStore';
import MainMenu from './components/MainMenu/MainMenu';
import LoadingScreen from './components/UI/LoadingScreen';
import GameWorld from './components/World/GameWorld';
import SettingsScreen from './components/UI/SettingsScreen';

export default function App() {
  const screen = useGameStore((s) => s.screen);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <AnimatePresence mode="wait">
        {screen === 'main-menu' && <MainMenu key="main-menu" />}
        {screen === 'loading'   && <LoadingScreen key="loading" />}
        {screen === 'world'     && <GameWorld key="world" />}
        {screen === 'settings'  && <SettingsScreen key="settings" />}
      </AnimatePresence>
    </div>
  );
}
