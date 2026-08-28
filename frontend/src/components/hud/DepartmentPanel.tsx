"use client";

import { useEffect, useMemo, useState } from "react";
import { useRideSelectionStore } from "@/store/rideSelectionStore";
import { useJourneyStore } from "@/store/journeyStore";
import { useActiveJourneyStore } from "@/simulation/journey/activeJourney";
import type { DepartmentRideId } from "@/components/park/departments";
import type { JourneyEmployee } from "@/simulation/journey/journey";
import { formatSimTime } from "@/simulation/clock";

/**
 * The ride information panel.
 *
 * Ordinary fixed-position HTML, not a 3D object: it lives in the DOM beside
 * the canvas, so it stays pinned to the top-right corner of the screen no
 * matter where the camera moves, and it never occludes or interacts with the
 * park itself.
 *
 * WHAT IT SHOWS. It used to print the department name and the ride name and
 * nothing else — two facts the ride's own signboard already carries. It now
 * answers the question the park exists to answer, for the department the
 * clicked ride serves: how many people are in it, how many of them have
 * actually started work by the current simulated minute, and who they are.
 *
 * READ-ONLY, AND ADD-ONLY. It reads three stores and writes to none of them.
 * It cannot pause a ride, move an employee, or wind the clock, because it
 * holds no reference to anything that could: every number below is derived
 * from the active roster and the published simulated minute, both of which are
 * produced whether this panel is open or not.
 */
export function DepartmentPanel() {
  const selected = useRideSelectionStore((s) => s.selected);
  const hoveredId = useRideSelectionStore((s) => s.hoveredId);
  const clear = useRideSelectionStore((s) => s.clear);

  // A pointer cursor while a ride is under the mouse, so it reads as clickable.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.cursor = hoveredId ? "pointer" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hoveredId]);

  if (!selected) return null;

  /*
   * Keyed by ride, so switching rides remounts the body and replays the
   * entrance animation. It also keeps the "shown" flag out of this component,
   * where flipping it back to false would mean a setState during an effect.
   *
   * Keying is also what guarantees there is only ever ONE panel: a second
   * selection replaces the first in the store, and React swaps the body in
   * place rather than stacking another panel beside it.
   */
  return (
    <PanelBody
      key={selected.rideId}
      rideId={selected.rideId}
      rideName={selected.rideName}
      fallbackDepartment={selected.department}
      onClose={clear}
    />
  );
}

/** One row of the members list, already resolved and formatted. */
interface Member {
  id: string;
  name: string;
  /** The dataset's own Actual Work Start minute, for sorting. */
  minute: number;
  time: string;
}

function PanelBody({
  rideId,
  rideName,
  fallbackDepartment,
  onClose,
}: {
  rideId: DepartmentRideId;
  rideName: string;
  fallbackDepartment: string;
  onClose: () => void;
}) {
  /** Drives the slide-and-fade in, one frame after the panel mounts. */
  const [shown, setShown] = useState(false);

  /*
   * THE TWO LIVE INPUTS.
   *
   * `employees` is the ACTIVE roster — the built-in dataset until an upload
   * swaps it — so an uploaded sheet re-populates this panel without the user
   * reopening it. `simTime` is the simulated minute the park is showing,
   * published by the frame loop once per simulated minute rather than once
   * per frame, which is exactly the granularity a clock display needs and
   * costs one re-render a minute instead of sixty a second.
   *
   * Subscribing to them is the whole of the panel's reactivity: when the clock
   * crosses somebody's work-start minute, this component re-renders, the
   * derivation below re-runs, the count goes up and the row appears. Nothing
   * has to be closed and reopened, and nothing polls.
   */
  const employees = useActiveJourneyStore((s) => s.employees);
  const simTime = useJourneyStore((s) => s.simTime);

  /* Everyone this ride serves, by the park's OWN existing department-to-ride
     mapping — the same one the signs, the routes and the employee panel use.
     No second mapping is introduced here. */
  const departmentEmployees = useMemo(
    () => employees.filter((e: JourneyEmployee) => e.rideId === rideId),
    [employees, rideId],
  );

  /*
   * The department name(s) this ride is actually serving right now, read off
   * the roster rather than off a constant, so an upload that renames or
   * re-splits a department is reflected here. The park has five rides and the
   * dataset six departments — IT Support and UI/UX share the Ferris Wheel —
   * so a ride can legitimately name more than one, joined the way every other
   * surface in the park joins them.
   */
  const department = useMemo(() => {
    const seen: string[] = [];
    for (const e of departmentEmployees) {
      if (!seen.includes(e.department)) seen.push(e.department);
    }
    return seen.length > 0 ? seen.join(" · ") : fallbackDepartment;
  }, [departmentEmployees, fallbackDepartment]);

  /*
   * WHO HAS ACTUALLY STARTED WORK.
   *
   * `workStart` is the dataset's Actual Work Start column, carried through the
   * journey builder untouched — not the delay, not the check-in, not the food
   * court, and not a time computed here. An employee joins the list at the
   * minute the simulated clock reaches that value and stays on it, sorted
   * earliest first.
   */
  const members = useMemo<Member[]>(
    () =>
      departmentEmployees
        .filter((e: JourneyEmployee) => simTime >= e.workStart)
        .map((e: JourneyEmployee) => ({
          id: e.id,
          name: e.name,
          minute: e.workStart,
          time: formatSimTime(e.workStart),
        }))
        .sort((a, b) => a.minute - b.minute || a.id.localeCompare(b.id)),
    [departmentEmployees, simTime],
  );

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Escape closes the panel.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-label={`${rideName} — ${department} work-start summary`}
      className={[
        "pointer-events-auto fixed right-4 top-20 z-50",
        // Narrows on small screens but never spills off the edge.
        "w-[min(20rem,calc(100vw-2rem))]",
        "rounded-2xl border border-cyan-300/12 bg-[#070b14]/80 shadow-2xl shadow-black/50 backdrop-blur-xl",
        "transition-all duration-300 ease-out motion-reduce:transition-none",
        shown ? "translate-x-0 opacity-100" : "translate-x-3 opacity-0",
      ].join(" ")}
    >
      {/* Ride and department on ONE line, with the close button beside them. */}
      <div className="flex items-start justify-between gap-3 px-5 pt-4">
        <h2 className="text-base font-bold leading-snug tracking-tight text-white">
          {rideName}
          <span className="px-1.5 text-white/35" aria-hidden="true">
            &bull;
          </span>
          <span className="text-sky-300">{department}</span>
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close ride panel"
          className="-mr-1 -mt-0.5 shrink-0 rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
            <path
              d="M5 5l10 10M15 5L5 15"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <div className="mx-5 mt-3 space-y-2">
        <Stat label="Total employees" value={departmentEmployees.length} />
        <Stat label="Actual work start" value={members.length} accent />
      </div>

      <div className="px-5 pb-4 pt-4">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Actual work start members
          </span>
          {members.length > 0 && (
            <span className="text-[10px] tabular-nums text-white/30">
              {members.length}/{departmentEmployees.length}
            </span>
          )}
        </div>

        {members.length === 0 ? (
          <p className="mt-2 text-[12px] leading-relaxed text-white/45">
            No employees have started work yet.
          </p>
        ) : (
          /*
           * ONLY the list scrolls. The page never does, and the header and the
           * two counts stay put while the roster grows underneath them. The
           * height is capped in viewport units as well as in rems, so on a
           * short screen the panel gives the list less room rather than
           * running off the bottom of the window.
           */
          <ul className="mt-2 max-h-[min(15rem,32vh)] space-y-1 overflow-y-auto pr-1">
            {members.map((m) => (
              <li
                key={m.id}
                className="flex items-baseline justify-between gap-3 rounded-lg bg-white/[0.05] px-2.5 py-1.5"
              >
                <span className="min-w-0">
                  <span className="block text-[12px] font-semibold tabular-nums text-white">
                    {m.id}
                  </span>
                  <span className="block truncate text-[10px] leading-tight text-white/40">
                    {m.name}
                  </span>
                </span>
                <span className="shrink-0 text-[12px] font-medium tabular-nums text-sky-200">
                  {m.time}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

/** One labelled count: small caps label over a large tabular number. */
function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-cyan-300/10 bg-white/[0.06] px-3.5 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
        {label}
      </div>
      <div
        className={[
          "mt-0.5 text-2xl font-black leading-none tabular-nums",
          accent ? "text-sky-300" : "text-white",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}
