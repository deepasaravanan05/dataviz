"use client";

import { Text } from "@react-three/drei";
import {
  CHAIRS_PER_TABLE,
  CHAIR_RADIUS,
  FOOD_COURT_CENTER,
  FOOD_COURT_DOOR_LOCAL,
  FOOD_COURT_FACING,
  FOOD_COURT_TABLES,
  TABLE_TURN,
  chairAngle,
} from "@/simulation/journey/constants";
import { PROP } from "@/world/scale";
import { Bench, Bin, LampPost, MAT, Planter, Railing } from "@/components/world/kit";

/**
 * The park food court — the intermediate stop between checking in and reaching
 * a department ride, and the place a large share of the delay is spent.
 *
 * THE GRAND PAVILION.
 *
 * What stood here was a 40 x 15 m box with a pitched cone on top, stretched
 * 1.75x on Y to stop it looking small beside the rides. Stretching a box is not
 * architecture, and it read as exactly what it was.
 *
 * This is a building instead: an octagonal domed hall with a ribbed dome and a
 * lantern cupola, two arcaded wings either side, and a colonnaded veranda
 * across the whole front carrying the sign. Roughly 80 m across and 36 m to the
 * top of the cupola, against the 40 m and 25 m of the box it replaces.
 *
 * ITS HEIGHT IS REAL. The old hall's dimensions were the ones it was modelled
 * at, multiplied on one axis at render time, so no number in the file was the
 * height of anything — and the roof sign needed a counter-scale to stop its
 * lettering being stretched with the walls. Everything here is drawn at the
 * size it actually is, and the sign needs no correction because nothing is
 * distorted.
 *
 * The table positions come from the same constants the walking employees use,
 * so a diner always sits at a table that actually exists — and that is the only
 * reason the terrace changed at all: the court now holds exactly twenty seats,
 * five tables of four in one file, so `FOOD_COURT_TABLES` publishes five
 * centres instead of twenty and this file draws whatever it publishes. The
 * kiosks, benches, lamps, planting, railing and door marker are untouched.
 */

const TERRACE = "#b9ad97";
const WALL = "#f3e9d8";
const WALL_TRIM = "#c8562f";
const ROOF = "#8c3b23";
/** Two accents that tie the pavilion to the rest of the park. */
const TEAL = "#2a7f74";
const GOLD = "#e0a52c";

/**
 * THE PAVILION, dimensioned.
 *
 * Every part is derived from the hall's own radius, so the building keeps its
 * proportions if it is ever resized — and the numbers below ARE the metres it
 * stands at, not a figure waiting to be multiplied at render time.
 *
 * It has three hard limits, all checked in verify-entrance-signage.ts: it must
 * stay inside FOOD_COURT_HALF so the planting keep-out and the walking routes
 * still clear it, it must fit the food-court viewpoint's frame, and it must
 * stay well below the shortest ride so it never competes with an attraction.
 */
const HALL_R = 18;
const HALL_WALL_H = 14;
const HALL_PLINTH = 1;
const HALL_CORNICE = 1.6;
/** Centre of the octagon, in the court's local frame. */
const HALL_Z = -26;
/** Flat-to-flat: an octagon's face sits closer in than its corners. */
const HALL_FLAT = HALL_R * Math.cos(Math.PI / 8);

const DOME_SPRING = HALL_PLINTH + HALL_WALL_H + HALL_CORNICE;
const DOME_R = HALL_R * 1.02;
const DOME_RISE = 11;
const DOME_TOP = DOME_SPRING + DOME_RISE;
/** The lantern that caps the dome, and the very top of the building. */
const CUPOLA_R = HALL_R * 0.24;
const CUPOLA_H = 3.8;
/** The finial ball on the lantern, which is the highest point of the building. */
const CUPOLA_BASE = DOME_TOP - 0.4;
/**
 * HOW MUCH BIGGER THE BUILDING IS DRAWN THAN IT IS MODELLED.
 *
 * The hall was authored at 80 m across and 39 m to the finial, which was right
 * when it stood on its own beside the entrance avenue. It is now the building
 * at the middle of a 500 m circular plaza with a 240 m colonnade around it, a
 * ring of stalls and thirty tables — and at 80 m it read as a garden pavilion
 * lost in a square.
 *
 * So it is drawn half as large again. This is a UNIFORM scale on one group, so
 * nothing is stretched and nothing needs a counter-scale to undo a distortion —
 * the objection this file has always raised about the box it replaced does not
 * apply. Every exported dimension below is multiplied by it, so the numbers
 * this module publishes are the metres the building actually stands at, which
 * is the property that mattered about them in the first place.
 *
 * It is 1.5 and not more because the stalls ring the hall at 78 m: a bigger
 * factor would push the veranda out through them.
 */
export const PAVILION_SCALE = 1.5;

export const PAVILION_TOP =
  (CUPOLA_BASE + CUPOLA_H + CUPOLA_R * 1.5 + CUPOLA_R * 0.3) * PAVILION_SCALE;

/**
 * THE WINGS, LENGTHENED.
 *
 * The user asked for a LONGER food court — "increase mainly its LENGTH", not
 * its height and not its depth — with room inside for the twenty seats, the
 * tables, a service area and people moving between them. The building's long
 * axis is its frontage, so that is the axis that grew: each wing goes from
 * 19.5 m to 24 m, taking the whole frontage from 71 m to 80 m.
 *
 * NOTHING ELSE ABOUT THE BUILDING MOVES. The wings keep their 26 m depth and
 * their 10.5 m height, the domed hall keeps its radius, its wall height and its
 * 36 m cupola, the veranda keeps its projection, and the court stays exactly
 * where it has always stood. The terrace is derived from the frontage rather
 * than typed, so the paving lengthens with the building it carries.
 */
const WING_W = 24;
const WING_D = 26;
const WING_H = 10.5;
const WING_X = HALL_FLAT + WING_W / 2 - 0.6;

/** Half the pavilion's full frontage, kiosks and veranda excluded. */
export const PAVILION_HALF_WIDTH = (WING_X + WING_W / 2) * PAVILION_SCALE;

/** The veranda across the front, and how far it projects onto the terrace. */
const VERANDA_H = 6.6;
const VERANDA_OUT = 7;
const VERANDA_Z = HALL_Z + HALL_FLAT;

/**
 * The building's front and back edges, and the terrace that has to hold them.
 *
 * The pavilion was widened and lengthened again — the frontage from 56.5 m to
 * 71 m and now to 80 m, the depth holding at 42 m. The terrace is derived from
 * those rather than typed, so the paving always reaches past the building it
 * carries instead of leaving its back corners standing on grass.
 */
export const PAVILION_BACK = (HALL_Z - HALL_R) * PAVILION_SCALE;
export const PAVILION_FRONT = (VERANDA_Z + VERANDA_OUT) * PAVILION_SCALE;
export const PAVILION_DEPTH = PAVILION_FRONT - PAVILION_BACK;

const TERRACE_MARGIN = 6;
const TERRACE_HALF_X = PAVILION_HALF_WIDTH + TERRACE_MARGIN;
/**
 * Forward of the building, the terrace reaches past the veranda and no
 * further.
 *
 * It used to run out to the door marker, which was 22 m in front and the point
 * employees stepped on to the terrace at. The court is the middle of the park
 * now and its door is where the central avenue meets the PLAZA, 250 m out — so
 * a terrace drawn to the door would have been a 500 m rectangle laid across
 * the circular plaza. The terrace is the pavilion's own apron again, and the
 * ground between it and the door is the plaza, drawn by `GrandFoodCourt`.
 */
const TERRACE_FRONT = PAVILION_FRONT + TERRACE_MARGIN;
const TERRACE_BACK = PAVILION_BACK - TERRACE_MARGIN;

/** Where the three serving kiosks stand, and how wide each one is. */
const COUNTER_XS = [-8, 0, 8];
const COUNTER_HALF_W = 3.4;

const PARASOL_COLORS = ["#c9503f", "#e0a52c", "#3f8a70", "#b9563f", "#d79a35"];

function Table({ x, z, color, seed }: { x: number; z: number; color: string; seed: number }) {
  /* Turn and chair placement come from the shared constants, so the seat a
     walker is routed to is the seat that is actually drawn here. */
  const angle = TABLE_TURN(seed);
  return (
    <group position={[x, 0, z]} rotation={[0, angle, 0]}>
      {/* Pedestal and top */}
      <mesh position={[0, PROP.tableTopY / 2, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.14, PROP.tableTopY, 8]} />
        <primitive object={MAT.steel} attach="material" />
      </mesh>
      <mesh position={[0, PROP.tableTopY, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[PROP.tableRadius, PROP.tableRadius, 0.04, 16]} />
        <primitive object={MAT.wood} attach="material" />
      </mesh>

      {Array.from({ length: CHAIRS_PER_TABLE }, (_, k) => {
        const a = chairAngle(k);
        const cx = Math.cos(a) * CHAIR_RADIUS;
        const cz = Math.sin(a) * CHAIR_RADIUS;
        return (
          <group key={k} position={[cx, 0, cz]} rotation={[0, -a + Math.PI / 2, 0]}>
            <mesh position={[0, PROP.chairSeatY, 0]} castShadow>
              <boxGeometry args={[PROP.chairWidth, 0.04, PROP.chairWidth]} />
              <primitive object={MAT.woodDark} attach="material" />
            </mesh>
            <mesh position={[0, (PROP.chairSeatY + PROP.chairBackY) / 2, -0.2]} castShadow>
              <boxGeometry args={[PROP.chairWidth, PROP.chairBackY - PROP.chairSeatY, 0.04]} />
              <primitive object={MAT.woodDark} attach="material" />
            </mesh>
            {[[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]].map(([lx, lz], j) => (
              <mesh key={j} position={[lx, PROP.chairSeatY / 2, lz]}>
                <boxGeometry args={[0.03, PROP.chairSeatY, 0.03]} />
                <primitive object={MAT.steel} attach="material" />
              </mesh>
            ))}
          </group>
        );
      })}

      {/* Parasol */}
      <mesh position={[0, PROP.parasolY / 2, 0]}>
        <cylinderGeometry args={[0.03, 0.03, PROP.parasolY, 6]} />
        <primitive object={MAT.steel} attach="material" />
      </mesh>
      <mesh position={[0, PROP.parasolY, 0]} castShadow>
        <coneGeometry args={[PROP.parasolRadius, 0.42, 10]} />
        <meshStandardMaterial color={color} roughness={0.85} side={2} />
      </mesh>
    </group>
  );
}

/** A serving kiosk with an awning and a counter. */
function Counter({ x, label, color }: { x: number; label: string; color: string }) {
  return (
    <group position={[x, 0, -3]}>
      <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[6.4, 3.2, 3]} />
        <meshStandardMaterial color={WALL} roughness={0.88} />
      </mesh>
      {/* Counter top at serving height */}
      <mesh position={[0, 1.06, 1.7]} castShadow>
        <boxGeometry args={[6.6, 0.08, 0.7]} />
        <primitive object={MAT.steel} attach="material" />
      </mesh>
      <mesh position={[0, 0.52, 1.7]}>
        <boxGeometry args={[6.4, 1.04, 0.55]} />
        <primitive object={MAT.steelDark} attach="material" />
      </mesh>
      {/* Menu board */}
      <mesh position={[0, 2.35, 1.42]} castShadow>
        <boxGeometry args={[5.6, 1.1, 0.08]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <Text position={[0, 2.35, 1.48]} fontSize={0.42} color="#fff6e6" anchorX="center" anchorY="middle">
        {label}
      </Text>
      {/* Awning */}
      <mesh position={[0, 3.05, 2.5]} rotation={[-0.36, 0, 0]} castShadow>
        <boxGeometry args={[6.8, 0.08, 2.4]} />
        <meshStandardMaterial color={color} roughness={0.82} />
      </mesh>
      {[-3.2, 3.2].map((px) => (
        <mesh key={px} position={[px, 1.6, 3.4]}>
          <cylinderGeometry args={[0.05, 0.05, 3.2, 6]} />
          <primitive object={MAT.steel} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

/** An arched, glazed opening — the pavilion's one repeated motif. */
function ArchedBay({
  width,
  height,
  depth,
}: {
  width: number;
  height: number;
  depth: number;
}) {
  const r = width / 2;
  return (
    <group>
      {/* Reveal: a square-headed opening with a round head on top. */}
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
        <primitive object={MAT.glass} attach="material" />
      </mesh>
      <mesh position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[r, r, depth, 16, 1, false, 0, Math.PI]} />
        <primitive object={MAT.glass} attach="material" />
      </mesh>
      {/* Terracotta surround, so the opening reads as cut into the wall. */}
      <mesh position={[0, height / 2, -depth * 0.2]}>
        <boxGeometry args={[width + 0.7, height + 0.35, depth * 0.5]} />
        <meshStandardMaterial color={WALL_TRIM} roughness={0.78} />
      </mesh>
      <mesh position={[0, height, -depth * 0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[r + 0.35, r + 0.35, depth * 0.5, 16, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color={WALL_TRIM} roughness={0.78} />
      </mesh>
    </group>
  );
}

/**
 * The octagonal hall, its ribbed dome and the lantern above it.
 *
 * Eight is what makes the building read as a pavilion rather than as a tower:
 * from any angle the camera can reach, at least three faces are visible and
 * each catches the light differently, so the mass models itself.
 */
function DomedHall() {
  const faces = 8;
  return (
    <group position={[0, 0, HALL_Z]}>
      {/* Plinth and walls. */}
      <mesh position={[0, HALL_PLINTH / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[HALL_R * 1.06, HALL_R * 1.1, HALL_PLINTH, faces]} />
        <meshStandardMaterial color={TERRACE} roughness={0.94} />
      </mesh>
      <mesh
        position={[0, HALL_PLINTH + HALL_WALL_H / 2, 0]}
        rotation={[0, Math.PI / faces, 0]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[HALL_R, HALL_R, HALL_WALL_H, faces]} />
        <meshStandardMaterial color={WALL} roughness={0.88} />
      </mesh>

      {/* A pilaster on every corner, and a glazed bay on every face. */}
      {Array.from({ length: faces }, (_, i) => {
        const corner = ((i + 0.5) / faces) * Math.PI * 2;
        const face = (i / faces) * Math.PI * 2;
        return (
          <group key={i}>
            <mesh
              position={[
                Math.sin(corner) * HALL_R * 1.0,
                HALL_PLINTH + HALL_WALL_H / 2,
                Math.cos(corner) * HALL_R * 1.0,
              ]}
              rotation={[0, corner, 0]}
              castShadow
            >
              <boxGeometry args={[1.1, HALL_WALL_H, 1.1]} />
              <meshStandardMaterial color={WALL_TRIM} roughness={0.8} />
            </mesh>
            <group
              position={[Math.sin(face) * HALL_FLAT, HALL_PLINTH, Math.cos(face) * HALL_FLAT]}
              rotation={[0, face, 0]}
            >
              <ArchedBay width={6.4} height={6.2} depth={0.5} />
              {/* Clerestory above it, lighting the hall from high up. */}
              <mesh position={[0, HALL_WALL_H - 2.6, 0]}>
                <boxGeometry args={[7.2, 2.2, 0.4]} />
                <primitive object={MAT.glass} attach="material" />
              </mesh>
            </group>
          </group>
        );
      })}

      {/* Cornice. */}
      <mesh position={[0, HALL_PLINTH + HALL_WALL_H + HALL_CORNICE / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[HALL_R * 1.09, HALL_R * 1.13, HALL_CORNICE, faces]} />
        <meshStandardMaterial color={WALL_TRIM} roughness={0.76} />
      </mesh>

      {/*
        The dome. A sphere squashed to the rise asked of it and cut at its own
        equator, so the profile is a true segmental dome rather than a cone.
      */}
      <mesh
        position={[0, DOME_SPRING, 0]}
        scale={[1, DOME_RISE / DOME_R, 1]}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[DOME_R, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={ROOF} roughness={0.84} />
      </mesh>
      {/* Ribs down the dome, on the octagon's own corners. */}
      {Array.from({ length: faces }, (_, i) => {
        const th = ((i + 0.5) / faces) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[0, DOME_SPRING, 0]}
            rotation={[0, th, 0]}
            scale={[1, DOME_RISE / DOME_R, 1]}
          >
            <torusGeometry args={[DOME_R * 1.002, DOME_R * 0.022, 6, 24, Math.PI / 2]} />
            <meshStandardMaterial color={GOLD} roughness={0.5} metalness={0.3} />
          </mesh>
        );
      })}

      {/* The lantern cupola, and the finial over it. */}
      <group position={[0, CUPOLA_BASE, 0]}>
        <mesh position={[0, CUPOLA_H / 2, 0]} castShadow>
          <cylinderGeometry args={[CUPOLA_R, CUPOLA_R * 1.08, CUPOLA_H, faces]} />
          <meshStandardMaterial color={WALL} roughness={0.86} />
        </mesh>
        {Array.from({ length: faces }, (_, i) => {
          const th = (i / faces) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[
                Math.sin(th) * CUPOLA_R * 0.94,
                CUPOLA_H / 2,
                Math.cos(th) * CUPOLA_R * 0.94,
              ]}
              rotation={[0, th, 0]}
            >
              <boxGeometry args={[CUPOLA_R * 0.62, CUPOLA_H * 0.6, 0.3]} />
              <primitive object={MAT.glass} attach="material" />
            </mesh>
          );
        })}
        <mesh position={[0, CUPOLA_H + CUPOLA_R * 0.5, 0]} castShadow>
          <sphereGeometry args={[CUPOLA_R * 1.12, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={ROOF} roughness={0.8} />
        </mesh>
        <mesh position={[0, CUPOLA_H + CUPOLA_R * 1.5, 0]} castShadow>
          <sphereGeometry args={[CUPOLA_R * 0.3, 12, 8]} />
          <meshStandardMaterial color={GOLD} roughness={0.42} metalness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

/** One arcaded wing, flanking the hall. */
function Wing({ side }: { side: 1 | -1 }) {
  return (
    <group position={[side * WING_X, 0, HALL_Z]}>
      <mesh position={[0, WING_H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[WING_W, WING_H, WING_D]} />
        <meshStandardMaterial color={WALL} roughness={0.88} />
      </mesh>
      {/* Plinth and parapet, so the wing is not a bare slab. */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[WING_W + 0.6, 1, WING_D + 0.6]} />
        <meshStandardMaterial color={TERRACE} roughness={0.94} />
      </mesh>
      <mesh position={[0, WING_H + 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[WING_W + 1, 1.1, WING_D + 1]} />
        <meshStandardMaterial color={WALL_TRIM} roughness={0.78} />
      </mesh>
      {/* A teal band under the parapet, tying the wings to the hall's accents. */}
      <mesh position={[0, WING_H - 0.7, 0]}>
        <boxGeometry args={[WING_W + 0.2, 0.5, WING_D + 0.2]} />
        <meshStandardMaterial color={TEAL} roughness={0.7} />
      </mesh>
      {/* Three arched bays across the front. */}
      {[-1, 0, 1].map((k) => (
        <group key={k} position={[k * (WING_W / 3.2), 1, WING_D / 2]}>
          <ArchedBay width={3.4} height={4.2} depth={0.45} />
        </group>
      ))}
    </group>
  );
}

/**
 * The veranda: a colonnade across the whole front, carrying the sign.
 *
 * It is what gathers the hall and its two wings into one building rather than
 * three that happen to touch, and it gives the terrace a shaded edge to sit
 * under — which is what the food court is for.
 */
function Veranda() {
  const half = PAVILION_HALF_WIDTH;
  /* One bay per ~6 m of frontage, so the colonnade keeps its rhythm as the
     building lengthens instead of stretching its existing bays. */
  const bays = Math.round((half * 2) / 6.15);
  return (
    <group position={[0, 0, VERANDA_Z]}>
      {/* Roof slab. */}
      <mesh position={[0, VERANDA_H, VERANDA_OUT / 2]} castShadow receiveShadow>
        <boxGeometry args={[half * 2, 0.6, VERANDA_OUT]} />
        <meshStandardMaterial color={ROOF} roughness={0.84} />
      </mesh>
      {/* Fascia, and a scalloped valance hanging from it. */}
      <mesh position={[0, VERANDA_H - 0.75, VERANDA_OUT]} castShadow>
        <boxGeometry args={[half * 2, 1.1, 0.4]} />
        <meshStandardMaterial color={WALL_TRIM} roughness={0.72} />
      </mesh>
      {Array.from({ length: bays * 2 }, (_, i) => {
        const x = (i - (bays * 2 - 1) / 2) * ((half * 2) / (bays * 2));
        return (
          <mesh
            key={i}
            position={[x, VERANDA_H - 1.3, VERANDA_OUT]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.5, 0.5, 0.3, 10, 1, false, 0, Math.PI]} />
            <meshStandardMaterial color={GOLD} roughness={0.6} />
          </mesh>
        );
      })}
      {/*
        Columns — but the colonnade steps around the serving counters.
        The three kiosks stand under the veranda, which is where serving
        counters belong; a column on the same centre line would come down
        through one. Any column that would land on a counter is left out, which
        opens the middle of the run into one wide serving bay.
      */}
      {Array.from({ length: bays + 1 }, (_, i) => {
        const x = (i - bays / 2) * ((half * 2) / bays);
        if (COUNTER_XS.some((cx) => Math.abs(x - cx) < COUNTER_HALF_W + 0.6)) return null;
        return (
          <group key={i} position={[x, 0, VERANDA_OUT]}>
            <mesh position={[0, VERANDA_H / 2, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.34, 0.4, VERANDA_H, 12]} />
              <meshStandardMaterial color={WALL} roughness={0.85} />
            </mesh>
            <mesh position={[0, VERANDA_H - 0.3, 0]} castShadow>
              <cylinderGeometry args={[0.55, 0.42, 0.6, 12]} />
              <meshStandardMaterial color={WALL_TRIM} roughness={0.76} />
            </mesh>
            <mesh position={[0, 0.3, 0]} castShadow>
              <cylinderGeometry args={[0.5, 0.58, 0.6, 12]} />
              <meshStandardMaterial color={TERRACE} roughness={0.92} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export function FoodCourt() {
  return (
    <group
      position={[FOOD_COURT_CENTER[0], 0, FOOD_COURT_CENTER[1]]}
      rotation={[0, FOOD_COURT_FACING, 0]}
    >
      {/* Terrace paving, sized from the pavilion so it always reaches past it. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, (TERRACE_FRONT + TERRACE_BACK) / 2]}
        receiveShadow
      >
        <planeGeometry args={[TERRACE_HALF_X * 2, TERRACE_FRONT - TERRACE_BACK]} />
        <meshStandardMaterial color={TERRACE} roughness={0.97} />
      </mesh>

      {/*
        The pavilion, and everything that is part of the building: the domed
        hall, its wings, the veranda, the sign on its fascia and the three
        serving kiosks under it. All inside ONE uniform scale group, so the
        building grows as a building — no axis is favoured and the lettering
        needs no correction.
      */}
      <group scale={PAVILION_SCALE}>
        <Wing side={-1} />
        <Wing side={1} />
        <DomedHall />
        <Veranda />

        {/* The name, on the veranda fascia — drawn at its true size, undistorted. */}
        <Text
          position={[0, VERANDA_H - 0.75, VERANDA_Z + VERANDA_OUT + 0.22]}
          fontSize={1.9}
          color="#fff6e6"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.08}
        >
          FOOD COURT
        </Text>

        {/* Serving kiosks */}
        <Counter x={COUNTER_XS[0]} label="COFFEE" color="#3f8a70" />
        <Counter x={COUNTER_XS[1]} label="BREAKFAST" color="#c9503f" />
        <Counter x={COUNTER_XS[2]} label="SNACKS" color="#e0a52c" />
      </group>

      {/* Seating terrace: five tables of four — the court's twenty seats. */}
      {FOOD_COURT_TABLES.map(([x, z], i) => (
        <Table key={i} x={x} z={z} seed={i} color={PARASOL_COLORS[i % PARASOL_COLORS.length]} />
      ))}

      {/* Terrace edge, planting, lighting and bins. */}
      {/*
        The furniture around the building stays at HUMAN size and moves out
        with the walls — the props are for people, and a bench scaled with the
        architecture is a bench nobody can sit on.
      */}
      <Railing position={[0, 0, 20 * PAVILION_SCALE]} length={30 * PAVILION_SCALE} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <LampPost position={[s * 15 * PAVILION_SCALE, 0, 6 * PAVILION_SCALE]} />
          <Planter position={[s * 15 * PAVILION_SCALE, 0, 16 * PAVILION_SCALE]} w={4} d={2.2} />
          <Bench position={[s * 12 * PAVILION_SCALE, 0, 19 * PAVILION_SCALE]} rotation={Math.PI} />
          <Bin position={[s * 9.5 * PAVILION_SCALE, 0, 19.4 * PAVILION_SCALE]} />
        </group>
      ))}

      {/* Entrance marker where employees step on and off the terrace. */}
      <group position={[FOOD_COURT_DOOR_LOCAL[0], 0, FOOD_COURT_DOOR_LOCAL[1]]}>
        {[-2.4, 2.4].map((px) => (
          <mesh key={px} position={[px, 1.4, 0]} castShadow>
            <cylinderGeometry args={[0.14, 0.18, 2.8, 8]} />
            <primitive object={MAT.wood} attach="material" />
          </mesh>
        ))}
        <mesh position={[0, 3.05, 0]} castShadow>
          <boxGeometry args={[5.6, 0.7, 0.16]} />
          <meshStandardMaterial color={WALL_TRIM} roughness={0.72} />
        </mesh>
        <Text position={[0, 3.05, 0.1]} fontSize={0.4} color="#fff6e6" anchorX="center" anchorY="middle">
          WELCOME
        </Text>
      </group>
    </group>
  );
}
