"use client";

import Link from "next/link";
import { ParkScene } from "@/components/roller-coaster/ParkScene";
import {
  APRON_RADIUS,
  CUP_COLORS,
  CUP_COUNT,
  CUP_RADIUS,
  CUP_RPM,
  DECK_Y,
  OVERALL_HEIGHT,
  PLATE_RADIUS,
  PLATE_RPM,
  RIDER_SPEED,
  RIDE_SCALE,
  SEAT_COUNT,
  SEATS_PER_CUP,
  TEACUPS_RIDE_NAME,
  TEACUPS_TEAM_NAME,
  BESTON_PLATE_RPM,
  COMFORT_GEE,
} from "@/components/tea-cups/constants";
import { CYCLE_SECONDS } from "@/components/tea-cups/motion";
import { BEHIND_DISTANCE, RIDE_CENTER } from "@/components/tea-cups/placement";

/** Framed from the gate side, where the boarding steps are. */
const CAMERA_POSITION: [number, number, number] = [
  RIDE_CENTER[0] - 26,
  15,
  RIDE_CENTER[1] - 40,
];
const CAMERA_TARGET: [number, number, number] = [
  RIDE_CENTER[0],
  OVERALL_HEIGHT * 0.42,
  RIDE_CENTER[1],
];

export default function TeaCupsPage() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      <ParkScene cameraPosition={CAMERA_POSITION} cameraTarget={CAMERA_TARGET} />

      <div className="pointer-events-none absolute left-4 top-4 rounded-xl bg-black/65 px-4 py-3 text-white shadow-lg backdrop-blur">
        <div className="text-sm font-semibold tracking-wide">{TEACUPS_RIDE_NAME.toUpperCase()}</div>
        <div className="mt-0.5 text-2xl font-bold tabular-nums">{SEAT_COUNT} RIDERS</div>
        <div className="mt-1 text-xs text-white/60">
          {CUP_COUNT} cups &middot; {SEATS_PER_CUP} each &middot; {TEACUPS_TEAM_NAME}
        </div>
        <div className="mt-2 space-y-1 text-xs text-white/70">
          <div>
            Beston&rsquo;s own machine at {RIDE_SCALE}x &mdash; a {(PLATE_RADIUS * 2).toFixed(0)}m
            plate in an {(APRON_RADIUS * 2).toFixed(0)}m square, the largest this park&rsquo;s
            ground will take
          </div>
          <div>
            {PLATE_RPM.toFixed(2)} rpm carries a rider at {(RIDER_SPEED * 3.6).toFixed(1)} km/h
            while every cup counter-spins at {CUP_RPM.toFixed(1)} rpm &mdash; the two add to{" "}
            {COMFORT_GEE.toFixed(2)}g, which is the whole design budget. Beston&rsquo;s{" "}
            {BESTON_PLATE_RPM} rpm suits their 6m plate, not this one
          </div>
          <div>
            {(CUP_RADIUS * 2).toFixed(1)}m cups on their own saucers, under a fixed ceiling with a
            gilt cornice and an RGB lamp run
          </div>
          <div>
            Loads off its own plate: it stops dead, the gate opens, and the only climb is{" "}
            {DECK_Y.toFixed(1)}m &mdash; every {CYCLE_SECONDS}s
          </div>
          <div>
            Standing {BEHIND_DISTANCE.toFixed(0)}m behind the UFO Pendulum, which is the Data
            Engineering ride
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1">
          {CUP_COLORS.map((c) => (
            <span key={c} className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c }} />
          ))}
          <span className="ml-1 text-xs text-white/50">glazes</span>
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
