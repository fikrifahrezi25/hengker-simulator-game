import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, Stars, Preload } from '@react-three/drei';
import { motion } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore';
import PlayerController from './PlayerController';
import ApartmentScene from './scenes/ApartmentScene';
import CityScene from './scenes/CityScene';
import CyberCafeScene from './scenes/CyberCafeScene';
import ComputerStoreScene from './scenes/ComputerStoreScene';
import GenericInteriorScene from './scenes/GenericInteriorScene';
import NPCSystem from './NPCSystem';
import HUD from '../HUD/HUD';
import ExOS from '../ExOS/ExOS';
import DialogueSystem from '../Dialogue/DialogueSystem';
import InteractionPrompt from '../UI/InteractionPrompt';
import LocationTransition from '../UI/LocationTransition';
import MiniMap from '../HUD/MiniMap';
import MobileControls from '../UI/MobileControls';

// ── Interior scene lighting presets ──────────────────────────────────────────
// City exterior uses the global directional sun + hemisphere light.
// Interiors use only ambient + point lights defined inside the scene components,
// so we suppress the directional sun light when inside.
const INTERIOR_LOCATIONS = new Set(['apartment', 'cyber-cafe', 'computer-store']);
function isInteriorLocation(loc: string) {
  return INTERIOR_LOCATIONS.has(loc) || loc.startsWith('building-');
}

export default function GameWorld() {
  const isUsingComputer   = useGameStore((s) => s.isUsingComputer);
  const activeDialogueNPC = useGameStore((s) => s.activeDialogueNPC);
  const currentLocation   = useGameStore((s) => s.currentLocation);
  const settings          = useGameStore((s) => s.settings);

  const isInApartment = currentLocation === 'apartment';
  const isInCity      = currentLocation === 'city';
  const isInterior    = isInteriorLocation(currentLocation);

  // Pick the active 3-D scene
  function renderScene() {
    if (isInApartment)                    return <ApartmentScene />;
    if (isInCity)                         return <CityScene />;
    if (currentLocation === 'cyber-cafe') return <CyberCafeScene />;
    if (currentLocation === 'computer-store') return <ComputerStoreScene />;
    if (currentLocation.startsWith('building-')) return <GenericInteriorScene />;
    return <CityScene />;
  }

  return (
    <motion.div
      className="relative w-full h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* 3D Canvas */}
      {!isUsingComputer && (
        <Canvas
          className="w-full h-full"
          camera={{ fov: settings.fov, near: 0.1, far: 1000 }}
          shadows
          gl={{ antialias: settings.graphicsQuality !== 'low', powerPreference: 'high-performance' }}
        >
          <Suspense fallback={null}>
            {/* ── Global lighting ─────────────────────────────────────────── */}
            <ambientLight intensity={isInterior ? 0 : 0.6} color="#fff8f0" />

            {/* Sun — exterior only */}
            {!isInterior && (
              <directionalLight
                position={[50, 80, 30]}
                intensity={1.2}
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-camera-far={200}
                shadow-camera-left={-50}
                shadow-camera-right={50}
                shadow-camera-top={50}
                shadow-camera-bottom={-50}
                color="#fffaf0"
              />
            )}
            {!isInterior && <hemisphereLight args={['#87ceeb', '#7ec850', 0.4]} />}

            {/* Sky + stars — exterior only */}
            {isInCity && (
              <>
                <Sky
                  distance={450000}
                  sunPosition={[100, 20, 100]}
                  inclination={0.49}
                  azimuth={0.25}
                  turbidity={8}
                  rayleigh={0.5}
                />
                <Stars radius={300} depth={60} count={1000} factor={4} fade />
              </>
            )}

            {/* ── Active scene ─────────────────────────────────────────────── */}
            {renderScene()}

            {/* NPCs only in city */}
            {isInCity && <NPCSystem />}

            {/* Player controller */}
            <PlayerController />

            <Preload all />
          </Suspense>
        </Canvas>
      )}

      {/* ExOS overlay */}
      {isUsingComputer && <ExOS />}

      {/* HUD */}
      {!isUsingComputer && !activeDialogueNPC && <HUD />}

      {/* Crosshair */}
      {!isUsingComputer && !activeDialogueNPC && (
        <div className="crosshair" />
      )}

      {/* Interaction prompt */}
      {!isUsingComputer && !activeDialogueNPC && <InteractionPrompt />}

      {/* Mini map */}
      {!isUsingComputer && !activeDialogueNPC && <MiniMap />}

      {/* Location transition overlay — renders on every location change */}
      <LocationTransition />

      {/* Dialogue system */}
      {activeDialogueNPC && <DialogueSystem />}

      {/* Mobile controls */}
      <MobileControls />
    </motion.div>
  );
}
