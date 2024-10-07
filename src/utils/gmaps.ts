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
  const daddrParts = daddrValue.split(/\+to:/i);
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

// Input: google maps app url or regular google url
// Output: GpxFile containing all the points
// e.g.
// original url: https://maps.app.goo.gl/H5YWrk11Dw3xcUgAA\?g_st\=ia
// redirect: https://maps.google.com/?geocode=FVugHgMdGatKAA%3D%3D;FYcVHwMdlVJKACk3GvOWZwnGRzHZNxBwTiGTTg%3D%3D;FT4gHwMdn3NKAClrSYrQQgnGRzH7DBmyV3zy5Q%3D%3D;FYkhHwMd8LVKACk90mFNvwnGRzHrlnr9jABqSQ%3D%3D&daddr=Ikaria+Food,+Bilderdijkstraat,+Amsterdam+to:Breadwinner,+Tweede+Laurierdwarsstraat,+Amsterdam+to:Oriental+City+Amsterdam,+Oudezijds+Voorburgwal,+Amsterdam&saddr=52.3387790,4.8934655&dirflg=b&ftid=0x47c609bf4d61d23d:0x496a008cfd7a96eb&lucs=,94231799,94242496,94224825,94227247,94227248,47071704,47069508,94218641,94203019,47084304,94208458,94208447&g_ep=CAISDTYuMTM1LjEuODcwOTAYACC6twsqbCw5NDIzMTc5OSw5NDI0MjQ5Niw5NDIyNDgyNSw5NDIyNzI0Nyw5NDIyNzI0OCw0NzA3MTcwNCw0NzA2OTUwOCw5NDIxODY0MSw5NDIwMzAxOSw0NzA4NDMwNCw5NDIwODQ1OCw5NDIwODQ0N0ICTkw%3D&g_st=ia
export const gmapsUrlToGpx = pwrap(
  "Error converting directions to GPX",
  async (inputUrl: URL) => {
    const webUrlBase = "https://www.google.com/maps/dir";
    const finalUrl = await handleGoogleRedirectAndConsent(inputUrl);
    d(`converted ${inputUrl} to ${finalUrl}`);
    // Parse the saddr, daddr, and to points in the url search params
    const { waypoints, mode } = finalUrl.toString().includes(webUrlBase)
      ? parseGMapsWebUrl(finalUrl)
      : parseGMapsAppUrl(finalUrl);

    const start = waypoints[0];
    const dest = waypoints[waypoints.length - 1];
    const encodedWaypoints =
      waypoints.length > 2
        ? `&waypoints=via:${waypoints
            .slice(1, waypoints.length - 1)
            .map(encodeURIComponent)
            .join("|via:")}`
        : "";
    const urlModeToApiMode = {
      b: "bicycling",
      d: "driving",
      w: "walking",
      t: "transit",
      // TODO minor fix the typing here
    } as any;
    const apiMode = urlModeToApiMode[mode];
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
      start,
    )}&destination=${encodeURIComponent(dest)}${encodedWaypoints}&mode=${apiMode}`;

    d(
      `start = ${start}, dest = ${dest}, waypoints = ${encodedWaypoints}, mode = ${mode}`,
    );
    d(`sending directions request: ${url}`);
    const response = await fetch(withKey(url));

    const result = await response.json();
    d("got result from google maps api", result);
    if (response.status !== 200) {
      throw new Error(result.error_message);
    }

    const route = result.routes[0];
    if (!route) {
      throw new Error(`No route found, Google Maps status: ${result.status}`);
    }
    const name = (route.summary ?? `${start} => ${dest}`) + ` ${apiMode}`;
    let km = 0.0;
    let points: LatLng[] = [];
    for (const leg of route.legs) {
      for (const step of leg.steps) {
        points = points.concat(
          decode(step.polyline.points).map(([lat, lng]) => ({ lat, lng })),
        );
        km += step.distance.value / 1000;
      }
    }
    const gpxPoints = [];
    const defaultElevations = Array(points.length).fill(0);
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
    // But in practice I think there's some kind of request size limit too, so I pick 400 here
    const resampledPoints = resamplePoints(points, 400);
    const encodedLocations = resampledPoints
      .map((point) => `${point.lat},${point.lng}`)
      .join("|");
    const url = `https://maps.googleapis.com/maps/api/elevation/json?locations=${encodeURIComponent(encodedLocations)}`;
    d(`encodedLocations length: ${encodedLocations.length}`);

    const response = await fetch(withKey(url));

    const text = await response.text();
    const result = JSON.parse(text);
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
