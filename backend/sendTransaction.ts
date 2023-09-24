import { Account, Chain, WalletClient } from "viem"


async function sendAATransaction(wallet: WalletClient, account: Account, chain: Chain, calldata: string, proof: string) {
    const hash = await wallet.sendTransaction({
        to: router,
        data: `0x7f1b2174${calldata}${proof}`,
        account: account,
        chain: chain
    })
    return hash
}

export default sendAATransaction