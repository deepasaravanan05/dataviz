"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatSimTime } from "@/simulation/clock";
import { advanceJourneyClock } from "@/simulation/journey/clock";
import { CHECK_IN_COLOR_HEX } from "@/simulation/journey/journey";
import { useActiveJourneyStore } from "@/simulation/journey/activeJourney";
import { CalendarCard } from "@/components/dashboard/CalendarCard";
import { DepartmentOverview } from "@/components/dashboard/DepartmentOverview";
import { averageDelay, delayByBand, worstDelay } from "@/simulation/journey/delayStats";

/**
 * The Employee Theme Park dashboard.
 *
 * A 2D companion to the 3D park, styled after the supplied sunset concept: a
 * glassmorphic calendar, the gold entrance lettering, and the department
 * check-in overview — but every number on it is counted live from the SAME
 * attendance dataset and simulation clock the park animates. Nothing is quoted
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

export default function DashboardPage() {
  /*
   * The shared journey clock drives the counts. Rendered state is only the
   * floored minute, so the page re-renders once per simulated minute rather
   * than sixty times a second.
   */
  const loopStart = useActiveJourneyStore((s) => s.loopStart);
  const employees = useActiveJourneyStore((s) => s.employees);
  const [minute, setMinute] = useState(() => Math.floor(loopStart));
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
                  <dd className="font-bold tabular-nums">{averageDelay(employees).toFixed(1)} min</dd>
                </div>
                <div className="flex items-baseline justify-between">
                  <dt className="text-white/55">Longest wait</dt>
                  <dd className="font-bold tabular-nums">
                    {worstDelay(employees).delayMinutes} min
                    <span className="ml-1.5 font-normal text-white/45">{worstDelay(employees).name}</span>
                  </dd>
                </div>
                {delayByBand(employees).map((b) => (
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

          {/* The overview table — shared with the Main Entrance overlay */}
          <DepartmentOverview simTime={minute + 0.999} />
        </div>
      </div>
    </main>
  );
}
