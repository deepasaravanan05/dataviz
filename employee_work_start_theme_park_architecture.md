---
status: Project Architecture & Product Specification
subtitle: Dynamic 3D Employee Delay Intelligence & Simulation Platform
title: Employee Work-Start Theme Park
version: 1.1
---

# 1. Project Overview

## Project Name

**Employee Work-Start Theme Park**

## Core Concept

The company is represented as a dynamic theme park.

-   Employees are represented as moving human characters.
-   Department rides represent company departments.
-   Entry gates represent employee check-in categories.
-   Green, yellow, and red seats represent employee delay status.
-   The park visit represents the time between check-in and actual work
    start.
-   The final department ride represents the employee reaching their
    actual work-start point.
-   The system continuously measures and visualizes employee delay.

The primary business goal is:

> **Measure, visualize, and highlight the delay between employee
> check-in time and actual work-start time through an interactive 3D
> theme-park simulation.**

This is not only a 3D animation. It is a **real-time employee-flow
simulation + analytics platform**.

------------------------------------------------------------------------

# 2. Core Employee Journey

Every employee follows this logical journey:

``` text
EMPLOYEE ARRIVAL
       ↓
ENTRY GATE
       ↓
TICKET
       ↓
ENTER PARK
       ↓
VISIT / DELAY
       ↓
RETURN TO DEPARTMENT
       ↓
WAIT FOR RIDE
       ↓
SEAT ASSIGNMENT
       ↓
RIDE STARTS
       ↓
RIDE COMPLETES
       ↓
ACTUAL WORK START
       ↓
DELAY ANALYTICS
```

The system should make this journey visible through real-time human
movement.

------------------------------------------------------------------------

# 3. Employee Population

Initial simulation size:

**200 employees**

The system must be designed so the number of employees can later scale
beyond 200.

Each employee is an individual simulation entity.

## Employee Data

Each employee should have:

-   Employee ID
-   Employee name
-   Department
-   Check-in time
-   Entry category
-   Ticket status
-   Current location
-   Current activity
-   Destination ride
-   Current seat
-   Seat color
-   Work-start time
-   Delay duration
-   Employee state
-   Journey history
-   Anonymized flag (whether this record should render as ID-only in
    non-HR views — see §27, Data Privacy, Security & Access Control)
-   PII visibility tier (which roles are permitted to see the
    employee's name and other identifying fields)

Example:

``` text
Employee ID: EMP027
Department: Finance
Check-in: 09:20 AM
Entry: Early Entry
Current State: Visiting Park
Destination: Finance Ride
Work Start: 09:40 AM
Delay: 20 minutes
Seat: Green
```

------------------------------------------------------------------------

# 4. Four Entry Gates

The entrance contains four ticket counters.

## 4.1 Early Entry

Example:

``` text
09:20 AM
```

Employees arriving early receive an **Early Entry** ticket.

Typical classification:

**Green**

------------------------------------------------------------------------

## 4.2 Regular Entry

Example:

``` text
09:40 AM
```

Employees receive a **Regular Entry** ticket.

Typical classification:

**Green / Yellow**

------------------------------------------------------------------------

## 4.3 Late Entry

Employees arriving later receive a **Late Entry** ticket.

Typical classification:

**Yellow**

------------------------------------------------------------------------

## 4.4 Final Entry

Employees arriving very late receive a **Final Entry** ticket.

Typical classification:

**Red**

------------------------------------------------------------------------

# 5. Important Classification Rule

Entry category should not be the only factor used to determine final
delay status.

The gate-assigned "typical classification" in §4 is **provisional
only**. It is used for the employee's initial seat-color preference
while they are still moving through the park (§31, Seat Assignment
Logic), before their actual delay is known.

The system should calculate the actual delay:

``` text
Delay = Actual Work Start Time - Check-in Time
```

The final green/yellow/red classification is **always recalculated
from actual delay** once the employee's work-start event is recorded,
and this final value supersedes the gate-based provisional value in
all analytics, leaderboards, and historical records. An employee can
therefore enter through the Early Entry gate (provisional green) but
still end up Yellow or Red if their actual park/ride time pushes their
delay past the configured threshold.

The final green/yellow/red classification should be configurable based
on actual delay.

Example:

  Delay            Status
  ---------------- --------
  0--15 minutes    Green
  16--30 minutes   Yellow
  31+ minutes      Red

These thresholds must be configurable.

This allows the visualization to remain data-driven.

------------------------------------------------------------------------

# 6. Department Rides

Each department is represented by a unique theme-park ride.

Example mapping:

  Department         Ride
  ------------------ ----------------
  IT Support         Sky Ring
  ERP                Rainbow Loops
  Operations         Pirate Ship
  Finance            Mini Train
  Cyber Security     Roller Coaster
  Data Engineering   Crazy Wagon
  HR                 Ferris Wheel
  Marketing          Tea Cup

The exact department-to-ride mapping should be configurable.

Every ride must be a large, visually important object in the park.

------------------------------------------------------------------------

# 7. Ride Capacity

Every ride has:

**Maximum Capacity = 60 employees**

Each ride contains:

-   Green seats
-   Yellow seats
-   Red seats

The exact distribution can be configurable.

Example:

``` text
Green: 20
Yellow: 20
Red: 20
Total: 60
```

The system must never allow more than 60 employees on a ride at the same
time.

------------------------------------------------------------------------

# 8. Minimum Ride Start Rule

A ride must **not start when only one employee arrives**.

The minimum number of employees required to start a ride is:

**5 employees**

Therefore:

``` text
1 employee → WAITING
2 employees → WAITING
3 employees → WAITING
4 employees → WAITING
5 employees → RIDE START
```

The ride can run with:

``` text
5–60 employees
```

------------------------------------------------------------------------

# 9. Ride Queue Logic

Each ride has a waiting queue.

Example:

``` text
Roller Coaster Waiting Queue

EMP001 → Green
EMP014 → Green
EMP027 → Yellow
EMP032 → Green
EMP056 → Red
```

Once the queue reaches five employees:

``` text
5 employees ready
       ↓
Assign seats
       ↓
Start ride
```

When the ride finishes:

``` text
Employees leave ride
       ↓
Seats become available
       ↓
Next waiting employees are selected
       ↓
Next ride starts
```

------------------------------------------------------------------------

# 10. Ride Maximum Waiting Rule

The system should prevent employees from waiting indefinitely.

Recommended configurable rule:

``` text
IF waiting employees >= 5
    START RIDE
ELSE IF maximum waiting time is reached
    START RIDE
ELSE
    KEEP WAITING
```

Example:

``` text
Minimum employees: 5
Maximum capacity: 60
Maximum waiting time: 3 minutes
```

This creates a realistic queue and dispatch system.

**Timeout-dispatch seat behavior.** When a ride is forced to start via
the maximum-waiting-time rule rather than the 5-employee minimum, the
resulting seat-color mix is whatever colors happened to be waiting —
this is expected, valid behavior, not an error condition. For example,
a ride may legitimately dispatch with 1–4 employees, all seated in Red,
if the wait timeout was reached before a fifth employee joined the
queue. Seat assignment (§31) still applies normally to whichever
employees are present at dispatch time.

------------------------------------------------------------------------

# 11. Employee State Machine

Every employee should have a clearly defined state.

``` text
ARRIVED
   ↓
AT_GATE
   ↓
TICKET_RECEIVED
   ↓
ENTERED_PARK
   ↓
VISITING_PARK
   ↓
GOING_TO_DEPARTMENT
   ↓
WAITING_FOR_RIDE
   ↓
SEAT_ASSIGNED
   ↓
RIDE_RUNNING
   ↓
RIDE_COMPLETED
   ↓
WORK_STARTED
```

The employee state controls the employee's movement and visual status.

------------------------------------------------------------------------

# 12. Error Handling & Edge Cases

The state machine in §11 describes the happy path. A production system
running on real attendance data must also define behavior for the
paths employees don't always follow.

## No-Show Employees

An employee may check in but never reach `WORK_STARTED` (e.g., they
leave the building, or the shift ends before they reach their ride).

-   Add a terminal `NO_SHOW` / `INCOMPLETE` state, entered when an
    employee has been inactive past a configurable idle timeout, or
    when the simulation day closes with the employee still short of
    `WORK_STARTED`.
-   Employees in this state must be excluded from delay-duration
    analytics (they have no work-start time), but counted separately
    in dashboard KPIs (§32) as "Incomplete" so they are not silently
    dropped from totals.

## Duplicate or Out-of-Order Check-In Events

-   If a `CHECK_IN` event is received for an employee already past
    `AT_GATE`, the event should be logged but not reprocessed — the
    first check-in time is authoritative.
-   Events arriving out of timestamp order (e.g., due to network
    retries) should be ordered by their own timestamp, not by arrival
    order, before being applied to the employee's journey history
    (§28).

## Timezone Handling

-   All timestamps are stored in UTC in the database and Redis.
-   Check-in time, work-start time, and every `employee_events`
    timestamp are converted to the viewer's local timezone only at the
    presentation layer (dashboard, floating time labels, detail
    panel).
-   The simulation clock (§15) runs in a single configured park
    timezone regardless of viewer location, so all employees remain
    comparable.

## WebSocket Disconnect / Reconnect

-   On reconnect, the client must request a full state snapshot
    (current employee positions, ride/queue status, seat occupancy)
    rather than resuming the event stream from where it left off —
    events missed during the disconnect window are not replayed
    individually.
-   The backend should expose a lightweight `GET /simulation/state`
    REST endpoint for exactly this resync purpose.

## Simulation Pause / Resume Mid-Ride

-   Pausing the simulation clock (§15) freezes ride timers, queue
    wait-timers, and employee movement in place; it must not reset
    ride or queue state.
-   Resuming continues all timers from where they were paused. Ride
    and queue state must be serializable so a paused simulation
    survives a backend restart.

------------------------------------------------------------------------

# 13. Employee Movement

Employees must be visible as moving human characters.

Movement must be data-driven.

Do not randomly move employees around the park.

Example:

``` text
Employee 027

Gate
 ↓
Ticket Counter
 ↓
Central Park
 ↓
Park Visit
 ↓
Finance Ride
 ↓
Waiting Queue
 ↓
Seat
 ↓
Ride
 ↓
Work Start
```

The backend determines the employee's state.

The frontend performs smooth animation between locations.

------------------------------------------------------------------------

# 14. Employee Time Above Head

Every employee should have a floating time label.

Example:

``` text
        09:20 AM
           ↓
          👤
```

At the beginning:

``` text
09:20 AM
```

After park movement:

``` text
09:27 AM
```

When the employee reaches the department:

``` text
09:40 AM
```

When work starts:

``` text
WORK STARTED
```

The displayed time must be dynamic and synchronized with the simulation
clock.

Optional hover information:

``` text
EMP027
09:40 AM
+20 min delay
```

------------------------------------------------------------------------

# 15. Simulation Clock

The application should have a controllable simulation clock.

Recommended controls:

-   Play
-   Pause
-   Reset
-   1x
-   5x
-   10x
-   60x

Example:

``` text
SIMULATION TIME: 09:40 AM
SPEED: 10x
```

The user should be able to observe an entire work-start period without
waiting for real hours.

------------------------------------------------------------------------

# 16. Two Major Engines

The architecture should separate the system into two conceptual engines.

## 16.1 Data Engine

Responsible for:

-   Employee data
-   Check-in times
-   Delay calculation
-   Entry classification
-   Department assignment
-   Seat assignment
-   Employee events
-   Analytics

## 16.2 Simulation Engine

Responsible for:

-   Employee movement
-   Ride queues
-   Ride dispatch
-   Seat occupancy
-   Ride animation
-   Simulation clock
-   Camera behavior
-   Real-time visual events

Architecture:

``` text
DATA
 ↓
DATA ENGINE
 ↓
SIMULATION ENGINE
 ↓
3D THEME PARK
```

------------------------------------------------------------------------

# 17. Recommended Technology Stack

## Frontend

### Next.js

Primary web application framework.

### React

UI and application architecture.

### TypeScript

Primary frontend programming language.

------------------------------------------------------------------------

# 18. 3D Technology

## React Three Fiber

Use React Three Fiber as the primary React integration for Three.js.

Architecture:

``` text
Next.js
 ↓
React
 ↓
React Three Fiber
 ↓
Three.js
 ↓
WebGL
```

## Three.js

Responsible for:

-   3D scene
-   Camera
-   Lighting
-   Materials
-   Models
-   Animation
-   Rendering

## Drei

Use Drei for common 3D utilities such as:

-   Camera controls
-   Text
-   HTML overlays
-   Loaders
-   Environment
-   Helpers
-   Shadows

------------------------------------------------------------------------

# 19. 3D Modeling

## Blender

Use Blender to create:

-   Theme park environment
-   Rides
-   Ticket counters
-   Gates
-   Buildings
-   Trees
-   Benches
-   Decorations
-   Ride seats
-   Other custom assets

Export optimized models as:

``` text
.glb
.glTF
```

Use these models inside Three.js.

------------------------------------------------------------------------

# 20. Employee Navigation

Employees should not walk through buildings, rides, trees, or restricted
areas.

Use navigation/pathfinding concepts such as:

**NavMesh**

Basic route:

``` text
Gate
 ↓
Waypoint 1
 ↓
Waypoint 2
 ↓
Park
 ↓
Waypoint 3
 ↓
Department Ride
 ↓
Seat
```

The frontend interpolates the character smoothly between navigation
points.

------------------------------------------------------------------------

# 21. Physics

Use **Rapier** selectively.

Physics is useful for rides such as:

-   Pirate Ship swinging
-   Ferris Wheel rotation
-   Roller coaster movement
-   Spinning rides
-   Mechanical ride components

Do not apply expensive physics simulation to every employee.

Employees can primarily use navigation and animation.

------------------------------------------------------------------------

# 22. Frontend State Management

Use:

**Zustand**

for simulation state.

Example state:

``` text
employees
rides
seats
simulationTime
simulationSpeed
selectedEmployee
selectedRide
employeeStates
rideQueues
rideStatus
parkState
```

Example:

``` text
Zustand
   ↓
React
   ↓
React Three Fiber
   ↓
3D Scene
```

------------------------------------------------------------------------

# 23. Backend

Use:

**NestJS + TypeScript**

NestJS should manage:

-   Employee APIs
-   Attendance data
-   Departments
-   Rides
-   Seats
-   Employee events
-   Delay calculation
-   Simulation events
-   WebSocket communication
-   Authentication and role-based access control (see §27, Data
    Privacy, Security & Access Control)

------------------------------------------------------------------------

# 24. API Architecture

Use both:

## REST API

For normal data operations.

Examples:

``` text
GET /employees
GET /employees/:id
GET /departments
GET /rides
GET /rides/:id
GET /analytics
POST /simulation/start
POST /simulation/reset
```

## WebSocket

For live simulation updates.

Example event:

``` json
{
  "employeeId": "EMP027",
  "state": "FINANCE_RIDE",
  "time": "09:40",
  "delayMinutes": 20
}
```

The browser receives the event and updates the 3D scene.

------------------------------------------------------------------------

# 25. Real-Time Architecture

Recommended:

**WebSocket / Socket.IO**

Flow:

``` text
Simulation Engine
       ↓
NestJS
       ↓
WebSocket
       ↓
Browser
       ↓
Zustand
       ↓
3D Scene
```

Important optimization:

The backend should send **state/events**, not every animation frame.

Do not send:

``` text
x=12.01
x=12.02
x=12.03
x=12.04
```

Instead send:

``` text
EMP027 → FINANCE_RIDE
```

The frontend performs smooth movement.

------------------------------------------------------------------------

# 26. Database

Use:

**PostgreSQL**

PostgreSQL should store persistent business and simulation data.

Recommended tables:

## employees

``` text
employee_id
employee_name
department_id
```

## departments

``` text
department_id
department_name
ride_id
```

## attendance

``` text
attendance_id
employee_id
check_in_time
work_start_time
delay_minutes
entry_category
```

## rides

``` text
ride_id
ride_name
department_id
capacity
minimum_start_count
maximum_wait_time
```

## seats

``` text
seat_id
ride_id
seat_color
occupied
employee_id
```

## employee_events

``` text
event_id
employee_id
event_type
timestamp
location
metadata
```

## users

``` text
user_id
email
role
department_scope
```

## audit_log

``` text
audit_id
user_id
action_type
target_entity
timestamp
metadata
```

## data_source_sync

``` text
sync_id
source_system
sync_started_at
sync_completed_at
records_processed
status
```

------------------------------------------------------------------------

# 27. Data Privacy, Security & Access Control

Because this platform runs on **real employee attendance data**, the
architecture must treat privacy and access control as first-class
requirements, not an afterthought.

## Role-Based Access Control

  Role       Access
  ---------- --------------------------------------------------------
  Admin      Full control: simulation start/reset, configuration
             (thresholds, capacities, mappings), all employee data
  Manager    Read access to their own department's employees, rides,
             and analytics only
  Viewer     Read-only access to the aggregate dashboard and 3D park
             (no individual employee PII by default)

Roles and department scope are stored in the `users` table (§26) and
enforced on both REST endpoints and WebSocket subscriptions.

## PII Handling

-   Employee name is a sensitive field. Non-Admin/Manager roles should
    see the employee ID only, unless explicitly granted name
    visibility.
-   An **anonymization mode** should be available for demos, training,
    or non-HR audiences: when enabled, the 3D scene and dashboard
    display employee IDs and delay data only, with names masked.
    Controlled by the `anonymized` flag introduced in §3.
-   Field-level visibility follows the PII visibility tier stored per
    employee record (§3).

## Data Retention

-   `attendance` and `employee_events` records should have a
    configurable retention window (e.g., 12 months) after which
    detailed per-event data is purged or aggregated, per company HR
    data policy.

## Audit Logging

-   Every Admin action (simulation reset, threshold/config changes,
    manual seat/ride overrides) is written to `audit_log` (§26) with
    the acting user, action, target, and timestamp.

## API & WebSocket Authentication

-   REST endpoints and WebSocket connections require a valid JWT.
-   WebSocket event subscriptions are filtered server-side by the
    connecting user's role and department scope — a Manager's client
    never receives events for employees outside their department.
-   REST endpoints are rate-limited to prevent abuse of the live
    simulation-control endpoints (`/simulation/start`,
    `/simulation/reset`).

------------------------------------------------------------------------

# 28. Event-Based Employee Journey

The `employee_events` table is critical.

Example:

``` text
EMP027
CHECK_IN
09:20
GATE_EARLY
```

Then:

``` text
EMP027
TICKET_RECEIVED
09:20
EARLY_GATE
```

Then:

``` text
EMP027
PARK_ENTER
09:22
CENTRAL_PARK
```

Then:

``` text
EMP027
PARK_VISIT
09:22
CENTRAL_PARK
```

Then:

``` text
EMP027
RIDE_QUEUE
09:34
FINANCE
```

Then:

``` text
EMP027
SEAT_ASSIGNED
09:40
FINANCE
```

Then:

``` text
EMP027
WORK_STARTED
09:40
FINANCE
```

This event history makes the employee journey replayable and
analytically useful.

------------------------------------------------------------------------

# 29. Redis

Use:

**Redis**

for fast temporary state and real-time infrastructure.

Potential uses:

-   Current simulation state
-   Ride queues
-   Active employee states
-   Temporary seat locks
-   WebSocket scaling
-   Pub/Sub
-   Simulation coordination

Persistent historical data remains in PostgreSQL.

------------------------------------------------------------------------

# 30. Ride State Machine

Every ride should have its own state.

``` text
IDLE
 ↓
WAITING
 ↓
READY
 ↓
RUNNING
 ↓
COMPLETED
 ↓
RESET
 ↓
WAITING
```

Example:

``` text
WAITING
Employees: 4
Status: WAITING
```

Then:

``` text
Employee 005 arrives

Employees: 5
Status: READY
```

Then:

``` text
RIDE START
Status: RUNNING
```

After completion:

``` text
Status: COMPLETED
```

Then:

``` text
Seats released
Queue updated
Next group selected
```

------------------------------------------------------------------------

# 31. Seat Assignment Logic

Seat assignment must respect employee delay status.

Example:

``` text
Green employee → Green seat
Yellow employee → Yellow seat
Red employee → Red seat
```

If the preferred color is unavailable, the system should have a
configurable fallback policy.

Recommended default:

``` text
Preferred seat color
       ↓
Check availability
       ↓
Available?
  /       \
YES       NO
 ↓         ↓
Assign    Fallback policy
```

The fallback behavior should be configurable rather than hardcoded.
Recommended configurable options:

1.  **Nearest-severity seat** — assign the closest available color
    (e.g., a Yellow employee takes a Green or Red seat if Yellow is
    full) and log a `seat_color_mismatch` event for analytics.
2.  **Hold one cycle** — leave the employee in the queue for one more
    dispatch cycle, hoping their preferred color frees up, then fall
    back to option 1 if still unavailable.
3.  **Any open seat** — assign any available seat regardless of color
    and log the mismatch, prioritizing throughput over color accuracy.

The chosen policy is a per-ride or global configuration value, not
hardcoded logic.

------------------------------------------------------------------------

# 32. Dashboard

The 3D park should be accompanied by an analytics dashboard.

Main KPIs:

-   Total Employees
-   Work Started
-   Currently in Park
-   Currently Waiting
-   Incomplete / No-Show (see §12, Error Handling & Edge Cases)
-   Average Delay
-   Maximum Delay
-   Green Employees
-   Yellow Employees
-   Red Employees

Example:

``` text
Employees: 200
Work Started: 132
In Park: 42
Waiting: 26
Average Delay: 23 min

Green: 105
Yellow: 57
Red: 38
```

------------------------------------------------------------------------

# 33. Accessibility Requirements

The core visual language of this platform is a green/yellow/red
traffic-light system. Color alone is not an accessible signal —
roughly 1 in 12 men have some form of color vision deficiency, and
red/green confusion is the most common form, which directly conflicts
with this system's primary encoding.

## Color-Independent Status Encoding

-   Every green/yellow/red element (seats, employee markers,
    leaderboard rows, KPI tiles) must carry a **redundant non-color
    signal**: a shape or icon (circle/triangle/square), a text label
    ("On Time" / "Delayed" / "Critical"), or both.
-   This satisfies WCAG 1.4.1 (Use of Color) and must be treated as a
    hard requirement, not a visual-polish nice-to-have.

## Keyboard Navigation

-   Employee search, the employee detail panel (§35), and the delay
    leaderboard (§34) must be fully operable via keyboard, not only
    mouse/touch — important for the dashboard's use as a management
    tool.

## Contrast

-   Floating time labels (§14) and HUD text must maintain sufficient
    contrast against both the daytime and any future night/weather
    park environments (§46, Development Phases — Phase 10, Visual
    Polish).

------------------------------------------------------------------------

# 34. Delay Leaderboard

Add a real-time leaderboard.

Example:

``` text
TOP DELAYS

1. EMP027   67 min   RED
2. EMP113   61 min   RED
3. EMP054   58 min   RED
4. EMP089   42 min   YELLOW
5. EMP031   38 min   YELLOW
```

Clicking an employee should focus the 3D camera on that employee.

------------------------------------------------------------------------

# 35. Employee Detail Panel

Clicking an employee should open:

``` text
EMPLOYEE 027

Department: Finance
Check-in: 09:20 AM
Work Start: 09:40 AM
Delay: 20 minutes
Status: Yellow

Journey:

09:20  Early Gate
09:20  Ticket
09:22  Park Entry
09:34  Finance Queue
09:40  Seat Assigned
09:40  Work Started
```

The camera can optionally follow the employee.

------------------------------------------------------------------------

# 36. Employee Journey Replay

Provide:

**Replay Journey**

The system should replay the employee's historical path.

Example:

``` text
09:20
 ↓
Early Gate
 ↓
09:22
 ↓
Park
 ↓
09:34
 ↓
Finance Queue
 ↓
09:40
 ↓
Finance Ride
 ↓
Work Started
```

This is one of the most important features for explaining delay.

------------------------------------------------------------------------

# 37. Ride Status Panel

Every ride can expose a live information panel.

Example:

``` text
CYBER ROLLER COASTER

Status: RUNNING

Current Employees: 18 / 60
Waiting: 7

Green: 10
Yellow: 5
Red: 3

Ride Number: 12
```

This connects the visual ride to live data.

------------------------------------------------------------------------

# 38. Park Zones

Organize the park into logical zones.

``` text
                         ENTRANCE
                            |
                 +----------+----------+
                 |                     |
             ENTRY GATES          TICKET PLAZA
                 |                     |
                 +----------+----------+
                            |
                       CENTRAL PARK
                            |
          +-----------------+-----------------+
          |                 |                 |
       IT ZONE         FINANCE ZONE      OPERATIONS
          |                 |                 |
       SKY RING         MINI TRAIN       PIRATE SHIP
          |                 |                 |
          +-----------------+-----------------+
                            |
                       WORK START
```

This improves navigation, visual clarity, and future scalability.

------------------------------------------------------------------------

# 39. Ride Animation

Rides must feel alive.

Examples:

## Ferris Wheel

Rotates continuously.

## Roller Coaster

Coaster vehicles move on the track.

## Pirate Ship

Swings back and forth.

## Rainbow Loops

Rotates.

## Crazy Wagon

Spins.

## Mini Train

Moves along its track.

## Tea Cup

Rotates.

Ride animation should continue independently while employee dispatch
logic controls when employees board.

------------------------------------------------------------------------

# 40. Important Separation: Ride Animation vs Ride Dispatch

A ride can visually exist and animate even when no employee is riding
it.

But employee boarding should follow the business rule:

``` text
At least 5 employees ready
        ↓
Dispatch ride
```

Therefore:

**Ride animation** and **employee dispatch** are separate systems.

------------------------------------------------------------------------

# 41. Realistic Simulation Behavior

The system should simulate:

-   Employee arrival
-   Walking
-   Ticket collection
-   Park visit
-   Waiting
-   Queue formation
-   Seat assignment
-   Ride dispatch
-   Ride completion
-   Employee exit
-   Actual work start
-   Delay measurement

Avoid random movement unless randomness is explicitly part of the
simulation data.

------------------------------------------------------------------------

# 42. Scalability

Initial target:

**200 employees**

The architecture should support:

-   500 employees
-   1,000 employees
-   More departments
-   More rides
-   More seats
-   Multiple simulation sessions

The 3D rendering layer should use optimization techniques such as:

-   Level of Detail
-   Instancing where appropriate
-   Optimized GLB models
-   Texture compression
-   Efficient animation
-   Frustum culling
-   Limited real-time physics
-   Avoiding unnecessary React re-renders

------------------------------------------------------------------------

# 43. Testing Strategy

A simulation-driven platform is only trustworthy if its business rules
are independently verified, separate from how it looks.

## Unit Tests

-   Delay calculation (`Delay = Work Start - Check-in`, §5)
-   Entry classification thresholds, including the provisional
    (gate) vs. final (delay-based) distinction from §5
-   Ride dispatch rule: 5-employee minimum, capacity cap of 60, and
    maximum-waiting-time trigger (§8, §10)
-   Seat assignment and fallback policy (§31)

## Integration Tests

-   REST endpoint contracts (§24)
-   WebSocket event contracts, including the reconnect/resync flow
    (§12)
-   Role-based access filtering (§27) — verify a Manager's API/WebSocket
    access never returns another department's employee data

## Simulation / End-to-End Tests

-   Run the Phase 1 proof-of-concept scenario (§46) headlessly at
    accelerated clock speed and assert the resulting dashboard KPIs
    (§32) match hand-calculated expected values.

## Load Testing

-   Simulate 1,000 concurrent employees and measure WebSocket message
    throughput and dashboard update latency against the targets in
    §45.

------------------------------------------------------------------------

# 44. Observability & Monitoring

## Structured Logging

-   The simulation engine and event pipeline emit structured
    (JSON) logs per state transition, ride dispatch, and seat
    assignment, correlated by employee ID and simulation session ID.

## Metrics

-   Active WebSocket connections
-   Ride dispatch latency (time from "5 employees ready" to
    "RIDE_RUNNING")
-   Queue depth per ride, over time
-   Event-processing lag (event timestamp vs. processed timestamp)

## Alerting

-   Alert when a ride remains in `WAITING` past its configured maximum
    waiting time without dispatching (§10) — this indicates a stuck
    dispatch loop, not expected behavior.
-   Alert on WebSocket connection-count anomalies or sustained event
    processing lag.

------------------------------------------------------------------------

# 45. Non-Functional / Performance Targets

  Target                                Value
  ------------------------------------- ----------------------------
  Frame rate at 200 employees           60 FPS sustained
  Frame rate above 200 employees        Graceful LOD degradation,
                                         no drop below 30 FPS
  REST API p95 latency                  < 200 ms
  WebSocket event delivery latency      < 250 ms end-to-end
  Concurrent WebSocket clients          200+ per simulation session
  Dashboard initial load time           < 3 s
  Concurrent simulation sessions        Configurable, 1+ (§42)

These targets are defaults and should be revisited once the Phase 1
proof of concept (§46) is measured.

------------------------------------------------------------------------

# 46. Development Phases

## Phase 1 --- Proof of Concept

Build:

-   1 gate
-   1 ride
-   10 employees
-   60 seats
-   Green/yellow/red seats
-   Employee movement
-   Floating time
-   5-employee ride-start rule

Goal:

**Prove the core simulation.**

------------------------------------------------------------------------

## Phase 2 --- Entry System

Add:

-   Early Entry
-   Regular Entry
-   Late Entry
-   Final Entry
-   Ticket generation
-   Entry classification

------------------------------------------------------------------------

## Phase 3 --- Ride System

Add:

-   Multiple departments
-   Multiple rides
-   60 seats per ride
-   Seat colors
-   Waiting queues
-   Ride state machine
-   Minimum 5 employees
-   Maximum waiting time

------------------------------------------------------------------------

## Phase 4 --- 200 Employees

Connect the employee dataset.

Employees should be generated from real data rather than manually
created.

**Data sourcing.** Real employee and attendance data should enter the
system through one of the following, configurable per deployment:

-   REST pull from the company's HRIS/attendance system on a scheduled
    sync (tracked in the `data_source_sync` table, §26)
-   One-time or scheduled CSV import
-   SFTP drop processed on a schedule

For local development and demos, use a **mock data generator** that
produces synthetic employee and check-in records so real PII is never
required outside production. Combine this with anonymization mode
(§27) for any demo involving real data.

------------------------------------------------------------------------

## Phase 5 --- Simulation Clock

Add:

-   Play
-   Pause
-   Reset
-   1x
-   5x
-   10x
-   60x

------------------------------------------------------------------------

## Phase 6 --- Real-Time Backend

Implement:

-   NestJS
-   PostgreSQL
-   Redis
-   WebSocket
-   Event system
-   Authentication, RBAC, and audit logging (§27)
-   Structured logging and core metrics (§44)

------------------------------------------------------------------------

## Phase 7 --- Analytics

Add:

-   Average delay
-   Department delay
-   Green/yellow/red distribution
-   Maximum delay
-   Top delayed employees
-   Work-start percentage
-   Park waiting time

------------------------------------------------------------------------

## Phase 8 --- Interactive Controls

Add:

-   Employee search
-   Department filter
-   Ride filter
-   Employee detail
-   Ride detail
-   Camera follow
-   Journey replay

------------------------------------------------------------------------

## Phase 9 --- Testing & QA

Add:

-   Unit test coverage for all business rules (§43)
-   Integration tests for REST/WebSocket contracts and RBAC filtering
-   Headless end-to-end simulation test suite
-   Load test at 1,000 employees against the targets in §45

------------------------------------------------------------------------

## Phase 10 --- Visual Polish

Finally add:

-   High-quality 3D models
-   Lighting
-   Shadows
-   Environment
-   Animated rides
-   Better employee models
-   Camera transitions
-   Weather/day-night effects
-   Optional sound
-   Accessibility pass (§33): verify color-independent status encoding
    across every new visual element

Visual polish should come after the simulation engine works correctly.

------------------------------------------------------------------------

# 47. Recommended Project Structure

``` text
employee-work-start-theme-park/
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── 3d/
│   │   ├── Park/
│   │   ├── Rides/
│   │   ├── Employees/
│   │   ├── Gates/
│   │   ├── Seats/
│   │   └── Camera/
│   ├── simulation/
│   │   ├── engine/
│   │   ├── employee/
│   │   ├── rides/
│   │   ├── queues/
│   │   ├── navigation/
│   │   └── clock/
│   ├── store/
│   ├── hooks/
│   ├── services/
│   └── types/
│
├── backend/
│   ├── src/
│   │   ├── employees/
│   │   ├── departments/
│   │   ├── attendance/
│   │   ├── rides/
│   │   ├── seats/
│   │   ├── events/
│   │   ├── simulation/
│   │   ├── analytics/
│   │   ├── auth/
│   │   └── websocket/
│   └── prisma/
│
├── assets/
│   ├── models/
│   ├── textures/
│   ├── animations/
│   └── environment/
│
├── docs/
│
├── docker/
│
└── README.md
```

------------------------------------------------------------------------

# 48. Core Business Rules

The following rules must be treated as configurable business logic.

### Rule 1 --- Employee Count

Initial simulation:

``` text
200 employees
```

### Rule 2 --- Entry

Employee receives a ticket based on check-in time.

### Rule 3 --- Park Visit

Employee must visit the park before reaching their department ride.

### Rule 4 --- Department

Employee must return to their assigned department ride.

### Rule 5 --- Capacity

Every ride has a maximum capacity of:

``` text
60 employees
```

### Rule 6 --- Minimum Ride Start

A ride normally starts when:

``` text
5 or more employees
```

are ready.

### Rule 7 --- Waiting Timeout

A ride may start after the maximum waiting time if fewer than five
employees are waiting.

### Rule 8 --- Seat Color

Seat color represents employee delay classification.

### Rule 9 --- Actual Work Start

Actual work start is recorded when the employee completes the configured
department journey.

### Rule 10 --- Delay

``` text
Delay = Work Start - Check-in
```

### Rule 11 --- Access Control

Employee PII is visible only to roles explicitly granted visibility
(§27); all other roles see anonymized employee IDs.

------------------------------------------------------------------------

# 49. Quality Requirements

The final system should be:

-   Realistic
-   Dynamic
-   Data-driven
-   Interactive
-   Responsive
-   Scalable
-   Maintainable
-   Visually attractive
-   Accessible
-   Secure
-   Analytics-focused
-   Suitable for a professional demonstration

The 3D scene should never be only decoration.

Every important visual element should have a relationship with data.

------------------------------------------------------------------------

# 50. Final Product Vision

The final application should feel like a living company represented as a
theme park.

At the beginning of the simulation:

``` text
200 employees
        ↓
Entry gates
        ↓
Tickets
        ↓
Park movement
        ↓
Department destinations
        ↓
Queues
        ↓
5+ employee dispatch
        ↓
Rides
        ↓
Green / Yellow / Red seats
        ↓
Actual Work Start
        ↓
Delay Analytics
```

Management should be able to look at the park and immediately
understand:

-   Who arrived?
-   Who is delayed?
-   How long are they delayed?
-   Which department has the most delay?
-   Which employees are currently in the park?
-   Which employees are waiting?
-   Which rides are running?
-   Which seats are occupied?
-   Who has started work?
-   Who has the highest delay?
-   Where is the delay happening?

------------------------------------------------------------------------

# 51. Final Technology Decision

## LOCKED STACK

### Frontend

**Next.js + React + TypeScript**

### 3D

**React Three Fiber + Three.js + Drei**

### 3D Assets

**Blender → GLB/GLTF**

### Navigation

**NavMesh**

### Physics

**Rapier**

### State Management

**Zustand**

### Backend

**NestJS + TypeScript**

### API

**REST + WebSocket / Socket.IO**

### Database

**PostgreSQL**

### ORM

**Prisma**

### Real-Time / Cache

**Redis**

### Deployment

**Docker**

------------------------------------------------------------------------

# 52. Core Architecture Summary

``` text
                         USER
                          |
                          v
                 NEXT.JS APPLICATION
                          |
            +-------------+-------------+
            |                           |
            v                           v
     3D THEME PARK                 ANALYTICS UI
            |                           |
            v                           |
 React Three Fiber                     |
            |                           |
        Three.js                        |
            |                           |
            +-------------+-------------+
                          |
                       Zustand
                          |
                      WebSocket
                          |
                          v
                       NESTJS
                          |
             +------------+------------+
             |                         |
             v                         v
        Simulation                 REST API
          Engine                     |
             |                       |
             v                       v
           Redis                 PostgreSQL
             |
             v
       Real-Time State
```

------------------------------------------------------------------------

# 53. Most Important Principle

The project must follow this principle:

> **DATA → STATE → SIMULATION → ANIMATION → VISUALIZATION**

Not:

> **ANIMATION → RANDOM MOVEMENT → DECORATION**

The data must control the park.

The employee must move because an event occurred.

The employee must wait because the ride has fewer than five people.

The ride must start because the queue reached five.

The seat color must represent delay.

The employee's floating time must represent simulation time.

The final analytics must be calculated from the employee's actual
journey.

That is what turns the theme park into a serious **Employee Work-Start
Delay Intelligence Platform**.
