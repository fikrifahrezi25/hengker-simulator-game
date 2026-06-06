import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore';

interface Notification {
  id: string;
  type: 'objective' | 'mission_complete' | 'level_up' | 'chapter';
  title: string;
  subtitle?: string;
  icon: string;
  color: string;
}

export default function MissionNotification() {
  const [queue, setQueue] = useState<Notification[]>([]);
  const [current, setCurrent] = useState<Notification | null>(null);

  // Expose push function globally so missionTracker can call it
  useEffect(() => {
    (window as any).__pushNotification = (notif: Notification) => {
      setQueue((q) => [...q, notif]);
    };
    return () => { delete (window as any).__pushNotification; };
  }, []);

  // Process queue
  useEffect(() => {
    if (!current && queue.length > 0) {
      const [next, ...rest] = queue;
      setCurrent(next);
      setQueue(rest);
      const timer = setTimeout(() => setCurrent(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [current, queue]);

  return (
    <div className="fixed top-20 right-4 z-50 pointer-events-none space-y-2">
      <AnimatePresence>
        {current && (
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <div
              className="glass-dark rounded-xl px-4 py-3 flex items-center gap-3 min-w-[260px] max-w-[320px]"
              style={{ borderLeft: `3px solid ${current.color}` }}
            >
              <span className="text-2xl shrink-0">{current.icon}</span>
              <div>
                <div className="font-mono text-xs uppercase tracking-widest mb-0.5"
                  style={{ color: current.color }}>
                  {current.type === 'objective' && 'Objective Complete'}
                  {current.type === 'mission_complete' && 'Mission Complete'}
                  {current.type === 'level_up' && 'Level Up'}
                  {current.type === 'chapter' && 'Chapter Unlocked'}
                </div>
                <div className="text-white/90 text-sm font-medium">{current.title}</div>
                {current.subtitle && (
                  <div className="text-white/50 text-xs mt-0.5">{current.subtitle}</div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper to push notifications from anywhere
export function pushNotification(notif: Omit<Notification, 'id'>) {
  const fn = (window as any).__pushNotification;
  if (fn) fn({ ...notif, id: `${Date.now()}-${Math.random()}` });
}
