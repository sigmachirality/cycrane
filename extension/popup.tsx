import React, { useState } from "react"
import { ThemeProvider } from 'styled-components'
import { 
  ThorinGlobalStyles,
  Button,
  LockSVG,
  darkTheme
 } from '@ensdomains/thorin'


interface IThorinProps {
  children: React.ReactNode
}

function Thorin({ children }: IThorinProps) {
  return <ThemeProvider theme={darkTheme}>
    <ThorinGlobalStyles />
    {children}
  </ThemeProvider>
}

export default function IndexPopup() {
  return (
    <Thorin>
      <div style={{ width: '180px' }}>
        <Button prefix={<LockSVG />} variant="primary">
          Connect Wallet
        </Button>
      </div>
    </Thorin >
  )
}
