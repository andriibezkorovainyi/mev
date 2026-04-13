# MEV — Liquidation Bot Monorepo

Monorepo for MEV/liquidation bots on Ethereum. Built with [Bun](https://bun.sh) and managed as a workspace.

## Packages

| Package | Description |
|---------|-------------|
| [`compound-v2-liquidator`](./packages/compound-v2-liquidator) | Liquidation bot for Compound V2 on Ethereum mainnet |
| [`contracts-foundry`](./packages/contracts-foundry) | Solidity smart contracts (liquidator contract, scripts, tests) |

## Stack

- **Runtime**: Bun
- **Process manager**: PM2
- **Blockchain**: Web3.js v4
- **MEV relay**: BloxRoute (bundle submission)
- **Flashbots**: Flashbots relay
- **Notifications**: Telegram bot

## Setup

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- [PM2](https://pm2.keymetrics.io/) (for production)

```bash
npm i -g pm2
```

### Install dependencies

```bash
bun install
```

### Build

```bash
bun run build
# or just compound-v2-liquidator:
bun run build:compv2
```

## Running

### Development

```bash
cd packages/compound-v2-liquidator
bun run dev:master
```

### Production (PM2)

```bash
bun run prod
# or from the package:
cd packages/compound-v2-liquidator
bun run prod
```

PM2 config is in [`ecosystem.config.cjs`](./ecosystem.config.cjs).

## Server setup (Ubuntu)

```bash
sudo apt update && sudo apt install unzip git lsb-release keychain

# Install Bun
curl -fsSL https://bun.sh/install | bash

# Make bun available system-wide
sudo ln -s ~/.bun/bin/bun /usr/local/bin/bun

# Install Redis
curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list
sudo apt-get update && sudo apt-get install redis
sudo systemctl enable redis-server

# Install PM2
npm i -g pm2

# Clone and start
git clone git@github.com:andriibezkorovainyi/mev.git /opt/mev
cd /opt/mev
bun install
bun run build
bun run prod
```
