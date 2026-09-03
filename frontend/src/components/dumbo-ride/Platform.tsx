"use client";

import { useMemo } from "react";
import {
  ARM_PITCH_RADIANS,
  DECK_Y,
  GALLERY_INNER_RADIUS,
  GALLERY_OUTER_RADIUS,
  GALLERY_POSTS,
  GALLERY_THICKNESS,
  HOWDAH_WIDTH,
  PLINTH_HEIGHT,
  PLINTH_RADIUS,
  RAIL_HEIGHT,
} from "./constants";
import { MATERIAL, annulus } from "./parts";
import { LANE_GAP, STAIR_GOING, STAIR_WIDTH } from "@/simulation/journey/boardingStair";
import { STATION_FLIGHTS, STATION_RISE } from "./station";

/**
 * THE GROUND-FIXED HALF: the pad the machine stands on, the gallery people
 * board from, and the stair up to it.
 *
 * WHY THE GALLERY IS WHERE IT IS. The elephants park on a circle of their own
 * — the arm all the way down, so `ARM_LENGTH * cos(ARM_SWING)` rather than the
 * full arm — and the gallery is a ring just inside it, a step's width from a
 * parked elephant's flank. Its deck is level with the howdah floors, which is
 * the whole boarding arrangement of this ride in one sentence: the elephants
 * come down twenty-three metres to the people, and the people step across.
 *
 * SO THE RAIL IS NOT CONTINUOUS. Sixteen gaps in it, one under each parked
 * elephant, because a rail across the gap somebody steps over would be a fence
 * rather than a handrail. Everywhere else it is closed.
 *
 * AND THE STAIR IS A SWITCHBACK. Getting to the howdahs means getting up to
 * their height, and the park's own rule about how tall one flight may run
 * turns that into three flights with landings between — laid inside the
 * gallery, where the elephants never reach, and climbed after walking in under
 * a parked one. See station.ts for the arithmetic and `boardingStair.ts` for
 * the step itself.
 */

/** The concrete pad the whole machine stands in. */
export function Plinth() {
  return (
    <group>
      <mesh position={[0, PLINTH_HEIGHT / 2, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[PLINTH_RADIUS, PLINTH_RADIUS * 1.02, PLINTH_HEIGHT, 64]} />
        <primitive object={MATERIAL.plinth} attach="material" />
      </mesh>
      <mesh position={[0, PLINTH_HEIGHT, 0]}>
        <primitive
          object={annulus(PLINTH_RADIUS * 0.96, PLINTH_RADIUS, 0.12, 64)}
          attach="geometry"
        />
        <primitive object={MATERIAL.plinthTrim} attach="material" />
      </mesh>
    </group>
  );
}

/** The boarding gallery: an annular deck, its legs, and its broken rails. */
export function Gallery() {
  const midRadius = (GALLERY_INNER_RADIUS + GALLERY_OUTER_RADIUS) / 2;

  const legs = useMemo(
    () =>
      Array.from({ length: GALLERY_POSTS }, (_, i) => {
        const angle = (i / GALLERY_POSTS) * Math.PI * 2;
        return { key: i, x: Math.cos(angle) * midRadius, z: Math.sin(angle) * midRadius };
      }),
    [midRadius],
  );

  /*
   * The rail, broken at every boarding bay. A bay is as wide as the howdah it
   * serves, so the opening is set by the vehicle rather than chosen — sixteen
   * arcs of rail with sixteen gaps, and the arcs are what is left over.
   */
  const bayHalfAngle = Math.atan2(HOWDAH_WIDTH * 0.62, GALLERY_OUTER_RADIUS);
  const railArcs = useMemo(
    () =>
      Array.from({ length: GALLERY_POSTS }, (_, i) => ({
        key: i,
        start: i * ARM_PITCH_RADIANS + bayHalfAngle,
        span: ARM_PITCH_RADIANS - 2 * bayHalfAngle,
      })),
    [bayHalfAngle],
  );

  return (
    <group>
      {/* The deck. */}
      <mesh position={[0, DECK_Y - GALLERY_THICKNESS, 0]} receiveShadow castShadow>
        <primitive
          object={annulus(GALLERY_INNER_RADIUS, GALLERY_OUTER_RADIUS, GALLERY_THICKNESS, 64)}
          attach="geometry"
        />
        <primitive object={MATERIAL.deck} attach="material" />
      </mesh>

      {/* Its legs. */}
      {legs.map((leg) => (
        <mesh key={leg.key} position={[leg.x, (PLINTH_HEIGHT + DECK_Y) / 2, leg.z]} castShadow>
          <cylinderGeometry args={[0.28, 0.34, DECK_Y - PLINTH_HEIGHT, 10]} />
          <primitive object={MATERIAL.steelDark} attach="material" />
        </mesh>
      ))}

      {/* Outer rail, in sixteen arcs with a gap at each boarding bay. */}
      {railArcs.map((arc) => (
        <group key={arc.key} rotation={[0, -arc.start, 0]}>
          <mesh position={[0, DECK_Y + RAIL_HEIGHT, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[GALLERY_OUTER_RADIUS - 0.15, 0.07, 6, 24, arc.span]} />
            <primitive object={MATERIAL.steel} attach="material" />
          </mesh>
          <mesh position={[0, DECK_Y + RAIL_HEIGHT * 0.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[GALLERY_OUTER_RADIUS - 0.15, 0.05, 6, 24, arc.span]} />
            <primitive object={MATERIAL.steel} attach="material" />
          </mesh>
          {[0, arc.span].map((end) => (
            <mesh
              key={end}
              position={[
                Math.cos(end) * (GALLERY_OUTER_RADIUS - 0.15),
                DECK_Y + RAIL_HEIGHT / 2,
                Math.sin(end) * (GALLERY_OUTER_RADIUS - 0.15),
              ]}
            >
              <cylinderGeometry args={[0.08, 0.08, RAIL_HEIGHT, 8]} />
              <primitive object={MATERIAL.steel} attach="material" />
            </mesh>
          ))}
        </group>
      ))}

      {/* Inner rail, closed all the way round except where the stair arrives. */}
      <mesh
        position={[0, DECK_Y + RAIL_HEIGHT, 0]}
        rotation={[Math.PI / 2, 0, -bayHalfAngle * 2]}
      >
        <torusGeometry
          args={[GALLERY_INNER_RADIUS + 0.15, 0.07, 6, 96, Math.PI * 2 - bayHalfAngle * 4]}
        />
        <primitive object={MATERIAL.steel} attach="material" />
      </mesh>
    </group>
  );
}

/**
 * The stair, laid as a switchback inside the gallery.
 *
 * Flights run tangentially and stack radially, the topmost arriving at the
 * gallery's inner edge — so the whole climb sits in the ground the machine
 * never sweeps, and nobody walks under a moving elephant to reach it.
 */
export function Stair() {
  const flights = STATION_FLIGHTS;
  const rise = STATION_RISE;
  const lane = STAIR_WIDTH + LANE_GAP;
  const tread = 0.1;

  const parts = useMemo(() => {
    const steps: {
      key: string;
      position: [number, number, number];
      size: [number, number, number];
    }[] = [];
    let climbed = 0;

    flights.forEach((count, i) => {
      const x = GALLERY_INNER_RADIUS - (flights.length - i - 0.5) * lane;
      const direction = i % 2 === 0 ? 1 : -1;
      const run = count * STAIR_GOING;

      for (let n = 0; n < count; n += 1) {
        const y = PLINTH_HEIGHT + (climbed + n + 1) * rise;
        const z = direction * (-run / 2 + (n + 0.5) * STAIR_GOING);
        steps.push({
          key: `${i}-${n}`,
          position: [x, y - tread / 2, z],
          size: [STAIR_WIDTH, tread, STAIR_GOING],
        });
        /* The riser behind each tread, so the flight reads as a stair rather
           than as a ladder of floating boards. */
        steps.push({
          key: `${i}-${n}-r`,
          position: [x, y - rise / 2, z - (direction * STAIR_GOING) / 2],
          size: [STAIR_WIDTH, rise, 0.08],
        });
      }

      climbed += count;

      /* A landing at the head of every flight but the last, wide enough to
         turn round on: it bridges this lane and the next. */
      if (i < flights.length - 1) {
        const y = PLINTH_HEIGHT + climbed * rise;
        steps.push({
          key: `landing-${i}`,
          position: [x + lane / 2, y - tread / 2, (direction * (run + STAIR_WIDTH)) / 2],
          size: [lane + STAIR_WIDTH, tread, STAIR_WIDTH],
        });
      }
    });

    return steps;
  }, [flights, lane, rise, tread]);

  return (
    <group>
      {parts.map((part) => (
        <mesh key={part.key} position={part.position} castShadow receiveShadow>
          <boxGeometry args={part.size} />
          <primitive object={MATERIAL.deck} attach="material" />
        </mesh>
      ))}
    </group>
  );
}
