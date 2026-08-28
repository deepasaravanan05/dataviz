"use client";

import { ParkScene } from "@/components/roller-coaster/ParkScene";
import { PlaceNav } from "@/components/hud/PlaceNav";
import { TimelineControls } from "@/components/hud/TimelineControls";
import { EntranceDashboard } from "@/components/entrance/EntranceDashboard";
import { EmployeeDataUpload } from "@/components/entrance/EmployeeDataUpload";
import { SkyThemeButton } from "@/components/world/SkyThemeButton";
import {
  ENTRANCE_CAMERA_POSITION,
  ENTRANCE_CAMERA_TARGET,
  ENTRANCE_FOV,
} from "@/components/world/entranceView";

/*
 * The framing lives in `entranceView.ts` so the verification suite can project
 * the roster through this exact camera and prove the employees are on screen.
 */

export default function EntrancePage() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#03050b]">
      <ParkScene
        cameraPosition={ENTRANCE_CAMERA_POSITION}
        cameraTarget={ENTRANCE_CAMERA_TARGET}
        cameraFov={ENTRANCE_FOV}
      />

      <PlaceNav showDashboardLink={false} />
      {/*
        The clock the whole visualisation runs on, on the main page at last:
        without it a visitor lands mid-day, when everyone is already standing
        at their ride, and concludes the park is empty. Play, pause, speed and
        the scrubber reach the arrival hour in one drag.
      */}
      <TimelineControls />
      <EntranceDashboard />
      <SkyThemeButton />

      {/*
        The top-right corner. The "Full park" and "Theme Park" links that stood
        here are gone — the fast-travel bar along the top already reaches every
        part of the park — and the single employee-data upload takes their slot.
      */}
      <EmployeeDataUpload />
    </main>
  );
}
