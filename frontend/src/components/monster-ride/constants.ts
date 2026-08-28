import { RIDE_SEAT_SCALE, loweredSeatMount } from "@/world/scale";
import { RIDE_PAINT } from "@/world/ridePaint";

/**
 * Dimensions and palette for the Monster Ride.
 *
 * Colours are sampled from the reference "Parkitect Mod - Monster Ride" by
 * SirMaverick34 (Sketchfab): a dark-brown timber tower topped by a glowing
 * golden faceted sphere, pale-gray arched arms lined with white bulbs, and
 * brown tub gondolas with gold trim bands and red accent lamps.
 *
 * The reference declares no licence, so this is an original recreation in
 * Three.js — no asset is copied.
 */
export const PALETTE = {
  /* The arches are painted, not bare timber — this is the park's green ride. */
  timber: RIDE_PAINT.monster.light,
  timberDark: RIDE_PAINT.monster.dark,
  gold: "#d4a12a",
  goldDark: "#9c7418",
  sphere: "#e8b93a",
  steel: RIDE_PAINT.monster.mid,
  steelDark: RIDE_PAINT.monster.dark,
  bulb: "#fff4d6",
  redLamp: "#e0342c",
  tub: RIDE_PAINT.monster.light,
  tubDark: RIDE_PAINT.monster.dark,
  seatFrame: "#3f3126",
  shirt: "#3b82f6",
  skin: "#f1c27d",
} as const;

/**
 * Five arms, four gondolas each, two seats per gondola = 40 seats.
 *
 * FORTY, DOWN FROM SIXTY, to meet the user's 30-40 capacity for every ride. The
 * arms, the gondolas and the spiders are untouched — same five, same four
 * apiece, same radii — and the reduction is taken inside the tub: a 1.55 m
 * gondola seats two facing outward across it with room between them, where
 * three at 120 degrees left the drawn seats overlapping once they were scaled
 * up for the people who sit in them.
 */
export const ARM_COUNT = 5;
export const GONDOLAS_PER_ARM = 4;
export const SEATS_PER_GONDOLA = 2;
export const SEAT_COUNT = ARM_COUNT * GONDOLAS_PER_ARM * SEATS_PER_GONDOLA;

/** Central structure.
 *
 * TALLER ON REQUEST. The tower and the height the arms hang from both grew;
 * the arms themselves did not, so the ride reaches further UP without reaching
 * further OUT. That distinction matters more than it looks: the park's rides
 * are packed to within a fraction of a degree of each other in the view from
 * the main gate, so a ride that grew in plan as well would start hiding its
 * neighbours. Growing the tower alone leaves every footprint, every ride's
 * position and every sightline exactly as they were — and it lifts the
 * gondolas, which is the other half of what was asked. */
export const TOWER_HEIGHT = 20;
export const TOWER_RADIUS = 1.8;
export const SPHERE_RADIUS = 2.1;
export const BASE_RADIUS = 5.2;
export const BASE_HEIGHT = 1.1;

/** Arms: attach near the top of the tower and arch out and down. */
export const ARM_ATTACH_HEIGHT = 15;
export const ARM_LENGTH = 14.5;
export const ARCH_RISE = 4.2;
export const ARM_END_DROP = 5.6;
export const ARM_BULBS = 15;

/** Spider carrying the gondolas at the end of each arm. */
export const SPIDER_RADIUS = 4.3;
export const GONDOLA_RADIUS = 1.55;
export const GONDOLA_HEIGHT = 1.25;

/**
 * WHERE A RIDER ACTUALLY SITS IN A TUB, and the one place that decides it.
 *
 * `Gondola.tsx` draws the seat and `rideKinematics.ts` places the employee in
 * it; both read these, so the pan that is drawn is the pan that is sat on.
 *
 * SEAT_SURFACE_Y is the top of the pan, lowered by SEAT_LOWER_FRACTION of its
 * rise above the tub's own floor — the 10-15% the user asked for, taken out of
 * the seat and not out of the ride. The tower, the arms, the spiders and the
 * ride's motion are all unchanged.
 */
/** Top of the tub's floor disc, in the gondola's own frame. */
const TUB_FLOOR_Y = -GONDOLA_HEIGHT / 2 + 0.12;
/** Pan centre -0.28 plus half its 0.12 depth, in the seat's unscaled frame. */
export const SEAT_PAN_TOP_LOCAL = -0.22;
/** Where the seat group used to hang inside the tub. */
const SEAT_MOUNT_ORIGINAL = GONDOLA_HEIGHT * 0.22;
const SEAT_RISE = SEAT_MOUNT_ORIGINAL + SEAT_PAN_TOP_LOCAL * RIDE_SEAT_SCALE - TUB_FLOOR_Y;
export const SEAT_SURFACE_Y = TUB_FLOOR_Y + loweredSeatMount(SEAT_RISE);
/** Where the seat GROUP is mounted so its pan top lands on SEAT_SURFACE_Y. */
export const SEAT_MOUNT_Y = SEAT_SURFACE_Y - SEAT_PAN_TOP_LOCAL * RIDE_SEAT_SCALE;

/** Motion (radians per second / cycle rates). */
export const HUB_SPIN = 0.22;
export const SPIDER_SPIN = 0.55;
export const UNDULATION_RATE = 0.85;

/**
 * HOW HIGH A TUB MUST RIDE ABOVE THE GROUND, and the swing that follows from it.
 *
 * The tubs used to bottom out 0.94u above the ground — 3 world units once the
 * park's scale is applied, which is under a metre and a half on a ride that is
 * forty metres tall. At that gap a tub reads as sitting IN the grass rather
 * than riding over it, and it does so from every angle a visitor sees the ride
 * from. The clearance is therefore no longer a safety epsilon; it is a
 * SIGHTLINE requirement, and it is written in the unit that decides whether the
 * eye sees daylight under a tub: the height of the people who ride it.
 *
 * The arm's tilt oscillates in [CENTER - SWING, CENTER + SWING], and the swing
 * is unchanged at +/-13deg — the wave has the same shape and size it always
 * had. What moves is the CENTRE, which is now solved rather than typed: it is
 * placed exactly high enough that the bottom of the lowest tub, at the bottom
 * of the wave, clears the ground by MIN_GROUND_CLEARANCE. Change the arm
 * length, the arch's end drop, the hub height or the clearance itself, and the
 * centre follows on its own.
 */
export const UNDULATION_SWING = (13 * Math.PI) / 180;

/**
 * Minimum gap between the lowest point of a tub and the ground, in the ride's
 * own units. 2.4u is 7.6 world units, which is 2.2 times the height of an
 * employee standing under it — an unmistakable band of daylight rather than a
 * gap you have to look for.
 */
export const MIN_GROUND_CLEARANCE = 3.5;

/**
 * THE LOWEST POINT OF A GONDOLA, taken over every part that hangs off it.
 *
 * Not just the tub's floor. This used to be assumed to BE the floor, and the
 * assumption was wrong: the two gold trim bands are toruses, and an unrotated
 * torus stands on edge, so each tub carried a 1.55u ring hanging 1.5u below it.
 * The clearance solved from the floor was therefore a clearance the ride did
 * not have, and the rings ploughed through the grass. The bands lie flat now
 * (see Gondola.tsx), but the model no longer takes anyone's word for which part
 * is lowest — it takes the minimum over all of them.
 */
export const GONDOLA_LOWEST_LOCAL = Math.min(
  /* Tub shell and floor disc. */
  -GONDOLA_HEIGHT / 2,
  /* Lower gold trim band, lying flat: its centre line less the tube radius. */
  -GONDOLA_HEIGHT / 2 + 0.12 - 0.09,
  /* Frame under the seat pan, in the seat group's own scaled frame. */
  SEAT_MOUNT_Y - (0.36 + 0.03) * RIDE_SEAT_SCALE,
);

/** Fixed drop from the arm's tip to the lowest point of a gondola.
 *
 * The spider counter-rotates to cancel the arm's tilt exactly, so this really
 * is constant: the two rotations multiply out to the identity for everything
 * hanging below the spider's hub, whatever the tilt or the spider's own spin.
 * Mirrors Arm.tsx's -1.85 spider offset. */
export const TIP_TO_TUB_BOTTOM = 1.85 - GONDOLA_LOWEST_LOCAL;

/**
 * The lowest tilt at which a tub still clears the ground, in closed form.
 *
 * The tub's underside sits at
 *   y(t) = BASE_HEIGHT + ARM_ATTACH_HEIGHT + ARM_LENGTH*sin t - ARM_END_DROP*cos t
 *          - TIP_TO_TUB_BOTTOM
 * and A*sin t + B*cos t = R*sin(t + phi), so solving y(t) = MIN_GROUND_CLEARANCE
 * is a single arcsine rather than a search. y is increasing in t across the
 * whole operating range (its derivative only turns negative past about -69deg),
 * so this root is the one and only boundary.
 *
 * `groundClearance.ts` re-derives the same bound against sampled terrain, and
 * `verify-monster-ride.ts` asserts the two agree.
 */
const SAFE_MIN_TILT = (() => {
  const A = ARM_LENGTH;
  const B = -ARM_END_DROP;
  const R = Math.hypot(A, B);
  const phi = Math.atan2(B, A);
  const constant = BASE_HEIGHT + ARM_ATTACH_HEIGHT - TIP_TO_TUB_BOTTOM;
  const k = Math.max(-1, Math.min(1, (MIN_GROUND_CLEARANCE - constant) / R));
  return Math.asin(k) - phi;
})();

/**
 * The wave's own centre, as the ride was designed: the downswing is the one a
 * real arm ride constrains, so the excursion is deliberately larger upward
 * than downward.
 */
const DESIGN_CENTER_TILT = (7 * Math.PI) / 180;

/**
 * The clearance is a FLOOR, not a target.
 *
 * Taking the maximum, not the bound itself, is the whole point. Solved as a
 * target, a ride with plenty of headroom would drop its wave until it used the
 * headroom up — the taller the tower, the more the arms would droop. Taken as a
 * floor, the wave keeps the shape it was designed with whenever there is room
 * for it, and only ever rides higher than designed when the ground forces it.
 */
export const UNDULATION_CENTER_TILT = Math.max(
  DESIGN_CENTER_TILT,
  SAFE_MIN_TILT + UNDULATION_SWING,
);

/** Where the ride sits relative to the Ferris Wheel at the park origin. */
export const MONSTER_ORIGIN: [number, number, number] = [8, 0, 50];

/** Overall horizontal reach, used for clearance checks against other rides. */
export const RIDE_REACH = ARM_LENGTH + SPIDER_RADIUS + GONDOLA_RADIUS;
