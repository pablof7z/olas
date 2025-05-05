# Project Structure & Architectural Guidelines

This document outlines explicit guidelines for organizing and structuring our Expo-router based React Native application. Adhering strictly to these guidelines ensures clarity, scalability, maintainability, and ease of collaboration.

---

## General File Naming Conventions

* **Always use `kebab-case` for file names:**

  ```
  Correct: image-loader.ts
  Incorrect: imageLoader.ts, image_loader.ts
  ```

* **Files must be small**, ideally under 500 lines. Break larger files into logically coherent, smaller components.

---

## Overall Directory Structure

```
.
├── app/                     # Expo-router screen files only
├── lib/                     # Feature-specific modules
├── components/              # Shared, reusable UI components
├── hooks/                   # Global or shared React hooks
├── stores/                  # Global state management (Zustand, atoms, etc.)
├── utils/                   # Pure, general-purpose utility functions
├── assets/                  # Static assets (images, fonts)
├── theme/                   # Global styling and theming configuration
├── types/                   # Global TypeScript types
└── __tests__/               # Global integration or E2E tests (optional)
```

---

## Expo Router Files (`app/` directory)

Screen files in the `app/` directory:

* **Should be thin wrappers**.
* **Only handle routing logic and minimal data/context hooks**.
* Delegate all UI rendering and business logic to dedicated components under the `lib/` directory.

### Example of Expo-router file:

```tsx
// app/profile.tsx
import ProfileScreen from '@/lib/profile/screens/profile-screen';

export default ProfileScreen;
```

---

## Module Structure (`lib/<module-name>/`)

Each feature/module must adhere to the following structure:

```
lib/<module-name>/
├── screens/        # Screen-level React components
├── components/     # Smaller, reusable UI components specific to this module
├── hooks/          # React hooks for state and feature-specific logic
├── stores/         # Zustand or atomic state stores
├── utils/          # Pure helper functions
├── types/          # Module-specific TypeScript types
├── context/        # React context (optional)
└── __tests__/      # Unit tests co-located with module code
```

**Rationale:**

* Ensures clear separation of concerns and responsibilities.
* Improves discoverability and ease of navigation.
* Simplifies unit testing and maintainability.

---

## Directory Responsibilities

### Screens (`screens/`)

* **Purpose:** Main UI entry-points for feature-specific views.
* **Content:** Compose dedicated, reusable components and hooks.
* **Should not:** Contain complex business logic or API calls directly.

### Components (`components/`)

* **Purpose:** Reusable and UI-focused pieces, independent of global state.
* **Should:** Be as generic and reusable within the module as possible.
* **Should not:** Manage global state or data fetching.

### Hooks (`hooks/`)

* **Purpose:** Encapsulate logic related to state, effects, and data fetching.
* **Should:** Use `stores` and manage side-effects.
* **Should not:** Contain UI logic directly.

### Stores (`stores/`)

* **Purpose:** Manage module-specific state (Zustand or atoms).
* **Should:** Clearly separate logic for ease of testing and reuse.
* **Should not:** Interact directly with UI components; interaction occurs via hooks.

### Utils (`utils/`)

* **Purpose:** Contain pure, stateless utility/helper functions.
* **Should:** Be easily testable.
* **Should not:** Manage state, perform network calls, or have side effects.

### Types (`types/`)

* **Purpose:** Hold module-specific interfaces, enums, and type definitions.

### Context (`context/`)

* **Purpose:** Provide React Context where explicitly needed (often not required).
* **Should:** Be minimal, only for tightly coupled contexts.

### Tests (`__tests__/`)

* **Purpose:** Unit and snapshot tests co-located with their respective modules.
* **Should:** Test hooks, components, stores, and utilities thoroughly.

---

## Shared Components (`components/` root directory)

* **Purpose:** Store components reusable across the entire application.
* Examples: Buttons, icons, modals, shared UI elements.

Structure example:

```
components/
├── buttons/
├── icons/
├── user/
└── nativewindui/
```

---

## Global Hooks & Stores

* Global hooks placed directly in the root-level `hooks/` directory.
* Global state stores placed directly under the root-level `stores/`.

---

## Utilities (`utils/` root directory)

Structure clearly by responsibility:

```
utils/
├── media/
├── crypto/
├── formatting.ts
├── debounce.ts
└── uuid.ts
```

---

## Types (`types/` root directory)

* For global types shared across multiple modules.
* Organize clearly:

```
types/
├── api-types.ts
├── global-types.ts
└── store-types.ts
```

---

## Assets & Theme

* **Assets:** Place images, fonts, and icons under `assets/`.
* **Theme:** Place global styling, colors, and theme definitions in `theme/`.

---

## Tests

* **Unit tests** always co-located within each module (`__tests__/`).
* **Integration/E2E tests** (optional) reside separately in `__tests__/integration/` or `__tests__/e2e/` at the project root level.

---

## Refactoring Existing Code

When refactoring existing code, incrementally:

1. **Move UI logic** out of `app/` files into respective `screens` in `lib/`.
2. **Extract shared logic** into hooks and utilities.
3. **Clearly separate state management** into stores.
4. **Ensure consistent test coverage** as refactoring occurs.

---

## Integration Strategy

Expo-router files (`app/`) import and render modules (`lib/<module-name>/screens`) directly. Modules encapsulate their state and logic entirely, exposing minimal API surfaces for integration.
