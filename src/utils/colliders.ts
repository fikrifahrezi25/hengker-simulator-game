/**
 * colliders.ts
 *
 * Axis-Aligned Bounding Box (AABB) collision registry.
 *
 * Each collider is an AABB defined by its world-space min/max extents on X and Z
 * (Y is ignored — the player is always on the ground plane).
 *
 * Usage:
 *   import { registerColliders, getColliders, clearColliders } from './colliders';
 *
 *   // In a scene component (useEffect on mount):
 *   registerColliders('city', CITY_COLLIDERS);
 *
 *   // In PlayerController (useFrame):
 *   resolveCollision(nextPos, PLAYER_RADIUS, getColliders());
 */

export interface AABB {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  label?: string; // optional — for debugging
}

// ── Registry ──────────────────────────────────────────────────────────────
// Colliders are grouped by scene key so each scene can register/clear
// its own set without affecting others.
const registry: Record<string, AABB[]> = {};

export function registerColliders(sceneKey: string, boxes: AABB[]): void {
  registry[sceneKey] = boxes;
}

export function clearColliders(sceneKey: string): void {
  delete registry[sceneKey];
}

export function getColliders(): AABB[] {
  return Object.values(registry).flat();
}

// ── Builder helpers ───────────────────────────────────────────────────────

/** Build an AABB from a world-space center + half-extents. */
export function boxFromCenter(
  cx: number,
  cz: number,
  halfW: number,
  halfD: number,
  label?: string,
): AABB {
  return {
    minX: cx - halfW,
    maxX: cx + halfW,
    minZ: cz - halfD,
    maxZ: cz + halfD,
    label,
  };
}

/** Build an AABB from a world-space center + full width/depth. */
export function boxFromSize(
  cx: number,
  cz: number,
  width: number,
  depth: number,
  label?: string,
): AABB {
  return boxFromCenter(cx, cz, width / 2, depth / 2, label);
}

// ── Collision resolution ──────────────────────────────────────────────────

/**
 * Resolve AABB collision for a cylinder player (approximated as a square).
 *
 * Takes the proposed next position and pushes it out of any overlapping
 * collider on each axis independently (axis-separated sliding resolution).
 * This allows the player to slide along walls instead of stopping dead.
 *
 * @param position  THREE.Vector3-like — mutated in place.
 * @param radius    Player capsule radius (collision half-extent).
 * @param colliders List of AABB boxes to test against.
 */
export function resolveCollision(
  position: { x: number; y: number; z: number },
  radius: number,
  colliders: AABB[],
): void {
  for (const box of colliders) {
    // Expand box by player radius (Minkowski sum)
    const minX = box.minX - radius;
    const maxX = box.maxX + radius;
    const minZ = box.minZ - radius;
    const maxZ = box.maxZ + radius;

    // Quick AABB overlap test
    if (
      position.x < minX || position.x > maxX ||
      position.z < minZ || position.z > maxZ
    ) continue;

    // We are inside the expanded box — find the smallest penetration axis
    const overlapPosX = maxX - position.x; // push in +X
    const overlapNegX = position.x - minX; // push in -X
    const overlapPosZ = maxZ - position.z; // push in +Z
    const overlapNegZ = position.z - minZ; // push in -Z

    const minOverlap = Math.min(overlapPosX, overlapNegX, overlapPosZ, overlapNegZ);

    if (minOverlap === overlapPosX) position.x = maxX;
    else if (minOverlap === overlapNegX) position.x = minX;
    else if (minOverlap === overlapPosZ) position.z = maxZ;
    else position.z = minZ;
  }
}
