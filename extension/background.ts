import { Core } from '@walletconnect/core'
import { Web3Wallet } from '@walletconnect/web3wallet'
import { buildApprovedNamespaces } from '@walletconnect/utils'


const core = new Core({
  projectId: process.env.PLASMO_PUBLIC_PROJECT_ID
})

const web3wallet = await Web3Wallet.init({
  core, // <- pass the shared `core` instance
  metadata: {
    name: 'Cycrane',
    description: 'Sign transactions via ZK by sending an email',
    url: 'www.cycrane.com',
    icons: []
  }
})

// Allow connections through WalletConnect
web3wallet.on('session_proposal', async sessionProposal => {
  const { id, params } = sessionProposal

  const approvedNamespaces = buildApprovedNamespaces({
    proposal: params,
    supportedNamespaces: {
      eip155: {
        chains: ['eip155:1', 'eip155:137'],
        methods: ['eth_sendTransaction'],
        events: ['accountsChanged', 'chainChanged'],
        accounts: [
          'eip155:1:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb',
          'eip155:137:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb'
        ]
      }
    }
  })

  const session = await web3wallet.approveSession({
    id,
    namespaces: approvedNamespaces
  })
})