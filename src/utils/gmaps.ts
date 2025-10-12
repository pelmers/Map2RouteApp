import { GpxFile, interpolateElevations, resamplePoints } from "./gpx";
import axios from "axios";
import { decode, LatLng } from "@googlemaps/polyline-codec";
import googleApiKey from "src/googleApiKey";
import { wrap, pwrap, d, pswallow } from "src/utils/constants";

import "react-native-url-polyfill/auto";

// Parse the first url from text, or null
export const parseUrlFromText = wrap("Error parsing URL", (text: string) => {
  d(`looking for url in ${text}`);
  const regex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(regex);
  if (!matches || matches.length === 0) {
    return null;
  } else {
    d(`url match result: ${matches[0]}`);
    return new URL(matches[0]);
  }
});

export const handleGoogleRedirectAndConsent = pwrap(
  "Error handling Google redirect",
  async (url: URL) => {
    const response = await axios.get(url.toString(), {
      // Follow only 1 redirect
      maxRedirects: 1,
    });

    // Google might put up a consent screen with a "continue" parameter, so decode that
    let parsedUrl = new URL(response.request.responseURL);

    if (parsedUrl.hostname.includes("consent.google.com")) {
      const regex = /continue=([^&]*)/i;
      const match = parsedUrl.search.match(regex);
      if (match) {
        const continueValue = match[1];
        if (continueValue) {
          parsedUrl = new URL(decodeURIComponent(continueValue));
        } else {
          throw new Error("could not parse consent screen redirection");
        }
      }
    }
    return parsedUrl;
  },
);

export type GMapsGpxResult = {
  gpx: GpxFile;
};

export type ParsedGMapsURL = {
  waypoints: string[];
  mode: string;
};

function parseGMapsAppUrl(url: URL): ParsedGMapsURL {
  d("parsing as app url");
  // Parse the saddr, daddr, and to points in the url search params
  const queryParams = new URLSearchParams(url.search);
  if (!queryParams.has("saddr")) {
    throw new Error("Start address not found");
  }
  if (!queryParams.has("daddr")) {
    throw new Error("Destination not found");
  }
  const waypoints = [decodeURIComponent(queryParams.get("saddr")!)];

  const daddrValue = queryParams.get("daddr")!;
  const daddrParts = daddrValue.split(/[\+|\s]to:/i);
  for (const part of daddrParts) {
    waypoints.push(decodeURIComponent(part.trim()));
  }
  // TODO: handle transit? that one is a more complicated url
  const mode = queryParams.get("dirflg") ?? "b";
  return { waypoints, mode };
}

function parseGMapsWebUrl(url: URL): ParsedGMapsURL {
  d("parsing as web url", url.pathname);
  // Parse mode from the protobuf part of the url
  const modeRegex = /data=.*\!3e(\d)/g;
  const modeMatch = modeRegex.exec(url.pathname);
  const modeValueToMode = ["d", "b", "w", "t"];
  const modeValue = Number.parseInt((modeMatch ?? ["", "2"])[1]);
  const waypoints = [];
  // The path will look like /maps/dir/start/locations/@view/data...
  const parts = url.pathname.split("/");
  for (const part of parts) {
    // Ignored segments of the url
    if (
      part.trim() === "" ||
      part.startsWith("maps") ||
      part.startsWith("@") ||
      part.startsWith("dir") ||
      part.startsWith("data=")
    ) {
      continue;
    }
    waypoints.push(decodeURIComponent(part));
  }

  return { waypoints, mode: modeValueToMode[modeValue] };
}

function withKey(url: string): string {
  return `${url}&key=${googleApiKey}`;
}

function toApiWaypoint(input: string) {
  // If it looks like a lat/long then we need to put it in the right format
  // lat/lng starts with an @ in maps links and will only have only numbers, comma, period, negative sign, ends with z
  const regex = /(-?\d+\.\d+),(-?\d+\.\d+)/;
  const match = input.match(regex);
  if (match) {
    return {
      location: {
        latLng: {
          latitude: Number.parseFloat(match[1]),
          longitude: Number.parseFloat(match[2]),
        },
      },
    };
  } else {
    return {
      address: input,
    };
  }
}

// Input: google maps app url or regular google url
// Output: GpxFile containing all the points
export const gmapsUrlToGpxViaRoutesApi = pwrap(
  "Error converting directions to GPX with Google API",
  async (inputUrl: URL) => {
    const webUrlBase = "https://www.google.com/maps/dir";
    const finalUrl = await handleGoogleRedirectAndConsent(inputUrl);
    d(`converted ${inputUrl} to ${finalUrl}`);
    // Parse the saddr, daddr, and to points in the url search params
    const { waypoints, mode } = finalUrl.toString().includes(webUrlBase)
      ? parseGMapsWebUrl(finalUrl)
      : parseGMapsAppUrl(finalUrl);

    const apiWaypoints = waypoints.map(toApiWaypoint);
    const origin = apiWaypoints[0];
    const destination = apiWaypoints[apiWaypoints.length - 1];
    const intermediates =
      apiWaypoints.length > 2
        ? apiWaypoints.slice(1, apiWaypoints.length - 1)
        : [];
    const urlModeToApiMode = {
      b: "BICYCLE",
      d: "DRIVE",
      w: "WALK",
      t: "TRANSIT",
    } as any;
    const apiMode = urlModeToApiMode[mode] ?? "DRIVE";
    const url = "https://routes.googleapis.com/directions/v2:computeRoutes";
    const body = {
      origin,
      destination,
      intermediates,
      travelMode: apiMode,
      polylineEncoding: "ENCODED_POLYLINE",
      polylineQuality: "HIGH_QUALITY",
      optimizeWaypointOrder: false,
    };

    d(`sending directions request: ${url} with body ${JSON.stringify(body)}`);
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "X-Goog-Api-Key": googleApiKey,
        "X-Goog-FieldMask": "*",
      },
    });

    const result = await response.json();
    d("result from google routes api", result);
    if (response.status !== 200) {
      throw new Error(result.error_message);
    }

    const route = result.routes[0];
    if (!route) {
      throw new Error(`No route found, Google Maps status: ${result.status}`);
    }
    const name =
      (route.description ?? `${origin} => ${destination}`) + ` ${apiMode}`;
    let km = 0.0;
    let points: LatLng[] = [];
    for (const leg of route.legs) {
      points = points.concat(
        decode(leg.polyline.encodedPolyline).map(([lat, lng]) => ({
          lat,
          lng,
        })),
      );
      km += leg.distanceMeters / 1000;
    }
    d(`Parsed ${points.length} points from routes api response`);
    const gpxPoints = [];
    const defaultElevations = Array(points.length).fill(0);
    // TODO pelmers if there's some error in elevations then show it in the chart somehow
    let elevations = await pswallow(
      defaultElevations,
      elevationsForPoints,
    )(points);
    if (elevations.length !== points.length) {
      d(
        `Expected ${points.length} elevation data points but received ${elevations.length}`,
      );
      elevations = defaultElevations;
    }
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      const elevation = elevations[i];
      gpxPoints.push({
        altitude: elevation,
        latlng: [point.lat, point.lng] as [number, number],
      });
    }
    const gpx = { name, points: gpxPoints };
    return { gpx };
  },
);

export const elevationsForPoints = pwrap(
  "Error getting elevations",
  async (points: LatLng[]): Promise<number[]> => {
    // Google API limits elevation requests to 512 points maximum.
    // But there must also be a request length limit that is easy to reach if you don't cap the precision of the floats
    const resampledPoints = resamplePoints(points, 512);
    // 5 decimal points gives precision down to the meter
    const encodedLocations = resampledPoints
      .map((point) => `${point.lat.toFixed(5)},${point.lng.toFixed(5)}`)
      .join("|");
    const url = `https://maps.googleapis.com/maps/api/elevation/json?locations=${encodeURIComponent(encodedLocations)}`;
    d(`encodedLocations length: ${encodedLocations.length}`);

    const response = await fetch(withKey(url));

    const text = await response.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch (err) {
      throw new Error(`failed to parse JSON: ${text}`);
    }
    if (response.status !== 200) {
      throw new Error(result.error_message);
    }
    d("get result points from google elevation api", result.results.length);
    return interpolateElevations(
      points,
      resampledPoints,
      result.results.map((data: any) => data.elevation),
    );
  },
);
