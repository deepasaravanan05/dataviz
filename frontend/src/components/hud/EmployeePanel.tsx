"use client";

import { useEffect, useState } from "react";
import {
  CHECK_IN_BAND_LABEL,
  CHECK_IN_COLOR_HEX,
  PHASE_LABEL,
  sampleJourney,
  timeOrDash,
  type JourneyEmployee,
} from "@/simulation/journey/journey";
import { useActiveJourneyStore } from "@/simulation/journey/activeJourney";
import { formatSimTime } from "@/simulation/clock";
import { useJourneyStore } from "@/store/journeyStore";
import { useCameraStore } from "@/store/cameraStore";

/**
 * Detail panel for a clicked employee.
 *
 * Ordinary fixed-position HTML, like the department panel — it never becomes a
 * 3D object, so it cannot occlude or interact with the park. It reads the
 * journey store and nothing else, so opening it cannot pause a ride, a walking
 * employee or the simulated clock.
 *
 * Every value shown comes from the same record that drives the figure walking
 * across the park, so the panel and the animation can never disagree.
 */
export function EmployeePanel() {
  const selectedId = useJourneyStore((s) => s.selectedId);
  const clear = useJourneyStore((s) => s.clear);

  const employee = useActiveJourneyStore((s) => (selectedId ? s.byId[selectedId] : undefined));
  if (!employee) return null;

  // Keyed by employee, so switching people replays the entrance animation and
  // keeps the "shown" flag out of a parent effect.
  return <PanelBody key={employee.id} employee={employee} onClose={clear} />;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-[3px]">
      <span className="text-[11px] uppercase tracking-[0.14em] text-white/45">{label}</span>
      <span className="text-right text-[13px] font-medium tabular-nums text-white">{value}</span>
    </div>
  );
}

function PanelBody({
  employee,
  onClose,
}: {
  employee: JourneyEmployee;
  onClose: () => void;
}) {
  const simTime = useJourneyStore((s) => s.simTime);
  const follow = useCameraStore((s) => s.follow);
  const release = useCameraStore((s) => s.release);
  const following = useCameraStore((s) => s.mode === "follow" && s.followId === employee.id);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const now = sampleJourney(employee, simTime);
  const color = CHECK_IN_COLOR_HEX[employee.color];

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-label={`${employee.name} journey details`}
      className={[
        "pointer-events-auto fixed left-4 top-16 z-50",
        "w-[min(21rem,calc(100vw-2rem))]",
        "rounded-2xl border border-cyan-300/12 bg-[#070b14]/88 shadow-2xl shadow-black/50 backdrop-blur-xl",
        "transition-all duration-300 ease-out motion-reduce:transition-none",
        shown ? "translate-x-0 opacity-100" : "-translate-x-3 opacity-0",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3 px-5 pt-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300/90">
            Employee
          </div>
          <h2 className="mt-1 text-xl font-bold leading-tight text-white">{employee.name}</h2>
          <div className="text-[12px] tabular-nums text-white/50">{employee.id}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close employee panel"
          className="-mr-1 -mt-1 rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Colour category, named in words as well as shown as a colour. */}
      <div className="mx-5 mt-3 flex items-center gap-2.5 rounded-xl border border-cyan-300/10 bg-white/[0.06] px-3 py-2">
        <span
          className="h-3.5 w-3.5 shrink-0 rounded-full ring-2 ring-white/25"
          style={{ backgroundColor: color }}
        />
        <div className="leading-tight">
          <div className="text-[13px] font-semibold text-white">{employee.color} — checked in {formatSimTime(employee.checkInTime)}</div>
          <div className="text-[11px] text-white/45">{CHECK_IN_BAND_LABEL[employee.color]} band</div>
        </div>
      </div>

      <div className="mx-5 mt-3 divide-y divide-white/[0.07]">
        <div className="pb-1">
          <Row label="Department" value={employee.department} />
          <Row label="Check-in" value={formatSimTime(employee.checkInTime)} />
          <Row label="Category" value={employee.color} />
        </div>
        <div className="py-1">
          <Row label="Food court" value={employee.visitsFoodCourt ? "Yes" : "No"} />
          <Row label="Food entry" value={timeOrDash(employee.foodCourtEntry)} />
          <Row label="Food exit" value={timeOrDash(employee.foodCourtExit)} />
        </div>
        <div className="py-1">
          <Row label="Ride" value={employee.rideName} />
          <Row label="Ride arrival" value={formatSimTime(employee.rideArrival)} />
          <Row label="Work start" value={formatSimTime(employee.workStart)} />
        </div>
      </div>

      {/* The number the whole visualisation exists to expose. */}
      <div className="mx-5 mb-3 mt-3 rounded-xl border border-sky-400/25 bg-sky-400/10 px-4 py-2.5">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-200/70">
          Total delay — check-in to work start
        </div>
        <div className="mt-0.5 text-2xl font-black tabular-nums text-white">
          {employee.reportedDelayMinutes} min
        </div>
        <div className="text-[11px] text-white/45">
          Delay band {employee.delayCategory}
        </div>
      </div>

      <div className="mx-5 mb-3 rounded-xl bg-white/[0.05] px-4 py-2 text-[11px] leading-relaxed text-white/55">
        <span className="text-white/40">Now — </span>
        {now ? PHASE_LABEL[now.phase] : "Has not arrived yet"}
      </div>

      {/* Travel with them and watch the journey happen. */}
      <button
        type="button"
        onClick={() => (following ? release() : follow(employee.id))}
        aria-pressed={following}
        className={[
          "mx-5 mb-4 flex w-[calc(100%-2.5rem)] items-center justify-center gap-2 rounded-xl px-4 py-2.5",
          "text-[12px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
          following
            ? "bg-sky-400/90 text-slate-950 hover:bg-sky-300"
            : "bg-white/10 text-white hover:bg-white/20",
        ].join(" ")}
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
          <path d="M8 1.5a2 2 0 110 4 2 2 0 010-4zM5.4 6.4h5.2l1.3 4.2-1.5.5-.9-2.7V14.5H9v-4H7v4H5.5V8.4l-.9 2.7-1.5-.5 1.3-4.2z" />
        </svg>
        {following ? "Following — click to stop" : "Follow this employee"}
      </button>

      <p className="px-5 pb-4 text-[11px] leading-relaxed text-white/35">
        Click another employee to switch, or press Esc to close.
      </p>
    </aside>
  );
}
