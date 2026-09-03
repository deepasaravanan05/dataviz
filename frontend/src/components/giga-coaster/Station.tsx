"use client";

import { useMemo } from "react";
import {
  CANOPY_HEIGHT,
  CANOPY_OVERHANG,
  PLATFORM_HALF_LENGTH,
  PLATFORM_THICKNESS,
  PLATFORM_WIDTH,
  RAIL_HEIGHT,
  TRACK_GAUGE,
} from "./constants";
import { PLATFORM_Y } from "./station";
import { STATION_DISTANCE } from "./trackCurve";
import { frameAtDistance } from "./trackFrames";
import { MATERIAL } from "./parts";
import { STAIR_GOING, STAIR_RISE, STAIR_WIDTH } from "@/simulation/journey/boardingStair";

/**
 * THE STATION: a platform beside the track, a roof over it, and the steps up.
 *
 * IT IS PLACED ON THE TRACK ITSELF rather than at a typed coordinate — the
 * station straight's own frame gives where it is and which way it faces, so
 * the platform is beside the rail the train actually stops on and cannot drift
 * from it if the layout changes.
 *
 * The boards are level with the car floor, which is what a station is: riders
 * step across rather than up. And the steps up to the platform are the PARK's
 * own step, from `boardingStair.ts`, so this flight matches every other one in
 * the park rather than inventing a rise of its own.
 */
export function Station() {
  const frame = useMemo(() => frameAtDistance(STATION_DISTANCE + PLATFORM_HALF_LENGTH * 0.2), []);

  const steps = Math.max(1, Math.round(PLATFORM_Y / STAIR_RISE));
  const rise = PLATFORM_Y / steps;
  /* The platform stands on the right of the track, clear of the cars. */
  const offset = TRACK_GAUGE / 2 + PLATFORM_WIDTH / 2 + 0.6;

  return (
    <group
      position={[frame.position.x, 0, frame.position.z]}
      rotation={[0, Math.atan2(frame.tangent.x, frame.tangent.z), 0]}
    >
      {/* The boards. */}
      <mesh
        position={[offset, PLATFORM_Y - PLATFORM_THICKNESS / 2, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[PLATFORM_WIDTH, PLATFORM_THICKNESS, PLATFORM_HALF_LENGTH * 2]} />
        <primitive object={MATERIAL.deck} attach="material" />
      </mesh>
      <mesh position={[offset - PLATFORM_WIDTH / 2, PLATFORM_Y, 0]}>
        <boxGeometry args={[0.24, 0.16, PLATFORM_HALF_LENGTH * 2]} />
        <primitive object={MATERIAL.deckTrim} attach="material" />
      </mesh>

      {/* Legs under it. */}
      {[-1, -0.34, 0.34, 1].map((f) => (
        <mesh
          key={f}
          position={[
            offset + PLATFORM_WIDTH * 0.3,
            (PLATFORM_Y - PLATFORM_THICKNESS) / 2,
            f * (PLATFORM_HALF_LENGTH - 1),
          ]}
        >
          <cylinderGeometry args={[0.2, 0.22, PLATFORM_Y - PLATFORM_THICKNESS, 8]} />
          <primitive object={MATERIAL.supportDark} attach="material" />
        </mesh>
      ))}

      {/* A back rail, and the roof over the platform. */}
      {[0, 1].map((k) => (
        <mesh
          key={k}
          position={[
            offset + PLATFORM_WIDTH / 2,
            PLATFORM_Y + RAIL_HEIGHT * (k ? 1 : 0.55),
            0,
          ]}
        >
          <boxGeometry args={[0.09, 0.09, PLATFORM_HALF_LENGTH * 2]} />
          <primitive object={MATERIAL.rail_hand} attach="material" />
        </mesh>
      ))}
      <mesh
        position={[offset - 0.4, PLATFORM_Y + CANOPY_HEIGHT, 0]}
        castShadow
      >
        <boxGeometry
          args={[
            PLATFORM_WIDTH + CANOPY_OVERHANG * 2,
            0.4,
            PLATFORM_HALF_LENGTH * 2 + CANOPY_OVERHANG,
          ]}
        />
        <primitive object={MATERIAL.canopy} attach="material" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[
            offset + PLATFORM_WIDTH / 2 - 0.3,
            PLATFORM_Y + CANOPY_HEIGHT / 2,
            s * (PLATFORM_HALF_LENGTH - 1.5),
          ]}
        >
          <cylinderGeometry args={[0.16, 0.16, CANOPY_HEIGHT, 8]} />
          <primitive object={MATERIAL.station} attach="material" />
        </mesh>
      ))}

      {/* One straight flight up to the platform, on the park's own step. */}
      {Array.from({ length: steps }, (_, i) => {
        const tread = rise * 0.26;
        return (
          <mesh
            key={i}
            position={[
              offset + PLATFORM_WIDTH / 2 + 0.4 + (steps - i - 0.5) * STAIR_GOING,
              (i + 1) * rise - tread / 2,
              PLATFORM_HALF_LENGTH - STAIR_WIDTH,
            ]}
            receiveShadow
          >
            <boxGeometry args={[STAIR_GOING, tread, STAIR_WIDTH]} />
            <primitive object={MATERIAL.deck} attach="material" />
          </mesh>
        );
      })}
    </group>
  );
}
