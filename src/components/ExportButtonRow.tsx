import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableHighlight,
  ActivityIndicator,
} from "react-native";

import * as Sharing from "expo-sharing";

import { colors } from "../utils/colors";
import { GpxFile, pointsToGpx, writeGpxFile } from "../utils/gpx";
import FileSystem from "../utils/UniversalFileSystem";
import { pwrap } from "src/utils/constants";

type Props = {
  gpx: GpxFile;
  onError: (error: string) => void;
};

const buttonFontSize = 24;

export function ExportButtonRow(props: Props) {
  const { gpx, onError } = props;
  const [loadingFile, setLoadingFile] = useState(false);

  const withLoadingState =
    (
      setter: React.Dispatch<React.SetStateAction<boolean>>,
      fn: () => Promise<void>,
    ) =>
    async () => {
      try {
        setter(true);
        await fn();
      } finally {
        setter(false);
      }
    };

  const handleExportButton = withLoadingState(setLoadingFile, async () => {
    try {
      const path = await writeGpxFile(FileSystem.documentDirectory, gpx);
      await Sharing.shareAsync(path, {
        mimeType: "application/gpx+xml",
        dialogTitle: "Share GPX File",
        UTI: "com.topografix.gpx",
      });
    } catch (e) {
      onError((e as Error).message);
    }
  });

  return (
    <View style={styles.buttonRow}>
      <TouchableHighlight
        underlayColor={colors.primary}
        onPress={handleExportButton}
        style={styles.button}
      >
        {loadingFile ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>💾 SHARE FILE</Text>
        )}
      </TouchableHighlight>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  button: {
    flex: 1,
    backgroundColor: colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginHorizontal: 10,
    justifyContent: "center",
    alignItems: "center",
    height: 48,
  },
  buttonText: {
    fontFamily: "BebasNeue-Regular",
    fontSize: buttonFontSize,
    color: colors.light,
  },
});
