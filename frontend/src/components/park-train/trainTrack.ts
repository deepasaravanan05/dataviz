import { CatmullRomCurve3, Vector3 } from "three";
import { RAIL_Y, TRACK_CENTER, TRACK_RADIUS_X, TRACK_RADIUS_Z, TRACK_SAMPLES } from "./constants";

/**
 * The park's outer loop: a closed, flat elliptical curve built from many
 * points sampled directly on the true ellipse (not a handful of control
 * points), so the Catmull-Rom spline hugs the ellipse almost exactly —
 * smooth curves everywhere, no straight-line approximation and no corners.
 */
export const TRACK_CURVE = new CatmullRomCurve3(
  Array.from({ length: TRACK_SAMPLES }, (_, i) => {
    const a = (i / TRACK_SAMPLES) * Math.PI * 2;
    return new Vector3(
      TRACK_CENTER[0] + TRACK_RADIUS_X * Math.cos(a),
      RAIL_Y,
      TRACK_CENTER[1] + TRACK_RADIUS_Z * Math.sin(a),
    );
  }),
  true,
  "catmullrom",
  0.5,
);

export const TRACK_LENGTH = TRACK_CURVE.getLength();
