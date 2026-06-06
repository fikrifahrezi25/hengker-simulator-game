/**
 * cityColliders.ts
 *
 * Static AABB collider definitions for CityScene.
 *
 * Key-location buildings (CyberCafe, ComputerStore, ApartmentBuilding) use
 * U-shaped colliders — three slabs (left side, right side, back) — so the
 * front-centre door gap is physically open and the player can walk up to it.
 *
 * Generic BUILDINGS stay as solid boxes (no playable interior).
 * Trees and parked cars are small obstacle boxes.
 */

import { type AABB, boxFromSize, boxFromCenter } from './colliders';

// ── Key location buildings — U-shaped (door gap on +Z face) ───────────────
//
// CyberCafe  : world center (12, -14), 10w × 8d
//   Door gap : 1.6 wide centred at x=12, on face z = -14 + 4 = -10
//   Left slab  : x 7   → 10.2,  z -18 → -10
//   Right slab : x 13.8→ 17,    z -18 → -10
//   Back slab  : x 7   → 17,    z -18 → -17.4
const CYBER_CAFE_COLLIDERS: AABB[] = [
  { minX:  7.0, maxX: 10.2, minZ: -18.0, maxZ: -10.0, label: 'cafe-left'  },
  { minX: 13.8, maxX: 17.0, minZ: -18.0, maxZ: -10.0, label: 'cafe-right' },
  { minX:  7.0, maxX: 17.0, minZ: -18.0, maxZ: -17.4, label: 'cafe-back'  },
];

//
// ComputerStore : world center (20, -14), 8w × 7d
//   Door gap : 1.6 wide centred at x=20, on face z = -14 + 3.5 = -10.5
//   Left slab  : x 16   → 19.2,  z -17.5 → -10.5
//   Right slab : x 20.8 → 24,    z -17.5 → -10.5
//   Back slab  : x 16   → 24,    z -17.5 → -17.0
const COMPUTER_STORE_COLLIDERS: AABB[] = [
  { minX: 16.0, maxX: 19.2, minZ: -17.5, maxZ: -10.5, label: 'store-left'  },
  { minX: 20.8, maxX: 24.0, minZ: -17.5, maxZ: -10.5, label: 'store-right' },
  { minX: 16.0, maxX: 24.0, minZ: -17.5, maxZ: -17.0, label: 'store-back'  },
];

//
// ApartmentBuilding : world center (-12, -14), 10w × 8d
//   Door gap : 1.8 wide centred at x=-12, on face z = -14 + 4 = -10
//   Left slab  : x -17  → -13.1, z -18 → -10
//   Right slab : x -10.9→ -7,    z -18 → -10
//   Back slab  : x -17  → -7,    z -18 → -17.4
const APARTMENT_BUILDING_COLLIDERS: AABB[] = [
  { minX: -17.0, maxX: -13.1, minZ: -18.0, maxZ: -10.0, label: 'apt-left'  },
  { minX: -10.9, maxX:  -7.0, minZ: -18.0, maxZ: -10.0, label: 'apt-right' },
  { minX: -17.0, maxX:  -7.0, minZ: -18.0, maxZ: -17.4, label: 'apt-back'  },
];

// ── BUILDINGS array (mirrors CityScene.tsx BUILDINGS const) ───────────────
// Generic buildings — fully solid, no playable interiors.
const SCENE_BUILDINGS: AABB[] = [
  // NW — Residential
  boxFromSize(-22, -18,  8,  8, 'res-nw-1'),
  boxFromSize(-32, -18,  8,  8, 'res-nw-2'),
  boxFromSize(-42, -18,  8,  8, 'res-nw-3'),
  boxFromSize(-22, -30,  8,  8, 'res-nw-4'),
  boxFromSize(-32, -30, 10,  8, 'res-nw-5'),
  boxFromSize(-44, -30,  8,  8, 'res-nw-6'),
  boxFromSize(-22, -44, 10,  8, 'uni-1'),
  boxFromSize(-34, -44, 14, 10, 'uni-hall'),
  boxFromSize(-50, -44, 10,  8, 'uni-3'),
  boxFromSize(-22,  16,  8,  8, 'res-sw-1'),
  boxFromSize(-32,  16,  8,  8, 'res-sw-2'),
  boxFromSize(-44,  16, 10,  8, 'res-sw-3'),
  boxFromSize(-22,  30,  8,  8, 'res-sw-4'),
  boxFromSize(-34,  30, 10,  8, 'res-sw-5'),

  // NE — Shopping + Business
  boxFromSize( 30, -16,  8,  8, 'shop-1'),
  boxFromSize( 40, -16,  8,  8, 'shop-2'),
  boxFromSize( 50, -16, 10,  8, 'shop-3'),
  boxFromSize( 28, -30, 10, 10, 'biz-1'),
  boxFromSize( 40, -30, 10, 10, 'biz-2'),
  boxFromSize( 52, -30, 10, 10, 'biz-3'),
  boxFromSize( 64, -30, 12, 10, 'biz-4'),
  boxFromSize( 28, -46, 12, 10, 'tech-1'),
  boxFromSize( 42, -46, 10, 10, 'tech-2'),
  boxFromSize( 54, -46, 12, 10, 'tech-3'),
  boxFromSize( 66, -46, 10, 10, 'tech-4'),
  boxFromSize( 28,  16,  8,  8, 'mixed-1'),
  boxFromSize( 38,  16,  8,  8, 'mixed-2'),
  boxFromSize( 50,  16, 10,  8, 'mixed-3'),
  boxFromSize( 30,  30, 14, 12, 'ind-1'),
  boxFromSize( 46,  30, 16, 12, 'ind-2'),
  boxFromSize( 64,  30, 14, 12, 'ind-3'),

  // SE
  boxFromSize( 30,  46, 10,  8, 'se-1'),
  boxFromSize( 42,  46, 10,  8, 'se-2'),
  boxFromSize( 54,  46, 12,  8, 'se-3'),

  // SW
  boxFromSize(-22,  46, 10,  8, 'sw-1'),
  boxFromSize(-34,  46, 10,  8, 'sw-2'),
  boxFromSize(-46,  46, 10,  8, 'sw-3'),
];

// ── Parked cars (from AmbientVehicles in CityScene.tsx) ───────────────────
const PARKED_CARS: AABB[] = [
  boxFromCenter( 6, -5,  1.1, 2.0, 'car-1'),
  boxFromCenter(-6, -5,  1.1, 2.0, 'car-2'),
  boxFromCenter( 6,  5,  1.1, 2.0, 'car-3'),
  boxFromCenter(-6,  5,  1.1, 2.0, 'car-4'),
  boxFromCenter( 6, 15,  1.1, 2.0, 'car-5'),
  boxFromCenter(-6, 15,  1.1, 2.0, 'car-6'),
  boxFromCenter( 6,-15,  1.1, 2.0, 'car-7'),
  boxFromCenter(-6,-15,  1.1, 2.0, 'car-8'),
];

// ── Trees (from TREES const in CityScene.tsx) ─────────────────────────────
const TREE_POSITIONS: [number, number][] = [
  [-9, -9], [9, -9], [-9, 9], [9, 9],
  [-7, -18], [-7, -26], [-7, 18], [-7, 26],
  [ 7, -18], [ 7, -26], [ 7, 18], [ 7, 26],
  [-18, -7], [-26, -7], [18, -7], [26, -7],
  [-18,  7], [-26,  7], [18,  7], [26,  7],
  [-22,-22], [-18,-28], [-28,-18],
  [ 22, 22], [ 18, 28], [ 28, 18],
  [-22, 22], [-18, 28], [-28, 18],
  [ 22,-22], [ 18,-28], [ 28,-18],
];

const TREES: AABB[] = TREE_POSITIONS.map(([x, z]) =>
  boxFromCenter(x, z, 0.35, 0.35, `tree-${x}-${z}`),
);

// ── Combined city colliders ────────────────────────────────────────────────
export const CITY_COLLIDERS: AABB[] = [
  ...CYBER_CAFE_COLLIDERS,
  ...COMPUTER_STORE_COLLIDERS,
  ...APARTMENT_BUILDING_COLLIDERS,
  ...SCENE_BUILDINGS,
  ...PARKED_CARS,
  ...TREES,
];
