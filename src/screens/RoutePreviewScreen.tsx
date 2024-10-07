import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ActivityIndicator } from "react-native";

import FileSystem from "../utils/UniversalFileSystem";

import { colors } from "../utils/colors";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../routes";
import { GpxFile, parseGpxFile } from "../utils/gpx";
import { GpxMapView } from "../components/GpxMapView";
import { ExportButtonRow } from "../components/ExportButtonRow";
import { ErrorTextComponent } from "src/components/ErrorTextComponent";
import { pwrap } from "src/utils/constants";

type Props = NativeStackScreenProps<RootStackParamList, "Route Preview">;

export function RoutePreviewScreen({ navigation, route }: Props) {
  const [gpx, setGpx] = useState<GpxFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { gpxFileUri } = route.params;
  // Read the gpx file on mount
  useEffect(() => {
    async function readGpxFile() {
      const fileContents = await FileSystem.readAsStringAsync(gpxFileUri);
      const parsedGpx = parseGpxFile(gpxFileUri, fileContents);
      setGpx(parsedGpx);
    }
    pwrap("Error reading gpx file", readGpxFile)().catch((e) => {
      setError((e as Error).message);
    });
  }, [gpxFileUri]);

  if (error) {
    return (
      <View style={styles.container}>
        <ErrorTextComponent errorText={error} />
      </View>
    );
  }

  if (!gpx) {
    return (
      <View style={styles.container}>
        <Text style={styles.titleText}>Loading...</Text>
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  return (
    <GpxMapView
      gpx={gpx}
      buttonRow={<ExportButtonRow gpx={gpx} onError={setError} />}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    color: colors.light,
    fontSize: 18,
  },
});
