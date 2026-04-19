import { describe, it, expect, beforeAll, vi } from 'vitest';
import { scanChain } from '../src/services/api';
import { CHAINS } from '../src/config/chains';

const EVM_WALLET = process.env.TEST_EVM_WALLET;
const SOLANA_WALLET = process.env.TEST_SOLANA_WALLET;
const ETHERSCAN_API_KEY = process.env.TEST_ETHERSCAN_API_KEY;

// Inject API keys via localStorage stub since getApiKey() reads from localStorage
beforeAll(() => {
  const keys: Record<string, string> = {};
  if (ETHERSCAN_API_KEY) keys['etherscan'] = ETHERSCAN_API_KEY;
  if (SOLANA_API_KEY) keys['solana'] = SOLANA_API_KEY;

  vi.stubGlobal('localStorage', {
    getItem: (key: string) =>
      key === 'evm_scanner_api_keys' ? JSON.stringify(keys) : null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
  });
});

const pause = (ms: number) => new Promise(r => setTimeout(r, ms));

describe.skipIf(!EVM_WALLET || !ETHERSCAN_API_KEY)('EVM scanning', () => {
  it('returns transactions from Ethereum', async () => {
    const chain = CHAINS.find(c => c.id === 'ethereum')!;
    const txs = await scanChain(chain, EVM_WALLET!);
    expect(txs.length).toBeGreaterThan(0);
    expect(txs[0]).toMatchObject({
      chain: 'Ethereum',
      hash: expect.any(String),
      type: expect.stringMatching(/^(in|out)$/),
      amount: expect.any(String),
    });
  }, 30_000);

  it('returns transactions from Polygon', async () => {
    await pause(2000); // avoid free-tier 3 req/sec limit from previous test
    const chain = CHAINS.find(c => c.id === 'polygon')!;
    const txs = await scanChain(chain, EVM_WALLET!);
    expect(txs.length).toBeGreaterThan(0);
    expect(txs[0]).toMatchObject({
      chain: 'Polygon',
      hash: expect.any(String),
    });
  }, 30_000);
});

const SOLANA_API_KEY = process.env.TEST_SOLANA_API_KEY;

describe.skipIf(!SOLANA_WALLET || !SOLANA_API_KEY)('Solana scanning', () => {
  it('returns transactions from Solana', async () => {
    await pause(2000);
    const chain = CHAINS.find(c => c.id === 'solana')!;
    const txs = await scanChain(chain, SOLANA_WALLET!);
    expect(txs.length).toBeGreaterThan(0);
    expect(txs[0]).toMatchObject({
      chain: 'Solana',
      hash: expect.any(String),
      type: expect.stringMatching(/^(in|out)$/),
    });
  }, 30_000);
});
