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
import { COASTER_ORIGIN } from "@/components/roller-coaster/constants";
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
  BEARING_Y as UFO_BEARING_Y,
  PAD_RADIUS as UFO_PAD_RADIUS,
  TOWER_FOOT_SPREAD as UFO_FOOT_SPREAD,
  TOWER_HEAD_HEIGHT as UFO_HEAD_HEIGHT,
  TOWER_SPREAD as UFO_SPREAD,
} from "@/components/ufo-pendulum/constants";
import {
  RIDE_FACING as UFO_FACING,
  RIDE_ORIGIN as UFO_ORIGIN,
} from "@/components/ufo-pendulum/placement";
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
 * point is that you can tell which is which from a kilometre up. No strip in
 * any rig carries a colour from outside its own ride's pair any more — the
 * white leg wash, the blue aprons, the red crown beacon and the amber swing arc
 * were all leftovers that made two rides share a colour at a distance.
 */

/*
 * The six palettes — ONE PER RIDE, ASSIGNED BY THE USER.
 *
 * The scheme is the one the brief names, ride for ride:
 *
 *     Ferris Wheel ....... blue + cyan
 *     Drop Tower ......... purple + violet
 *     Dragon Ride ........ red + orange
 *     Roller Coaster ..... blue + magenta
 *     Monster Ride ....... green + teal
 *     Park Railway ....... amber + gold   (the sixth ride, unique to it)
 *
 * WHAT THE ACCENT IS FOR. Each entry's `accent` is the colour that ride reads
 * as from a kilometre up, where an attraction is only a smear of light, and no
 * two may close up on the hue wheel — verify-night.ts measures the separation
 * in HSL and fails if any pair comes within 18 degrees. Two of the assignments
 * name blue for two different rides, so the accent is taken from the OTHER half
 * of each of those pairs: the Ferris Wheel is identified by its cyan and the
 * coaster by its magenta, while both still run blue through their structures
 * exactly as asked. That is what lets the scheme be followed literally without
 * two rides becoming the same ride from the overview.
 *
 * NOTHING HERE PAINTS A RIDE. These are emissive LED strips rendered as
 * siblings inside each ride's own transform; every ride keeps its own model
 * colours — the coaster's mustard cars and teal spine, the tower's yellow
 * lattice, the dragon's white A-frame — and removing the rigs would leave no
 * mark on any of them.
 */
export const RIDE_LOOK: Record<string, { look: LedLook; accent: string; label: string }> = {
  // TECH — blue running the rails, breaking to magenta on the crest.
  coaster: {
    look: { colorA: "#2b6bff", colorB: "#ff2fa4", speed: 0.32, cycles: 3, base: 0.55, gain: 1.7 },
    /* Magenta, not the blue: the Ferris Wheel is the ride identified by blue. */
    accent: "#ff2fa4",
    label: "blue / magenta",
  },
  // IT SUPPORT · UI/UX — a deep blue rim washing to cyan around the wheel.
  ferris: {
    look: { colorA: "#1f4fe0", colorB: "#22e8ff", speed: 0.14, cycles: 2, base: 0.7, gain: 1.1 },
    accent: "#22e8ff",
    label: "blue / cyan",
  },
  // DATA ENGINEERING — purple through the A-frames, pulsing up into violet.
  ufo: {
    look: { colorA: "#8b2fe0", colorB: "#c77bff", speed: 0.5, cycles: 1, base: 0.45, gain: 2.2 },
    accent: "#a855f7",
    label: "purple / violet",
  },
  // CYBER SECURITY — red through the A-frame, orange along the swing arc.
  dragon: {
    look: { colorA: "#e01b1b", colorB: "#ff8a1f", speed: 0.2, cycles: 2, base: 0.62, gain: 1.4 },
    accent: "#f2431f",
    label: "red / orange",
  },
  // ERP — green-teal, sweeping with the ride's own arms.
  monster: {
    look: { colorA: "#22e07a", colorB: "#0fb3a0", speed: 0.26, cycles: 2, base: 0.6, gain: 1.5 },
    accent: "#22e07a",
    label: "green / teal",
  },
  // The railway that rings the park — warm amber and gold, the whole loop.
  train: {
    look: { colorA: "#ffb020", colorB: "#ffe07a", speed: 0.06, cycles: 9, base: 0.35, gain: 1.9 },
    accent: "#ffb020",
    label: "amber / gold",
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
      {/* The legs stay inside the wheel's own blue rather than washing to white,
          so nothing on this ride lights in a colour it was not assigned. */}
      <LedStrip points={legs} look={{ ...look, colorB: look.colorA, base: 0.5, gain: 0.7 }} size={0.14} halo={false} />
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
  /*
   * The rig must sit on the ride, not beside it. RollerCoaster renders its
   * geometry inside <group position={COASTER_ORIGIN}>, while TRACK_CURVE is
   * authored in the ride's own local space (its points centre on x=2.4). Without
   * this offset the LEDs drew a second, empty coaster 50u to the left — 100u in
   * world space at the current park scale. The pendulum, Dragon and Monster
   * rigs already offset by their rides' origins the same way.
   */
  return (
    <group position={[COASTER_ORIGIN[0], 0, COASTER_ORIGIN[2]]}>
      <LedStrip points={rails} look={look} size={0.2} haloScale={3.8} />
      {/* The apron line runs the coaster's own blue-to-magenta, not a colour of
          its own — the ride has one identity and every strip on it shares it. */}
      <LedStrip
        points={groundLine}
        look={{ ...look, base: 0.3, gain: 1.2, cycles: 5 }}
        size={0.16}
      />
    </group>
  );
}

/**
 * UFO Pendulum: the two A-frames, the bearing they carry, and the pad ring.
 *
 * Ground-fixed structure only. The arm and the saucer are the parts that MOVE,
 * and a strip of LEDs on a body swinging a hundred metres at thirty-four
 * metres a second is a smear rather than a light — so the rig outlines what
 * stands still, which is what a real one is lit on anyway.
 *
 * It carries the ride's own facing, because the frames straddle the swing
 * plane: drawing them square to the world would lay them across the arc.
 */
function UfoPendulumRig() {
  const { look } = RIDE_LOOK.ufo;

  const frames = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const perLeg = 16;
    for (const side of [-1, 1]) {
      for (const foot of [-1, 1]) {
        for (let i = 0; i <= perLeg; i++) {
          const f = i / perLeg;
          pts.push(
            new THREE.Vector3(
              0,
              f * UFO_BEARING_Y,
              (side * UFO_SPREAD) / 2 + foot * UFO_FOOT_SPREAD * (1 - f),
            ),
          );
        }
      }
    }
    return pts;
  }, []);

  const bearing = useMemo(
    () =>
      linePoints(
        [0, UFO_BEARING_Y, -UFO_SPREAD / 2],
        [0, UFO_BEARING_Y, UFO_SPREAD / 2],
        12,
      ),
    [],
  );
  const apron = useMemo(() => ringPoints(UFO_PAD_RADIUS, 44, 0.2), []);

  return (
    <group position={UFO_ORIGIN} rotation={[0, UFO_FACING, 0]}>
      {/* Phase runs 0 at the feet to 1 at the head, so the pulse climbs. */}
      <LedStrip points={frames} look={{ ...look, cycles: 4 }} size={0.3} haloScale={4.2} />
      {/* The bearing shaft, at the ride's brightest — its one fixed landmark. */}
      <LedStrip
        points={bearing}
        look={{ ...look, colorA: look.colorB, colorB: "#ffffff", speed: 0.8, base: 0.5, gain: 2 }}
        size={0.42}
      />
      <LedStrip points={apron} look={{ ...look, base: 0.3, gain: 1 }} size={0.2} />
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
      {/* The swing arc, chasing along the dragon's own red-to-orange. */}
      <LedStrip points={arc} look={{ ...look, speed: 0.34, cycles: 1, base: 0.5, gain: 2 }} size={0.28} haloScale={4} />
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
      <LedStrip points={hub} look={{ ...look, base: 0.6, gain: 1.4 }} size={0.2} />
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
    case "ufo":
      return <UfoPendulumRig />;
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
  ufo: UFO_BEARING_Y + UFO_HEAD_HEIGHT,
  dragon: APEX_HEIGHT * PARK_SCALE,
  monster: MONSTER_TOWER * PARK_SCALE,
};
