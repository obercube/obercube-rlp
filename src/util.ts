export function intToHex(int: number): string {
    const hex = int.toString(16);
    return padToEven(hex);
}

export function stripHexPrefix(str: string): string {
    return padToEven(isHexPrefixed(str) ? str.slice(2) : str);
}

export function isHexPrefixed(str: string): boolean {
    return str.slice(0, 2) === '0x';
}

export function padToEven(str: string): string {
    return (str.length % 2 === 0) ? str : `0${str}`;
}
