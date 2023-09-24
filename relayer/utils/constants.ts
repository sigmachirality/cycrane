export const router = "0x34A1D3fff3958843C43aD80F30b94c510645C316" as const;

export interface TxInfo {
    to: string;
    value: bigint;
    data: string;
    nonce: number;
}
