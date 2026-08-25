"use client";

import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { Suspense } from "react";
import { FerrisWheel } from "@/components/ferris-wheel/FerrisWheel";
import { ParkGround } from "@/components/ferris-wheel/ParkGround";
import { RollerCoaster } from "./RollerCoaster";
import { MonsterRide } from "@/components/monster-ride/MonsterRide";
import { Track as TrainTrack } from "@/components/park-train/Track";
import { ParkTrain } from "@/components/park-train/ParkTrain";
import { DragonRide } from "@/components/dragon-ride/DragonRide";
import { DropTower } from "@/components/drop-tower/DropTower";
import { PARK_SCALE, TRAIN_SCALE } from "@/components/park/parkScale";
import { DoubleTapZoom } from "@/components/park/DoubleTapZoom";
import { ParkJourney } from "@/components/park/journey/ParkJourney";
import { RideDepartmentSigns } from "@/components/park/RideDepartmentSign";
import { ParkEnvironment } from "@/components/world/ParkEnvironment";
import { Fountain } from "@/components/world/Fountain";
import { CameraDirector } from "@/components/world/CameraDirector";
import { NightSky } from "@/components/world/NightSky";
import { RideLights, TrainRig } from "@/components/world/rideLighting";
import { LedClock } from "@/components/world/led";
import { RidePlazas } from "@/components/world/RidePlaza";
import { RideHighlights, SelectableRide } from "@/components/park/SelectableRide";
import { useRideSelectionStore } from "@/store/rideSelectionStore";
import { useJourneyStore } from "@/store/journeyStore";
import { PLAZA_CENTER, PLAZA_RADIUS, offsetFor } from "@/components/park/layout";

/**
 * Opening shot: the solved full-park overview, from which every one of the six
 * rides holds its own share of the frame. See cameraPlaces.ts.
 */
const CAMERA_POSITION: [number, number, number] = [398, 360, 887];
const CAMERA_TARGET: [number, number, number] = [52, 24, 110];

export interface ParkSceneProps {
  /** Override framing, e.g. to focus a particular ride. */
  cameraPosition?: [number, number, number];
  cameraTarget?: [number, number, number];
  /** Show the per-employee time labels on the Monster Ride. */
  showRiderLabels?: boolean;
  /** Show the per-employee time labels on the Park Train. */
  showTrainLabels?: boolean;
  /** Show the per-employee time labels on the Dragon Swing Ship. */
  showDragonLabels?: boolean;
  /** Show the per-employee time labels on the Drop Tower. */
  showTowerLabels?: boolean;
}

export function ParkScene({
  cameraPosition = CAMERA_POSITION,
  cameraTarget = CAMERA_TARGET,
  showRiderLabels = false,
  showTrainLabels = false,
  showDragonLabels = false,
  showTowerLabels = false,
}: ParkSceneProps = {}) {
  const clearRideSelection = useRideSelectionStore((s) => s.clear);
  const clearEmployeeSelection = useJourneyStore((s) => s.clear);

  return (
    <Canvas
      shadows
      // `far` must clear the fog distance, or the ground would be clipped
      // before it has faded out and the cut edge would be visible.
      camera={{ position: cameraPosition, fov: 46, near: 1, far: 12000 }}
      // Keeps depth precision usable now the view range spans 1..12000.
      gl={{
        logarithmicDepthBuffer: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        // Slightly under 1: the park is lit almost entirely by emissive
        // architecture, and pulling exposure down is what keeps the darkness
        // dark while the LEDs still read as light sources rather than paint.
        toneMappingExposure: 0.92,
      }}
      // Keeps the browser from zooming the page on a double tap, so the
      // gesture reaches the camera instead.
      style={{ touchAction: "none" }}
      // Fires when a click lands on nothing interactive — i.e. empty park.
      onPointerMissed={() => {
        clearRideSelection();
        clearEmployeeSelection();
      }}
    >
      <color attach="background" args={["#05070f"]} />
      <fog
        attach="fog"
        /*
         * Night haze. It begins beyond the park itself so no ride is ever
         * washed out — at the furthest the camera can orbit, the park sits
         * under about 17% haze, enough to give the distance real depth — and
         * it closes well short of the ground's edge, so the land fades into
         * the night instead of ending at a line.
         */
        args={["#0a1020", 900, 4200]}
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
      <ambientLight intensity={0.16} color="#24304a" />
      <hemisphereLight args={["#1c2c4a", "#070a11", 0.34]} />
      {/*
        Same sun as always: identical direction, intensity and colour. Only the
        shadow frustum is widened — and the map enlarged to match — so the
        spread-out park still receives shadows to its edges.
      */}
      <directionalLight
        position={[-210, 320, -150]}
        intensity={0.62}
        color="#a8c4ff"
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-left={-430}
        shadow-camera-right={580}
        shadow-camera-top={560}
        shadow-camera-bottom={-420}
        shadow-camera-far={2100}
      />
      <directionalLight position={[120, 60, 180]} intensity={0.12} color="#5f7bb0" />

      <Suspense fallback={null}>
        <Environment resolution={256}>
          <Lightformer
            intensity={0.32}
            color="#8ea8d8"
            position={[0, 30, 0]}
            scale={[60, 60, 1]}
            rotation={[-Math.PI / 2, 0, 0]}
            form="rect"
          />
          <Lightformer intensity={0.22} color="#7f9ad0" position={[-40, 14, 30]} scale={20} form="ring" />
          <Lightformer intensity={0.18} color="#c79a63" position={[60, 12, -30]} scale={18} form="ring" />
        </Environment>
      </Suspense>

      {/*
        The park between the attractions: paving under every walked route,
        planting graded from formal at the gate to woodland at the boundary,
        lighting, a real perimeter and a landscape beyond it.
      */}
      <ParkEnvironment />

      {/* The central landmark: a fountain, never a ride. Routes bend around it. */}
      <Fountain />

      {/* Ground and plaza stay in unscaled world space. */}
      <ParkGround
        // Half-extent 7000u. The camera can orbit out to 1800u and fog closes
        // at 3800u, so the nearest edge is always at least 5200u away —
        // permanently inside full fog, and therefore never visible.
        size={14000}
        plazaRadius={PLAZA_RADIUS}
        plazaCenter={PLAZA_CENTER}
        // Night landscape: dark, but never pure black — the ground still has to
        // read as planted ground rather than a void.
        grassColor="#16251a"
        plazaColor="#2a2d33"
        plazaRimColor="#1e2126"
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
          <group scale={PARK_SCALE}>
            <FerrisWheel />
            <RideLights id="ferris" />
          </group>
        </group>
      </SelectableRide>

      <SelectableRide id="coaster">
        <group position={offsetFor("coaster")}>
          <group scale={PARK_SCALE}>
            <RollerCoaster />
            <RideLights id="coaster" />
          </group>
        </group>
      </SelectableRide>

      <SelectableRide id="monster">
        <group position={offsetFor("monster")}>
          <group scale={PARK_SCALE}>
            <MonsterRide showLabels={showRiderLabels} />
            <RideLights id="monster" />
          </group>
        </group>
      </SelectableRide>

      <SelectableRide id="dragon">
        <group position={offsetFor("dragon")}>
          <group scale={PARK_SCALE}>
            <DragonRide showLabels={showDragonLabels} />
            <RideLights id="dragon" />
          </group>
        </group>
      </SelectableRide>

      {/* The Drop Tower keeps its exact size — it is the park's scale reference. */}
      <SelectableRide id="tower">
        <DropTower showLabels={showTowerLabels} />
        {/* The tower rig positions itself from TOWER_ORIGIN, like the ride does. */}
        <RideLights id="tower" />
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
        Lit entrance portals, queues, operator booths and landmark masts — one
        set per department, at the arrival point its employees already walk to.
      */}
      <RidePlazas />

      {/* Track and train share one scale so the train can never leave its rails. */}
      <group scale={TRAIN_SCALE}>
        <TrainTrack />
        <ParkTrain showLabels={showTrainLabels} />
        {/* The lit loop that draws the park's outline from the overview. */}
        <TrainRig />
      </group>

      <OrbitControls
        makeDefault
        target={cameraTarget}
        minDistance={30}
        // Far enough to frame the whole property from the main gate,
        // close enough that the park never washes out into the fog.
        maxDistance={1600}
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
