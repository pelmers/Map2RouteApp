export const DISTANCE_UNITS = {
  KM: "km",
  MI: "mi",
} as const;

export const ELEVATION_UNITS = {
  M: "m",
  FT: "ft",
} as const;

export type DistanceKey = keyof typeof DISTANCE_UNITS;
export type ElevationKey = keyof typeof ELEVATION_UNITS;

export type DistanceUnit = (typeof DISTANCE_UNITS)[DistanceKey];
export type ElevationUnit = (typeof ELEVATION_UNITS)[ElevationKey];

export type SavedSettings = {
  distanceUnit: DistanceUnit;
  elevationUnit: ElevationUnit;
};

export const DefaultSettings: SavedSettings = {
  distanceUnit: DISTANCE_UNITS.KM,
  elevationUnit: ELEVATION_UNITS.M,
};

type AnyUnit = DistanceUnit | ElevationUnit;

export function convert(
  value: number,
  from: AnyUnit,
  settings: SavedSettings,
): { value: number; unit: AnyUnit } {
  switch (from) {
    case DISTANCE_UNITS.KM:
    case DISTANCE_UNITS.MI:
      return {
        value: convertDistance(value, from, settings.distanceUnit),
        unit: settings.distanceUnit,
      };
    case ELEVATION_UNITS.M:
    case ELEVATION_UNITS.FT:
      return {
        value: convertElevation(value, from, settings.elevationUnit),
        unit: settings.elevationUnit,
      };
  }
}

function convertDistance(
  value: number,
  from: DistanceUnit,
  to: DistanceUnit,
): number {
  if (from === to) {
    return value;
  }

  if (from === "km" && to === "mi") {
    return value / 1.609;
  } else {
    return value * 1.609;
  }
}

function convertElevation(
  value: number,
  from: ElevationUnit,
  to: ElevationUnit,
): number {
  if (from === to) {
    return value;
  }

  if (from === "m" && to === "ft") {
    return value * 3.281;
  } else {
    return value / 3.281;
  }
}
