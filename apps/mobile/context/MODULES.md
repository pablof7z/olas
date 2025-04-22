<!--
  context/MODULES.md
  Detailed listing of modules, components, stores and their responsibilities
-->
# Modules & Components

This document enumerates the key modules, components, stores, and hooks in the codebase, grouped by folder. It outlines responsibilities and highlights opportunities to split or merge modules.

## 1. lib/ (Domain & Business Logic)
- **comments/**: Threaded comment UI and state
  - bottom-sheet.tsx: modal UI for viewing/adding comments
  - store.ts: maintains comment threads and pagination
  - components/: mention input, selector, new comment form
  - **Refactor**: Consider merging with components/events/Post store/UI to avoid duplication.
- **feed-editor/**: Compose and publish new feed posts
  - bottom-sheet.tsx, confirm.tsx: modal workflow
  - store.ts: draft content and upload status
+- **groups/**
  - store/: loads and caches community data
  - types.ts: type definitions
- **media-filter/**: Image filter presets and adjustments
  - components/: UI for filter list and adjustments
  - hooks/useMediaFilter: central hook
  - store.ts: selected filter state
  - presets.ts, utils.ts: filter matrices and image saving
  - tests: unit tests for hook and store
- **mentions/**: User mention suggestions and search
- **ndk.ts**: Nostr relay pool initialization and helpers
- **notifications.ts**: Notification subscription and dispatch
- **onboard/**: Login and signup flows
  - components/: avatar chooser, buttons
  - screens/: LoginScreen, Signup
  - store.ts: onboarding state
- **product-view/**: Bottom sheet for product metadata display
  - hook.ts: control logic
  - store.ts: selected product
- **publish/**: Post/story/video publishing pipeline
  - actions/: upload & event generation
  - components/: camera toolbar, preview, composer metadata
  - screens/: post, story, video entry points
  - store/: editor state management
- **reaction-picker/**: Emoji/Reaction selection UI
- **settings-store.ts**: Persistent user settings (theme, NSFW filter, etc.)
- **stories/**: Story display and slides modal
- **story-editor/**: Complex story composer with sticker management
- **user-bottom-sheet/**: Profile preview and follow actions
- **utils/**, **utils.ts**: Shared helpers (visibility, user formatting)
- **zapper/**: Lightning zap modal and store

## 2. components/ (UI Components)
- **animated-image.tsx**, **AnimatedText**: motion-based components
- **Button.tsx**, **buttons/**: primary button styles (back, follow, wallet)
- **Cashu components**: under cashu/mint, receive, send
- **events/**: Post, Comment, Repost, Reaction UI
  - store.ts: event-level interactions (bookmarks, zaps)
- **Feed/**, **FeedType/**: feed container, type selector, store
- **Headers/**: screen header layouts (Home, Search)
- **headless/**: AppReady, SignerReady guards
- **icons/**: SVG icon components
- **media/**: Image and video rendering abstractions
- **nativewindui/**: Low-level primitives (Alert, Card, TextField, etc.)
- **notifications/**: list items and wrappers
- **product/**: grid and details layout
- **tabs/**: Bottom tab bar
- **ui/**: small UI pieces (Swipable, ticker, user avatars)
- **wallet/**: transactions, balance, NWC list UI

## 3. stores/ (Global State via Jotai)
- **app.ts**: appReadyAtom, settings initialization
- **db/**: local IndexedDB or SQLite caching layer
- **event.ts**: ephemeral event state and selections
- **payments.ts**: Lightning invoice and cashu tokens
- **reactions.ts**: global reactions store (counts, subscribers)
- **relays.ts**: relay notice notifications and error handling

## 4. hooks/ (Custom React Hooks)
- **app-sub.ts**: global app subscription logic
- **blossom.tsx**: feature-flag or experiment toggles
- **comments.tsx**: subscribe to comment threads
- **follows.ts**: follow/unfollow logic
- **mint.ts**: cashu minting workflow
- **notifications.tsx**: real-time notification updates
- **post-bottom-sheet.tsx**: manages open/close of post options modal
- **saved-search.tsx**: persisted search queries
- **stories.ts**: story progress monitoring
- **user-flare.tsx**: user presence/status indicator
- **wallet.tsx**: wallet state and refresh logic
- **zap.ts**: zap (lightning) initiation

## 5. atoms/ (Small Jotai Atoms)
- **homeScreen.ts**: atom to track home tab scroll position/context

---
### Split & Merge Opportunities
- **Merge** lib/comments + components/events/Post comment UI and store
- **Split** nativewindui into per-domain UI libraries or move primitives into shared design-system package
- **Merge** feed-editor and story-editor common code (e.g., media selection, preview)
- **Split** publish/actions into smaller domain-specific action modules (event, upload, video)
---