import { Euler, Matrix4, Quaternion, Vector3 } from "three";
import type { DepartmentRideId } from "@/components/park/departments";
import { offsetFor, rideScale } from "@/components/park/layout";
import { EMPLOYEE_HEIGHT } from "@/world/scale";

/* --- Ferris Wheel --------------------------------------------------- */
import { ANGLE_STEP as FERRIS_ANGLE_STEP, CABIN_RADIUS } from "@/components/ferris-wheel/cabinManifest";
import {
  CABIN_COUNT,
  CABIN_HANG,
  CABIN_HEIGHT,
  ROTATION_SPEED as FERRIS_ROTATION_SPEED,
  WHEEL_CENTER_HEIGHT,
} from "@/components/ferris-wheel/constants";

/* --- Roller Coaster ------------------------------------------------- */
import {
  CAR_SPACING,
  COASTER_ORIGIN,
  SEAT_SURFACE_Y as COASTER_SEAT_Y,
  TRAIN_SPEED,
} from "@/components/roller-coaster/constants";
import { TRACK_LENGTH } from "@/components/roller-coaster/trackCurve";
import { carTransform, createCarTransform } from "@/components/roller-coaster/trainKinematics";
import { SEATS as COASTER_SEATS } from "@/components/roller-coaster/seatManifest";

/* --- Monster Ride --------------------------------------------------- */
import {
  ARM_ATTACH_HEIGHT,
  ARM_COUNT as MONSTER_ARM_COUNT,
  ARM_END_DROP,
  ARM_LENGTH as MONSTER_ARM_LENGTH,
  BASE_HEIGHT as MONSTER_BASE_HEIGHT,
  GONDOLAS_PER_ARM,
  GONDOLA_RADIUS,
  HUB_SPIN,
  MONSTER_ORIGIN,
  SEATS_PER_GONDOLA,
  SEAT_SURFACE_Y as MONSTER_SEAT_Y,
  SPIDER_RADIUS,
  SPIDER_SPIN,
  UNDULATION_CENTER_TILT,
  UNDULATION_RATE,
  UNDULATION_SWING,
} from "@/components/monster-ride/constants";
import { clampTiltForGroundClearance } from "@/components/monster-ride/groundClearance";
import { RIDERS as MONSTER_RIDERS } from "@/components/monster-ride/riders";

/* --- Dragon Swing Ship ---------------------------------------------- */
import {
  ARM_LENGTH as DRAGON_ARM_LENGTH,
  DRAGON_ORIGIN,
  DRAGON_YAW,
  PIVOT_Y,
  ROW_SPACING,
  SEATS_PER_ROW,
  SEAT_ROWS,
  SEAT_SPACING,
  SEAT_SURFACE_Y as DRAGON_SEAT_Y,
  SWING_PERIOD,
} from "@/components/dragon-ride/constants";
import { swingAngle } from "@/components/dragon-ride/swingKinematics";
import { DRAGON_RIDERS } from "@/components/dragon-ride/riders";

/* --- Drop Tower ----------------------------------------------------- */
import {
  RIDE_CYCLE_SECONDS as TOWER_CYCLE_SECONDS,
  SEAT_ANGLE_STEP,
  SEAT_COUNT as TOWER_SEAT_COUNT,
  SEAT_RING_R,
  SEAT_SURFACE_Y as TOWER_SEAT_Y,
  TOWER_ORIGIN,
} from "@/components/drop-tower/constants";
import { gondolaY, structuralShake } from "@/components/drop-tower/dropKinematics";

/**
 * WHERE EVERY RIDE'S SEATS ARE, AT ANY POINT OF THAT RIDE'S OWN ANIMATION.
 *
 * The boarding system needs two things the park has never had to state out
 * loud: the world position of an individual seat while the ride is moving —
 * so a seated employee can travel with it instead of standing on the ground
 * while the machine leaves without them — and the pose each ride comes to rest
 * in, so employees board a stopped ride rather than a moving one.
 *
 * NOTHING IS RE-DESIGNED HERE. Every transform below mirrors, matrix for
 * matrix, the group hierarchy the ride's own component already renders, and
 * every number is imported from that ride's own constants. This module is a
 * READER of the existing geometry, not a second copy of it: if a ride's arm
 * length or seat ring changes, these follow, and `scripts/verify-boarding.ts`
 * re-derives the whole thing against the real modules.
 *
 * THE ONE MOTION NUMBER THAT MOVES is the Monster Ride's arm-wave rate — see
 * `MONSTER_UNDULATION_RATE`. A ride that has to stop has to stop SOMEWHERE,
 * and the only pose it may stop in is the one its seats are boardable from.
 *
 * EVERY SEAT HEIGHT NOW COMES FROM THE RIDE ITSELF. Each ride publishes a
 * `SEAT_SURFACE_Y` (the Ferris Wheel a `CABIN_HANG`) that its own component
 * draws from, and this module reads exactly that constant. It used to re-derive
 * the height here instead, and the two disagreed: the drawn seat is scaled by
 * RIDE_SEAT_SCALE for the people who sit in it and the copy here was not, so a
 * rider was placed a seat pan's worth away from the pan they were meant to be
 * on. There is now one number per ride and both sides read it, which is also
 * what makes the 12.5% seat lowering land on the figure as well as on the seat.
 */

/* ------------------------------------------------------------------ */
/* Small matrix helpers, so a transform chain reads like the JSX does. */
/* ------------------------------------------------------------------ */

/*
 * A POOL, NOT A STREAM OF ALLOCATIONS.
 *
 * A seat transform is a chain of eight to twelve matrices, and it is asked for
 * on every frame of every ride and tens of thousands of times over while the
 * boarding stairs are being solved. Allocating a fresh Matrix4 per link cost
 * about fourteen microseconds a call and put a second and a half of garbage
 * collection into the page's first paint.
 *
 * The links are therefore taken from a pool that is rewound at the start of
 * each transform. `seatPose` is the only entry point and it is not re-entrant,
 * so a chain can never be interrupted by another one.
 */
const POOL: Matrix4[] = Array.from({ length: 24 }, () => new Matrix4());
let poolAt = 0;
function take(): Matrix4 {
  const m = POOL[poolAt++];
  if (!m) throw new Error("Seat transform chain is longer than the matrix pool.");
  return m;
}

function T(x: number, y: number, z: number): Matrix4 {
  return take().makeTranslation(x, y, z);
}
function Rx(a: number): Matrix4 {
  return take().makeRotationX(a);
}
function Ry(a: number): Matrix4 {
  return take().makeRotationY(a);
}
function Rz(a: number): Matrix4 {
  return take().makeRotationZ(a);
}
function S(s: number): Matrix4 {
  return take().makeScale(s, s, s);
}
/** Left-to-right composition: `chain(A, B, C)` is the JSX nesting A > B > C. */
function chain(...ms: Matrix4[]): Matrix4 {
  const out = take().identity();
  for (const m of ms) out.multiply(m);
  return out;
}

/**
 * The layout translation and the scale the scene wraps a ride in.
 *
 * Each ride now has its OWN factor — see `RIDE_SCALE` in the park layout — so
 * every seat transform, every boarding stair and every rider position follows a
 * ride's size automatically. Nothing here has to know what that size is.
 */
function parkPlacement(id: DepartmentRideId): Matrix4[] {
  const o = offsetFor(id);
  return [T(o[0], o[1], o[2]), S(rideScale(id))];
}

export interface SeatPose {
  x: number;
  y: number;
  z: number;
  /** Heading, matching the convention the walking figures already use. */
  yaw: number;
  pitch: number;
  roll: number;
}

const _p = new Vector3();
const _q = new Quaternion();
const _s = new Vector3();
const _e = new Euler();

/**
 * World pose of a seat. Rotation is read back in YXZ order, which is the order
 * a figure is turned in: yaw first, then the tilt the ride imposes on it.
 */
function poseOf(m: Matrix4): SeatPose {
  m.decompose(_p, _q, _s);
  _e.setFromQuaternion(_q, "YXZ");
  return { x: _p.x, y: _p.y, z: _p.z, yaw: _e.y, pitch: _e.x, roll: _e.z };
}

/* ------------------------------------------------------------------ */
/* Ferris Wheel                                                        */
/* ------------------------------------------------------------------ */

/**
 * Floor of a cabin, relative to its rim mount. The cabin body hangs
 * CABIN_HANG + CABIN_HEIGHT/2 below the mount and is CABIN_HEIGHT deep, so its
 * floor pan is one further half-height down.
 *
 * CABIN_HANG, not ARM_LENGTH: the cabins were lowered on their yokes by the
 * park-wide seat lowering, and `Cabin.tsx` draws them from the same constant,
 * so the floor a rider is placed on is the floor that is drawn.
 */
const FERRIS_FLOOR_Y = -CABIN_HANG - CABIN_HEIGHT + 0.06;

function ferrisSeat(index: number, t: number): Matrix4 {
  const spin = FERRIS_ROTATION_SPEED * t;
  const theta = index * FERRIS_ANGLE_STEP;
  return chain(
    ...parkPlacement("ferris"),
    T(0, WHEEL_CENTER_HEIGHT, 0),
    // The rotor: the only thing that turns.
    Rz(spin),
    T(CABIN_RADIUS * Math.cos(theta), CABIN_RADIUS * Math.sin(theta), 0),
    // The pivot inside each mount cancels the rotor, keeping cabins upright.
    Rz(-spin),
    T(0, FERRIS_FLOOR_Y, 0),
  );
}

/* ------------------------------------------------------------------ */
/* Roller Coaster                                                      */
/* ------------------------------------------------------------------ */

/** Seat block inside a car — Car.tsx's own 2x2 placement. */
const COASTER_SEAT_X = 0.42;
const COASTER_ROW_Z = 0.44;

const _car = createCarTransform();
const _carM = new Matrix4();
const _one = new Vector3(1, 1, 1);

function coasterSeat(index: number, t: number): Matrix4 {
  const seat = COASTER_SEATS[index];
  const progress = ((TRAIN_SPEED * t) % 1 + 1) % 1;
  const spacingU = CAR_SPACING / TRACK_LENGTH;
  carTransform(progress - seat.car * spacingU, _car);
  _carM.compose(_car.position, _car.quaternion, _one);

  return chain(
    ...parkPlacement("coaster"),
    T(COASTER_ORIGIN[0], COASTER_ORIGIN[1], COASTER_ORIGIN[2]),
    take().copy(_carM),
    T(seat.side * COASTER_SEAT_X, COASTER_SEAT_Y, (seat.row === 0 ? 1 : -1) * COASTER_ROW_Z),
  );
}

/* ------------------------------------------------------------------ */
/* Monster Ride                                                        */
/* ------------------------------------------------------------------ */

/**
 * THE ARM-WAVE RATE, NUDGED SO THE RIDE CAN COME TO REST.
 *
 * The Monster Ride runs three motions off one clock: the hub at HUB_SPIN, the
 * spiders at SPIDER_SPIN and the arm wave at UNDULATION_RATE. For the ride to
 * stop in the pose it started in — which is the whole of "seats reach the
 * boarding position" — all three have to come home together, and 0.22 / 0.55 /
 * 0.85 rad/s only do that after 628 seconds, four times longer than a ride
 * cycle.
 *
 * Two of the three already work out. Over one hub revolution the spider turns
 * 2.5 times, and a spider carries four gondolas, so a half turn puts an
 * identical gondola in every place — the pose repeats exactly. Only the arm
 * wave misses, by 0.136 of a cycle.
 *
 * So the wave is rounded to the nearest rate that DOES divide the hub
 * revolution: 0.88 rad/s instead of 0.85, three and a half percent faster and
 * indistinguishable by eye. The wave's shape, centre, swing and phase offsets
 * are untouched; only the tempo moves, and only so that the ride has a rest
 * pose to stop in.
 */
export const MONSTER_UNDULATION_RATE =
  Math.round(UNDULATION_RATE / HUB_SPIN) * HUB_SPIN;

/**
 * How many hub revolutions the ride needs before EVERY seat is back where it
 * started — not merely before the ride looks the same.
 *
 * The spider turns two and a half times per hub revolution. After one
 * revolution the gondolas are all back at gondola positions, so the machine is
 * visually identical, but each individual gondola has swapped places with the
 * one opposite — and a seat carrying an employee has to come back to ITS own
 * place, not to an equivalent one. Two hub revolutions is the first point at
 * which the spider has turned a whole number of times as well.
 *
 * Solved rather than typed, so a change to any of the three rates is picked up.
 */
const MONSTER_HUB_TURNS = (() => {
  const whole = (v: number) => Math.abs(v - Math.round(v)) < 1e-9;
  for (let k = 1; k <= 64; k++) {
    if (whole((k * SPIDER_SPIN) / HUB_SPIN) && whole((k * MONSTER_UNDULATION_RATE) / HUB_SPIN)) {
      return k;
    }
  }
  throw new Error("The Monster Ride's three motions never come back together.");
})();

/** Tip of the arch — the last control point of Arm.tsx's ARCH_CURVE. */
const MONSTER_ARM_TIP: [number, number, number] = [MONSTER_ARM_LENGTH, -ARM_END_DROP, 0];

/**
 * One arm's tilt at ride-animation time `t`, including the ground-clearance
 * clamp. Exported so `MonsterRide.tsx` drives its arms from this and the seat
 * transforms below can never disagree with what is drawn.
 */
export function monsterArmTilt(armIndex: number, t: number): number {
  const placement = (armIndex / MONSTER_ARM_COUNT) * Math.PI * 2;
  const raw =
    UNDULATION_CENTER_TILT +
    Math.sin(t * MONSTER_UNDULATION_RATE + placement) * UNDULATION_SWING;

  const worldAngle = HUB_SPIN * t + placement;
  const armWorldX = MONSTER_ORIGIN[0] + Math.cos(worldAngle) * MONSTER_ARM_LENGTH;
  const armWorldZ = MONSTER_ORIGIN[2] + Math.sin(worldAngle) * MONSTER_ARM_LENGTH;
  return clampTiltForGroundClearance(raw, armWorldX, armWorldZ);
}

function monsterSeat(index: number, t: number): Matrix4 {
  const rider = MONSTER_RIDERS[index];
  const placement = (rider.arm / MONSTER_ARM_COUNT) * Math.PI * 2;
  const tilt = monsterArmTilt(rider.arm, t);
  const gondolaAngle = (rider.gondola / GONDOLAS_PER_ARM) * Math.PI * 2;
  const seatAngle = (rider.seat / SEATS_PER_GONDOLA) * Math.PI * 2 - Math.PI / 2;
  const seatRadius = GONDOLA_RADIUS * 0.44;

  return chain(
    ...parkPlacement("monster"),
    T(MONSTER_ORIGIN[0], MONSTER_ORIGIN[1], MONSTER_ORIGIN[2]),
    // The rotor carrying all five arms.
    T(0, MONSTER_BASE_HEIGHT + ARM_ATTACH_HEIGHT, 0),
    Ry(HUB_SPIN * t),
    // This arm's place on the hub, then its own tilt.
    Ry(placement),
    Rz(tilt),
    // Out to the tip of the arch, where the spider is counter-tilted level.
    T(MONSTER_ARM_TIP[0], MONSTER_ARM_TIP[1], MONSTER_ARM_TIP[2]),
    Rz(-tilt),
    Ry(SPIDER_SPIN * t),
    // The gondola hanging below its spoke.
    T(Math.cos(gondolaAngle) * SPIDER_RADIUS, -1.85, Math.sin(gondolaAngle) * SPIDER_RADIUS),
    Ry(-gondolaAngle),
    // The seat inside the tub, facing outward, at the height Gondola.tsx draws it.
    T(
      Math.cos(seatAngle) * seatRadius,
      MONSTER_SEAT_Y,
      Math.sin(seatAngle) * seatRadius,
    ),
    Ry(-seatAngle + Math.PI / 2),
  );
}

/* ------------------------------------------------------------------ */
/* Dragon Swing Ship                                                   */
/* ------------------------------------------------------------------ */

/** Ship.tsx's own seat grid and deck plane. */
const DRAGON_SEAT_X = Array.from(
  { length: SEATS_PER_ROW },
  (_, c) => (c - (SEATS_PER_ROW - 1) / 2) * SEAT_SPACING,
);
const DRAGON_SEAT_Z = Array.from(
  { length: SEAT_ROWS },
  (_, r) => (r - (SEAT_ROWS - 1) / 2) * ROW_SPACING,
);

function dragonSeat(index: number, t: number): Matrix4 {
  const rider = DRAGON_RIDERS[index];
  return chain(
    ...parkPlacement("dragon"),
    T(DRAGON_ORIGIN[0], DRAGON_ORIGIN[1], DRAGON_ORIGIN[2]),
    Ry(DRAGON_YAW),
    // The swing pivot: the one thing the ride animates.
    T(0, PIVOT_Y, 0),
    Rx(swingAngle(t)),
    // Down the arm to the hull, then to this seat on the open deck.
    T(0, -DRAGON_ARM_LENGTH, 0),
    T(DRAGON_SEAT_X[rider.col], DRAGON_SEAT_Y, DRAGON_SEAT_Z[rider.row]),
  );
}

/* ------------------------------------------------------------------ */
/* Drop Tower                                                          */
/* ------------------------------------------------------------------ */

function towerSeat(index: number, t: number): Matrix4 {
  return chain(
    // The Drop Tower is the one ride outside the scaled group.
    T(TOWER_ORIGIN[0], TOWER_ORIGIN[1], TOWER_ORIGIN[2]),
    T(structuralShake(t), gondolaY(t), 0),
    Ry(index * SEAT_ANGLE_STEP),
    T(0, TOWER_SEAT_Y, SEAT_RING_R),
  );
}

/* ------------------------------------------------------------------ */
/* The rides, as one table                                             */
/* ------------------------------------------------------------------ */

interface RideKinematics {
  seatCount: number;
  seat: (index: number, t: number) => Matrix4;
  /**
   * How long the ride takes to return to the pose it started in. Every seat
   * transform above is periodic in `t` at this interval, which is what lets a
   * running ride be brought to rest with its seats back at the platform.
   */
  period: number;
}

const RIDES: Record<DepartmentRideId, RideKinematics> = {
  ferris: {
    seatCount: CABIN_COUNT,
    seat: ferrisSeat,
    // One full revolution of the wheel.
    period: (Math.PI * 2) / FERRIS_ROTATION_SPEED,
  },
  coaster: {
    seatCount: COASTER_SEATS.length,
    seat: coasterSeat,
    // One lap of the circuit.
    period: 1 / TRAIN_SPEED,
  },
  monster: {
    seatCount: MONSTER_RIDERS.length,
    seat: monsterSeat,
    // Two hub revolutions — see MONSTER_HUB_TURNS.
    period: (MONSTER_HUB_TURNS * Math.PI * 2) / HUB_SPIN,
  },
  dragon: {
    seatCount: DRAGON_RIDERS.length,
    seat: dragonSeat,
    /*
     * Half a swing period. The ship's pose depends only on its angle, and the
     * angle is exactly zero — level, at the bottom of the arc, which is the
     * boarding position — every half period, whatever the motor's amplitude
     * envelope happens to be doing.
     */
    period: SWING_PERIOD / 2,
  },
  tower: {
    seatCount: TOWER_SEAT_COUNT,
    seat: towerSeat,
    // One dwell-lift-hold-fall-brake-settle machine cycle.
    period: TOWER_CYCLE_SECONDS,
  },
};

export const DEPARTMENT_RIDE_IDS = Object.keys(RIDES) as DepartmentRideId[];

export function rideSeatCount(rideId: DepartmentRideId): number {
  return RIDES[rideId].seatCount;
}

/** How long this ride takes to come back to the pose it rests in. */
export function ridePeriodSeconds(rideId: DepartmentRideId): number {
  return RIDES[rideId].period;
}

/** World pose of one seat at ride-animation time `t`, in seconds. */
export function seatPose(rideId: DepartmentRideId, seatIndex: number, t: number): SeatPose {
  poolAt = 0;
  return poseOf(RIDES[rideId].seat(seatIndex, t));
}

/* ------------------------------------------------------------------ */
/* The boarding pose, and which seats can be reached from it           */
/* ------------------------------------------------------------------ */

/**
 * How far above the lowest seat a seat may still be and count as boardable, in
 * world units. Roughly the height of the employees themselves — a step up into
 * a car, not a climb.
 */
export const BOARD_REACH = EMPLOYEE_HEIGHT;

/**
 * How many seats one boarding deck is built to present.
 *
 * A CEILING, NEVER A FLOOR: one employee is enough to board and enough to send
 * a ride away. This is how many people can be got aboard before the deck runs
 * out of seats within a stride of it, and it is at least the size of the
 * largest department so that everybody who turns up for a ride can be seated.
 *
 * It lives here rather than in `boardingStair.ts`, where it used to, because
 * `solveBoardingSeats` below now has to know it: a deck that must serve ten
 * seats has to be allowed to reach ten seats.
 */
export const PLATFORM_SEATS = 10;

/**
 * The seats an employee can get into while the ride stands at rest, lowest
 * first.
 *
 * A stopped ride presents only part of its seating at platform level: a Ferris
 * wheel offers the cabins around the bottom of its rim, a coaster offers the
 * cars standing in its station. The ride's sixty seats and its sixty-seat
 * capacity are unchanged — this is which of them a person can physically climb
 * into without the machine moving first, derived from the same geometry the
 * ride is drawn with rather than declared.
 */
function solveBoardingSeats(rideId: DepartmentRideId): number[] {
  const heights = Array.from({ length: RIDES[rideId].seatCount }, (_, i) => ({
    i,
    y: seatPose(rideId, i, 0).y,
  })).sort((a, b) => a.y - b.y || a.i - b.i);
  const lowest = heights[0].y;

  /*
   * TWICE the step-up, because the step is taken from the DECK and the deck is
   * built at the mean height of the seats it serves — see `deckSeats` in
   * boardingStair.ts. A seat 2 x BOARD_REACH above the lowest is only
   * BOARD_REACH above a deck sitting halfway between them, which is one step,
   * not two. Measuring the window from the lowest SEAT instead understated
   * every ride's reachable seating by half.
   */
  const step = 2 * BOARD_REACH;

  /*
   * ...AND NEVER LESS THAN THE PLATFORM IS BUILT FOR.
   *
   * A step-up alone is a rule about a person; how much seating a stopped ride
   * presents is a fact about the machine, and on a Ferris Wheel the rim curves
   * away from the platform so fast that the two disagree. With the cast resized
   * to 3.4 m the step-up window fell to 6.8 m, which reached nine of the
   * wheel's cabins — one short of the ten-person department that boards there,
   * so an employee arrived at their ride and was never given a seat.
   *
   * The deck is built to serve PLATFORM_SEATS seats. So the window is whatever
   * it takes to reach that many, and the step-up is the FLOOR rather than the
   * answer: a ride whose seats all stand at one height still offers every one
   * of them, and a ride whose seats climb away offers exactly the ten its
   * platform exists to serve. Solved from the ride's own geometry rather than
   * typed, so it follows any change to a seat ring or a car.
   */
  const served = heights[Math.min(PLATFORM_SEATS, heights.length) - 1].y - lowest;
  const window = Math.max(step, served);

  return heights.filter((h) => h.y <= lowest + window + 1e-9).map((h) => h.i);
}

const BOARDING_SEATS: Record<DepartmentRideId, number[]> = Object.fromEntries(
  DEPARTMENT_RIDE_IDS.map((id) => [id, solveBoardingSeats(id)]),
) as Record<DepartmentRideId, number[]>;

/** The seats at platform level when this ride is stopped, lowest first. */
export function boardingSeats(rideId: DepartmentRideId): number[] {
  return BOARDING_SEATS[rideId];
}

/**
 * How many people one dispatch of this ride can take on.
 *
 * Never more than the ride's own capacity, and never more than the seats that
 * are actually at the platform while it is stopped.
 */
export function boardingCapacity(rideId: DepartmentRideId, rideCapacity: number): number {
  return Math.min(rideCapacity, BOARDING_SEATS[rideId].length);
}

/* ------------------------------------------------------------------ */
/* Turning a run into ride-animation time                              */
/* ------------------------------------------------------------------ */

/** Zero velocity at both ends, so a ride winds up and eases to a stop. */
function smoothstep(p: number): number {
  const x = p < 0 ? 0 : p > 1 ? 1 : p;
  return x * x * (3 - 2 * x);
}

/**
 * How many whole rest-to-rest loops a ride turns during one run, and therefore
 * how many seconds of its own animation the run contains.
 *
 * Chosen as whatever whole number of loops comes closest to running the ride at
 * its authored tempo for the length of a dispatch, so no ride visibly speeds up
 * or slows down — the largest departure across the five is under five percent —
 * while every one of them ends its run in the pose it began it in.
 */
export function rideAnimationSpan(rideId: DepartmentRideId, runSeconds: number): number {
  const period = RIDES[rideId].period;
  const loops = Math.max(1, Math.round(runSeconds / period));
  return loops * period;
}

/**
 * The ride's own animation clock during a run, given how far through it is.
 *
 * `progress` is 0 at the moment the ride is released and 1 at the moment it is
 * back at rest. Outside a run the answer is 0, which by construction is the
 * pose the ride rests in.
 */
export function runAnimationSeconds(
  rideId: DepartmentRideId,
  progress: number,
  runSeconds: number,
): number {
  return rideAnimationSpan(rideId, runSeconds) * smoothstep(progress);
}
