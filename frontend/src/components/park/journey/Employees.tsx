"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import {
  CHECK_IN_COLOR_HEX,
  JOURNEY_EMPLOYEES,
  sampleJourney,
  type CheckInColor,
  type JourneyEmployee,
} from "@/simulation/journey/journey";
import { currentSimTime } from "@/simulation/journey/clock";
import { useJourneyStore } from "@/store/journeyStore";
import { rideById } from "@/components/park/layout";
import { HUMAN, LOD_MID, LOD_NEAR, STATUS_MARKER_RADIUS } from "@/world/scale";

/**
 * The employees: a stylized 3D human character family, at true human scale.
 *
 * Per the character brief, these are PEOPLE — head, hair, eyes, eyebrows,
 * nose, mouth, ears, neck, shirt, trousers, arms, hands, legs, shoes — in a
 * friendly rounded style, male and female, varied in skin tone, hair style,
 * hair colour, build and clothing. No reference images reached the project, so
 * the family is built from the written spec: soft forms (capsules and spheres,
 * no boxes on the body), large readable eyes, corporate-casual clothing.
 *
 * The check-in category is worn, not painted: the shirt itself is a muted
 * workwear shade of the band colour (a green polo, an ochre shirt, a brick-red
 * blouse — never neon), backed by the ground disc and the floating marker so
 * the category survives every camera distance. Faces, hands and shoes are the
 * same across bands; colour never changes what a person looks like, only what
 * they wear.
 *
 * Level of detail, as before:
 *   within  70 m : the whole person — face, fingers-level detail, full gait
 *   within 220 m : a simplified walking figure, still clearly human
 *   beyond 220 m : a still human silhouette, plus the growing status marker
 *
 * Heading is eased rather than snapped: characters turn through corners the
 * way a person does, at a rate fast enough that 60x playback never shows them
 * walking sideways.
 */

const COLORS: CheckInColor[] = ["GREEN", "YELLOW", "RED"];

/** One full gait cycle covers two paces. */
const STRIDE = 1.44;
/** Radians of leg swing per frame, capped so 60x does not spin the legs. */
const MAX_GAIT_STEP = 0.55;
/** How quickly a character turns to a new heading, in rad/s of shortfall. */
const TURN_RATE = 9;

const H = HUMAN;
const LEG_LENGTH = H.hipY - 0.06;
const ARM_LENGTH = H.shoulderY - H.hipY + 0.26;

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ */
/* Shared geometry — rounded, never boxy. Built once for all fifty.    */
/* ------------------------------------------------------------------ */

function ovoid(r: number, sy: number, w = 16, h = 12) {
  const g = new THREE.SphereGeometry(r, w, h);
  g.scale(1, sy, 1);
  return g;
}

const GEO = {
  head: ovoid(H.headRadius, 1.12, 20, 16),
  eyeWhite: new THREE.SphereGeometry(0.021, 10, 8),
  iris: new THREE.SphereGeometry(0.0105, 8, 6),
  brow: new THREE.CapsuleGeometry(0.006, 0.036, 3, 6),
  nose: ovoid(0.013, 1.3, 8, 6),
  mouth: new THREE.CapsuleGeometry(0.0065, 0.026, 3, 6),
  ear: ovoid(0.02, 1.25, 8, 6),
  neck: new THREE.CylinderGeometry(0.05, 0.058, 0.1, 10),

  torso: new THREE.CapsuleGeometry(0.155, 0.3, 6, 14),
  hips: ovoid(0.15, 0.75, 12, 8),
  upperLimb: new THREE.CapsuleGeometry(0.052, ARM_LENGTH - 0.16, 4, 10),
  hand: ovoid(0.045, 1.15, 8, 6),
  leg: new THREE.CapsuleGeometry(0.07, LEG_LENGTH - 0.2, 4, 10),
  shoe: ovoid(0.075, 0.55, 10, 6),

  hairCap: new THREE.SphereGeometry(H.headRadius * 1.06, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62),
  hairBob: new THREE.SphereGeometry(H.headRadius * 1.12, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.8),
  hairBun: new THREE.SphereGeometry(0.045, 10, 8),
  hairTail: new THREE.CapsuleGeometry(0.03, 0.16, 4, 8),
  fringe: new THREE.CapsuleGeometry(0.02, 0.09, 3, 8),

  badge: new THREE.BoxGeometry(0.055, 0.07, 0.012),

  /** Simplified body for the middle band. */
  simpleTorso: new THREE.CapsuleGeometry(0.17, 0.34, 4, 10),
  /** Whole-body silhouette for the far band — one mesh, still a person. */
  silhouette: new THREE.CapsuleGeometry(0.19, H.height - 0.6, 4, 8),

  disc: new THREE.CircleGeometry(0.42, 14),
  ring: new THREE.RingGeometry(0.5, 0.72, 20),
  marker: new THREE.SphereGeometry(STATUS_MARKER_RADIUS, 10, 8),
};

/* ------------------------------------------------------------------ */
/* Shared materials.                                                   */
/* ------------------------------------------------------------------ */

/**
 * Workwear in the band's colour family — status you can read from the
 * overview without turning anyone into a glow-stick (brief: shirts and
 * accents, "do NOT turn the entire human body into a glowing object").
 */
const SHIRT_BY_BAND: Record<CheckInColor, THREE.MeshStandardMaterial[]> = {
  GREEN: ["#2e8a55", "#3f9d64", "#25714a", "#54a877"].map(
    (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 }),
  ),
  YELLOW: ["#c8a52f", "#d9b845", "#b3922a", "#e0c25e"].map(
    (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 }),
  ),
  RED: ["#b34a44", "#c25a52", "#9d3e39", "#cf6a60"].map(
    (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 }),
  ),
};

const SKIN_COLORS = ["#f2cfae", "#e8b98d", "#d9a273", "#b57b4d", "#8a5a35", "#5f4028"];
const HAIR_COLORS = ["#1c1410", "#33261d", "#5a4230", "#8a7358", "#3a3a3e", "#6e3b22"];
const SKIN = SKIN_COLORS.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.62 }));
const HAIR = HAIR_COLORS.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.92 }));
const TROUSERS = ["#2a3346", "#3b3b40", "#4a4237", "#54575e", "#343d3a"].map(
  (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.88 }),
);
const SHOE = [
  new THREE.MeshStandardMaterial({ color: "#1c1c20", roughness: 0.55 }),
  new THREE.MeshStandardMaterial({ color: "#4a3527", roughness: 0.6 }),
  new THREE.MeshStandardMaterial({ color: "#5d5d63", roughness: 0.6 }),
];

const EYE_WHITE = new THREE.MeshStandardMaterial({ color: "#f6f6f2", roughness: 0.35 });
const IRIS = new THREE.MeshStandardMaterial({ color: "#241a12", roughness: 0.3 });
const MOUTH = new THREE.MeshStandardMaterial({ color: "#8c4f43", roughness: 0.6 });
const BADGE = new THREE.MeshStandardMaterial({ color: "#e8eef2", roughness: 0.4 });

/** Muted whole-figure tints for the far silhouette — human first, data second. */
const SILHOUETTE = Object.fromEntries(
  COLORS.map((c) => [
    c,
    new THREE.MeshStandardMaterial({ color: CHECK_IN_COLOR_HEX[c], roughness: 0.85 }),
  ]),
) as Record<CheckInColor, THREE.MeshStandardMaterial>;

/* Unlit, so the colour reads the same everywhere — it is data, not paint. */
const STATUS_FLAT = Object.fromEntries(
  COLORS.map((c) => [
    c,
    new THREE.MeshBasicMaterial({
      color: CHECK_IN_COLOR_HEX[c],
      transparent: true,
      opacity: 0.7,
      toneMapped: false,
    }),
  ]),
) as Record<CheckInColor, THREE.MeshBasicMaterial>;

const STATUS_MARKER = Object.fromEntries(
  COLORS.map((c) => [
    c,
    new THREE.MeshBasicMaterial({ color: CHECK_IN_COLOR_HEX[c], toneMapped: false }),
  ]),
) as Record<CheckInColor, THREE.MeshBasicMaterial>;

const SELECT_RING = new THREE.MeshBasicMaterial({
  color: "#ffffff",
  transparent: true,
  opacity: 0.9,
  toneMapped: false,
});
const WORKING = new THREE.MeshBasicMaterial({ color: "#38bdf8", toneMapped: false });

/* ------------------------------------------------------------------ */
/* Per-person appearance, fixed at build time.                         */
/* ------------------------------------------------------------------ */

type HairStyle = "crop" | "sidePart" | "medium" | "bob" | "ponytail" | "bun";
const MALE_HAIR: HairStyle[] = ["crop", "sidePart", "medium"];
const FEMALE_HAIR: HairStyle[] = ["bob", "ponytail", "bun", "medium"];

interface Look {
  female: boolean;
  shirt: THREE.Material;
  skin: THREE.Material;
  hair: THREE.Material;
  hairStyle: HairStyle;
  trousers: THREE.Material;
  shoe: THREE.Material;
  /** Whole-figure height scale — people are not all the same size. */
  height: number;
  /** Torso breadth scale. */
  build: number;
}

/**
 * Which of the dataset's fictional characters present as female. This is a
 * curated styling table for the character models (hair styles, silhouette),
 * matched to the names the dataset gives its cast — EMP028 "Deepak Raj" gets
 * the male build, EMP041 "Tanya Gupta" the female one. Purely visual; nothing
 * in the simulation or the data reads it.
 */
const FEMALE_IDS = new Set([
  "EMP002", "EMP004", "EMP006", "EMP008", "EMP010", "EMP012", "EMP014",
  "EMP016", "EMP018", "EMP020", "EMP022", "EMP024", "EMP026", "EMP029",
  "EMP031", "EMP033", "EMP035", "EMP037", "EMP039", "EMP041", "EMP043",
  "EMP045", "EMP047", "EMP049",
]);

const LOOKS: Record<string, Look> = Object.fromEntries(
  JOURNEY_EMPLOYEES.map((e, i) => {
    const rand = mulberry32(0xa11ce + i * 977);
    const female = FEMALE_IDS.has(e.id);
    const shirts = SHIRT_BY_BAND[e.color];
    const styles = female ? FEMALE_HAIR : MALE_HAIR;
    return [
      e.id,
      {
        female,
        shirt: shirts[Math.floor(rand() * shirts.length)],
        skin: SKIN[Math.floor(rand() * SKIN.length)],
        hair: HAIR[Math.floor(rand() * HAIR.length)],
        hairStyle: styles[Math.floor(rand() * styles.length)],
        trousers: TROUSERS[Math.floor(rand() * TROUSERS.length)],
        shoe: SHOE[Math.floor(rand() * SHOE.length)],
        height: (female ? 0.94 : 0.99) + rand() * 0.06,
        build: (female ? 0.88 : 1.0) + rand() * 0.1,
      } satisfies Look,
    ];
  }),
);

/** The hair, assembled per style from the shared pieces. */
function Hair({ look }: { look: Look }) {
  const m = look.hair;
  const y = H.headY;
  switch (look.hairStyle) {
    case "crop":
      return <mesh geometry={GEO.hairCap} material={m} position={[0, y + 0.012, -0.008]} />;
    case "sidePart":
      return (
        <group>
          <mesh geometry={GEO.hairCap} material={m} position={[0, y + 0.012, -0.008]} rotation={[0, 0, 0.14]} />
          <mesh geometry={GEO.fringe} material={m} position={[-0.055, y + 0.055, 0.075]} rotation={[0.5, 0, 1.25]} />
        </group>
      );
    case "medium":
      return <mesh geometry={GEO.hairBob} material={m} position={[0, y + 0.02, -0.014]} scale={[1, 0.92, 1]} />;
    case "bob":
      return <mesh geometry={GEO.hairBob} material={m} position={[0, y + 0.018, -0.02]} />;
    case "ponytail":
      return (
        <group>
          <mesh geometry={GEO.hairCap} material={m} position={[0, y + 0.014, -0.01]} />
          <mesh geometry={GEO.hairTail} material={m} position={[0, y - 0.03, -0.13]} rotation={[0.55, 0, 0]} />
        </group>
      );
    case "bun":
      return (
        <group>
          <mesh geometry={GEO.hairCap} material={m} position={[0, y + 0.014, -0.01]} />
          <mesh geometry={GEO.hairBun} material={m} position={[0, y + 0.09, -0.075]} />
        </group>
      );
  }
}

/** The face: eyes, brows, nose, mouth, ears — the character brief's checklist. */
function Face({ look }: { look: Look }) {
  const y = H.headY;
  const r = H.headRadius;
  return (
    <group>
      <mesh geometry={GEO.eyeWhite} material={EYE_WHITE} position={[-0.042, y + 0.012, r * 0.82]} />
      <mesh geometry={GEO.eyeWhite} material={EYE_WHITE} position={[0.042, y + 0.012, r * 0.82]} />
      <mesh geometry={GEO.iris} material={IRIS} position={[-0.042, y + 0.012, r * 0.82 + 0.014]} />
      <mesh geometry={GEO.iris} material={IRIS} position={[0.042, y + 0.012, r * 0.82 + 0.014]} />
      <mesh geometry={GEO.brow} material={look.hair} position={[-0.042, y + 0.048, r * 0.86]} rotation={[0, 0, Math.PI / 2 - 0.12]} />
      <mesh geometry={GEO.brow} material={look.hair} position={[0.042, y + 0.048, r * 0.86]} rotation={[0, 0, Math.PI / 2 + 0.12]} />
      <mesh geometry={GEO.nose} material={look.skin} position={[0, y - 0.012, r * 0.98]} />
      <mesh geometry={GEO.mouth} material={MOUTH} position={[0, y - 0.055, r * 0.88]} rotation={[0, 0, Math.PI / 2]} />
      <mesh geometry={GEO.ear} material={look.skin} position={[-r * 0.98, y, 0]} />
      <mesh geometry={GEO.ear} material={look.skin} position={[r * 0.98, y, 0]} />
    </group>
  );
}

function Figure({ employee }: { employee: JourneyEmployee }) {
  const select = useJourneyStore((s) => s.select);
  const setHovered = useJourneyStore((s) => s.setHovered);
  const look = LOOKS[employee.id];

  const root = useRef<THREE.Group>(null);
  const near = useRef<THREE.Group>(null);
  const mid = useRef<THREE.Group>(null);
  const far = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const midLegL = useRef<THREE.Group>(null);
  const midLegR = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const marker = useRef<THREE.Mesh>(null);
  const badge = useRef<THREE.Mesh>(null);

  /** Frame-to-frame walking state. Refs, so the compiler leaves them alone. */
  const gait = useRef(0);
  const heading = useRef({ value: 0, has: false });
  const last = useRef({ x: 0, z: 0, has: false });

  useFrame((state, delta) => {
    const g = root.current;
    if (!g) return;

    const simTime = currentSimTime();
    const s = sampleJourney(employee, simTime);
    if (!s) {
      g.visible = false;
      last.current.has = false;
      heading.current.has = false;
      return;
    }

    g.visible = true;
    g.position.set(s.x, 0, s.z);

    const working = s.phase === "WORKING";
    const target = working
      ? Math.atan2(rideById(employee.rideId).center[0] - s.x, rideById(employee.rideId).center[1] - s.z)
      : s.facing;

    /*
     * Turning is eased through the shortest arc — a person rotates, they do
     * not snap. On first sight the heading is adopted outright so nobody
     * pirouettes at their spawn point.
     */
    const h = heading.current;
    if (!h.has) {
      h.value = target;
      h.has = true;
    } else {
      let diff = target - h.value;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      h.value += diff * Math.min(1, TURN_RATE * delta);
    }
    g.rotation.y = h.value;

    /*
     * Gait is driven by ground actually covered, not by elapsed time, so the
     * legs stay in step with the walk at every playback speed. The cap keeps
     * 60x from spinning them.
     */
    if (s.moving) {
      const l = last.current;
      const moved = l.has ? Math.hypot(s.x - l.x, s.z - l.z) : 0;
      gait.current += Math.min((moved / STRIDE) * Math.PI * 2, MAX_GAIT_STEP);
    }
    last.current = { x: s.x, z: s.z, has: true };

    // Distance decides how much of a person is worth drawing.
    const d = state.camera.position.distanceTo(g.position);
    const isNear = d < LOD_NEAR;
    const isMid = !isNear && d < LOD_MID;
    if (near.current) near.current.visible = isNear;
    if (mid.current) mid.current.visible = isMid;
    if (far.current) far.current.visible = !isNear && !isMid;

    if (isNear || isMid) {
      const swing = s.moving ? Math.sin(gait.current) : 0;
      const seated = s.phase === "IN_FOOD_COURT" && !s.moving;

      if (isNear) {
        if (legL.current) legL.current.rotation.x = seated ? 1.35 : swing * 0.62;
        if (legR.current) legR.current.rotation.x = seated ? 1.35 : -swing * 0.62;
        if (armL.current) armL.current.rotation.x = seated ? 0.5 : -swing * 0.45;
        if (armR.current) armR.current.rotation.x = seated ? 0.5 : swing * 0.45;
        if (body.current) {
          body.current.position.y = seated ? -0.36 : s.moving ? Math.abs(Math.cos(gait.current)) * 0.022 : 0;
          body.current.rotation.z = s.moving ? Math.sin(gait.current) * 0.022 : 0;
        }
      } else {
        if (midLegL.current) midLegL.current.rotation.x = swing * 0.62;
        if (midLegR.current) midLegR.current.rotation.x = -swing * 0.62;
      }
    }

    /*
     * The marker is the employee's category rendered at a size that survives
     * distance: barely there when you are standing next to them, clearly
     * readable from the far overview.
     */
    if (marker.current) {
      const t = Math.min(1, Math.max(0, (d - LOD_NEAR * 0.35) / (LOD_MID * 1.6)));
      marker.current.scale.setScalar(0.16 + t * 1.35);
      marker.current.position.y = H.height + 0.28 + t * 2.4;
    }

    const { selectedId, hoveredId } = useJourneyStore.getState();
    const isSelected = selectedId === employee.id;
    if (ring.current) {
      ring.current.visible = isSelected || hoveredId === employee.id;
      const pulse = isSelected ? 1 + Math.sin(simTime * 240) * 0.09 : 1;
      // Rings scale with distance too, or a 0.7 m ring is invisible from above.
      ring.current.scale.setScalar(pulse * (1 + Math.min(d / LOD_MID, 3) * 1.6));
    }
    if (badge.current) {
      badge.current.visible = working && d < LOD_MID;
    }
  });

  const torsoY = (H.hipY + H.shoulderY) / 2 + 0.04;

  return (
    <group
      ref={root}
      visible={false}
      onClick={(e) => {
        e.stopPropagation();
        select(employee.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(employee.id);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(null);
        document.body.style.cursor = "";
      }}
    >
      {/* Category on the ground — readable from directly above. */}
      <mesh
        geometry={GEO.disc}
        material={STATUS_FLAT[employee.color]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.03, 0]}
      />
      <mesh
        ref={ring}
        geometry={GEO.ring}
        material={SELECT_RING}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.05, 0]}
        visible={false}
      />
      {/* Category in the air — readable from anywhere. */}
      <mesh ref={marker} geometry={GEO.marker} material={STATUS_MARKER[employee.color]} />
      {/* Work has actually started, as distinct from having arrived. */}
      <mesh ref={badge} geometry={GEO.marker} material={WORKING} position={[0, H.height + 0.62, 0]} scale={0.12} visible={false} />

      {/* ---- near: the whole person ---- */}
      <group ref={near} visible={false} scale={[look.height, look.height, look.height]}>
        <group ref={body}>
          <group ref={legL} position={[-0.1, H.hipY, 0]}>
            <mesh geometry={GEO.leg} material={look.trousers} position={[0, -LEG_LENGTH / 2 + 0.04, 0]} />
            <mesh geometry={GEO.shoe} material={look.shoe} position={[0, -LEG_LENGTH - 0.02, 0.055]} />
          </group>
          <group ref={legR} position={[0.1, H.hipY, 0]}>
            <mesh geometry={GEO.leg} material={look.trousers} position={[0, -LEG_LENGTH / 2 + 0.04, 0]} />
            <mesh geometry={GEO.shoe} material={look.shoe} position={[0, -LEG_LENGTH - 0.02, 0.055]} />
          </group>

          <mesh geometry={GEO.hips} material={look.trousers} position={[0, H.hipY + 0.04, 0]} scale={[look.build, 1, 0.85]} />
          <mesh
            geometry={GEO.torso}
            material={look.shirt}
            position={[0, torsoY, 0]}
            scale={[look.build * 1.18, 1, 0.78]}
          />
          {/* Staff badge on the chest — the corporate touch. */}
          <mesh geometry={GEO.badge} material={BADGE} position={[-0.07, torsoY + 0.12, 0.145]} rotation={[0.06, 0, 0]} />

          <group ref={armL} position={[-(H.shoulderWidth / 2) * look.build - 0.015, H.shoulderY - 0.05, 0]}>
            <mesh geometry={GEO.upperLimb} material={look.shirt} position={[0, -(ARM_LENGTH - 0.16) / 2 - 0.02, 0]} rotation={[0, 0, 0.07]} />
            <mesh geometry={GEO.hand} material={look.skin} position={[-0.012, -ARM_LENGTH + 0.035, 0]} />
          </group>
          <group ref={armR} position={[(H.shoulderWidth / 2) * look.build + 0.015, H.shoulderY - 0.05, 0]}>
            <mesh geometry={GEO.upperLimb} material={look.shirt} position={[0, -(ARM_LENGTH - 0.16) / 2 - 0.02, 0]} rotation={[0, 0, -0.07]} />
            <mesh geometry={GEO.hand} material={look.skin} position={[0.012, -ARM_LENGTH + 0.035, 0]} />
          </group>

          <mesh geometry={GEO.neck} material={look.skin} position={[0, H.shoulderY + 0.05, 0]} />
          <mesh geometry={GEO.head} material={look.skin} position={[0, H.headY, 0]} />
          <Face look={look} />
          <Hair look={look} />
        </group>
      </group>

      {/* ---- middle distance: a walking figure, still clearly human ---- */}
      <group ref={mid} visible={false} scale={[look.height, look.height, look.height]}>
        <group ref={midLegL} position={[-0.1, H.hipY, 0]}>
          <mesh geometry={GEO.leg} material={look.trousers} position={[0, -LEG_LENGTH / 2 + 0.04, 0]} />
        </group>
        <group ref={midLegR} position={[0.1, H.hipY, 0]}>
          <mesh geometry={GEO.leg} material={look.trousers} position={[0, -LEG_LENGTH / 2 + 0.04, 0]} />
        </group>
        <mesh geometry={GEO.simpleTorso} material={look.shirt} position={[0, torsoY + 0.02, 0]} scale={[look.build, 1, 0.8]} />
        <mesh geometry={GEO.head} material={look.skin} position={[0, H.headY, 0]} />
        <mesh geometry={GEO.hairCap} material={look.hair} position={[0, H.headY + 0.012, -0.008]} />
      </group>

      {/* ---- far: a human silhouette in the band colour ---- */}
      <group ref={far} visible={false}>
        <mesh geometry={GEO.silhouette} material={SILHOUETTE[employee.color]} position={[0, H.height / 2, 0]} />
      </group>
    </group>
  );
}

export function Employees() {
  const figures = useMemo(
    () => JOURNEY_EMPLOYEES.map((e) => <Figure key={e.id} employee={e} />),
    [],
  );
  return <group>{figures}</group>;
}
