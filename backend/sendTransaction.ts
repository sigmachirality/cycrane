import { Account, Chain, WalletClient, createWalletClient, encodeFunctionData, fromHex, http } from "viem"
import { router } from "./constants"
import abi from "../contracts/out/Router.sol/Router.json"
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
function getChain(data: bigint) {
    return getChainFromId(Number(data))
}

async function sendAATransaction(a: bigint[], b: bigint[][], c: bigint[], signals: bigint[], chainId: bigint) {

    let wallet = createWalletClient({
        chain: getChain(chainId),
        transport: http(),
        account
    })

    
    const hash = await wallet.sendTransaction({
        to: router,
        data: encodeFunctionData({
            abi: abi.abi, 
            functionName: "call",
            args: [a, b, c, signals]
        }),
        account: account,
    })
    return hash
}

export default sendAATransaction