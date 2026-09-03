"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { Boarding } from "./Boarding";
import { Canopy } from "./Canopy";
import { Chair } from "./Chair";
import { Spider, Tower } from "./Tower";
import {
  CANOPY_SOFFIT_Y,
  HANGER_RADIUS,
  RIDE_CENTER,
  ROTATION_RADIANS_PER_SEC,
  ROTATION_SIGN,
  chairColor,
  validateFlyingChairs,
} from "./constants";
import { CYCLE_SECONDS, sweepAt } from "./liftCycle";
import { SEAT_PLACEMENTS } from "./seatRing";

/**
 * THE FLYING CHAIRS, ASSEMBLED AND RUNNING.
 *
 * Built in the order a real one is erected: the plinth and the column, the
 * loading gallery and its ladder, the hub and its spider of arms, the canopy
 * the arms carry, and the twenty chairs hung from the canopy soffit.
 *
 * WHAT TURNS. The plinth, the column, the gallery and the ladder are
 * ground-fixed; everything above the slew bearing — hub, arms, canopy, crown
 * and all twenty chairs — is one rotating assembly, so the chairs can never
 * drift out of step with the roof they hang from. One group, one angle,
 * exactly as the machine works.
 *
 * WHAT GOES UP AND DOWN. That whole rotating assembly is also a SWEEP that
 * rides the mast: it comes down to the gallery to load, stands still while
 * people get on and off, climbs back to working height, and cruises. One
 * group, one height, so the roof and the chairs can never separate. The
 * timetable and every height it passes through are in liftCycle.ts, which is
 * also what the verify script sweeps — the ride that is checked is the ride
 * that is drawn.
 *
 * WHICH WAY IT TURNS. Clockwise seen from above, which is the NEGATIVE
 * direction about +Y — see ROTATION_SIGN in constants.ts for why, and
 * scripts/verify-flying-chairs.ts for the check that actually watches a chair
 * go round rather than reading the sign. The drive ramp `spin` scales that
 * rotation between nought and working speed as the ride winds up and down; it
 * never changes its sign, so the ride only ever turns one way.
 *
 * WHERE IT STANDS. The ride positions itself from `RIDE_CENTER`, solved from
 * where the gate and the food court already are. It is mounted in world space
 * in the park scene with no offset and no scale of its own: nothing in the
 * park had to move, be resized or be re-solved to admit it.
 */
export function FlyingChairs() {
  const turntable = useRef<Group>(null);
  const lift = useRef<Group>(null);
  const flares = useRef<(Group | null)[]>([]);
  /**
   * The ride keeps its OWN clock — real seconds since the page opened, wrapped
   * at the cycle length. It is not the simulation's clock and not a store: the
   * machine runs its cycle whatever the park is doing, which is how every
   * other moving part of this ride already behaves.
   */
  const cycle = useRef(0);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") validateFlyingChairs();
  }, []);

  useFrame((_, delta) => {
    if (!turntable.current || !lift.current) return;
    cycle.current = (cycle.current + delta) % CYCLE_SECONDS;
    const sweep = sweepAt(cycle.current);

    turntable.current.rotation.y += ROTATION_SIGN * ROTATION_RADIANS_PER_SEC * delta * sweep.spin;
    lift.current.position.y = sweep.liftY;
    for (const flare of flares.current) {
      if (flare) flare.rotation.z = sweep.flare;
    }
  });

  return (
    <group position={[RIDE_CENTER[0], 0, RIDE_CENTER[1]]}>
      {/* Ground-fixed: the plinth, the column, and the way a rider gets on. */}
      <Tower />
      <Boarding />

      {/* The sweep: it rides up and down the mast... */}
      <group ref={lift}>
        {/* ...and everything on it turns as one, clockwise. */}
        <group ref={turntable}>
          <Spider />
          <Canopy />
          {SEAT_PLACEMENTS.map((placement) => (
            <Chair
              key={placement.index}
              azimuth={placement.azimuth}
              hangerRadius={HANGER_RADIUS}
              hangerY={CANOPY_SOFFIT_Y}
              color={chairColor(placement.index)}
              flareRef={(group) => {
                flares.current[placement.index] = group;
              }}
            />
          ))}
        </group>
      </group>
    </group>
  );
}
