<!--
  context/REFACTOR.md
  Detailed refactoring suggestions and improvement opportunities
-->
# Refactoring Opportunities

This document outlines areas in the codebase that could be refactored to improve maintainability, performance, and consistency.

## 1. Directory Structure
- Flatten overly nested route directories under `app/`, especially `(home)/(settings)/(wallet)`, to simplify routing by feature.
- Consolidate similar modules in `lib/` and `components/` to reduce context switching (e.g., `lib/comments` vs `components/events`).
- Group design-system primitives (currently in `components/nativewindui/`) into a single `design-system/` package.

## 2. State Management
- Standardize on one state library: evaluate migrating all global and module-local stores from Jotai to Zustand or React Query for consistency and built-in caching.
- Centralize persistent settings in a single configuration store; remove duplicated atoms in `settings-store.ts` and `stores/app.ts`.

## 3. Module Consolidation
- Comments & Reactions: Merge `lib/comments` and the reaction-picker with post-level stores in `components/events/Post/store.ts` to unify data flow.
- Feed & Stories: Extract shared logic between `feed-editor` and `story-editor` (media handling, preview, upload) into a common `media-composer/` module.
- Publish Pipeline: Split `lib/publish/actions` into distinct services (`upload-service`, `event-service`, `story-service`) and standardize async workflows.

## 4. Performance & Optimization
- Implement virtualization for long lists in `Feed` and `Stories SlidesModal` to reduce memory footprint.
- Lazy-load heavy modules and bottom sheets (`publish`, `story-editor`, `media-filter`) via `React.lazy` and `Suspense`.
- Memoize expensive calculations in `lib/media-filter/createColorMatrix.ts` and optimize selector hooks.

## 5. Type Safety & Code Quality
- Expand TypeScript coverage: add strict typings for all screen props, navigation params, and shared utilities.
- Remove all `any` types and audit `// biome-ignore` comments; replace with explicit guards or refined types.
- Introduce a central `types/` directory for shared entity definitions (Event, User, Reaction, Payment).

## 6. Testing & Documentation
- Add unit tests for critical modules: `lib/publish`, `lib/comments`, `stores/reactions`, `lib/ndk.ts`.
- Refactor E2E Maestro flows into reusable step definitions or custom commands to reduce duplication.
- Generate Storybook stories for key UI components to document and manual-test interaction states.

## 7. Styling & Theming
- Standardize styling: leverage Tailwind tokens and avoid inline styles in React components.
- Centralize color, spacing, typography scales in `theme/` and remove ad-hoc styling overrides.
- Ensure dark mode is consistently applied; audit `useColorScheme` usage and related style adjustments.

---
**Cross-Reference**: See `context/MODULES.md` for flagged split/merge candidates.