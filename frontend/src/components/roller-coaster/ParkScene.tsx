"use client";

import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { Suspense } from "react";
import { FerrisWheel } from "@/components/ferris-wheel/FerrisWheel";
import { ParkGround } from "@/components/ferris-wheel/ParkGround";
import { RollerCoaster } from "./RollerCoaster";
import { MonsterRide } from "@/components/monster-ride/MonsterRide";
import { FlyingChairs } from "@/components/flying-chairs/FlyingChairs";
import { SuperLooper } from "@/components/super-looper/SuperLooper";
import { TeaCups } from "@/components/tea-cups/TeaCups";
import { GigaCoaster } from "@/components/giga-coaster/GigaCoaster";
import { DumboRide } from "@/components/dumbo-ride/DumboRide";
import { UfoPendulum } from "@/components/ufo-pendulum/UfoPendulum";
import { DragonRide } from "@/components/dragon-ride/DragonRide";
import { SKY_THEMES } from "@/components/world/skyThemes";
import { useSkyThemeStore } from "@/store/skyThemeStore";
import { DoubleTapZoom } from "@/components/park/DoubleTapZoom";
import { ParkJourney } from "@/components/park/journey/ParkJourney";
import { RideDepartmentSigns } from "@/components/park/RideDepartmentSign";
import { ParkEnvironment } from "@/components/world/ParkEnvironment";
import { FerrisWheelBench } from "@/components/world/PromenadeBench";
import { CameraDirector } from "@/components/world/CameraDirector";
import { NightSky } from "@/components/world/NightSky";
import { RideLights } from "@/components/world/rideLighting";
import { LedClock } from "@/components/world/led";
import { RidePlazas } from "@/components/world/RidePlaza";
import { RidePlatforms } from "@/components/world/RidePlatforms";
import { RideHighlights, SelectableRide } from "@/components/park/SelectableRide";
import { useRideSelectionStore } from "@/store/rideSelectionStore";
import { useJourneyStore } from "@/store/journeyStore";
import { useFoodCourtStore } from "@/store/foodCourtStore";
import { PLAZA_CENTER, PLAZA_RADIUS, offsetFor, rideScale } from "@/components/park/layout";
import { BOUNDARY_RADIUS, RIDE_RING_OUTER_EDGE } from "@/components/park/parkRing";
import {
  ORBIT_MAX_DISTANCE,
  ORBIT_MIN_DISTANCE,
  placeById,
} from "@/components/world/cameraPlaces";

/**
 * Opening shot: the solved full-park overview, from which every one of the ten
 * attractions holds its own share of the frame.
 *
 * IT IS NO LONGER TYPED HERE. It used to be the pair of triples the overview
 * solver had produced at the time, copied across by hand — which meant that
 * every time the park changed size the scene opened on last month's framing
 * while the fast-travel chip for the very same view opened on this month's.
 * The two are one number now: this reads `cameraPlaces.ts`, where the overview
 * is re-solved from the park's own reach and the camera's own lens.
 */
const OVERVIEW = placeById("overview");
const CAMERA_POSITION: [number, number, number] = OVERVIEW.position;
const CAMERA_TARGET: [number, number, number] = OVERVIEW.lookAt;

export interface ParkSceneProps {
  /** Override framing, e.g. to focus a particular ride. */
  cameraPosition?: [number, number, number];
  cameraTarget?: [number, number, number];
  /** Show the per-employee time labels on the Monster Ride. */
  showRiderLabels?: boolean;
  /** Show the per-employee time labels on the Dragon Swing Ship. */
  showDragonLabels?: boolean;
  /**
   * Vertical field of view. Defaults to the park's standard wide framing; the
   * entrance passes a longer lens so the rides read at the size they do in the
   * project's reference art, without a single ride changing size or position.
   */
  cameraFov?: number;
}

/** The park's standard lens. */
export const DEFAULT_FOV = 46;

export function ParkScene({
  cameraPosition = CAMERA_POSITION,
  cameraTarget = CAMERA_TARGET,
  showRiderLabels = false,
  showDragonLabels = false,
  cameraFov = DEFAULT_FOV,
}: ParkSceneProps = {}) {
  const skyTheme = useSkyThemeStore((s) => s.theme);
  const sky = SKY_THEMES[skyTheme];
  const clearRideSelection = useRideSelectionStore((s) => s.clear);
  const clearEmployeeSelection = useJourneyStore((s) => s.clear);
  const clearFoodCourtSelection = useFoodCourtStore((s) => s.clear);

  return (
    <Canvas
      shadows
      // `far` must clear the fog distance, or the ground would be clipped
      // before it has faded out and the cut edge would be visible.
      camera={{ position: cameraPosition, fov: cameraFov, near: 1, far: 12000 }}
      // Keeps depth precision usable now the view range spans 1..12000.
      gl={{
        logarithmicDepthBuffer: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        // Slightly under 1: the park is lit almost entirely by emissive
        // architecture, and pulling exposure down is what keeps the darkness
        // dark while the LEDs still read as light sources rather than paint.
        toneMappingExposure: sky.toneMappingExposure,
      }}
      // Keeps the browser from zooming the page on a double tap, so the
      // gesture reaches the camera instead.
      style={{ touchAction: "none" }}
      // Fires when a click lands on nothing interactive — i.e. empty park.
      onPointerMissed={() => {
        clearRideSelection();
        clearEmployeeSelection();
        clearFoodCourtSelection();
      }}
    >
      <color attach="background" args={[sky.background]} />
      <fog
        attach="fog"
        /*
         * Night haze. It begins beyond the park itself so no ride is ever
         * washed out — at the furthest the camera can orbit, the park sits
         * under about 21% haze, enough to give the distance real depth — and
         * it closes well short of the ground's edge, so the land fades into
         * the night instead of ending at a line.
         *
         * The distances moved out with the park. Every ride is built to one
         * height now and the fan that separates them is far wider for it: the
         * property is 1450u across where it was a few hundred, so a haze that
         * began at 900u began inside the park itself, and an orbit limit that
         * framed the old park could no longer fit this one in the lens.
         */
        args={[sky.fog.color, sky.fog.near, sky.fog.far]}
      />

      <NightSky />
      {/* One clock drives every LED chase in the park. */}
      <LedClock />

      {/*
        Night key light. One shadow-casting source, matched to the moon's
        position and colour, plus a cold sky fill — the park's actual
        illumination comes from its own emissive architecture, which is what
        keeps a world this lit from needing hundreds of dynamic lights.
      */}
      <ambientLight intensity={sky.ambient.intensity} color={sky.ambient.color} />
      <hemisphereLight args={[sky.hemisphere.sky, sky.hemisphere.ground, sky.hemisphere.intensity]} />
      {/*
        Same sun as always: identical direction, intensity and colour. Only the
        shadow frustum is widened — and the map enlarged to match — so the
        spread-out park still receives shadows to its edges.
      */}
      <directionalLight
        position={sky.key.position}
        intensity={sky.key.intensity}
        color={sky.key.color}
        castShadow
        shadow-mapSize={[4096, 4096]}
        /*
          Square, centred on the park, and sized to the ride ring rather than to
          a remembered bounding box. The park is concentric now, so a frustum
          that was wider on one side than the other simply lost the shadows on
          the narrow side; one radius covers every attraction equally.
        */
        shadow-camera-left={-RIDE_RING_OUTER_EDGE}
        shadow-camera-right={RIDE_RING_OUTER_EDGE}
        shadow-camera-top={RIDE_RING_OUTER_EDGE}
        shadow-camera-bottom={-RIDE_RING_OUTER_EDGE}
        shadow-camera-far={BOUNDARY_RADIUS * 3}
      />
      <directionalLight position={sky.fill.position} intensity={sky.fill.intensity} color={sky.fill.color} />

      <Suspense fallback={null}>
        <Environment resolution={256}>
          <Lightformer
            intensity={sky.environment.intensity}
            color={sky.environment.top}
            position={[0, 30, 0]}
            scale={[60, 60, 1]}
            rotation={[-Math.PI / 2, 0, 0]}
            form="rect"
          />
          <Lightformer intensity={sky.environment.intensity * 0.7} color={sky.environment.ringA} position={[-40, 14, 30]} scale={20} form="ring" />
          <Lightformer intensity={sky.environment.intensity * 0.56} color={sky.environment.ringB} position={[60, 12, -30]} scale={18} form="ring" />
        </Environment>
      </Suspense>

      {/*
        The park between the attractions: paving under every walked route,
        planting graded from formal at the gate to woodland at the boundary,
        lighting, a real perimeter and a landscape beyond it.
      */}
      <ParkEnvironment />

      {/*
        THE MIDDLE OF THE PARK IS THE GRAND FOOD COURT, and it renders with the
        rest of the journey (see ParkJourney) because it is the one building
        employees walk into. What stood here — first a fountain, then a lake
        with a waterfall — is gone rather than moved: the brief replaces the
        centrepiece outright.
      */}

      {/* One wooden promenade bench, on open ground beside the Ferris Wheel and
          facing it. An addition; it touches nothing. */}
      <FerrisWheelBench />

      {/* Ground and plaza stay in unscaled world space. */}
      <ParkGround
        /*
          Half-extent 15000u. The camera can orbit out to about 2800u and the
          fog is opaque from about 10100u, so the nearest edge is always at
          least 12200u away — permanently inside full fog, and therefore never
          visible. Both figures grew with the park: the radial plan is 2.2 km
          across, the orbit limit stepped out to frame it, and the fog moved
          out with the boundary so the park itself is not hazed.
        */
        size={30000}
        plazaRadius={PLAZA_RADIUS}
        plazaCenter={PLAZA_CENTER}
        // Warm evening landscape, matching the project's sunset reference:
        // the ground keeps its dark value so the night reads as night, but the
        // hue is pulled from cold green-grey to a warm lamplit earth. Never
        // pure black — the ground still has to read as planted ground.
        grassColor={sky.ground.grass}
        plazaColor={sky.ground.plaza}
        plazaRimColor={sky.ground.plazaRim}
      />

      {/*
        Each ride is enlarged by PARK_SCALE and then translated to the spot the
        layout solver assigned it — its own bearing from the gate, its own
        depth, its own clear zone. Rides position themselves from their own
        origin constants, so the offset simply moves them from there; not one
        line inside any ride module changes.
      */}
      <SelectableRide id="ferris">
        <group position={offsetFor("ferris")}>
          <group scale={rideScale("ferris")}>
            <FerrisWheel />
            <RideLights id="ferris" />
          </group>
        </group>
      </SelectableRide>

      <SelectableRide id="coaster">
        <group position={offsetFor("coaster")}>
          <group scale={rideScale("coaster")}>
            <RollerCoaster />
            <RideLights id="coaster" />
          </group>
        </group>
      </SelectableRide>

      <SelectableRide id="monster">
        <group position={offsetFor("monster")}>
          <group scale={rideScale("monster")}>
            <MonsterRide showLabels={showRiderLabels} />
            <RideLights id="monster" />
          </group>
        </group>
      </SelectableRide>

      <SelectableRide id="dragon">
        <group position={offsetFor("dragon")}>
          <group scale={rideScale("dragon")}>
            <DragonRide showLabels={showDragonLabels} />
            <RideLights id="dragon" />
          </group>
        </group>
      </SelectableRide>

      {/* The Drop Tower keeps its exact size — it is the park's scale reference. */}


      {/*
        The Flying Chairs, standing behind the food court.
        World space and no offset of its own: it positions itself from
        RIDE_CENTER, solved from where the gate and the food court already are.
        Nothing above this line changes because of it.
      */}
      <FlyingChairs />

      {/*
        The Super Looper, beside the Roller Coaster.
        World space and no offset of its own: it searches placement.ts for the
        nearest ground to the coaster that was already clear and stands there.
        It is not in the park layout and it is not a department ride, so
        nothing above this line changes because of it.
      */}
      <SuperLooper />

      {/*
        The Tea Cups, behind the UFO Pendulum — the Data Engineering ride.
        World space and no offset of its own: placement.ts solves how far out
        along the gate's line of sight through the pendulum it has to stand.
        Not in the park layout and not a department ride, so nothing above this
        line changes because of it.
      */}
      <TeaCups />

      {/*
        The Giga Coaster, on the nearest clear ground to the Tea Cups.
        World space and no offset of its own. Not in the park layout and not a
        department ride, so nothing above this line changes because of it.
      */}
      <GigaCoaster />

      {/*
        The Dumbo Ride, behind the UFO Pendulum — the Data Engineering ride —
        and a few degrees off the gate's line of sight through it, because the
        Tea Cups already hold that line. World space and no offset of its own.
        Not in the park layout and not a department ride, so nothing above this
        line changes because of it.
      */}
      <DumboRide />

      {/*
        The UFO Pendulum, on the plot the Drop Tower used to hold.
        It is a DEPARTMENT ride — Data Engineering walks here — so it is
        wrapped and lit exactly as the tower was: selectable by id, with the
        park's own LED rig for that id, and positioning itself in world space
        from its layout centre rather than from an offset.
      */}
      <SelectableRide id="ufo">
        <UfoPendulum />
        {/* The rig positions itself from RIDE_ORIGIN, like the ride does. */}
        <RideLights id="ufo" />
      </SelectableRide>

      {/*
        The employee journey: the single main entrance gate, the food court,
        and the walking staff. World space, outside every ride group.
      */}
      <ParkJourney />

      {/*
        One signboard per ride, naming the department it represents. Placement
        is solved in rideSigns.ts against the real park, never typed by hand.
      */}
      <RideDepartmentSigns />

      {/*
        The ten identical ride platforms: the same kerb, the same lit edge, the
        same eight lamps and the same gateway where each radial path arrives.
        This is the visible half of the plan's equality rule.
      */}
      <RidePlatforms />

      {/*
        Lit entrance portals, queues, operator booths and landmark masts — one
        set per department, at the arrival point its employees already walk to.
      */}
      <RidePlazas />

      {/*
        THE PARK TRAIN, ITS TRACK AND ITS ROUTE USED TO RENDER HERE, on one
        shared scale so the train could never leave its rails, with the lit loop
        that drew the park's outline from the overview. All of it is removed at
        the user's request — the ride, the railway, its team board and its
        lighting are gone from the project, not merely unmounted.
      */}

      <OrbitControls
        makeDefault
        target={cameraTarget}
        minDistance={ORBIT_MIN_DISTANCE}
        /*
          Far enough to frame the whole property, and derived from the opening
          shot rather than remembered. It was a fixed 1800; the park grew, the
          solved overview now stands further back than that, and the controls
          were snapping the opening framing inward on the first drag. Ten per
          cent past the overview leaves somewhere to pull back to and still
          stops well short of the fog.
        */
        maxDistance={ORBIT_MAX_DISTANCE}
        maxPolarAngle={Math.PI / 2.05}
      />

      {/* Hover / selection markers, drawn on the ground beside each ride. */}
      <RideHighlights />

      {/* Double-tap / double-click to zoom toward whatever is under the cursor. */}
      <DoubleTapZoom />

      {/* Fast travel, employee follow and smooth transitions between them. */}
      <CameraDirector />
    </Canvas>
  );
}
