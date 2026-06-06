import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore';

export default function PauseMenu() {
  const [open, setOpen] = useState(false);
  const { saveGame, setScreen, playerName, stats } = useGameStore();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // ESC toggles pause only when not in computer/dialogue
      if (e.code === 'Escape') {
        const store = useGameStore.getState();
        if (!store.isUsingComputer && !store.activeDialogueNPC) {
          setOpen((v) => !v);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleSave = () => {
    saveGame();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const [saved, setSaved] = useState(false);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />

        {/* Menu */}
        <motion.div
          className="relative exos-window rounded-2xl p-8 w-80"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          {/* Scanline */}
          <div className="absolute inset-0 exos-scanline opacity-20 pointer-events-none rounded-2xl" />

          <div className="relative z-10">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="text-[#00ff41]/40 font-mono text-xs tracking-widest mb-1">PAUSED</div>
              <div className="text-[#00ff41] font-mono text-lg font-bold">HACKER LIFE</div>
              <div className="text-[#3a6a3a] font-mono text-xs mt-2">
                {playerName} · Lv.{stats.level} · {stats.reputationRank}
              </div>
            </div>

            <div className="h-px bg-[#1a3a1a] mb-5" />

            {/* Buttons */}
            <div className="space-y-2">
              <PauseBtn
                icon="▶"
                label="Resume"
                onClick={() => setOpen(false)}
                color="#00ff41"
              />
              <PauseBtn
                icon="💾"
                label={saved ? 'Saved!' : 'Save Game'}
                onClick={handleSave}
                color={saved ? '#44ff88' : '#00aaff'}
              />
              <PauseBtn
                icon="⚙"
                label="Settings"
                onClick={() => { setOpen(false); setScreen('settings'); }}
                color="#ffb300"
              />
              <div className="h-px bg-[#1a3a1a] my-2" />
              <PauseBtn
                icon="⬡"
                label="Main Menu"
                onClick={() => { setOpen(false); setScreen('main-menu'); }}
                color="#ff4444"
              />
            </div>

            <div className="text-center mt-4">
              <span className="text-[#2a4a2a] font-mono text-xs">ESC to resume</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function PauseBtn({
  icon, label, onClick, color,
}: {
  icon: string; label: string; onClick: () => void; color: string;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 rounded border border-[#1a3a1a] hover:border-opacity-60 transition-all font-mono text-sm group"
      style={{ '--hover-color': color } as React.CSSProperties}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = `${color}60`;
        (e.currentTarget as HTMLElement).style.background = `${color}10`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = '';
        (e.currentTarget as HTMLElement).style.background = '';
      }}
    >
      <span className="w-5 text-center" style={{ color }}>{icon}</span>
      <span className="text-[#6aaa6a] group-hover:text-white transition-colors">{label}</span>
    </button>
  );
}
