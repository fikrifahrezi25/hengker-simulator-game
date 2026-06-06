import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AutoSaveIndicator() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    (window as any).__showAutoSave = () => {
      setVisible(true);
      setTimeout(() => setVisible(false), 2000);
    };
    return () => { delete (window as any).__showAutoSave; };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-4 left-4 z-40 pointer-events-none"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
        >
          <div className="flex items-center gap-2 glass-dark rounded-lg px-3 py-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00ff41] animate-pulse" />
            <span className="text-[#00ff41]/70 font-mono text-xs">Auto-saved</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function triggerAutoSaveIndicator() {
  const fn = (window as any).__showAutoSave;
  if (fn) fn();
}
