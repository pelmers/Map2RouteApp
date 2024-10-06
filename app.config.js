const VERSION = "1.0.0";
// Must be less than 10
const HOTFIX = 0;

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "env.local") });

// If GOOGLE_MAPS_API_KEY is not set, show a warning
if (!process.env.GOOGLE_MAPS_API_KEY) {
  console.warn(
    "GOOGLE_MAPS_API_KEY is not set. Map tiles will not load on Android. See README.md for more information.",
  );
}

const versionParts = VERSION.split(".").map(Number);
const versionCode =
  versionParts[0] * 100000 +
  versionParts[1] * 1000 +
  versionParts[2] * 10 +
  HOTFIX;

module.exports = () => ({
  expo: {
    name: "Map2Route",
    slug: "map2route",
    version: VERSION,
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    entryPoint: "./src/App.js",
    scheme: "com.pelmers.map2route",
    assetBundlePatterns: ["**/*", "!examples/**/*"],
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#523C8F",
    },
    ios: {
      supportsTablet: true,
      buildNumber: `${versionCode}`,
      bundleIdentifier: "com.pelmers.map2route",
    },
    android: {
      package: "com.pelmers.map2route",
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-foreground.png",
        backgroundColor: "#523C8F",
      },
      versionCode,
    },
    plugins: [
      [
        "expo-font",
        {
          fonts: ["assets/fonts/BebasNeue-Regular.ttf"],
        },
      ],
    ],
    owner: "pelmers",
  },
});

/**
 *   @react-native-async-storage/async-storage@2.0.0 - expected version: 1.23.1
  react-native-maps@1.18.0 - expected version: 1.14.0
  react-native-reanimated@3.15.4 - expected version: ~3.10.1
  react-native-safe-area-context@4.11.0 - expected version: 4.10.5
  react-native-screens@3.34.0 - expected version: 3.31.1
  react-native-svg@15.7.1 - expected version: 15.2.0
  @types/react@18.3.11 - expected version: ~18.2.79
  typescript@5.6.2 - expected version: ~5.3.3
 */
