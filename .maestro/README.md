# Maestro E2E Tests for Olas Mobile App

This directory contains end-to-end tests using Maestro for the Olas mobile application.

## Setup

1. Install Maestro CLI:

```bash
# macOS
curl -Ls "https://get.maestro.mobile.dev" | bash

# Linux/WSL
curl -Ls "https://get.maestro.mobile.dev" | bash
```

2. Verify installation:

```bash
maestro -v
```

3. Make sure you have an iOS simulator or Android emulator running, or a physical device connected.

## Running Tests

You can run the tests using the npm scripts defined in package.json:

```bash
# Run all tests
npm run test:e2e

# Run specific test flows
npm run test:e2e:profile-deeplink
npm run test:e2e:navigate-to-profile
npm run test:e2e:header-scroll
npm run test:e2e:home-header
npm run test:e2e:simple-scroll
npm run test:e2e:header-visibility
```

Alternatively, you can run tests directly with the Maestro CLI:

```bash
# Run a specific test flow
maestro test .maestro/flows/test_profile_deeplink.yaml

# Run all test flows
maestro test .maestro/flows/
```

## Test Structure

Our test architecture follows these best practices:

- **`.maestro/flows/`**: Main test flows for different app features
- **`.maestro/common/`**: Reusable flows and helper functions
- **`.maestro/config.yaml`**: Global Maestro configuration
- **`.maestro/screenshots/`**: Generated screenshots from tests
- **`.maestro/reports/`**: Test reports and results

## Available Tests

### Profile Navigation Tests
- **`test_profile_deeplink.yaml`**: Tests the olas://profile/[npub] deeplink functionality
- **`navigate_to_profile.yaml`**: Tests direct navigation to a profile
- **`navigate_to_profile_via_search.yaml`**: Tests finding and navigating to a profile via search

### UI Behavior Tests
- **`test_header_scroll_behavior.yaml`**: Tests that the header scrolls out of view when scrolling down the feed
- **`test_home_header_animation.yaml`**: Detailed testing of the HomeHeader component animations
- **`simple_scroll_test.yaml`**: Basic test to verify scrolling functionality
- **`test_header_visibility.yaml`**: Screenshot-based test for verifying header visibility changes

## Best Practices

### 1. Use Reusable Flows

Extract common actions into separate flow files in the `common/` directory:

```yaml
# Example: in common/app_setup.yaml
- launchApp:
    clearState: false
    clearKeychain: false
```

Then use them in test flows:

```yaml
- runFlow:
    file: ../common/app_setup.yaml
```

### 2. Handle Environment Variables

Use environment variables for configurable values:

```yaml
env:
    TEST_USER: pablo
    SCREENSHOT_DIR: ../screenshots/profile
---
- inputText: ${TEST_USER}
```

### 3. Use Explicit Waiting

Always add appropriate wait times for animations and network requests:

```yaml
- waitForAnimationToEnd
```

### 4. Include Screenshots

Take screenshots at key points to make debugging easier:

```yaml
- takeScreenshot: 01_login_screen
```

### 5. Robust Element Selection

Handle multiple ways to identify elements:

```yaml
- assertVisible:
    text: "X"
    optional: true

# Fallback if ID isn't available
- runFlow:
    when:
        notVisible: "X"
    commands:
        - assertVisible:
            text: "Close"
```

### 6. Add Clear Comments

Add comments to explain test steps:

```yaml
# Initialize the app with clean state
- runFlow:
    file: ../common/app_setup.yaml
```

### 7. Visual Verification

For UI components that are difficult to locate by text or ID, use screenshots and visual comparison:

```yaml
# Take before screenshot
- takeScreenshot: 01_header_visible

# Perform action that changes UI
- scroll
- waitForAnimationToEnd

# Take after screenshot
- takeScreenshot: 02_header_hidden
```

## Available Common Flows

- **`app_setup.yaml`**: Initializes the app with configurable state clearing
- **`handle_dev_menu.yaml`**: Handles development menus that might appear
- **`navigation.yaml`**: Common navigation patterns including scrolling actions

## Adding New Tests

1. Create a new YAML file in `.maestro/flows/`
2. Start with common app setup and dev menu handling
3. Add test-specific steps
4. Include verification steps to confirm test success
5. Add screenshots at key points

## Testing UI Animations

When testing UI animations like the header scroll behavior:

1. Use slow scroll speeds to capture intermediate animation states
2. Take screenshots at multiple points during the animation
3. Verify both disappearance and reappearance
4. Test interaction with the animated components
5. Check specific component behavior based on scroll position
6. When element identification is challenging, use screenshot-based verification 

For more information, see the [Maestro documentation](https://maestro.mobile.dev/).
