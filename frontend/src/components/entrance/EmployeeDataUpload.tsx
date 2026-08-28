"use client";

import { useRef } from "react";
import { useEmployeeDataStore } from "@/store/employeeDataStore";
import { UPLOAD_ACCEPT, isSupportedFile } from "@/simulation/journey/employeeUpload";

/**
 * The entrance's single upload control.
 *
 * ONE control for all three formats, not one per format: the file picker's
 * own `accept` list is what offers Excel and CSV together, so the user makes
 * that choice in the place they are already choosing a file rather than
 * having to decide which of two buttons to press before they get there.
 *
 * It sits in the top-right corner the two navigation links used to occupy —
 * clear of the left-hand calendar and Department Check-In Overview column, of
 * the fast-travel bar across the top, and of the sky-theme button bottom-right
 * — and it is capped narrow so it can never grow over the park behind it.
 */

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 animate-spin" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={3} fill="none" opacity={0.25} />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function EmployeeDataUpload() {
  const input = useRef<HTMLInputElement>(null);
  const status = useEmployeeDataStore((s) => s.status);
  const fileName = useEmployeeDataStore((s) => s.fileName);
  const error = useEmployeeDataStore((s) => s.error);
  const rowCount = useEmployeeDataStore((s) => s.rows?.length ?? 0);
  const unmapped = useEmployeeDataStore((s) => s.unmappedDepartments);
  const upload = useEmployeeDataStore((s) => s.upload);

  const loading = status === "loading";

  function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    /*
     * Clear the input straight away, so picking the SAME file twice still
     * fires a change event — otherwise a corrected spreadsheet saved under its
     * original name would look like nothing happened.
     */
    event.target.value = "";
    if (!file) return;

    /* Reject the obvious case before touching the parser, so a wrong file
       comes back instantly rather than after a load. */
    if (!isSupportedFile(file.name)) {
      useEmployeeDataStore.setState({
        status: "error",
        fileName: null,
        rows: null,
        unmappedDepartments: [],
        error: `"${file.name}" is not supported. Choose an .xlsx, .xls or .csv file.`,
      });
      return;
    }
    void upload(file);
  }

  return (
    <div className="pointer-events-auto absolute right-4 top-16 z-30 flex w-[15.5rem] flex-col items-end gap-1.5">
      <input
        ref={input}
        type="file"
        accept={UPLOAD_ACCEPT}
        onChange={onPick}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />

      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={loading}
        aria-busy={loading}
        className={[
          "group flex w-full items-center justify-center gap-2 rounded-full",
          "border border-amber-200/15 bg-[#070b14]/82 px-4 py-2",
          "text-sm font-medium text-white shadow-lg shadow-black/40 backdrop-blur-xl",
          "transition hover:border-amber-200/35 hover:bg-[#0b1120]/90 hover:text-amber-100",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70",
          "disabled:cursor-wait disabled:opacity-80",
        ].join(" ")}
      >
        {loading ? (
          <Spinner />
        ) : (
          <UploadIcon className="h-3.5 w-3.5 text-amber-200/80 transition group-hover:text-amber-100" />
        )}
        <span className="whitespace-nowrap">
          {loading ? "Reading file…" : "Upload Employee Data"}
        </span>
      </button>

      {/* Status line. Only ever one of these, so the control stays compact. */}
      {status === "ready" && fileName && (
        <p className="max-w-full truncate rounded-full border border-emerald-300/20 bg-[#070b14]/82 px-3 py-1 text-[11px] text-emerald-200/90 shadow-lg shadow-black/30 backdrop-blur-xl">
          <span aria-hidden="true">✓ </span>
          {fileName}
          <span className="text-emerald-200/55"> · {rowCount} employees</span>
        </p>
      )}

      {status === "ready" && unmapped.length > 0 && (
        <p className="max-w-full rounded-2xl border border-amber-300/20 bg-[#070b14]/82 px-3 py-1 text-right text-[11px] leading-snug text-amber-200/85 shadow-lg shadow-black/30 backdrop-blur-xl">
          No ride serves: {unmapped.join(", ")}
        </p>
      )}

      {status === "error" && error && (
        <p
          role="alert"
          className="max-w-full rounded-2xl border border-rose-400/25 bg-[#070b14]/82 px-3 py-1.5 text-right text-[11px] leading-snug text-rose-200/90 shadow-lg shadow-black/30 backdrop-blur-xl"
        >
          {error}
        </p>
      )}

      {status === "idle" && (
        <p className="pr-3 text-[10px] text-white/35">Excel or CSV · .xlsx .xls .csv</p>
      )}
    </div>
  );
}
