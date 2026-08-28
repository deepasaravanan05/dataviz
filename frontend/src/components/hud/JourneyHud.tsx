"use client";

import { useMemo } from "react";
import {
  CHECK_IN_BAND_LABEL,
  CHECK_IN_COLOR_HEX,
  sampleJourney,
  type CheckInColor,
} from "@/simulation/journey/journey";
import {
  averageDelay,
  delayByBand,
  delayByDepartment,
  maxGroupAverage,
  worstDelay,
} from "@/simulation/journey/delayStats";
import { useActiveJourneyStore } from "@/simulation/journey/activeJourney";
import { formatSimTime } from "@/simulation/clock";
import { useJourneyStore } from "@/store/journeyStore";

/**
 * The simulated clock, the colour key and a live headcount by stage.
 *
 * Re-renders about once a simulated minute, because that is all the store
 * publishes — the walking figures themselves run off the frame clock. Every
 * count and bar is computed from the ACTIVE roster through the shared
 * delayStats functions, so the panel follows an upload the moment it lands.
 */

const BANDS: CheckInColor[] = ["GREEN", "YELLOW", "RED"];

function DelayBar({
  label,
  average,
  max,
  color,
}: {
  label: string;
  average: number;
  max: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="w-[4.2rem] shrink-0 font-semibold text-white/75">{label}</span>
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
        <span
          className="block h-full rounded-full"
          style={{ width: `${(average / Math.max(max, 1e-6)) * 100}%`, backgroundColor: color }}
        />
      </span>
      <span className="w-10 shrink-0 text-right tabular-nums text-white/70">
        {Math.round(average)}m
      </span>
    </div>
  );
}

export function JourneyHud() {
  const simTime = useJourneyStore((s) => s.simTime);
  const employees = useActiveJourneyStore((s) => s.employees);

  const bandCounts = useMemo(
    () =>
      BANDS.map((band) => ({
        band,
        count: employees.filter((e) => e.color === band).length,
      })),
    [employees],
  );

  const delays = useMemo(
    () => ({
      average: averageDelay(employees),
      byBand: delayByBand(employees),
      byDepartment: delayByDepartment(employees),
      worst: worstDelay(employees),
      maxAverage: maxGroupAverage(employees),
    }),
    [employees],
  );

  const stages = useMemo(() => {
    let outside = 0;
    let walking = 0;
    let foodCourt = 0;
    let atRide = 0;
    let working = 0;

    for (const e of employees) {
      const s = sampleJourney(e, simTime);
      if (!s) {
        outside++;
        continue;
      }
      /* Work started is a fact about the clock now, not a place they stand:
         they spend the rest of the day in their department ride's seat. */
      if (s.working) {
        working++;
        continue;
      }
      switch (s.phase) {
        case "APPROACHING":
        case "QUEUED":
        case "CHECKING_IN":
          outside++;
          break;
        case "IN_FOOD_COURT":
          foodCourt++;
          break;
        /* Everything that happens at the ride counts as being at it: arriving,
           waiting for a seat, boarding, riding, and getting off again. */
        case "AT_RIDE":
        case "WAITING_AT_LADDER":
        case "WALKING_TO_LADDER":
        case "CLIMBING_LADDER":
        case "ON_PLATFORM":
        case "WALKING_TO_SEAT":
        case "BOARDING":
        case "SITTING_ON_RIDE":
        case "EXITING_RIDE":
          atRide++;
          break;
        default:
          walking++;
      }
    }
    return { outside, walking, foodCourt, atRide, working };
  }, [simTime, employees]);

  return (
    <div className="pointer-events-none absolute bottom-32 left-4 sm:bottom-4 w-[min(19rem,calc(100vw-2rem))] rounded-2xl border border-cyan-300/10 bg-[#070b14]/82 px-4 py-3 text-white shadow-2xl shadow-black/50 backdrop-blur-xl">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-300/80">
          Simulated time
        </span>
        <span className="text-xl font-bold tabular-nums">{formatSimTime(simTime)}</span>
      </div>

      <div className="mt-2.5 space-y-1">
        {bandCounts.map(({ band, count }) => (
          <div key={band} className="flex items-center gap-2 text-[11px]">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: CHECK_IN_COLOR_HEX[band] }}
            />
            <span className="w-12 font-semibold">{band}</span>
            <span className="tabular-nums text-white/55">{count}</span>
            <span className="text-white/40">· {CHECK_IN_BAND_LABEL[band]}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-5 gap-1 border-t border-cyan-300/10 pt-2.5 text-center">
        {[
          ["Outside", stages.outside],
          ["Walking", stages.walking],
          ["Food", stages.foodCourt],
          ["At ride", stages.atRide],
          ["Working", stages.working],
        ].map(([label, value]) => (
          <div key={label as string}>
            <div className="text-base font-bold tabular-nums leading-none">{value as number}</div>
            <div className="mt-0.5 text-[9px] uppercase tracking-wide text-white/40">
              {label as string}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 border-t border-cyan-300/10 pt-2.5">
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300/80">
            Delay · check-in → work start
          </span>
          <span className="text-[11px] tabular-nums text-white/55">
            avg {Math.round(delays.average)}m
          </span>
        </div>

        <div className="mt-1.5 space-y-1">
          {delays.byBand.map((d) => (
            <DelayBar
              key={d.key}
              label={d.label}
              average={d.average}
              max={delays.maxAverage}
              color={CHECK_IN_COLOR_HEX[d.key as CheckInColor]}
            />
          ))}
        </div>

        <div className="mt-1.5 space-y-1 border-t border-white/[0.07] pt-1.5">
          {delays.byDepartment.map((d) => (
            <DelayBar key={d.key} label={d.label} average={d.average} max={delays.maxAverage} color="#7dd3fc" />
          ))}
        </div>

        <div className="mt-1.5 text-[10px] tabular-nums text-white/40">
          Longest wait — {delays.worst.name} ({delays.worst.id}) {Math.round(delays.worst.delayMinutes)} min
        </div>
      </div>

      <div className="mt-2 border-t border-cyan-300/10 pt-2 text-[10px] leading-relaxed text-white/35">
        {employees.length} employees. Click anyone for their full journey. Colour = check-in
        window; each ride is a department; the food court is the stop on the way.
      </div>
    </div>
  );
}
