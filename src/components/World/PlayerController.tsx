import { useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../stores/gameStore';
import { triggerMissionEvent } from '../../utils/missionTracker';

const WALK_SPEED = 5;
const SPRINT_SPEED = 10;
const PLAYER_HEIGHT = 1.7;

// Interactable zones: id → position + radius
const INTERACTABLES: { id: string; pos: THREE.Vector3; radius: number }[] = [
  { id: 'home-computer', pos: new THREE.Vector3(0, PLAYER_HEIGHT, -3),  radius: 2.5 },
  { id: 'apartment-door', pos: new THREE.Vector3(5, PLAYER_HEIGHT, 7),  radius: 2.0 },
];

export default function PlayerController() {
  const { camera, gl } = useThree();
  const controlsRef = useRef<any>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const directionRef = useRef(new THREE.Vector3());

  const setNearbyInteractable = useGameStore((s) => s.setNearbyInteractable);
  const sensitivity = useGameStore((s) => s.settings.mouseSensitivity);
  const currentLocation = useGameStore((s) => s.currentLocation);

  // Set initial position
  useEffect(() => {
    if (currentLocation === 'apartment') {
      camera.position.set(0, PLAYER_HEIGHT, 2);
    } else {
      camera.position.set(0, PLAYER_HEIGHT, 0);
    }
  }, [camera, currentLocation]);

  const handleInteract = useCallback(() => {
    const store = useGameStore.getState();
    const nearby = store.nearbyInteractable;

    if (nearby === 'home-computer') {
      store.setUsingComputer(true);
      controlsRef.current?.unlock();
      triggerMissionEvent({ type: 'computer_used' });
    }

    if (nearby === 'apartment-door') {
      // Keluar ke kota
      store.setCurrentLocation('city');
      triggerMissionEvent({ type: 'location_visit', locationId: 'city' });
      camera.position.set(0, PLAYER_HEIGHT, 0);
    }

    // NPC interactions (di kota)
    if (nearby && nearby.startsWith('npc-')) {
      store.setActiveDialogueNPC(nearby);
      controlsRef.current?.unlock();
    }

    // Location visits di kota
    if (nearby === 'cyber-cafe') {
      triggerMissionEvent({ type: 'location_visit', locationId: 'cyber-cafe' });
      store.setCurrentLocation('cyber-cafe');
    }
  }, [camera]);

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    keysRef.current.add(e.code);

    if (e.code === 'KeyE') {
      handleInteract();
    }

    if (e.code === 'Escape') {
      const store = useGameStore.getState();
      if (store.isUsingComputer) {
        store.setUsingComputer(false);
      }
      if (store.activeDialogueNPC) {
        store.setActiveDialogueNPC(null);
      }
    }
  }, [handleInteract]);

  const onKeyUp = useCallback((e: KeyboardEvent) => {
    keysRef.current.delete(e.code);
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [onKeyDown, onKeyUp]);

  useFrame((_, delta) => {
    if (!controlsRef.current?.isLocked) return;

    const keys = keysRef.current;
    const isSprinting = keys.has('ShiftLeft') || keys.has('ShiftRight');
    const speed = isSprinting ? SPRINT_SPEED : WALK_SPEED;

    const dir = directionRef.current;
    dir.set(0, 0, 0);

    if (keys.has('KeyW') || keys.has('ArrowUp'))    dir.z -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown'))  dir.z += 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft'))  dir.x -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) dir.x += 1;

    if (dir.lengthSq() > 0) {
      dir.normalize();
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();

      const right = new THREE.Vector3();
      right.crossVectors(forward, new THREE.Vector3(0, 1, 0));

      const move = new THREE.Vector3();
      move.addScaledVector(forward, -dir.z);
      move.addScaledVector(right, dir.x);
      move.normalize().multiplyScalar(speed * delta);
      camera.position.add(move);
    }

    camera.position.y = PLAYER_HEIGHT;

    // Bounds per location
    const loc = useGameStore.getState().currentLocation;
    if (loc === 'apartment') {
      camera.position.x = THREE.MathUtils.clamp(camera.position.x, -6, 6);
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, -6, 8);
    }

    // Check all interactables
    let closest: string | null = null;
    let closestDist = Infinity;

    for (const item of INTERACTABLES) {
      // Only show apartment-door when in apartment
      if (item.id === 'apartment-door' && loc !== 'apartment') continue;
      if (item.id === 'home-computer' && loc !== 'apartment') continue;

      const dist = camera.position.distanceTo(item.pos);
      if (dist < item.radius && dist < closestDist) {
        closest = item.id;
        closestDist = dist;
      }
    }

    setNearbyInteractable(closest);
  });

  return (
    <PointerLockControls
      ref={controlsRef}
      args={[camera, gl.domElement]}
      pointerSpeed={sensitivity}
    />
  );
}
