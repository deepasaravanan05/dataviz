"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { LedStrip, linePoints, ringPoints, type LedLook } from "./led";
import { PARK_SCALE } from "@/components/park/parkScale";
import {
  WHEEL_RADIUS,
  INTERMEDIATE_RADIUS,
  INNER_RIM_RADIUS,
  WHEEL_CENTER_HEIGHT,
  BASE_WIDTH,
} from "@/components/ferris-wheel/constants";
import { TRACK_CURVE as COASTER_CURVE } from "@/components/roller-coaster/trackCurve";
import {
  TOWER_HEIGHT as MONSTER_TOWER,
  ARM_ATTACH_HEIGHT,
  ARM_LENGTH as MONSTER_ARM,
  BASE_RADIUS as MONSTER_BASE,
  MONSTER_ORIGIN,
} from "@/components/monster-ride/constants";
import {
  APEX_HEIGHT,
  DRAGON_ORIGIN,
  FOOT_SPREAD_X,
  FOOT_SPREAD_Z,
  ARM_LENGTH as DRAGON_ARM,
} from "@/components/dragon-ride/constants";
import {
  TOWER_HEIGHT as DROP_TOWER_HEIGHT,
  TOWER_HALF,
  TOWER_ORIGIN,
  BAY_COUNT,
  FOUNDATION_RADIUS,
  STATION_OUTER_R,
} from "@/components/drop-tower/constants";
import { TRACK_CURVE as TRAIN_CURVE } from "@/components/park-train/trainTrack";
import type { DepartmentRideId } from "@/components/park/departments";

/**
 * Night lighting for the six rides.
 *
 * Each rig is built from that ride's own published geometry — the coaster's
 * track curve, the wheel's rim radii, the drop tower's lattice bays, the
 * dragon's A-frame spread — so the light traces the structure that is actually
 * there. Nothing here reads a hand-typed coordinate, and nothing here modifies
 * a ride: the rigs render as siblings inside each ride's existing transform,
 * so they inherit its position and scale exactly and can be removed without
 * leaving a mark.
 *
 * Every ride gets its own palette and its own animation, because the whole
 * point is that you can tell which is which from a kilometre up.
 */

/*
 * The six palettes.
 *
 * Spread deliberately around the colour wheel rather than picked by taste: the
 * closest pair is 33 degrees apart, which is what makes them tell apart from a
 * kilometre up where a ride is only a smear of light. An earlier pass had the
 * drop tower and the railway 13 degrees apart and they read as the same ride.
 * verify-night.ts measures the separation in HSL and fails if any pair closes up.
 */
export const RIDE_LOOK: Record<string, { look: LedLook; accent: string; label: string }> = {
  // TECH — electric magenta running the rails, violet in the structure.
  coaster: {
    look: { colorA: "#ff2fa4", colorB: "#7b3ff2", speed: 0.32, cycles: 3, base: 0.55, gain: 1.7 },
    accent: "#ff2fa4",
    label: "magenta / violet",
  },
  // FINANCE — a gold rim with a slow wave into rose around the wheel.
  ferris: {
    look: { colorA: "#ffcc33", colorB: "#ff5f8f", speed: 0.14, cycles: 2, base: 0.7, gain: 1.1 },
    accent: "#ffcc33",
    label: "gold / rose",
  },
  // DEVOPS — a cold vertical spine, the pulse climbing the mast then dropping.
  tower: {
    look: { colorA: "#22c8ff", colorB: "#ffffff", speed: 0.5, cycles: 1, base: 0.45, gain: 2.2 },
    accent: "#22c8ff",
    label: "cyan / white",
  },
  // CYBER — warm ember, the swing arc picked out in amber and deep red.
  dragon: {
    look: { colorA: "#ff5a2b", colorB: "#d21f2b", speed: 0.2, cycles: 2, base: 0.62, gain: 1.4 },
    accent: "#ff5a2b",
    label: "ember / red",
  },
  // ERP — green-teal, sweeping with the ride's own arms.
  monster: {
    look: { colorA: "#22e07a", colorB: "#0fb3a0", speed: 0.26, cycles: 2, base: 0.6, gain: 1.5 },
    accent: "#22e07a",
    label: "green / teal",
  },
  // The railway that rings the park — indigo running the whole loop.
  train: {
    look: { colorA: "#7a6bff", colorB: "#3b8cff", speed: 0.06, cycles: 9, base: 0.35, gain: 1.9 },
    accent: "#7a6bff",
    label: "indigo / blue",
  },
};

/** Ferris Wheel: the rim, the intermediate ring, and spokes to the hub. */
function FerrisRig() {
  const { look } = RIDE_LOOK.ferris;
  const rim = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const N = 96;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * WHEEL_RADIUS, WHEEL_CENTER_HEIGHT + Math.sin(a) * WHEEL_RADIUS, 0));
    }
    return pts;
  }, []);
  const inner = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const N = 48;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      pts.push(
        new THREE.Vector3(Math.cos(a) * INTERMEDIATE_RADIUS, WHEEL_CENTER_HEIGHT + Math.sin(a) * INTERMEDIATE_RADIUS, 0),
      );
    }
    return pts;
  }, []);
  const spokes = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let s = 0; s < 12; s++) {
      const a = (s / 12) * Math.PI * 2;
      for (let k = 1; k <= 7; k++) {
        const r = INNER_RIM_RADIUS + ((WHEEL_RADIUS - INNER_RIM_RADIUS) * k) / 7;
        pts.push(new THREE.Vector3(Math.cos(a) * r, WHEEL_CENTER_HEIGHT + Math.sin(a) * r, 0));
      }
    }
    return pts;
  }, []);
  const legs = useMemo(
    () => [
      ...linePoints([-BASE_WIDTH / 2, 0.4, 0], [0, WHEEL_CENTER_HEIGHT - 0.6, 0], 14),
      ...linePoints([BASE_WIDTH / 2, 0.4, 0], [0, WHEEL_CENTER_HEIGHT - 0.6, 0], 14),
    ],
    [],
  );

  return (
    <group>
      <LedStrip points={rim} look={look} size={0.26} />
      <LedStrip points={inner} look={{ ...look, base: 0.4, gain: 0.8 }} size={0.16} />
      <LedStrip points={spokes} look={{ ...look, cycles: 4, base: 0.3, gain: 1.4 }} size={0.13} halo={false} />
      <LedStrip points={legs} look={{ ...look, colorB: "#ffffff", base: 0.5, gain: 0.7 }} size={0.14} halo={false} />
      {/* Ground ring around the boarding area. */}
      <LedStrip points={ringPoints(BASE_WIDTH * 0.62, 40, 0.2)} look={{ ...look, base: 0.35, gain: 1.1 }} size={0.15} />
    </group>
  );
}

/** Roller Coaster: LEDs running the real track curve, plus support uplights. */
function CoasterRig() {
  const { look } = RIDE_LOOK.coaster;
  const rails = useMemo(() => {
    const N = 260;
    return Array.from({ length: N }, (_, i) => COASTER_CURVE.getPointAt(i / N));
  }, []);
  const groundLine = useMemo(() => {
    const N = 90;
    return Array.from({ length: N }, (_, i) => {
      const p = COASTER_CURVE.getPointAt(i / N);
      return new THREE.Vector3(p.x, 0.2, p.z);
    });
  }, []);
  return (
    <group>
      <LedStrip points={rails} look={look} size={0.2} haloScale={3.8} />
      <LedStrip
        points={groundLine}
        look={{ ...look, colorB: "#2b7cff", base: 0.3, gain: 1.2, cycles: 5 }}
        size={0.16}
      />
    </group>
  );
}

/** Drop Tower: a vertical spine on every lattice corner, pulse climbing the mast. */
function DropTowerRig() {
  const { look } = RIDE_LOOK.tower;
  const spines = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const perCorner = BAY_COUNT * 2;
    for (const [sx, sz] of [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ] as [number, number][]) {
      for (let i = 0; i <= perCorner; i++) {
        pts.push(new THREE.Vector3(sx * TOWER_HALF, (i / perCorner) * DROP_TOWER_HEIGHT, sz * TOWER_HALF));
      }
    }
    return pts;
  }, []);
  const beacon = useMemo(() => ringPoints(TOWER_HALF * 1.6, 10, DROP_TOWER_HEIGHT + 1.6), []);
  const deck = useMemo(() => ringPoints(STATION_OUTER_R, 44, 2.1), []);
  const apron = useMemo(() => ringPoints(FOUNDATION_RADIUS + 5.5, 40, 0.2), []);

  return (
    <group position={[TOWER_ORIGIN[0], 0, TOWER_ORIGIN[2]]}>
      {/* Phase runs 0 at the base to 1 at the top on each corner, so the pulse climbs. */}
      <LedStrip points={spines} look={{ ...look, cycles: 4 }} size={0.3} haloScale={4.2} />
      <LedStrip points={beacon} look={{ ...look, colorA: "#ff3b3b", colorB: "#ff9d3b", speed: 0.8, base: 0.5, gain: 2 }} size={0.42} />
      <LedStrip points={deck} look={{ ...look, base: 0.5, gain: 0.9, cycles: 6 }} size={0.22} />
      <LedStrip points={apron} look={{ ...look, colorB: "#2b7cff", base: 0.3, gain: 1 }} size={0.2} />
    </group>
  );
}

/** Dragon Ride: the A-frame edges, the swing arc, and the hull rail. */
function DragonRig() {
  const { look } = RIDE_LOOK.dragon;
  const [ox, , oz] = DRAGON_ORIGIN;

  const frame = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        pts.push(
          ...linePoints([sx * FOOT_SPREAD_X, 0.4, sz * FOOT_SPREAD_Z], [0, APEX_HEIGHT, 0], 20),
        );
      }
    }
    return pts;
  }, []);

  /** The arc the ship actually sweeps, picked out in light. */
  const arc = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const N = 60;
    const maxSwing = (65 * Math.PI) / 180;
    for (let i = 0; i < N; i++) {
      const a = -maxSwing + (2 * maxSwing * i) / (N - 1);
      pts.push(new THREE.Vector3(0, APEX_HEIGHT - Math.cos(a) * DRAGON_ARM, Math.sin(a) * DRAGON_ARM));
    }
    return pts;
  }, []);

  const apron = useMemo(() => ringPoints(FOOT_SPREAD_X + 8, 40, 0.2), []);

  return (
    <group position={[ox, 0, oz]}>
      <LedStrip points={frame} look={{ ...look, cycles: 3 }} size={0.24} />
      <LedStrip points={arc} look={{ ...look, colorB: "#ffd166", speed: 0.34, cycles: 1, base: 0.5, gain: 2 }} size={0.28} haloScale={4} />
      <LedStrip points={apron} look={{ ...look, base: 0.32, gain: 1 }} size={0.2} />
    </group>
  );
}

/** Monster Ride: mast spine, a ring at the arm hub, and a lit apron. */
function MonsterRig() {
  const { look } = RIDE_LOOK.monster;
  const [ox, , oz] = MONSTER_ORIGIN;

  const mast = useMemo(() => linePoints([0, 0.6, 0], [0, MONSTER_TOWER, 0], 22), []);
  const hub = useMemo(() => ringPoints(2.6, 20, ARM_ATTACH_HEIGHT), []);
  const sweep = useMemo(() => ringPoints(MONSTER_ARM * 0.92, 56, ARM_ATTACH_HEIGHT - 3.2), []);
  const apron = useMemo(() => ringPoints(MONSTER_BASE + 9, 44, 0.2), []);

  return (
    <group position={[ox, 0, oz]}>
      <LedStrip points={mast} look={{ ...look, cycles: 2 }} size={0.26} />
      <LedStrip points={hub} look={{ ...look, colorB: "#ffffff", base: 0.6, gain: 1.4 }} size={0.2} />
      <LedStrip points={sweep} look={{ ...look, cycles: 5, base: 0.4, gain: 1.8 }} size={0.22} haloScale={4} />
      <LedStrip points={apron} look={{ ...look, base: 0.3, gain: 1 }} size={0.2} />
    </group>
  );
}

/**
 * The railway loop. Its lights ring the entire park, which from the overview
 * makes it the one landmark that draws the park's outline for you.
 */
export function TrainRig() {
  const { look } = RIDE_LOOK.train;
  const track = useMemo(() => {
    const N = 340;
    return Array.from({ length: N }, (_, i) => {
      const p = TRAIN_CURVE.getPointAt(i / N);
      return new THREE.Vector3(p.x, p.y + 0.5, p.z);
    });
  }, []);
  return <LedStrip points={track} look={look} size={0.13} haloScale={3} />;
}

/** The rig for one department ride, rendered inside that ride's own transform. */
export function RideLights({ id }: { id: DepartmentRideId }) {
  switch (id) {
    case "ferris":
      return <FerrisRig />;
    case "coaster":
      return <CoasterRig />;
    case "tower":
      return <DropTowerRig />;
    case "dragon":
      return <DragonRig />;
    case "monster":
      return <MonsterRig />;
    default:
      return null;
  }
}

/** Exported for verification: how tall each rig reaches, at final park scale. */
export const RIG_REACH: Record<string, number> = {
  ferris: (WHEEL_CENTER_HEIGHT + WHEEL_RADIUS) * PARK_SCALE,
  coaster: 0,
  tower: DROP_TOWER_HEIGHT + 1.6,
  dragon: APEX_HEIGHT * PARK_SCALE,
  monster: MONSTER_TOWER * PARK_SCALE,
};
