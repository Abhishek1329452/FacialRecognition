This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
# Biometric Portal - Full-Stack Facial Recognition & Profiling Engine

A polished, full-stack facial analysis, registry, and biometric verification gateway powered by custom Computer Vision heuristics and the **Gemini 3.5 AI Engine** via the modern `@google/genai` SDK.

This application allows enterprise-grade facial profiling, landmark coordinate projection, biometric registry compilation, dual-profile comparisons, and terminal gate access verification with complete server-side security.

---

## 🌟 Key Features

1. **Analyze Face (Computer Vision)**:
   - Captures high-definition viewport frames or allows custom image uploads.
   - Plots precise structural coordinate masks (Eyes, Nose tracking, Ears, Mouth) in an interactive UI.
   - Identifies detailed biometric markers: age estimation, gaze direction, smile intensity, face shape, glasses, and multi-class emotional indexes.

2. **Biometric Identity Registry**:
   - Save physical profiles with a name, role, and metadata tags.
   - Leverages AI to extract a dense, highly specialized biographical profile summary including deep-structural skeletal characteristics.
   - Provides administrative controls to clear or search existing registered faces from the database.

3. **Terminal Biometric Gate Verification**:
   - A secure, realistic real-time entrance verification module.
   - Runs advanced vector sweeps of incoming camera snapshots against all stored facial profiles.
   - Enforces terminal lock or unlocks access permissions securely based on similarity thresholds (>70% confidence).

4. **Dual-Face Biometric Comparer**:
   - Directly compare two independent portraits (with built-in presets for quick evaluation).
   - Audits facial bone symmetry, age progression, interpupillary ranges, and hairstyle modifications.
   - Provides a numerical resemblance score and a dense breakdown of alignment contradictions.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, and Motion animations.
- **Backend**: Node.js Express server configured with maximum base64 JSON payload processing capabilities.
- **Biometric Intelligence**: `@google/genai` SDK wrapping Gemini models (`gemini-3.5-flash` primary, self-healing with exponential backoff and `gemini-3.1-flash-lite` auto-fallback for optimal system uptime).
- **Storage**: Highly optimized local JSON file database stored securely server-side.

---

## 📂 Project Structure

```text
├── server.ts               # Express full-stack backend, API middleware, and AI routes
├── index.html              # Frontend application entry HTML
├── tsconfig.json           # Component, browser, and server build compilation rules
├── vite.config.ts          # Vite asset compiling and styling hooks
├── package.json            # Script definitions and dependency trees
├── src/
│   ├── main.tsx            # React application entry bootstrapper
│   ├── App.tsx             # Main layout, topbar, and tabs router
│   ├── index.css           # Global typography definitions, custom styling, and layout themes
│   ├── types.ts            # Global TypeScript interface structures
│   └── components/
│       ├── BiometricAnalyzer.tsx # Structural point plotting and attribute diagnostics
│       ├── IdentityRegistry.tsx  # Registering and removing facial profiles
│       ├── VerificationScan.tsx  # Dynamic terminal security gate logic
│       ├── BiometricComparer.tsx # Dual photo resemblance comparer dashboard
│       └── CameraCapture.tsx     # Reusable HTML5 MediaDevices canvas capture stream
