<script lang="ts">
    import { wallet, balance } from '$lib/stores/wallet';
    import { onMount } from 'svelte';
    
    // Mock transaction data
    // In a real implementation, this would come from the wallet service
    type Transaction = {
        id: string;
        type: 'send' | 'receive';
        amount: number;
        timestamp: number;
        description?: string;
        recipient?: string;
        sender?: string;
        status: 'completed' | 'pending' | 'failed';
    };
    
    let transactions: Transaction[] = [];
    let isLoading = true;
    let error = '';
    
    // Format date from timestamp
    function formatDate(timestamp: number): string {
        return new Date(timestamp).toLocaleString();
    }
    
    // Load transactions
    async function loadTransactions() {
        isLoading = true;
        error = '';
        
        try {
            if (!$wallet) throw new Error('Wallet not initialized');
            
            // Mock transaction data for demonstration
            // Replace with actual implementation when available
            await new Promise(resolve => setTimeout(resolve, 500)); // Fake delay
            
            transactions = [
                {
                    id: '1',
                    type: 'receive',
                    amount: 10000,
                    timestamp: Date.now() - 3600000, // 1 hour ago
                    description: 'Payment for services',
                    sender: 'npub1abcdef...',
                    status: 'completed'
                },
                {
                    id: '2',
                    type: 'send',
                    amount: 5000,
                    timestamp: Date.now() - 86400000, // 1 day ago
                    description: 'Coffee',
                    recipient: 'npub1xyz123...',
                    status: 'completed'
                },
                {
                    id: '3',
                    type: 'receive',
                    amount: 25000,
                    timestamp: Date.now() - 259200000, // 3 days ago
                    description: 'Zap from Twitter',
                    sender: 'npub1qwerty...',
                    status: 'completed'
                },
                {
                    id: '4',
                    type: 'send',
                    amount: 2000,
                    timestamp: Date.now() - 345600000, // 4 days ago
                    description: 'Tip',
                    recipient: 'npub1asdfg...',
                    status: 'completed'
                }
            ];
            
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to load transactions';
            console.error('Transaction loading error:', err);
        } finally {
            isLoading = false;
        }
    }
    
    onMount(() => {
        if ($wallet) {
            loadTransactions();
        } else {
            error = 'Wallet not initialized';
            isLoading = false;
        }
    });
</script>

<div class="container mx-auto max-w-4xl p-4">
    <h1 class="mb-6 text-2xl font-bold">Transaction History</h1>
    
    <div class="mb-6 rounded-lg bg-card p-4 shadow-sm">
        <p class="text-lg font-medium">Current Balance: <span class="font-bold">{$balance} sats</span></p>
    </div>
    
    {#if isLoading}
        <div class="flex justify-center py-12">
            <div class="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
        </div>
    {:else if error}
        <div class="rounded-md bg-destructive/10 p-4 text-destructive">
            <p>{error}</p>
        </div>
    {:else if transactions.length === 0}
        <div class="rounded-md bg-muted p-8 text-center">
            <p class="text-lg">No transactions yet</p>
            <p class="mt-2 text-sm text-muted-foreground">
                Your transaction history will appear here once you send or receive payments.
            </p>
        </div>
    {:else}
        <div class="overflow-hidden rounded-lg border shadow-sm">
            <table class="w-full">
                <thead class="bg-muted">
                    <tr>
                        <th class="p-3 text-left text-sm font-medium">Type</th>
                        <th class="p-3 text-left text-sm font-medium">Amount</th>
                        <th class="p-3 text-left text-sm font-medium">Date</th>
                        <th class="p-3 text-left text-sm font-medium">Description</th>
                        <th class="p-3 text-left text-sm font-medium">Status</th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    {#each transactions as tx}
                        <tr class="hover:bg-muted/50">
                            <td class="p-3">
                                <span class={tx.type === 'receive' ? 'text-green-600' : 'text-red-600'}>
                                    {tx.type === 'receive' ? 'Received' : 'Sent'}
                                </span>
                            </td>
                            <td class="p-3 font-medium">
                                <span class={tx.type === 'receive' ? 'text-green-600' : 'text-red-600'}>
                                    {tx.type === 'receive' ? '+' : '-'}{tx.amount} sats
                                </span>
                            </td>
                            <td class="p-3 text-muted-foreground">
                                {formatDate(tx.timestamp)}
                            </td>
                            <td class="p-3">
                                {tx.description || '-'}
                                <div class="mt-1 text-xs text-muted-foreground">
                                    {#if tx.type === 'receive' && tx.sender}
                                        From: {tx.sender}
                                    {:else if tx.type === 'send' && tx.recipient}
                                        To: {tx.recipient}
                                    {/if}
                                </div>
                            </td>
                            <td class="p-3">
                                <span 
                                    class={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                                        tx.status === 'completed' 
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                            : tx.status === 'pending'
                                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                    }`}
                                >
                                    {tx.status}
                                </span>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</div> 