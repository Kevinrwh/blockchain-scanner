import { describe, it, expect } from 'vitest';
import { normalizeEvmTx } from '../src/services/normalize';
import { getChainById } from '../src/config/chains';

const chain = getChainById('ethereum')!;

describe('normalizeEvmTx', () => {
  it('normalizes ERC-20 token transfer', () => {
    const raw = {
      hash: '0x1',
      to: '0xRecipient',
      from: '0xSender',
      tokenSymbol: 'USDT',
      tokenDecimal: '6',
      value: '1000000',
      timeStamp: '1650000000',
      contractAddress: '0xToken',
      blockNumber: '123'
    };

    const tx = normalizeEvmTx(raw, chain, '0xRecipient');
    expect(tx.tokenSymbol).toBe('USDT');
    expect(tx.amount).toBe('1');
    expect(tx.txType).toBe('transfer');
    expect(typeof tx.timestamp).toBe('number');
  });

  it('detects swap via input signature', () => {
    const raw = {
      hash: '0x2',
      input: '0x38ed173900000000',
      timeStamp: '1650000001',
      from: '0xA',
      to: '0xB',
      value: '0'
    };

    const tx = normalizeEvmTx(raw, chain, '0xB');
    expect(tx.txType).toBe('swap');
  });

  it('handles native ETH transfer', () => {
    const raw = {
      hash: '0x3',
      value: '1000000000000000000',
      input: '0x',
      timeStamp: '1650000002',
      from: '0xX',
      to: '0xY'
    };

    const tx = normalizeEvmTx(raw, chain, '0xY');
    expect(tx.tokenSymbol).toBe('NATIVE');
    expect(tx.amount).toBe('1');
    expect(tx.txType).toBe('transfer');
  });
});
