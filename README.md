# Multi-Chain EVM Transaction Scanner

A modern, client-side web application for scanning token transactions across multiple EVM-compatible blockchains.

## Features

- 🔍 **Multi-Chain Support**: Scan transactions across 7 major EVM chains
  - Ethereum
  - Binance Smart Chain
  - Polygon
  - Arbitrum
  - Optimism
  - Base
  - Avalanche

- ⚡ **Parallel Scanning**: Simultaneously query multiple chains for faster results
- 🎯 **Token Filtering**: Filter transactions by specific token contract address
- 📊 **Transaction Table**: Sortable, searchable table with all transaction details
- 💾 **CSV Export**: Export transaction data for analysis
- 📈 **Summary Statistics**: View totals per chain
- 🔑 **API Key Management**: Add your own API keys for higher rate limits
- 🌙 **Dark Mode**: Toggle between light and dark themes
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

1. Enter a wallet address (must be a valid Ethereum address format)
2. Optionally enter a token contract address to filter transactions
3. Select which chains to scan (checkboxes)
4. Click "Scan Transactions"
5. View results in the sortable table
6. Export to CSV if needed

## API Keys

The application works with free-tier API endpoints, but you can add your own API keys for higher rate limits:

1. Click the "API Keys" button
2. Enter your API keys for each chain (optional)
3. Keys are stored locally in your browser

Get API keys from:
- [Etherscan](https://etherscan.io/apis)
- [BscScan](https://bscscan.com/apis)
- [PolygonScan](https://polygonscan.com/apis)
- [Arbiscan](https://arbiscan.io/apis)
- [Optimistic Etherscan](https://optimistic.etherscan.io/apis)
- [BaseScan](https://basescan.org/apis)
- [SnowTrace](https://snowtrace.io/apis)

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Fetch API** - HTTP requests

## License

MIT
