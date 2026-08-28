"use client";

import { Billboard, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  EMPLOYEE_BY_ID,
  JOURNEY_EMPLOYEES,
  sampleJourney,
  type CheckInColor,
  type JourneyEmployee,
} from "@/simulation/journey/journey";
import { useActiveJourneyStore } from "@/simulation/journey/activeJourney";
import { currentSimTime } from "@/simulation/journey/clock";
import { formatSimTime } from "@/simulation/clock";
import { FOOD_COURT_CHAIRS, FOOD_COURT_FACING } from "@/simulation/journey/constants";
import { useJourneyStore } from "@/store/journeyStore";
import { useCameraStore } from "@/store/cameraStore";
import { rideById } from "@/components/park/layout";
import {
  FADE,
  WALK_CLIP_SPEED,
  createEmployeeRig,
  type EmployeeRig,
} from "./humanRig";
import { EMPLOYEE_HEIGHT, EMPLOYEE_SCALE, HUMAN, LOD_MID, LOD_NEAR } from "@/world/scale";
/* The distance compensation that keeps a person a readable size on screen.
   Pure, so scripts/verify-visibility.ts can re-derive it against the real
   entrance camera without pulling in three.js or React. */
import { DEFAULT_FIGURE_FOV, figureScale } from "./figureLegibility";
import { CLIMB_PACE_FRACTION } from "@/simulation/journey/boardingStair";

/**
 * The employees: thirty rigged, skinned human characters, one per dataset row.
 *
 * Each figure is a real character rig — see `humanRig.ts` — with a nineteen
 * bone skeleton, a skinned mesh whose every vertex carries four bone weights,
 * and hand-authored Walk, Idle and Sit clips crossfaded by an
 * `AnimationMixer`. The mesh DEFORMS at its joints; nothing here translates a
 * frozen model across the ground. Geometry and clips are built once and shared
 * by the whole cast, while every employee owns their own skeleton and mixer,
 * which is what lets thirty people be at thirty different points of their own
 * morning at the same instant.
 *
 * The walk is paced by GROUND ACTUALLY COVERED rather than by elapsed time:
 * the clip is played at whatever rate makes its own stride match the distance
 * the journey moved the figure this frame, so the feet stay planted at 1x and
 * the legs speed up rather than the body skating at 60x.
 *
 * These are PEOPLE — head, hair, eyes, eyebrows, nose, mouth, ears, neck,
 * shirt, trousers, arms, hands, legs, shoes — male and female, varied in skin
 * tone, hair style, hair colour, build and clothing, so the roster reads as
 * thirty colleagues rather than one model copied thirty times. The head does
 * not bend, so the skull, face and hair ride the head BONE as ordinary meshes
 * and stay out of the shared skinned buffer.
 *
 * The check-in category is WORN, and worn only: a green, yellow or red garment
 * in the band's colour, and no disc on the ground, no sphere over the head and
 * no beam reaching to the sky. Faces, hands, hair, trousers and shoes are the
 * same across all three bands; colour never changes what a person looks like,
 * only what they have on.
 *
 * Level of detail:
 *   within  70 m : the whole person, face and all
 *   beyond  70 m : the same rig, still fully animated, without the face
 *
 * And across that whole range the figure is held at a readable size on screen
 * rather than at true scale — see MIN_FIGURE_PX. A 1.75 m person seen from the
 * far side of an 846 m park covers about three pixels, which is why the park
 * used to read as deserted from every wide viewpoint; the same distance
 * compensation the name plate already uses is now applied to the person it
 * annotates.
 *
 * Heading is eased rather than snapped: characters turn through corners the
 * way a person does, at a rate fast enough that 60x playback never shows them
 * walking sideways.
 */

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
/* Shared geometry — rounded, never boxy. Built once for the whole cast. */
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

  /*
   * THE POLO FRONT: a collar band, two collar leaves and a short button
   * placket. Three small pieces, all in the employee's OWN uniform colour or a
   * shade of it.
   *
   * What was here before was a suit front — a white dress-shirt panel, white
   * collar points, lapels and a tie — worn over the coloured coat. That is what
   * the user was seeing as "inner clothing" and "exposed clothing layers": a
   * white garment showing through a coloured one, on a figure small enough that
   * the two read as a hole in the shirt rather than as tailoring. There is only
   * one garment now, so there is no layer underneath to show.
   */
  collarBand: new THREE.TorusGeometry(0.062, 0.017, 8, 20),
  collarLeaf: new THREE.BoxGeometry(0.058, 0.05, 0.016),
  placket: new THREE.BoxGeometry(0.03, 0.14, 0.012),
  button: new THREE.SphereGeometry(0.0075, 8, 6),

  /* The selection ring, and the work-started pip. Both are interface, not
     status: the ring is white and the pip is the park's UI blue, so neither
     can be mistaken for a check-in band. */
  ring: new THREE.RingGeometry(0.5, 0.72, 20),
  pip: new THREE.SphereGeometry(0.14, 10, 8),
};

/* ------------------------------------------------------------------ */
/* Shared materials.                                                   */
/* ------------------------------------------------------------------ */

/**
 * THE CHECK-IN BAND IS WORN, AND NOTHING ELSE CARRIES IT.
 *
 * The band used to be shown four ways at once: a coloured disc on the ground,
 * a coloured sphere over the head, a coloured beam reaching to the sky while
 * walking, and a muted tint on the shirt. All but the shirt are gone. The
 * garment is now the ONLY thing that states an employee's category, which is
 * why it is saturated rather than muted — an earlier brief asked for
 * near-workwear shades because the markers were doing the real work, and with
 * the markers removed a muted shirt states nothing at 28 px.
 *
 * The colours are pitched to survive the park's own light. Its key is a low
 * sun at #ffb478, and orange light on a moderate green comes back olive, so
 * the greens in particular are pushed well into green at the albedo to land as
 * green on screen — the same correction the lawn needed.
 *
 * Only the garment changes. Skin, hair, trousers and shoes are the same across
 * all three bands, so colour says what somebody wears and never what they look
 * like.
 */
/*
 * A little self-lit, and deliberately so. The park is an evening park: its
 * ground is near-black and most of the light is emissive architecture, so a
 * purely lit figure standing in a ride's shadow disappears entirely — which is
 * half of why the cast read as absent. A low emissive of the garment's OWN
 * colour lifts people out of shadow without turning anyone into a lamp, and
 * without adding a single light to the scene.
 */
function worn(color: string, emissiveIntensity = 0.22): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.8,
    emissive: new THREE.Color(color),
    emissiveIntensity,
  });
}

/**
 * THE UNIFORM SHIRT, in the employee's own check-in colour.
 *
 * ONE GARMENT ON THE TOP HALF, AND NOTHING UNDER IT. The cast used to wear a
 * coloured suit coat over a white dress shirt with a tie; on a figure this size
 * the white showed through the coloured coat as a bright wedge, which is what
 * the user reported as visible inner clothing. There is no second layer now: a
 * plain, well-fitted work polo in the band colour, collared and plackets, and
 * the skinned body underneath is covered from the neck to the wrist by it.
 *
 * The colours are unchanged and stay saturated. They are pitched to survive the
 * park's own light: its key is a low sun at #ffb478, and orange light on a
 * moderate green comes back olive, so the greens are pushed well into green at
 * the albedo to land as green on screen.
 *
 * Four shades per band rather than one, so thirty colleagues in the same
 * uniform still read as thirty people; the shades are close enough that nobody
 * could mistake one band for another.
 */
const SHIRT_BY_BAND: Record<CheckInColor, THREE.MeshStandardMaterial[]> = {
  GREEN: ["#1f9e33", "#2bb141", "#178c2c", "#37c04f"].map((c) => worn(c)),
  YELLOW: ["#e8b21a", "#f2c231", "#d6a012", "#ffcf45"].map((c) => worn(c)),
  RED: ["#c8202a", "#dc2f38", "#ad1922", "#e8434b"].map((c) => worn(c)),
};

/**
 * The collar and placket, one shade down from the shirt they trim.
 *
 * Same band, same hue — a polo's collar is cut from the same cloth as its body,
 * just read darker because it is doubled over. Keeping it inside the band is
 * what stops the trim reading as a second garment showing through.
 */
const TRIM_BY_BAND: Record<CheckInColor, THREE.MeshStandardMaterial> = {
  GREEN: worn("#14701f", 0.14),
  YELLOW: worn("#a87c0e", 0.14),
  RED: worn("#8e161e", 0.14),
};

/**
 * DARK PROFESSIONAL TROUSERS, THE SAME FOR EVERYBODY.
 *
 * The user's rule is explicit: the uniform DESIGN is identical across the cast
 * and only the shirt carries the check-in colour — "green professional shirt +
 * dark trousers + shoes", and the same sentence for yellow and for red. So the
 * trousers are a band-INDEPENDENT pool of dark workwear tones. They were the
 * band's own hue darkened until now, which meant a red employee was red from
 * collar to ankle and the colour stated the band twice.
 */
const TROUSERS = ["#2b3038", "#242832", "#33383f", "#1f2a3a"].map((c) => worn(c, 0.1));

const SKIN_COLORS = ["#f2cfae", "#e8b98d", "#d9a273", "#b57b4d", "#8a5a35", "#5f4028"];
const HAIR_COLORS = ["#1c1410", "#33261d", "#5a4230", "#8a7358", "#3a3a3e", "#6e3b22"];
const SKIN = SKIN_COLORS.map((c) => worn(c, 0.16));
const HAIR = HAIR_COLORS.map((c) => worn(c, 0.1));
const SHOE = ["#33333c", "#5e4534", "#70707a"].map((c) => worn(c, 0.12));

const EYE_WHITE = new THREE.MeshStandardMaterial({ color: "#f6f6f2", roughness: 0.35 });
const IRIS = new THREE.MeshStandardMaterial({ color: "#241a12", roughness: 0.3 });
const MOUTH = new THREE.MeshStandardMaterial({ color: "#8c4f43", roughness: 0.6 });
const BADGE = new THREE.MeshStandardMaterial({ color: "#e8eef2", roughness: 0.4 });

const SELECT_RING = new THREE.MeshBasicMaterial({
  color: "#ffffff",
  transparent: true,
  opacity: 0.9,
  toneMapped: false,
});
/* Work has started. The park's interface blue, never a band colour. */
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
  /** Collar and placket, one shade down from this employee's own shirt. */
  trim: THREE.Material;
  trousers: THREE.Material;
  shoe: THREE.Material;
  /** Torso breadth scale. Height is the same for everybody — see buildCharacter. */
  build: number;
}

/**
 * Which of the roster's characters present as female. A curated styling table
 * for the character models (hair styles, silhouette), matched to the names the
 * attendance sheet gives its cast — EMP1003 "Riya Sharma" gets the female
 * build, EMP1004 "Reyansh Nair" the male one. Purely visual; nothing in the
 * simulation or the data reads it.
 */
const FEMALE_IDS = new Set([
  "EMP1003", "EMP1006", "EMP1010", "EMP1012", "EMP1013", "EMP1014",
  "EMP1015", "EMP1018", "EMP1020", "EMP1021", "EMP1022", "EMP1023",
  "EMP1024", "EMP1025", "EMP1029", "EMP1030",
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
        trim: TRIM_BY_BAND[e.color],
        shoe: SHOE[Math.floor(rand() * SHOE.length)],
        build: (female ? 0.88 : 1.0) + rand() * 0.1,
      } satisfies Look,
    ];
  }),
);

/** FNV-1a, for a stable per-id seed when the id is not in the curated cast. */
function hashId(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Appearance for an UPLOADED roster's employee. The built-in cast keeps its
 * curated looks; anyone else gets a deterministic one hashed from their id, so
 * the same uploaded person always looks the same. Keyed by id AND band,
 * because the shirt pool depends on the band — a built-in id uploaded with a
 * different delay must not wear a shirt that contradicts their band.
 */
const EXTRA_LOOKS = new Map<string, Look>();
function lookFor(employee: JourneyEmployee): Look {
  const curated = LOOKS[employee.id];
  if (curated && EMPLOYEE_BY_ID[employee.id]?.color === employee.color) return curated;

  const key = `${employee.id}|${employee.color}`;
  const cached = EXTRA_LOOKS.get(key);
  if (cached) return cached;

  const seed = hashId(employee.id);
  const rand = mulberry32(seed);
  const female = (seed & 1) === 1;
  const shirts = SHIRT_BY_BAND[employee.color];
  const styles = female ? FEMALE_HAIR : MALE_HAIR;
  const look: Look = {
    female,
    shirt: shirts[Math.floor(rand() * shirts.length)],
    skin: SKIN[Math.floor(rand() * SKIN.length)],
    hair: HAIR[Math.floor(rand() * HAIR.length)],
    hairStyle: styles[Math.floor(rand() * styles.length)],
    trousers: TROUSERS[Math.floor(rand() * TROUSERS.length)],
    trim: TRIM_BY_BAND[employee.color],
    shoe: SHOE[Math.floor(rand() * SHOE.length)],
    build: (female ? 0.88 : 1.0) + rand() * 0.1,
  };
  EXTRA_LOOKS.set(key, look);
  return look;
}

/**
 * The plate that floats over an employee's head — see `IdentityChip` below.
 *
 * Two lines, ID above check-in time, on a billboard so it always faces the
 * camera whichever way the person is walking. It exists because a park full of
 * anonymous figures cannot tell you who is sitting out a delay, nor when they
 * arrived; with the plate you can follow one person from the gate to their
 * ride and see the minute their morning started.
 *
 * Legibility across a park this size is the whole problem. The plate is scaled
 * up with distance on its own ramp, which keeps its apparent size roughly
 * constant instead of shrinking to nothing — and it is capped and then hidden
 * entirely beyond LABEL_RANGE, past which thirty plates would be thirty pieces
 * of unreadable clutter over a park you are trying to look at.
 */
const LABEL_ID_SIZE = 0.34;
/** The check-in line, deliberately smaller so the ID reads first. */
const LABEL_TIME_SIZE = 0.26;
/**
 * The plate scales with DISTANCE so its on-screen size stays constant: at the
 * park's 46° lens on a 900px-tall viewport, a glyph of world height h at
 * distance d covers h / (2·d·tan 23°) · 900 px. With scale = d / 30 the ID
 * line holds ≈ 12 px at every distance — readable from the gate and from the
 * overview alike — until the cap. Beyond LABEL_RANGE the plates switch off so
 * thirty of them do not shingle the far half of the park; the selected,
 * hovered or followed employee keeps theirs at any distance.
 */
const LABEL_SCALE_PER_METRE = 1 / 30;
const LABEL_MAX_SCALE = 15;
const LABEL_RANGE = 450;
/**
 * THE PLATE LADDER.
 *
 * A department's five employees stand within a couple of metres of each other
 * at their ride, so five plates at one height stack into a single dark slab
 * that hides the very group it is labelling. Each employee therefore gets
 * their own deterministic rung — same person, same rung, every reload — which
 * fans a cluster out vertically instead.
 *
 * The rise is expressed in PLATE HEIGHTS rather than in world units, because
 * that is the only measure that actually clears a plate: a rung of 1.15 leaves
 * a plate's own height plus a 15% gap between one label and the next, at every
 * distance, since the plate and the gap scale together. Five rungs matches the
 * five-strong departments; the ten at the Ferris Wheel pair up two to a rung,
 * which is still five times better than ten in a stack.
 */
const LABEL_STAGGER_STEPS = 5;
const LABEL_STAGGER_RISE = 1.15;

/**
 * How far out the rigged body is still drawn.
 *
 * The whole park, now, rather than the 450 m the name plate reaches. The old
 * limit meant that from the page a visitor lands on — where the rides are
 * 500 to 900 m downrange — every employee standing at their department was a
 * silhouette capsule under six pixels tall, and for 82% of the simulated day
 * that is where the entire cast is. Thirty skinned figures is about 210k
 * vertices, which is nothing next to the park they stand in, so the body is
 * drawn as far as the camera can orbit (OrbitControls caps at 1600 m).
 */
const FIGURE_RANGE = 1800;


/* A rounded plate, built once and shared by all thirty. */
function roundedRect(width: number, height: number, radius: number): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return new THREE.ShapeGeometry(shape, 6);
}

const CHIP_W = 1.72;
const CHIP_H = 0.94;
const CHIP = {
  plate: roundedRect(CHIP_W, CHIP_H, 0.2),
  edge: roundedRect(CHIP_W + 0.07, CHIP_H + 0.07, 0.235),
  /* The little downward point, so a plate is unambiguously attached to the
     person under it when several are close together. */
  tail: (() => {
    const t = new THREE.Shape();
    t.moveTo(-0.13, 0);
    t.lineTo(0.13, 0);
    t.lineTo(0, -0.2);
    t.closePath();
    return new THREE.ShapeGeometry(t);
  })(),
};

/* Unlit and untone-mapped, so the plate reads the same at sunset, at sunrise
   and at night — it is interface, not part of the park's lighting. */
const CHIP_PLATE = new THREE.MeshBasicMaterial({
  color: "#070b14",
  transparent: true,
  opacity: 0.82,
  toneMapped: false,
  depthWrite: false,
});
const CHIP_EDGE = new THREE.MeshBasicMaterial({
  color: "#7dd3fc",
  transparent: true,
  opacity: 0.3,
  toneMapped: false,
  depthWrite: false,
});

/**
 * The plate that floats over an employee's head: WHO, and WHEN THEY CHECKED IN.
 *
 * It used to carry the employee's name on its second line, which told a viewer
 * nothing the park was built to show. The check-in minute is the fact the
 * whole visualisation turns on — it is where the delay is measured from, and
 * it is what put this person in a green, yellow or red shirt — so reading a
 * figure now means reading their identity and their arrival together.
 *
 * Both lines come from the employee's own dataset row. The ID leads at the
 * larger size; the time follows, smaller and in the park's interface blue.
 * Both sit on a dark rounded plate rather than on outlined text alone, because
 * a sunset sky behind a walking figure is not a background you can rely on for
 * contrast.
 *
 * Billboarded by the caller, so it faces the camera from every angle, and
 * lifted clear of the head so it never covers the body it names.
 */
function IdentityChip({ id, checkIn }: { id: string; checkIn: string }) {
  return (
    <>
      <mesh geometry={CHIP.edge} material={CHIP_EDGE} position={[0, 0, -0.002]} />
      <mesh geometry={CHIP.plate} material={CHIP_PLATE} />
      <mesh geometry={CHIP.tail} material={CHIP_PLATE} position={[0, -CHIP_H / 2 + 0.005, 0]} />
      <Text
        position={[0, LABEL_ID_SIZE * 0.62, 0.004]}
        fontSize={LABEL_ID_SIZE}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {id}
      </Text>
      <Text
        position={[0, -LABEL_TIME_SIZE * 0.78, 0.004]}
        fontSize={LABEL_TIME_SIZE}
        color="#7dd3fc"
        anchorX="center"
        anchorY="middle"
      >
        {checkIn}
      </Text>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* One employee's character: the skinned rig, plus the head that rides it. */
/* ------------------------------------------------------------------ */

/** Cap on how fast the walk clip may be played, so 60x does not spin the legs. */
const MAX_GAIT_RATE = 3.2;

/**
 * A character built around this employee's rig.
 *
 * The BODY is skinned — one shared geometry, this person's own skeleton — so
 * the mesh deforms at the joints. The HEAD is not: a head does not bend, so
 * the skull, face, hair and staff badge are ordinary meshes parented to the
 * `head` and `chest` BONES, which carries them along with every clip for free
 * and keeps the per-employee detail out of the shared skinned buffer.
 *
 * This is where the thirty stop looking like one model copied thirty times:
 * skin tone, hair colour and style, shirt, trousers, shoes, height and build
 * are all this employee's own, applied to shared geometry.
 */
function buildCharacter(look: Look): EmployeeRig & { face: THREE.Group } {
  const rig = createEmployeeRig({
    skin: look.skin,
    shirt: look.shirt,
    trousers: look.trousers,
    shoe: look.shoe,
  });

  /* Head, parented to the head bone. Offsets are relative to that bone, which
     already sits at HUMAN.headY, so the face geometry's own absolute heights
     are rebased by -H.headY. */
  const head = new THREE.Group();
  const y0 = -0;
  const r = H.headRadius;
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, pos: [number, number, number], rot?: [number, number, number]) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...pos);
    if (rot) m.rotation.set(...rot);
    m.castShadow = true;
    head.add(m);
    return m;
  };

  add(GEO.head, look.skin, [0, y0, 0]);

  /* The face: eyes, brows, nose, mouth, ears — hidden past LOD_NEAR, where a
     0.02 m eye is far under a pixel. */
  const face = new THREE.Group();
  const facePart = (geo: THREE.BufferGeometry, mat: THREE.Material, pos: [number, number, number], rot?: [number, number, number]) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...pos);
    if (rot) m.rotation.set(...rot);
    face.add(m);
  };
  facePart(GEO.eyeWhite, EYE_WHITE, [-0.042, y0 + 0.012, r * 0.82]);
  facePart(GEO.eyeWhite, EYE_WHITE, [0.042, y0 + 0.012, r * 0.82]);
  facePart(GEO.iris, IRIS, [-0.042, y0 + 0.012, r * 0.82 + 0.014]);
  facePart(GEO.iris, IRIS, [0.042, y0 + 0.012, r * 0.82 + 0.014]);
  facePart(GEO.brow, look.hair, [-0.042, y0 + 0.048, r * 0.86], [0, 0, Math.PI / 2 - 0.12]);
  facePart(GEO.brow, look.hair, [0.042, y0 + 0.048, r * 0.86], [0, 0, Math.PI / 2 + 0.12]);
  facePart(GEO.nose, look.skin, [0, y0 - 0.012, r * 0.98]);
  facePart(GEO.mouth, MOUTH, [0, y0 - 0.055, r * 0.88], [0, 0, Math.PI / 2]);
  facePart(GEO.ear, look.skin, [-r * 0.98, y0, 0]);
  facePart(GEO.ear, look.skin, [r * 0.98, y0, 0]);
  head.add(face);

  /* Hair, in this employee's own style — the cheapest strong difference
     between two figures at any distance the head is visible from. */
  const hair = look.hair;
  switch (look.hairStyle) {
    case "crop":
      add(GEO.hairCap, hair, [0, y0 + 0.012, -0.008]);
      break;
    case "sidePart":
      add(GEO.hairCap, hair, [0, y0 + 0.012, -0.008], [0, 0, 0.14]);
      add(GEO.fringe, hair, [-0.055, y0 + 0.055, 0.075], [0.5, 0, 1.25]);
      break;
    case "medium":
      add(GEO.hairBob, hair, [0, y0 + 0.02, -0.014]).scale.set(1, 0.92, 1);
      break;
    case "bob":
      add(GEO.hairBob, hair, [0, y0 + 0.018, -0.02]);
      break;
    case "ponytail":
      add(GEO.hairCap, hair, [0, y0 + 0.014, -0.01]);
      add(GEO.hairTail, hair, [0, y0 - 0.03, -0.13], [0.55, 0, 0]);
      break;
    case "bun":
      add(GEO.hairCap, hair, [0, y0 + 0.014, -0.01]);
      add(GEO.hairBun, hair, [0, y0 + 0.09, -0.075]);
      break;
  }
  rig.bone("head").add(head);

  /*
   * THE POLO FRONT — collar band, collar leaves and a short placket.
   *
   * Worn on the CHEST BONE as ordinary meshes, exactly as the skull and face
   * ride the head bone. A collar does not deform, so skinning it into the body
   * would buy nothing and would mean more material slots on the shared mesh for
   * every employee in the park. Parented to the bone it swings with the torso
   * through every clip for free.
   *
   * EVERY PIECE IS IN THE EMPLOYEE'S OWN BAND. There is deliberately no white,
   * no second garment and no tie: what was drawn here before was a dress shirt
   * and lapels UNDER the coloured coat, and at the size a figure is actually
   * seen at, a pale panel inside a coloured one reads as underclothes showing
   * through rather than as a suit. The trim is the shirt's own colour a shade
   * down, so the collar models the neckline without ever looking like a layer.
   *
   * The pieces also sit tight to the chest — 0.118 to 0.132 out from the bone,
   * against a chest radius of 0.168 — so they lie ON the torso rather than
   * floating in front of it, and none of them is wider than the body beneath.
   */
  const uniform = new THREE.Group();
  const wear = (
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    pos: [number, number, number],
    rot?: [number, number, number],
  ) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...pos);
    if (rot) m.rotation.set(...rot);
    uniform.add(m);
    return m;
  };
  /* Collar band: a ring around the base of the neck, closing the neckline. */
  wear(GEO.collarBand, look.trim, [0, 0.152, 0.006], [Math.PI / 2 - 0.16, 0, 0]).scale.set(1.16, 1, 0.86);
  /* Two collar leaves, lying open either side of the throat. */
  wear(GEO.collarLeaf, look.trim, [-0.041, 0.138, 0.104], [0.24, 0, 0.34]);
  wear(GEO.collarLeaf, look.trim, [0.041, 0.138, 0.104], [0.24, 0, -0.34]);
  /* A short button placket down from the collar — the polo's one detail. */
  wear(GEO.placket, look.trim, [0, 0.058, 0.13], [0.05, 0, 0]);
  wear(GEO.button, look.shirt, [0, 0.106, 0.138]);
  wear(GEO.button, look.shirt, [0, 0.03, 0.138]);
  rig.bone("chest").add(uniform);

  /* Staff badge on the chest — the corporate touch, worn on the bone so it
     swings with the torso. */
  const badgeMesh = new THREE.Mesh(GEO.badge, BADGE);
  badgeMesh.position.set(-0.105, 0.052, 0.132);
  badgeMesh.rotation.x = 0.06;
  rig.bone("chest").add(badgeMesh);

  /*
   * ONE SIZE, FOR ALL THIRTY.
   *
   * EMPLOYEE_SCALE on all three axes, so every employee is the same
   * 4.0-unit figure and no two can differ. It is applied uniformly rather than
   * per-axis, which is what keeps a person a person: the head, arms, legs and
   * torso all grow together and nothing is stretched or squashed.
   *
   * The per-person breadth that used to vary here — a few percent either way,
   * so that two colleagues of the same height were still different shapes — is
   * gone, because the brief asks for one identical bounding box across the
   * whole cast. Build now shows only in clothing and hair.
   */
  rig.group.scale.setScalar(EMPLOYEE_SCALE);

  return { ...rig, face };
}

export type Character = EmployeeRig & { face: THREE.Group };

/** Return a character's own resources when its employee leaves the roster. */
function disposeCharacter(rig: Character): void {
  rig.mixer.stopAllAction();
  rig.mixer.uncacheRoot(rig.mesh);
  rig.skeleton.dispose();
}

/**
 * Built characters, held outside React.
 *
 * A rig owns a skeleton and a mixer that the frame loop writes to sixty times
 * a second, which is precisely the kind of value React must not treat as
 * immutable render output — so it is not one. The cache is keyed by roster
 * revision AND employee id, so an uploaded roster builds a fresh cast and the
 * previous one is disposed rather than leaked.
 */
const CHARACTERS = new Map<string, Character>();

function characterFor(key: string, look: Look): Character {
  let character = CHARACTERS.get(key);
  if (!character) {
    character = buildCharacter(look);
    CHARACTERS.set(key, character);
  }
  return character;
}

/** Drop every character that does not belong to the roster now on stage. */
function releaseCharactersExcept(prefix: string): void {
  for (const [key, character] of CHARACTERS) {
    if (!key.startsWith(prefix)) {
      disposeCharacter(character);
      CHARACTERS.delete(key);
    }
  }
}

function Figure({ employee, cacheKey }: { employee: JourneyEmployee; cacheKey: string }) {
  const select = useJourneyStore((s) => s.select);
  const setHovered = useJourneyStore((s) => s.setHovered);
  /* Clicking a person both opens their panel and eases the camera onto them —
     the director's own follow easing, so the move is a glide rather than a cut
     and the user keeps full orbit and zoom control throughout. */
  const focusOn = useCameraStore((s) => s.follow);

  /*
   * The world heading that faces this employee's own chair in towards its
   * table. Null for anyone who never sits — the fifteen with no delay. The
   * chair's facing is stored in the court's local frame, so it is turned into
   * world space by the same rotation the court itself is drawn with.
   */
  const chairFacing =
    employee.chairIndex === null
      ? null
      : FOOD_COURT_CHAIRS[employee.chairIndex].facing + FOOD_COURT_FACING;

  /* Straight off the employee's own dataset row — the ID they check in with,
     and the minute they checked in at. Nothing here is computed. */
  const label = useMemo(
    () => ({ id: employee.id, checkIn: formatSimTime(employee.checkInTime) }),
    [employee.id, employee.checkInTime],
  );

  /* This employee's rung on the plate ladder — see LABEL_STAGGER_STEPS. */
  const rung = useMemo(() => hashId(employee.id) % LABEL_STAGGER_STEPS, [employee.id]);

  /*
   * This employee's own rig: shared geometry and shared clips, but their own
   * skeleton and their own mixer, so thirty people can be at thirty different
   * points of their own morning at the same instant.
   */

  const root = useRef<THREE.Group>(null);
  /* The rigged character is mounted here imperatively rather than through JSX:
     its skeleton and mixer are written to every frame, so it must not be a
     value React treats as immutable render output. */
  const holder = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const badge = useRef<THREE.Mesh>(null);
  const plate = useRef<THREE.Group>(null);

  /** Frame-to-frame walking state. Refs, so the compiler leaves them alone. */
  const heading = useRef({ value: 0, has: false });
  const last = useRef({ x: 0, y: 0, z: 0, has: false });

  useEffect(() => {
    const h = holder.current;
    if (!h) return;
    const character = characterFor(cacheKey, lookFor(employee));
    h.add(character.group);
    return () => {
      h.remove(character.group);
    };
  }, [cacheKey, employee]);

  useFrame((state, delta) => {
    const g = root.current;
    if (!g) return;
    const rig = CHARACTERS.get(cacheKey);

    const simTime = currentSimTime();
    const s = sampleJourney(employee, simTime);
    if (!s) {
      g.visible = false;
      last.current.has = false;
      heading.current.has = false;
      return;
    }

    g.visible = true;
    /*
     * Y is no longer always zero. Every leg walked on the ground still is, but
     * the boarding gangway rises to the seat, and a seated rider is wherever
     * the ride has carried their seat to — up the Ferris Wheel's rim, out on
     * the Monster Ride's arm, or over the top of the coaster's loop.
     */
    g.position.set(s.x, s.y, s.z);

    const working = s.working;
    const inFoodCourt = s.phase === "IN_FOOD_COURT" && !s.moving;
    /* Sitting is sitting, whether it is a café chair or a ride seat. */
    const seatedNow = inFoodCourt || s.onRide;
    /* On the boarding stair, up or down: knees high, hands on the rail. */
    const climbing = s.phase === "CLIMBING_LADDER";
    /*
     * Standing figures look where they are going; a working one faces their
     * ride; a diner turns in to their own table, which is what stops them
     * sitting with their back to the food; and a rider faces whichever way the
     * seat holding them faces.
     */
    const target = working
      ? Math.atan2(rideById(employee.rideId).center[0] - s.x, rideById(employee.rideId).center[1] - s.z)
      : inFoodCourt && chairFacing !== null
        ? chairFacing
        : s.facing;

    /*
     * Turning is eased through the shortest arc — a person rotates, they do
     * not snap. On first sight the heading is adopted outright so nobody
     * pirouettes at their spawn point, and so is a rider's, because somebody
     * bolted into a seat turns exactly as fast as the seat does.
     */
    const h = heading.current;
    if (!h.has || s.onRide) {
      h.value = target;
      h.has = true;
    } else {
      let diff = target - h.value;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      h.value += diff * Math.min(1, TURN_RATE * delta);
    }
    /* Yaw first, then whatever tilt the ride is imposing — so a rider leans
       with the machine instead of standing bolt upright inside it. */
    g.rotation.order = "YXZ";
    g.rotation.set(s.pitch, h.value, s.roll);

    /*
     * Ground actually covered this frame. The walk clip is played at whatever
     * rate makes its own stride match that distance, so the feet are planted:
     * an employee at the simulation's walking pace does not skate, and at 60x
     * the legs speed up instead of the body sliding out from under them.
     */
    const l = last.current;
    /*
     * Ground COVERED, so a rider being carried by a ride does not set their
     * legs running: none of that distance is walked. On the stair the climb is
     * mostly vertical, so the height gained counts too — otherwise a steep
     * flight would read as barely moving.
     */
    const moved = l.has && !s.onRide
      ? Math.hypot(s.x - l.x, s.y - l.y, s.z - l.z)
      : 0;
    last.current = { x: s.x, y: s.y, z: s.z, has: true };

    // Distance decides how much of a person is worth drawing.
    const d = state.camera.position.distanceTo(g.position);
    const isNear = d < LOD_NEAR;
    const embodied = d < FIGURE_RANGE;
    if (holder.current) holder.current.visible = embodied;

    /*
     * How much this figure has to be enlarged to still read as a person from
     * here — the projection equation solved for scale. See MIN_FIGURE_PX.
     */
    const cam = state.camera as THREE.PerspectiveCamera;
    const fov = cam.isPerspectiveCamera ? cam.fov : DEFAULT_FIGURE_FOV;
    const scale = figureScale(d, fov, state.size.height);
    /* The person grows; the ground disc under them does not, because that disc
       is read from directly above where distance compensation would only make
       thirty of them overlap. */
    if (holder.current) holder.current.scale.setScalar(scale);
    /* Everything that rides ABOVE the head has to clear the head's new height,
       or the plate and the work-started pip end up inside the figure. */
    const crown = EMPLOYEE_HEIGHT * scale;

    if (rig && embodied) {
      /* Faces are the first thing to go: unreadable past a few tens of metres. */
      rig.face.visible = isNear;

      /*
       * One of three states is true at a time, and the mixer crossfades
       * between them by weight rather than stopping and restarting actions —
       * which is what makes standing up out of a chair a transition rather
       * than a cut.
       */
      const state3 = seatedNow ? "sit" : climbing ? "climb" : s.moving ? "walk" : "idle";
      for (const key of ["walk", "idle", "sit", "climb"] as const) {
        const action = rig.actions[key];
        action.setEffectiveWeight(
          THREE.MathUtils.damp(action.getEffectiveWeight(), key === state3 ? 1 : 0, 1 / FADE, delta),
        );
      }

      const groundSpeed = delta > 1e-5 ? moved / delta : 0;
      rig.actions.walk.timeScale = THREE.MathUtils.clamp(
        groundSpeed / WALK_CLIP_SPEED,
        0.4,
        MAX_GAIT_RATE,
      );
      /*
       * The climb is paced by ground covered too, so a figure taking the stair
       * at 60x lifts its knees faster instead of sliding up the flight. The
       * divisor is the climbing pace rather than the walking one, which is what
       * keeps one step of the clip to about one tread.
       */
      rig.actions.climb.timeScale = THREE.MathUtils.clamp(
        groundSpeed / (WALK_CLIP_SPEED * CLIMB_PACE_FRACTION),
        0.4,
        MAX_GAIT_RATE,
      );
      rig.mixer.update(delta);
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
      badge.current.position.y = crown + 0.62;
    }

    /*
     * The name plate rides above the marker on the same distance ramp, so it
     * stays about as big on screen from thirty metres as from two hundred, and
     * switches off past LOD_MID where it would only be clutter.
     */
    if (plate.current) {
      const followed = useCameraStore.getState().followId === employee.id;
      const highlighted = isSelected || hoveredId === employee.id || followed;
      const show = d < LABEL_RANGE || highlighted;
      plate.current.visible = show;
      if (show) {
        const plateScale = Math.min(LABEL_MAX_SCALE, Math.max(1, d * LABEL_SCALE_PER_METRE));
        plate.current.scale.setScalar(plateScale);
        plate.current.position.y =
          crown + 0.95 + plateScale * (0.62 + rung * LABEL_STAGGER_RISE * CHIP_H);
      }
    }
  });


  return (
    <group
      ref={root}
      visible={false}
      onClick={(e) => {
        e.stopPropagation();
        select(employee.id);
        focusOn(employee.id);
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
      <mesh
        ref={ring}
        geometry={GEO.ring}
        material={SELECT_RING}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.05, 0]}
        visible={false}
      />
      {/* Work has actually started, as distinct from having arrived. */}
      <mesh ref={badge} geometry={GEO.pip} material={WORKING} position={[0, EMPLOYEE_HEIGHT + 0.62, 0]} visible={false} />

      {/* Who this is, and when they checked in. Billboarded, so it reads from
          any angle the camera happens to be at. */}
      <Billboard ref={plate} visible={false}>
        <IdentityChip id={label.id} checkIn={label.checkIn} />
      </Billboard>

      {/* The rigged, skinned person. */}
      <group ref={holder} />
    </group>
  );
}

export function Employees() {
  /*
   * The ACTIVE roster — the built-in dataset until an upload swaps it. The
   * revision prefixes every key so a swap remounts each figure, restarting
   * its gait phase and eased heading rather than carrying them over between
   * rosters.
   */
  const employees = useActiveJourneyStore((s) => s.employees);
  const revision = useActiveJourneyStore((s) => s.revision);
  const figures = useMemo(
    () =>
      employees.map((e) => (
        <Figure key={`${revision}:${e.id}`} cacheKey={`${revision}:${e.id}`} employee={e} />
      )),
    [employees, revision],
  );

  /* A new roster retires the previous cast's rigs rather than leaking them. */
  useEffect(() => releaseCharactersExcept(`${revision}:`), [revision]);

  return <group>{figures}</group>;
}
