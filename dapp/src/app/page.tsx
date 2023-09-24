"use client"
import { Account } from '../components/Account'
import { Connect } from '../components/Connect'
import { Connected } from '../components/Connected'
import { ERC20 } from '../components/ERC20'
import { Heading } from '@ensdomains/thorin'
import { NetworkSwitcher } from '../components/NetworkSwitcher'
import { ThemeProvider } from 'styled-components'
import { ThorinGlobalStyles, lightTheme, Card } from '@ensdomains/thorin'

export function Page() {
  return (
    <>
      <ThemeProvider theme={lightTheme}>
      <ThorinGlobalStyles />
      <Card>
        <Heading>Test ERC20 Txs</Heading>

      <Connect />

      <Connected>
        <Account />
        <hr />
        <ERC20 />
        <hr />
        <NetworkSwitcher />
      </Connected>
      </Card>
      </ThemeProvider>

    </>
  )
}

export default Page
