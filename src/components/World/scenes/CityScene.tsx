import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../../stores/gameStore';
import { triggerMissionEvent } from '../../../utils/missionTracker';
import { registerColliders, clearColliders } from '../../../utils/colliders';
import { CITY_COLLIDERS } from '../../../utils/cityColliders';

// Building data: [x, z, width, depth, height, color]
//
// Road / sidewalk exclusion zones — NO building may overlap:
//   N-S road+sidewalk : x ∈ [-6, 6]   (road 8 wide + 2 sidewalk each side)
//   E-W road+sidewalk : z ∈ [-6, 6]
//
// City is divided into four quadrants by the two main roads:
//   NW quadrant : x < -6,  z < -6
//   NE quadrant : x >  6,  z < -6
//   SW quadrant : x < -6,  z >  6
//   SE quadrant : x >  6,  z >  6
//
// Key locations (hand-placed, excluded from this array):
//   ApartmentBuilding : x=-12, z=-14  (10w × 8d)
//   CyberCafe         : x= 12, z=-14  (10w × 8d)
//   ComputerStore     : x= 20, z=-14  ( 8w × 7d)
//
// All [x,z] centers below are confirmed to be outside the exclusion zones,
// and buildings are spaced ≥ 2 units apart from each other and from key locations.

const BUILDINGS: [number, number, number, number, number, string][] = [

  // ── NW QUADRANT  (Residential District) ──────────────────────────────────
  // Block row 1  (z ≈ -16 … -20, behind apartment strip)
  [-22, -18,  8, 8,  9, '#d4c5a9'],   // beside ApartmentBuilding on the left
  [-32, -18,  8, 8, 12, '#c8b89a'],
  [-42, -18,  8, 8,  8, '#e0d4c0'],

  // Block row 2  (z ≈ -28 … -32)
  [-22, -30,  8, 8, 10, '#d8cbb5'],
  [-32, -30, 10, 8, 14, '#cfc0a8'],
  [-44, -30,  8, 8,  8, '#c4b49a'],

  // Block row 3  (z ≈ -42 … -46, university area)
  [-22, -44, 10, 8,  8, '#d8c8a8'],
  [-34, -44, 14,10, 10, '#e0d0b0'],   // wide campus hall
  [-50, -44, 10, 8,  7, '#d4c4a4'],

  // Block south of E-W road (z ≈ +14 … +18)
  [-22, +16,  8, 8,  7, '#cfc0a8'],
  [-32, +16,  8, 8,  9, '#d4c5a9'],
  [-44, +16, 10, 8, 11, '#c8b89a'],

  // Block row 2 south  (z ≈ +28 … +32)
  [-22, +30,  8, 8,  8, '#d8cbb5'],
  [-34, +30, 10, 8, 10, '#e0d4c0'],

  // ── NE QUADRANT  (Shopping + Business District) ──────────────────────────
  // Shopping strip, same z-row as key locations (z ≈ -14 … -18)
  // Key locations occupy x 7→24, so start at x=28
  [30, -16,  8, 8,  5, '#e8e0d0'],
  [40, -16,  8, 8,  6, '#f0e8d8'],
  [50, -16, 10, 8,  5, '#e4dcc8'],

  // Business towers  (z ≈ -28 … -32)
  [28, -30, 10,10, 28, '#b8c8d8'],
  [40, -30, 10,10, 35, '#c0ccd8'],
  [52, -30, 10,10, 40, '#a8b8c8'],
  [64, -30, 12,10, 22, '#b0c0d0'],

  // Tech Park  (z ≈ -44 … -48)
  [28, -46, 12,10, 18, '#c8d8e8'],
  [42, -46, 10,10, 22, '#b8ccd8'],
  [54, -46, 12,10, 16, '#c0d0e0'],
  [66, -46, 10,10, 20, '#d0dce8'],

  // South of E-W road — mixed use  (z ≈ +14 … +18)
  [28, +16,  8, 8,  6, '#e8e0d0'],
  [38, +16,  8, 8,  8, '#ece4d4'],
  [50, +16, 10, 8,  5, '#f0e8d8'],

  // Industrial zone  (z ≈ +28 … +34)
  [30, +30, 14,12,  8, '#9a9a9a'],
  [46, +30, 16,12,  6, '#888888'],
  [64, +30, 14,12, 10, '#a0a0a0'],

  // ── SE QUADRANT  (Mixed low-rise) ────────────────────────────────────────
  [30, +46, 10, 8,  7, '#d8d0c0'],
  [42, +46, 10, 8,  9, '#c8c0b0'],
  [54, +46, 12, 8,  8, '#d4ccbc'],

  // ── SW QUADRANT  (Residential south) ─────────────────────────────────────
  [-22, +46, 10, 8,  8, '#d4c5a9'],
  [-34, +46, 10, 8,  7, '#c8b89a'],
  [-46, +46, 10, 8, 10, '#e0d4c0'],
];

// Entrance IDs matching BUILDINGS array order (mirrors PlayerController INTERACTABLES)
const BUILDING_ENTRANCE_IDS: string[] = [
  // NW Residential
  'building-res-nw-1', 'building-res-nw-2', 'building-res-nw-3',
  'building-res-nw-4', 'building-res-nw-5', 'building-res-nw-6',
  'building-uni-1', 'building-uni-hall', 'building-uni-3',
  'building-res-sw-1', 'building-res-sw-2', 'building-res-sw-3',
  'building-res-sw-4', 'building-res-sw-5',
  // NE Shopping + Business
  'building-shop-1', 'building-shop-2', 'building-shop-3',
  'building-biz-1', 'building-biz-2', 'building-biz-3', 'building-biz-4',
  'building-tech-1', 'building-tech-2', 'building-tech-3', 'building-tech-4',
  'building-mixed-1', 'building-mixed-2', 'building-mixed-3',
  'building-ind-1', 'building-ind-2', 'building-ind-3',
  // SE + SW
  'building-se-1', 'building-se-2', 'building-se-3',
  'building-sw-1', 'building-sw-2', 'building-sw-3',
];
const STREET_LIGHTS: [number, number][] = [
  [-5, -10], [5, -10], [-5, 10], [5, 10],
  [15, -10], [25, -10], [15, 10], [25, 10],
  [-15, -10], [-25, -10],
];

// Trees: [x, z]
// Rules: NO tree on x in [-4,4] (N-S road) or z in [-4,4] (E-W road).
// Trees are placed along sidewalk edges, park areas, and decorative city corners only.
const TREES: [number, number][] = [
  // Decorative corners near intersection (sidewalk edges, outside road zone)
  [-9, -9], [9, -9], [-9, 9], [9, 9],

  // Along N-S sidewalk edges (x ~ ±7, well outside road at x ±4)
  [-7, -18], [-7, -26], [-7, 18], [-7, 26],
  [7, -18],  [7, -26],  [7, 18],  [7, 26],

  // Along E-W sidewalk edges (z ~ ±7, well outside road at z ±4)
  [-18, -7], [-26, -7], [18, -7], [26, -7],
  [-18,  7], [-26,  7], [18,  7], [26,  7],

  // Park / open area clusters (far from roads)
  [-22, -22], [-18, -28], [-28, -18],
  [22,  22],  [18,  28],  [28,  18],
  [-22,  22], [-18,  28], [-28,  18],
  [22, -22],  [18, -28],  [28, -18],
];

function Building({ x, z, w, d, h, color, entranceId, isNearby }: {
  x: number; z: number; w: number; d: number; h: number; color: string;
  entranceId: string; isNearby: boolean;
}) {
  // Door is centred on the front face (+Z side in local space)
  const doorW = Math.min(1.4, w * 0.25);
  return (
    <group position={[x, 0, z]}>
      {/* Main body */}
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          color={color}
          roughness={0.7}
          metalness={0.05}
          emissive={isNearby ? '#ffffff' : '#000000'}
          emissiveIntensity={isNearby ? 0.06 : 0}
        />
      </mesh>
      {/* Roof detail */}
      <mesh position={[0, h + 0.1, 0]}>
        <boxGeometry args={[w + 0.2, 0.2, d + 0.2]} />
        <meshStandardMaterial color={new THREE.Color(color).multiplyScalar(0.8).getStyle()} roughness={0.8} />
      </mesh>
      {/* Windows */}
      {Array.from({ length: Math.floor(h / 3) }).map((_, row) =>
        Array.from({ length: Math.floor(w / 2.5) }).map((_, col) => (
          <mesh
            key={`${row}-${col}`}
            position={[-w / 2 + 1.2 + col * 2.5, 1.5 + row * 3, d / 2 + 0.01]}
          >
            <planeGeometry args={[0.8, 1.0]} />
            <meshStandardMaterial
              color="#1a2a3a"
              emissive={Math.random() > 0.3 ? '#ffcc44' : '#000000'}
              emissiveIntensity={0.3}
            />
          </mesh>
        ))
      )}
      {/* Door — centred on front face */}
      <mesh position={[0, 1.1, d / 2 + 0.02]} castShadow>
        <boxGeometry args={[doorW, 2.2, 0.1]} />
        <meshStandardMaterial
          color="#3a2a1a"
          roughness={0.7}
          emissive={isNearby ? '#ff8800' : '#000000'}
          emissiveIntensity={isNearby ? 0.4 : 0}
        />
      </mesh>
      {/* Door frame */}
      <mesh position={[0, 1.1, d / 2 + 0.01]}>
        <boxGeometry args={[doorW + 0.2, 2.4, 0.06]} />
        <meshStandardMaterial color="#555555" roughness={0.6} metalness={0.2} />
      </mesh>
      {/* Entrance glow light when nearby */}
      {isNearby && (
        <pointLight position={[0, 1.5, d / 2 + 1]} intensity={1.2} color="#ffcc44" distance={4} />
      )}
    </group>
  );
}

function StreetLight({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      {/* Pole */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.07, 5, 6]} />
        <meshStandardMaterial color="#555555" roughness={0.5} metalness={0.6} />
      </mesh>
      {/* Arm */}
      <mesh position={[0.4, 4.8, 0]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.03, 0.03, 0.8, 6]} />
        <meshStandardMaterial color="#555555" roughness={0.5} metalness={0.6} />
      </mesh>
      {/* Light head */}
      <mesh position={[0.7, 4.7, 0]}>
        <boxGeometry args={[0.3, 0.15, 0.2]} />
        <meshStandardMaterial color="#333333" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* Light */}
      <pointLight position={[0.7, 4.5, 0]} intensity={1.5} color="#ffe8a0" distance={12} castShadow />
    </group>
  );
}

function Tree({ x, z }: { x: number; z: number }) {
  const h = 2 + Math.random() * 1.5;
  return (
    <group position={[x, 0, z]}>
      {/* Trunk */}
      <mesh position={[0, h / 4, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.18, h / 2, 6]} />
        <meshStandardMaterial color="#6b4226" roughness={0.9} />
      </mesh>
      {/* Foliage */}
      <mesh position={[0, h * 0.75, 0]} castShadow>
        <sphereGeometry args={[0.8 + Math.random() * 0.4, 8, 6]} />
        <meshStandardMaterial color="#3a8a3a" roughness={0.9} />
      </mesh>
      <mesh position={[0, h * 0.6, 0]} castShadow>
        <sphereGeometry args={[0.6 + Math.random() * 0.3, 8, 6]} />
        <meshStandardMaterial color="#2d7a2d" roughness={0.9} />
      </mesh>
    </group>
  );
}

function AmbientVehicles() {  // Parked cars along roads
  const CARS: [number, number, number, string][] = [
    [6, 0, -5, '#c0392b'],
    [-6, 0, -5, '#2980b9'],
    [6, 0, 5, '#27ae60'],
    [-6, 0, 5, '#8e44ad'],
    [6, 0, 15, '#e67e22'],
    [-6, 0, 15, '#1abc9c'],
    [6, 0, -15, '#f39c12'],
    [-6, 0, -15, '#95a5a6'],
  ];

  return (
    <group>
      {CARS.map(([x, y, z, color], i) => (
        <group key={i} position={[x, y, z]}>
          {/* Car body */}
          <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.8, 0.6, 3.8]} />
            <meshStandardMaterial color={color} roughness={0.3} metalness={0.4} />
          </mesh>
          {/* Car roof */}
          <mesh position={[0, 0.85, -0.2]} castShadow>
            <boxGeometry args={[1.6, 0.5, 2.2]} />
            <meshStandardMaterial color={color} roughness={0.3} metalness={0.4} />
          </mesh>
          {/* Windshield */}
          <mesh position={[0, 0.85, 0.9]}>
            <boxGeometry args={[1.5, 0.45, 0.05]} />
            <meshStandardMaterial color="#87ceeb" transparent opacity={0.6} roughness={0} metalness={0.2} />
          </mesh>
          {/* Wheels */}
          {[[-0.9, 0.2, 1.2], [0.9, 0.2, 1.2], [-0.9, 0.2, -1.2], [0.9, 0.2, -1.2]].map(([wx, wy, wz], wi) => (
            <mesh key={wi} position={[wx, wy, wz]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.28, 0.28, 0.2, 12]} />
              <meshStandardMaterial color="#222222" roughness={0.9} />
            </mesh>
          ))}
          {/* Headlights */}
          <mesh position={[0.5, 0.4, 1.9]}>
            <boxGeometry args={[0.3, 0.15, 0.05]} />
            <meshStandardMaterial color="#fffaf0" emissive="#fffaf0" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[-0.5, 0.4, 1.9]}>
            <boxGeometry args={[0.3, 0.15, 0.05]} />
            <meshStandardMaterial color="#fffaf0" emissive="#fffaf0" emissiveIntensity={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Road() {
  return (
    <group>
      {/* Main road (N-S) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[8, 200]} />
        <meshStandardMaterial color="#444444" roughness={0.9} />
      </mesh>
      {/* Main road (E-W) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[200, 8]} />
        <meshStandardMaterial color="#444444" roughness={0.9} />
      </mesh>
      {/* Road markings */}
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -90 + i * 10]} receiveShadow>
          <planeGeometry args={[0.3, 3]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

export default function CityScene() {
  const cloudRef = useRef<THREE.Group>(null);
  const nearbyInteractable = useGameStore((s) => s.nearbyInteractable);

  // Register city colliders when this scene mounts; clear on unmount
  useEffect(() => {
    registerColliders('city', CITY_COLLIDERS);
    return () => clearColliders('city');
  }, []);

  useFrame((_, delta) => {
    if (cloudRef.current) {
      cloudRef.current.position.x += delta * 0.5;
      if (cloudRef.current.position.x > 100) cloudRef.current.position.x = -100;
    }
  });

  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#7ec850" roughness={0.9} />
      </mesh>

      {/* Sidewalks */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <planeGeometry args={[12, 200]} />
        <meshStandardMaterial color="#c8c0b0" roughness={0.8} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <planeGeometry args={[200, 12]} />
        <meshStandardMaterial color="#c8c0b0" roughness={0.8} />
      </mesh>

      {/* Roads */}
      <Road />

      {/* ── KEY LOCATIONS ─────────────────────────────────── */}

      {/* Cyber Cafe — Meridian Street */}
      <CyberCafe isNearby={nearbyInteractable === 'cyber-cafe'} />

      {/* Computer Store */}
      <ComputerStore isNearby={nearbyInteractable === 'computer-store'} />

      {/* Return to Apartment door */}
      <ApartmentBuilding isNearby={nearbyInteractable === 'apt-city-door'} />

      {/* Buildings */}
      {BUILDINGS.map(([x, z, w, d, h, color], i) => (
        <Building
          key={i} x={x} z={z} w={w} d={d} h={h} color={color}
          entranceId={BUILDING_ENTRANCE_IDS[i]}
          isNearby={nearbyInteractable === BUILDING_ENTRANCE_IDS[i]}
        />
      ))}

      {/* Street lights */}
      {STREET_LIGHTS.map(([x, z], i) => (
        <StreetLight key={i} x={x} z={z} />
      ))}

      {/* Trees */}
      {TREES.map(([x, z], i) => (
        <Tree key={i} x={x} z={z} />
      ))}

      {/* Ambient vehicles (parked) */}
      <AmbientVehicles />

      {/* Ambient crowd — decorative pedestrians across the city */}
      <AmbientCrowd />

      {/* Clouds */}
      <group ref={cloudRef} position={[0, 40, -50]}>
        {[0, 15, 30, -15, -30].map((x, i) => (
          <mesh key={i} position={[x, 0, 0]}>
            <sphereGeometry args={[4 + i * 0.5, 8, 6]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.85} roughness={1} />
          </mesh>
        ))}
      </group>

      {/* Ambient city sounds placeholder */}
    </group>
  );
}

// ── Ambient Crowd ──────────────────────────────────────────────────────────
//
// Each pedestrian has one of three behavior types:
//   'walker'  — patrols a short sidewalk path, pauses at each end
//   'idler'   — stands in one spot, slowly looks around
//   'sitter'  — permanently seated (bench / steps / curb), slight breathe bob
//
// Walkers: path is [startX, startZ, endX, endZ] along a sidewalk.
//   They walk A→B, idle briefly, walk B→A, idle, repeat.
// Idlers:  fixed position [x, z], face direction (radians).
// Sitters: fixed position [x, z], facing (radians), slight crouch offset.
//
// All positions respect road exclusion zones: x ∈ [-4,4], z ∈ [-4,4].

type CrowdBehavior = 'walker' | 'idler' | 'sitter';

interface WalkerDef {
  type: 'walker';
  ax: number; az: number;   // waypoint A
  bx: number; bz: number;   // waypoint B
  speed: number;
  idleSecs: number;         // pause at each end
  bodyColor: string;
  skinTone: string;
  phase: number;            // bob phase offset
}
interface IdlerDef {
  type: 'idler';
  x: number; z: number;
  facing: number;           // initial facing (radians)
  bodyColor: string;
  skinTone: string;
  phase: number;
}
interface SitterDef {
  type: 'sitter';
  x: number; z: number;
  facing: number;
  bodyColor: string;
  skinTone: string;
  phase: number;
}

type CrowdDef = WalkerDef | IdlerDef | SitterDef;

// ── Crowd definitions ─────────────────────────────────────────────────────
const CROWD_DEFS: CrowdDef[] = [

  // ── N-S west sidewalk walkers (x ≈ -7) ───────────────────────────────
  { type:'walker', ax:-7, az:-10, bx:-7, bz:-22, speed:1.4, idleSecs:1.5, bodyColor:'#5b8dd9', skinTone:'#f5c5a0', phase:0.0 },
  { type:'walker', ax:-7, az:-16, bx:-7, bz:-28, speed:1.1, idleSecs:2.0, bodyColor:'#c0392b', skinTone:'#e8b090', phase:1.2 },
  { type:'walker', ax:-7, az: 10, bx:-7, bz: 22, speed:1.3, idleSecs:1.0, bodyColor:'#16a085', skinTone:'#f0c8a8', phase:2.4 },
  { type:'walker', ax:-7, az: 16, bx:-7, bz: 28, speed:1.0, idleSecs:3.0, bodyColor:'#d35400', skinTone:'#f5c5a0', phase:3.6 },

  // ── N-S east sidewalk walkers (x ≈ +7) ───────────────────────────────
  { type:'walker', ax:7, az:-10, bx:7, bz:-22, speed:1.5, idleSecs:1.0, bodyColor:'#1abc9c', skinTone:'#f5c5a0', phase:0.6 },
  { type:'walker', ax:7, az:-16, bx:7, bz:-28, speed:1.2, idleSecs:2.5, bodyColor:'#9b59b6', skinTone:'#e8b090', phase:1.8 },
  { type:'walker', ax:7, az: 10, bx:7, bz: 22, speed:1.4, idleSecs:1.5, bodyColor:'#f39c12', skinTone:'#f0c8a8', phase:3.0 },
  { type:'walker', ax:7, az: 16, bx:7, bz: 28, speed:1.1, idleSecs:2.0, bodyColor:'#607d8b', skinTone:'#e8b090', phase:4.2 },

  // ── Shopping strip walkers (z ≈ -10, x varies) ───────────────────────
  { type:'walker', ax:10, az:-10, bx:28, bz:-10, speed:1.6, idleSecs:0.8, bodyColor:'#ff5722', skinTone:'#f5c5a0', phase:0.3 },
  { type:'walker', ax:14, az:-10, bx:36, bz:-10, speed:1.3, idleSecs:1.5, bodyColor:'#795548', skinTone:'#e8b090', phase:1.5 },
  { type:'walker', ax:18, az:-10, bx:40, bz:-10, speed:1.1, idleSecs:2.0, bodyColor:'#009688', skinTone:'#f0c8a8', phase:2.7 },

  // ── Residential west walkers (x ≈ -22) ───────────────────────────────
  { type:'walker', ax:-22, az:-16, bx:-22, bz:-30, speed:1.0, idleSecs:2.0, bodyColor:'#8bc34a', skinTone:'#f5c5a0', phase:0.9 },
  { type:'walker', ax:-32, az:-16, bx:-32, bz:-30, speed:1.2, idleSecs:1.5, bodyColor:'#2196f3', skinTone:'#e8b090', phase:2.1 },
  { type:'walker', ax:-22, az: 14, bx:-22, bz: 28, speed:1.1, idleSecs:2.5, bodyColor:'#e91e63', skinTone:'#f0c8a8', phase:3.3 },

  // ── University district walkers ────────────────────────────────────────
  { type:'walker', ax:-22, az:-40, bx:-44, bz:-40, speed:0.9, idleSecs:3.0, bodyColor:'#3f51b5', skinTone:'#f5c5a0', phase:1.1 },
  { type:'walker', ax:-28, az:-40, bx:-28, bz:-48, speed:1.0, idleSecs:2.0, bodyColor:'#4caf50', skinTone:'#e8b090', phase:2.3 },
  { type:'walker', ax:-36, az:-44, bx:-50, bz:-44, speed:0.8, idleSecs:4.0, bodyColor:'#f44336', skinTone:'#f0c8a8', phase:3.5 },

  // ── Business district walkers (NE deep) ───────────────────────────────
  { type:'walker', ax:28, az:-10, bx:50, bz:-10, speed:1.5, idleSecs:1.0, bodyColor:'#1a237e', skinTone:'#f5c5a0', phase:0.4 },
  { type:'walker', ax:30, az: 14, bx:50, bz: 14, speed:1.3, idleSecs:1.5, bodyColor:'#0d47a1', skinTone:'#e8b090', phase:1.6 },
  { type:'walker', ax:28, az:-28, bx:50, bz:-28, speed:1.1, idleSecs:2.0, bodyColor:'#880e4f', skinTone:'#f0c8a8', phase:2.8 },

  // ── Café idlers — standing outside CyberCafe ──────────────────────────
  { type:'idler', x:10, z:-12, facing: 0.3, bodyColor:'#3f51b5', skinTone:'#f5c5a0', phase:0.6 },
  { type:'idler', x:14, z:-12, facing:-0.4, bodyColor:'#ff9800', skinTone:'#e8b090', phase:1.8 },
  { type:'idler', x:16, z:-10, facing: 1.0, bodyColor:'#e91e63', skinTone:'#f0c8a8', phase:3.0 },

  // ── Shop door idlers (Chen's Tech) ────────────────────────────────────
  { type:'idler', x:22, z:-10, facing: 0.0, bodyColor:'#00bcd4', skinTone:'#f5c5a0', phase:4.2 },
  { type:'idler', x:24, z:-12, facing:-0.8, bodyColor:'#8d6e63', skinTone:'#e8b090', phase:5.4 },

  // ── Park idlers (green open areas) ────────────────────────────────────
  { type:'idler', x:-24, z:-24, facing: 0.5, bodyColor:'#558b2f', skinTone:'#f5c5a0', phase:1.0 },
  { type:'idler', x: 24, z: 24, facing:-0.5, bodyColor:'#37474f', skinTone:'#f0c8a8', phase:2.2 },
  { type:'idler', x:-24, z: 24, facing: 1.2, bodyColor:'#4a148c', skinTone:'#e8b090', phase:3.4 },
  { type:'idler', x: 24, z:-24, facing:-1.0, bodyColor:'#bf360c', skinTone:'#f0c8a8', phase:4.6 },

  // ── Bench / curb sitters ──────────────────────────────────────────────
  // Outside Cyber Cafe (facing road)
  { type:'sitter', x:10, z:-10, facing: Math.PI * 0.5, bodyColor:'#5c6bc0', skinTone:'#f5c5a0', phase:0.2 },
  { type:'sitter', x:13, z:-10, facing: Math.PI * 0.5, bodyColor:'#26a69a', skinTone:'#e8b090', phase:1.4 },
  // University steps (facing campus)
  { type:'sitter', x:-22, z:-42, facing: Math.PI,       bodyColor:'#7e57c2', skinTone:'#f0c8a8', phase:2.6 },
  { type:'sitter', x:-26, z:-42, facing: Math.PI,       bodyColor:'#ef5350', skinTone:'#f5c5a0', phase:3.8 },
  { type:'sitter', x:-30, z:-42, facing: Math.PI,       bodyColor:'#66bb6a', skinTone:'#e8b090', phase:5.0 },
  // Park bench area
  { type:'sitter', x:-20, z:-20, facing: Math.PI * 0.25, bodyColor:'#ffa726', skinTone:'#f0c8a8', phase:1.7 },
  { type:'sitter', x: 20, z: 20, facing:-Math.PI * 0.75, bodyColor:'#42a5f5', skinTone:'#f5c5a0', phase:2.9 },
  // Apartment steps
  { type:'sitter', x:-14, z:-10, facing: Math.PI * 0.5, bodyColor:'#ab47bc', skinTone:'#e8b090', phase:4.1 },
];

// ── Runtime state for walkers ─────────────────────────────────────────────
interface WalkerState {
  pos: THREE.Vector3;
  goingToB: boolean;
  behavior: 'walking' | 'idle';
  idleTimer: number;
  facing: number;
}

// ── AmbientCrowd component ────────────────────────────────────────────────
function AmbientCrowd() {
  // One ref per crowd member — indexed by CROWD_DEFS array index
  const meshRefs    = useRef<(THREE.Group | null)[]>([]);
  const walkerState = useRef<(WalkerState | null)[]>([]);

  // Initialise walker states once
  useEffect(() => {
    CROWD_DEFS.forEach((def, i) => {
      if (def.type !== 'walker') { walkerState.current[i] = null; return; }
      walkerState.current[i] = {
        pos:       new THREE.Vector3(def.ax, 0, def.az),
        goingToB:  true,
        behavior:  'walking',
        idleTimer: 0,
        facing:    0,
      };
    });
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    CROWD_DEFS.forEach((def, i) => {
      const mesh = meshRefs.current[i];
      if (!mesh) return;

      if (def.type === 'sitter') {
        // Sitters: breathe only — tiny y oscillation
        const breathe = Math.sin(t * 1.2 + def.phase) * 0.008;
        mesh.position.y = breathe;
        return;
      }

      if (def.type === 'idler') {
        // Idlers: stand and slowly look around
        mesh.rotation.y = def.facing + Math.sin(t * 0.35 + def.phase) * 0.45;
        const breathe    = Math.sin(t * 1.5 + def.phase) * 0.012;
        mesh.position.y  = breathe;
        return;
      }

      // Walker
      const ws = walkerState.current[i];
      if (!ws) return;

      if (ws.behavior === 'idle') {
        ws.idleTimer -= delta;
        // Look around while waiting
        mesh.rotation.y = ws.facing + Math.sin(t * 0.4 + def.phase) * 0.3;
        mesh.position.y = Math.sin(t * 1.8 + def.phase) * 0.012;
        if (ws.idleTimer <= 0) {
          ws.goingToB = !ws.goingToB;
          ws.behavior = 'walking';
        }
        return;
      }

      // Compute target
      const tx = ws.goingToB ? def.bx : def.ax;
      const tz = ws.goingToB ? def.bz : def.az;
      const dx = tx - ws.pos.x;
      const dz = tz - ws.pos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 0.25) {
        // Arrived — idle
        ws.pos.set(tx, 0, tz);
        ws.behavior   = 'idle';
        ws.idleTimer  = def.idleSecs;
        mesh.position.set(tx, 0, tz);
      } else {
        const nx = dx / dist;
        const nz = dz / dist;
        ws.pos.x += nx * def.speed * delta;
        ws.pos.z += nz * def.speed * delta;

        // Smooth facing
        const targetAngle = Math.atan2(nx, nz);
        const diff = ((targetAngle - ws.facing + Math.PI) % (Math.PI * 2)) - Math.PI;
        ws.facing += diff * Math.min(delta * 8, 1);
        mesh.rotation.y = ws.facing;

        // Walk bob
        const bob = Math.sin(t * 5 + def.phase) * 0.04;
        mesh.position.set(ws.pos.x, bob, ws.pos.z);
      }
    });
  });

  return (
    <group>
      {CROWD_DEFS.map((def, i) => {
        // Determine initial position and facing for static types
        const ix = def.type === 'walker' ? def.ax : def.x;
        const iz = def.type === 'walker' ? def.az : def.z;
        const initFacing = def.type === 'sitter' || def.type === 'idler' ? def.facing : 0;
        // Sitters crouch slightly
        const crouchY = def.type === 'sitter' ? -0.22 : 0;

        return (
          <group
            key={i}
            ref={(ref) => { meshRefs.current[i] = ref; }}
            position={[ix, 0, iz]}
            rotation-y={initFacing}
          >
            {/* Legs */}
            <mesh position={[-0.09, 0.28 + crouchY, 0]} castShadow>
              <boxGeometry args={[0.15, 0.5, 0.15]} />
              <meshStandardMaterial color={def.bodyColor} roughness={0.85} />
            </mesh>
            <mesh position={[ 0.09, 0.28 + crouchY, 0]} castShadow>
              <boxGeometry args={[0.15, 0.5, 0.15]} />
              <meshStandardMaterial color={def.bodyColor} roughness={0.85} />
            </mesh>
            {/* Torso */}
            <mesh position={[0, 0.80 + crouchY, 0]} castShadow>
              <boxGeometry args={[0.4, 0.5, 0.22]} />
              <meshStandardMaterial color={def.bodyColor} roughness={0.75} />
            </mesh>
            {/* Head */}
            <mesh position={[0, 1.22 + crouchY, 0]} castShadow>
              <sphereGeometry args={[0.18, 8, 8]} />
              <meshStandardMaterial color={def.skinTone} roughness={0.8} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ── Key Location Components ────────────────────────────────────────────────

function CyberCafe({ isNearby }: { isNearby: boolean }) {
  // Position: dekat persimpangan utama, mudah ditemukan
  return (
    <group position={[12, 0, -14]}>
      {/* Main building */}
      <mesh position={[0, 3, 0]} castShadow receiveShadow>
        <boxGeometry args={[10, 6, 8]} />
        <meshStandardMaterial
          color="#e8d5b0"
          roughness={0.7}
          emissive={isNearby ? '#2a1a00' : '#000000'}
          emissiveIntensity={isNearby ? 0.3 : 0}
        />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 6.2, 0]}>
        <boxGeometry args={[10.4, 0.4, 8.4]} />
        <meshStandardMaterial color="#c8a870" roughness={0.8} />
      </mesh>
      {/* Sign board */}
      <mesh position={[0, 5.5, 4.1]}>
        <boxGeometry args={[7, 1.2, 0.15]} />
        <meshStandardMaterial
          color="#1a0a00"
          emissive="#ff8800"
          emissiveIntensity={0.8}
        />
      </mesh>
      {/* Sign text */}
      <Text
        position={[0, 5.5, 4.3]}
        fontSize={0.5}
        color="#ffcc44"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000"
      >
        MERIDIAN CYBER CAFE
      </Text>
      {/* Door */}
      <mesh position={[0, 1.1, 4.05]} castShadow>
        <boxGeometry args={[1.2, 2.2, 0.1]} />
        <meshStandardMaterial color="#5c3d1e" roughness={0.7} />
      </mesh>
      {/* Windows */}
      {[-2.5, 2.5].map((x, i) => (
        <mesh key={i} position={[x, 2.5, 4.05]}>
          <boxGeometry args={[2.5, 1.8, 0.05]} />
          <meshStandardMaterial color="#87ceeb" transparent opacity={0.5} roughness={0} />
        </mesh>
      ))}
      {/* Cafe glow light */}
      <pointLight position={[0, 3, 3]} intensity={isNearby ? 1.5 : 0.5} color="#ff8800" distance={8} />
      {/* Interaction label */}
      {isNearby && (
        <Text
          position={[0, 7.5, 0]}
          fontSize={0.35}
          color="#ffcc44"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000"
        >
          Meridian Cyber Cafe
        </Text>
      )}
    </group>
  );
}

function ComputerStore({ isNearby }: { isNearby: boolean }) {
  return (
    <group position={[20, 0, -14]}>
      {/* Main building */}
      <mesh position={[0, 3, 0]} castShadow receiveShadow>
        <boxGeometry args={[8, 6, 7]} />
        <meshStandardMaterial
          color="#d0e8f0"
          roughness={0.6}
          emissive={isNearby ? '#001a2a' : '#000000'}
          emissiveIntensity={isNearby ? 0.3 : 0}
        />
      </mesh>
      {/* Sign */}
      <mesh position={[0, 5.5, 3.6]}>
        <boxGeometry args={[6, 1.0, 0.15]} />
        <meshStandardMaterial color="#0a1a2a" emissive="#0088ff" emissiveIntensity={0.6} />
      </mesh>
      <Text
        position={[0, 5.5, 3.8]}
        fontSize={0.4}
        color="#44aaff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000"
      >
        CHEN'S TECH
      </Text>
      {/* Door */}
      <mesh position={[0, 1.1, 3.55]}>
        <boxGeometry args={[1.2, 2.2, 0.1]} />
        <meshStandardMaterial color="#2a3a4a" roughness={0.5} metalness={0.3} />
      </mesh>
      <pointLight position={[0, 3, 2.5]} intensity={isNearby ? 1.2 : 0.4} color="#0088ff" distance={6} />
      {isNearby && (
        <Text
          position={[0, 7.2, 0]}
          fontSize={0.35}
          color="#44aaff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000"
        >
          Chen's Tech Store
        </Text>
      )}
    </group>
  );
}

function ApartmentBuilding({ isNearby }: { isNearby: boolean }) {
  return (
    <group position={[-12, 0, -14]}>
      <mesh position={[0, 6, 0]} castShadow receiveShadow>
        <boxGeometry args={[10, 12, 8]} />
        <meshStandardMaterial color="#c8b89a" roughness={0.8} />
      </mesh>
      <mesh position={[0, 12.2, 0]}>
        <boxGeometry args={[10.4, 0.4, 8.4]} />
        <meshStandardMaterial color="#b0a080" roughness={0.8} />
      </mesh>
      {/* Sign */}
      <Text
        position={[0, 11, 4.1]}
        fontSize={0.35}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#000"
      >
        MERIDIAN APARTMENTS
      </Text>
      {/* Door */}
      <mesh position={[0, 1.1, 4.05]} castShadow>
        <boxGeometry args={[1.4, 2.2, 0.1]} />
        <meshStandardMaterial
          color="#6b4226"
          roughness={0.7}
          emissive={isNearby ? '#ff8800' : '#000000'}
          emissiveIntensity={isNearby ? 0.5 : 0}
        />
      </mesh>
      {/* Door frame */}
      <mesh position={[0, 1.1, 4.04]}>
        <boxGeometry args={[1.6, 2.4, 0.06]} />
        <meshStandardMaterial color="#555555" roughness={0.6} metalness={0.2} />
      </mesh>
      {isNearby && (
        <pointLight position={[0, 1.5, 5.5]} intensity={1.2} color="#ffcc44" distance={4} />
      )}
      {/* Windows */}
      {[-3, 0, 3].map((x) =>
        [3, 6, 9].map((y, j) => (
          <mesh key={`${x}-${y}`} position={[x, y, 4.05]}>
            <boxGeometry args={[1.5, 1.2, 0.05]} />
            <meshStandardMaterial
              color="#1a2a3a"
              emissive="#ffcc44"
              emissiveIntensity={j === 0 ? 0.4 : 0.2}
            />
          </mesh>
        ))
      )}
    </group>
  );
}
