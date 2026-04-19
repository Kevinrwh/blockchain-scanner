# Multi-Chain Transaction Scanner

A client-side web app for scanning token transactions across EVM chains and Solana.

## Supported Chains

| Chain | Free tier |
|---|---|
| Ethereum | ✓ |
| Polygon | ✓ |
| Arbitrum | ✓ |
| Base | Paid |
| Avalanche | Paid |
| BNB Smart Chain | Paid |
| Solana | Coming soon |

Free-tier chains use the [Etherscan v2 unified API](https://docs.etherscan.io/supported-chains). A free Etherscan API key is required. Paid-tier chains require an Etherscan paid plan.

## Setup

```bash
npm install
npm run dev      # http://localhost:5173
```

## Usage

1. Add your Etherscan API key via the **API Keys** button
2. Enter a wallet address (`0x...` for EVM, base58 for Solana)
3. Select chains and click **Scan Transactions**
4. Filter, sort, and export results to CSV

## Tech Stack

- React 18, TypeScript, Vite, Tailwind CSS
- Vitest for unit and integration tests
