'use client'

import { useState } from 'react'
import { BaseError } from 'viem'
import { Address, useAccount, useNetwork, useWaitForTransaction } from 'wagmi'
import { Input, Button, Card, Typography, Heading } from '@ensdomains/thorin'

import {
  useErc20Allowance,
  useErc20Approve,
  useErc20BalanceOf,
  useErc20Name,
  useErc20Symbol,
  useErc20TotalSupply,
  useErc20Transfer,
  usePrepareErc20Approve,
  usePrepareErc20Transfer,
} from '../generated'

export function ERC20() {
  const { address } = useAccount()
  const [contractAddress, setContractAddress] = useState<Address>(
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  )

  return (
    <Card>
      <Heading>ERC20 Contract</Heading>
      <Input 
        label='Contract Address'
        width='96'
        onChange={(e) => setContractAddress(e.target.value as Address)}
        value={contractAddress}
      />
      <Card.Divider />
      {contractAddress && (
        <>
          <Heading>Info</Heading>
          <Name contractAddress={contractAddress} />
          <TotalSupply contractAddress={contractAddress} />
          <BalanceOf address={address} contractAddress={contractAddress} />
          <Card.Divider />

          <Heading>Transfer</Heading>
          <Transfer contractAddress={contractAddress} />
          <Card.Divider />

          <Heading>Allowance</Heading>
          <Allowance address={address} contractAddress={contractAddress} />
        </>
      )}
    </Card>
  )
}

function Name({ contractAddress }: { contractAddress: Address }) {
  const { data: name } = useErc20Name({
    address: contractAddress,
  })
  const { data: symbol } = useErc20Symbol({
    address: contractAddress,
  })
  return (
    <Card>
      Name: {name} ({symbol})
    </Card>
  )
}

function TotalSupply({ contractAddress }: { contractAddress: Address }) {
  const { data: totalSupply } = useErc20TotalSupply({
    address: contractAddress,
  })
  return <Card>Total Supply: {totalSupply?.toString()} units</Card>
}

function BalanceOf({
  address,
  contractAddress,
}: {
  address?: Address
  contractAddress: Address
}) {
  const { data: balance } = useErc20BalanceOf({
    address: contractAddress,
    args: address ? [address] : undefined,
    watch: true,
  })
  return <Card>Balance: {balance?.toString()} units</Card>
}

function Allowance({
  address,
  contractAddress,
}: {
  address?: Address
  contractAddress: Address
}) {
  const [amount, setAmount] = useState('')
  const [spender, setSpender] = useState(
    '0xc961145a54C96E3aE9bAA048c4F4D6b04C13916b' as Address,
  )

  const { config, error, isError } = usePrepareErc20Approve({
    address: contractAddress,
    args: spender && amount ? [spender, BigInt(amount)] : undefined,
    enabled: Boolean(spender && amount),
  })
  const { data, write } = useErc20Approve(config)

  const { isLoading, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  })

  const { data: balance } = useErc20Allowance({
    address: contractAddress,
    args: address && spender ? [address, spender] : undefined,
    watch: true,
  })

  return (
    <Card>
      <div>
        <Input 
          label='Spender'
          width='96'
          onChange={(e) => setSpender(e.target.value as Address)}
          placeholder="0xabcabc"
          value={spender}

        />
      </div>
      <div>
        <Input 
          label='Allowance'
          width='96'
          disabled={isLoading}
          onChange={(e) => setAmount(e.target.value)}
          placeholder=""
          value={amount}
        />
        <Button disabled={isLoading && !write} onClick={() => write?.()} style={{ marginTop: 25 }}>
          set
        </Button>
        {isLoading && <ProcessingMessage hash={data?.hash} />}
        {isSuccess && <div>Success!</div>}
        {isError && <div>Error: {(error as BaseError)?.shortMessage}</div>}
      </div>
      <Card.Divider />
      <Typography>Allowance: {balance?.toString()}</Typography>
    </Card>
  )
}

function Transfer({ contractAddress }: { contractAddress: Address }) {
  const [address, setAddress] = useState('' as Address)
  const [amount, setAmount] = useState('')

  const { config, error, isError } = usePrepareErc20Transfer({
    address: contractAddress,
    args: address && amount ? [address, BigInt(amount)] : undefined,
    enabled: Boolean(address && amount),
  })
  const { data, write } = useErc20Transfer(config)

  const { isLoading, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  })

  return (
    <Card>
      <Input 
        label='Recipient Address'
        width='96'
        onChange={(e) => setAddress(e.target.value as Address)}
        placeholder="recipient address"
        value={address}
      />
      <Input 
        label='Amount (wei)'
        width='96'
        onChange={(e) => setAmount(e.target.value)}
        placeholder="amount (in wei)"
        value={amount}
      />
      <Button disabled={!write} onClick={() => write?.()}>
        transfer
      </Button>
      {isLoading && <ProcessingMessage hash={data?.hash} />}
      {isSuccess && <div>Success!</div>}
      {isError && <div>Error: {(error as BaseError)?.shortMessage}</div>}
    </Card>
  )
}

function ProcessingMessage({ hash }: { hash?: `0x${string}` }) {
  const { chain } = useNetwork()
  const etherscan = chain?.blockExplorers?.etherscan
  return (
    <span>
      Processing transaction...{' '}
      {etherscan && (
        <a href={`${etherscan.url}/tx/${hash}`}>{etherscan.name}</a>
      )}
    </span>
  )
}
