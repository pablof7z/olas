<script lang="ts">
	import ndk from '$lib/stores/ndk.svelte';
    import { wallet, balance } from '$lib/stores/wallet';
	import { NDKZapper } from '@nostr-dev-kit/ndk';
    
    let recipient = '';
    let amount = 0;
    let note = '';
    let isLoading = false;
    let success = false;
    let error = '';

    async function handleSend() {
        isLoading = true;
        error = '';
        success = false;
        
        try {
            // Basic validation
            if (!recipient) throw new Error('Recipient is required');
            if (!amount || amount <= 0) throw new Error('Amount must be greater than 0');
            if (!$wallet) throw new Error('Wallet not initialized');
            
            // This is a placeholder for actual send implementation
            // You'll need to implement this with the actual wallet functionality
            console.log('Would send', amount, 'sats to', recipient, 'with note:', note);

            const user = await ndk.getUserFromNip05(recipient);
            console.log('user', user?.npub);
            if (user) {
                const zapper = new NDKZapper(user, amount, 'sat', {
                    comment: note,
                });
                zapper.on('split:complete', (split, info) => {
                    console.log('split:complete', split, info);
                    success = true;
                });
                zapper.zap();
            }
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to send payment';
            console.error('Send error:', err);
        } finally {
            isLoading = false;
        }
    }
</script>

<div class="container mx-auto max-w-lg p-4">
    <h1 class="mb-6 text-2xl font-bold">Send Payment</h1>
    
    <div class="mb-6 rounded-lg bg-card p-4 shadow-sm">
        <p class="text-lg font-medium">Available Balance: <span class="font-bold">{$balance} sats</span></p>
    </div>
    
    <form class="space-y-4" on:submit|preventDefault={handleSend}>
        <div class="space-y-2">
            <label for="recipient" class="text-sm font-medium text-foreground">Recipient</label>
            <input
                id="recipient"
                type="text"
                bind:value={recipient}
                placeholder="npub, NIP-05 identifier, or Lightning address"
                class="w-full rounded-md border border-input bg-background px-3 py-2"
            />
        </div>
        
        <div class="space-y-2">
            <label for="amount" class="text-sm font-medium text-foreground">Amount (sats)</label>
            <input
                id="amount"
                type="number"
                bind:value={amount}
                min="1"
                step="1"
                class="w-full rounded-md border border-input bg-background px-3 py-2"
            />
        </div>
        
        <div class="space-y-2">
            <label for="note" class="text-sm font-medium text-foreground">Note (optional)</label>
            <textarea
                id="note"
                bind:value={note}
                placeholder="Add a note to your payment"
                class="w-full rounded-md border border-input bg-background px-3 py-2"
                rows="3"
            ></textarea>
        </div>
        
        <button
            type="submit"
            disabled={isLoading || !recipient || !amount}
            class="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
            {#if isLoading}
                Sending...
            {:else}
                Send Payment
            {/if}
        </button>
    </form>
    
    {#if error}
        <div class="mt-4 rounded-md bg-destructive/10 p-3 text-destructive">
            {error}
        </div>
    {/if}
    
    {#if success}
        <div class="mt-4 rounded-md bg-green-100 p-3 text-green-800 dark:bg-green-900 dark:text-green-200">
            Payment sent successfully!
        </div>
    {/if}
</div> 