'use client'

import { useAccount, useEnsName } from 'wagmi'
import { Card } from '@ensdomains/thorin'

export function Account() {
  const { address } = useAccount()
  const { data: ensName } = useEnsName({ address })

  return (
    <Card>
      {ensName ?? address}
      {ensName ? ` (${address})` : null}
    </Card>
  )
}
