"use client";

import { useMemo } from "react";
import { departmentOverview, overviewTotals } from "@/simulation/journey/overview";
import { useActiveJourneyStore } from "@/simulation/journey/activeJourney";

/**
 * The Department Check-in Overview table, extracted from the dashboard page so
 * the Main Entrance can render the same table over the 3D park.
 *
 * Every number is counted live by `departmentOverview()` from the same
 * dataset the park animates — nothing here is hardcoded. The component is a
 * pure function of `simTime`, so each caller supplies its own clock: the
 * dashboard page drives one itself, while the entrance reads the journey store
 * that the park's own clock already publishes.
 *
 * `compact` tightens the table for the entrance overlay and drops the footnote;
 * the columns and the numbers are identical in both.
 */

/** One fixed hue per department for its icon chip, in dataset order. */
const DEPT_HUES = ["#4ade80", "#fbbf24", "#38bdf8", "#a78bfa", "#fb7185", "#34d399", "#f97316"];

export function DepartmentOverview({
  simTime,
  compact = false,
}: {
  simTime: number;
  compact?: boolean;
}) {
  // The ACTIVE roster — built-in until an upload swaps it.
  const employees = useActiveJourneyStore((s) => s.employees);
  const rows = useMemo(() => departmentOverview(simTime, employees), [simTime, employees]);
  const totals = useMemo(() => overviewTotals(rows), [rows]);

  const pad = compact ? "py-1.5" : "py-2.5";
  const num = compact ? "text-[13px]" : "text-[15px]";

  return (
    <section
      aria-label="Department check-in overview"
      className={[
        "rounded-2xl border border-amber-200/12 bg-[#1a1410]/72 shadow-2xl shadow-black/50 backdrop-blur-xl",
        compact ? "p-3.5" : "p-5",
      ].join(" ")}
    >
      <h2
        className={[
          "font-bold tracking-wide text-white",
          compact ? "text-[11px] uppercase tracking-[0.14em] text-amber-200/85" : "text-base",
        ].join(" ")}
      >
        DEPARTMENT CHECK-IN OVERVIEW
      </h2>
      <div className={compact ? "mt-2" : "mt-4 overflow-x-auto"}>
        <table
          className={[
            "w-full border-collapse text-left",
            compact ? "" : "min-w-[520px]",
          ].join(" ")}
        >
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
                <td className={`${pad} pr-3`}>
                  <div className="flex items-center gap-2.5">
                    <span
                      className={[
                        "flex shrink-0 items-center justify-center rounded-md font-black text-slate-950",
                        compact ? "h-5 w-5 text-[9px]" : "h-6 w-6 text-[10px]",
                      ].join(" ")}
                      style={{ backgroundColor: DEPT_HUES[i % DEPT_HUES.length] }}
                    >
                      {r.department.slice(0, 1)}
                    </span>
                    <div className="leading-tight">
                      <div
                        className={[
                          "font-medium text-white/90",
                          compact ? "text-[11px]" : "text-[13px]",
                        ].join(" ")}
                      >
                        {r.department}
                      </div>
                      {/* Compact drops the average so each row stays two lines. */}
                      <div
                        className={
                          compact
                            ? "truncate text-[9px] text-white/40"
                            : "text-[10px] text-white/40"
                        }
                      >
                        {compact
                          ? `${r.rideName} · ${r.size} staff`
                          : `${r.rideName} · ${r.size} staff · avg ${r.avgDelay.toFixed(1)} min`}
                      </div>
                    </div>
                  </div>
                </td>
                <td className={`${pad} pr-3 text-right ${num} font-bold tabular-nums text-emerald-300`}>
                  {r.checkedIn}
                </td>
                <td className={`${pad} pr-3 text-right ${num} font-bold tabular-nums text-amber-300`}>
                  {r.delayed}
                </td>
                <td className={`${pad} text-right ${num} font-bold tabular-nums text-sky-300`}>
                  {r.started}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className={[compact ? "pt-2 text-[11px]" : "pt-3 text-sm", "font-bold tracking-wide text-white/85"].join(" ")}>
                TOTAL
              </td>
              <td className={[compact ? "pt-2 text-[15px]" : "pt-3 text-lg", "pr-3 text-right font-black tabular-nums text-emerald-300"].join(" ")}>
                {totals.checkedIn}
              </td>
              <td className={[compact ? "pt-2 text-[15px]" : "pt-3 text-lg", "pr-3 text-right font-black tabular-nums text-amber-300"].join(" ")}>
                {totals.delayed}
              </td>
              <td className={[compact ? "pt-2 text-[15px]" : "pt-3 text-lg", "text-right font-black tabular-nums text-sky-300"].join(" ")}>
                {totals.started}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      {!compact && (
        <p className="mt-4 text-[11px] leading-relaxed text-white/40">
          Check-in counts employees who have passed the main gate; actual work start counts
          those already working; delayed is everyone in between, still walking, eating or
          queueing. The columns follow the simulation clock — of {totals.size} employees, the
          delayed column drains to zero as the morning completes.
        </p>
      )}
    </section>
  );
}
