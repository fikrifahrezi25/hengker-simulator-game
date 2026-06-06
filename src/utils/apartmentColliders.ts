/**
 * apartmentColliders.ts
 *
 * Static AABB collider definitions for ApartmentScene.
 * Apartment room: floor 14w × 16d, walls at x=±7, back wall at z=-7, front at z≈+8.
 *
 * Sources (from ApartmentScene.tsx mesh positions and sizes):
 *   Walls      : thin planes — represented as thick slabs so the player can't
 *                squeeze through. Thickness = 0.4 units.
 *   Furniture  : desk, bed frame, bookshelf, storage cabinet, door.
 */

import { type AABB, boxFromSize, boxFromCenter } from './colliders';

const WALL_THICKNESS = 0.4;

// ── Room walls ─────────────────────────────────────────────────────────────
// Back wall  : z = -7,  spans x: -7 → 7
// Left wall  : x = -7,  spans z: -7 → 8
// Right wall : x =  7,  spans z: -7 → 8
// No front wall — the doorway is there.
const WALLS: AABB[] = [
  // Back wall
  boxFromCenter(0, -7, 7, WALL_THICKNESS, 'wall-back'),
  // Left wall
  boxFromCenter(-7, 0.5, WALL_THICKNESS, 7.5, 'wall-left'),
  // Right wall
  boxFromCenter( 7, 0.5, WALL_THICKNESS, 7.5, 'wall-right'),
];

// ── Furniture ──────────────────────────────────────────────────────────────
// Desk: position [0, 0.75, -4.5], size 2.4 × 1.0
// Add generous depth to block approach from front (add monitor depth ~0.5)
const DESK: AABB = boxFromCenter(0, -4.5, 1.5, 1.0, 'desk');

// Monitor is on the desk — already covered by desk box above.

// Bed frame: position [-4, 0.3, 2], size 2.2 × 3.5
const BED: AABB = boxFromCenter(-4, 2, 1.2, 1.9, 'bed');

// Bookshelf: position [5.5, 1.5, -4], size 0.4w × 1.5d
// Against right wall — use half-extents 0.5, 0.85 to be generous
const BOOKSHELF: AABB = boxFromCenter(5.5, -4, 0.5, 0.85, 'bookshelf');

// Storage cabinet: position [-5.5, 0.8, -4], size 1.2 × 0.8
const CABINET: AABB = boxFromCenter(-5.5, -4, 0.7, 0.55, 'cabinet');

// Door: position [5, 1.1, 7.5], size 1.0 × 0.08
// The door is the exit — block it by default so the player has to press E.
// The door's collision box is a thin slab across the doorway.
const DOOR: AABB = boxFromCenter(5, 7.5, 0.6, 0.25, 'door');

// ── Combined apartment colliders ───────────────────────────────────────────
export const APARTMENT_COLLIDERS: AABB[] = [
  ...WALLS,
  DESK,
  BED,
  BOOKSHELF,
  CABINET,
  DOOR,
];
