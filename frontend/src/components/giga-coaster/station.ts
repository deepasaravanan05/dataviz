import {
  CAR_COUNT,
  CAR_PITCH,
  PLATFORM_HALF_LENGTH,
  PLATFORM_WIDTH,
  CAR_RIDE_HEIGHT,
  TRACK_GAUGE,
} from "./constants";
import { STATION_DISTANCE, STATION_TRACK_Y } from "./trackCurve";
import { frameAtDistance } from "./trackFrames";
import { RIDE_FACING, RIDE_ORIGIN } from "./placement";

/**
 * WHERE THE PLATFORM SITS, which needs both halves of the ride.
 *
 * The boards have to be level with the car floor, the car floor rides a fixed
 * height above the rail, and the rail's height along the station straight is
 * something only the finished curve knows — `trackCurve.ts` corrects every
 * height on the circuit by a hair to land the crest exactly on the ride's
 * stated height, so the station straight moves with it.
 *
 * That module reads the ride's constants, so the constants cannot read it
 * back: the two would import each other in a circle and whichever loaded
 * second would see undefined. This module is where the two meet, and it is
 * imported by the station's geometry and by the verify script alike.
 *
 * IT IS ALSO THE RIDE'S BOARDING DECK. The Giga Coaster is a department ride
 * now — DevOps walk to it and get in — and a department ride needs a deck, a
 * flight of steps up to it and a queue at the bottom. This one already had all
 * three: a platform level with the car floor, running the length of the train,
 * with the park's own step up to it. So `boardingStair.ts` reads THIS rather
 * than solving a second platform to stand beside the first, and the numbers
 * below are the numbers the station is drawn from.
 */

/** The boards, level with the floor of a car standing in the station. */
export const PLATFORM_Y = STATION_TRACK_Y + CAR_RIDE_HEIGHT;

/** How far the boards stand off the track's centre line, clear of the cars. */
export const PLATFORM_OFFSET = TRACK_GAUGE / 2 + PLATFORM_WIDTH / 2 + 0.6;

/**
 * WHERE THE PLATFORM IS PINNED: on the middle of the train that stands in it.
 *
 * It used to be a fifth of a platform-length PAST the start of the straight,
 * with a comment claiming that centred the boards on the train. It did not.
 * The train is placed by its LEAD car — `setDistance` puts car i at
 * `d - i * CAR_PITCH` — so a train parked on the station mark reaches 38 m
 * BACKWARDS from it, and the boards were pinned 5 m forwards. Twenty-three of
 * the train's forty-four metres stood past the end of its own platform.
 *
 * That was invisible while nobody boarded the ride. It is not invisible now:
 * DevOps employees walk these boards to their seats, and half of them would
 * have been walking to a seat with no platform beside it. So the pin is the
 * train's own centre, derived from the same two constants that place the cars.
 */
export const PLATFORM_DISTANCE = STATION_DISTANCE - ((CAR_COUNT - 1) * CAR_PITCH) / 2;
const FRAME = frameAtDistance(PLATFORM_DISTANCE);
/** Which way the station faces, in the ride's own space. */
const STATION_YAW = Math.atan2(FRAME.tangent.x, FRAME.tangent.z);

/**
 * A point in the station's own frame — +x out towards the platform, +z along
 * it — turned into world x/z.
 *
 * Two rotations, exactly the two the scene applies: the station group's own
 * yaw inside the ride, and then the ride group's facing at its origin on the
 * park ring.
 */
export function stationToWorld(x: number, z: number): [number, number] {
  const cy = Math.cos(STATION_YAW);
  const sy = Math.sin(STATION_YAW);
  /* Ry(STATION_YAW), then offset by the station frame's own position. */
  const rx = FRAME.position.x + x * cy + z * sy;
  const rz = FRAME.position.z - x * sy + z * cy;
  /* And then the ride's own placement on the ring. */
  const cf = Math.cos(RIDE_FACING);
  const sf = Math.sin(RIDE_FACING);
  return [
    RIDE_ORIGIN[0] + rx * cf + rz * sf,
    RIDE_ORIGIN[2] - rx * sf + rz * cf,
  ];
}

/** A direction in the station's frame, turned into a world x/z direction. */
function stationDirection(x: number, z: number): readonly [number, number] {
  const [ox, oz] = stationToWorld(0, 0);
  const [px, pz] = stationToWorld(x, z);
  const dx = px - ox;
  const dz = pz - oz;
  const len = Math.hypot(dx, dz) || 1;
  return [dx / len, dz / len] as const;
}

/** Middle of the boards, in world x/z. */
export const PLATFORM_CENTER: readonly [number, number] = stationToWorld(PLATFORM_OFFSET, 0);
/** From the train out to the boards. */
export const PLATFORM_OUTWARD = stationDirection(1, 0);
/** Along the boards, which is along the train. */
export const PLATFORM_ALONG = stationDirection(0, 1);

/**
 * THE FLIGHT UP TO THE BOARDS — one rule, two readers.
 *
 * `Station.tsx` draws these steps and `boardingStair.ts` walks employees up
 * them, so the rule for where they are lives here and both call it. The step
 * itself is the PARK's — the caller passes the rise, going and width from
 * `boardingStair.ts` rather than this module reaching for them, which is what
 * keeps the ride's own geometry clear of the journey simulation.
 *
 * The flight climbs inwards: its foot is furthest from the platform and its
 * head meets the platform edge.
 */
export function stationFlight(rise: number, going: number, width: number) {
  const steps = Math.max(1, Math.round(PLATFORM_Y / rise));
  const stepRise = PLATFORM_Y / steps;
  const headX = PLATFORM_OFFSET + PLATFORM_WIDTH / 2 + 0.4;
  const footX = headX + steps * going;
  /* At the far end of the platform, clear of the way people walk along it. */
  const z = PLATFORM_HALF_LENGTH - width;
  return {
    steps,
    stepRise,
    /* In the station's own frame, for the geometry that draws the treads. */
    headX,
    z,
    /* And in world x/z, for the journey that walks them. */
    foot: stationToWorld(footX, z),
    head: stationToWorld(headX, z),
  };
}
