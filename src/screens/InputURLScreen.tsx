import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableHighlight,
  ActivityIndicator,
  Keyboard,
} from "react-native";

import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "../routes";
import { colors } from "../utils/colors";
import { gmapsUrlToGpx, parseUrlFromText } from "../utils/gmaps";
import { pointsToGpx, writeGpxFile } from "src/utils/gpx";
import FileSystem from "../utils/UniversalFileSystem";
import { d, getErrorMessage } from "src/utils/constants";
import { ErrorTextComponent } from "src/components/ErrorTextComponent";
import { TouchableWithoutFeedback } from "react-native";

type Props = NativeStackScreenProps<RootStackParamList, "Input URL">;

const str = JSON.stringify;

export function InputURLScreen({ navigation, route }: Props) {
  const { prefilledText } = route.params;
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [lastTriggeredPrefill, setLastTriggeredPrefill] = useState("");

  const handlePress = async (input?: string) => {
    setLoading(true);
    setError(null);
    Keyboard.dismiss();
    try {
      const url = parseUrlFromText(input ?? text);
      if (url === null) {
        throw new Error("No url in the given text");
      }
      // TODO: handle also other mapping apps?
      const gmapsResult = await gmapsUrlToGpx(url);
      const uri = await writeGpxFile(
        FileSystem.cacheDirectory,
        gmapsResult.gpx,
      );
      navigation.navigate("Route Preview", { gpxFileUri: uri });
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      prefilledText &&
      prefilledText !== "" &&
      prefilledText !== lastTriggeredPrefill
    ) {
      d(`triggering prefill with ${prefilledText}`);
      handlePress(prefilledText);
      setLastTriggeredPrefill(prefilledText);
      setText(prefilledText);
    }
  }, [prefilledText]);

  const underlayColor = text ? colors.dark : colors.primary;
  const buttonStyle = text ? styles.buttonActive : styles.buttonInactive;
  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View style={styles.container}>
        <View>
          <Text style={styles.infoText}>Enter Google Maps URL:</Text>
          <TextInput
            style={styles.input}
            placeholder="https://maps.app.goo.gl/..."
            placeholderTextColor={colors.secondary}
            value={text}
            onChangeText={(text) => setText(text)}
            multiline={true}
            numberOfLines={10}
            onSubmitEditing={() => handlePress()}
            onKeyPress={(e) => {
              if (e.nativeEvent.key == "Enter") {
                handlePress();
              }
            }}
            returnKeyType="done"
          />
          {isLoading ? (
            <ActivityIndicator size="large" color={colors.secondary} />
          ) : (
            <View style={styles.buttonContainer}>
              <TouchableHighlight
                onPress={() => handlePress()}
                style={buttonStyle}
                underlayColor={underlayColor}
              >
                <Text style={styles.buttonText}>Convert to GPX</Text>
              </TouchableHighlight>
            </View>
          )}
          {error && <ErrorTextComponent errorText={error} />}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
    backgroundColor: colors.dark,
    justifyContent: "space-evenly",
    alignItems: "center",
  },
  input: {
    height: 70,
    borderColor: colors.secondary,
    borderWidth: 1,
    padding: 10,
    width: 320,
    color: colors.light,
  },
  buttonContainer: {
    marginTop: 20,
  },
  infoText: {
    fontSize: 30,
    fontFamily: "BebasNeue-Regular",
    color: colors.primary,
  },
  buttonActive: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    paddingHorizontal: 32,
    borderRadius: 4,
    elevation: 3,
    width: 300,
    backgroundColor: colors.accent,
    margin: "auto",
  },
  buttonInactive: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    paddingHorizontal: 32,
    borderRadius: 4,
    elevation: 3,
    width: 300,
    backgroundColor: colors.accent,
    margin: "auto",
    opacity: 0.6,
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
