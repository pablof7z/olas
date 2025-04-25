<!--
  context/ARCHITECTURE.md
  High-level overview of application architecture and module organization
-->
# Architecture Overview

This document describes the high-level architecture of the Olas Mobile App, including how the app is structured, key layers, modules, and integrations.

## 1. Entry Point
- **app/_layout.tsx**: The top-level React component that initializes the application. Sets up:
  - Global styles (`global.css`), theming and StatusBar
  - Core providers (Jotai, BottomSheet, ActionSheet, Portal, GestureHandler)
  - NDK (Nostr Dev Kit) initialization and session monitoring
  - Expo Router `<Stack>` navigation and screen configuration

## 2. Routing & Screens
- **expo-router**: File-system-based routing under the `app/` directory.
- **Screens**: Defined as `.tsx` files and nested layout folders (`(home)`, `(settings)`, `(wallet)`, etc.)
  - Each route may export special `layout.tsx` or `_layout.tsx` for nested layouts

## 3. UI Components
- **components/**: Collection of presentational and reusable UI components, organized by domain:
  - `events/`, `feed/`, `cashu/`, `wallet/`, `media/`, `notifications/`, etc.
  - `nativewindui/`: primitives styled via NativeWind (Tailwind CSS for React Native)
  - Icon sets, buttons, headers, tabs, bottom sheets, loaders, etc.

## 4. Domain Logic & Libraries
- **lib/**: Core business logic modules:
  - `comments/`: comment threads, mention support, bottom sheets
  - `feed-editor/`, `publish/`, `story-editor/`: post and story creation flow
  - `story/`, `stories/`: story viewing, slides modal
  - `media-filter/`: image filtering, presets, hooks, store
  - `reaction-picker/`, `product-view/`, `zapper/`: interactive features
  - `ndk.ts`: Nostr relay pool setup and helpers
  - `onboard/`: login/signup flows and components
  - `settings-store.ts`: persistent app settings via Jotai
  - Utilities: `utils/`, `utils.ts`, `mentions/`, `groups/`, `publish/actions`, etc.

## 5. State Management
- **Jotai** for global and module-local atoms:
  - `stores/`: Jotai atoms for app readiness, relays, reactions, payments, events, DB, etc.
  - Module stores under `lib/*/store.ts` (e.g., media-filter/store, publish/store, comments/store)

## 6. Hooks & Subscriptions
- **hooks/**: Custom React hooks for subscriptions and side effects:
  - `useMediaFilter`, `useNDKInit`, `useColorScheme`, wallet, notifications, stories, follows, etc.
  - Encapsulate business logic and subscriptions to Nostr relays or local stores

## 7. Utilities & Configuration
- **utils/** and `lib/utils.ts`: Shared helper functions (formatting, constants)
- **Tailwind & NativeWind**: `tailwind.config.js` and `nativewind-env.d.ts`
- **Metro Bundler**: `metro.config.js` for asset resolution

## 8. Third-Party Integrations
- **Expo**: `expo-router`, `expo-secure-store`, `expo-status-bar`, `expo-dev-client`
- **Nostr**: `@nostr-dev-kit/ndk` and `@nostr-dev-kit/ndk-mobile`
- **Lightning & Cashu**: Components under `components/cashu`, `lib/zapper`, `stores/payments`
- **UI Libraries**: `@gorhom/bottom-sheet`, `@expo/react-native-action-sheet`, `@backpackapp-io/react-native-toast`

## 9. Testing & Quality
- **Unit Tests**: `__tests__/`, `lib/*/__tests__`, `tests/`
- **End-to-End Tests**: Maestro flows under `.maestro/`, test scripts in `justfile`
- **Linting & Formatting**: `biome.json`, `babel.config.js`, Prettier, ESLint config

## 10. Build & Deployment
- **Package Management**: `package.json`, `bun.lock`
- **Configuration**: `app.json` for Expo, `eas.json` for EAS builds
- **CI/CD**: GitHub workflows or EAS Build pipelines (not shown)