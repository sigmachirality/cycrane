import { Account, Chain, WalletClient, createWalletClient, fromHex, http } from "viem"
import { router } from "./constants"
import * as chains from 'viem/chains'
require('dotenv').config()
import { privateKeyToAccount } from "viem/accounts"

const account = privateKeyToAccount(process.env.PRIVATE_KEY! as `0x${string}`);

function getChainFromId(chainId: number) {
    for (const chain of Object.values(chains)) {
      if ('id' in chain) {
        if (chain.id === chainId) {
          return chain;
        }
      }
    }

    throw new Error(`Chain with id ${chainId} not found`);
  }
function getChain(data: string) {
    let id = fromHex(`0x${data.slice(-32)}`, "bigint")
    return getChainFromId(Number(id))
}

async function sendAATransaction(calldata: string, proof: string) {

    let chain = getChain(calldata)

    let wallet = createWalletClient({
        chain: getChain(calldata),
        transport: http(),
        account
    })

    
    const hash = await wallet.sendTransaction({
        to: router,
        data: `0x7f1b2174${calldata}${proof}`,
        account: account,
        chain: getChain(calldata)
    })
    return hash
}

export default sendAATransaction