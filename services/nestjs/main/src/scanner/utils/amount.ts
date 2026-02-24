import { ethers } from "ethers";

export const convert = {
    bigintToFloat: (amount?: bigint | string, decimals?: bigint) => {
        return parseFloat(ethers.formatUnits(amount ?? 0, decimals ?? 18n));
    },
    floatToBigInt: (amount?: string, decimals?: bigint) => {
        return ethers.parseUnits(amount ?? '0', decimals ?? 18n);
    },
    floatStringToNumber: (amount?: string) => {
        return parseFloat(amount ?? '0');
    },
}

export const calculate = {
    usd: (amount: string, price: number) => {
        return convert.floatStringToNumber(amount) * price;
    },
} 