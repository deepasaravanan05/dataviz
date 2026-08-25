"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatSimTime } from "@/simulation/clock";
import { advanceJourneyClock } from "@/simulation/journey/clock";
import { CHECK_IN_COLOR_HEX, LOOP_START } from "@/simulation/journey/journey";
import {
  departmentOverview,
  overviewTotals,
} from "@/simulation/journey/overview";
import { AVERAGE_DELAY, DELAY_BY_BAND, WORST_DELAY } from "@/simulation/journey/delayStats";

/**
 * The Employee Theme Park dashboard.
 *
 * A 2D companion to the 3D park, styled after the supplied sunset concept: a
 * glassmorphic calendar, the gold entrance lettering, and the department
 * check-in overview — but every number on it is counted live from the SAME
 * 50-row dataset and simulation clock the park animates. Nothing is quoted
 * from the concept image; its fabricated departments and totals are replaced
 * by the project's real ones.
 *
 * The three columns follow the clock: CHECK-IN counts who has passed the
 * gate, ACTUAL WORK START counts who has begun working, and DELAYED is
 * everyone in between — the delay, made visible as a live headcount. At the
 * end of the morning the delayed column drains to zero by construction.
 *
 * No charts, per the standing instruction: the table and the animation are
 * the visualization.
 */

/** One fixed hue per department for its icon chip, in dataset order. */
const DEPT_HUES = ["#4ade80", "#fbbf24", "#38bdf8", "#a78bfa", "#fb7185", "#34d399", "#f97316"];

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const WEEKDAY_NAMES = [
  "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY",
];
const MONTHS = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
];

/** The real current month, rendered after mount so prerender never disagrees. */
function CalendarCard() {
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => {
    // Set after a frame so prerendered HTML and first client render agree.
    const id = requestAnimationFrame(() => setToday(new Date()));
    return () => cancelAnimationFrame(id);
  }, []);

  const grid = useMemo(() => {
    if (!today) return null;
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    const days = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const cells: (number | null)[] = Array.from({ length: first.getDay() }, () => null);
    for (let d = 1; d <= days; d++) cells.push(d);
    return cells;
  }, [today]);

  return (
    <section
      aria-label="Calendar"
      className="rounded-2xl border border-white/10 bg-[#0d0f1c]/70 p-5 shadow-2xl shadow-black/50 backdrop-blur-xl"
    >
      {today && grid ? (
        <>
          <div className="text-sm font-semibold text-pink-400">{today.getFullYear()}</div>
          <div className="text-2xl font-bold tracking-wide text-white">{MONTHS[today.getMonth()]}</div>
          <div className="text-[11px] font-semibold tracking-[0.2em] text-pink-400/90">
            {WEEKDAY_NAMES[today.getDay()]}
          </div>
          <div className="mt-3 grid grid-cols-7 gap-y-1.5 text-center text-[12px] tabular-nums">
            {WEEKDAYS.map((w) => (
              <div key={w} className={w === "SUN" ? "text-pink-400/90" : "text-white/50"}>
                {w}
              </div>
            ))}
            {grid.map((d, i) => (
              <div key={i} className="flex items-center justify-center">
                {d === null ? null : (
                  <span
                    className={[
                      "flex h-6 w-6 items-center justify-center rounded-full",
                      d === today.getDate()
                        ? "bg-amber-400 font-bold text-slate-950"
                        : i % 7 === 0
                          ? "text-pink-400/90"
                          : "text-white/80",
                    ].join(" ")}
                  >
                    {d}
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="h-56 animate-pulse rounded-xl bg-white/5" aria-hidden="true" />
      )}
    </section>
  );
}

export default function DashboardPage() {
  /*
   * The shared journey clock drives the counts. Rendered state is only the
   * floored minute, so the page re-renders once per simulated minute rather
   * than sixty times a second.
   */
  const [minute, setMinute] = useState(() => Math.floor(LOOP_START));
  const raf = useRef(0);

  useEffect(() => {
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const t = advanceJourneyClock(dt);
      setMinute((m) => (Math.floor(t) === m ? m : Math.floor(t)));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  const rows = useMemo(() => departmentOverview(minute + 0.999), [minute]);
  const totals = useMemo(() => overviewTotals(rows), [rows]);

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-[#12101d] text-white">
      {/* ---- The sunset, in CSS: sky, sun glow, treeline, warm ground ---- */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, #171a38 0%, #33254f 26%, #74334a 44%, #c65a33 60%, #f0a054 72%, #452a1c 84%, #171009 100%)",
          }}
        />
        <div
          className="absolute inset-x-0 top-[38%] h-[45%]"
          style={{
            background:
              "radial-gradient(ellipse 55% 60% at 50% 55%, rgba(255,196,110,0.55) 0%, rgba(255,150,70,0.22) 45%, transparent 75%)",
          }}
        />
        {/* Treeline silhouette on the horizon */}
        <svg
          className="absolute inset-x-0 top-[64%] h-[14%] w-full"
          viewBox="0 0 1200 100"
          preserveAspectRatio="none"
        >
          <path
            d="M0,100 L0,58 Q30,38 60,52 Q80,30 110,46 L140,56 Q170,28 205,44 Q240,20 270,42 L310,54 Q350,34 385,50 Q420,24 455,44 L500,56 L520,30 L530,30 L540,12 L550,30 L560,30 L580,56 L640,56 L660,30 L670,30 L680,12 L690,30 L700,30 L720,56 L770,54 Q810,30 845,46 Q880,22 915,42 L950,52 Q985,30 1020,46 Q1055,26 1090,44 L1130,54 Q1160,38 1200,50 L1200,100 Z"
            fill="#1b130e"
            opacity="0.9"
          />
        </svg>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_90%_at_50%_30%,transparent_55%,rgba(6,4,10,0.55)_100%)]" />
      </div>

      {/* ---- Content ---- */}
      <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6">
        {/* Gold lettering, as on the gate */}
        <header className="text-center">
          <h1
            className="text-3xl font-black tracking-[0.18em] sm:text-4xl"
            style={{
              background: "linear-gradient(180deg, #ffe9b0 0%, #f2b134 55%, #a8701c 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              textShadow: "0 0 28px rgba(242,177,52,0.25)",
            }}
          >
            EMPLOYEE THEME PARK
          </h1>
          <p className="mt-1 text-[13px] text-amber-100/70">
            Department check-in overview — counted live from the morning simulation
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full border border-amber-300/25 bg-black/40 px-4 py-1.5 text-sm font-bold tabular-nums text-amber-200 backdrop-blur">
              {formatSimTime(minute)}
            </span>
            <Link
              href="/"
              className="rounded-full border border-white/15 bg-black/40 px-4 py-1.5 text-[13px] text-white/85 backdrop-blur transition hover:bg-black/60 hover:text-white"
            >
              Enter the 3D park →
            </Link>
            <Link
              href="/entrance"
              className="rounded-full border border-white/15 bg-black/40 px-4 py-1.5 text-[13px] text-white/85 backdrop-blur transition hover:bg-black/60 hover:text-white"
            >
              Entrance view
            </Link>
          </div>
        </header>

        <div className="mt-8 grid gap-5 lg:grid-cols-[280px_1fr]">
          {/* Left column: calendar + morning summary */}
          <div className="space-y-5">
            <CalendarCard />

            <section
              aria-label="Morning summary"
              className="rounded-2xl border border-white/10 bg-[#0d0f1c]/70 p-5 shadow-2xl shadow-black/50 backdrop-blur-xl"
            >
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200/80">
                Morning summary
              </h2>
              <dl className="mt-3 space-y-2.5 text-[13px]">
                <div className="flex items-baseline justify-between">
                  <dt className="text-white/55">Average delay</dt>
                  <dd className="font-bold tabular-nums">{AVERAGE_DELAY.toFixed(1)} min</dd>
                </div>
                <div className="flex items-baseline justify-between">
                  <dt className="text-white/55">Longest wait</dt>
                  <dd className="font-bold tabular-nums">
                    {WORST_DELAY.delayMinutes} min
                    <span className="ml-1.5 font-normal text-white/45">{WORST_DELAY.name}</span>
                  </dd>
                </div>
                {DELAY_BY_BAND.map((b) => (
                  <div key={b.key} className="flex items-center justify-between">
                    <dt className="flex items-center gap-2 text-white/55">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: CHECK_IN_COLOR_HEX[b.key as keyof typeof CHECK_IN_COLOR_HEX] }}
                      />
                      {b.label} arrivals
                    </dt>
                    <dd className="tabular-nums text-white/85">
                      {b.count} · avg {b.average.toFixed(1)} min
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>

          {/* The overview table */}
          <section
            aria-label="Department check-in overview"
            className="rounded-2xl border border-white/10 bg-[#0d0f1c]/72 p-5 shadow-2xl shadow-black/50 backdrop-blur-xl"
          >
            <h2 className="text-base font-bold tracking-wide text-white">
              DEPARTMENT CHECK-IN OVERVIEW
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/12 text-[10px] font-semibold uppercase tracking-[0.14em]">
                    <th className="pb-2.5 pr-3 text-white/60">Department</th>
                    <th className="pb-2.5 pr-3 text-right text-emerald-300/90">
                      Check-in
                      <br />
                      count
                    </th>
                    <th className="pb-2.5 pr-3 text-right text-amber-300/90">
                      Delayed
                      <br />
                      count
                    </th>
                    <th className="pb-2.5 text-right text-sky-300/90">
                      Actual work
                      <br />
                      start count
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.department} className="border-b border-white/[0.06]">
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-black text-slate-950"
                            style={{ backgroundColor: DEPT_HUES[i % DEPT_HUES.length] }}
                          >
                            {r.department.slice(0, 1)}
                          </span>
                          <div className="leading-tight">
                            <div className="text-[13px] font-medium text-white/90">{r.department}</div>
                            <div className="text-[10px] text-white/40">
                              {r.rideName} · {r.size} staff · avg {r.avgDelay.toFixed(1)} min
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 text-right text-[15px] font-bold tabular-nums text-emerald-300">
                        {r.checkedIn}
                      </td>
                      <td className="py-2.5 pr-3 text-right text-[15px] font-bold tabular-nums text-amber-300">
                        {r.delayed}
                      </td>
                      <td className="py-2.5 text-right text-[15px] font-bold tabular-nums text-sky-300">
                        {r.started}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="pt-3 text-sm font-bold tracking-wide text-white/85">TOTAL</td>
                    <td className="pt-3 pr-3 text-right text-lg font-black tabular-nums text-emerald-300">
                      {totals.checkedIn}
                    </td>
                    <td className="pt-3 pr-3 text-right text-lg font-black tabular-nums text-amber-300">
                      {totals.delayed}
                    </td>
                    <td className="pt-3 text-right text-lg font-black tabular-nums text-sky-300">
                      {totals.started}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-white/40">
              Check-in counts employees who have passed the main gate; actual work start counts
              those already working; delayed is everyone in between, still walking, eating or
              queueing. The columns follow the simulation clock — of {totals.size} employees, the
              delayed column drains to zero as the morning completes.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
