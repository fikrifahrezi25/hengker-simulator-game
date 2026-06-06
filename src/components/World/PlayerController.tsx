import { useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../stores/gameStore';
import { triggerMissionEvent } from '../../utils/missionTracker';
import { getColliders, resolveCollision } from '../../utils/colliders';

const WALK_SPEED = 5;
const SPRINT_SPEED = 10;
const PLAYER_HEIGHT = 1.7;
const PLAYER_RADIUS = 0.35;

// ── Entrance trigger radius ────────────────────────────────────────────────
// How close the player must be to a door to see [E] Enter.
const ENTRANCE_RADIUS = 2.2;

// ── Interactable zones ─────────────────────────────────────────────────────
// Apartment-only items + all city building entrances.
// Door positions are at the front face (+Z) centre of each building.
//   CyberCafe         : center (12,-14), front z = -14+4 = -10 → door at (12,-10)
//   ComputerStore     : center (20,-14), front z = -14+3.5=-10.5 → door at (20,-10.5)
//   ApartmentBuilding : center(-12,-14), front z = -14+4 = -10 → door at (-12,-10)
//
// Generic BUILDINGS door positions — each building's front face is at
//   z_building - depth/2  (buildings face south, i.e. toward +Z in local space,
//   but the front face with the door is the one closest to the sidewalk).
//   For NW/NE quadrant buildings (z negative) the front face is the +Z face
//   (higher z value). For SW/SE (z positive) the front face is the -Z face.
//   We place the trigger 1.5 units in front of the face so it's reachable
//   without touching the wall.
const INTERACTABLES: { id: string; pos: THREE.Vector3; radius: number }[] = [
  // ── Apartment interior items ──────────────────────────────────────────
  { id: 'home-computer',  pos: new THREE.Vector3( 0, PLAYER_HEIGHT, -3), radius: 2.5 },
  { id: 'apartment-door', pos: new THREE.Vector3( 5, PLAYER_HEIGHT,  7), radius: 2.0 },

  // ── Interior exit (all building interiors — door at z=+5) ─────────────
  { id: 'interior-exit',  pos: new THREE.Vector3( 0, PLAYER_HEIGHT,  4.5), radius: 2.0 },

  // ── Key location entrances (city) ─────────────────────────────────────
  { id: 'cyber-cafe',      pos: new THREE.Vector3( 12, PLAYER_HEIGHT, -8.5), radius: ENTRANCE_RADIUS },
  { id: 'computer-store',  pos: new THREE.Vector3( 20, PLAYER_HEIGHT, -9.0), radius: ENTRANCE_RADIUS },
  { id: 'apt-city-door',   pos: new THREE.Vector3(-12, PLAYER_HEIGHT, -8.5), radius: ENTRANCE_RADIUS },

  // ── Generic building entrances (NW residential, z-negative face) ──────
  { id: 'building-res-nw-1', pos: new THREE.Vector3(-22, PLAYER_HEIGHT, -13.5), radius: ENTRANCE_RADIUS },
  { id: 'building-res-nw-2', pos: new THREE.Vector3(-32, PLAYER_HEIGHT, -13.5), radius: ENTRANCE_RADIUS },
  { id: 'building-res-nw-3', pos: new THREE.Vector3(-42, PLAYER_HEIGHT, -13.5), radius: ENTRANCE_RADIUS },
  { id: 'building-res-nw-4', pos: new THREE.Vector3(-22, PLAYER_HEIGHT, -25.5), radius: ENTRANCE_RADIUS },
  { id: 'building-res-nw-5', pos: new THREE.Vector3(-32, PLAYER_HEIGHT, -25.5), radius: ENTRANCE_RADIUS },
  { id: 'building-res-nw-6', pos: new THREE.Vector3(-44, PLAYER_HEIGHT, -25.5), radius: ENTRANCE_RADIUS },

  // ── University buildings ──────────────────────────────────────────────
  { id: 'building-uni-1',  pos: new THREE.Vector3(-22, PLAYER_HEIGHT, -39.5), radius: ENTRANCE_RADIUS },
  { id: 'building-uni-hall', pos: new THREE.Vector3(-34, PLAYER_HEIGHT, -38.5), radius: ENTRANCE_RADIUS },
  { id: 'building-uni-3',  pos: new THREE.Vector3(-50, PLAYER_HEIGHT, -39.5), radius: ENTRANCE_RADIUS },

  // ── SW residential (z-positive face) ─────────────────────────────────
  { id: 'building-res-sw-1', pos: new THREE.Vector3(-22, PLAYER_HEIGHT, 11.5), radius: ENTRANCE_RADIUS },
  { id: 'building-res-sw-2', pos: new THREE.Vector3(-32, PLAYER_HEIGHT, 11.5), radius: ENTRANCE_RADIUS },
  { id: 'building-res-sw-3', pos: new THREE.Vector3(-44, PLAYER_HEIGHT, 11.5), radius: ENTRANCE_RADIUS },
  { id: 'building-res-sw-4', pos: new THREE.Vector3(-22, PLAYER_HEIGHT, 25.5), radius: ENTRANCE_RADIUS },
  { id: 'building-res-sw-5', pos: new THREE.Vector3(-34, PLAYER_HEIGHT, 25.5), radius: ENTRANCE_RADIUS },

  // ── NE shopping strip ─────────────────────────────────────────────────
  { id: 'building-shop-1', pos: new THREE.Vector3( 30, PLAYER_HEIGHT, -11.5), radius: ENTRANCE_RADIUS },
  { id: 'building-shop-2', pos: new THREE.Vector3( 40, PLAYER_HEIGHT, -11.5), radius: ENTRANCE_RADIUS },
  { id: 'building-shop-3', pos: new THREE.Vector3( 50, PLAYER_HEIGHT, -11.5), radius: ENTRANCE_RADIUS },

  // ── Business towers ───────────────────────────────────────────────────
  { id: 'building-biz-1',  pos: new THREE.Vector3( 28, PLAYER_HEIGHT, -24.5), radius: ENTRANCE_RADIUS },
  { id: 'building-biz-2',  pos: new THREE.Vector3( 40, PLAYER_HEIGHT, -24.5), radius: ENTRANCE_RADIUS },
  { id: 'building-biz-3',  pos: new THREE.Vector3( 52, PLAYER_HEIGHT, -24.5), radius: ENTRANCE_RADIUS },
  { id: 'building-biz-4',  pos: new THREE.Vector3( 64, PLAYER_HEIGHT, -24.5), radius: ENTRANCE_RADIUS },

  // ── Tech park ─────────────────────────────────────────────────────────
  { id: 'building-tech-1', pos: new THREE.Vector3( 28, PLAYER_HEIGHT, -40.5), radius: ENTRANCE_RADIUS },
  { id: 'building-tech-2', pos: new THREE.Vector3( 42, PLAYER_HEIGHT, -40.5), radius: ENTRANCE_RADIUS },
  { id: 'building-tech-3', pos: new THREE.Vector3( 54, PLAYER_HEIGHT, -40.5), radius: ENTRANCE_RADIUS },
  { id: 'building-tech-4', pos: new THREE.Vector3( 66, PLAYER_HEIGHT, -40.5), radius: ENTRANCE_RADIUS },

  // ── Mixed + industrial (SE, z-positive face) ──────────────────────────
  { id: 'building-mixed-1', pos: new THREE.Vector3( 28, PLAYER_HEIGHT, 11.5), radius: ENTRANCE_RADIUS },
  { id: 'building-mixed-2', pos: new THREE.Vector3( 38, PLAYER_HEIGHT, 11.5), radius: ENTRANCE_RADIUS },
  { id: 'building-mixed-3', pos: new THREE.Vector3( 50, PLAYER_HEIGHT, 11.5), radius: ENTRANCE_RADIUS },
  { id: 'building-ind-1',   pos: new THREE.Vector3( 30, PLAYER_HEIGHT, 23.5), radius: ENTRANCE_RADIUS },
  { id: 'building-ind-2',   pos: new THREE.Vector3( 46, PLAYER_HEIGHT, 23.5), radius: ENTRANCE_RADIUS },
  { id: 'building-ind-3',   pos: new THREE.Vector3( 64, PLAYER_HEIGHT, 23.5), radius: ENTRANCE_RADIUS },
  { id: 'building-se-1',    pos: new THREE.Vector3( 30, PLAYER_HEIGHT, 41.5), radius: ENTRANCE_RADIUS },
  { id: 'building-se-2',    pos: new THREE.Vector3( 42, PLAYER_HEIGHT, 41.5), radius: ENTRANCE_RADIUS },
  { id: 'building-se-3',    pos: new THREE.Vector3( 54, PLAYER_HEIGHT, 41.5), radius: ENTRANCE_RADIUS },
  { id: 'building-sw-1',    pos: new THREE.Vector3(-22, PLAYER_HEIGHT, 41.5), radius: ENTRANCE_RADIUS },
  { id: 'building-sw-2',    pos: new THREE.Vector3(-34, PLAYER_HEIGHT, 41.5), radius: ENTRANCE_RADIUS },
  { id: 'building-sw-3',    pos: new THREE.Vector3(-46, PLAYER_HEIGHT, 41.5), radius: ENTRANCE_RADIUS },
];

export default function PlayerController() {
  const { camera, gl } = useThree();
  const controlsRef = useRef<any>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const directionRef = useRef(new THREE.Vector3());
  // Reusable vectors — allocated once to avoid per-frame GC pressure
  const forwardRef = useRef(new THREE.Vector3());
  const rightRef   = useRef(new THREE.Vector3());
  const moveRef    = useRef(new THREE.Vector3());

  const setNearbyInteractable = useGameStore((s) => s.setNearbyInteractable);
  const sensitivity = useGameStore((s) => s.settings.mouseSensitivity);
  const currentLocation = useGameStore((s) => s.currentLocation);

  // Set initial position based on location
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
      store.setCurrentLocation('city');
      triggerMissionEvent({ type: 'location_visit', locationId: 'city' });
      camera.position.set(0, PLAYER_HEIGHT, 0);
    }

    // Exit any building interior → return to city (previousLocation)
    if (nearby === 'interior-exit') {
      const returnTo = store.previousLocation === 'city' ? 'city' : 'city';
      store.setCurrentLocation(returnTo);
      triggerMissionEvent({ type: 'location_visit', locationId: returnTo });
      camera.position.set(0, PLAYER_HEIGHT, 0);
    }

    // Return to apartment from city-side door
    if (nearby === 'apt-city-door') {
      store.setCurrentLocation('apartment');
      triggerMissionEvent({ type: 'location_visit', locationId: 'apartment' });
      camera.position.set(0, PLAYER_HEIGHT, 2);
    }

    // NPC interactions
    if (nearby && nearby.startsWith('npc-')) {
      store.setActiveDialogueNPC(nearby);
      controlsRef.current?.unlock();
    }

    // Named location entrances — load dedicated interior scene
    if (nearby === 'cyber-cafe') {
      triggerMissionEvent({ type: 'location_visit', locationId: 'cyber-cafe' });
      store.setCurrentLocation('cyber-cafe');
      camera.position.set(0, PLAYER_HEIGHT, 3);
    }

    if (nearby === 'computer-store') {
      triggerMissionEvent({ type: 'location_visit', locationId: 'computer-store' });
      store.setCurrentLocation('computer-store');
      camera.position.set(0, PLAYER_HEIGHT, 3);
    }

    // Generic building entrances — load generic interior with location id as context
    if (nearby && nearby.startsWith('building-')) {
      triggerMissionEvent({ type: 'location_visit', locationId: nearby });
      store.setCurrentLocation(nearby);
      camera.position.set(0, PLAYER_HEIGHT, 3);
    }
  }, [camera]);

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    keysRef.current.add(e.code);

    if (e.code === 'KeyE') handleInteract();

    if (e.code === 'Escape') {
      const store = useGameStore.getState();
      if (store.isUsingComputer)    store.setUsingComputer(false);
      if (store.activeDialogueNPC)  store.setActiveDialogueNPC(null);
    }
  }, [handleInteract]);

  const onKeyUp = useCallback((e: KeyboardEvent) => {
    keysRef.current.delete(e.code);
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup',   onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup',   onKeyUp);
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

      const forward = forwardRef.current;
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();

      const right = rightRef.current;
      right.crossVectors(forward, new THREE.Vector3(0, 1, 0));

      const move = moveRef.current;
      move.set(0, 0, 0);
      move.addScaledVector(forward, -dir.z);
      move.addScaledVector(right,    dir.x);
      move.normalize().multiplyScalar(speed * delta);

      camera.position.x += move.x;
      camera.position.z += move.z;
    }

    // ── Collision resolution ──────────────────────────────────────────────
    // Run AABB push-out against every registered collider for the current scene.
    resolveCollision(camera.position, PLAYER_RADIUS, getColliders());

    // ── Hard bounds per location ──────────────────────────────────────────
    camera.position.y = PLAYER_HEIGHT;

    const loc = useGameStore.getState().currentLocation;
    if (loc === 'apartment') {
      camera.position.x = THREE.MathUtils.clamp(camera.position.x, -6.3, 6.3);
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, -6.3, 7.8);
    } else {
      // City world bounds — keep player inside the rendered area
      camera.position.x = THREE.MathUtils.clamp(camera.position.x, -90, 90);
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, -90, 90);
    }

    // ── Interactable proximity check ──────────────────────────────────────
    let closest: string | null = null;
    let closestDist = Infinity;

    // Determine context
    const isInApartment = loc === 'apartment';
    const isInInterior  = !isInApartment && loc !== 'city';   // cafe, store, building-*

    for (const item of INTERACTABLES) {
      // Apartment-only
      if (item.id === 'apartment-door' && !isInApartment) continue;
      if (item.id === 'home-computer'  && !isInApartment) continue;
      // Interior-only (generic exit)
      if (item.id === 'interior-exit'  && !isInInterior)  continue;
      // City-only (entrances)
      const isCityItem = item.id !== 'apartment-door' &&
                         item.id !== 'home-computer'  &&
                         item.id !== 'interior-exit';
      if (isCityItem && loc !== 'city') continue;

      const dist = camera.position.distanceTo(item.pos);
      if (dist < item.radius && dist < closestDist) {
        closest     = item.id;
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
