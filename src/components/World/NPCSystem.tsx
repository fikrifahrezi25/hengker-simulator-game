import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../stores/gameStore';
import { NPCS_DATA } from '../../data/npcs';

// ── Sidewalk patrol routes for story NPCs ─────────────────────────────────
// Road exclusion: x ∈ [-4,4] (N-S road), z ∈ [-4,4] (E-W road).
// All waypoints are confirmed clear of road zones.
//
// Each waypoint carries an optional idleDuration (seconds) — how long the NPC
// pauses at that point before moving on.  This makes stops feel intentional:
// a character lingers at a shop door, sits at a bench spot, etc.
interface Waypoint {
  pos: THREE.Vector3;
  idleDuration: number; // seconds to wait before moving to next point
}

const NPC_ROUTES: Record<string, Waypoint[]> = {

  // Zara Voss — programmer, permanently inside Meridian Cyber Cafe.
  // Cafe building: position [12, 0, -14], size 10w × 8d
  //   → interior x: 8 → 16, z: -18 → -10  (with ~0.8 wall clearance)
  // She moves between her laptop table, the counter, and a window seat.
  // Long idle durations keep her seated most of the time.
  'npc-zara': [
    { pos: new THREE.Vector3(11,  0, -15), idleDuration: 12.0 }, // main table — working on laptop
    { pos: new THREE.Vector3(11,  0, -13), idleDuration:  3.0 }, // stands up, stretches
    { pos: new THREE.Vector3(14,  0, -13), idleDuration:  8.0 }, // counter — orders coffee
    { pos: new THREE.Vector3(14,  0, -16), idleDuration: 10.0 }, // window seat — reads screen
    { pos: new THREE.Vector3(11,  0, -16), idleDuration:  4.0 }, // walks back to table
  ],

  // Riko Tanaka — delivery driver, covers shopping strip at a brisk pace
  // Short idles simulate delivery drop-offs
  'npc-riko': [
    { pos: new THREE.Vector3( 8,  0, -14), idleDuration: 0.5 },
    { pos: new THREE.Vector3(14,  0, -14), idleDuration: 3.0 },  // stop — delivery
    { pos: new THREE.Vector3(20,  0, -14), idleDuration: 0.5 },
    { pos: new THREE.Vector3(28,  0, -14), idleDuration: 3.0 },  // stop — delivery
    { pos: new THREE.Vector3(28,  0, -10), idleDuration: 1.0 },  // turn
    { pos: new THREE.Vector3(18,  0, -10), idleDuration: 2.0 },  // checks app
    { pos: new THREE.Vector3( 8,  0, -10), idleDuration: 1.0 },
  ],

  // Leo Park — student, wanders residential/university area, stops to read
  'npc-leo': [
    { pos: new THREE.Vector3(-10,  0, -22), idleDuration: 1.0 },
    { pos: new THREE.Vector3(-16,  0, -22), idleDuration: 4.0 },  // reads notes
    { pos: new THREE.Vector3(-22,  0, -18), idleDuration: 0.5 },
    { pos: new THREE.Vector3(-22,  0, -30), idleDuration: 6.0 },  // long sit — studies
    { pos: new THREE.Vector3(-16,  0, -30), idleDuration: 1.0 },
    { pos: new THREE.Vector3(-10,  0, -22), idleDuration: 2.0 },  // looks around
  ],

  // Professor Hana Reyes — deliberate, slow walk between campus buildings
  'npc-hana': [
    { pos: new THREE.Vector3(-22,  0, -40), idleDuration: 8.0 },  // long office stop
    { pos: new THREE.Vector3(-28,  0, -40), idleDuration: 1.0 },
    { pos: new THREE.Vector3(-34,  0, -40), idleDuration: 2.0 },  // hallway chat spot
    { pos: new THREE.Vector3(-34,  0, -48), idleDuration: 6.0 },  // classroom stop
    { pos: new THREE.Vector3(-28,  0, -48), idleDuration: 1.0 },
    { pos: new THREE.Vector3(-22,  0, -48), idleDuration: 3.0 },  // reviews papers
  ],

  // Marcus Chen — shop owner, minimal movement — mostly inside or just outside door
  'npc-marcus': [
    { pos: new THREE.Vector3(20,  0, -10), idleDuration: 8.0 },  // stands outside shop
    { pos: new THREE.Vector3(22,  0, -10), idleDuration: 3.0 },  // adjusts sign
    { pos: new THREE.Vector3(24,  0, -10), idleDuration: 5.0 },  // talks to passerby
    { pos: new THREE.Vector3(24,  0, -14), idleDuration: 2.0 },  // checks delivery
    { pos: new THREE.Vector3(20,  0, -14), idleDuration: 4.0 },  // near door
    { pos: new THREE.Vector3(20,  0, -10), idleDuration: 6.0 },  // back to post
  ],
};

// ── Per-NPC behavior state ────────────────────────────────────────────────
type NPCBehavior = 'walking' | 'idle';

interface NPCMeshState {
  position: THREE.Vector3;
  target: THREE.Vector3;
  waypointIdx: number;
  speed: number;
  bobOffset: number;
  behavior: NPCBehavior;
  idleTimer: number;   // counts down while idle
  facing: number;      // current Y rotation (radians)
}

const NPC_COLORS: Record<string, string> = {
  'npc-zara':   '#4a90d9',  // blue — programmer
  'npc-riko':   '#e67e22',  // orange — delivery driver
  'npc-leo':    '#27ae60',  // green — student
  'npc-hana':   '#8e44ad',  // purple — professor
  'npc-marcus': '#c0392b',  // red — shop owner
};

// Skin tones per NPC for visual variety
const NPC_SKIN: Record<string, string> = {
  'npc-zara':   '#f5c5a0',
  'npc-riko':   '#c8844a',
  'npc-leo':    '#e8b888',
  'npc-hana':   '#f0c8a8',
  'npc-marcus': '#d4956a',
};

export default function NPCSystem() {
  const setNearbyInteractable = useGameStore((s) => s.setNearbyInteractable);
  const statesRef = useRef<Record<string, NPCMeshState>>({});
  const meshRefs  = useRef<Record<string, THREE.Group>>({});

  // ── Initialise NPC states ───────────────────────────────────────────────
  useEffect(() => {
    NPCS_DATA.forEach((npc) => {
      const route = NPC_ROUTES[npc.id];
      if (!route || route.length < 2) return;
      statesRef.current[npc.id] = {
        position:    route[0].pos.clone(),
        target:      route[1].pos.clone(),
        waypointIdx: 0,
        speed:       1.2 + Math.random() * 0.5,
        bobOffset:   Math.random() * Math.PI * 2,
        behavior:    'walking',
        idleTimer:   0,
        facing:      0,
      };
    });
  }, []);

  // ── Per-frame update ────────────────────────────────────────────────────
  useFrame((state, delta) => {
    const camera   = state.camera;
    const elapsed  = state.clock.elapsedTime;

    NPCS_DATA.forEach((npc) => {
      const s    = statesRef.current[npc.id];
      const mesh = meshRefs.current[npc.id];
      const route = NPC_ROUTES[npc.id];
      if (!s || !mesh || !route) return;

      // ── IDLE phase ───────────────────────────────────────────────────
      if (s.behavior === 'idle') {
        s.idleTimer -= delta;

        // Subtle look-around: slowly oscillate Y rotation while idling
        s.facing += Math.sin(elapsed * 0.4 + s.bobOffset) * delta * 0.3;
        mesh.rotation.y = s.facing;

        // Still bob gently (breathing / weight-shift)
        const idleBob = Math.sin(elapsed * 1.8 + s.bobOffset) * 0.015;
        mesh.position.set(s.position.x, idleBob, s.position.z);

        if (s.idleTimer <= 0) {
          // Advance to next waypoint
          s.waypointIdx = (s.waypointIdx + 1) % route.length;
          s.target      = route[s.waypointIdx].pos.clone();
          s.behavior    = 'walking';
        }
        // Proximity check even while idle
        checkProximity(camera, s, npc.id, setNearbyInteractable);
        return;
      }

      // ── WALKING phase ────────────────────────────────────────────────
      const dir  = s.target.clone().sub(s.position);
      const dist = dir.length();

      if (dist < 0.25) {
        // Arrived — enter idle at current waypoint
        s.position.copy(s.target);
        s.behavior   = 'idle';
        s.idleTimer  = route[s.waypointIdx].idleDuration;
        // Face the direction we were moving (keep last rotation)
      } else {
        dir.normalize();
        s.position.addScaledVector(dir, s.speed * delta);

        // Smooth rotation toward movement direction
        const targetAngle = Math.atan2(dir.x, dir.z);
        // Lerp rotation for smooth turning
        const angleDiff = targetAngle - s.facing;
        const wrappedDiff = ((angleDiff + Math.PI) % (Math.PI * 2)) - Math.PI;
        s.facing += wrappedDiff * Math.min(delta * 8, 1);
        mesh.rotation.y = s.facing;
      }

      // Walking bob — faster and more pronounced than idle
      const walkBob = Math.sin(elapsed * 5 + s.bobOffset) * 0.045;
      mesh.position.set(s.position.x, walkBob, s.position.z);

      checkProximity(camera, s, npc.id, setNearbyInteractable);
    });
  });

  return (
    <group>
      {NPCS_DATA.filter((npc) => NPC_ROUTES[npc.id]).map((npc) => {
        const bodyColor = NPC_COLORS[npc.id] ?? '#888888';
        const skinColor = NPC_SKIN[npc.id]   ?? '#f5d5b0';
        const route     = NPC_ROUTES[npc.id];
        if (!route) return null;

        return (
          <group
            key={npc.id}
            ref={(ref) => { if (ref) meshRefs.current[npc.id] = ref; }}
            position={[route[0].pos.x, 0, route[0].pos.z]}
          >
            {/* Legs — two boxes that give a human silhouette */}
            <mesh position={[-0.1, 0.3, 0]} castShadow>
              <boxGeometry args={[0.18, 0.55, 0.18]} />
              <meshStandardMaterial color={bodyColor} roughness={0.8} />
            </mesh>
            <mesh position={[ 0.1, 0.3, 0]} castShadow>
              <boxGeometry args={[0.18, 0.55, 0.18]} />
              <meshStandardMaterial color={bodyColor} roughness={0.8} />
            </mesh>
            {/* Torso */}
            <mesh position={[0, 0.85, 0]} castShadow>
              <boxGeometry args={[0.46, 0.55, 0.26]} />
              <meshStandardMaterial color={bodyColor} roughness={0.7} />
            </mesh>
            {/* Head */}
            <mesh position={[0, 1.35, 0]} castShadow>
              <sphereGeometry args={[0.22, 8, 8]} />
              <meshStandardMaterial color={skinColor} roughness={0.8} />
            </mesh>
            {/* Name tag — floats above head */}
            <Text
              position={[0, 1.85, 0]}
              fontSize={0.16}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.012}
              outlineColor="#000000"
            >
              {npc.name}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

// ── Helper ────────────────────────────────────────────────────────────────
function checkProximity(
  camera: THREE.Camera,
  s: NPCMeshState,
  npcId: string,
  setNearby: (id: string | null) => void,
) {
  const playerPos = camera.position.clone();
  playerPos.y = 0;
  if (playerPos.distanceTo(s.position) < 3) {
    const current = useGameStore.getState().nearbyInteractable;
    if (!current || current === npcId) setNearby(npcId);
  }
}
