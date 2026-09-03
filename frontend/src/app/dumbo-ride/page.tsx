"use client";

import Link from "next/link";
import { ParkScene } from "@/components/roller-coaster/ParkScene";
import {
  ARM_LENGTH,
  ARM_SWING,
  BOARDING_RADIUS,
  CLIMB_SPEED,
  DECK_Y,
  DUMBO_RIDE_NAME,
  HOWDAH_COLORS,
  OVERALL_HEIGHT,
  RIDER_SPEED,
  RIDE_SCALE,
  ROTATION_RPM,
  SEAT_COUNT,
  SEATS_PER_VEHICLE,
  VEHICLE_COUNT,
  VEHICLE_TOP_Y,
} from "@/components/dumbo-ride/constants";
import { CYCLE_SECONDS } from "@/components/dumbo-ride/motion";
import {
  BEHIND_DISTANCE,
  FAN_ANGLE_DEG,
  RIDE_CENTER,
} from "@/components/dumbo-ride/placement";
import { STATION_FLIGHTS, STATION_STEPS } from "@/components/dumbo-ride/station";

/** Framed from the gate side, where the stair up to the gallery is. */
const CAMERA_POSITION: [number, number, number] = [
  RIDE_CENTER[0] - 34,
  22,
  RIDE_CENTER[1] - 52,
];
const CAMERA_TARGET: [number, number, number] = [
  RIDE_CENTER[0],
  OVERALL_HEIGHT * 0.45,
  RIDE_CENTER[1],
];

export default function DumboRidePage() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      <ParkScene cameraPosition={CAMERA_POSITION} cameraTarget={CAMERA_TARGET} />

      <div className="pointer-events-none absolute left-4 top-4 rounded-xl bg-black/65 px-4 py-3 text-white shadow-lg backdrop-blur">
        <div className="text-sm font-semibold tracking-wide">{DUMBO_RIDE_NAME.toUpperCase()}</div>
        <div className="mt-0.5 text-2xl font-bold tabular-nums">{SEAT_COUNT} RIDERS</div>
        <div className="mt-1 text-xs text-white/60">
          {VEHICLE_COUNT} flying elephants &middot; {SEATS_PER_VEHICLE} each
        </div>
        <div className="mt-2 space-y-1 text-xs text-white/70">
          <div>
            {ARM_LENGTH.toFixed(0)}m arms swinging &plusmn;{((ARM_SWING * 180) / Math.PI).toFixed(0)}
            &deg;, so a rider flies between the gallery and {VEHICLE_TOP_Y.toFixed(0)}m &mdash; the
            lever in the howdah is the whole ride
          </div>
          <div>
            {ROTATION_RPM.toFixed(2)} rpm carries a rider at {(RIDER_SPEED * 3.6).toFixed(1)} km/h;
            the hydraulics cap the climb at {CLIMB_SPEED.toFixed(1)} m/s, which is what decides how
            high anybody may take it &mdash; one long climb to the top, or two pumps at half
          </div>
          <div>
            Every rider on their own allowance, so no two elephants fly the same &mdash; drawn at{" "}
            {RIDE_SCALE.toFixed(2)}x, sized off this park&rsquo;s own 3.4m figures
          </div>
          <div>
            It comes down to the people: the arms park at{" "}
            {BOARDING_RADIUS.toFixed(0)}m and the howdah floors land level with the{" "}
            {DECK_Y.toFixed(1)}m gallery, reached by {STATION_STEPS} steps in{" "}
            {STATION_FLIGHTS.length} flights &mdash; every {CYCLE_SECONDS}s
          </div>
          <div>
            Standing {BEHIND_DISTANCE.toFixed(0)}m behind the UFO Pendulum, which is the Data
            Engineering ride, {FAN_ANGLE_DEG}&deg; off the gate&rsquo;s line of sight through it
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1">
          {HOWDAH_COLORS.map((c) => (
            <span key={c} className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c }} />
          ))}
          <span className="ml-1 text-xs text-white/50">howdahs</span>
        </div>
      </div>

      <div className="pointer-events-auto absolute right-4 top-4 flex gap-2">
        <Link
          href="/entrance"
          className="rounded-full bg-black/65 px-4 py-2 text-sm text-white shadow-lg backdrop-blur transition hover:bg-black/80"
        >
          Entrance
        </Link>
        <Link
          href="/ufo-pendulum"
          className="rounded-full bg-black/65 px-4 py-2 text-sm text-white shadow-lg backdrop-blur transition hover:bg-black/80"
        >
          UFO Pendulum
        </Link>
        <Link
          href="/"
          className="rounded-full bg-black/65 px-4 py-2 text-sm text-white shadow-lg backdrop-blur transition hover:bg-black/80"
        >
          ← Theme Park
        </Link>
      </div>
    </main>
  );
}
