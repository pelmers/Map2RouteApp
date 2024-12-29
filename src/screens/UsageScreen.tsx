import { Video } from "expo-av";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text } from "react-native";

import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "../routes";
import { colors } from "../utils/colors";

type Props = NativeStackScreenProps<RootStackParamList, "Usage">;

export function UsageScreen({ navigation }: Props) {
  let video;
  if (Platform.OS === "ios") {
    video = require("./resources/ios/map2route_demo.mp4");
  } else {
    video = require("./resources/android/map2route_demo.mp4");
  }
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.containerContent}
    >
      <Text style={styles.messageText}>From Google Maps</Text>
      <Video
        style={styles.video}
        source={video}
        isMuted={true}
        rate={1.5}
        shouldPlay
        isLooping
        useNativeControls
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 25,
    backgroundColor: colors.dark,
  },
  containerContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  messageText: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.light,
    textAlign: "left",
    marginTop: 24,
    paddingHorizontal: 10,
  },
  video: {
    width: 300,
    height: 600,
    marginBottom: 70,
  },
});
