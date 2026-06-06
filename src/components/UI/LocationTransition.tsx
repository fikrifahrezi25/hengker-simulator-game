import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore';

const LOCATION_NAMES: Record<string, { name: string; subtitle: string; icon: string }> = {
  apartment:     { name: 'Your Apartment',       subtitle: 'Meridian Apartments, Block 3',    icon: '🏠' },
  city:          { name: 'Neo Satria City',       subtitle: 'Residential District — Street Level', icon: '🌆' },
  'cyber-cafe':  { name: 'Meridian Cyber Cafe',   subtitle: 'Shopping District, Meridian St.', icon: '☕' },
  'computer-store': { name: "Chen's Tech Store",  subtitle: 'Shopping District',               icon: '⚙' },
  university:    { name: 'Neo Satria University', subtitle: 'University District',              icon: '◈' },
  'business-district': { name: 'Business District', subtitle: 'Corporate Zone',                icon: '🏢' },
};

export default function LocationTransition() {
  const currentLocation = useGameStore((s) => s.currentLocation);
  const [show, setShow] = useState(false);
  const [locationInfo, setLocationInfo] = useState(LOCATION_NAMES['apartment']);
  const [prevLocation, setPrevLocation] = useState(currentLocation);

  useEffect(() => {
    if (currentLocation !== prevLocation) {
      const info = LOCATION_NAMES[currentLocation] ?? {
        name: currentLocation,
        subtitle: 'Neo Satria City',
        icon: '📍',
      };
      setLocationInfo(info);
      setShow(true);
      setPrevLocation(currentLocation);
      const t = setTimeout(() => setShow(false), 2500);
      return () => clearTimeout(t);
    }
  }, [currentLocation, prevLocation]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Dark overlay */}
          <motion.div
            className="absolute inset-0 bg-black"
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1.5, delay: 0.8 }}
          />
          {/* Location card */}
          <motion.div
            className="relative glass-dark rounded-2xl px-10 py-6 text-center"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="text-4xl mb-3">{locationInfo.icon}</div>
            <div className="text-white font-bold text-xl mb-1">{locationInfo.name}</div>
            <div className="text-white/50 text-sm font-mono">{locationInfo.subtitle}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
