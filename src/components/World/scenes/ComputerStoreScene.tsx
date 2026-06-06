import { useEffect } from 'react';
import { Text } from '@react-three/drei';
import { useGameStore } from '../../../stores/gameStore';
import { registerColliders, clearColliders, boxFromCenter, boxFromSize } from '../../../utils/colliders';

const STORE_COLLIDERS = [
  boxFromCenter( 0,  -4.9, 5.0, 0.3, 'store-wall-back'),
  boxFromCenter(-4.5, 0,   0.3, 5.0, 'store-wall-left'),
  boxFromCenter( 4.5, 0,   0.3, 5.0, 'store-wall-right'),
  // Counter
  boxFromSize(  0,  -2.5,  6.0, 0.8, 'store-counter'),
  // Display shelves (left + right walls)
  boxFromCenter(-4.0, -2.0, 0.5, 2.0, 'shelf-left'),
  boxFromCenter( 4.0, -2.0, 0.5, 2.0, 'shelf-right'),
];

export default function ComputerStoreScene() {
  const nearbyInteractable = useGameStore((s) => s.nearbyInteractable);
  const setNearbyInteractable = useGameStore((s) => s.setNearbyInteractable);

  useEffect(() => {
    registerColliders('interior', STORE_COLLIDERS);
    setNearbyInteractable(null);
    return () => clearColliders('interior');
  }, [setNearbyInteractable]);

  const atExit = nearbyInteractable === 'interior-exit';

  return (
    <group>
      {/* ── Lighting ───────────────────────────────────────── */}
      <ambientLight intensity={0.7} color="#e8f4ff" />
      <pointLight position={[-2, 3.5, -1]} intensity={1.4} color="#0088ff" distance={10} castShadow />
      <pointLight position={[ 2, 3.5, -1]} intensity={1.4} color="#0088ff" distance={10} castShadow />
      <pointLight position={[ 0, 3.5,  2]} intensity={0.8} color="#ffffff" distance={8} />

      {/* ── Floor ──────────────────────────────────────────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#d8e8f0" roughness={0.4} metalness={0.1} />
      </mesh>

      {/* ── Ceiling ────────────────────────────────────────── */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 4, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#f0f8ff" roughness={1} />
      </mesh>
      {/* Ceiling LED strips */}
      {[-3, 0, 3].map((x) => (
        <mesh key={x} position={[x, 3.95, 0]}>
          <boxGeometry args={[0.1, 0.05, 8]} />
          <meshStandardMaterial color="#88ccff" emissive="#88ccff" emissiveIntensity={0.8} />
        </mesh>
      ))}

      {/* ── Walls ──────────────────────────────────────────── */}
      <mesh position={[0, 2, -5]} receiveShadow>
        <planeGeometry args={[10, 4]} />
        <meshStandardMaterial color="#0a1a2a" roughness={0.8} />
      </mesh>
      <mesh position={[-5, 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[10, 4]} />
        <meshStandardMaterial color="#0c1e2e" roughness={0.8} />
      </mesh>
      <mesh position={[5, 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[10, 4]} />
        <meshStandardMaterial color="#0c1e2e" roughness={0.8} />
      </mesh>
      {/* Front wall with door gap */}
      <mesh position={[-3, 2, 5]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[4, 4]} />
        <meshStandardMaterial color="#0c1e2e" roughness={0.8} />
      </mesh>
      <mesh position={[3, 2, 5]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[4, 4]} />
        <meshStandardMaterial color="#0c1e2e" roughness={0.8} />
      </mesh>

      {/* ── Store sign ─────────────────────────────────────── */}
      <mesh position={[0, 3.2, -4.9]}>
        <boxGeometry args={[5, 0.7, 0.1]} />
        <meshStandardMaterial color="#0a1a2a" emissive="#0088ff" emissiveIntensity={0.6} />
      </mesh>
      <Text position={[0, 3.2, -4.75]} fontSize={0.32} color="#44aaff"
        anchorX="center" anchorY="middle" outlineWidth={0.012} outlineColor="#000">
        CHEN'S TECH STORE
      </Text>

      {/* ── Service counter ────────────────────────────────── */}
      <mesh position={[0, 0.85, -2.5]} castShadow receiveShadow>
        <boxGeometry args={[6, 0.1, 0.8]} />
        <meshStandardMaterial color="#1a2a3a" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.45, -2.85]} castShadow>
        <boxGeometry args={[6, 0.85, 0.1]} />
        <meshStandardMaterial color="#0f1a28" roughness={0.5} />
      </mesh>
      {/* POS terminal on counter */}
      <mesh position={[-1.5, 1.0, -2.65]} castShadow>
        <boxGeometry args={[0.45, 0.55, 0.04]} />
        <meshStandardMaterial color="#111" roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[-1.5, 1.0, -2.62]}>
        <planeGeometry args={[0.38, 0.45]} />
        <meshStandardMaterial color="#001020" emissive="#0066ff" emissiveIntensity={0.5} />
      </mesh>

      {/* ── Left wall display shelf ─────────────────────────── */}
      {[-3.5, -1.5, 0.5].map((z, i) => (
        <group key={i} position={[-4.4, 0, z]}>
          <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.3, 0.06, 0.8]} />
            <meshStandardMaterial color="#1a2a3a" roughness={0.4} metalness={0.3} />
          </mesh>
          <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.3, 0.06, 0.8]} />
            <meshStandardMaterial color="#1a2a3a" roughness={0.4} metalness={0.3} />
          </mesh>
          {/* Box products on shelves */}
          {[0, 1].map((shelf) => (
            <mesh key={shelf} position={[0.06, 0.85 + shelf * 0.7, 0]} castShadow>
              <boxGeometry args={[0.18, 0.22, 0.28]} />
              <meshStandardMaterial
                color={['#1a4a8a', '#2a6a2a', '#6a1a1a', '#4a2a6a'][i + shelf * 3 % 4]}
                roughness={0.6}
              />
            </mesh>
          ))}
        </group>
      ))}

      {/* ── Right wall display shelf ────────────────────────── */}
      {[-3.5, -1.5, 0.5].map((z, i) => (
        <group key={i} position={[4.4, 0, z]}>
          <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.3, 0.06, 0.8]} />
            <meshStandardMaterial color="#1a2a3a" roughness={0.4} metalness={0.3} />
          </mesh>
          <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.3, 0.06, 0.8]} />
            <meshStandardMaterial color="#1a2a3a" roughness={0.4} metalness={0.3} />
          </mesh>
          {[0, 1].map((shelf) => (
            <mesh key={shelf} position={[-0.06, 0.85 + shelf * 0.7, 0]} castShadow>
              <boxGeometry args={[0.18, 0.22, 0.28]} />
              <meshStandardMaterial
                color={['#8a4a1a', '#1a6a6a', '#6a6a1a', '#2a2a6a'][i + shelf * 3 % 4]}
                roughness={0.6}
              />
            </mesh>
          ))}
        </group>
      ))}

      {/* ── Demo unit in centre ─────────────────────────────── */}
      <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.06, 1.0]} />
        <meshStandardMaterial color="#1a2a3a" roughness={0.3} metalness={0.4} />
      </mesh>
      <mesh position={[0, 1.3, -0.2]} castShadow>
        <boxGeometry args={[0.9, 0.6, 0.04]} />
        <meshStandardMaterial color="#111" roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[0, 1.3, -0.17]}>
        <planeGeometry args={[0.82, 0.54]} />
        <meshStandardMaterial color="#000820" emissive="#0044cc" emissiveIntensity={0.6} />
      </mesh>
      <pointLight position={[0, 1.5, 0.2]} intensity={0.5} color="#0088ff" distance={3} />

      {/* ── Exit door ──────────────────────────────────────── */}
      <mesh position={[0, 1.15, 4.92]} castShadow>
        <boxGeometry args={[1.4, 2.3, 0.12]} />
        <meshStandardMaterial
          color="#1a2a3a"
          roughness={0.5}
          metalness={0.3}
          emissive={atExit ? '#0088ff' : '#000'}
          emissiveIntensity={atExit ? 0.5 : 0}
        />
      </mesh>
      <mesh position={[0, 1.15, 4.91]}>
        <boxGeometry args={[1.6, 2.5, 0.06]} />
        <meshStandardMaterial color="#444" roughness={0.5} metalness={0.4} />
      </mesh>
      {atExit && (
        <pointLight position={[0, 2, 4]} intensity={1.0} color="#0088ff" distance={4} />
      )}
      <mesh position={[0, 3.0, 4.9]}>
        <boxGeometry args={[1.2, 0.35, 0.08]} />
        <meshStandardMaterial color="#002244" emissive="#0066cc" emissiveIntensity={0.8} />
      </mesh>
      <Text position={[0, 3.0, 4.85]} fontSize={0.18} color="#ffffff"
        anchorX="center" anchorY="middle" outlineWidth={0.005} outlineColor="#000">
        EXIT
      </Text>
    </group>
  );
}
