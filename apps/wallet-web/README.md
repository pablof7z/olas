# Nostr Wallet Web App

A Svelte 5 web application that provides Nostr wallet functionality, supporting NIP-60 and NIP-61 protocols.

## Features

- Login with NIP-07 compatible extensions (Alby, nos2x, etc.)
- Send payments to Nostr users and lightning addresses
- Deposit funds via lightning invoices
- View transaction history

## Built With

- Svelte 5 and SvelteKit
- TypeScript
- NDK (Nostr Development Kit)
- shadcn-svelte for UI components
- Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

1. Install dependencies:

   ```
   pnpm install
   ```

2. Start development server:

   ```
   pnpm dev
   ```

3. Build for production:
   ```
   pnpm build
   ```

## Project Structure

See the detailed project structure and implementation steps in [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)

## License

This project is part of the Olas repository and is licensed under the same terms.

## Acknowledgments

- NDK Team for the wallet implementation
- Nostr Protocol for establishing the NIP standards
