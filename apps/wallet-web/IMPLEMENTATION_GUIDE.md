# Wallet Web Application Implementation Guide

This document provides step-by-step instructions for implementing a Nostr wallet web application using Svelte 5, NDK, and shadcn-svelte components. The application will support NIP-60 and NIP-61 protocols for wallet functionality.

## Project Overview

The wallet-web application will provide the following features:

- Login via NIP-07 compatible browser extensions
- Send payments (including support for NIP-61)
- Deposit funds via lightning invoices
- View transaction history

## Prerequisites

- Node.js 18+
- pnpm
- Understanding of Svelte 5 and TypeScript
- Familiarity with Nostr protocols

## Directory Structure

```
apps/wallet-web/
├── src/
│   ├── lib/
│   │   ├── components/           # UI components
│   │   │   ├── auth/             # Authentication components
│   │   │   ├── wallet/           # Wallet-specific components
│   │   │   ├── transactions/     # Transaction components
│   │   │   └── ui/               # shadcn-svelte components
│   │   ├── stores/               # Svelte stores for state management
│   │   ├── services/             # API and wallet services
│   │   └── utils/                # Utility functions
│   ├── routes/                   # Application routes
│   │   ├── (auth)/               # Authentication routes
│   │   │   └── login/            # Login page
│   │   ├── (app)/                # Protected app routes
│   │   │   ├── dashboard/        # Main dashboard
│   │   │   ├── send/             # Send funds
│   │   │   ├── deposit/          # Deposit funds
│   │   │   └── transactions/     # Transaction history
│   │   └── +layout.svelte        # Layout component
│   └── app.html                  # HTML template
├── static/                       # Static assets
├── tests/                        # Tests
└── configuration files           # Various config files
```

## Implementation Steps

### 1. Project Setup

1. Initialize the Svelte project with TypeScript:

   ```bash
   cd apps
   mkdir -p wallet-web
   cd wallet-web
   # Initialize with similar structure to apps/web
   cp -r ../web/{package.json,svelte.config.js,tailwind.config.ts,tsconfig.json,vite.config.ts,.prettierrc,components.json,postcss.config.js} .
   ```

2. Update `package.json` with necessary dependencies:

   - Add `@nostr-dev-kit/ndk` and `@nostr-dev-kit/ndk-wallet`
   - Update project name and description

3. Install dependencies:

   ```bash
   pnpm install
   ```

4. Set up shadcn-svelte components according to apps/web pattern

### 2. Authentication Implementation

1. Create authentication store in `src/lib/stores/auth.ts`:

   ```typescript
   import { writable } from 'svelte/store';
   import type { NDKUser } from '@nostr-dev-kit/ndk';

   export const currentUser = writable<NDKUser | null>(null);
   export const isAuthenticated = writable<boolean>(false);
   ```

2. Implement NIP-07 authentication service in `src/lib/services/auth.ts`:

   ```typescript
   import { NDK, NDKNip07Signer } from '@nostr-dev-kit/ndk';
   import { currentUser, isAuthenticated } from '../stores/auth';

   export async function loginWithNip07() {
   	try {
   		const signer = new NDKNip07Signer();
   		const user = await signer.user();

   		// Create NDK instance
   		const ndk = new NDK({
   			signer,
   			explicitRelayUrls: ['wss://relay.damus.io', 'wss://relay.primal.net']
   		});

   		await ndk.connect();

   		currentUser.set(user);
   		isAuthenticated.set(true);

   		return { user, ndk, signer };
   	} catch (error) {
   		console.error('Login failed:', error);
   		throw error;
   	}
   }
   ```

3. Create login page component in `src/routes/(auth)/login/+page.svelte`

### 3. Wallet Implementation

1. Create wallet store in `src/lib/stores/wallet.ts`:

   ```typescript
   import { writable } from 'svelte/store';
   import type { NDKCashuWallet } from '@nostr-dev-kit/ndk-wallet';

   export const wallet = writable<NDKCashuWallet | null>(null);
   export const balance = writable<number>(0);
   export const isWalletLoading = writable<boolean>(false);
   ```

2. Implement wallet service in `src/lib/services/wallet.ts`:

   ```typescript
   import { NDKCashuWallet } from '@nostr-dev-kit/ndk-wallet';
   import type { NDK } from '@nostr-dev-kit/ndk';
   import { wallet, balance, isWalletLoading } from '../stores/wallet';

   export async function initializeWallet(ndk: NDK) {
   	isWalletLoading.set(true);

   	try {
   		// Try to find existing wallet
   		let walletInstance = await NDKCashuWallet.from(
   			await ndk.fetchEvent({ kinds: [37375], authors: [ndk.activeUser?.pubkey || ''] })
   		);

   		// Create new wallet if none exists
   		if (!walletInstance) {
   			walletInstance = new NDKCashuWallet(ndk);
   			walletInstance.mints = ['https://mint.coinos.io', 'https://stablenut.umint.cash'];
   			await walletInstance.getP2pk();
   			await walletInstance.publish();
   			walletInstance.backup();
   		}

   		// Start wallet monitoring
   		walletInstance.start({ subId: 'wallet', skipVerification: true });

   		// Update stores
   		wallet.set(walletInstance);
   		updateBalance(walletInstance);

   		// Subscribe to balance changes
   		walletInstance.on('balance', () => updateBalance(walletInstance));

   		return walletInstance;
   	} catch (error) {
   		console.error('Wallet initialization failed:', error);
   		throw error;
   	} finally {
   		isWalletLoading.set(false);
   	}
   }

   function updateBalance(walletInstance: NDKCashuWallet) {
   	balance.set(walletInstance.balance);
   }
   ```

3. Create wallet dashboard component in `src/routes/(app)/dashboard/+page.svelte`

### 4. Send Implementation

1. Create transaction store in `src/lib/stores/transactions.ts`:

   ```typescript
   import { writable } from 'svelte/store';

   export const transactions = writable<any[]>([]);
   export const isSending = writable<boolean>(false);
   ```

2. Implement send service in `src/lib/services/send.ts`:

   ```typescript
   import { NDKUser, NDKZapper } from '@nostr-dev-kit/ndk';
   import { get } from 'svelte/store';
   import { wallet } from '../stores/wallet';
   import { isSending } from '../stores/transactions';

   export async function sendPayment(recipient: string, amount: number, comment = '') {
   	isSending.set(true);

   	try {
   		const walletInstance = get(wallet);
   		if (!walletInstance) throw new Error('Wallet not initialized');

   		// Handle different recipient types
   		if (recipient.startsWith('npub') || recipient.includes('@')) {
   			// NIP-61 zap to a nostr user
   			const user = recipient.startsWith('npub')
   				? await NDKUser.fromNpub(recipient)
   				: await NDKUser.fromNip05(recipient);

   			const zapper = new NDKZapper(user, amount, 'sat', { comment });

   			return new Promise((resolve, reject) => {
   				zapper.on('complete', (results) => {
   					isSending.set(false);
   					resolve(results);
   				});

   				zapper.on('notice', (message) => {
   					console.log('Zap notice:', message);
   				});

   				zapper.zap().catch((err) => {
   					isSending.set(false);
   					reject(err);
   				});
   			});
   		} else {
   			// Direct wallet send (e.g., to lightning address)
   			const result = await walletInstance.pay(recipient, amount, comment);
   			isSending.set(false);
   			return result;
   		}
   	} catch (error) {
   		isSending.set(false);
   		console.error('Send payment failed:', error);
   		throw error;
   	}
   }
   ```

3. Create send page component in `src/routes/(app)/send/+page.svelte`

### 5. Deposit Implementation

1. Create deposit store in `src/lib/stores/deposit.ts`:

   ```typescript
   import { writable } from 'svelte/store';

   export const invoice = writable<string | null>(null);
   export const isGeneratingInvoice = writable<boolean>(false);
   export const depositStatus = writable<'idle' | 'pending' | 'success' | 'error'>('idle');
   ```

2. Implement deposit service in `src/lib/services/deposit.ts`:

   ```typescript
   import { get } from 'svelte/store';
   import { wallet } from '../stores/wallet';
   import { invoice, isGeneratingInvoice, depositStatus } from '../stores/deposit';

   export async function generateInvoice(amount: number) {
   	isGeneratingInvoice.set(true);
   	depositStatus.set('idle');

   	try {
   		const walletInstance = get(wallet);
   		if (!walletInstance) throw new Error('Wallet not initialized');

   		// Get the first mint
   		const mintUrl = walletInstance.mints[0];
   		if (!mintUrl) throw new Error('No mint configured');

   		// Create deposit instance
   		const deposit = walletInstance.deposit(amount, mintUrl);

   		// Start deposit process
   		const bolt11 = await deposit.start();
   		invoice.set(bolt11);
   		depositStatus.set('pending');

   		// Listen for success
   		deposit.on('success', () => {
   			depositStatus.set('success');
   		});

   		// Listen for errors
   		deposit.on('error', (error) => {
   			console.error('Deposit error:', error);
   			depositStatus.set('error');
   		});

   		return bolt11;
   	} catch (error) {
   		console.error('Generate invoice failed:', error);
   		depositStatus.set('error');
   		throw error;
   	} finally {
   		isGeneratingInvoice.set(false);
   	}
   }
   ```

3. Create deposit page component in `src/routes/(app)/deposit/+page.svelte`

### 6. Transaction History Implementation

1. Implement transaction service in `src/lib/services/transactions.ts`:

   ```typescript
   import { get } from 'svelte/store';
   import { wallet } from '../stores/wallet';
   import { transactions } from '../stores/transactions';

   export async function loadTransactions() {
   	try {
   		const walletInstance = get(wallet);
   		if (!walletInstance) throw new Error('Wallet not initialized');

   		// Get transactions from wallet
   		const txs = await walletInstance.getTransactions();
   		transactions.set(txs);

   		// Subscribe to new transactions
   		walletInstance.on('transaction', (tx) => {
   			transactions.update((current) => [tx, ...current]);
   		});

   		return txs;
   	} catch (error) {
   		console.error('Load transactions failed:', error);
   		throw error;
   	}
   }
   ```

2. Create transactions page component in `src/routes/(app)/transactions/+page.svelte`

### 7. UI Components with shadcn-svelte

1. Use shadcn-svelte components for the UI following the pattern in apps/web:

   - Button, Card, Dialog, Input, Avatar, etc.
   - Create specialized components for wallet functionality

2. Example wallet card component in `src/lib/components/wallet/WalletCard.svelte`:

   ```svelte
   <script lang="ts">
   	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
   	import { Button } from '$lib/components/ui/button';
   	import { balance } from '$lib/stores/wallet';
   	import { goto } from '$app/navigation';
   </script>

   <Card>
   	<CardHeader>
   		<CardTitle>Your Wallet</CardTitle>
   	</CardHeader>
   	<CardContent>
   		<div class="flex flex-col gap-4">
   			<div class="text-3xl font-bold">{$balance} sats</div>
   			<div class="flex gap-2">
   				<Button variant="default" on:click={() => goto('/send')}>Send</Button>
   				<Button variant="outline" on:click={() => goto('/deposit')}>Deposit</Button>
   			</div>
   		</div>
   	</CardContent>
   </Card>
   ```

### 8. Authentication Protection

1. Create auth check layout in `src/routes/(app)/+layout.ts`:

   ```typescript
   import { redirect } from '@sveltejs/kit';
   import { get } from 'svelte/store';
   import { isAuthenticated } from '$lib/stores/auth';

   export function load() {
   	if (!get(isAuthenticated)) {
   		throw redirect(302, '/login');
   	}
   }
   ```

## Testing and Debugging

1. Test with browser extensions that support NIP-07:

   - Alby
   - nos2x
   - others

2. Use the NDK debug tools:

   ```typescript
   // Enable debugging
   localStorage.setItem('debug', 'ndk:*');
   ```

3. Monitor wallet events for debugging:
   ```typescript
   wallet.on('debug', console.log);
   ```

## Deployment

1. Build the application:

   ```bash
   pnpm build
   ```

2. Deploy the built application to your preferred hosting platform

## Additional Resources

- [NDK Documentation](https://github.com/nostr-dev-kit/ndk)
- [NDK Wallet Documentation](https://github.com/nostr-dev-kit/ndk/tree/main/packages/ndk-wallet)
- [Svelte Documentation](https://svelte.dev/docs)
- [shadcn-svelte Documentation](https://www.shadcn-svelte.com/)
- [Nostr NIPs](https://github.com/nostr-protocol/nips)
