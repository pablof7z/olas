export function nicelyFormattedMilliSatNumber(amount: number) {
    return nicelyFormattedSatNumber(
        Math.floor(amount / 1000)
    );
}

export function nicelyFormattedSatNumber(amount: number) {
	let format = (num: string): string => {
		const str = num;
		const parts = str.split(".");
		
		if (parts.length === 1) return str;

		// remove trailing zeros
		const decimals = parts[1].replace(/0+$/, "");
		if (decimals === "") return parts[0];
		return `${parts[0]}.${decimals}`;
	}

    // if the number is less than 1000, just return it
    if (amount < 1000) return amount.toString();

    if (amount < 10000) return `${format((amount / 1000).toFixed(2))}k`;

    // if the number is less than 1 million, return it with a k, if the comma is not needed remove it
    if (amount < 1000000) return `${format((amount / 1000).toFixed(0))}k`;

    // if the number is less than 1 billion, return it with an m
    if (amount < 1000000000) return `${format((amount / 1000000).toFixed(1))}m`;

    return `${format((amount / 100_000_000).toFixed(2))} btc`;
}