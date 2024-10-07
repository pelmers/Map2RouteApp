import React from "react";
import {
  ScrollView,
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
} from "react-native";

import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "../routes";

import {
  DISTANCE_UNITS,
  ELEVATION_UNITS,
  DistanceUnit,
  ElevationUnit,
} from "../types/settings";
import { useSettings } from "../providers/SettingsProvider";
import { colors } from "../utils/colors";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

interface ButtonSettingRowProps<T> {
  label: string;
  selectedValue?: T;
  onValueChange: (itemValue: T) => void;
  items: { label: string; value: T }[];
}

function ButtonSettingRow<T>(props: ButtonSettingRowProps<T>) {
  const { label, selectedValue, onValueChange, items } = props;

  // Split items into chunks of two
  const itemChunks = [];
  for (let i = 0; i < items.length; i += 2) {
    itemChunks.push(items.slice(i, i + 2));
  }

  return (
    <View>
      <Text style={buttonRowStyles.labelText}>{label}</Text>
      {itemChunks.map((chunk, i) => (
        <View key={i} style={buttonRowStyles.buttonContainer}>
          {chunk.map((item, j) => (
            <TouchableOpacity
              key={j}
              style={[
                buttonRowStyles.button,
                selectedValue === item.value && buttonRowStyles.selectedButton,
              ]}
              onPress={() => onValueChange(item.value)}
            >
              <Text style={buttonRowStyles.buttonText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}

const buttonRowStyles = StyleSheet.create({
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  button: {
    flex: 1,
    margin: 5,
    padding: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
    height: 50,
    justifyContent: "center", // Add this line
    alignItems: "center", // Add this line
  },
  selectedButton: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    fontSize: 17,
    color: "#fff",
    fontWeight: "bold",
  },
  labelText: {
    fontSize: 30,
    fontWeight: "bold",
    marginLeft: 10,
    color: colors.light,
    fontFamily: "BebasNeue-Regular",
  },
});

export function SettingsScreen({ navigation }: Props) {
  const { settings, setSettings } = useSettings();

  return (
    <ScrollView style={styles.container}>
      <ButtonSettingRow
        label="Distance"
        selectedValue={settings.distanceUnit}
        onValueChange={(itemValue: DistanceUnit) =>
          setSettings({ ...settings, distanceUnit: itemValue })
        }
        items={[
          { label: "Kilometers", value: DISTANCE_UNITS.KM },
          { label: "Miles", value: DISTANCE_UNITS.MI },
        ]}
      />
      <ButtonSettingRow
        label="Elevation"
        selectedValue={settings.elevationUnit}
        onValueChange={(itemValue: ElevationUnit) =>
          setSettings({ ...settings, elevationUnit: itemValue })
        }
        items={[
          { label: "Meters", value: ELEVATION_UNITS.M },
          { label: "Feet", value: ELEVATION_UNITS.FT },
        ]}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: colors.dark,
  },
  infoButton: {
    width: "50%",
    margin: 5,
    padding: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  infoButtonText: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "bold",
  },
});
