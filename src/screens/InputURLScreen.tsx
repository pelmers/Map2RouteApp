import React from "react";
import { View, Text, StyleSheet } from "react-native";

import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "../routes";
import { colors } from "../utils/colors";

type Props = NativeStackScreenProps<RootStackParamList, "Input URL">;

export function InputURLScreen({ navigation }: Props) {
  return <View style={styles.container}>
    <Text>TODO: make an input for url and forward to the preview screen</Text>
  </View>;
}

const styles = StyleSheet.create({
  container: {
    padding: 25,
    backgroundColor: colors.dark,
  },
});
