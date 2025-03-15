<script lang="ts">
    import { wallet, balance } from '$lib/stores/wallet';
    import { onMount } from 'svelte';
    
    let invoiceAmount = 5000; // Default 5000 sats
    let memo = '';
    let invoice = '';
    let isLoading = false;
    let error = '';
    let qrCodeUrl = '';
    
    // Generate QR code URL from invoice
    function generateQRCode(text: string): string {
        // Using Google Charts API for QR code generation
        // Note: In a production environment, consider using a library like qrcode or similar
        return `https://chart.googleapis.com/chart?chs=250x250&cht=qr&chl=${encodeURIComponent(text)}&choe=UTF-8`;
    }
    
    async function generateInvoice() {
        isLoading = true;
        error = '';
        
        try {
            if (!$wallet) throw new Error('Wallet not initialized');
            if (invoiceAmount <= 0) throw new Error('Amount must be greater than 0');
            
            // This is a placeholder - real implementation would use the actual wallet functionality
            // You'll need to implement this with the actual wallet functionality when ready
            console.log('Would generate invoice for', invoiceAmount, 'sats with memo:', memo);
            
            // For now, we'll create a fake invoice for demonstration
            const fakeInvoice = `lnbc${invoiceAmount}n1pj58qhhpp5ad0du3lv9s0dqh9h40dz6e9pc9jrm33st8s5rsjz06mmz6zdsz7sdqqcqzzsxqyz5vqsp5v39j6tu3pf83luqaewdmpwdz3hwtktpkveezr3reypszmj77a9ls9qyyssqh4t0thunk6vut2pv2u3mfh6nwk50u5kd3wjpjs9y9zryxk9xmkgdfh3rnjtdxmnq8yx25f2ve5xzwwa6g2nppc9tn6n6nz75zfq5cp2q9qr5`;
            invoice = fakeInvoice;
            qrCodeUrl = generateQRCode(fakeInvoice);
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to generate invoice';
            console.error('Invoice generation error:', err);
        } finally {
            isLoading = false;
        }
    }
    
    // Generate an initial invoice on page load
    onMount(() => {
        if ($wallet) {
            generateInvoice();
        }
    });
</script>

<div class="container mx-auto max-w-lg p-4">
    <h1 class="mb-6 text-2xl font-bold">Receive Payment</h1>
    
    <div class="mb-6 rounded-lg bg-card p-4 shadow-sm">
        <p class="text-lg font-medium">Current Balance: <span class="font-bold">{$balance} sats</span></p>
    </div>
    
    <div class="space-y-4">
        <form class="space-y-4" on:submit|preventDefault={generateInvoice}>
            <div class="space-y-2">
                <label for="amount" class="text-sm font-medium text-foreground">Amount (sats)</label>
                <input
                    id="amount"
                    type="number"
                    bind:value={invoiceAmount}
                    min="1"
                    step="1"
                    class="w-full rounded-md border border-input bg-background px-3 py-2"
                />
            </div>
            
            <div class="space-y-2">
                <label for="memo" class="text-sm font-medium text-foreground">Memo (optional)</label>
                <input
                    id="memo"
                    type="text"
                    bind:value={memo}
                    placeholder="Add a description for this invoice"
                    class="w-full rounded-md border border-input bg-background px-3 py-2"
                />
            </div>
            
            <button
                type="submit"
                disabled={isLoading || !$wallet}
                class="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {#if isLoading}
                    Generating...
                {:else}
                    Generate Invoice
                {/if}
            </button>
        </form>
        
        {#if error}
            <div class="mt-4 rounded-md bg-destructive/10 p-3 text-destructive">
                {error}
            </div>
        {/if}
        
        {#if invoice}
            <div class="mt-6 space-y-4 rounded-lg bg-muted p-4">
                <h2 class="text-xl font-semibold">Lightning Invoice</h2>
                
                {#if qrCodeUrl}
                    <div class="flex justify-center py-4">
                        <img src={qrCodeUrl} alt="QR Code" class="h-64 w-64" />
                    </div>
                {/if}
                
                <div class="overflow-x-auto rounded bg-background p-2">
                    <code class="text-xs break-all">{invoice}</code>
                </div>
                
                <button
                    class="w-full rounded-md bg-secondary px-4 py-2 text-secondary-foreground transition-colors"
                    on:click={() => navigator.clipboard.writeText(invoice)}
                >
                    Copy Invoice
                </button>
            </div>
        {/if}
    </div>
</div> 