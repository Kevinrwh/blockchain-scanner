# Chain Scanner

A client-side web app for scanning transaction history across EVM-compatible blockchains and Solana. No backend — all scanning happens directly in your browser.

## Features

- **Multi-chain EVM scanning** — scan Ethereum, Polygon, Arbitrum, Base, Avalanche, and BNB Smart Chain simultaneously using a single Etherscan API key
- **Solana scanning** — scan SPL token transfers and native SOL transactions via the Helius API
- **Separate EVM and Solana address inputs** — enter an EVM wallet (`0x...`) and a Solana wallet independently; scan one or both at the same time
- **Token filter** — optionally narrow results to a specific ERC-20 contract address or Solana mint
- **Transaction table** — sort by date, chain, type, amount, or token; search by hash, address, or token symbol; filter by transaction type (transfer, swap, contract, internal)
- **Per-chain status** — live scan progress shown per chain with transaction counts and error details
- **Summary cards** — total received and sent per chain across all results
- **CSV export** — download all visible transactions as a CSV file
- **API key manager** — enter and test API keys in-app; keys are stored in browser `localStorage` and never sent anywhere except the respective API

## Supported Chains

| Chain | Free tier |
|---|---|
| Ethereum | ✓ |
| Polygon | ✓ |
| Arbitrum | ✓ |
| Base | Paid Etherscan plan |
| Avalanche | Paid Etherscan plan |
| BNB Smart Chain | Paid Etherscan plan |
| Solana | ✓ (Helius free tier) |

## Setup

```bash
npm install
npm run dev      # http://localhost:5173
```

## Getting API Keys

**Etherscan** (required for EVM chains)
- Sign up at [etherscan.io](https://etherscan.io) and generate a free API key
- Free tier covers Ethereum, Polygon, and Arbitrum
- Base, Avalanche, and BNB Smart Chain require a paid plan

**Helius** (required for Solana)
- Sign up at [helius.dev](https://helius.dev) and generate a free API key

Add both keys via the **API Keys** button in the top-right corner of the app. Use the **Test Key** button to verify your Etherscan key before scanning.

## Usage

1. Add your API keys via the **API Keys** button
2. Enter an EVM wallet address (`0x...`), a Solana wallet address, or both
3. Select which EVM chains to include (free-tier chains are pre-selected)
4. Optionally open **Advanced** to filter by a specific token contract or mint address
5. Click **Scan Transactions**
6. Results appear per-chain as they complete — sort, search, filter, and export as needed

## API Key Security

Keys are stored exclusively in your browser's `localStorage`. They are never written to any source file and are not included in any network request except to the respective API (Etherscan or Helius). Committing this project to GitHub exposes no secrets.

## Tech Stack

- React 18, TypeScript, Vite, Tailwind CSS
- Vitest for unit and integration tests
- Etherscan v2 unified API, Helius API
