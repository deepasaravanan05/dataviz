"use client";

import { Text } from "@react-three/drei";
import { useMemo } from "react";
import {
  activeDepartmentsForRide,
  useActiveJourneyStore,
} from "@/simulation/journey/activeJourney";
import {
  RIDE_SIGNS,
  SIGN_BOARD_BOTTOM,
  SIGN_BOARD_HEIGHT,
  SIGN_HALF_WIDTH,
  SIGN_POST_HEIGHT,
  TEAM_SIGNS,
  type RideSign,
  type TeamSign,
} from "./rideSigns";
import { TRAIN_TEAM_ID } from "./trainTeam";
import { CHAIRS_TEAM_ID } from "@/components/flying-chairs/constants";
import { LOOPER_RIDE_ID } from "@/components/super-looper/constants";
import { LOOPER_SIGN } from "@/components/super-looper/sign";
import { TEACUPS_RIDE_ID } from "@/components/tea-cups/constants";
import { TEACUPS_SIGN } from "@/components/tea-cups/sign";
import { DUMBO_RIDE_ID } from "@/components/dumbo-ride/constants";
import { DUMBO_SIGN } from "@/components/dumbo-ride/sign";

/**
 * The department signboard that stands beside each ride.
 *
 * ADD-ONLY: it is a separate object on open ground, never a change to a ride.
 * No ride is moved, resized, recoloured or re-animated to make room — the
 * placement search in `rideSigns.ts` works around the park exactly as it is.
 *
 * The text is read from `RIDE_DEPARTMENTS`, the same source the click-through
 * department panel uses, so the sign and the panel cannot disagree.
 *
 * Deliberately the same sign vocabulary as the main gate and the food court —
 * navy board, amber trim, white lettering — so it reads as part of the park
 * rather than an annotation stuck on top of it.
 */

const TRIM = "#2f4562";
const ACCENT = "#f2b134";
const POST = "#8d99a8";
const BOARD_MID = SIGN_BOARD_BOTTOM + SIGN_BOARD_HEIGHT / 2;

function Sign({ sign }: { sign: RideSign | TeamSign }) {
  /*
   * The lettering follows the ACTIVE roster: the built-in mapping's names by
   * default, and after an upload the departments whose staff actually walk to
   * this ride. A ride an upload sends nobody to keeps its built-in label —
   * a blank signboard would read as a broken one. Geometry and placement are
   * untouched either way.
   */
  const source = useActiveJourneyStore((s) => s.source);
  const revision = useActiveJourneyStore((s) => s.revision);
  const departments = useMemo(() => {
    /* These are team LABELS, not routing destinations — no roster sends
       anybody to them, so there is no active department to read and their
       boards always say what their own modules say. */
    if (
      sign.rideId === TRAIN_TEAM_ID ||
      sign.rideId === CHAIRS_TEAM_ID ||
      sign.rideId === LOOPER_RIDE_ID ||
      sign.rideId === TEACUPS_RIDE_ID ||
      sign.rideId === DUMBO_RIDE_ID
    ) {
      return sign.departments;
    }
    if (source === "builtin") return sign.departments;
    const active = activeDepartmentsForRide(sign.rideId);
    return active.length > 0 ? active : sign.departments;
    // revision re-runs this when a new roster lands.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, revision, sign]);
  return (
    <group position={[sign.position[0], 0, sign.position[1]]} rotation={[0, sign.facing, 0]}>
      {/* Plinth */}
      <mesh position={[0, 0.12, 0]} receiveShadow>
        <boxGeometry args={[2.2, 0.24, 0.9]} />
        <meshStandardMaterial color="#98a3b0" roughness={0.9} />
      </mesh>

      {/* Twin posts */}
      {[-SIGN_HALF_WIDTH + 0.5, SIGN_HALF_WIDTH - 0.5].map((x) => (
        <mesh key={x} position={[x, SIGN_POST_HEIGHT / 2 + 0.24, 0]} castShadow>
          <cylinderGeometry args={[0.075, 0.095, SIGN_POST_HEIGHT, 8]} />
          <meshStandardMaterial color={POST} roughness={0.6} metalness={0.25} />
        </mesh>
      ))}

      {/* Board */}
      <mesh position={[0, BOARD_MID, 0]} castShadow receiveShadow>
        <boxGeometry args={[SIGN_HALF_WIDTH * 2, SIGN_BOARD_HEIGHT, 0.14]} />
        <meshStandardMaterial color={TRIM} roughness={0.55} />
      </mesh>
      {/* Amber cap rail, matching the gate */}
      <mesh position={[0, SIGN_BOARD_BOTTOM + SIGN_BOARD_HEIGHT + 0.09, 0]} castShadow>
        <boxGeometry args={[SIGN_HALF_WIDTH * 2 + 0.24, 0.18, 0.26]} />
        <meshStandardMaterial color={ACCENT} roughness={0.45} metalness={0.3} />
      </mesh>

      {/* Departments (one line each — some rides serve two), then the ride
          name. Both faces are lettered so the sign is not blank when read from
          inside the park. Lettering shrinks to fit the board, so a long name
          like "Data Engineering" never bleeds past the edge. */}
      {[0.085, -0.085].map((z) => {
        const longest = Math.max(...departments.map((d) => d.length));
        const deptSize = Math.min(0.66, (SIGN_HALF_WIDTH * 2 - 0.5) / (longest * 0.56));
        const two = departments.length > 1;
        return (
          <group key={z} position={[0, 0, z]} rotation={[0, z > 0 ? 0 : Math.PI, 0]}>
            {departments.map((dept, i) => (
              <Text
                key={dept}
                position={[0, BOARD_MID + (two ? 0.52 - i * (deptSize + 0.16) : 0.32), 0]}
                fontSize={deptSize}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.018}
                outlineColor="#0b1b2e"
              >
                {dept}
              </Text>
            ))}
            <Text
              position={[0, BOARD_MID - (two ? 0.68 : 0.52), 0]}
              fontSize={two ? 0.32 : 0.38}
              color={ACCENT}
              anchorX="center"
              anchorY="middle"
            >
              {sign.rideName}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

export function RideDepartmentSigns() {
  return (
    <group>
      {RIDE_SIGNS.map((sign) => (
        <Sign key={sign.rideId} sign={sign} />
      ))}
      {/* The team boards for the rides that are not department rides — the
          Park Train and the Flying Chairs. Same vocabulary, each solved
          against the park it stands in. */}
      {TEAM_SIGNS.map((sign) => (
        <Sign key={sign.rideId} sign={sign} />
      ))}
      {/* And the Super Looper's, which is solved in its own module for a
          dependency reason rather than a stylistic one — see sign.ts. */}
      <Sign sign={LOOPER_SIGN} />
      <Sign sign={TEACUPS_SIGN} />
      <Sign sign={DUMBO_SIGN} />
    </group>
  );
}
