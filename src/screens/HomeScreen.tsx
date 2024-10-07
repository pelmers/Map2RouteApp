import React, { useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Platform,
  TouchableHighlight,
} from "react-native";

import { ResizeMode, Video } from "expo-av";
import Icon from "react-native-vector-icons/FontAwesome";

import { colors } from "../utils/colors";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../routes";
import { BlurView } from "expo-blur";
import { useShareIntentContext } from "expo-share-intent";
import { d } from "src/utils/constants";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export function HomeScreen({ navigation }: Props) {
  const {
    hasShareIntent,
    shareIntent,
    error: shareIntentError,
  } = useShareIntentContext();
  useEffect(() => {
    if (hasShareIntent) {
      const shareValue = shareIntent.text ?? shareIntent.webUrl;
      if (shareValue !== null) {
        d(`sending directly to input with ${shareValue}`);
        navigation.navigate("Input URL", { prefilledText: shareValue });
      } else {
        d("could not handle shared intent");
        navigation.navigate("Input URL", {
          prefilledText: "could not parse shared data",
        });
      }
    }
    if (shareIntentError) {
      navigation.navigate("Input URL", {
        prefilledText: `sharing error: ${shareIntentError}`,
      });
    }
  }, [hasShareIntent, shareIntent, shareIntentError]);
  return (
    <View style={styles.container}>
      <Video
        source={require("../../assets/banner.mp4")}
        style={styles.bannerVideo}
        rate={1.0}
        volume={1.0}
        isMuted={true}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
      />
      {/* expo blur doesn't work with transitions on android: https://github.com/expo/expo/issues/3523#issuecomment-472146615 */}
      {Platform.OS === "ios" && (
        <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
      )}
      <View style={styles.title}>
        <Text style={styles.titleText}>Map2Route</Text>
      </View>
      <View style={styles.subtitle}>
        <Text style={styles.subtitleText}>Select an option</Text>
      </View>
      <View style={styles.buttonBackground}>
        <TouchableHighlight
          underlayColor={colors.primary}
          onPress={() => {
            navigation.navigate("Input URL", {});
          }}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Paste Google Maps Link</Text>
        </TouchableHighlight>
      </View>
      <View style={styles.buttonBackground}>
        <TouchableHighlight
          underlayColor={colors.primary}
          onPress={() => {
            navigation.navigate("Usage");
          }}
          style={styles.button}
        >
          <Text style={styles.buttonText}>How to use?</Text>
        </TouchableHighlight>
      </View>
      <Icon
        name="gear"
        size={40}
        color={colors.secondary}
        style={{ position: "absolute", top: 40, right: 40 }}
        onPress={() => {
          navigation.navigate("Settings");
        }}
      />
      <Icon
        name="info-circle"
        size={40}
        color={colors.secondary}
        style={{ position: "absolute", top: 40, left: 40 }}
        onPress={() => {
          navigation.navigate("Info");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "space-evenly",
    alignItems: "center",
  },
  bannerVideo: {
    flex: 2.7,
    width: "100%",
    alignSelf: "center",
    resizeMode: "contain",
  },
  title: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginTop: -120,
  },
  titleText: {
    fontSize: 85,
    fontFamily: "BebasNeue-Regular",
    color: colors.light,
  },
  subtitle: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 20,
  },
  subtitleText: {
    fontSize: 30,
    fontFamily: "BebasNeue-Regular",
    color: colors.accent,
  },
  buttonBackground: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.dark,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    paddingHorizontal: 32,
    borderRadius: 4,
    elevation: 3,
    width: 200,
    backgroundColor: colors.accent,
  },
  buttonText: {
    fontSize: 21,
    lineHeight: 24,
    fontWeight: "bold",
    letterSpacing: 0.25,
    textAlign: "center",
    color: colors.light,
  },
});
