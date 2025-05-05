<!--
  context/MODULES.md
  Project module structure conforming to GUIDELINE.md
-->
# Modules & Components

This document maps the current codebase layout against the architectural guidelines. Items marked **pending refactor** do not yet conform. See the **Migration Plan** at the end for tasks.

## 1. app/ (Expo-router Screens)

All files under `app/` should be thin wrappers (≤50 LOC) importing UI from `lib/<module>/screens/`.
The following is the exhaustive list of screens under `app/` (relative to `app/`):
```text
_layout.tsx
(home)/_layout.tsx
(home)/index.tsx
(home)/reels.tsx
(home)/publish2.tsx
(home)/(settings)/_layout.tsx
(home)/(settings)/blacklist.tsx
(home)/(settings)/blossom.tsx
(home)/(settings)/content-cache.tsx
(home)/(settings)/content/cache.tsx
(home)/(settings)/content/index.tsx
(home)/(settings)/content/muted.tsx
(home)/(settings)/delete-account.tsx
(home)/(settings)/dev.tsx
(home)/(settings)/image-debug.tsx
(home)/(settings)/index.tsx
(home)/(settings)/key.tsx
(home)/(settings)/nip60.tsx
(home)/(settings)/nwc.tsx
(home)/(settings)/primal.tsx
(home)/(settings)/relay.tsx
(home)/(settings)/relays.tsx
(home)/(settings)/wallets.tsx
(home)/(settings)/zaps.tsx
(home)/(wallet)/_layout.tsx
(home)/(wallet)/scan.tsx
(home)/(wallet)/index.tsx
(home)/(wallet)/(walletSettings)/_layout.tsx
(home)/(wallet)/(walletSettings)/index.tsx
(home)/(wallet)/(walletSettings)/mints.tsx
(home)/(wallet)/(walletSettings)/nutzaps.tsx
(home)/(wallet)/(walletSettings)/relays.tsx
(home)/(wallet)/(walletSettings)/tokens.tsx
365.tsx
bookmarks.tsx
communities.tsx
detail-view.tsx
dlnwc.tsx
enable-wallet.tsx
eula.tsx
expo/index.js
groups/new.tsx
live.tsx
login.tsx
notifications.tsx
profile.tsx
profile/[npub].tsx
publish/_layout.tsx
publish/index.tsx
publish/post/edit.tsx
publish/post/metadata.tsx
receive.tsx
relays.tsx
search.tsx
send.tsx
stories.tsx
story/_layout.tsx
story/index.tsx
story/selector.tsx
story/preview.tsx
tx.tsx
unpublished.tsx
view.tsx
```  
**Pending refactor**: All of the above screens must be refactored into thin wrappers that delegate rendering to `lib/<module>/screens/`.

## 2. lib/ (Feature Modules)

Each feature module under `lib/` must follow:
- `screens/`      # Screen-level components
- `components/`   # Module-specific UI pieces
- `hooks/`        # Business logic & data hooks
- `stores/`       # Module state management
- `utils/`        # Pure helper functions
- `types.ts`      # Module-specific types
- `context/`      # React Context (optional)
- `__tests__/`    # Unit tests co-located

Current modules (all **pending refactor**):
- **components/**       (Skia helpers)  <!-- pending refactor -->
- **comments/**         <!-- pending refactor -->
- **feed-editor/**      <!-- pending refactor -->
- **groups/**           <!-- pending refactor -->
- **image-loader/**     <!-- pending refactor -->
- **media-filter/**     <!-- pending refactor -->
- **mentions/**         <!-- pending refactor -->
- **onboard/**          <!-- pending refactor -->
- **product-view/**     <!-- pending refactor -->
- **publish/**          <!-- pending refactor -->
- **reaction-picker/**  <!-- pending refactor -->
- **stories/**          <!-- pending refactor -->
- **story-editor/**     <!-- pending refactor -->
- **user-bottom-sheet/**<!-- pending refactor -->
- **user/**: user avatar & flare UI (components/, hooks/) <!-- pending refactor -->
    - `components/avatar.tsx` (User avatar component)
    - `components/flare.tsx` (User avatar flare component)
    - `hooks/flare.tsx` (User flare hook)
- **utils/**            <!-- pending refactor -->
- **zapper/**           <!-- pending refactor -->

Root-level files in `lib/` also **pending refactor** (should be relocated into proper modules or `utils/`/`hooks/`):
- `cn.ts`
- `ndk.ts`
- `notifications.ts`
- `settings-store.ts`
- `useColorScheme.tsx`
- `useHeaderSearchBar.tsx`
- `utils.ts`

## 3. components/ (Shared UI)

Root-level reusable UI components:
- `buttons/`, `icons/`, `events/`, `Feed/`, `FeedType/`, `Headers/`, `headless/`, `media/`, `nativewindui/`, `notifications/`, `product/`, `tabs/`, `ui/`, `wallet/`
All root components currently conform to guidelines.

## 4. hooks/ (Global Hooks)

Global React hooks placed here:
- `app-sub.ts`
- `blossom.tsx`
- `comments.tsx`
- `follows.ts`
- `mint.ts`
- `notifications.tsx`
- `post-bottom-sheet.tsx`
- `saved-search.tsx`
- `stories.ts`
- `wallet.tsx`
- `zap.ts`
All global hooks correctly located.

## 5. stores/ (Global State)

Global state management:
- `app.ts`
- `db/`
- `event.ts`
- `payments.ts`
- `reactions.ts`
- `relays.ts`
All global stores correctly located.

## 6. utils/ (Root Utilities)

General-purpose utilities:
- `bitcoin.ts`, `blossom-client.ts`, `blossom.ts`, `const.ts`, `db.ts`, `debounce.tsx`, `event.ts`, `image-format.ts`, `imgproxy.ts`, `matrix.ts`, `media/`, `mint.ts`, `myfollows.ts`, `uploader.ts`, `url.ts`, `user.ts`, `uuid.ts`, `wallet.ts`
All utilities correctly located.

## 7. assets/ (Static assets)

`assets/` holds images, fonts, etc.

## 8. theme/ (Styling and Theming)

`theme/` holds global styling, colors, and config.

## 9. types.ts (Global TypeScript Definitions)

**Pending refactor**: create a `types.ts` file at the project root and migrate all global type definitions into it.

## 10. __tests__/ (Integration / E2E Tests)

Global integration or E2E tests live here.

---

## Migration Plan

- [ ] Refactor the following `app/` screens into thin wrappers that delegate rendering to `lib/<module>/screens/`:
  - [ ] _layout.tsx
  - [ ] (home)/_layout.tsx
  - [ ] (home)/index.tsx
  - [ ] (home)/reels.tsx
  - [ ] (home)/publish2.tsx
  - [ ] (home)/(settings)/_layout.tsx
  - [ ] (home)/(settings)/blacklist.tsx
  - [ ] (home)/(settings)/blossom.tsx
  - [ ] (home)/(settings)/content-cache.tsx
  - [ ] (home)/(settings)/content/cache.tsx
  - [ ] (home)/(settings)/content/index.tsx
  - [ ] (home)/(settings)/content/muted.tsx
  - [ ] (home)/(settings)/delete-account.tsx
  - [ ] (home)/(settings)/dev.tsx
  - [ ] (home)/(settings)/image-debug.tsx
  - [ ] (home)/(settings)/index.tsx
  - [ ] (home)/(settings)/key.tsx
  - [ ] (home)/(settings)/nip60.tsx
  - [ ] (home)/(settings)/nwc.tsx
  - [ ] (home)/(settings)/primal.tsx
  - [ ] (home)/(settings)/relay.tsx
  - [ ] (home)/(settings)/relays.tsx
  - [ ] (home)/(settings)/wallets.tsx
  - [ ] (home)/(settings)/zaps.tsx
  - [ ] (home)/(wallet)/_layout.tsx
  - [ ] (home)/(wallet)/scan.tsx
  - [ ] (home)/(wallet)/index.tsx
  - [ ] (home)/(wallet)/(walletSettings)/_layout.tsx
  - [ ] (home)/(wallet)/(walletSettings)/index.tsx
  - [ ] (home)/(wallet)/(walletSettings)/mints.tsx
  - [ ] (home)/(wallet)/(walletSettings)/nutzaps.tsx
  - [ ] (home)/(wallet)/(walletSettings)/relays.tsx
  - [ ] (home)/(wallet)/(walletSettings)/tokens.tsx
  - [ ] 365.tsx
  - [ ] bookmarks.tsx
  - [ ] communities.tsx
  - [ ] detail-view.tsx
  - [ ] dlnwc.tsx
  - [ ] enable-wallet.tsx
  - [ ] eula.tsx
  - [ ] expo/index.js
  - [ ] groups/new.tsx
  - [ ] live.tsx
  - [ ] login.tsx
  - [ ] notifications.tsx
  - [ ] profile.tsx
  - [ ] profile/[npub].tsx
  - [ ] publish/_layout.tsx
  - [ ] publish/index.tsx
  - [ ] publish/post/edit.tsx
  - [ ] publish/post/metadata.tsx
  - [ ] receive.tsx
  - [ ] relays.tsx
  - [ ] search.tsx
  - [ ] send.tsx
  - [ ] stories.tsx
  - [ ] story/_layout.tsx
  - [ ] story/index.tsx
  - [ ] story/selector.tsx
  - [ ] story/preview.tsx
  - [ ] tx.tsx
  - [ ] unpublished.tsx
  - [ ] view.tsx
- [ ] Create `types.ts` file at project root and migrate global type definitions into it.
- [ ] Relocate root-level util files from `lib/` (e.g., `cn.ts`, `utils.ts`, `ndk.ts`, `notifications.ts`, `settings-store.ts`) into `utils/` or `stores/` as appropriate.
- [ ] Relocate root-level hooks (`useColorScheme.tsx`, `useHeaderSearchBar.tsx`) into the `hooks/` directory.
- [ ] Rename `lib/components/` to `lib/skia-helpers/` (or similar) and structure as a module.
- [ ] For each `lib/<module>/`, create the prescribed structure (e.g. `screens/`, `components/`, `hooks/`, `stores/`, `utils/`, `types.ts`, `context/`, `__tests__/`) and move existing files accordingly:
  - [ ] comments
  - [ ] feed-editor
  - [ ] groups
  - [ ] image-loader
  - [ ] media-filter
  - [ ] mentions
  - [ ] onboard
  - [ ] product-view
  - [ ] publish
  - [ ] reaction-picker
  - [ ] stories
  - [ ] story-editor
  - [ ] user-bottom-sheet
  - [x] user
  - [ ] utils (lib/utils)
  - [ ] zapper
- [ ] Ensure unit tests are co-located within each module’s `__tests__/` directory and integration tests remain under `__tests__/`.

Once all boxes are ticked, the codebase will conform to the architectural guidelines.
