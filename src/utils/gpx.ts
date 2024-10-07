import {
  point as turfPoint,
  distance as turfDistance,
  along,
} from "@turf/turf";

import { XMLParser } from "fast-xml-parser";
import { d, pwrap } from "./constants";
import FileSystem from "./UniversalFileSystem";
import { LatLng } from "@googlemaps/polyline-codec";

export type GpxPoint = { latlng: [number, number] } & Partial<{
  temp: number;
  watts: number;
  cadence: number;
  distance: number;
  heartrate: number;
  altitude: number;
  time: string;
}>;

export type GpxFile = {
  points: GpxPoint[];
  name: string;
};

export type GpxSummary = {
  distance: number;
} & Partial<{
  startTime: string | null;
  durationMs: number | null;
  averageSpeed: number | null;
  averageHeartRate: number | null;
  averageCadence: number | null;
  averagePower: number | null;
}>;

// Return a version of the gpx file with all times offset by the given number of milliseconds
export function offsetAllTimes(gpx: GpxFile, offsetMs: number): GpxFile {
  return {
    ...gpx,
    points: gpx.points.map((point) => ({
      ...point,
      time: point.time
        ? new Date(new Date(point.time).getTime() + offsetMs).toISOString()
        : undefined,
    })),
  };
}

// Converts a list of points into a gpx file
export function pointsToGpx(gpx: GpxFile): string {
  const { points, name } = gpx;
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx creator="GPXSplice with Barometer" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.garmin.com/xmlschemas/GpxExtensions/v3 http://www.garmin.com/xmlschemas/GpxExtensionsv3.xsd http://www.garmin.com/xmlschemas/TrackPointExtension/v1 http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd" version="1.1" xmlns="http://www.topografix.com/GPX/1/1" xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1" xmlns:gpxx="http://www.garmin.com/xmlschemas/GpxExtensions/v3">
    <metadata>
        <name>${name}</name>
    </metadata>
    <trk>
        <name>${name}</name>
        <trkseg>
            ${points
              .map((p) => {
                return `<trkpt lat="${p.latlng?.[0] ?? ""}" lon="${
                  p.latlng?.[1] ?? ""
                }">
                    ${p.altitude != null ? `<ele>${p.altitude}</ele>` : ""}
            </trkpt>`;
              })
              .join("\n")}
        </trkseg>
    </trk>
</gpx>`;
}

// Parses a gpx file as written by the above function into a list of points and its metadata
export function parseGpxFile(filepath: string, gpxContents: string): GpxFile {
  const parser = new XMLParser({
    parseAttributeValue: true,
    ignoreAttributes: false,
  });
  const jsGpx = parser.parse(gpxContents).gpx;
  const name =
    jsGpx.metadata?.name ??
    decodeURIComponent(filepath.split("/").pop() ?? "Unknown Name");
  // trkseg can either be a single object or an array. if it's an array then join them all
  const trkpts = Array.isArray(jsGpx.trk.trkseg)
    ? jsGpx.trk.trkseg.flatMap((seg: any) => seg.trkpt || [])
    : jsGpx.trk.trkseg.trkpt;
  if (!trkpts) {
    throw new Error(
      "No track points found in gpx file. Check the file contents. If this is a bug in the app, please report it!",
    );
  }
  const points = trkpts.map(
    (point: any): GpxPoint => ({
      latlng: [parseFloat(point["@_lat"]), parseFloat(point["@_lon"])],
      altitude: point.ele,
      time: point.time,
      watts: point.extensions?.power,
      cadence: point.extensions?.["gpxtpx:TrackPointExtension"]?.["gpxtpx:cad"],
      heartrate:
        point.extensions?.["gpxtpx:TrackPointExtension"]?.["gpxtpx:hr"],
      temp: point.extensions?.["gpxtpx:TrackPointExtension"]?.["gpxtpx:atemp"],
    }),
  );
  return { points, name };
}

const toTurfJson = (point: GpxPoint | LatLng) => {
  // geojson is long-lat
  if ("latlng" in point) {
    return [point.latlng[1], point.latlng[0]];
  } else {
    return [point.lng, point.lat];
  }
};

const toTurfPoint = (point: GpxPoint | LatLng) => turfPoint(toTurfJson(point));

export const toGpxPoint = (point: LatLng): GpxPoint => ({
  latlng: [point.lat, point.lng],
});

export function toGeoJsonLineString(
  from: GpxPoint | LatLng,
  to: GpxPoint | LatLng,
) {
  return {
    type: "Feature" as const,
    geometry: {
      type: "LineString" as const,
      coordinates: [toTurfJson(from), toTurfJson(to)],
    },
    properties: {},
  };
}

export function calculateCumulativeDistance(points: GpxPoint[]): number[] {
  let cumulativeDistance = 0;
  const cumulativeDistances = [0];

  for (let i = 1; i < points.length; i++) {
    const from = toTurfPoint(points[i - 1]);
    const to = toTurfPoint(points[i]);
    const segmentDistance = turfDistance(from, to, { units: "kilometers" });

    cumulativeDistance += segmentDistance;
    cumulativeDistances.push(cumulativeDistance);
  }

  return cumulativeDistances;
}

/**
 * Resample given array of points to given length, at maximum.
 * If the given points array is already smaller then nothing is done.
 */
export function resamplePoints(
  points: LatLng[],
  resampledSize: number,
): LatLng[] {
  if (points.length <= resampledSize) {
    return points;
  }
  const distances = calculateCumulativeDistance(points.map(toGpxPoint));
  const totalDistance = distances[distances.length - 1];
  const distancePerPoint = totalDistance / resampledSize;
  let distanceSinceLastPoint = 0;
  const resampledPoints = [points[0]];
  let lastPoint = points[0];
  for (let index = 1; index < points.length; index++) {
    const nextPoint = points[index];
    // have we reached required distance per point? if not then add next distance
    if (distanceSinceLastPoint < distancePerPoint) {
      distanceSinceLastPoint += turfDistance(
        toTurfPoint(lastPoint),
        toTurfPoint(nextPoint),
      );
    }
    if (distanceSinceLastPoint >= distancePerPoint) {
      // if so then interpolate a point between lastPoint and nextPoint at the remaining distance, set lastPoint to that interpolated point
      const leftoverDistance = distanceSinceLastPoint - distancePerPoint;
      const distanceToTake =
        turfDistance(toTurfPoint(lastPoint), toTurfPoint(nextPoint)) -
        leftoverDistance;
      const interpolatedPoint = along(
        toGeoJsonLineString(lastPoint, nextPoint),
        Math.max(distanceToTake, 0),
      );
      const interpolatedLatLng = {
        lng: interpolatedPoint.geometry.coordinates[0],
        lat: interpolatedPoint.geometry.coordinates[1],
      };
      resampledPoints.push(interpolatedLatLng);
      lastPoint = interpolatedLatLng;
      distanceSinceLastPoint = 0;
    } else {
      // if not then in the next iteration we continue from this point
      lastPoint = nextPoint;
    }
  }
  d(`resampled points length: ${resampledPoints.length}`);
  return resampledPoints;
}

/**
 * Given elevations at elevationPoints, interpolate to originalPoints length by taking weighted average of the nearest values
 */
export function interpolateElevations(
  originalPoints: LatLng[],
  elevationPoints: LatLng[],
  elevations: number[],
): number[] {
  if (elevations.length === originalPoints.length) {
    return elevations;
  }
  // TODO: minor do a smarter interpolation? the current formula is just to check if I'm closer to current one, or next one, and use that
  let elevationIndex = 0;
  const newElevations = [];
  for (let pointIndex = 0; pointIndex < originalPoints.length; pointIndex++) {
    // We reached the end so can't advance any more
    if (elevationIndex === elevations.length - 1) {
      newElevations.push(elevations[elevationIndex]);
    } else {
      const currentDistance = turfDistance(
        toTurfPoint(originalPoints[pointIndex]),
        toTurfPoint(elevationPoints[elevationIndex]),
      );
      const nextDistance = turfDistance(
        toTurfPoint(originalPoints[pointIndex]),
        toTurfPoint(elevationPoints[elevationIndex + 1]),
      );
      if (nextDistance <= currentDistance) {
        elevationIndex += 1;
      }
      newElevations.push(elevations[elevationIndex]);
    }
  }
  return newElevations;
}

export const writeGpxFile = pwrap(
  "Error saving gpx file",
  async (rootDirectory: string | null, file: GpxFile): Promise<string> => {
    const serializedGpxFileString = pointsToGpx(file);
    const path = `${rootDirectory}${encodeURIComponent(
      file.name.replaceAll("/", "_"),
    )}.gpx`;
    await FileSystem.writeAsStringAsync(path, serializedGpxFileString);
    return path;
  },
);
