import React from "react";

import { registerRootComponent } from "expo";

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

// TODO: when you get a shared link from the app it looks like this: https://maps.app.goo.gl/325UE7Y49Mh53rhm6\?g_st\=ia
// curl that to get a redirect response to the final directions url, e.g. https://maps.google.com/?geocode=FVugHgMdGatKAA%3D%3D;FYcVHwMdlVJKACk3GvOWZwnGRzHZNxBwTiGTTg%3D%3D&daddr=Ikaria+Food,+Bilderdijkstraat,+Amsterdam&saddr=52.3387790,4.8934655&dirflg=b&ftid=0x47c6096796f31a37:0x4e93214e701037d9&lucs=,94231799,94242496,94224825,94227247,94227248,47071704,47069508,94218641,94203019,47084304,94208458,94208447&g_ep=CAISDTYuMTM1LjEuODcwOTAYACCUnAEqbCw5NDIzMTc5OSw5NDI0MjQ5Niw5NDIyNDgyNSw5NDIyNzI0Nyw5NDIyNzI0OCw0NzA3MTcwNCw0NzA2OTUwOCw5NDIxODY0MSw5NDIwMzAxOSw0NzA4NDMwNCw5NDIwODQ1OCw5NDIwODQ0N0ICTkw%3D&g_st=ia
// ignore all the shitty shit, it has daddr, saddr, and dirflg
// so use that to query against google maps directions api
// TODO: hmm what if i put some waypoints in there?
// original url: https://maps.app.goo.gl/H5YWrk11Dw3xcUgAA\?g_st\=ia
// redirect: https://maps.google.com/?geocode=FVugHgMdGatKAA%3D%3D;FYcVHwMdlVJKACk3GvOWZwnGRzHZNxBwTiGTTg%3D%3D;FT4gHwMdn3NKAClrSYrQQgnGRzH7DBmyV3zy5Q%3D%3D;FYkhHwMd8LVKACk90mFNvwnGRzHrlnr9jABqSQ%3D%3D&daddr=Ikaria+Food,+Bilderdijkstraat,+Amsterdam+to:Breadwinner,+Tweede+Laurierdwarsstraat,+Amsterdam+to:Oriental+City+Amsterdam,+Oudezijds+Voorburgwal,+Amsterdam&saddr=52.3387790,4.8934655&dirflg=b&ftid=0x47c609bf4d61d23d:0x496a008cfd7a96eb&lucs=,94231799,94242496,94224825,94227247,94227248,47071704,47069508,94218641,94203019,47084304,94208458,94208447&g_ep=CAISDTYuMTM1LjEuODcwOTAYACC6twsqbCw5NDIzMTc5OSw5NDI0MjQ5Niw5NDIyNDgyNSw5NDIyNzI0Nyw5NDIyNzI0OCw0NzA3MTcwNCw0NzA2OTUwOCw5NDIxODY0MSw5NDIwMzAxOSw0NzA4NDMwNCw5NDIwODQ1OCw5NDIwODQ0N0ICTkw%3D&g_st=ia
// all the extra points are in the to: url parameters as part of daddr, and the last one is the final destination (oriental city)
// to get the direction, see ServerCalls.LoadGMapsRoute in streetwarp-web
// to get elevation data (up to 512 points), can use https://developers.google.com/maps/documentation/elevation/requests-elevation#Paths

export default function App() {
  return (
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
  );
}

registerRootComponent(App);
