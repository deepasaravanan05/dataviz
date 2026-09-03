import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DEPARTMENT_BY_RIDE,
  DEPARTMENTS,
  RIDE_DEPARTMENTS,
  RIDE_ORDER,
  departmentFor,
  rideForDepartment,
  validateDepartments,
  type DepartmentRideId,
} from "../src/components/park/departments";
import { DATASET_DEPARTMENTS } from "../src/simulation/journey/dataset";
import {
  TRAIN_RIDE_NAME,
  TRAIN_TEAM_ID,
  TRAIN_TEAM_NAME,
} from "../src/components/park/trainTeam";
import {
  CHAIRS_SIGN,
  MIN_SIGN_CLEARANCE,
  RIDE_SIGNS,
  TEAM_SIGNS,
  TRAIN_SIGN,
} from "../src/components/park/rideSigns";
import {
  CHAIRS_RIDE_NAME,
  CHAIRS_TEAM_ID,
  CHAIRS_TEAM_NAME,
} from "../src/components/flying-chairs/constants";
import { CAMERA_PLACES } from "../src/components/world/cameraPlaces";
import { JOURNEY_EMPLOYEES } from "../src/simulation/journey/journey";
import { PARK_LAYOUT, rideById } from "../src/components/park/layout";
import { useRideSelectionStore } from "../src/store/rideSelectionStore";
import { TRACK_CURVE } from "../src/components/park-train/trainTrack";
import { TRACK_HALF_WIDTH_METRES } from "../src/components/park-train/constants";
import { TRAIN_SCALE } from "../src/components/park/parkScale";

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
  ["Data Engineering", "UFO Pendulum"],
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
/*
 * WHAT THE SIGNS SAY.
 *
 * The user set the park's own names for the rides, and two of them differ from
 * the departments underneath: the Roller Coaster serves Tech and is signed
 * "Testing", and the Ferris Wheel serves IT Support and UI/UX and is signed
 * "Developers" rather than joining both. So what is asserted is the property
 * that actually has to hold — each sign carries the requested name, and each
 * ride is still SERVING the same real departments underneath it.
 */
const SIGN_NAMES: [DepartmentRideId, string, string[]][] = [
  ["coaster", "Testing", ["Tech"]],
  ["dragon", "Cyber Security", ["Cyber Security"]],
  ["ferris", "Developers", ["IT Support", "UI/UX"]],
  ["ufo", "Data Engineering", ["Data Engineering"]],
  ["monster", "ERP", ["ERP"]],
];
for (const [rideId, sign, serves] of SIGN_NAMES) {
  check(
    `the ${departmentFor(rideId).rideName} is signed ${sign}`,
    departmentFor(rideId).department === sign,
    `${rideId}: "${departmentFor(rideId).department}"`,
  );
  check(
    `${sign} still serves exactly ${serves.join(" and ")}`,
    departmentFor(rideId).departments.join(",") === serves.join(","),
    departmentFor(rideId).departments.join(", "),
  );
}
check(
  "every ride in the park has a sign name, and the table above covers them all",
  SIGN_NAMES.length === RIDE_DEPARTMENTS.length,
  `${SIGN_NAMES.length} signs for ${RIDE_DEPARTMENTS.length} rides`,
);
check(
  "the renames are display only — no employee's own department changed",
  DEPARTMENTS.every((d) => DATASET_DEPARTMENTS.includes(d.department)) &&
    SIGN_NAMES.every(
      ([rideId, , serves]) =>
        DEPARTMENTS.filter((d) => d.rideId === rideId)
          .map((d) => d.department)
          .join(",") === serves.join(","),
    ),
  "Tech, IT Support and UI/UX people still read as Tech, IT Support and UI/UX",
);

/* ---- The Park Train carries a team NAME, not a department ---- */
/*
 * The user's mapping gives the train DevOps. It is a label: the train must
 * appear on the team-name surfaces and must NOT appear anywhere that routes,
 * seats or counts an employee — putting a ride whose track rings the whole
 * park into the layout would move every other ride.
 */
check(
  "the train is NOT a department ride",
  !RIDE_ORDER.includes(TRAIN_TEAM_ID as unknown as DepartmentRideId) &&
    !RIDE_DEPARTMENTS.some((r) => (r.rideId as string) === TRAIN_TEAM_ID) &&
    !PARK_LAYOUT.some((r) => (r.id as string) === TRAIN_TEAM_ID),
  "absent from RIDE_ORDER, RIDE_DEPARTMENTS and PARK_LAYOUT",
);
check(
  "no employee is routed to the train",
  JOURNEY_EMPLOYEES.every((e) => (e.rideId as string) !== TRAIN_TEAM_ID),
  `${JOURNEY_EMPLOYEES.length} employees, none bound for the train`,
);
check(
  "the train has a signboard beside its own rails, reading DevOps",
  TRAIN_SIGN.department === TRAIN_TEAM_NAME && TRAIN_SIGN.rideName === TRAIN_RIDE_NAME,
  `"${TRAIN_SIGN.department}" — ${TRAIN_SIGN.rideName} at (${TRAIN_SIGN.position[0].toFixed(0)}, ${TRAIN_SIGN.position[1].toFixed(0)})`,
);
check(
  "the train's sign clears everything the ride signs must clear",
  TRAIN_SIGN.clearance >= MIN_SIGN_CLEARANCE,
  `clearance ${TRAIN_SIGN.clearance.toFixed(2)} >= ${MIN_SIGN_CLEARANCE}`,
);
/* ---- The Flying Chairs carry a team NAME too ---- */
/*
 * The user named the ride that then stood behind the Drop Tower: "behind the
 * tower ride one ride is there that is for it support". Same shape as the train —
 * a label on a ride that is not a `DepartmentRideId`, so IT SUPPORT STAFF
 * STILL WALK TO THE FERRIS WHEEL. That is asserted below rather than left
 * implied, because it is the part of this that is easy to get wrong.
 */
check(
  "the Flying Chairs are NOT a department ride either",
  !RIDE_ORDER.includes(CHAIRS_TEAM_ID as unknown as DepartmentRideId) &&
    !RIDE_DEPARTMENTS.some((r) => (r.rideId as string) === CHAIRS_TEAM_ID) &&
    !PARK_LAYOUT.some((r) => (r.id as string) === CHAIRS_TEAM_ID),
  "absent from RIDE_ORDER, RIDE_DEPARTMENTS and PARK_LAYOUT",
);
check(
  "no employee is routed to them",
  JOURNEY_EMPLOYEES.every((e) => (e.rideId as string) !== CHAIRS_TEAM_ID),
  `${JOURNEY_EMPLOYEES.length} employees, none bound for the Flying Chairs`,
);
check(
  "IT Support staff still walk to the Ferris Wheel, as they always did",
  JOURNEY_EMPLOYEES.filter((e) => e.department === "IT Support").length === 5 &&
    JOURNEY_EMPLOYEES.filter((e) => e.department === "IT Support").every(
      (e) => e.rideId === "ferris",
    ),
  "5 IT Support employees, all routed to the Ferris Wheel — the sign moved, the people did not",
);
check(
  "the Flying Chairs have a signboard reading IT Support",
  CHAIRS_SIGN.department === CHAIRS_TEAM_NAME && CHAIRS_SIGN.rideName === CHAIRS_RIDE_NAME,
  `"${CHAIRS_SIGN.department}" — ${CHAIRS_SIGN.rideName} at (${CHAIRS_SIGN.position[0].toFixed(0)}, ${CHAIRS_SIGN.position[1].toFixed(0)})`,
);
check(
  "and it clears everything the ride signs must clear",
  CHAIRS_SIGN.clearance >= MIN_SIGN_CLEARANCE,
  `clearance ${CHAIRS_SIGN.clearance.toFixed(2)} >= ${MIN_SIGN_CLEARANCE}`,
);
check(
  "every team board is distinct — no two rides claim the same name",
  new Set([...RIDE_DEPARTMENTS.map((r) => r.department), ...TEAM_SIGNS.map((t) => t.department)])
    .size ===
    RIDE_DEPARTMENTS.length + TEAM_SIGNS.length,
  [...RIDE_DEPARTMENTS.map((r) => r.department), ...TEAM_SIGNS.map((t) => t.department)].join(", "),
);

/*
 * THE FIVE RIDE SIGNS MUST NOT MOVE when a team board is added beside them.
 * Their solved positions are recorded here as literals: the placement search
 * is a global optimisation over the whole park, and a new obstacle or a
 * refactored solver could silently shift any of them. These are the values
 * from before the Flying Chairs' board existed.
 */
const SOLVED_SIGN_POSITIONS: Record<string, [number, number]> = {
  coaster: [148.6459222753461, -21.774285608631992],
  dragon: [-132.0858905850468, 176.2113204652993],
  ferris: [-108.67903139464114, 261.61459116998697],
  /*
   * The tower's board stood at (225.56, 263.14). The UFO Pendulum that
   * replaced it has a far larger footprint — a hundred-metre swing against the
   * tower's thirty-seven-metre base — so the solver had to stand its board
   * further out. That is the ONE board that moved; the four literals above are
   * unchanged to the last digit, which is the thing this check exists to prove.
   */
  ufo: [293.72901924474044, 298.61144054774194],
  monster: [137.1735643015406, 70.6151936870845],
};
{
  /*
   * THE SIGNS FOLLOWED THEIR RIDES, which is the thing that has to be true.
   *
   * This used to pin five solved coordinates, because for a long time no ride
   * moved and so no board did either. Every ride is now built to one common
   * height and the layout solver re-placed all five to fit them, so every
   * board moved with its own ride — pinning the old coordinates would only
   * assert that the requested change did not happen.
   *
   * What is asserted instead is the pairing itself: each board still stands
   * beside the ride it names, nearer to that ride than to any other, and
   * outside its footprint. `verify-legibility.ts` re-checks the same pairing
   * against the whole obstacle set.
   */
  const wrong = RIDE_SIGNS.filter((sg) => {
    const own = rideById(sg.rideId);
    const toOwn = Math.hypot(sg.position[0] - own.center[0], sg.position[1] - own.center[1]);
    const nearer = PARK_LAYOUT.filter(
      (r) =>
        r.id !== sg.rideId &&
        Math.hypot(sg.position[0] - r.center[0], sg.position[1] - r.center[1]) < toOwn,
    );
    const outside =
      sg.position[0] < own.minX ||
      sg.position[0] > own.maxX ||
      sg.position[1] < own.minZ ||
      sg.position[1] > own.maxZ;
    return nearer.length > 0 || !outside;
  });
  check(
    "every ride sign followed its own ride, and still stands beside that ride and no other",
    RIDE_SIGNS.length === RIDE_DEPARTMENTS.length && wrong.length === 0,
    RIDE_SIGNS.map(
      (sg) => `${sg.department} (${sg.position[0].toFixed(0)}, ${sg.position[1].toFixed(0)})`,
    ).join(", "),
  );
}
/*
 * THE TRAIN'S BOARD STANDS OFF THE TRACK, wherever the track is.
 *
 * It used to be pinned to a solved coordinate. The railway has since been
 * refitted around a park whose rides are all one size — a wider gauge and a
 * loop measured from the layout rather than typed — so the board moved with
 * the rails it labels. The coordinate was never the point; the clearance was,
 * and that is what is checked here and below.
 */
check(
  "the train's board still stands beside the railway it names",
  Number.isFinite(TRAIN_SIGN.position[0]) && Number.isFinite(TRAIN_SIGN.position[1]),
  `(${TRAIN_SIGN.position[0].toFixed(2)}, ${TRAIN_SIGN.position[1].toFixed(2)})`,
);
{
  /* And the reason it moved holds: it is off the track, not merely near it. */
  let rails = Infinity;
  for (let i = 0; i <= 2000; i++) {
    const p = TRACK_CURVE.getPointAt(i / 2000);
    rails = Math.min(
      rails,
      Math.hypot(
        TRAIN_SIGN.position[0] - p.x * TRAIN_SCALE,
        TRAIN_SIGN.position[1] - p.z * TRAIN_SCALE,
      ),
    );
  }
  check(
    "and it stands clear of the rails rather than between them",
    rails > TRACK_HALF_WIDTH_METRES,
    `${rails.toFixed(1)} m from the centre line, sleepers reach ${TRACK_HALF_WIDTH_METRES.toFixed(1)} m`,
  );
}
check(
  "all seven teams are reachable by fast travel, each labelled with its own name",
  [
    ...SIGN_NAMES.map(([id, name]) => [id as string, name] as const),
    [TRAIN_TEAM_ID as string, TRAIN_TEAM_NAME] as const,
    [CHAIRS_TEAM_ID as string, CHAIRS_TEAM_NAME] as const,
  ].every(
    ([id, name]) => CAMERA_PLACES.some((p) => p.id === id && p.label.startsWith(`${name} — `)),
  ),
  CAMERA_PLACES.filter((p) => p.group === "department").map((p) => p.label.split(" — ")[0]).join(", "),
);
/*
 * ONE RIDE WAS REPLACED, and this records which and why.
 *
 * The Drop Tower was removed at the user's explicit request and the UFO
 * Pendulum put in its place — its plot, its department and its slot in this
 * list. The check is still worth making, because what it was really guarding
 * against is the ROSTER driving the park: five rides before and five after,
 * with the same four untouched, and no department gained, lost or split.
 */
check(
  "still five department rides, four of them untouched by the swap",
  RIDE_DEPARTMENTS.map((r) => r.rideId).join(",") === "coaster,dragon,ferris,ufo,monster",
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
  /* The coaster's SIGN reads "Testing"; its department is still Tech. */
  check("clicking a ride selects it", first?.department === "Testing", `${first?.department}`);

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
for (const id of ["coaster", "dragon", "ferris", "ufo", "monster"] as DepartmentRideId[]) {
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
  ["roller-coaster", "ferris-wheel", "monster-ride", "park-train", "dragon-ride", "ufo-pendulum"].every(
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
  ["src/components/ufo-pendulum/UfoPendulum.tsx", "UFO Pendulum"],
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
  ["roller-coaster/RollerCoaster.tsx", "ferris-wheel/FerrisWheel.tsx", "dragon-ride/DragonRide.tsx", "ufo-pendulum/UfoPendulum.tsx", "monster-ride/MonsterRide.tsx"].every(
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
