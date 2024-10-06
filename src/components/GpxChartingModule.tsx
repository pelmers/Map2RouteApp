// Component that displays elevation, speed, heartrate charts from gpx data
// Contains a row of selector buttons, depending on which button is selected shows an easy line chart
// Which buttons are available depends on the data in the gpx

import React, { useState, useMemo } from "react";
import { StyleSheet, View, Text, TouchableHighlight } from "react-native";

import { colors } from "../utils/colors";
import { GpxFile, GpxPoint, calculateCumulativeDistance } from "../utils/gpx";
import { EasyLineChart } from "./EasyLineChart";
import { useSettings } from "../providers/SettingsProvider";
import {
  DISTANCE_UNITS,
  ELEVATION_UNITS,
  SPEED_UNITS,
  SavedSettings,
  TEMP_UNITS,
  convert,
} from "../types/settings";

type Props = {
  gpxFile: GpxFile;
  chartHeight: number;
  chartWidth: number;
};

type ChartType =
  | "elevation"
  | "speed"
  | "heartrate"
  | "cadence"
  | "power"
  | "temperature";

const ChartTypesArray: ChartType[] = [
  "elevation",
  "speed",
  "heartrate",
  "cadence",
  "power",
  "temperature",
];

function iconForType(chartType: ChartType, sportType: string) {
  switch (chartType) {
    case "elevation":
      return "🏔";
    case "speed":
      return "🚀";
    case "heartrate":
      return "❤️";
    case "cadence":
      return sportType.toLowerCase().indexOf("run") >= 0 ? "🏃‍♂️" : "🚴‍♂️";
    case "power":
      return "🔋";
    case "temperature":
      return "🌡";
  }
}

function enabledForType(chartType: ChartType, points: GpxPoint[]) {
  switch (chartType) {
    case "heartrate":
      return points.some((point) => point.heartrate != null);
    case "cadence":
      return points.some((point) => point.cadence != null);
    case "power":
      return points.some((point) => point.watts != null);
    case "temperature":
      return points.some((point) => point.temp != null);
    case "elevation":
      return points.some((point) => point.altitude != null);
    case "speed":
      return points.some((point) => point.time != null);
  }
}

function yAxisUnitsForType(chartType: ChartType, settings: SavedSettings) {
  switch (chartType) {
    case "elevation":
      return settings.elevationUnit;
    case "speed":
      return settings.speedUnit;
    case "heartrate":
      return "";
    case "cadence":
      return "rpm";
    case "power":
      return "W";
    case "temperature":
      return settings.tempUnit;
  }
}

type AggregateType = "gain" | "avg";

function computeXYValues(
  points: GpxPoint[],
  chartType: ChartType,
  settings: SavedSettings,
) {
  if (!enabledForType(chartType, points)) {
    throw new Error("Chart type not enabled for this data");
  }
  const xValues = calculateCumulativeDistance(points);
  const yValues: number[] = [];
  // yValueAggregaetes contains a list to allow efficient calculation of the aggregate at any split point
  const yValueAggregateSums: number[] = [];
  const yValueAggregateType =
    chartType === "elevation"
      ? ("gain" as AggregateType)
      : ("avg" as AggregateType);

  for (let i = 0; i < points.length; i++) {
    const lastYValueAggregateSum = yValueAggregateSums[i - 1] ?? 0;
    const point = points[i];
    switch (chartType) {
      case "elevation":
        yValues.push(
          convert(point.altitude ?? 0, ELEVATION_UNITS.M, settings).value,
        );
        break;
      case "speed":
        // speed is distance / time, so it needs 2 points
        if (i == 0) {
          yValues.push(0);
        } else {
          const distance = xValues[i] - xValues[i - 1];
          const time1 = new Date(points[i].time!).getTime() / 1000;
          const time2 = new Date(points[i - 1].time!).getTime() / 1000;
          const duration = time1 - time2;
          // to avoid a divide by zero, if the time is almost 0, just use the previous speed
          if (duration < 0.1) {
            yValues.push(yValues[i - 1]);
          } else {
            // convert time from seconds to hours
            yValues.push(
              convert(distance / (duration / 3600), SPEED_UNITS.KMH, settings)
                .value,
            );
          }
        }
        break;
      case "heartrate":
        yValues.push(point.heartrate ?? 0);
        break;
      case "cadence":
        yValues.push(point.cadence ?? 0);
        break;
      case "power":
        yValues.push(point.watts ?? 0);
        break;
      case "temperature":
        yValues.push(convert(point.temp ?? 0, TEMP_UNITS.C, settings).value);
        break;
    }
    switch (yValueAggregateType) {
      case "gain":
        const yValueAggregate =
          i > 0 ? Math.max(0, yValues[i] - yValues[i - 1]) : 0;
        yValueAggregateSums.push(yValueAggregate + lastYValueAggregateSum);
        break;
      case "avg":
        yValueAggregateSums.push(yValues[i] + lastYValueAggregateSum);
        break;
    }
  }
  // At the end also convert all x values to the correct distance unit from KM
  for (let i = 0; i < xValues.length; i++) {
    xValues[i] = convert(xValues[i], DISTANCE_UNITS.KM, settings).value;
  }
  return {
    xValues,
    yValues,
    yValueAggregateSums,
    yValueAggregateType,
  };
}

function ChartButtonRow(props: {
  currentType: ChartType;
  gpxFile: GpxFile;
  onPress: (chartType: ChartType) => void;
}) {
  return (
    <View style={styles.buttonRow}>
      {ChartTypesArray.map((type) => {
        const enabled = enabledForType(type, props.gpxFile.points);
        const icon = iconForType(type, props.gpxFile.type);
        return (
          <TouchableHighlight
            underlayColor={colors.primary}
            disabled={!enabled}
            key={type}
            onPress={() => props.onPress(type)}
            style={[
              styles.button,
              props.currentType === type
                ? styles.currentButton
                : enabled
                  ? styles.enabledButton
                  : styles.disabledButton,
            ]}
          >
            <Text style={styles.buttonText}>{icon}</Text>
          </TouchableHighlight>
        );
      })}
    </View>
  );
}

export function GpxChartingModule(props: Props) {
  const [chartType, setChartType] = useState<ChartType>("elevation");
  const { settings } = useSettings();
  const { gpxFile, chartHeight, chartWidth } = props;
  const { xValues, yValues, yValueAggregateSums, yValueAggregateType } =
    useMemo(
      () => computeXYValues(gpxFile.points, chartType, settings),
      [gpxFile, chartType],
    );

  const yUnits = yAxisUnitsForType(chartType, settings);

  const aggregateForInterval = (start: number, end: number) => {
    switch (yValueAggregateType) {
      case "gain":
        return yValueAggregateSums[end - 1] - yValueAggregateSums[start];
      case "avg":
        return (
          (yValueAggregateSums[end - 1] - yValueAggregateSums[start]) /
          (end - start)
        );
    }
  };

  // A row of buttons with icons, then a chart below
  return (
    <View>
      <ChartButtonRow
        currentType={chartType}
        gpxFile={gpxFile}
        onPress={setChartType}
      />
      <View style={styles.chartContainer}>
        <EasyLineChart
          xValues={xValues}
          yValues={yValues}
          yAxisUnits={yUnits}
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
