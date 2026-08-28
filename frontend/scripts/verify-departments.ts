import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DEPARTMENT_BY_RIDE,
  DEPARTMENTS,
  RIDE_DEPARTMENTS,
  departmentFor,
  rideForDepartment,
  validateDepartments,
  type DepartmentRideId,
} from "../src/components/park/departments";
import { DATASET_DEPARTMENTS } from "../src/simulation/journey/dataset";
import { PARK_LAYOUT, rideById } from "../src/components/park/layout";
import { useRideSelectionStore } from "../src/store/rideSelectionStore";

let failures = 0;
function check(label: string, ok: boolean, detail: string) {
  if (!ok) failures++;
  console.log(`[${ok ? "PASS" : "FAIL"}] ${label} — ${detail}`);
}

validateDepartments();

const root = join(__dirname, "..");
const read = (...p: string[]) => readFileSync(join(root, ...p), "utf8");
const scene = read("src", "components", "roller-coaster", "ParkScene.tsx");
const panel = read("src", "components", "hud", "DepartmentPanel.tsx");
const selectable = read("src", "components", "park", "SelectableRide.tsx");
const store = read("src", "store", "rideSelectionStore.ts");
const layout = read("src", "app", "layout.tsx");

// ============ 1. The mapping covers the dataset, over the real rides ============
/*
 * The attendance roster carries SIX departments and the park has five rides.
 * The user's standing instruction: employees whose department has no ride of
 * its own are converted to existing rides — never to new destinations. So
 * every dataset department must resolve to a real ride, the Ferris Wheel
 * serves two, and no invented department may survive anywhere.
 */
check("exactly five department rides", RIDE_DEPARTMENTS.length === 5, `${RIDE_DEPARTMENTS.length}`);
check("exactly six departments", DEPARTMENTS.length === 6, `${DEPARTMENTS.length}`);
for (const d of DATASET_DEPARTMENTS) {
  check(`${d} is mapped to a ride`, DEPARTMENTS.some((r) => r.department === d), d);
}
check(
  "the mapping holds ONLY dataset departments — nothing invented",
  DEPARTMENTS.every((d) => DATASET_DEPARTMENTS.includes(d.department)),
  DEPARTMENTS.map((d) => d.department).join(", "),
);
check(
  "every department name is distinct",
  new Set(DEPARTMENTS.map((d) => d.department)).size === DEPARTMENTS.length,
  DEPARTMENTS.map((d) => d.department).join(", "),
);
check(
  "every ride serves at least one department",
  RIDE_DEPARTMENTS.every((r) => r.departments.length >= 1),
  RIDE_DEPARTMENTS.map((r) => `${r.rideId}:${r.departments.length}`).join(", "),
);
check(
  "departments the roster dropped are gone — no DEVOPS, Finance or Operations",
  ["DEVOPS", "Finance", "Operations"].every((gone) =>
    DEPARTMENTS.every((d) => d.department !== gone),
  ),
  "only the six departments the attendance sheet names",
);

// The pairings, using this park's actual ride names.
const EXPECTED: [string, string][] = [
  ["Tech", "Roller Coaster"],
  ["Cyber Security", "Dragon Ride"],
  ["Data Engineering", "Drop Tower"],
  ["ERP", "Monster Ride"],
  ["IT Support", "Ferris Wheel"],
  ["UI/UX", "Ferris Wheel"],
];
for (const [dept, ride] of EXPECTED) {
  const found = rideForDepartment(dept);
  check(`${dept} -> ${ride}`, found.rideName === ride, `${dept} -> ${found.rideName}`);
}
check(
  "every EXPECTED pairing is checked — the table covers the whole roster",
  EXPECTED.length === DEPARTMENTS.length &&
    EXPECTED.every(([d]) => DATASET_DEPARTMENTS.includes(d)),
  `${EXPECTED.length} pairings for ${DEPARTMENTS.length} departments`,
);
check(
  "the shared ride announces BOTH its departments",
  departmentFor("ferris").department.includes("IT Support") &&
    departmentFor("ferris").department.includes("UI/UX"),
  `ferris: "${departmentFor("ferris").department}", monster: "${departmentFor("monster").department}"`,
);
check(
  "no ride was added or renamed to fit the new roster",
  RIDE_DEPARTMENTS.map((r) => r.rideId).join(",") === "coaster,dragon,ferris,tower,monster",
  RIDE_DEPARTMENTS.map((r) => `${r.rideId}=${r.rideName}`).join(", "),
);

// ============ 2. Ride names come from the park, not retyped ============
check(
  "every mapped id is a real ride in the park layout",
  DEPARTMENTS.every((d) => PARK_LAYOUT.some((r) => r.id === d.rideId)),
  `layout has ${PARK_LAYOUT.map((r) => r.id).join(", ")}`,
);
check(
  "ride names are read back out of the layout, so they cannot drift",
  RIDE_DEPARTMENTS.every((d) => d.rideName === rideById(d.rideId).label),
  "names match the layout exactly",
);
check(
  "no ride was renamed to suit the mapping",
  !/label:\s*"/.test(read("src", "components", "park", "departments.ts")),
  "departments.ts declares no ride names of its own",
);

// ============ 3. Only one panel can ever be open ============
{
  const s = useRideSelectionStore.getState();
  s.clear();
  check("nothing is selected initially", useRideSelectionStore.getState().selected === null, "null");

  s.select("coaster");
  const first = useRideSelectionStore.getState().selected;
  check("clicking a ride selects it", first?.department === "Tech", `${first?.department}`);

  s.select("dragon");
  const second = useRideSelectionStore.getState().selected;
  check(
    "selecting another ride replaces the first — never two at once",
    second?.department === "Cyber Security",
    `Tech -> ${second?.department}`,
  );
  check(
    "the store holds a single selection, not a list",
    !Array.isArray(useRideSelectionStore.getState().selected),
    "one slot only",
  );

  s.clear();
  check("clear closes the panel", useRideSelectionStore.getState().selected === null, "null");
}

// ============ 4. Every mapped ride resolves ============
for (const id of ["coaster", "dragon", "ferris", "tower", "monster"] as DepartmentRideId[]) {
  const d = departmentFor(id);
  check(
    `${d.rideName} is clickable and resolves to ${d.department}`,
    Boolean(DEPARTMENT_BY_RIDE[id]) && d.rideId === id,
    `${id} -> ${d.department}`,
  );
  check(
    `${d.rideName} is wrapped as selectable in the scene`,
    new RegExp(`<SelectableRide id="${id}">`).test(scene),
    "wrapper present",
  );
}
check(
  "all five rides — and only those — are wrapped",
  (scene.match(/<SelectableRide id=/g) ?? []).length === 5,
  `${(scene.match(/<SelectableRide id=/g) ?? []).length} wrappers`,
);

// ============ 5. The panel is DOM, top-right, and accessible ============
check(
  "the panel is real HTML, not a 3D object",
  !/@react-three|drei|<mesh|<group|Html/.test(panel),
  "no three.js or drei import anywhere in the panel",
);
check(
  "the panel is fixed to the top-right of the screen",
  /fixed/.test(panel) && /right-4/.test(panel) && /top-\d/.test(panel),
  "fixed, right-4, pinned near the top",
);
check(
  "the panel narrows on small screens instead of overflowing",
  /w-\[min\(20rem,calc\(100vw-2rem\)\)\]/.test(panel),
  "width clamps to the viewport",
);
/*
 * These three used to pin the panel's original two-field layout: a `text-3xl`
 * department heading, a "Department" label, a "Ride" label, and a close button
 * whose aria-label read "Close department panel". That layout has been
 * replaced by the work-start summary at the user's request, so pinning it
 * would only assert that a superseded design survived. What each check was
 * really protecting is asserted instead: one prominent header carrying both
 * names, every figure labelled in words rather than by position or colour, and
 * a close button a screen reader can announce.
 *
 * The panel's own arithmetic — the counts, the filter and the ordering — is
 * swept across every ride and every minute of the day in verify-ride-panel.ts.
 */
check(
  "the ride and its department share one prominent header line",
  /<h2[\s\S]*?\{rideName\}[\s\S]{0,240}\{department\}[\s\S]*?<\/h2>/.test(panel) &&
    (panel.match(/<h2/g) ?? []).length === 1,
  "one heading holds both names, separated inline",
);
check("the ride name is shown too", /\{rideName\}/.test(panel), "ride name present");
check(
  "information is conveyed as text, not colour alone",
  /Total employees/.test(panel) &&
    /Actual work start/.test(panel) &&
    /Actual work start members/.test(panel),
  "every count and the list are labelled in words",
);
check(
  "the close button has an accessible label",
  /aria-label="Close [a-z ]*panel"/.test(panel),
  "labelled for screen readers",
);
check(
  "the panel is announced as a dialog with a name",
  /role="dialog"/.test(panel) && /aria-label=\{/.test(panel),
  "role and accessible name present",
);
check(
  "the close button is keyboard focusable with a visible focus ring",
  /<button/.test(panel) && /focus-visible:ring/.test(panel),
  "native button plus focus styling",
);
check(
  "the appearance is animated, and respects reduced motion",
  /transition-all/.test(panel) && /motion-reduce:transition-none/.test(panel),
  "slides and fades in, or not, per the user's preference",
);
check(
  "glass styling as specified",
  /backdrop-blur/.test(panel) && /rounded-2xl/.test(panel) && /border/.test(panel) && /shadow/.test(panel),
  "blur, rounded corners, border, shadow",
);

// ============ 6. Three ways to close ============
check(
  "the X button closes the panel",
  /onClick=\{onClose\}/.test(panel) && /onClose=\{clear\}/.test(panel),
  "close button wired through to clear()",
);
check(
  "Escape closes the panel",
  /e\.key === "Escape"/.test(panel) && /addEventListener\("keydown"/.test(panel),
  "keydown listener closes the panel",
);
check(
  "clicking empty park space closes the panel",
  /onPointerMissed=\{[\s\S]{0,120}?clearRideSelection\(\)/.test(scene),
  "the canvas clears the selection on a miss",
);
check(
  "the keydown listener is removed again",
  /removeEventListener\("keydown"/.test(panel),
  "no listener left behind",
);

// ============ 7. Hover feedback, without altering the ride ============
check(
  "hovering a ride is tracked",
  /onPointerOver/.test(selectable) && /setHovered/.test(selectable),
  "pointer over/out set the hovered ride",
);
check(
  "the cursor shows the ride is interactive",
  /cursor = hoveredId \? "pointer"/.test(panel),
  "pointer cursor while over a ride",
);
check(
  "the highlight is a separate marker, not a change to the ride",
  /meshBasicMaterial/.test(selectable) && !/emissive=/.test(selectable),
  "an outline drawn beside the ride; its own materials are untouched",
);
check(
  "the wrapper renders its children unchanged",
  /\{children\}/.test(selectable) && !/cloneElement|React\.Children/.test(selectable),
  "no ride geometry or transform is rewritten",
);

// ============ 8. Nothing is paused ============
check(
  "no ride component reads the selection store",
  ["roller-coaster", "ferris-wheel", "monster-ride", "park-train", "dragon-ride", "drop-tower"].every(
    (dir) =>
      !readFileSync(join(root, "src", "components", dir, "constants.ts"), "utf8").includes(
        "rideSelectionStore",
      ),
  ),
  "rides cannot be gated by selection — they keep animating",
);
for (const [file, label] of [
  ["src/components/ferris-wheel/FerrisWheel.tsx", "Ferris Wheel"],
  ["src/components/dragon-ride/DragonRide.tsx", "Dragon Ride"],
  ["src/components/drop-tower/DropTower.tsx", "Drop Tower"],
  ["src/components/park-train/ParkTrain.tsx", "Park Train"],
] as const) {
  const text = read(...file.split("/"));
  check(
    `${label} keeps animating regardless of selection`,
    /useFrame/.test(text) && !/rideSelectionStore|selected/.test(text),
    "its animation loop is unconditional",
  );
}
check(
  "the simulation store is untouched by selection",
  // An actual import, not a passing mention in a comment.
  !/from "[^"]*simulationStore"/.test(store) &&
    !/from "[^"]*rideSelectionStore"/.test(read("src", "store", "simulationStore.ts")),
  "clock, employees, queues and dispatch live in a store neither side imports",
);
/*
 * This used to forbid the panel from mentioning the clock or the employees at
 * all, which was the simplest way to guarantee it could not disturb them while
 * it showed nothing but two names. It now has to show how many of a department
 * have started work, so it necessarily READS both.
 *
 * The property that actually matters is unchanged and is asserted directly: it
 * may read, and it may not write. No clock mutator, no roster mutator, and no
 * reference to the rides' own simulation store — so no ride, no employee and
 * no minute can be moved from here however the panel is used.
 */
check(
  "the panel reads the simulation but cannot change it",
  !/useSimulationStore/.test(panel) &&
    !/seekJourneyClock|setJourneyPaused|setJourneySpeed|advanceJourneyClock|resetJourneyClock|setSimTime|activateJourney/.test(
      panel,
    ),
  "it subscribes to the published minute and the active roster, and imports no mutator for either",
);

// ============ 9. ADD-ONLY ============
check(
  "the panel is mounted once, in the app layout",
  /<DepartmentPanel \/>/.test(layout),
  "one instance for every page",
);
check(
  "the highlight renders in world space, outside every ride scale group",
  /<RideHighlights \/>/.test(scene) && !/<group scale=\{(PARK_SCALE|TRAIN_SCALE)\}>\s*<RideHighlights/.test(scene),
  "markers are not scaled with the rides",
);
check(
  "no ride module imports the selection machinery",
  ["roller-coaster/RollerCoaster.tsx", "ferris-wheel/FerrisWheel.tsx", "dragon-ride/DragonRide.tsx", "drop-tower/DropTower.tsx", "monster-ride/MonsterRide.tsx"].every(
    (f) => !read("src", "components", ...f.split("/")).includes("SelectableRide"),
  ),
  "rides are wrapped from outside, never edited",
);

// ============ Summary ============
console.log("\nDepartment mapping:");
for (const d of RIDE_DEPARTMENTS) {
  console.log(`  ${d.department.padEnd(8)} -> ${d.rideName.padEnd(15)} (${d.rideId})`);
}
console.log("\nPanel: fixed top-right, DOM overlay; closes via X, Escape, or clicking empty park.");

console.log(failures === 0 ? "\nOK: department labels verified." : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
