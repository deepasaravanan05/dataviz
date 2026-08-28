"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * The dashboard calendar, shared by the dashboard page and the Main Entrance.
 *
 * Defaults reproduce the original behaviour exactly — the real current month,
 * no navigation, no spill days — so the dashboard page is unaffected. The
 * entrance opts in to the fuller calendar: it opens on a fixed month, lets the
 * user page through the months, and greys in the adjacent-month days so every
 * week is a full row.
 *
 * `compact` only tightens spacing and type scale for the entrance overlay,
 * where the card sits over the 3D park and must stay out of its way.
 */

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const WEEKDAY_NAMES = [
  "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY",
];
const MONTHS = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
];

/** One cell: the day number, and which month it belongs to. */
interface Cell {
  day: number;
  outside: boolean;
}

/**
 * The weeks of `year`/`month`, Sunday-first.
 *
 * With `withAdjacent` the leading and trailing gaps are filled from the
 * neighbouring months instead of left blank, so July 2026 opens on
 * `28 29 30 1 2 3 4` exactly as a wall calendar would.
 */
function monthCells(year: number, month: number, withAdjacent: boolean): (Cell | null)[] {
  const lead = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();

  const cells: (Cell | null)[] = [];
  for (let i = 0; i < lead; i++) {
    cells.push(withAdjacent ? { day: prevDays - lead + 1 + i, outside: true } : null);
  }
  for (let d = 1; d <= days; d++) cells.push({ day: d, outside: false });
  if (withAdjacent) {
    // Fill out the final week only — never a whole trailing blank row.
    for (let d = 1; cells.length % 7 !== 0; d++) cells.push({ day: d, outside: true });
  }
  return cells;
}

export function CalendarCard({
  compact = false,
  initialYear,
  initialMonth,
  navigable = false,
  showAdjacentDays = false,
}: {
  compact?: boolean;
  /** Opening year. Defaults to the real current year. */
  initialYear?: number;
  /** Opening month, 0-based. Defaults to the real current month. */
  initialMonth?: number;
  /** Show ‹ › controls to page through the months. */
  navigable?: boolean;
  /** Fill the first and last weeks from the neighbouring months. */
  showAdjacentDays?: boolean;
}) {
  const [today, setToday] = useState<Date | null>(null);
  const fixed = initialYear !== undefined && initialMonth !== undefined;
  const [view, setView] = useState<{ y: number; m: number } | null>(
    fixed ? { y: initialYear, m: initialMonth } : null,
  );

  useEffect(() => {
    // Set after a frame so prerendered HTML and first client render agree.
    const id = requestAnimationFrame(() => {
      const now = new Date();
      setToday(now);
      // Only follow the real month when no opening month was requested.
      setView((v) => v ?? { y: now.getFullYear(), m: now.getMonth() });
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const cells = useMemo(
    () => (view ? monthCells(view.y, view.m, showAdjacentDays) : null),
    [view, showAdjacentDays],
  );

  /** Step whole months, letting Date roll the year over at the boundaries. */
  const step = (delta: number) =>
    setView((v) => {
      if (!v) return v;
      const d = new Date(v.y, v.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  const cell = compact ? "h-[1.35rem] w-[1.35rem] text-[10px]" : "h-6 w-6";

  /* The amber "today" pill only makes sense while the real month is on screen. */
  const isThisMonth =
    !!today && !!view && today.getFullYear() === view.y && today.getMonth() === view.m;

  return (
    <section
      aria-label="Calendar"
      className={[
        "rounded-2xl border border-amber-200/12 bg-[#1a1410]/72 shadow-2xl shadow-black/50 backdrop-blur-xl",
        compact ? "p-3.5" : "p-5",
      ].join(" ")}
    >
      {view && cells ? (
        <>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className={compact ? "text-[11px] font-semibold text-amber-300" : "text-sm font-semibold text-amber-300"}>
                {view.y}
              </div>
              <div className={compact ? "text-base font-bold tracking-wide text-white" : "text-2xl font-bold tracking-wide text-white"}>
                {MONTHS[view.m]}
              </div>
              <div className={[
                "font-semibold tracking-[0.2em] text-amber-300/80",
                compact ? "text-[9px]" : "text-[11px]",
              ].join(" ")}>
                {isThisMonth && today
                  ? WEEKDAY_NAMES[today.getDay()]
                  : WEEKDAY_NAMES[new Date(view.y, view.m, 1).getDay()]}
              </div>
            </div>

            {navigable && (
              <div className="flex shrink-0 items-center gap-1">
                {([["‹", -1, "Previous month"], ["›", 1, "Next month"]] as const).map(
                  ([glyph, delta, label]) => (
                    <button
                      key={label}
                      type="button"
                      aria-label={label}
                      onClick={() => step(delta)}
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-white/12 bg-white/[0.06] text-[13px] leading-none text-white/70 transition hover:border-amber-300/40 hover:bg-white/12 hover:text-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70"
                    >
                      {glyph}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>

          <div
            className={[
              "grid grid-cols-7 text-center tabular-nums",
              compact ? "mt-2 gap-y-0.5 text-[10px]" : "mt-3 gap-y-1.5 text-[12px]",
            ].join(" ")}
          >
            {WEEKDAYS.map((w) => (
              <div key={w} className={w === "SUN" ? "text-amber-300/80" : "text-white/50"}>
                {w}
              </div>
            ))}
            {cells.map((c, i) => (
              <div key={i} className="flex items-center justify-center">
                {c === null ? null : (
                  <span
                    className={[
                      "flex items-center justify-center rounded-full",
                      cell,
                      c.outside
                        ? "text-white/20"
                        : isThisMonth && c.day === today?.getDate()
                          ? "bg-amber-400 font-bold text-slate-950"
                          : i % 7 === 0
                            ? "text-amber-300/80"
                            : "text-white/80",
                    ].join(" ")}
                  >
                    {c.day}
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div
          className={[compact ? "h-40" : "h-56", "animate-pulse rounded-xl bg-white/5"].join(" ")}
          aria-hidden="true"
        />
      )}
    </section>
  );
}
