import React from "react";
import { View, StyleSheet, Text } from "react-native";

import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "../routes";
import { colors } from "../utils/colors";

type Props = NativeStackScreenProps<RootStackParamList, "Usage">;

export function UsageScreen({ navigation }: Props) {
  return <View style={styles.container}>
    <Text>TODO</Text>
  </View>;
}

const styles = StyleSheet.create({
  container: {
    padding: 25,
    backgroundColor: colors.dark,
  },
});
