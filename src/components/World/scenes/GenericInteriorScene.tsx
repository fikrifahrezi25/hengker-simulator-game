/**
 * GenericInteriorScene.tsx
 *
 * A reusable interior scene for all generic city buildings.
 * Appearance adapts based on the `buildingType` prop derived from the location id:
 *   'res'   → warm residential lobby
 *   'uni'   → bright university hallway
 *   'biz'   → sleek corporate lobby
 *   'tech'  → cool tech-park atrium
 *   'shop'  → retail shop floor
 *   'ind'   → industrial warehouse entry
 *   default → neutral lobby
 *
 * All interiors share the same layout: box room with walls, ceiling, floor,
 * a few props, and an exit door at z = +5 that returns to the city.
 */

import { useEffect } from 'react';
import { Text } from '@react-three/drei';
import { useGameStore } from '../../../stores/gameStore';
import { registerColliders, clearColliders, boxFromCenter } from '../../../utils/colliders';

type BuildingType = 'res' | 'uni' | 'biz' | 'tech' | 'shop' | 'ind' | 'default';

function detectType(location: string): BuildingType {
  if (location.includes('res'))   return 'res';
  if (location.includes('uni'))   return 'uni';
  if (location.includes('biz'))   return 'biz';
  if (location.includes('tech'))  return 'tech';
  if (location.includes('shop'))  return 'shop';
  if (location.includes('ind'))   return 'ind';
  return 'default';
}

interface ThemeConfig {
  floorColor: string;
  wallColor: string;
  ceilColor: string;
  accentColor: string;  // emissive accent
  lightColor: string;
  buildingName: string;
  props: 'residential' | 'office' | 'industrial' | 'retail';
}

const THEMES: Record<BuildingType, ThemeConfig> = {
  res: {
    floorColor: '#c8b898', wallColor: '#e8e0d0', ceilColor: '#f0ece4',
    accentColor: '#ffcc44', lightColor: '#fff8e0',
    buildingName: 'Residential Block',
    props: 'residential',
  },
  uni: {
    floorColor: '#d0c8a0', wallColor: '#e0d8c0', ceilColor: '#f0ecdc',
    accentColor: '#88ccff', lightColor: '#f0f8ff',
    buildingName: 'University Building',
    props: 'office',
  },
  biz: {
    floorColor: '#b8c8d8', wallColor: '#1a2a3a', ceilColor: '#0f1a28',
    accentColor: '#0088ff', lightColor: '#88ccff',
    buildingName: 'Corporate Lobby',
    props: 'office',
  },
  tech: {
    floorColor: '#c0d0e0', wallColor: '#1a2030', ceilColor: '#101520',
    accentColor: '#00ff99', lightColor: '#88ffcc',
    buildingName: 'Tech Park Building',
    props: 'office',
  },
  shop: {
    floorColor: '#e0d8c0', wallColor: '#f0e8d0', ceilColor: '#fffaf0',
    accentColor: '#ff8800', lightColor: '#ffe0a0',
    buildingName: 'Shop',
    props: 'retail',
  },
  ind: {
    floorColor: '#888888', wallColor: '#606060', ceilColor: '#505050',
    accentColor: '#ffaa00', lightColor: '#ffcc66',
    buildingName: 'Industrial Facility',
    props: 'industrial',
  },
  default: {
    floorColor: '#c0b8a8', wallColor: '#d8d0c0', ceilColor: '#e8e0d4',
    accentColor: '#ffcc44', lightColor: '#fff8e0',
    buildingName: 'Building',
    props: 'residential',
  },
};

const GENERIC_COLLIDERS = [
  boxFromCenter( 0,  -4.9, 5.0, 0.3, 'wall-back'),
  boxFromCenter(-4.5, 0,   0.3, 5.0, 'wall-left'),
  boxFromCenter( 4.5, 0,   0.3, 5.0, 'wall-right'),
  // Reception desk
  boxFromCenter( 0,  -2.2, 2.5, 0.7, 'reception'),
];

export default function GenericInteriorScene() {
  const currentLocation = useGameStore((s) => s.currentLocation);
  const nearbyInteractable = useGameStore((s) => s.nearbyInteractable);
  const setNearbyInteractable = useGameStore((s) => s.setNearbyInteractable);

  const type    = detectType(currentLocation);
  const theme   = THEMES[type];
  const atExit  = nearbyInteractable === 'interior-exit';

  useEffect(() => {
    registerColliders('interior', GENERIC_COLLIDERS);
    setNearbyInteractable(null);
    return () => clearColliders('interior');
  }, [currentLocation, setNearbyInteractable]);

  return (
    <group>
      {/* ── Lighting ───────────────────────────────────────── */}
      <ambientLight intensity={0.6} color={theme.lightColor} />
      <pointLight position={[-2, 3.5, -1]} intensity={1.3} color={theme.lightColor} distance={10} castShadow />
      <pointLight position={[ 2, 3.5, -1]} intensity={1.3} color={theme.lightColor} distance={10} castShadow />
      <pointLight position={[ 0, 3.5,  2]} intensity={0.7} color={theme.lightColor} distance={8} />

      {/* ── Floor ──────────────────────────────────────────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color={theme.floorColor} roughness={0.7} />
      </mesh>

      {/* ── Ceiling ────────────────────────────────────────── */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 4.2, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color={theme.ceilColor} roughness={1} />
      </mesh>
      {/* Ceiling light fixture */}
      <mesh position={[0, 4.1, 0]}>
        <boxGeometry args={[1.2, 0.06, 0.4]} />
        <meshStandardMaterial color={theme.lightColor} emissive={theme.lightColor} emissiveIntensity={0.6} />
      </mesh>

      {/* ── Walls ──────────────────────────────────────────── */}
      <mesh position={[0, 2.1, -5]} receiveShadow>
        <planeGeometry args={[10, 4.2]} />
        <meshStandardMaterial color={theme.wallColor} roughness={0.8} />
      </mesh>
      <mesh position={[-5, 2.1, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[10, 4.2]} />
        <meshStandardMaterial color={theme.wallColor} roughness={0.8} />
      </mesh>
      <mesh position={[5, 2.1, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[10, 4.2]} />
        <meshStandardMaterial color={theme.wallColor} roughness={0.8} />
      </mesh>
      {/* Front wall — left and right of exit door */}
      <mesh position={[-3.2, 2.1, 5]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[3.6, 4.2]} />
        <meshStandardMaterial color={theme.wallColor} roughness={0.8} />
      </mesh>
      <mesh position={[3.2, 2.1, 5]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[3.6, 4.2]} />
        <meshStandardMaterial color={theme.wallColor} roughness={0.8} />
      </mesh>

      {/* ── Building name sign ─────────────────────────────── */}
      <mesh position={[0, 3.3, -4.9]}>
        <boxGeometry args={[4, 0.55, 0.08]} />
        <meshStandardMaterial color={theme.wallColor} emissive={theme.accentColor} emissiveIntensity={0.3} />
      </mesh>
      <Text position={[0, 3.3, -4.8]} fontSize={0.26} color={theme.accentColor}
        anchorX="center" anchorY="middle" outlineWidth={0.01} outlineColor="#000">
        {theme.buildingName.toUpperCase()}
      </Text>

      {/* ── Reception / lobby desk ─────────────────────────── */}
      <mesh position={[0, 0.85, -2.2]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 0.08, 0.7]} />
        <meshStandardMaterial color={theme.wallColor} roughness={0.5} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.48, -2.5]} castShadow>
        <boxGeometry args={[2.5, 0.88, 0.1]} />
        <meshStandardMaterial color={theme.wallColor} roughness={0.6} />
      </mesh>

      {/* ── Type-specific props ────────────────────────────── */}
      {theme.props === 'residential' && (
        <>
          {/* Mailboxes on left wall */}
          {[-1.5, -0.5, 0.5, 1.5].map((z, i) => (
            <mesh key={i} position={[-4.6, 1.2, z]} castShadow>
              <boxGeometry args={[0.08, 0.22, 0.18]} />
              <meshStandardMaterial color="#888888" roughness={0.4} metalness={0.5} />
            </mesh>
          ))}
          {/* Notice board on right wall */}
          <mesh position={[4.6, 1.8, 0]}>
            <boxGeometry args={[0.06, 1.0, 1.4]} />
            <meshStandardMaterial color="#c8a060" roughness={0.7} />
          </mesh>
          <mesh position={[4.55, 1.8, 0]}>
            <boxGeometry args={[0.04, 0.88, 1.25]} />
            <meshStandardMaterial color="#fffae8" roughness={0.5} />
          </mesh>
        </>
      )}

      {theme.props === 'office' && (
        <>
          {/* Potted plants */}
          {[-3.5, 3.5].map((x) => (
            <group key={x} position={[x, 0, 1]}>
              <mesh position={[0, 0.2, 0]} castShadow>
                <cylinderGeometry args={[0.22, 0.28, 0.4, 8]} />
                <meshStandardMaterial color="#8a6a3a" roughness={0.8} />
              </mesh>
              <mesh position={[0, 0.65, 0]} castShadow>
                <sphereGeometry args={[0.35, 8, 6]} />
                <meshStandardMaterial color="#3a8a3a" roughness={0.9} />
              </mesh>
            </group>
          ))}
          {/* Waiting chairs */}
          {[-1.5, 0, 1.5].map((x) => (
            <group key={x} position={[x, 0, 2.5]}>
              <mesh position={[0, 0.45, 0]} castShadow>
                <boxGeometry args={[0.55, 0.06, 0.55]} />
                <meshStandardMaterial color="#2a2a3a" roughness={0.8} />
              </mesh>
              <mesh position={[0, 0.75, -0.25]} castShadow>
                <boxGeometry args={[0.55, 0.55, 0.06]} />
                <meshStandardMaterial color="#2a2a3a" roughness={0.8} />
              </mesh>
            </group>
          ))}
        </>
      )}

      {theme.props === 'industrial' && (
        <>
          {/* Warning stripes on floor */}
          {[-3, 0, 3].map((x) => (
            <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, -1]}>
              <planeGeometry args={[0.3, 4]} />
              <meshStandardMaterial color="#ffaa00" roughness={0.9} />
            </mesh>
          ))}
          {/* Barrels */}
          {[-3.5, 3.5].map((x) => (
            <mesh key={x} position={[x, 0.5, -3.5]} castShadow>
              <cylinderGeometry args={[0.35, 0.35, 1.0, 10]} />
              <meshStandardMaterial color="#4a6a2a" roughness={0.7} metalness={0.2} />
            </mesh>
          ))}
        </>
      )}

      {theme.props === 'retail' && (
        <>
          {/* Product racks */}
          {[-3, 3].map((x) => (
            <group key={x} position={[x, 0, -1]}>
              <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.2, 2.4, 1.6]} />
                <meshStandardMaterial color="#888880" roughness={0.6} metalness={0.3} />
              </mesh>
              {[0.4, 1.0, 1.6].map((y, i) => (
                <mesh key={i} position={[0.06 * Math.sign(x), y, 0]} castShadow>
                  <boxGeometry args={[0.12, 0.25, 0.35]} />
                  <meshStandardMaterial
                    color={['#c03020', '#2060c0', '#20a030'][i]}
                    roughness={0.6}
                  />
                </mesh>
              ))}
            </group>
          ))}
        </>
      )}

      {/* ── Exit door ──────────────────────────────────────── */}
      <mesh position={[0, 1.15, 4.92]} castShadow>
        <boxGeometry args={[1.4, 2.3, 0.12]} />
        <meshStandardMaterial
          color="#5a4a3a"
          roughness={0.7}
          emissive={atExit ? theme.accentColor : '#000'}
          emissiveIntensity={atExit ? 0.5 : 0}
        />
      </mesh>
      <mesh position={[0, 1.15, 4.91]}>
        <boxGeometry args={[1.6, 2.5, 0.06]} />
        <meshStandardMaterial color="#666" roughness={0.5} metalness={0.3} />
      </mesh>
      {atExit && (
        <pointLight position={[0, 2, 4]} intensity={1.0} color={theme.accentColor} distance={4} />
      )}
      {/* EXIT sign */}
      <mesh position={[0, 3.05, 4.9]}>
        <boxGeometry args={[1.2, 0.35, 0.08]} />
        <meshStandardMaterial color="#003300" emissive="#00cc00" emissiveIntensity={0.8} />
      </mesh>
      <Text position={[0, 3.05, 4.85]} fontSize={0.18} color="#ffffff"
        anchorX="center" anchorY="middle" outlineWidth={0.005} outlineColor="#000">
        EXIT
      </Text>
    </group>
  );
}
