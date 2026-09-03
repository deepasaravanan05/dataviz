"use client";

import { useRef } from "react";
import { useEmployeeDataStore } from "@/store/employeeDataStore";
import { UPLOAD_ACCEPT } from "@/simulation/journey/employeeUpload";

/**
 * The entrance's single upload control.
 *
 * ONE control that takes ANY file: the picker is not filtered by extension,
 * and the reader works out the format from the bytes, so nothing a user has to
 * hand is greyed out or handed back before it has been opened.
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
  const notes = useEmployeeDataStore((s) => s.notes);
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

    /*
     * STRAIGHT TO THE PARSER, whatever the file is called. There used to be an
     * extension check here that handed a file back before it had been opened,
     * which meant a roster saved as .txt, .tsv, .ods or with no extension at
     * all was refused on the strength of its NAME. The parser reads the bytes
     * and works out what it is holding.
     */
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

      {/*
        * What the upload absorbed rather than refused. Deliberately in the
        * same quiet slate as the rest of the panel and NOT in the error red:
        * none of these is a thing the user has to go and fix — the file was
        * accepted, and this is the reading of it.
        */}
      {status === "ready" && notes.length > 0 && (
        <p className="max-w-full rounded-2xl border border-white/10 bg-[#070b14]/82 px-3 py-1 text-right text-[11px] leading-snug text-white/55 shadow-lg shadow-black/30 backdrop-blur-xl">
          {notes.join(" · ")}
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
        <p className="pr-3 text-[10px] text-white/35">Any spreadsheet or table · Excel, CSV, TSV, text</p>
      )}
    </div>
  );
}
