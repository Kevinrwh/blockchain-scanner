# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start dev server at http://localhost:5173
npm run build     # tsc + vite build
npm run lint      # eslint (zero warnings allowed)
npm test          # vitest (watch mode)
npx vitest run    # single test run (CI-style)
npx vitest run __tests__/normalize.evm.test.ts  # run one test file
npx vitest run --config vitest.integration.config.ts  # live API integration tests (requires .env.local)
```

Integration tests hit live APIs and are excluded from `npm test`. They read wallet addresses from `.env.local` (gitignored) and skip gracefully if the file is absent.

## Architecture

This is a fully client-side React + TypeScript app — no backend. All chain scanning happens in the browser via fetch calls to third-party APIs.

### Data flow

1. `App.tsx` owns all state (wallet address, selected chains, scan statuses, transactions).
2. On scan, it calls `scanMultipleChains()` from `src/services/api.ts`, which scans chains **sequentially** (500ms gap between each) to stay under the Etherscan free-tier rate limit (3 req/sec).
3. Raw API responses are normalized into `Transaction` objects via `src/services/normalize.ts` (`normalizeEvmTx`, `normalizeSolanaTx`).
4. Results stream back and `App.tsx` merges them into a flat `Transaction[]` for display.

### API layer (`src/services/api.ts`)

- **EVM chains** use the Etherscan v2 unified API (`api.etherscan.io/v2/api`) with `chainid=` param. Two endpoints are queried: `tokentx` (ERC-20 transfers) and `txlist` (native transfers). Paginated up to 20 pages × 100 results.
- **Solana** uses the Solscan public API (`public-api.solscan.io`), querying `/account/spl-token-transfers`.
- `fetchWithRetry` handles 429 rate limits with exponential backoff.
- API keys are stored in `localStorage` via `src/utils/storage.ts` and injected per-request. EVM chains share a single `etherscan` key; Solana uses `solana`.

### Chain config (`src/config/chains.ts`)

All chains are defined in the `CHAINS` array. Key fields:
- `apiProvider`: `'etherscan_v2'` or `'solscan'` — determines which scanner is used.
- `evmChainId`: required for EVM chains; passed as `chainid=` to the Etherscan v2 API.
- `freeTierAvailable`: chains marked `false` require a paid Etherscan plan. They are unchecked by default in the UI but can be enabled — scans will fail with a clear error if the key doesn't have access.

### Normalization (`src/services/normalize.ts`)

Both `normalizeEvmTx` and `normalizeSolanaTx` accept raw API response objects and produce typed `Transaction` values. They handle field name variance across API versions. `guessTxTypeFromEvm` classifies transactions by inspecting the `input` field for known DEX method signatures.

### Types (`src/types/index.ts`)

`Transaction` is the central type — all display components and the CSV export consume it. The `txType` field (`transfer | swap | contract | internal | unknown`) is set during normalization and drives the filter dropdown in `TransactionTable`.

### Tests (`__tests__/`)

Unit tests cover `normalizeEvmTx` and `normalizeSolanaTx` only. Tests live in `__tests__/` and use vitest globals.
