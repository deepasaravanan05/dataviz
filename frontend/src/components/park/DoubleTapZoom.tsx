"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Raycaster, Vector2, Vector3, type Mesh, type Object3D } from "three";
import {
  TAP_MAX_DURATION_MS,
  TAP_MAX_MOVE_PX,
  ZOOM_DURATION,
  easeInOut,
  isDoubleTap,
  zoomStep,
  type ZoomState,
} from "./doubleTapZoom";

/**
 * Double-tap (or double-click) anywhere in the park to zoom toward whatever is
 * under your finger; double-tap again once fully zoomed in to pull back out to
 * the page's own framing.
 *
 * ADD-ONLY: this drives the existing OrbitControls rather than replacing them.
 * Single-finger orbit, drag-pan and pinch-zoom all keep working exactly as
 * before — the gesture only fires on a genuine double tap, which is why a tap
 * is rejected if the finger moved (that was an orbit drag) or lingered.
 */

/** Minimal shape of the OrbitControls instance we drive. */
interface ControlsLike {
  target: Vector3;
  enabled: boolean;
  minDistance: number;
  maxDistance: number;
  update: () => void;
}

interface Tap {
  x: number;
  y: number;
  time: number;
}

/** The sky dome and other effectively-infinite geometry must not be pickable. */
function isPickable(object: Object3D): boolean {
  const mesh = object as Mesh;
  if (!mesh.isMesh || !mesh.visible) return false;

  // drei's <Sky> is a ShaderMaterial on a vast sphere — tapping it should read
  // as "tapped the sky", not as a hit 450,000 units away.
  const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
  if (material && material.type === "ShaderMaterial") return false;

  const geometry = mesh.geometry;
  if (!geometry) return false;
  if (!geometry.boundingSphere) geometry.computeBoundingSphere();
  const radius = geometry.boundingSphere?.radius ?? 0;
  const scale = Math.max(
    Math.abs(mesh.scale.x),
    Math.abs(mesh.scale.y),
    Math.abs(mesh.scale.z),
  );
  return radius * scale < 20000;
}

export function DoubleTapZoom({ factor = 0.5 }: { factor?: number }) {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const controls = useThree((s) => s.controls) as unknown as ControlsLike | null;

  /*
   * The camera and the controls are driven imperatively once a gesture starts,
   * so they are held in refs rather than used straight off the render binding.
   * That keeps every write inside a ref — the same pattern the rides use for
   * their animation loops — instead of mutating values owned by the render.
   */
  const cameraRef = useRef(camera);
  const controlsRef = useRef<ControlsLike | null>(controls);

  /** The framing the page started with, restored when zoomed all the way in. */
  const home = useRef<ZoomState | null>(null);
  const lastTap = useRef<Tap | null>(null);
  const pointerDown = useRef<Tap | null>(null);

  const anim = useRef<{
    t: number;
    from: ZoomState;
    to: ZoomState;
  } | null>(null);

  const raycaster = useRef(new Raycaster());
  const ndc = useRef(new Vector2());

  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  useEffect(() => {
    controlsRef.current = controls;
  }, [controls]);

  // Capture the page's own framing once the controls exist.
  useEffect(() => {
    if (!controls || home.current) return;
    home.current = {
      position: camera.position.clone(),
      target: controls.target.clone(),
    };
  }, [controls, camera]);

  useEffect(() => {
    const el = gl.domElement;
    if (!el) return;

    function pick(clientX: number, clientY: number): Vector3 | null {
      const rect = el.getBoundingClientRect();
      ndc.current.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      );
      const cam = cameraRef.current;
      raycaster.current.setFromCamera(ndc.current, cam);

      const hits = raycaster.current.intersectObjects(scene.children, true);
      for (const hit of hits) {
        if (isPickable(hit.object)) return hit.point.clone();
      }
      return null;
    }

    function onPointerDown(e: PointerEvent) {
      pointerDown.current = { x: e.clientX, y: e.clientY, time: performance.now() };
    }

    function onPointerUp(e: PointerEvent) {
      const down = pointerDown.current;
      pointerDown.current = null;
      const activeControls = controlsRef.current;
      const activeCamera = cameraRef.current;
      if (!down || !activeControls || !home.current) return;

      const now = performance.now();
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);

      // A drag is an orbit, not a tap; a long press is not a tap either.
      if (moved > TAP_MAX_MOVE_PX || now - down.time > TAP_MAX_DURATION_MS) {
        lastTap.current = null;
        return;
      }

      const tap: Tap = { x: e.clientX, y: e.clientY, time: now };

      if (!isDoubleTap(lastTap.current, tap)) {
        lastTap.current = tap;
        return;
      }
      lastTap.current = null;

      const to = zoomStep(
        activeCamera.position,
        activeControls.target,
        pick(e.clientX, e.clientY),
        {
          minDistance: activeControls.minDistance,
          maxDistance: activeControls.maxDistance,
          factor,
          home: home.current,
        },
      );

      anim.current = {
        t: 0,
        from: {
          position: activeCamera.position.clone(),
          target: activeControls.target.clone(),
        },
        to,
      };
      activeControls.enabled = false;
    }

    /** Stop text selection on desktop double-click. */
    function onDoubleClick(e: Event) {
      e.preventDefault();
    }

    /*
     * Note: on touch devices it is the canvas's `touch-action: none` that stops
     * the browser zooming the *page* on a double tap. That is set declaratively
     * on the <Canvas> in each scene rather than mutated from here, so this hook
     * never writes to anything it does not own.
     */
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    el.addEventListener("dblclick", onDoubleClick);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
      el.removeEventListener("dblclick", onDoubleClick);
    };
  }, [gl, scene, factor]);

  useFrame((_, delta) => {
    const a = anim.current;
    const activeControls = controlsRef.current;
    const activeCamera = cameraRef.current;
    if (!a || !activeControls) return;

    a.t = Math.min(a.t + delta / ZOOM_DURATION, 1);
    const k = easeInOut(a.t);

    activeCamera.position.lerpVectors(a.from.position, a.to.position, k);
    activeControls.target.lerpVectors(a.from.target, a.to.target, k);
    activeControls.update();

    if (a.t >= 1) {
      anim.current = null;
      activeControls.enabled = true;
    }
  });

  return null;
}
