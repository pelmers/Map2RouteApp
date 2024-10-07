import React from "react";

import { registerRootComponent } from "expo";
import { ShareIntentProvider, useShareIntent } from "expo-share-intent";

import { HomeScreen } from "./screens/HomeScreen";
import { NavigationContainer } from "@react-navigation/native";
import { RootStackParamList } from "./routes";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RoutePreviewScreen } from "./screens/RoutePreviewScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { SettingsProvider } from "./providers/SettingsProvider";
import { InfoScreen } from "./screens/InfoScreen";
import { InputURLScreen } from "./screens/InputURLScreen";
import { UsageScreen } from "./screens/UsageScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <ShareIntentProvider>
      <SettingsProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Home">
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Info" component={InfoScreen} />
            <Stack.Screen name="Usage" component={UsageScreen} />
            <Stack.Screen name="Input URL" component={InputURLScreen} />
            <Stack.Screen name="Route Preview" component={RoutePreviewScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SettingsProvider>
    </ShareIntentProvider>
  );
}

registerRootComponent(App);
