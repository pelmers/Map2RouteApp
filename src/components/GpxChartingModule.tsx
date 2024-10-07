// Component that displays elevation, speed, heartrate charts from gpx data
// Contains a row of selector buttons, depending on which button is selected shows an easy line chart
// Which buttons are available depends on the data in the gpx

import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { useSettings } from "../providers/SettingsProvider";
import {
  DISTANCE_UNITS,
  ELEVATION_UNITS,
  SavedSettings,
  convert,
} from "../types/settings";
import { colors } from "../utils/colors";
import { GpxFile, GpxPoint, calculateCumulativeDistance } from "../utils/gpx";
import { EasyLineChart } from "./EasyLineChart";

type Props = {
  gpxFile: GpxFile;
  chartHeight: number;
  chartWidth: number;
};

function computeXYValues(points: GpxPoint[], settings: SavedSettings) {
  const xValues = calculateCumulativeDistance(points);
  const yValues: number[] = [];

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const { value } = convert(point.altitude ?? 0, ELEVATION_UNITS.M, settings);
    yValues.push(value);
  }
  // At the end also convert all x values to the correct distance unit from KM
  for (let i = 0; i < xValues.length; i++) {
    xValues[i] = convert(xValues[i], DISTANCE_UNITS.KM, settings).value;
  }
  return {
    xValues,
    yValues,
  };
}

export function GpxChartingModule(props: Props) {
  const { settings } = useSettings();
  const { gpxFile, chartHeight, chartWidth } = props;
  const { xValues, yValues } = useMemo(
    () => computeXYValues(gpxFile.points, settings),
    [gpxFile],
  );

  // A row of buttons with icons, then a chart below
  return (
    <View>
      <View style={styles.chartContainer}>
        <EasyLineChart
          xValues={xValues}
          yValues={yValues}
          yAxisUnits={settings.elevationUnit}
          maxPoints={100}
          width={chartWidth}
          height={chartHeight}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    marginVertical: 5,
  },
  button: {
    width: 50,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  enabledButton: {
    backgroundColor: colors.tertiary,
  },
  currentButton: {
    backgroundColor: colors.light,
  },
  disabledButton: {
    backgroundColor: colors.accent,
    opacity: 0.4,
  },
  buttonText: {
    fontSize: 20,
  },
  aggregateText: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  chartContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
});
