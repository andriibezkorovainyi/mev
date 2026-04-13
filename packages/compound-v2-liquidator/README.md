# compound-v2-liquidator

Liquidation bot for [Compound V2](https://compound.finance/) on Ethereum mainnet. Monitors the mempool for pending Chainlink price oracle updates and front-runs them to liquidate underwater positions before the price update lands on-chain. Bundles are submitted via BloxRoute.

## How it works

1. **Mempool listener** (`mempool`) — subscribes to BloxRoute's pending tx stream and watches for `transmit()` calls to Chainlink `AccessControlledOffchainAggregator` contracts (price feed updates).
2. **Liquidation check** (`liquidator`) — on each pending price update, simulates the new price, recomputes account health across all Compound V2 markets, and finds positions that would become liquidatable.
3. **Bundle submission** (`bundle`) — packages the liquidation tx together with the original price update tx and submits the bundle via BloxRoute MEV relay, targeting the same block.
4. **On-chain settlement** — the `LiqBot_v1` smart contract (in `contracts-foundry`) executes the actual `liquidateBorrow` call and handles collateral seizure.

### Architecture

```
main.ts
├── Worker: mempool.worker.ts        — runs in a separate thread
│   └── MempoolService               — BloxRoute WS subscription
│       └── → PostMessage → MasterThread (pending price update detected)
│
└── MasterModule (main thread)
    ├── CollectorService             — historical log sync (past events)
    ├── ComptrollerService           — tracks markets, collateral factors, accounts
    ├── PriceOracleService           — UniswapAnchoredView event processing
    ├── ValidatorProxyService        — Chainlink ValidatorProxy aggregator upgrades
    ├── LiquidatorService            — health factor computation, tx building
    ├── BundleService                — BloxRoute / Flashbots bundle submission
    └── TelegramService              — notifications
```

### Key flow (happy path)

```
BloxRoute WS → pending transmit() tx detected
  → decode new price from calldata
  → simulate price update in-memory
  → for each market: find accounts with shortfall
  → build liquidateBorrow calldata (LiqBot_v1)
  → sign tx
  → submit bundle [priceUpdate tx, liquidation tx] via BloxRoute
  → notify Telegram
```

## Project structure

```
compound-v2-liquidator/
├── main.ts                    # Entry point, spawns mempool worker
├── src/
│   ├── master/                # Master thread orchestration
│   ├── collector/             # Historical event sync
│   ├── comptroller/           # Compound comptroller event handling
│   ├── market/                # cToken market state
│   ├── account/               # Borrower account tracking
│   ├── price-oracle/          # UniswapAnchoredView price tracking
│   ├── validator-proxy/       # Chainlink aggregator upgrades
│   ├── mempool/               # Pending tx monitoring (BloxRoute WS)
│   ├── liquidator/            # Liquidation logic and tx building
│   ├── bundle/                # Bundle construction and relay submission
│   ├── storage/               # In-memory state (markets, accounts, prices)
│   ├── web3/                  # Web3.js wrapper
│   ├── telegram/              # Telegram bot notifications
│   └── worker/                # Worker thread messaging
├── workers/
│   └── mempool.worker.ts      # Mempool listener (runs in Worker thread)
├── scripts/
│   ├── updateExchangeRates.ts # One-off: refresh cToken exchange rates in DB
│   ├── updateUnderlyingPrice.ts
│   └── updateAccountTokenBalance.ts
└── artifacts/                 # ABIs (LiqBot_v1, Comptroller, cToken, network configs)
```

## Configuration

Copy `.env.example` to `.env` (or edit `.env` directly) and fill in the values:

```bash
# Network
NETWORK=mainnet
NETWORK_NAME=eth

# RPC
HTTPS_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/<KEY>
WSS_RPC_URL=wss://eth-mainnet.g.alchemy.com/v2/<KEY>

# BloxRoute
BLOXROUTE_WS_URL=wss://api.blxrbdn.com/ws
BLOXROUTE_HTTPS_URL=https://mev.api.blxrbdn.com
BLOXROUTE_AUTH_HEADER=<BASE64_HEADER>

# Flashbots (optional, secondary relay)
FLASHBOTS_HTTPS_URL=https://relay.flashbots.net

# Compound V2
COMPTROLLER_PROXY_ADDRESS=0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b
UNITROLLER_DEPLOYMENT_BLOCK=7710669
PRICE_ORACLE_ADDRESS=0x50ce56A3239671Ab62f185704Caedf626352741e

# Bot settings
LIQUIDATOR_CONTRACT_ADDRESS=0x1b57f4058863597071548a8b19Fb2bd2B2EC3b6e
MINIMUM_LIQUIDATION_VALUE=3000        # USD, skip positions smaller than this
BLOCK_FILTER_BATCH=1000               # blocks per historical sync batch
SHOULD_FETCH_EXCHANGE_RATES=true
SHOULD_FETCH_UNDERLYING_PRICE=true
SHOULD_SEND_TELEGRAM=false

# Wallet
FROM_ADDRESS=0x...
PRIVATE_KEY=0x...

# Telegram
TG_BOT_TOKEN=...
CHAT_ID=...
```

> **Warning**: never commit `.env` or `ecosystem.config.cjs` with real private keys or API tokens.

## Running

### Development

```bash
# Master thread (restarts on file change)
bun run dev:master

# Mempool worker standalone
bun run dev:mempool
```

### Production

```bash
# Build first
bun run build

# Start via PM2 (uses ecosystem.config.cjs)
bun run prod

# Logs
pm2 logs compound-v2-liquidator
pm2 monit
```

### Utility scripts

```bash
# Refresh exchange rates in storage
bun run update:exchange

# Refresh underlying prices in storage
bun run update:underlying
```

## Tests

```bash
bun test
```

Tests are co-located with their modules (`*.test.ts`). Most tests fork mainnet state and require a valid `HTTPS_RPC_URL` in `.env`.
