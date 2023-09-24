'use client'

import { BaseError } from 'viem'
import { useNetwork, useSwitchNetwork } from 'wagmi'
import { Button, Card } from '@ensdomains/thorin'

export function NetworkSwitcher() {
  const { chain } = useNetwork()
  const { chains, error, isLoading, pendingChainId, switchNetwork } =
    useSwitchNetwork()

  return (
    <Card>
      <div>
        Connected to {chain?.name ?? chain?.id}
        {chain?.unsupported && ' (unsupported)'}
      </div>

      {switchNetwork && (
        <Card style={{ flexDirection: "row"}}>
          {chains.map((x) =>
            x.id === chain?.id ? null : (
              <Button key={x.id} onClick={() => switchNetwork(x.id)} width='45'>
                {x.name}
                {isLoading && x.id === pendingChainId && ' (switching)'}
              </Button>
            ),
          )}
        </Card>
      )}

      <div>{error && (error as BaseError).shortMessage}</div>
    </Card>
  )
}
