module.exports = {
  apps: [
    {
      name: 'compound-v2-liquidator',
      exec_mode: 'fork',
      script: 'main.js',
      interpreter: '/root/.bun/bin/bun',
      cwd: '/root/opt/mev/packages/compound-v2-liquidator',
      time: true,
      env: {
          // Working environment for Compound V2 Liquidator
          NETWORK: 'mainnet',
          NETWORK_NAME: 'eth',
          PROTOCOL: 'compound_v2',
          // RPC URLs
          HTTPS_RPC_URL:'https://eth-mainnet.g.alchemy.com/v2/Kpg100POT3vj4JVGz-PNIRn6NjWyNEtx',
          WSS_RPC_URL:'wss://eth-mainnet.g.alchemy.com/v2/Kpg100POT3vj4JVGz-PNIRn6NjWyNEtx',
          // BloxRoute
          BLOXROUTE_WS_URL: 'wss://13.213.141.24/ws', // Singapore
          BLOXROUTE_HTTPS_URL: 'https://mev.api.blxrbdn.com',
          BLOXROUTE_AUTH_HEADER: 'N2Q0MzE5NzYtMDY1Ny00YjM3LWFiZjEtYzBiNTRhYjJjYWUxOmY0ZDc2MWVkNmIyZjlkYzNiYWEzNWIzZTM0NTFiMjFh',
          // Compound V2
          COMPTROLLER_PROXY_ADDRESS: '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b',
          UNITROLLER_DEPLOYMENT_BLOCK: 7710669,
          // Settings
          LIQUIDATOR_CONTRACT_ADDRESS: '0x1b57f4058863597071548a8b19Fb2bd2B2EC3b6e',
          SHOULD_FETCH_EXCHANGE_RATES: true,
          NORMAL_PRICE_ORACLE_START_BLOCK: 16426620,
          BLOCK_FILTER_BATCH: 1000,
          MINIMUM_LIQUIDATION_VALUE: 3000,
          // Wallet
          FROM_ADDRESS: '0x7014852D523d70Dd671cbcb1841Fbd6710906725',
          PRIVATE_KEY: '0xc3e50fa2035cf3c1d2d212984b790bbd2fa0ae160c730bc97886f2ce06f8fccb',
          TG_BOT_TOKEN: '7094397468:AAEqH5yBGn8V2TtC0E_UiuWtpjbPHfUjGMw',
          CHAT_ID: '591465584,5487519841'
      }
    },
  ],
};
