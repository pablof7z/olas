export function nicelyFormattedMintName(mint: string) {
    try {
        const url = new URL(mint);
        return url.hostname;
    } catch (e) {
        return mint;
    }
}