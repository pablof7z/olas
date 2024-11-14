export function prettifySatoshis(satoshis: number, decimals: number = 2) {
    if (satoshis >= 1_000_000) {
        return (satoshis / 1_000_000).toFixed(decimals).replace(/\.?0+$/, '') + 'M';
    }

    if (satoshis >= 100_000) {
        return (satoshis / 1_000).toFixed(decimals).replace(/\.?0+$/, '') + 'k';
    }
    
    return satoshis;
}