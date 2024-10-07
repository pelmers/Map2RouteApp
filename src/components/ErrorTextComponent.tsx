import React from "react";
import { StyleSheet, Text } from "react-native";

import { colors } from "../utils/colors";

export function ErrorTextComponent(props: { errorText: string }) {
  return (
    <>
      <Text style={styles.titleText}>Error!</Text>
      <Text style={[styles.titleText, { color: "red", paddingHorizontal: 20 }]}>
        {props.errorText}
      </Text>
    </>
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
