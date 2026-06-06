import { useEffect } from 'react';
import { Text } from '@react-three/drei';
import { useGameStore } from '../../../stores/gameStore';
import { registerColliders, clearColliders, boxFromCenter, boxFromSize } from '../../../utils/colliders';

// ── Colliders ─────────────────────────────────────────────────────────────
const CAFE_INTERIOR_COLLIDERS = [
  // Walls (back, left, right; front has exit door gap)
  boxFromCenter( 0,  -5.9, 5.5, 0.3, 'cafe-wall-back'),
  boxFromCenter(-5.5, 0,   0.3, 6.0, 'cafe-wall-left'),
  boxFromCenter( 5.5, 0,   0.3, 6.0, 'cafe-wall-right'),
  // Counter bar
  boxFromSize(  0,  -3.0,  7.0, 0.8, 'cafe-counter'),
  // Tables (4 two-seat tables)
  boxFromCenter(-3, -1.0,  1.2, 1.2, 'cafe-table-1'),
  boxFromCenter( 3, -1.0,  1.2, 1.2, 'cafe-table-2'),
  boxFromCenter(-3,  2.0,  1.2, 1.2, 'cafe-table-3'),
  boxFromCenter( 3,  2.0,  1.2, 1.2, 'cafe-table-4'),
];

export default function CyberCafeScene() {
  const nearbyInteractable = useGameStore((s) => s.nearbyInteractable);
  const setNearbyInteractable = useGameStore((s) => s.setNearbyInteractable);

  useEffect(() => {
    registerColliders('interior', CAFE_INTERIOR_COLLIDERS);
    // Exit door trigger
    setNearbyInteractable(null);
    return () => clearColliders('interior');
  }, [setNearbyInteractable]);

  const atExit = nearbyInteractable === 'interior-exit';

  return (
    <group>
      {/* ── Lighting ───────────────────────────────────────── */}
      <ambientLight intensity={0.5} color="#fff8f0" />
      <pointLight position={[-3, 3.5, -2]} intensity={1.2} color="#ff8800" distance={10} castShadow />
      <pointLight position={[ 3, 3.5, -2]} intensity={1.2} color="#ff8800" distance={10} castShadow />
      <pointLight position={[ 0, 3.5,  2]} intensity={0.8} color="#ffe0c0" distance={8} />

      {/* ── Floor ──────────────────────────────────────────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#c8a060" roughness={0.8} />
      </mesh>
      {/* Tile pattern overlay */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <planeGeometry args={[11.8, 11.8]} />
        <meshStandardMaterial color="#b89050" roughness={0.9} wireframe={false} />
      </mesh>

      {/* ── Ceiling ────────────────────────────────────────── */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 4.5, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#2a1800" roughness={1} />
      </mesh>

      {/* ── Walls ──────────────────────────────────────────── */}
      {/* Back wall */}
      <mesh position={[0, 2.25, -6]} receiveShadow>
        <planeGeometry args={[12, 4.5]} />
        <meshStandardMaterial color="#3a2000" roughness={0.9} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-6, 2.25, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[12, 4.5]} />
        <meshStandardMaterial color="#332010" roughness={0.9} />
      </mesh>
      {/* Right wall */}
      <mesh position={[6, 2.25, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[12, 4.5]} />
        <meshStandardMaterial color="#332010" roughness={0.9} />
      </mesh>
      {/* Front wall left of door */}
      <mesh position={[-3.5, 2.25, 6]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[5, 4.5]} />
        <meshStandardMaterial color="#332010" roughness={0.9} />
      </mesh>
      {/* Front wall right of door */}
      <mesh position={[3.5, 2.25, 6]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[5, 4.5]} />
        <meshStandardMaterial color="#332010" roughness={0.9} />
      </mesh>

      {/* ── Sign on back wall ──────────────────────────────── */}
      <mesh position={[0, 3.5, -5.85]}>
        <boxGeometry args={[6, 0.8, 0.1]} />
        <meshStandardMaterial color="#1a0800" emissive="#ff8800" emissiveIntensity={0.7} />
      </mesh>
      <Text position={[0, 3.5, -5.7]} fontSize={0.38} color="#ffcc44"
        anchorX="center" anchorY="middle" outlineWidth={0.015} outlineColor="#000">
        MERIDIAN CYBER CAFE
      </Text>

      {/* ── Counter bar ────────────────────────────────────── */}
      <mesh position={[0, 0.9, -3]} castShadow receiveShadow>
        <boxGeometry args={[7, 0.1, 0.8]} />
        <meshStandardMaterial color="#3a2000" roughness={0.5} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.5, -3.35]} castShadow receiveShadow>
        <boxGeometry args={[7, 0.9, 0.1]} />
        <meshStandardMaterial color="#2a1500" roughness={0.6} />
      </mesh>
      {/* Coffee machine */}
      <mesh position={[-2.5, 1.1, -3.3]} castShadow>
        <boxGeometry args={[0.5, 0.4, 0.3]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[-2.5, 1.35, -3.3]}>
        <sphereGeometry args={[0.12, 8, 6]} />
        <meshStandardMaterial color="#111" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Menu board */}
      <mesh position={[2, 2.8, -5.85]}>
        <boxGeometry args={[2.2, 1.4, 0.08]} />
        <meshStandardMaterial color="#0a0800" roughness={0.5} />
      </mesh>
      <Text position={[2, 2.8, -5.75]} fontSize={0.18} color="#ff8800"
        anchorX="center" anchorY="middle" outlineWidth={0.008} outlineColor="#000">
        {'COFFEE  ¥250\nEXOS BOOST ¥400\nLAN PASS  ¥150'}
      </Text>

      {/* ── 4 PC Tables ────────────────────────────────────── */}
      {([-3, 3] as number[]).flatMap((x) =>
        ([-1, 2] as number[]).map((z) => (
          <group key={`${x}-${z}`} position={[x, 0, z]}>
            {/* Table top */}
            <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
              <boxGeometry args={[1.1, 0.07, 1.1]} />
              <meshStandardMaterial color="#2a1800" roughness={0.5} metalness={0.1} />
            </mesh>
            {/* Monitor */}
            <mesh position={[0, 1.25, -0.35]} castShadow>
              <boxGeometry args={[0.7, 0.45, 0.05]} />
              <meshStandardMaterial color="#111" roughness={0.3} metalness={0.6} />
            </mesh>
            <mesh position={[0, 1.25, -0.32]}>
              <planeGeometry args={[0.62, 0.38]} />
              <meshStandardMaterial color="#001a00" emissive="#00cc33" emissiveIntensity={0.4} />
            </mesh>
            <pointLight position={[0, 1.25, 0]} intensity={0.3} color="#00ff41" distance={2} />
            {/* Keyboard */}
            <mesh position={[0, 0.79, 0.15]} castShadow>
              <boxGeometry args={[0.5, 0.02, 0.16]} />
              <meshStandardMaterial color="#222" roughness={0.7} />
            </mesh>
            {/* Chair */}
            <mesh position={[0, 0.45, 0.7]} castShadow>
              <boxGeometry args={[0.55, 0.06, 0.55]} />
              <meshStandardMaterial color="#1a1a2a" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.75, 0.94]} castShadow>
              <boxGeometry args={[0.55, 0.55, 0.06]} />
              <meshStandardMaterial color="#1a1a2a" roughness={0.8} />
            </mesh>
          </group>
        ))
      )}

      {/* ── Neon strip lights on ceiling edge ─────────────── */}
      {[-5, 5].map((x) => (
        <mesh key={x} position={[x, 4.3, 0]}>
          <boxGeometry args={[0.08, 0.08, 10]} />
          <meshStandardMaterial color="#ff6600" emissive="#ff6600" emissiveIntensity={1} />
        </mesh>
      ))}

      {/* ── Exit door ──────────────────────────────────────── */}
      <mesh position={[0, 1.15, 5.92]} castShadow>
        <boxGeometry args={[1.4, 2.3, 0.12]} />
        <meshStandardMaterial
          color="#4a3010"
          roughness={0.7}
          emissive={atExit ? '#ff8800' : '#000'}
          emissiveIntensity={atExit ? 0.6 : 0}
        />
      </mesh>
      <mesh position={[0, 1.15, 5.91]}>
        <boxGeometry args={[1.6, 2.5, 0.06]} />
        <meshStandardMaterial color="#666" roughness={0.5} metalness={0.3} />
      </mesh>
      {atExit && (
        <pointLight position={[0, 2, 5]} intensity={1.0} color="#ffcc44" distance={4} />
      )}
      {/* Exit sign above door */}
      <mesh position={[0, 3.0, 5.9]}>
        <boxGeometry args={[1.2, 0.35, 0.08]} />
        <meshStandardMaterial color="#006600" emissive="#00cc00" emissiveIntensity={0.8} />
      </mesh>
      <Text position={[0, 3.0, 5.85]} fontSize={0.18} color="#ffffff"
        anchorX="center" anchorY="middle" outlineWidth={0.005} outlineColor="#000">
        EXIT
      </Text>
    </group>
  );
}
