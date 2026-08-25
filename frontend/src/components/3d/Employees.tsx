"use client";

import { useMemo } from "react";
import { useSimulationStore } from "@/store/simulationStore";
import { EmployeeAvatar } from "./EmployeeAvatar";

/** Employee ids are fixed for the lifetime of a Phase 1 session. */
export function Employees() {
  const ids = useMemo(() => useSimulationStore.getState().employees.map((e) => e.id), []);
  return (
    <>
      {ids.map((id) => (
        <EmployeeAvatar key={id} employeeId={id} />
      ))}
    </>
  );
}
