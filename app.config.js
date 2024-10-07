const VERSION = "1.0.1";
// Must be less than 10
const HOTFIX = 0;

const GOOGLE_MAPS_API_KEY = require("./src/googleApiKey");

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
          apiKey: GOOGLE_MAPS_API_KEY,
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
      [
        "expo-share-intent",
        {
          iosActivationRules: {
            NSExtensionActivationSupportsWebURLWithMaxCount: 1,
            NSExtensionActivationSupportsWebPageWithMaxCount: 1,
          },
          androidIntentFilters: ["text/*"],
        },
      ],
    ],
    owner: "pelmers",
    extra: {
      eas: {
        projectId: "cb36c624-6def-4b69-95a2-5652ae461f63",
      },
    },
  },
});
