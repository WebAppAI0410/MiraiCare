export default {
  expo: {
    name: "MiraiCare 360",
    slug: "miraicare-360",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#1B5E20"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.miraicare.app",
      googleServicesFile: "./GoogleService-Info.plist"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#1B5E20"
      },
      package: "com.miraicare.app",
      googleServicesFile: "./google-services.json"
    },
    web: {
      favicon: "./assets/favicon.png",
      name: "MiraiCare 360",
      shortName: "MiraiCare"
    },
    platforms: ["ios", "android", "web"],
    scheme: "miraicare",
    extra: {
      // Firebase Web SDK設定
      firebaseApiKey: "AIzaSyDxxs-Oxtw_SSV_nIe1knYpEJIOpQ9QoJM",
      firebaseAuthDomain: "miraicare-360-mvp.firebaseapp.com",
      firebaseProjectId: "miraicare-360-mvp",
      firebaseStorageBucket: "miraicare-360-mvp.firebasestorage.app",
      firebaseMessagingSenderId: "89007426308",
      firebaseAppId: "1:89007426308:web:acf9ff1c45a1aad4ac9e51"
    }
  }
}; 