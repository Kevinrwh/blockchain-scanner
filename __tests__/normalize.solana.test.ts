import { describe, it, expect } from 'vitest';
import { normalizeSolanaTx } from '../src/services/normalize';
import { getChainById } from '../src/config/chains';

const chain = getChainById('solana')!;

describe('normalizeSolanaTx', () => {
  it('normalizes SPL token transfer', () => {
    const raw = {
      signature: 'sig1',
      destination: 'OwnerAddr',
      source: 'SrcAddr',
      amount: '1000000',
      tokenDecimals: 6,
      blockTime: 1650000100
    };

    const tx = normalizeSolanaTx(raw, chain, 'OwnerAddr');
    expect(tx.hash).toBe('sig1');
    expect(tx.amount).toBe('1');
    expect(tx.txType).toBe('transfer');
  });
});
