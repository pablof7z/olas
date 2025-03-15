# Nostr Mobile Wallet

A modern, sleek mobile wallet for the Nostr ecosystem built with Expo 52 and React Native.

## Features

- Secure wallet management
- Integration with ndk-mobile and ndk-wallet
- Modern UI with animations using Reanimated 3
- Expo Router for navigation

## Development

### Prerequisites

- Node.js
- pnpm
- Expo CLI

### Getting Started

```bash
# From the workspace root
cd apps/mobile-wallet

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

### Testing

This project uses Maestro for UI testing:

```bash
# Run Maestro tests
maestro test tests/welcome_screen.yaml
```

## Project Structure

- `app/` - Expo Router screens
- `components/` - Reusable UI components
- `assets/` - Images, fonts, and other static assets
- `tests/` - Maestro UI tests

## Current Status

- We've set up the basic app structure with a welcome screen and create account screen
- The Inter variable font is installed in assets/fonts
- We're using a placeholder icon instead of images for now
- Basic animations are implemented with Reanimated 3

## Next Steps

- Connect the app to ndk-mobile and ndk-wallet for actual wallet functionality
- Create proper icon and splash screen assets
- Implement the account creation flow

## Notes

Before running the app, make sure to:

1. Download the Inter font family and place it in `assets/fonts/`
2. Create a wallet logo image and place it at `assets/wallet-logo.png`
