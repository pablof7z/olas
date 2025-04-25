# Olas Mobile App

## End-to-End Testing with Maestro

This project uses Maestro for end-to-end testing. Maestro is a mobile UI testing framework that allows you to write tests in YAML format.

### Setting Up Maestro

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

### Running E2E Tests

You can run the tests using the npm scripts:

```bash
# Run all tests
npm run test:e2e

# Run specific tests
npm run test:e2e:app-launch
npm run test:e2e:navigation
npm run test:e2e:search
npm run test:e2e:profile
npm run test:e2e:transaction
npm run test:e2e:wallet
```

### Test Structure

- Tests are located in the `.maestro` directory
- Test flows are in `.maestro/flows/`
- Common/reusable flows are in `.maestro/common/`
- Screenshots and reports are saved in `.maestro/screenshots` and `.maestro/report`

For more details on the Maestro tests, see the [.maestro/README.md](.maestro/README.md) file.
