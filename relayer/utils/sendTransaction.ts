import { createWalletClient, decodeAbiParameters, fromHex, http } from "viem"
import { TxInfo, router } from "./constants"
import * as chains from 'viem/chains'
import { privateKeyToAccount } from "viem/accounts"
import { encodeFunctionData } from "viem";
// @ts-ignore
import abi from "../contracts/out/Router.sol/Router.json"

require('dotenv').config()

const account = privateKeyToAccount(process.env.PRIVATE_KEY! as `0x${string}`);

function getChain(chainId: number | bigint): chains.Chain {
  const chain = Object.values(chains).find(chain => chain?.id === Number(chainId))
  if (chain) return chain;
  throw new Error(`Chain with id ${chainId} not found`);
}

async function sendAATransaction(email: string, data: string, a: bigint[], b: bigint[][], c: bigint[], signals: bigint[], chainId: bigint) {

  let info = decodeAbiParameters(
    [
      {name: "to", type: "address"},
      {name: "value", type: "uint256"},
      {name: "data", type: "bytes"},
      {name: "nonce", type: "uint256"},
    ],
    data as `0x${string}`
  )

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
          args: [email, info, a, b, c, signals]
      }),
      account: account,
  })
  return hash
}

export default sendAATransaction
