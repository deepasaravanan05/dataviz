"use client";

import type { ThreeEvent } from "@react-three/fiber";
import type { ReactNode } from "react";
import { useRideSelectionStore } from "@/store/rideSelectionStore";
import { PARK_LAYOUT, rideById } from "./layout";
import type { DepartmentRideId } from "./departments";

/**
 * Makes an existing ride clickable without touching it.
 *
 * ADD-ONLY: this wraps a ride's existing group and does nothing but listen.
 * React Three Fiber events bubble up from descendant meshes, so a click
 * anywhere on the ride's real geometry reaches this wrapper — no ride
 * component, material, transform or animation is modified, and the children
 * are rendered exactly as they were.
 */
export function SelectableRide({
  id,
  children,
}: {
  id: DepartmentRideId;
  children: ReactNode;
}) {
  const select = useRideSelectionStore((s) => s.select);
  const setHovered = useRideSelectionStore((s) => s.setHovered);

  return (
    <group
      onClick={(e: ThreeEvent<MouseEvent>) => {
        // Without this the click also counts as a miss on the ride behind.
        e.stopPropagation();
        select(id);
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setHovered(id);
      }}
      onPointerOut={() => setHovered(null)}
    >
      {children}
    </group>
  );
}

/**
 * The highlight drawn around a hovered or selected ride.
 *
 * Deliberately a separate object on the ground rather than a change to the
 * ride's own materials: the ride keeps its exact colours and keeps animating,
 * and nothing has to be restored when the highlight goes away.
 */
const RING_LIFT = 0.4;
const RAIL = 1.1;

function Outline({
  rideId,
  color,
  opacity,
  padding,
}: {
  rideId: DepartmentRideId;
  color: string;
  opacity: number;
  padding: number;
}) {
  const r = rideById(rideId);
  const halfX = r.halfX + padding;
  const halfZ = r.halfZ + padding;

  const edges: { position: [number, number, number]; size: [number, number, number] }[] = [
    { position: [r.center[0], RING_LIFT, r.center[1] - halfZ], size: [halfX * 2, RAIL, RAIL] },
    { position: [r.center[0], RING_LIFT, r.center[1] + halfZ], size: [halfX * 2, RAIL, RAIL] },
    { position: [r.center[0] - halfX, RING_LIFT, r.center[1]], size: [RAIL, RAIL, halfZ * 2] },
    { position: [r.center[0] + halfX, RING_LIFT, r.center[1]], size: [RAIL, RAIL, halfZ * 2] },
  ];

  /** Short posts at the corners, so the marker reads from a low angle too. */
  const corners: [number, number][] = [
    [r.center[0] - halfX, r.center[1] - halfZ],
    [r.center[0] + halfX, r.center[1] - halfZ],
    [r.center[0] - halfX, r.center[1] + halfZ],
    [r.center[0] + halfX, r.center[1] + halfZ],
  ];

  return (
    <group>
      {edges.map((e, i) => (
        <mesh key={i} position={e.position}>
          <boxGeometry args={e.size} />
          <meshBasicMaterial color={color} transparent opacity={opacity} toneMapped={false} />
        </mesh>
      ))}
      {corners.map(([x, z], i) => (
        <mesh key={`c${i}`} position={[x, RING_LIFT + 3, z]}>
          <boxGeometry args={[RAIL * 1.3, 7, RAIL * 1.3]} />
          <meshBasicMaterial color={color} transparent opacity={opacity * 0.7} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/** Draws the hover and selection markers for whichever rides need them. */
export function RideHighlights() {
  const selected = useRideSelectionStore((s) => s.selected);
  const hoveredId = useRideSelectionStore((s) => s.hoveredId);

  const selectedId = selected?.rideId ?? null;
  const isDepartmentRide = (id: string | null): id is DepartmentRideId =>
    id !== null && PARK_LAYOUT.some((r) => r.id === id);

  return (
    <group>
      {isDepartmentRide(hoveredId) && hoveredId !== selectedId && (
        <Outline rideId={hoveredId} color="#ffffff" opacity={0.34} padding={7} />
      )}
      {isDepartmentRide(selectedId) && (
        <Outline rideId={selectedId} color="#38bdf8" opacity={0.8} padding={7} />
      )}
    </group>
  );
}
