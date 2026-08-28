"use client";

import { Text } from "@react-three/drei";
import {
  GATE_ARCH_Y,
  GATE_HEIGHT,
  GATE_OPENING,
  GATE_PILLAR_HALF,
  GATE_PILLAR_HEIGHT,
  GATE_X,
  GATE_Z,
  LANE_COUNT,
  LANE_SPACING,
} from "@/simulation/journey/constants";
import { EMPLOYEE_HEIGHT, PROP } from "@/world/scale";
import { Bin, Bollard, LampPost, MAT, Planter, Railing } from "@/components/world/kit";

/**
 * THE PEACOCK GATE — the park's single main entrance.
 *
 * The entrance this replaces was a pair of square grey piers carrying a plain
 * elliptical band: correct, and completely forgettable. This is a ceremonial
 * gateway instead, and it is built to be the first thing the eye lands on.
 *
 * WHAT IT IS. Two round drum towers, banded in peacock teal and ribbed in gold,
 * each carrying a gallery of small arched niches and crowned with a bulbous
 * onion dome and a finial spike. Between them springs a cusped arch — the
 * soffit scalloped into lobes rather than run as a smooth curve — faced in
 * coral and outlined in light, with the park's name set around it and a fanned
 * sunburst cartouche at the crown. Low arcaded wings run out from each tower to
 * widen the frontage, and festival bunting is swagged across the span and along
 * the wings.
 *
 * COLOUR IS THE POINT. Peacock teal, coral, saffron gold and warm cream, in
 * large flat areas with gold edging between them, rather than the grey stone
 * and single accent it had before. Every colour is a surface, not a light: the
 * bulbs, the lit reveals and the lettering are emissive materials, so the
 * park's existing sun, sky, shadow and fog rig is exactly as it was. This gate
 * adds no light of its own.
 *
 * WHAT DID NOT CHANGE. The gate is architecture only. The forecourt, the
 * drop-off road and its kerb, the twelve turnstile lanes, the queue yard, the
 * canopy, the security booths, the lamps, planting, bins and the wayfinding
 * pylon are all exactly as they were, in the same places, because employees
 * walk through them and nothing about the walk-through was asked to move. All
 * of it still sits outside the railway, so not one ride, rail or footprint is
 * disturbed.
 *
 * The gate carries no check-in colour legend. The banding is still very much
 * part of the simulation — it colours the employees themselves and drives the
 * Department Check-In Overview — but stating it a second time on the
 * architecture made the entrance read as a chart rather than a gateway, so the
 * front of the gate is given over to its name.
 */

const PILLAR_X = GATE_OPENING / 2 + GATE_PILLAR_HALF;
const BEAM_HALF = PILLAR_X + GATE_PILLAR_HALF;

/*
 * THE PALETTE.
 *
 * Four large colours and one dark, chosen to carry at the distance the gate is
 * actually seen from. Saturated flat areas with gold between them read from
 * four hundred metres in a way that shaded grey stone never does, which is the
 * whole reason the previous entrance disappeared into the park behind it.
 */
/** Peacock teal — the towers. */
const TEAL = "#128d8a";
const TEAL_DEEP = "#0a6260";
/** Coral — the arch face and the panel fields. */
const CORAL = "#e2542b";
const CORAL_DEEP = "#a8371a";
/** Saffron gold — every edge, rib, dome and finial. */
const ACCENT = "#f5b325";
/** Warm carved cream — plinths, cornices and the arcade wings. */
const STONE = "#f4e7cc";
/** Plum, used sparingly in the niches and the bunting. */
const PLUM = "#7c2b62";

/** One lane per turnstile, matching the walking lanes the employees use. */
const TURNSTILE_COUNT = 12;
const LANE_PITCH = GATE_OPENING / TURNSTILE_COUNT;
const CANOPY_Z = 6.5;

/*
 * The forecourt, and the drop-off road across the front of it.
 *
 * The road is placed against the forecourt's front edge rather than at a fixed
 * z, because the paving is drawn on top of the tarmac: park the carriageway
 * anywhere short of that edge and the forecourt swallows however much of it
 * overlaps. Deriving the centre from the edge keeps the full road width
 * visible no matter how wide the road is set.
 */
const FORECOURT_Z = 12;
const FORECOURT_DEPTH = 54;
const FORECOURT_FRONT_Z = FORECOURT_Z + FORECOURT_DEPTH / 2;
const DROPOFF_Z = FORECOURT_FRONT_Z + PROP.roadLaneWidth;
/** The kerb sits on the near edge of the carriageway; the bollards just behind it. */
const KERB_Z = DROPOFF_Z - PROP.roadLaneWidth - 0.2;
const BOLLARD_Z = KERB_Z - 0.9;


/* ---------------- The illuminated archway ---------------- */

/** Warm bulb colours, alternating so the strings read as real lamps. */
const BULB_WARM = "#ffd98a";
const BULB_HOT = "#fff3cf";


/** How far the arch rises above its springing point on the towers. */
/* The arch's rise, held to the same proportion of its span it has always had,
   so a wider gate gets a taller arch rather than a flatter one. */
const ARCH_RISE = PILLAR_X * 0.3008;
/** Half-span of the arch centreline. */
const ARCH_A = PILLAR_X;

/**
 * The arch band's radial dimensions, all held to the proportion of the span
 * they were drawn at.
 *
 * These used to be typed as metres — a 3.4 m band with its bulb rings at
 * +/-2.15 — which was right for the gate they were drawn for and wrong the
 * moment it grew. The lettering is sized from the arc it is set on, so a wider
 * arch gets larger capitals; a band that stayed 3.4 m would have had the type
 * hanging over both its edges. Everything radial now follows the span, so the
 * whole band keeps its drawn proportions at any gate size.
 */
const BAND_DEPTH = ARCH_A * 0.1382;
const BAND_RING = ARCH_A * 0.0874;
const BAND_FACE_DROP = ARCH_A * 0.0447;
const BAND_FACE_DEPTH = ARCH_A * 0.0366;

/**
 * The keystone cartouche at the crown. With the lettering gone it is the only
 * thing standing on the band, so it is sized to hold the centre of the arch on
 * its own rather than merely to clear the type that used to run beneath it.
 */
const KEYSTONE_R = ARCH_A * 0.1016;

/** A point on the arch centreline. `a` runs PI (left) -> 0 (right). */
function archPoint(a: number, radial = 0): [number, number] {
  return [Math.cos(a) * (ARCH_A + radial), GATE_ARCH_Y + Math.sin(a) * (ARCH_RISE + radial)];
}

/** One glowing bulb. Unlit and unfogged, so it reads as a source not a surface. */
function Bulb({
  position,
  size = 0.3,
  color = BULB_WARM,
}: {
  position: [number, number, number];
  size?: number;
  color?: string;
}) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[size, 8, 6]} />
      <meshBasicMaterial color={color} toneMapped={false} fog={false} />
    </mesh>
  );
}

/** A string of bulbs following the arch at a given radial offset. */
function ArchBulbs({ radial, count, size }: { radial: number; count: number; size: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const a = Math.PI * (1 - i / (count - 1));
        const [x, y] = archPoint(a, radial);
        return (
          <Bulb
            key={i}
            position={[x, y, GATE_PILLAR_HALF + 0.5]}
            size={size}
            color={i % 2 ? BULB_HOT : BULB_WARM}
          />
        );
      })}
    </>
  );
}

/**
 * THE CUSPED ARCH.
 *
 * A smooth elliptical band is the shape every plain arch has; scalloping the
 * soffit into lobes is what turns it into a gateway. The structural band is
 * still assembled from short boxes rotated to the local tangent — a torus would
 * be cheaper, but the band has to sit flat against the front of the gate and
 * carry a face for the lettering — and the lobes are then hung from its inner
 * edge.
 *
 * The face is coral with a gold edge strip top and bottom, so the band has a
 * drawn outline at any distance rather than fading into its own shading.
 */
function ArchBand() {
  const SEG = 44;
  return (
    <>
      {Array.from({ length: SEG }, (_, i) => {
        const a0 = Math.PI * (1 - i / SEG);
        const a1 = Math.PI * (1 - (i + 1) / SEG);
        const [x0, y0] = archPoint(a0);
        const [x1, y1] = archPoint(a1);
        const dx = x1 - x0;
        const dy = y1 - y0;
        const len = Math.hypot(dx, dy);
        return (
          <group
            key={i}
            position={[(x0 + x1) / 2, (y0 + y1) / 2, 0]}
            rotation={[0, 0, Math.atan2(dy, dx)]}
          >
            <mesh castShadow receiveShadow>
              <boxGeometry args={[len * 1.06, BAND_DEPTH, GATE_PILLAR_HALF * 1.5]} />
              <meshStandardMaterial color={CORAL} roughness={0.55} metalness={0.06} />
            </mesh>
            {/* Gold edge strips, top and bottom, so the band is outlined. */}
            {[1, -1].map((edge) => (
              <mesh
                key={edge}
                position={[0, edge * (BAND_DEPTH / 2 - BAND_FACE_DEPTH / 2), 0]}
                castShadow
              >
                <boxGeometry
                  args={[len * 1.06, BAND_FACE_DEPTH, GATE_PILLAR_HALF * 1.54]}
                />
                <meshStandardMaterial color={ACCENT} roughness={0.4} metalness={0.42} />
              </mesh>
            ))}
            {/* Deep-coral inner face, the way a painted arch is picked out. */}
            <mesh position={[0, -BAND_FACE_DROP, GATE_PILLAR_HALF * 0.78]}>
              <boxGeometry args={[len * 1.06, BAND_FACE_DEPTH, 0.12]} />
              <meshStandardMaterial color={CORAL_DEEP} roughness={0.6} />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

/**
 * The lobes that scallop the soffit.
 *
 * Each is a half-round hung from the inside edge of the band, with a small
 * pointed cusp dropped between every neighbouring pair — the multifoil profile
 * a ceremonial gateway carries, drawn as separate pieces rather than as a
 * carved soffit so it costs a handful of primitives instead of a lathe.
 *
 * The lobes stop short of the springing line at both ends. Running them all the
 * way down would put a lobe where the arch meets the tower, which is where the
 * impost block goes.
 */
const LOBE_COUNT = 15;

function SoffitCusps() {
  const inner = -BAND_DEPTH / 2;
  const lobeR = (ARCH_A * 0.055);
  return (
    <>
      {Array.from({ length: LOBE_COUNT }, (_, i) => {
        /* Spread across the arc, held clear of both springing points. */
        const t = (i + 0.5) / LOBE_COUNT;
        const a = Math.PI * (0.94 - t * 0.88);
        const [x, y] = archPoint(a, inner);
        return (
          <group key={i} position={[x, y, 0]} rotation={[0, 0, a - Math.PI / 2]}>
            {/* The lobe: a disc seen face-on, so it reads as a scallop. */}
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry
                args={[lobeR, lobeR, GATE_PILLAR_HALF * 1.44, 14, 1, false, 0, Math.PI]}
              />
              <meshStandardMaterial color={ACCENT} roughness={0.42} metalness={0.4} />
            </mesh>
            <mesh position={[0, 0, GATE_PILLAR_HALF * 0.76]}>
              <circleGeometry args={[lobeR * 0.62, 16]} />
              <meshStandardMaterial color={TEAL} roughness={0.5} />
            </mesh>
          </group>
        );
      })}
      {/* A pointed cusp between each pair of lobes. */}
      {Array.from({ length: LOBE_COUNT + 1 }, (_, i) => {
        const t = i / LOBE_COUNT;
        const a = Math.PI * (0.94 - t * 0.88);
        const [x, y] = archPoint(a, inner + ARCH_A * 0.012);
        return (
          <mesh
            key={i}
            position={[x, y, GATE_PILLAR_HALF * 0.4]}
            rotation={[Math.PI / 2, 0, a + Math.PI / 2]}
            castShadow
          >
            <coneGeometry args={[ARCH_A * 0.017, ARCH_A * 0.05, 4]} />
            <meshStandardMaterial color={ACCENT} roughness={0.4} metalness={0.45} />
          </mesh>
        );
      })}
    </>
  );
}

/**
 * THE NAMING BOARD.
 *
 * The park's name, on a board slung under the arch rather than set letter by
 * letter around it. The lettering that used to curve along the band needed a
 * dark plate behind it to read at all, and the plate was the problem: a black
 * strip across a coral arch. A board inverts that — a light carved ground with
 * VERY DARK letters cut into it, which is how a real painted signboard is made
 * and the only way dark type reads at distance.
 *
 * IT IS BUILT TO THE GATE, not dropped on it. The frame is the gate's own gold,
 * the fillet inside it the gate's teal, the ground its warm cream; the top and
 * bottom edges are scalloped with the same lobes that scallop the arch soffit
 * above; and it is lit by the same bulbs that outline everything else here.
 *
 * IT IS ALSO SIZED BY THE GATE. The board hangs inside the arch, so how wide it
 * can be and how high it can reach are not free choices — the soffit curves
 * down towards the towers, and a board that ignored that would drive its top
 * corners straight through the band. The top edge is therefore derived from the
 * soffit height AT THE BOARD'S OWN HALF-WIDTH, with a clearance, so it tucks
 * under the arch at any gate size instead of being nudged into place by hand.
 */
const SIGN_TEXT = "EMPLOYEE THEME PARK";

/** Height of the underside of the arch band, directly above a given x. */
function archSoffit(x: number): number {
  const t = Math.max(0, 1 - (x / ARCH_A) ** 2);
  return GATE_ARCH_Y + Math.sqrt(t) * ARCH_RISE - BAND_DEPTH / 2;
}

const BOARD_HALF = ARCH_A * 0.53;
const BOARD_H = ARCH_A * 0.21;
const BOARD_TOP = archSoffit(BOARD_HALF) - ARCH_A * 0.02;
const BOARD_Y = BOARD_TOP - BOARD_H / 2;
/** Stood forward of the arch face, and clear of the bunting swagged behind it. */
const BOARD_Z = GATE_PILLAR_HALF + 2.2;
const FRAME = ARCH_A * 0.018;

/**
 * The type size.
 *
 * Nineteen characters have to sit inside the board's clear width. An upper-case
 * sans averages about 0.62 em per character once the two spaces are counted, so
 * the size is read back out of the width available rather than typed and hoped
 * for — the same reasoning the old arch lettering used, applied to a straight
 * line instead of a curve.
 */
const SIGN_FONT = ((BOARD_HALF * 2 * 0.86) / (SIGN_TEXT.length * 0.62));

/**
 * The letters themselves: very dark, and NOT emissive.
 *
 * A near-black with a little warmth in it, so it sits against the cream ground
 * as carved paint rather than as a hole. It is deliberately an ordinary lit
 * material — dark type that glowed would stop being dark the moment the sun
 * went down, which is the opposite of what was asked for.
 */
const INK = "#0a0805";

function NameBoard() {
  /* The scalloped edge, echoing the arch soffit's lobes. */
  const lobeR = FRAME * 1.15;
  const lobes = Math.max(6, Math.round((BOARD_HALF * 2) / (lobeR * 2)));

  return (
    <group position={[0, BOARD_Y, BOARD_Z]}>
      {/* Gold frame. */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[BOARD_HALF * 2 + FRAME * 2, BOARD_H + FRAME * 2, 0.6]} />
        <meshStandardMaterial color={ACCENT} roughness={0.4} metalness={0.45} />
      </mesh>
      {/* Teal fillet inside the frame. */}
      <mesh position={[0, 0, 0.16]}>
        <boxGeometry args={[BOARD_HALF * 2 + FRAME, BOARD_H + FRAME, 0.4]} />
        <meshStandardMaterial color={TEAL_DEEP} roughness={0.55} />
      </mesh>
      {/* The carved cream ground the name is cut into. */}
      <mesh position={[0, 0, 0.34]} receiveShadow>
        <boxGeometry args={[BOARD_HALF * 2, BOARD_H, 0.3]} />
        <meshStandardMaterial color={STONE} roughness={0.72} />
      </mesh>

      {/* Scalloped lobes along the top and bottom edges. */}
      {([1, -1] as const).map((edge) =>
        Array.from({ length: lobes }, (_, i) => {
          const x = (i - (lobes - 1) / 2) * ((BOARD_HALF * 2) / lobes);
          return (
            <mesh
              key={`${edge}:${i}`}
              position={[x, edge * (BOARD_H / 2 + FRAME), 0.1]}
              rotation={[Math.PI / 2, 0, 0]}
              castShadow
            >
              <cylinderGeometry args={[lobeR, lobeR, 0.5, 12, 1, false, 0, Math.PI]} />
              <meshStandardMaterial color={ACCENT} roughness={0.42} metalness={0.44} />
            </mesh>
          );
        }),
      )}

      {/* Bulbs down both ends, as everything else on this gate is outlined. */}
      {([1, -1] as const).map((side) =>
        Array.from({ length: 5 }, (_, i) => (
          <Bulb
            key={`${side}:${i}`}
            position={[
              side * (BOARD_HALF + FRAME * 1.6),
              (i / 4 - 0.5) * BOARD_H * 0.8,
              0.4,
            ]}
            size={FRAME * 0.42}
            color={i % 2 ? BULB_HOT : BULB_WARM}
          />
        )),
      )}

      {/* Teal end-caps, so the board finishes rather than simply stopping. */}
      {([1, -1] as const).map((side) => (
        <mesh
          key={side}
          position={[side * (BOARD_HALF + FRAME * 2.6), 0, 0.1]}
          castShadow
        >
          <boxGeometry args={[FRAME * 2.2, BOARD_H * 0.72, 0.7]} />
          <meshStandardMaterial color={TEAL} roughness={0.6} />
        </mesh>
      ))}

      {/* THE NAME. */}
      <Text
        position={[0, 0, 0.52]}
        fontSize={SIGN_FONT}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.04}
      >
        {SIGN_TEXT}
        <meshStandardMaterial
          attach="material"
          color={INK}
          roughness={0.42}
          metalness={0.08}
        />
      </Text>

      {/* Two straps carrying the board up into the arch soffit above it. */}
      {([1, -1] as const).map((side) => {
        const x = side * BOARD_HALF * 0.78;
        const rise = archSoffit(Math.abs(x)) - BOARD_TOP;
        return (
          <group key={side} position={[x, BOARD_H / 2 + rise / 2, -0.2]}>
            <mesh castShadow>
              <boxGeometry args={[FRAME * 1.1, rise, 0.35]} />
              <meshStandardMaterial color={ACCENT} roughness={0.4} metalness={0.5} />
            </mesh>
            {/* Bracket back to the face of the band. */}
            <mesh position={[0, rise / 2, -1.3]} castShadow>
              <boxGeometry args={[FRAME * 0.9, FRAME * 0.9, 2.8]} />
              <meshStandardMaterial color={ACCENT} roughness={0.4} metalness={0.5} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/**
 * ONE DRUM TOWER.
 *
 * Round rather than square, which is the single change that most alters the
 * gate's silhouette: a cylinder catches the sun round its face instead of
 * presenting one flat lit side and one flat dark one, so the tower models
 * itself and reads as solid from any angle the camera can reach.
 *
 * Every course is a fraction of the tower's own radius, so the detailing keeps
 * its proportions whatever the gate is scaled to — the previous entrance had
 * its details typed in metres for a gate two thirds this size, and at full
 * height they had shrunk to marks on a blank wall.
 *
 * From the ground up: an octagonal cream plinth in two steps, a teal drum
 * ribbed in gold, a gallery of small arched niches, a corbelled cornice with a
 * balustraded walk, a bulbous onion dome ribbed to match, and a finial.
 */
const TOWER_R = GATE_PILLAR_HALF;
const RIBS = 16;
const NICHES = 8;

function DrumTower({ side }: { side: 1 | -1 }) {
  const R = TOWER_R;
  /* The masonry courses, as fractions of the tower's radius. */
  const PLINTH_1 = R * 0.13;
  const PLINTH_2 = R * 0.09;
  const PLINTH_TOP = PLINTH_1 + PLINTH_2;
  const CORNICE = R * 0.1;
  /*
   * The shaft takes whatever the plinth and the cornice leave, so the top
   * course of the cornice lands exactly at the springing of the dome. The dome
   * then sits ON the tower rather than floating over it or cutting into it.
   */
  const DOME_SPRING = GATE_PILLAR_HEIGHT + R * 0.2;
  const SHAFT_Y0 = PLINTH_TOP;
  const SHAFT_H = DOME_SPRING - PLINTH_TOP - CORNICE * 3;
  const CORNICE_Y = SHAFT_Y0 + SHAFT_H;
  /* A gentle taper: a drum that is dead parallel reads as a pipe. */
  const R_TOP = R * 0.93;

  /** The niche gallery, set at two thirds of the shaft. */
  const NICHE_Y = SHAFT_Y0 + SHAFT_H * 0.68;
  const NICHE_W = R * 0.34;
  const NICHE_H = R * 0.62;

  /*
   * THE ONION DOME, solved rather than typed.
   *
   * The sphere is cut at 0.66 of a half-turn from its north pole, so it carries
   * on past its own equator and the profile bulges before it tucks back in —
   * which is the whole difference between an onion and a hemisphere. Stretched
   * on Y, that puts the cut edge 0.4818 x R x stretch BELOW the widest point,
   * and the top 1.0 x R x stretch above it, so the dome stands
   *
   *     DOME_R x DOME_STRETCH x 1.4818
   *
   * tall from where it springs. The radius is therefore read back OUT of the
   * height that is left over once the drum and the finial have taken theirs,
   * which is what makes the tip of the finial land exactly on GATE_HEIGHT
   * instead of drifting past it as a typed radius would.
   */
  const FINIAL_H = R * 0.55;
  const DOME_STRETCH = 1.15;
  const DOME_R = (GATE_HEIGHT - DOME_SPRING - FINIAL_H) / (DOME_STRETCH * 1.4818);
  /* Centre of the sphere: the cut edge has to sit on the springing line. */
  const DOME_Y = DOME_SPRING + DOME_R * DOME_STRETCH * 0.4818;
  const DOME_TOP = DOME_Y + DOME_R * DOME_STRETCH;

  return (
    <group position={[PILLAR_X * side, 0, 0]}>
      {/* Octagonal plinth, in two steps. */}
      <mesh position={[0, PLINTH_1 / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[R * 1.32, R * 1.38, PLINTH_1, 8]} />
        <meshStandardMaterial color={STONE} roughness={0.9} />
      </mesh>
      <mesh position={[0, PLINTH_1 + PLINTH_2 / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[R * 1.14, R * 1.26, PLINTH_2, 8]} />
        <meshStandardMaterial color={ACCENT} roughness={0.44} metalness={0.4} />
      </mesh>

      {/* The teal drum. */}
      <mesh position={[0, SHAFT_Y0 + SHAFT_H / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[R_TOP, R, SHAFT_H, 28]} />
        <meshStandardMaterial color={TEAL} roughness={0.62} metalness={0.1} />
      </mesh>

      {/* Gold ribs up the drum, and a deep-teal band at the foot of each. */}
      {Array.from({ length: RIBS }, (_, i) => {
        const th = (i / RIBS) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[
              Math.sin(th) * R * 0.99,
              SHAFT_Y0 + SHAFT_H / 2,
              Math.cos(th) * R * 0.99,
            ]}
            rotation={[0, th, 0]}
            castShadow
          >
            <boxGeometry args={[R * 0.09, SHAFT_H, R * 0.09]} />
            <meshStandardMaterial color={ACCENT} roughness={0.42} metalness={0.44} />
          </mesh>
        );
      })}
      <mesh position={[0, SHAFT_Y0 + R * 0.22, 0]} castShadow>
        <cylinderGeometry args={[R * 1.03, R * 1.05, R * 0.44, 28]} />
        <meshStandardMaterial color={TEAL_DEEP} roughness={0.66} />
      </mesh>

      {/*
        The niche gallery: small round-headed openings set into the drum, each
        with a lit reveal behind it. Emissive glass, not a light source — the
        park's own rig is untouched.
      */}
      {Array.from({ length: NICHES }, (_, i) => {
        const th = (i / NICHES) * Math.PI * 2;
        return (
          <group
            key={i}
            position={[Math.sin(th) * R * 1.0, NICHE_Y, Math.cos(th) * R * 1.0]}
            rotation={[0, th, 0]}
          >
            {/* Gold surround, then the plum field, then the lit slot. */}
            <mesh castShadow>
              <boxGeometry args={[NICHE_W * 1.34, NICHE_H * 1.2, R * 0.1]} />
              <meshStandardMaterial color={ACCENT} roughness={0.42} metalness={0.42} />
            </mesh>
            <mesh position={[0, 0, R * 0.055]}>
              <boxGeometry args={[NICHE_W, NICHE_H, R * 0.05]} />
              <meshStandardMaterial color={PLUM} roughness={0.55} />
            </mesh>
            <mesh position={[0, NICHE_H * 0.6, R * 0.055]}>
              <cylinderGeometry
                args={[NICHE_W / 2, NICHE_W / 2, R * 0.05, 12, 1, false, 0, Math.PI]}
              />
              <meshStandardMaterial color={PLUM} roughness={0.55} />
            </mesh>
            <mesh position={[0, -NICHE_H * 0.12, R * 0.085]}>
              <boxGeometry args={[NICHE_W * 0.62, NICHE_H * 0.5, R * 0.03]} />
              <meshStandardMaterial
                color={BULB_HOT}
                emissive={BULB_WARM}
                emissiveIntensity={0.85}
                roughness={0.35}
                toneMapped={false}
              />
            </mesh>
          </group>
        );
      })}

      {/* Corbelled cornice: three courses, the middle one gold. */}
      {[1.1, 1.26, 1.12].map((out, i) => (
        <mesh
          key={i}
          position={[0, CORNICE_Y + CORNICE * (i + 0.5), 0]}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[R_TOP * out, R_TOP * out, CORNICE, 28]} />
          <meshStandardMaterial
            color={i === 1 ? ACCENT : STONE}
            roughness={i === 1 ? 0.44 : 0.88}
            metalness={i === 1 ? 0.4 : 0}
          />
        </mesh>
      ))}

      {/* Balusters round the gallery walk, and a bulb on every second one. */}
      {Array.from({ length: RIBS }, (_, i) => {
        const th = ((i + 0.5) / RIBS) * Math.PI * 2;
        const br = R_TOP * 1.2;
        return (
          <group key={i} position={[Math.sin(th) * br, DOME_SPRING, Math.cos(th) * br]}>
            <mesh castShadow>
              <cylinderGeometry args={[R * 0.05, R * 0.06, R * 0.3, 8]} />
              <meshStandardMaterial color={STONE} roughness={0.85} />
            </mesh>
            {i % 2 === 0 && (
              <Bulb position={[0, R * 0.26, 0]} size={R * 0.045} color={BULB_HOT} />
            )}
          </group>
        );
      })}

      {/*
        The dome itself, ribbed to match the drum so the two read as one tower.
      */}
      <mesh
        position={[0, DOME_Y, 0]}
        scale={[1, DOME_STRETCH, 1]}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[DOME_R, 30, 20, 0, Math.PI * 2, 0, Math.PI * 0.66]} />
        <meshStandardMaterial color={ACCENT} roughness={0.38} metalness={0.5} />
      </mesh>
      {/* Teal ribs over the dome, following its meridians. */}
      {Array.from({ length: RIBS / 2 }, (_, i) => {
        const th = (i / (RIBS / 2)) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[0, DOME_Y, 0]}
            rotation={[0, th, 0]}
            scale={[1, DOME_STRETCH, 1]}
          >
            <torusGeometry
              args={[DOME_R * 0.995, DOME_R * 0.03, 6, 26, Math.PI * 0.66]}
            />
            <meshStandardMaterial color={TEAL_DEEP} roughness={0.5} metalness={0.2} />
          </mesh>
        );
      })}
      {/* Collar at the springing, flaring the drum out to meet the dome. */}
      <mesh position={[0, DOME_SPRING + R * 0.14, 0]} castShadow>
        <cylinderGeometry args={[DOME_R * 0.92, R_TOP * 1.12, R * 0.3, 28]} />
        <meshStandardMaterial color={TEAL} roughness={0.6} />
      </mesh>

      {/* Finial: stem, ball and spike, tipping out at exactly GATE_HEIGHT. */}
      <mesh position={[0, DOME_TOP + FINIAL_H * 0.2, 0]} castShadow>
        <cylinderGeometry args={[R * 0.05, R * 0.08, FINIAL_H * 0.4, 10]} />
        <meshStandardMaterial color={ACCENT} roughness={0.36} metalness={0.55} />
      </mesh>
      <mesh position={[0, DOME_TOP + FINIAL_H * 0.46, 0]} castShadow>
        <sphereGeometry args={[FINIAL_H * 0.2, 14, 10]} />
        <meshStandardMaterial color={ACCENT} roughness={0.34} metalness={0.6} />
      </mesh>
      <mesh position={[0, DOME_TOP + FINIAL_H * 0.78, 0]} castShadow>
        <coneGeometry args={[FINIAL_H * 0.11, FINIAL_H * 0.44, 10]} />
        <meshStandardMaterial color={ACCENT} roughness={0.34} metalness={0.6} />
      </mesh>
      <Bulb position={[0, DOME_TOP + FINIAL_H, 0]} size={FINIAL_H * 0.11} color={BULB_HOT} />

      {/*
        A wall lantern on a bracket, at the height a person would read it from:
        about two employees up, and sized against an employee rather than
        against the 1.75 m figure the park no longer draws.
      */}
      <group
        position={[
          -side * R * 0.98,
          EMPLOYEE_HEIGHT * 1.9,
          R * 0.5,
        ]}
      >
        <mesh castShadow>
          <boxGeometry args={[0.24, 0.24, R * 0.5]} />
          <meshStandardMaterial color={TEAL_DEEP} roughness={0.5} metalness={0.4} />
        </mesh>
        <group position={[-side * R * 0.3, -EMPLOYEE_HEIGHT * 0.22, 0]}>
          <mesh castShadow>
            <boxGeometry args={[R * 0.26, EMPLOYEE_HEIGHT * 0.42, R * 0.26]} />
            <meshStandardMaterial
              color="#fff3cf"
              emissive={BULB_WARM}
              emissiveIntensity={0.85}
              roughness={0.35}
              toneMapped={false}
            />
          </mesh>
          <mesh position={[0, EMPLOYEE_HEIGHT * 0.25, 0]} castShadow>
            <coneGeometry args={[R * 0.23, R * 0.22, 4]} />
            <meshStandardMaterial color={ACCENT} roughness={0.44} metalness={0.4} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/**
 * THE ARCADE WINGS.
 *
 * A low colonnade running outward from each tower, so the gate presents a
 * hundred-metre frontage rather than two towers standing alone on paving. Three
 * round-headed openings per side, cream piers with coral spandrels and a gold
 * capping rail, finished with a small domed post at the outer end.
 *
 * It stands entirely outside the towers, well clear of the opening and of every
 * walking lane, so it adds width without touching the walk-through.
 */
const WING_BAYS = 2;

function ArcadeWing({ side }: { side: 1 | -1 }) {
  const R = TOWER_R;
  const H = GATE_PILLAR_HEIGHT * 0.34;
  const BAY = R * 1.1;
  const PIER = R * 0.36;
  const depth = R * 0.7;
  const x0 = PILLAR_X + R * 1.05;
  /*
   * Set back behind the tower line. The security kiosks stand on the gate line
   * just outside the towers, and a wing run flush with the towers would go
   * straight through them; a screen wall set back from the tower face is the
   * normal arrangement anyway, and from the approach it still reads beside the
   * towers rather than behind them because it stands well outside their radius.
   */
  const WING_Z = -R * 0.75;

  return (
    <group position={[side * x0, 0, WING_Z]}>
      {/* Base course the whole wing stands on. */}
      <mesh
        position={[side * (WING_BAYS * BAY) / 2, H * 0.06, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[WING_BAYS * BAY, H * 0.12, depth * 1.3]} />
        <meshStandardMaterial color={STONE} roughness={0.9} />
      </mesh>

      {Array.from({ length: WING_BAYS }, (_, i) => {
        const cx = side * (i + 0.5) * BAY;
        return (
          <group key={i} position={[cx, 0, 0]}>
            {/* The two piers of the bay. */}
            {[-1, 1].map((sx) => (
              <mesh
                key={sx}
                position={[sx * (BAY / 2 - PIER / 2), H * 0.5, 0]}
                castShadow
                receiveShadow
              >
                <boxGeometry args={[PIER, H, depth]} />
                <meshStandardMaterial color={STONE} roughness={0.86} />
              </mesh>
            ))}
            {/* Coral spandrel over the opening, with a gold round head. */}
            <mesh position={[0, H * 0.88, 0]} castShadow>
              <boxGeometry args={[BAY - PIER, H * 0.24, depth * 0.94]} />
              <meshStandardMaterial color={CORAL} roughness={0.58} />
            </mesh>
            <mesh
              position={[0, H * 0.74, depth * 0.5]}
              rotation={[Math.PI / 2, 0, 0]}
              castShadow
            >
              <cylinderGeometry
                args={[
                  (BAY - PIER * 2) / 2,
                  (BAY - PIER * 2) / 2,
                  0.24,
                  14,
                  1,
                  false,
                  0,
                  Math.PI,
                ]}
              />
              <meshStandardMaterial color={ACCENT} roughness={0.42} metalness={0.44} />
            </mesh>
          </group>
        );
      })}

      {/* Gold capping rail along the top of the wing. */}
      <mesh
        position={[side * (WING_BAYS * BAY) / 2, H * 1.04, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[WING_BAYS * BAY, H * 0.1, depth * 1.24]} />
        <meshStandardMaterial color={ACCENT} roughness={0.42} metalness={0.44} />
      </mesh>

      {/* A small domed post closing the outer end. */}
      <group position={[side * WING_BAYS * BAY, 0, 0]}>
        <mesh position={[0, H * 0.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[PIER * 1.5, H * 1.2, depth * 1.3]} />
          <meshStandardMaterial color={TEAL} roughness={0.62} />
        </mesh>
        <mesh position={[0, H * 1.28, 0]} scale={[1, 1.1, 1]} castShadow>
          <sphereGeometry args={[PIER * 0.95, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
          <meshStandardMaterial color={ACCENT} roughness={0.4} metalness={0.5} />
        </mesh>
        <Bulb position={[0, H * 1.52, 0]} size={0.34} color={BULB_HOT} />
      </group>
    </group>
  );
}

/**
 * FESTIVAL BUNTING.
 *
 * Triangular pennants on a line that sags between two points, in the gate's own
 * four colours. The line is a parabola rather than a straight run, which is the
 * whole difference between bunting and a washing line.
 *
 * Every pennant is one three-sided cone, so a full swag costs a couple of dozen
 * tiny primitives. They hang high above the walk-through and are decoration
 * only — nothing in the simulation reads them.
 */
const PENNANT_COLORS = [CORAL, ACCENT, TEAL, PLUM, STONE];

function Bunting({
  from,
  to,
  sag,
  count,
  size,
  z,
}: {
  from: [number, number];
  to: [number, number];
  sag: number;
  count: number;
  size: number;
  z: number;
}) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const t = (i + 0.5) / count;
        const x = from[0] + (to[0] - from[0]) * t;
        /* Parabolic droop: zero at both ends, deepest in the middle. */
        const y = from[1] + (to[1] - from[1]) * t - sag * 4 * t * (1 - t);
        return (
          <mesh key={i} position={[x, y - size * 0.5, z]} rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[size * 0.42, size, 3]} />
            <meshStandardMaterial
              color={PENNANT_COLORS[i % PENNANT_COLORS.length]}
              roughness={0.72}
              side={2}
            />
          </mesh>
        );
      })}
    </>
  );
}

/** A turnstile lane: two pedestals, a scanner post and a status light. */
function Turnstile({ x }: { x: number }) {
  return (
    <group position={[x, 0, 0]}>
      {[-PROP.turnstileLaneWidth / 2, PROP.turnstileLaneWidth / 2].map((z, i) => (
        <group key={z} position={[z, 0, 0]}>
          <mesh position={[0, PROP.turnstileHeight / 2, 0]} castShadow>
            <boxGeometry args={[0.3, PROP.turnstileHeight, 1.5]} />
            <meshStandardMaterial color="#3d3f45" roughness={0.5} metalness={0.4} />
          </mesh>
          <mesh position={[0, PROP.turnstileHeight + 0.03, 0]}>
            <boxGeometry args={[0.34, 0.06, 1.54]} />
            <meshStandardMaterial color="#9aa3ad" roughness={0.35} metalness={0.6} />
          </mesh>
          {i === 0 && (
            <>
              {/* Scanner pillar with a reader panel and a go light */}
              <mesh position={[0, 1.32, 0.55]} castShadow>
                <boxGeometry args={[0.26, 0.55, 0.2]} />
                <meshStandardMaterial color="#23262b" roughness={0.5} />
              </mesh>
              <mesh position={[0, 1.42, 0.66]}>
                <boxGeometry args={[0.16, 0.2, 0.03]} />
                <meshStandardMaterial color="#2ee08a" emissive="#2ee08a" emissiveIntensity={0.9} />
              </mesh>
            </>
          )}
        </group>
      ))}
      {/* Retractable arm across the lane */}
      <mesh position={[0, 0.86, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, PROP.turnstileLaneWidth * 0.85, 8]} />
        <meshStandardMaterial color={ACCENT} metalness={0.5} roughness={0.35} />
      </mesh>
    </group>
  );
}

/** A glazed security kiosk beside the gate line. */
function SecurityBooth({ side }: { side: 1 | -1 }) {
  return (
    <group position={[side * (BEAM_HALF + 5.4), 0, 2.4]} rotation={[0, side > 0 ? -0.3 : 0.3, 0]}>
      <mesh position={[0, 0.12, 0]} receiveShadow>
        <boxGeometry args={[4.6, 0.24, 3.6]} />
        <meshStandardMaterial color="#8e8f8a" roughness={0.96} />
      </mesh>
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.2, 2.6, 3.2]} />
        <meshStandardMaterial color="#e6dccb" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.7, 1.62]}>
        <boxGeometry args={[3.2, 1.5, 0.06]} />
        <primitive object={MAT.glass} attach="material" />
      </mesh>
      <mesh position={[0, 2.95, 0]} castShadow>
        <boxGeometry args={[4.8, 0.22, 3.8]} />
        <meshStandardMaterial color="#40474f" roughness={0.6} />
      </mesh>
      <Text position={[0, 3.35, 0]} fontSize={0.42} color="#ffffff" anchorX="center" anchorY="middle">
        SECURITY
      </Text>
    </group>
  );
}

export function MainGate() {
  const lanes = Array.from({ length: TURNSTILE_COUNT }, (_, i) => (i - (TURNSTILE_COUNT - 1) / 2) * LANE_PITCH);
  const queueLanes = Array.from({ length: LANE_COUNT + 1 }, (_, i) => (i - LANE_COUNT / 2) * LANE_SPACING);

  return (
    <group position={[GATE_X, 0, GATE_Z]}>
      {/* Forecourt paving, and the queue yard beyond it. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, FORECOURT_Z]} receiveShadow>
        <planeGeometry args={[BEAM_HALF * 2 + 26, FORECOURT_DEPTH]} />
        <primitive object={MAT.paving} attach="material" />
      </mesh>
      {/* Concourse inside the gate. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -16]} receiveShadow>
        <planeGeometry args={[GATE_OPENING + 16, 34]} />
        <primitive object={MAT.paving} attach="material" />
      </mesh>

      {/* Drop-off road across the front, with kerb and centre line. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, DROPOFF_Z]} receiveShadow>
        <planeGeometry args={[190, PROP.roadLaneWidth * 2]} />
        <primitive object={MAT.asphalt} attach="material" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, DROPOFF_Z]}>
        <planeGeometry args={[190, 0.14]} />
        <primitive object={MAT.paint} attach="material" />
      </mesh>
      <mesh position={[0, 0.07, KERB_Z]} receiveShadow>
        <boxGeometry args={[190, 0.14, 0.4]} />
        <primitive object={MAT.concrete} attach="material" />
      </mesh>
      {[-26, -13, 0, 13, 26].map((x) => (
        <Bollard key={x} position={[x, 0, BOLLARD_Z]} />
      ))}

      <DrumTower side={1} />
      <DrumTower side={-1} />
      <ArcadeWing side={1} />
      <ArcadeWing side={-1} />
      <SecurityBooth side={1} />
      <SecurityBooth side={-1} />

      {/*
        The archway. A cusped arch springing from both towers, faced in coral,
        outlined in bulbs on the outer and inner edges, scalloped along its
        soffit and carrying the park's name on a board slung beneath it — all of
        it built from the gate's own dimensions, so the turnstile line below is
        unchanged.
      */}
      <ArchBand />
      <SoffitCusps />
      <ArchBulbs radial={BAND_RING} count={54} size={0.34} />
      <ArchBulbs radial={-BAND_RING} count={46} size={0.28} />
      <NameBoard />

      {/*
        The cartouche at the crown: a fanned sunburst of tapered blades behind a
        gold disc, in place of the plain medallion. It has to stay large enough
        to overtop the lettering beneath it, or the keystone stops reading as a
        keystone and becomes something the sign runs through.
      */}
      <group position={[0, GATE_ARCH_Y + ARCH_RISE + KEYSTONE_R, 0]}>
        {/* Radiating blades, alternating gold and teal. */}
        {Array.from({ length: 24 }, (_, i) => {
          const a = (i / 24) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[
                Math.cos(a) * KEYSTONE_R * 1.06,
                Math.sin(a) * KEYSTONE_R * 1.06,
                GATE_PILLAR_HALF * 0.5,
              ]}
              rotation={[0, 0, a - Math.PI / 2]}
              castShadow
            >
              <coneGeometry args={[KEYSTONE_R * 0.15, KEYSTONE_R * 0.86, 3]} />
              <meshStandardMaterial
                color={i % 2 ? ACCENT : TEAL}
                roughness={0.44}
                metalness={i % 2 ? 0.45 : 0.15}
              />
            </mesh>
          );
        })}
        <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry
            args={[KEYSTONE_R * 0.96, KEYSTONE_R * 0.96, GATE_PILLAR_HALF * 1.4, 20]}
          />
          <meshStandardMaterial color={ACCENT} roughness={0.38} metalness={0.5} />
        </mesh>
        <mesh position={[0, 0, GATE_PILLAR_HALF * 0.72]}>
          <circleGeometry args={[KEYSTONE_R * 0.7, 24]} />
          <meshStandardMaterial color={TEAL_DEEP} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, GATE_PILLAR_HALF * 0.74]}>
          <circleGeometry args={[KEYSTONE_R * 0.4, 20]} />
          <meshStandardMaterial color={CORAL} roughness={0.55} />
        </mesh>
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <Bulb
              key={i}
              position={[
                Math.cos(a) * KEYSTONE_R * 0.86,
                Math.sin(a) * KEYSTONE_R * 0.86,
                GATE_PILLAR_HALF * 0.78,
              ]}
              size={0.26}
              color={i % 2 ? BULB_HOT : BULB_WARM}
            />
          );
        })}
      </group>

      {/*
        Bunting: one grand swag across the opening at the springing line — some
        twenty-five metres clear of anybody's head — and a shorter run along the
        top of each arcade wing.
      */}
      <Bunting
        from={[-PILLAR_X + GATE_PILLAR_HALF, GATE_ARCH_Y - 1]}
        to={[PILLAR_X - GATE_PILLAR_HALF, GATE_ARCH_Y - 1]}
        sag={GATE_ARCH_Y * 0.12}
        count={30}
        size={1.5}
        z={GATE_PILLAR_HALF + 0.9}
      />
      {([-1, 1] as const).map((side) => (
        <Bunting
          key={side}
          from={[side * (PILLAR_X + GATE_PILLAR_HALF * 1.05), GATE_PILLAR_HEIGHT * 0.4]}
          to={[
            side * (PILLAR_X + GATE_PILLAR_HALF * 1.05 + GATE_PILLAR_HALF * 4.5),
            GATE_PILLAR_HEIGHT * 0.42,
          ]}
          sag={GATE_PILLAR_HEIGHT * 0.05}
          count={12}
          size={1.1}
          z={GATE_PILLAR_HALF * 0.5}
        />
      ))}

      {/* Canopy over the turnstile line. */}
      <group position={[0, 0, CANOPY_Z]}>
        <mesh position={[0, 5.2, 0]} castShadow>
          <boxGeometry args={[GATE_OPENING + 4, 0.28, 9]} />
          <primitive object={MAT.canopy} attach="material" />
        </mesh>
        {[-1, 1].map((sz) =>
          [-1, 0, 1].map((sx) => (
            <mesh key={`${sx}:${sz}`} position={[sx * (GATE_OPENING / 2 + 1), 2.6, sz * 4]} castShadow>
              <cylinderGeometry args={[0.12, 0.15, 5.2, 8]} />
              <primitive object={MAT.steel} attach="material" />
            </mesh>
          )),
        )}
      </group>

      {/* Twelve turnstile lanes. */}
      {lanes.map((x) => (
        <Turnstile key={x} x={x} />
      ))}

      {/* Queue yard: barrier lanes leading up to the turnstiles. */}
      {queueLanes.map((x) => (
        <Railing key={x} position={[x, 0, 20]} rotation={Math.PI / 2} length={16} />
      ))}

      {/* Lighting, planting and bins around the forecourt. */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <LampPost position={[s * (BEAM_HALF + 13), 0, 14]} double />
          <LampPost position={[s * (BEAM_HALF + 13), 0, 30]} double />
          <Planter position={[s * (BEAM_HALF + 3), 0, 26]} w={7} d={3} />
          <Bin position={[s * (GATE_OPENING / 2 + 2.6), 0, 13]} />
        </group>
      ))}

      {/* Wayfinding pylon inside the gate. */}
      <group position={[GATE_OPENING / 2 + 5, 0, -10]} rotation={[0, 0.4, 0]}>
        <mesh position={[0, 1.6, 0]} castShadow>
          <boxGeometry args={[0.28, 3.2, 0.28]} />
          <primitive object={MAT.steelDark} attach="material" />
        </mesh>
        <mesh position={[0, 2.9, 0]} castShadow>
          <boxGeometry args={[3.2, 1.5, 0.12]} />
          <meshStandardMaterial color="#2f4562" roughness={0.6} />
        </mesh>
        <Text position={[0, 3.2, 0.09]} fontSize={0.3} color="#ffffff" anchorX="center" anchorY="middle">
          FOOD COURT  →
        </Text>
        <Text position={[0, 2.75, 0.09]} fontSize={0.3} color="#ffffff" anchorX="center" anchorY="middle">
          DEPARTMENTS  ↑
        </Text>
      </group>
    </group>
  );
}
