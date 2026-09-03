import { HUMAN, METRE as WORLD_METRE, PROP } from "@/world/scale";
import { RIDE_PAINT } from "@/world/ridePaint";
import { UNIFORM_RIDE_HEIGHT } from "@/components/park/uniformRideHeight";

/**
 * EVERY RIDE IN THE PARK IS NOW THE SAME SIZE, and this is how this one gets
 * there.
 *
 * The machine below was authored at 66.2 m. The park's common height is the
 * Risk ride's, so this ride is multiplied by one factor on every axis — and
 * the multiplication is done ONCE, here, by redefining what a metre means
 * inside this file. Every dimension on the page is written as so many metres,
 * so scaling the unit scales the whole machine and nothing can be missed.
 *
 * IT ALSO KEEPS THE PHYSICS HONEST, which a group scale in the scene would
 * not. A pendulum's period goes as the square root of its length, and the
 * previous note on this file said exactly that: stretching the model without
 * touching pendulum.ts would leave a long arm swinging at a short arm's rate.
 * Because ARM_LENGTH is scaled here, `pendulum.ts` re-derives the swing from
 * the arm the ride actually has, and the machine still obeys the energy
 * equation it was built from.
 *
 * WHAT DOES NOT SCALE is anything measured from a PERSON — seat widths, back
 * heights, the harness. Riders are 3.4 m tall whatever ride they are on, so
 * their seats stay the size they are everywhere else in the park.
 *
 * THE HEIGHT IS NOT ALL SCALED, which is why the factor is solved rather than
 * divided. This ride parks its seats at a fixed, people-high 4.2 m so that one
 * flight of the park's own stairs reaches them, and everything above that —
 * the seat's drop from the rim, the arm, the frame head — is the machine and
 * scales. So the overall height is `PARKED_SEAT + scale * MACHINE`, and the
 * factor that lands it exactly on the park's common height falls out of that.
 *
 * The two authored figures are frozen rather than derived, because the scale
 * has to be known before the dimensions it multiplies; `validateUfoPendulum()`
 * asserts the ride actually lands on the common height, so a wrong figure here
 * fails loudly instead of quietly making this ride the odd one out.
 */
const AUTHORED_PARKED_SEAT_Y = 4.2;
const AUTHORED_MACHINE_HEIGHT = 61.9;
export const RIDE_UNIFORM_SCALE =
  (UNIFORM_RIDE_HEIGHT - AUTHORED_PARKED_SEAT_Y) / AUTHORED_MACHINE_HEIGHT;
const METRE = WORLD_METRE * RIDE_UNIFORM_SCALE;

/**
 * THE UFO PENDULUM — a flying-saucer gondola on a swinging arm.
 *
 * A recreation of the machine in the Sketchfab model "UFO Pendulum Flat Ride"
 * by msizz88 (Creative Commons Attribution). Nothing is imported from it: like
 * every other ride in this park, and like the author's own model — built, they
 * say, from "primitive shapes and edit poly only" — this is an original build
 * in code to the same machine.
 *
 * THE MACHINE. Two painted A-frames carry one bearing. A long arm hangs from
 * that bearing, and on the end of the arm rides a flying saucer with
 * twenty-four seats around its rim, facing outward. The saucer spins about its
 * own axis while the arm swings, so a rider is carried through a compound path
 * that never quite repeats — the two periods are deliberately incommensurate.
 *
 * THE BRIEF, AND WHERE EACH PART OF IT LIVES:
 *
 *   "should be bigg"     → a 39 m arm and a 29 m saucer, swung 140 degrees:
 *                          82 m of arc carrying its riders 99.9 m up, well
 *                          past the bearing they hang from. With the Drop
 *                          Tower gone this is the tallest ride in the park,
 *                          and it is very nearly as wide as it is tall.
 *   "more colourful"     → PALETTE and the two colour runs below. Paint on the
 *                          material, not light: the saucer's skirt is dealt
 *                          seven liveries and its seats five more, so the ride
 *                          reads as colour at noon and not only at dusk.
 *   "should be in motion"→ pendulum.ts solves the swing as a REAL pendulum
 *                          rather than a sine wave, and the saucer spins on
 *                          top of it. Both are asserted by simulation in
 *                          verify-ufo-pendulum.ts.
 *   "instead of the
 *    tower ride"         → placement.ts. This ride REPLACED the Drop Tower: it
 *                          stands on the tower's plot, carries the tower's
 *                          department, and the tower is gone. It was first
 *                          built on the roomiest empty ground the park had,
 *                          and was moved here when the swap was asked for.
 *
 * IT IS A DEPARTMENT RIDE. It took the Drop Tower's place in the park layout,
 * which means it took the tower's job too: Data Engineering walks here, queues,
 * climbs the boarding deck and sits in the saucer. The park still has five
 * department rides and nobody was left without a destination.
 *
 * The park still has FIVE boxes in the layout solver — this one replaced the
 * tower's rather than being added beside it — so the other four rides did not
 * move, were not resized and were not re-solved.
 */

/* ------------------------------------------------------------------ *
 * NAME AND COUNT
 * ------------------------------------------------------------------ */

/** This ride's own id, kept distinct from every `DepartmentRideId`. */
export const UFO_RIDE_ID = "ufo" as const;
export type UfoRideId = typeof UFO_RIDE_ID;

/** The ride's own name, as its page prints it. */
export const UFO_RIDE_NAME = "UFO Pendulum";

/**
 * Thirty seats around the saucer's rim, evenly spaced.
 *
 * THIRTY BECAUSE THE PARK ASKS FOR THIRTY. Every ride here carries 30-40 —
 * the coaster's train, the Dragon Ship's deck, the park train's four cars were
 * each brought into that band on the user's instruction — and a department
 * ride that carried twenty-four would be the one exception. The saucer was
 * built with twenty-four while it was an attraction nobody boarded; taking
 * over the Drop Tower's department meant taking over its obligations too.
 *
 * The rim has room: thirty seats on a 29 m disc still leaves 2.9 m between
 * neighbours, against a 1.1 m seat.
 */
export const SEAT_COUNT = 30;
export const SEAT_PITCH_RADIANS = (Math.PI * 2) / SEAT_COUNT;

/* ------------------------------------------------------------------ *
 * THE STRUCTURE — pad, A-frames, bearing
 * ------------------------------------------------------------------ */

/**
 * The concrete the whole machine stands on — a RING, not a disc.
 *
 * The saucer now comes all the way down to the ground to load (see
 * SAUCER_LOAD_Y), and the deepest part of it is the dome under its belly. So
 * the pad is opened out where that dome arrives, exactly as a real pendulum
 * ride's pad is opened over its pit. The opening buys back the pad's own
 * 0.9 m, and that 0.9 m is the difference between a boarding deck a single
 * straight flight can reach and one that needs a switchback — which is the
 * whole point of the exercise.
 */
export const PAD_RADIUS = 26 * METRE;
/*
 * The pad is a concrete slab somebody walks on, so its THICKNESS is a
 * person's dimension and stays one: a slab does not get thicker because the
 * machine standing on it got bigger. Its RADIUS is the machine's and scales
 * with it. Scaled, the slab stood 1.8 m proud and the parked seats' footrests
 * were half a metre inside it.
 */
export const PAD_HEIGHT = 0.9 * WORLD_METRE;

/* ------------------------------------------------------------------ *
 * THE ARM
 * ------------------------------------------------------------------ */

/**
 * Bearing centre to saucer centre. The pendulum's length, exactly.
 *
 * TWENTY-SIX METRES, AND THE PLOT SET IT. The ride was built with a 39 m arm
 * while it stood in the open south-west of the park with 52 m of room. The
 * Drop Tower's plot has less: the park's sightline rule keeps clear sky
 * between neighbouring silhouettes, and from the distant overview a 55 m
 * swept envelope ate through it into the Monster Ride. The arm is the only
 * term in that envelope that is free — the saucer's radius is set by the
 * thirty seats it has to carry — so the arm came down and the bearing went up
 * to keep the ride tall.
 */
export const ARM_LENGTH = 26 * METRE;
/** The arm is a tapered box truss: wide at the bearing, narrow at the hub. */
export const ARM_WIDTH_TOP = 6.4 * METRE;
export const ARM_WIDTH_BOTTOM = 4.0 * METRE;
export const ARM_DEPTH = 2.2 * METRE;
export const ARM_CHORD_RADIUS = 0.6 * METRE;
/** Diagonal bracing panels down the truss. */
export const ARM_BAYS = 9;
export const ARM_DIAGONAL_RADIUS = 0.3 * METRE;
/** A counterweight above the bearing, as every real pendulum ride carries. */
export const COUNTERWEIGHT_LENGTH = 9.5 * METRE;
export const COUNTERWEIGHT_RADIUS = 3.2 * METRE;

/* ------------------------------------------------------------------ *
 * THE SAUCER
 * ------------------------------------------------------------------ */

/** The hull's radius at its widest — the rim the seats hang under. */
export const SAUCER_RADIUS = 14.5 * METRE;
/** Half the hull's thickness at the centre, tapering to the rim. */
export const SAUCER_HALF_DEPTH = 2.6 * METRE;
/** The rim band, which is what reads as a flying saucer from a distance. */
export const RIM_TUBE_RADIUS = 1.15 * METRE;
/** The dome on top, and the smaller one underneath. */
export const DOME_RADIUS = 7.2 * METRE;
export const DOME_HEIGHT = 5.4 * METRE;
export const UNDERDOME_RADIUS = 5.0 * METRE;
export const UNDERDOME_HEIGHT = 2.6 * METRE;
/** The hub that clamps the saucer to the arm and spins it. */
export const HUB_RADIUS = 3.4 * METRE;
export const HUB_HEIGHT = 4.2 * METRE;

/**
 * The skirt panels around the hull, dealt a run of liveries.
 *
 * One panel per seat, so a rider always sits over a panel rather than over a
 * join, and the ride reads as thirty coloured segments turning rather than as
 * a grey disc.
 */
export const SKIRT_PANELS = SEAT_COUNT;
export const SKIRT_INNER_RADIUS = SAUCER_RADIUS - 4.6 * METRE;

/** Lamp bosses set into the rim between the seats. */
export const RIM_LAMP_COUNT = SEAT_COUNT * 2;
export const RIM_LAMP_RADIUS = 0.62 * METRE;

/* ------------------------------------------------------------------ *
 * HOW HIGH THE BEARING IS — set by where the saucer has to ARRIVE
 * ------------------------------------------------------------------ */

/**
 * "the round shape need to be down and pick up the people with straight
 *  ladder"
 *
 * THE RIDE NOW LOADS AT THE BOTTOM OF ITS OWN CIRCLE, and that one sentence
 * re-derives the whole machine.
 *
 * It used to hang its bearing at 60 m, which put the saucer 34 m up when the
 * arm hung straight down. That is where an employee had to be got to, so the
 * park's boarding stair grew to meet it: a 32 m climb in eight flights of
 * switchback steps, which is what the user was looking at when they said they
 * did not want the ladder to be that long.
 *
 * The arm cannot get longer — its length is the ride's footprint, and this
 * plot has no more room (see ARM_LENGTH). So the BEARING comes down instead,
 * until the saucer at the bottom of its travel is as low as its own belly
 * allows. Everything else follows: the frames, the stair, the height of the
 * ride. Nothing is typed; the numbers below are what the saucer's own
 * dimensions leave.
 *
 * WHAT IT COSTS, stated plainly: the ride tops out around 66 m rather than
 * 86 m. A machine that both comes down to head height AND keeps a 26 m arm
 * cannot also keep a 60 m pivot — the pivot IS the height. Its footprint is
 * unchanged, so nothing else in the park moved.
 */

/**
 * WHERE IT PARKS IS SET BY THE PEOPLE, NOT BY THE SAUCER.
 *
 * The load pose used to be measured from the belly up: a metre of air under
 * the underdome, and the seats wherever that put them. That was right while
 * the saucer was 29 m across. The ride is now built to the park's one common
 * height, so the saucer is 56 m across and its belly hangs five metres below
 * its own centre — measured the old way the seats waited 8.3 m up, which is
 * two flights of stairs and a landing, and this ride exists partly because the
 * user asked for the round part to come DOWN to a short straight ladder.
 *
 * So it is measured from the seat down instead. The seats wait at a height one
 * flight of the park's own stairs reaches, and the belly goes where that puts
 * it — DOWN INTO THE PAD'S OWN OPENING, which is what the opening has always
 * been for. On a machine this size that is a well rather than a gap, and it is
 * drawn as one.
 */
export const SEAT_LOAD_Y = AUTHORED_PARKED_SEAT_Y * WORLD_METRE;

/** How far the seat's back panel stands proud of the rim it hangs from. */
export const SEAT_MOUNT_DROP = 1.9 * METRE;

/** The saucer's centre when the arm hangs straight down: the loading pose. */
export const SAUCER_LOAD_Y = SEAT_LOAD_Y + SEAT_MOUNT_DROP;

/** Air under the belly at the bottom of the well. */
export const LOAD_CLEARANCE = 1.0 * WORLD_METRE;

/**
 * THE BOWL THE RIDE SWINGS INTO.
 *
 * Two things go below ground on this machine now, and both are consequences of
 * parking it low enough to board from a single flight of stairs:
 *
 *   the BELLY, which comes down into the opening — that is what the opening
 *   has always been for; and
 *
 *   a SEAT, near the bottom of the swing. The saucer tips right over with the
 *   arm, so as it passes the bottom its far rim swings down past the axis, and
 *   a rider on that rim dips 2.6 m below the pad about eighteen metres out.
 *
 * So the opening is not a hole for the belly any more, it is a bowl the whole
 * machine swings into — which is how a pendulum this size is actually built.
 * Both figures are stated here and `verify-ufo-pendulum.ts` sweeps the real
 * kinematics against them: if anything ever goes deeper or wider than the bowl,
 * that check fails rather than the ride quietly sweeping through the lawn.
 */
export const BOWL_RADIUS = 20 * WORLD_METRE;
export const BOWL_DEPTH = 4 * WORLD_METRE;

/** The bowl's depth, kept under its old name for everything that reads it. */
export const LOAD_WELL_DEPTH = BOWL_DEPTH;
/** The opening left in the pad: the bowl's own rim. */
export const PAD_OPENING_RADIUS = Math.max(BOWL_RADIUS, UNDERDOME_RADIUS + 2.2 * METRE);

/**
 * The bearing the arm hangs from.
 *
 * Everything vertical on this ride is measured from here: the arm hangs down
 * from it, the saucer's height at any moment is this minus the arm's vertical
 * component, and the A-frames exist to hold it up. It is no longer a number
 * anyone chose — it is one arm length above the pose the ride loads in.
 */
export const BEARING_Y = SAUCER_LOAD_Y + ARM_LENGTH;
export const BEARING_RADIUS = 2.6 * METRE;

/**
 * THE FRAMES STAND OUTSIDE THE SAUCER, which they did not used to.
 *
 * The two A-frames straddle the swing plane at local z = ±TOWER_SPREAD / 2,
 * and that spread was 15 m — seven and a half metres either side of a saucer
 * that is fourteen and a half metres in RADIUS. It stood inside its own
 * supports, and their splayed legs passed straight through the hull; it was
 * only ever invisible because the saucer hung thirty-four metres up where the
 * legs happen to be thin and far apart, and because nobody had asked the
 * machine to come down.
 *
 * Bringing the saucer to the ground makes that impossible to leave. The disc
 * always contains the ride's Z axis — it is bolted square to the arm — so it
 * sweeps everything within its own radius of the swing plane, at every height
 * from the pad to the top of the circle. Nothing structural may stand there.
 * So the spread is now SOLVED from the saucer: far enough apart that the rim,
 * a leg's own thickness and a working gap all fit between the frames.
 */
export const TOWER_CLEARANCE = 1.2 * METRE;
export const TOWER_LEG_RADIUS = 1.5 * METRE;
export const TOWER_SPREAD =
  2 * (SAUCER_RADIUS + RIM_TUBE_RADIUS + TOWER_LEG_RADIUS + TOWER_CLEARANCE);

/**
 * How far each A-frame's feet splay, ALONG the swing rather than across it.
 *
 * This is the other half of the same correction. The feet used to splay across
 * the swing plane, which sent the inner leg of each frame diving through the
 * middle of the machine — the very corridor the saucer now comes down. Splayed
 * fore and aft instead, each frame is an A standing in the swing plane at its
 * own z, and the whole corridor between them is clear from the pad upward.
 * The arm and the disc pass between the frames; the frames lean along the
 * direction the arm actually loads them in, which is also the honest way to
 * brace a pendulum.
 *
 * Kept in proportion to the frame's height rather than fixed, so the base that
 * carries the bearing always suits the bearing's height.
 */
export const TOWER_FOOT_SPREAD = (BEARING_Y / 54) * 17.5 * METRE;
export const TOWER_BRACE_RADIUS = 0.55 * METRE;
/** Horizontal braces up each A-frame, as fractions of its height. */
export const TOWER_BRACE_FRACTIONS = [0.28, 0.5, 0.72, 0.9];
/** The head of each frame carries the bearing and a little cap above it. */
export const TOWER_HEAD_HEIGHT = 6.0 * METRE;
/** The shaft runs right through both frames. */
export const BEARING_LENGTH = TOWER_SPREAD + BEARING_RADIUS;

/* ------------------------------------------------------------------ *
 * THE SEATS
 * ------------------------------------------------------------------ */

/**
 * A seat, at the size a person actually meets one, then scaled up with the
 * ride so it is still legible from across the park.
 *
 * The scale is applied to the WHOLE chair — pan, back, restraint and footrest
 * together — so it stays a chair rather than becoming a stretched one.
 */
export const SEAT_SCALE = 2.4;
export const SEAT_WIDTH = PROP.chairWidth;
export const SEAT_DEPTH = 0.48 * METRE;
export const SEAT_THICKNESS = 0.1 * METRE;
export const SEAT_BACK_HEIGHT = HUMAN.shoulderY - PROP.chairSeatY;
export const SEAT_BACK_THICKNESS = 0.09 * METRE;
export const HARNESS_RADIUS = 0.055 * METRE;
export const HARNESS_DROP = 0.36 * METRE;
export const FOOTREST_DROP = 0.62 * METRE;
export const FOOTREST_DEPTH = 0.22 * METRE;

/* SEAT_MOUNT_DROP is declared with the load pose above, because the pose is
   measured from the seat down and needs it first. */

/** Everything a seat and its rider occupy outside the rim. */
export const SEAT_OVERHANG = SEAT_DEPTH * SEAT_SCALE + 0.45 * METRE;

/* ------------------------------------------------------------------ *
 * HOW IT MOVES
 * ------------------------------------------------------------------ */

export const GRAVITY = 9.80665;

/**
 * IT GOES ALL THE WAY ROUND — "the ride need to run like a 380 degree thing".
 *
 * It used to swing, 135 degrees each side of straight down, and lean into the
 * lingering-then-plunging character a real pendulum has. The user has asked for
 * the other machine: the arm no longer turns back at the top of its arc, it
 * carries straight over the bearing and comes down the far side, round and
 * round the same way.
 *
 * THE PHYSICS IS THE SAME PHYSICS, and that is the point of doing it this way
 * rather than sweeping the arm at a constant rate. Energy still decides the
 * speed at every angle — the machine still rushes through the bottom and still
 * slows right down over the top — it simply now has enough of it to get past
 * the top instead of falling back. So the ride keeps the character it was built
 * for while doing what was asked.
 *
 * HOW MUCH ENERGY: exactly the amount that keeps the riders in their seats over
 * the top. Upside down at the peak, a rider needs `omega^2 * L` of centripetal
 * acceleration pointing down at the bearing; gravity supplies one g of it free.
 * Ask for TOP_GEE of it and the seat supplies the rest, pressing the rider into
 * the cushion rather than dropping them into the harness. That single number is
 * the ride's whole drive setting, and every speed and period below falls out of
 * it — see pendulum.ts.
 */
export const TOP_GEE = 1.2;

/**
 * How the saucer's spin relates to the arm's revolutions.
 *
 * A RATIO, not a speed, and a whole-number one — because this is a DEPARTMENT
 * ride and a department ride has to come back to the pose it loads in. The
 * park's ride operations stop each machine between dispatches with its seats
 * back at the platform, and that is only possible if every motion on it shares
 * one period. Two motions at unrelated rates never return to the same pose at
 * all, so an employee would be asked to climb into a seat that was somewhere
 * else.
 *
 * Three turns of the saucer to four revolutions of the arm is the compromise:
 * the whole machine repeats every fourth time round rather than every one, so
 * it does not read as a short looping animation, and it repeats — which is what
 * lets it stop and load. `RIDE_PERIOD` in pendulum.ts is that repeat.
 *
 * IT USED TO BE SEVEN TURNS TO THREE SWINGS, and both numbers had to move with
 * the motion. A swing of this arm took sixteen seconds; a revolution takes six.
 * Seven turns over the old cycle spun the saucer at nine rpm; the same seven
 * over the new one would spin it at twenty-two — a rim doing a hundred and
 * eighteen km/h on its own, on top of everything the arm is already doing. And
 * three times round is over in nineteen seconds, which is short for a
 * dispatch. Four revolutions and three turns keeps the ride a
 * twenty-five-second one and the saucer turning at the rate it always did, and
 * three and four still share no factor.
 */
export const SPINS_PER_CYCLE = 3;
export const REVOLUTIONS_PER_CYCLE = 4;

/* ------------------------------------------------------------------ *
 * WHAT IT OCCUPIES
 * ------------------------------------------------------------------ */

/** The saucer's centre height when the arm hangs at `theta`. */
export function saucerHeightAt(theta: number): number {
  return BEARING_Y - ARM_LENGTH * Math.cos(theta);
}

/** How far the saucer's centre is from the tower line at `theta`. */
export function saucerReachAt(theta: number): number {
  return ARM_LENGTH * Math.sin(theta);
}

/**
 * The ride's horizontal reach — the arm, plus the saucer, plus a rider.
 *
 * MEASURED WITH THE ARM HORIZONTAL, which is where a machine that goes over
 * the top is at its widest. This was wrong once, back when the ride swung, and
 * the mistake is worth keeping on the record because it is the sort that
 * measures SMALLER than the truth and therefore never announces itself: reach
 * is `ARM_LENGTH * sin(theta)`, which peaks at ninety degrees and falls away
 * again after it, so taking the reach at the amplitude understated the
 * envelope by fourteen metres of ground the ride actually sweeps.
 *
 * Now that the arm goes all the way round it passes through ninety degrees
 * every revolution, so this is simply the arm's own length — and it is
 * UNCHANGED by everything else on this page. The ride's footprint is exactly
 * what the park placed it by, which is why nothing else had to move.
 *
 * Measured from the SEAT rather than the hull, because a seat is what arrives
 * at the neighbour first.
 */
export const WIDEST_SWING = Math.PI / 2;
export const OVERALL_REACH =
  saucerReachAt(WIDEST_SWING) + SAUCER_RADIUS + SEAT_OVERHANG;

/** The highest anything on the ride ever gets — the top of the circle. */
export const OVERALL_HEIGHT = Math.max(
  BEARING_Y + TOWER_HEAD_HEIGHT,
  saucerHeightAt(Math.PI) + SAUCER_HALF_DEPTH + DOME_HEIGHT,
);

/**
 * WHAT THE RIDE SOLIDLY OCCUPIES, where it could hide something.
 *
 * OVERALL_REACH above is the swept envelope, and that is the right figure for
 * clearance: nothing may stand where the saucer passes. It is the wrong figure
 * for asking whether this ride stands in FRONT of another, because most of
 * that envelope is occupied only by a saucer fifty to a hundred metres in the
 * air. At the heights a neighbouring ride actually occupies, this machine is
 * two A-frames and a concrete pad.
 *
 * And it is strongly ANISOTROPIC, which is why one radius will not do. The
 * frames straddle the swing plane and splay their feet ACROSS it, so the ride
 * is thirty metres deep across the swing and barely three metres thick along
 * it. Which of those a viewer sees depends entirely on where they stand, so
 * the two are published separately and `placement.ts` turns them into world
 * axes using the ride's own facing.
 *
 * The pad is wider than the frames but only 0.9 m tall, so it hides nothing
 * and is deliberately not part of this.
 */
/*
 * The two have SWAPPED, and it is the same correction as everywhere else on
 * this page: the frames' feet used to splay across the swing plane and now
 * splay along it, so the machine is deep in the direction the arm travels and
 * narrow in the direction it does not. The frames themselves stand further
 * apart than they did, because the saucer now comes down between them.
 */
export const STRUCTURE_HALF_ALONG_SWING = TOWER_FOOT_SPREAD + TOWER_LEG_RADIUS;
export const STRUCTURE_HALF_ACROSS_SWING = TOWER_SPREAD / 2 + TOWER_LEG_RADIUS;
/** The frames stop at their heads; everything above that is the moving arm. */
export const STRUCTURE_HEIGHT = BEARING_Y + TOWER_HEAD_HEIGHT;

/** The lowest the saucer's underside ever gets — the bottom of the circle. */
export const LOWEST_SAUCER_UNDERSIDE =
  saucerHeightAt(0) - SAUCER_HALF_DEPTH - UNDERDOME_HEIGHT;

/* SEAT_LOAD_Y is declared with the load pose above — it is what sets it. */

/* ------------------------------------------------------------------ *
 * THE PALETTE — paint, not light
 * ------------------------------------------------------------------ */

/**
 * Bright, and bright on the MATERIAL.
 *
 * THE STRUCTURE IS NOT PAINTED HERE. `world/ridePaint.ts` owns one hue per
 * ride so that no two are confusable at a distance, and this ride inherited
 * the Drop Tower's violet along with its plot — so the A-frames read it from
 * there rather than declaring an orange of their own that would have sat
 * twelve degrees from the railway's amber.
 *
 * EVERYTHING THE STRUCTURE CARRIES is this ride's own, and that is where the
 * colour the user asked for lives: a cold cyan saucer under a seven-livery
 * skirt, with five more on the seats. None of it is emissive except the rim
 * lamps, which are lamps.
 */
export const PALETTE = {
  towerLight: RIDE_PAINT.ufo.light,
  towerMid: RIDE_PAINT.ufo.mid,
  towerDark: RIDE_PAINT.ufo.dark,
  armLight: "#f2f5f8",
  armMid: "#b9c4cf",
  armDark: "#6d7a88",
  steel: "#8f9aa6",
  steelDark: "#5a636e",
  hullTop: "#d9e8f2",
  hullUnder: "#8fb4cc",
  rim: "#1fbfd4",
  domeGlass: "#7fe3ef",
  domeTrim: "#0f8fa6",
  hub: "#3a4450",
  pad: "#9aa0a6",
  /* The well's lining — the same concrete with the daylight off it. */
  padShadow: "#4a4f57",
  padTrim: RIDE_PAINT.ufo.light,
  seatFrame: "#3a4450",
  harness: "#ffcf3d",
  lamp: "#fff3c4",
} as const;

/**
 * The saucer's skirt liveries, dealt round the hull.
 *
 * Seven colours around twenty-four panels: the run's length shares no factor
 * with the panel count beyond one, so it walks the whole way round without two
 * neighbours ever coming out the same, and the pattern only repeats after the
 * full circle.
 */
export const SKIRT_COLORS = [
  "#ff4d3d",
  "#ffb02e",
  "#ffe14d",
  "#3ecf6d",
  "#1fbfd4",
  "#4d7cff",
  "#b45cf0",
] as const;

export function skirtColor(index: number): string {
  return SKIRT_COLORS[index % SKIRT_COLORS.length];
}

/**
 * The seats' own liveries, a different and shorter run.
 *
 * Deliberately DISJOINT from the skirt's run, not merely a different length.
 * A seat sitting on a panel of its own colour disappears into it, and with two
 * runs of different lengths that collision happens somewhere around the ring
 * however the phases are chosen — so the two palettes share no colour at all,
 * and every seat reads against whatever it happens to be hung over. Five
 * against twenty-four is coprime for the same reason seven is: the run walks
 * the whole way round without repeating a neighbour.
 */
export const SEAT_COLORS = ["#ff2e88", "#f7f3e3", "#00e0a4", "#ff9f1c", "#7c5cff"] as const;

export function seatColor(index: number): string {
  return SEAT_COLORS[index % SEAT_COLORS.length];
}

/* ------------------------------------------------------------------ *
 * SELF-CHECK
 * ------------------------------------------------------------------ */

export function validateUfoPendulum(): void {
  console.assert(
    Math.abs(OVERALL_HEIGHT - UNIFORM_RIDE_HEIGHT) < 0.01,
    `Every ride in this park is ${UNIFORM_RIDE_HEIGHT} m; this one is ${OVERALL_HEIGHT}`,
  );
  console.assert(
    SEAT_COUNT >= 30 && SEAT_COUNT <= 40,
    `Every ride in this park carries 30-40; the saucer carries ${SEAT_COUNT}`,
  );
  console.assert(
    Math.abs(SEAT_PITCH_RADIANS * SEAT_COUNT - Math.PI * 2) < 1e-12,
    "The seats do not close the circle exactly",
  );
  /*
   * This used to read "the saucer clears the pad by a person's height", which
   * was the right rule while the saucer hung thirty metres up and the pad was
   * ground somebody could walk across. The ride now comes down to the pad to
   * load, so the rule it has to keep is the opposite one: the belly comes down
   * THROUGH the pad's opening and stops a working gap above the ground, and
   * the pad it passes into is machinery, not a walkway.
   */
  console.assert(
    Math.abs(LOWEST_SAUCER_UNDERSIDE - LOAD_CLEARANCE) < 1e-9,
    "The saucer does not come down to the clearance the ride was solved for",
  );
  console.assert(
    PAD_OPENING_RADIUS > UNDERDOME_RADIUS,
    "The belly would land on the pad instead of coming down through it",
  );
  console.assert(
    TOWER_SPREAD / 2 - TOWER_LEG_RADIUS > SAUCER_RADIUS + RIM_TUBE_RADIUS,
    "The saucer would come down onto the A-frames it hangs between",
  );
  console.assert(
    SEAT_LOAD_Y > 0 && SEAT_LOAD_Y < BEARING_Y,
    "A seat does not wait at a height anybody could board it at",
  );
  console.assert(
    SKIRT_COLORS.length > 1 && SEAT_COLORS.length > 1,
    "The ride was asked to be colourful and has one colour",
  );
}
