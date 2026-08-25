import { generateEmployees } from "../src/simulation/employees";
import { createRide } from "../src/simulation/ride";
import { tick } from "../src/simulation/engine";
import { formatSimTime } from "../src/simulation/clock";

let employees = generateEmployees(10);
let ride = createRide();

const STEP_MINUTES = 0.1;
const MAX_STEPS = 20000; // 2000 simulated minutes ceiling, well beyond a full day
let simTime = employees[0].checkInTime; // start right at first check-in

const dispatchSizes: number[] = [];
let lastDispatchCount = 0;

for (let step = 0; step < MAX_STEPS; step++) {
  simTime += STEP_MINUTES;
  const result = tick(employees, ride, simTime);
  employees = result.employees;
  ride = result.ride;

  if (ride.dispatchCount > lastDispatchCount) {
    dispatchSizes.push(ride.runningRiders.length);
    lastDispatchCount = ride.dispatchCount;
  }

  if (employees.every((e) => e.state === "WORK_STARTED")) break;
}

const allStarted = employees.every((e) => e.state === "WORK_STARTED");
console.log(`All employees reached WORK_STARTED: ${allStarted}`);
console.log(`Final simulated time: ${formatSimTime(simTime)}`);
console.log(`Ride dispatch count: ${ride.dispatchCount}`);
console.log(`Batch sizes per dispatch: ${dispatchSizes.join(", ")}`);
console.log(`Any dispatch below 5 (must only happen via timeout, not the 5-min-start rule): ${dispatchSizes.some((n) => n < 5)}`);
console.log(`Any batch above 60-seat capacity: ${dispatchSizes.some((n) => n > 60)}`);

console.log("\nPer-employee summary:");
for (const e of employees) {
  console.log(
    `${e.id}  checkIn=${formatSimTime(e.checkInTime)}  workStart=${e.workStartTime !== null ? formatSimTime(e.workStartTime) : "—"}  delay=${e.delayMinutes?.toFixed(1)}min  seatColor=${e.seatColor}  finalColor=${e.finalColor}  state=${e.state}`,
  );
}

const seatColorMismatches = employees.filter((e) => e.seatColor !== e.finalColor).length;
console.log(`\nEmployees whose final color differs from provisional seat color (expected/valid per §5): ${seatColorMismatches}`);

if (!allStarted) {
  console.error("FAIL: not all employees completed their journey.");
  process.exit(1);
}
if (ride.dispatchCount === 0) {
  console.error("FAIL: ride never dispatched.");
  process.exit(1);
}
console.log("\nOK: Phase 1 core simulation logic verified.");
