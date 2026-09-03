"use client";

import { useMemo } from "react";
import {
  BODY_LENGTH,
  BODY_RADIUS,
  EAR_RADIUS,
  EAR_THICKNESS,
  HEAD_RADIUS,
  HOWDAH_LENGTH,
  HOWDAH_WALL,
  HOWDAH_WIDTH,
  LEG_LENGTH,
  LEG_RADIUS,
  RIDE_SCALE,
  SEAT_BACK_HEIGHT,
  SEAT_PAN_Y,
  SEATS_PER_VEHICLE,
  SILL_ABOVE_FEET,
  TRUNK_LENGTH,
  TRUNK_RADIUS,
} from "./constants";
import { MATERIAL, liveryMaterial } from "./parts";

/**
 * ONE FLYING ELEPHANT, built about its own FEET.
 *
 * The origin of this component is the foot line, because that is the height
 * the rest of the ride reasons about: constants.ts parks the vehicle by
 * putting its feet FOOT_CLEARANCE above the plinth, and the gallery is then
 * built level with the howdah's sill, SILL_ABOVE_FEET higher. Anything drawn
 * here is measured from the same zero, so the arithmetic that places the
 * vehicle and the geometry that fills it cannot drift apart.
 *
 * ORIENTATION. Inside this component the ride's radius runs along X and the
 * direction of travel along -Z, so the elephant faces -Z: heading the way it
 * is being carried, with its flank turned to anybody watching from outside the
 * ring. The howdah's two seats sit side by side across the back.
 *
 * IT IS ONE ANIMAL AT ONE SCALE. Every dimension comes from constants.ts as a
 * real elephant's proportion times RIDE_SCALE, so the head always matches the
 * body and the ears always match the head, whatever the ride is built to.
 */

/**
 * The trunk: a tapering chain of segments laid ON A CIRCULAR ARC, hanging down
 * from the face and curling forward to the tip.
 *
 * The arc is what makes it a trunk rather than a handful of stubs. Each
 * segment sits at `(0, -R sin f, -R (1 - cos f))` for its own angle along the
 * quarter turn, and is tilted by that same angle so its axis lies along the
 * tangent — which means consecutive segments meet end to end by construction.
 * Sampling a curve for position and a different function for angle is exactly
 * what broke the first version, and it showed: a line of disconnected pieces
 * hanging off the head.
 */
const TRUNK_SEGMENTS = 12;
const TRUNK_ARC_RADIUS = TRUNK_LENGTH / (Math.PI / 2);

function Trunk() {
  const segments = useMemo(
    () =>
      Array.from({ length: TRUNK_SEGMENTS }, (_, i) => {
        const t = (i + 0.5) / TRUNK_SEGMENTS;
        const angle = (Math.PI / 2) * t;
        return {
          key: i,
          radius: TRUNK_RADIUS * (1 - 0.5 * t),
          /* A shade longer than its share, so the joints are lapped. */
          length: (TRUNK_LENGTH / TRUNK_SEGMENTS) * 1.45,
          y: -TRUNK_ARC_RADIUS * Math.sin(angle),
          z: -TRUNK_ARC_RADIUS * (1 - Math.cos(angle)),
          tilt: -angle,
        };
      }),
    [],
  );

  return (
    <group>
      {segments.map((s) => (
        <mesh key={s.key} position={[0, s.y, s.z]} rotation={[s.tilt, 0, 0]}>
          <cylinderGeometry args={[s.radius, s.radius * 0.9, s.length, 10]} />
          <primitive object={MATERIAL.hide} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

function Head() {
  const eyeX = HEAD_RADIUS * 0.55;
  const eyeY = HEAD_RADIUS * 0.25;
  const eyeZ = -HEAD_RADIUS * 0.78;

  return (
    <group>
      {/* The skull. Slightly flattened front to back, like the real thing. */}
      <mesh castShadow scale={[1, 1.05, 0.86]}>
        <sphereGeometry args={[HEAD_RADIUS, 20, 16]} />
        <primitive object={MATERIAL.hide} attach="material" />
      </mesh>

      {/* THE EARS, which are the whole silhouette of a Dumbo — big discs
          angled off the sides of the head, drawn but not cast: a fan of thin
          shells is not legible in a shadow map from across the park. */}
      {[-1, 1].map((side) => (
        <group
          key={side}
          position={[side * HEAD_RADIUS * 0.82, HEAD_RADIUS * 0.12, HEAD_RADIUS * 0.1]}
          rotation={[0, side * 0.5, side * -0.35]}
        >
          <mesh scale={[EAR_THICKNESS / EAR_RADIUS, 1, 1.12]}>
            <sphereGeometry args={[EAR_RADIUS, 16, 12]} />
            <primitive object={MATERIAL.ear} attach="material" />
          </mesh>
        </group>
      ))}

      {/* Eyes. */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * eyeX, eyeY, eyeZ]}>
          <mesh>
            <sphereGeometry args={[HEAD_RADIUS * 0.17, 12, 10]} />
            <primitive object={MATERIAL.eye} attach="material" />
          </mesh>
          <mesh position={[side * 0.02 * RIDE_SCALE, 0, -HEAD_RADIUS * 0.1]}>
            <sphereGeometry args={[HEAD_RADIUS * 0.09, 10, 8]} />
            <primitive object={MATERIAL.pupil} attach="material" />
          </mesh>
        </group>
      ))}

      {/* Tusks. */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * HEAD_RADIUS * 0.42, -HEAD_RADIUS * 0.45, -HEAD_RADIUS * 0.66]}
          rotation={[-1.15, 0, side * 0.18]}
        >
          <coneGeometry args={[HEAD_RADIUS * 0.13, HEAD_RADIUS * 0.9, 8]} />
          <primitive object={MATERIAL.eye} attach="material" />
        </mesh>
      ))}

      {/* And the trunk, hung off the face. */}
      <group position={[0, -HEAD_RADIUS * 0.55, -HEAD_RADIUS * 0.72]}>
        <Trunk />
      </group>
    </group>
  );
}

/**
 * The howdah: the box on the elephant's back that riders actually sit in.
 *
 * Its FLOOR is at SILL_ABOVE_FEET, which is the number the gallery outside is
 * built to — so when the arms are down, the deck a rider is standing on and
 * the floor they are stepping onto are the same height, and the whole boarding
 * arrangement of this ride is that one equality.
 */
function Howdah({ color }: { color: string }) {
  const half = HOWDAH_WIDTH / 2;
  const floorThickness = 0.14 * RIDE_SCALE;
  const wallThickness = 0.12 * RIDE_SCALE;
  const seatPitch = HOWDAH_WIDTH / SEATS_PER_VEHICLE;

  return (
    <group position={[0, SILL_ABOVE_FEET, 0]}>
      {/* Floor. */}
      <mesh position={[0, -floorThickness / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[HOWDAH_WIDTH, floorThickness, HOWDAH_LENGTH]} />
        <primitive object={liveryMaterial(color)} attach="material" />
      </mesh>

      {/* Four walls, open at the top. */}
      {[
        { pos: [0, HOWDAH_WALL / 2, -HOWDAH_LENGTH / 2] as const, size: [HOWDAH_WIDTH, HOWDAH_WALL, wallThickness] as const },
        { pos: [0, HOWDAH_WALL / 2, HOWDAH_LENGTH / 2] as const, size: [HOWDAH_WIDTH, HOWDAH_WALL, wallThickness] as const },
        { pos: [-half, HOWDAH_WALL / 2, 0] as const, size: [wallThickness, HOWDAH_WALL, HOWDAH_LENGTH] as const },
        { pos: [half, HOWDAH_WALL / 2, 0] as const, size: [wallThickness, HOWDAH_WALL, HOWDAH_LENGTH] as const },
      ].map((wall, i) => (
        <mesh key={i} position={wall.pos} castShadow>
          <boxGeometry args={wall.size} />
          <primitive object={liveryMaterial(color)} attach="material" />
        </mesh>
      ))}

      {/* Gilt cap rail all round the top of the walls. */}
      {[-1, 1].map((side) => (
        <mesh key={`z${side}`} position={[0, HOWDAH_WALL, (side * HOWDAH_LENGTH) / 2]}>
          <boxGeometry args={[HOWDAH_WIDTH * 1.03, wallThickness, wallThickness * 1.6]} />
          <primitive object={MATERIAL.howdahTrim} attach="material" />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={`x${side}`} position={[(side * HOWDAH_WIDTH) / 2, HOWDAH_WALL, 0]}>
          <boxGeometry args={[wallThickness * 1.6, wallThickness, HOWDAH_LENGTH * 1.03]} />
          <primitive object={MATERIAL.howdahTrim} attach="material" />
        </mesh>
      ))}

      {/* Two seats across the back.

          THE HOWDAH'S WALL IS THE SEAT BACK, which is how a howdah is built
          and also the only thing that looks right: a backrest sized off this
          park's 3.4 m figures stands a metre proud of the box it is in, and
          sixteen of them read as sixteen little sails from across the park.
          So what is drawn here is the cushion a rider sits on, and the wall
          behind it does the rest. */}
      {Array.from({ length: SEATS_PER_VEHICLE }, (_, i) => {
        const x = (i - (SEATS_PER_VEHICLE - 1) / 2) * seatPitch;
        return (
          <group key={i} position={[x, 0, 0]}>
            <mesh position={[0, SEAT_PAN_Y, HOWDAH_LENGTH * 0.08]}>
              <boxGeometry args={[seatPitch * 0.86, SEAT_PAN_Y * 0.3, HOWDAH_LENGTH * 0.5]} />
              <primitive object={MATERIAL.cushion} attach="material" />
            </mesh>
            <mesh
              position={[
                0,
                SEAT_PAN_Y + Math.min(SEAT_BACK_HEIGHT, HOWDAH_WALL - SEAT_PAN_Y) / 2,
                -HOWDAH_LENGTH * 0.2,
              ]}
            >
              <boxGeometry
                args={[
                  seatPitch * 0.86,
                  Math.min(SEAT_BACK_HEIGHT, HOWDAH_WALL - SEAT_PAN_Y),
                  HOWDAH_LENGTH * 0.12,
                ]}
              />
              <primitive object={MATERIAL.cushion} attach="material" />
            </mesh>
          </group>
        );
      })}

      {/* THE LEVER. It is the whole point of a Dumbo — the rider works it and
          the arm follows — so it is drawn, standing where a hand falls. */}
      <mesh
        position={[HOWDAH_WIDTH * 0.32, HOWDAH_WALL * 0.9, HOWDAH_LENGTH * 0.34]}
        rotation={[0.25, 0, 0]}
      >
        <cylinderGeometry args={[0.05 * RIDE_SCALE, 0.06 * RIDE_SCALE, HOWDAH_WALL * 1.1, 8]} />
        <primitive object={MATERIAL.steelDark} attach="material" />
      </mesh>
      <mesh position={[HOWDAH_WIDTH * 0.32, HOWDAH_WALL * 1.48, HOWDAH_LENGTH * 0.42]}>
        <sphereGeometry args={[0.09 * RIDE_SCALE, 10, 8]} />
        <primitive object={MATERIAL.howdahTrim} attach="material" />
      </mesh>
    </group>
  );
}

/** A complete vehicle: the animal, its howdah, and the saddle blanket between. */
export function Elephant({ color }: { color: string }) {
  const legs = useMemo(
    () =>
      [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sz], i) => ({
        key: i,
        x: sx * BODY_RADIUS * 0.55,
        z: sz * BODY_LENGTH * 0.26,
      })),
    [],
  );

  const bodyY = LEG_LENGTH + BODY_RADIUS;

  return (
    <group>
      {/* Legs, tucked and stubby: it is flying, not walking.

          They are drawn UP INTO THE BODY rather than up to it. The body is an
          ellipsoid, so its underside is only at LEG_LENGTH on the centreline —
          out at the shoulders, where the legs actually are, it curves away, and
          a leg of exactly LEG_LENGTH left a visible gap under every elephant.
          Running each one to the body's own centre buries the joint. */}
      {legs.map((leg) => (
        <group key={leg.key} position={[leg.x, 0, leg.z]}>
          <mesh position={[0, bodyY / 2, 0]} castShadow>
            <cylinderGeometry args={[LEG_RADIUS * 0.92, LEG_RADIUS, bodyY, 12]} />
            <primitive object={MATERIAL.hide} attach="material" />
          </mesh>
          <mesh position={[0, LEG_RADIUS * 0.35, 0]}>
            <cylinderGeometry args={[LEG_RADIUS * 1.06, LEG_RADIUS * 1.06, LEG_RADIUS * 0.7, 12]} />
            <primitive object={MATERIAL.hideShade} attach="material" />
          </mesh>
        </group>
      ))}

      {/* The body. */}
      <mesh position={[0, bodyY, 0]} scale={[0.85, 1, BODY_LENGTH / 2 / BODY_RADIUS]} castShadow receiveShadow>
        <sphereGeometry args={[BODY_RADIUS, 24, 18]} />
        <primitive object={MATERIAL.hide} attach="material" />
      </mesh>

      {/* Head, forward and a little high, on the shoulders. */}
      <group position={[0, bodyY + BODY_RADIUS * 0.18, -BODY_LENGTH * 0.5 - HEAD_RADIUS * 0.35]}>
        <Head />
      </group>

      {/* Tail. */}
      <mesh
        position={[0, bodyY + BODY_RADIUS * 0.5, BODY_LENGTH * 0.5]}
        rotation={[0.9, 0, 0]}
      >
        <cylinderGeometry args={[TRUNK_RADIUS * 0.32, TRUNK_RADIUS * 0.5, BODY_RADIUS * 1.1, 8]} />
        <primitive object={MATERIAL.hide} attach="material" />
      </mesh>

      {/* Saddle blanket, lying ON the back rather than floating over it — it
          is scaled about the body's own centre so it hugs the same ellipsoid. */}
      <mesh position={[0, bodyY + BODY_RADIUS * 0.35, 0]} scale={[0.88, 0.32, 1.0]}>
        <sphereGeometry args={[BODY_RADIUS, 20, 14]} />
        <primitive object={liveryMaterial(color)} attach="material" />
      </mesh>

      <Howdah color={color} />
    </group>
  );
}
