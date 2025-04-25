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

## Running Tests

You can run the tests using the npm scripts defined in package.json:

```bash
# Run all tests
npm run test:e2e

# Run specific test flows
npm run test:e2e:app-launch
npm run test:e2e:navigation
npm run test:e2e:search
npm run test:e2e:profile
npm run test:e2e:transaction
```

Alternatively, you can run tests directly with the Maestro CLI:

```bash
maestro test .maestro/flows/app_launch.yaml
```

## Test Structure

- `flows/` - Contains test flows for different app features
- `common/` - Contains shared/reusable test flows
- `config.yaml` - Global Maestro configuration
- Screenshots and reports will be saved in `.maestro/screenshots` and `.maestro/report`

## Writing Tests

Tests are written in YAML format. Each test consists of a config section and a commands section separated by "---".

Example:

```yaml
appId: com.olas.mobile
---
- tapOn: 'Login'
- inputText: 'username'
- tapOn: 'Continue'
- assertVisible: 'Welcome'
```

For more information, see the [Maestro documentation](https://maestro.mobile.dev/).
