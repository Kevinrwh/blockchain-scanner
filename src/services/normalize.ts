import type { Chain, Transaction } from '../types';
import { formatTokenAmount, formatDate } from '../utils/format';

function toSeconds(ts: any): number {
  if (!ts) return Math.floor(Date.now() / 1000);
  const n = Number(ts);
  if (n > 1e12) return Math.floor(n / 1000);
  return Math.floor(n);
}

function guessTxTypeFromEvm(raw: any): 'transfer' | 'swap' | 'contract' | 'unknown' {
  // common DEX method signatures (not exhaustive)
  const swapSigs = [
    '0x38ed1739', // swapExactTokensForTokens
    '0x8803dbee', // swapExactETHForTokens (example)
    '0x7ff36ab5', // swapExactETHForTokensSupportingFeeOnTransferTokens
    '0x18cbafe5'  // swapExactTokensForTokensSupportingFeeOnTransferTokens
  ];

  const input: string = (raw.input || '').toLowerCase();
  if (input && input !== '0x') {
    for (const sig of swapSigs) {
      if (input.startsWith(sig)) return 'swap';
    }
    return 'contract';
  }

  // Native value transfers
  const value = raw.value || raw.val || raw.amount || '0';
  try {
    if (BigInt(String(value || '0')) > BigInt(0)) return 'transfer';
  } catch {
    // ignore parse errors
  }

  if (raw.tokenSymbol || raw.contractAddress) return 'transfer';
  return 'unknown';
}

export function normalizeEvmTx(raw: any, chain: Chain, ownerAddress?: string): Transaction {
  const isToken = !!(raw.tokenSymbol || raw.contractAddress || raw.contractAddress === '');

  const decimals = isToken ? parseInt(raw.tokenDecimal || raw.tokenDecimals || '18', 10) : 18;
  const valueRaw = isToken ? (raw.value || raw.amount || raw.tokenValue || raw.quantity || '0') : (raw.value || '0');
  const amount = formatTokenAmount(String(valueRaw || '0'), decimals);

  const timestamp = toSeconds(raw.timeStamp || raw.blockTime || raw.time || raw.timeStampUTC || raw.timestamp);

  const to = (raw.to || raw.dst || raw.destination || '').toString();
  const from = (raw.from || raw.src || raw.source || '').toString();

  const owner = ownerAddress ? ownerAddress.toLowerCase() : '';
  const isIncoming = owner ? (to.toLowerCase() === owner) : false;

  const txType = guessTxTypeFromEvm(raw);

  return {
    chain: chain.name,
    hash: raw.hash || raw.transactionHash || raw.txHash || raw.signature || '',
    timestamp,
    date: formatDate(timestamp),
    type: isIncoming ? 'in' : 'out',
    from,
    to,
    amount,
    tokenSymbol: raw.tokenSymbol || (isToken ? 'UNKNOWN' : 'NATIVE'),
    tokenAddress: raw.contractAddress || raw.tokenAddress || '',
    tokenDecimals: decimals,
    blockNumber: String(raw.blockNumber || raw.block || raw.slot || ''),
    valueNative: isToken ? undefined : amount,
    txType: txType,
    tokenName: raw.tokenName || undefined,
    decoded: undefined
  } as Transaction;
}

export function normalizeSolanaTx(raw: any, chain: Chain, ownerAddress?: string): Transaction {
  // Solscan v2 fields: from_address, to_address, flow ('in'|'out'), token_address, amount, block_time, trans_id
  const from = raw.from_address || raw.source || raw.src || raw.from || '';
  const to = raw.to_address || raw.destination || raw.dst || raw.to || '';

  const isIncoming = raw.flow === 'in'
    ? true
    : raw.flow === 'out'
      ? false
      : ownerAddress
        ? String(to).toLowerCase() === ownerAddress.toLowerCase()
        : false;

  const decimals = raw.token_decimals || raw.tokenDecimals || raw.decimals || 9;
  const amountRaw = raw.amount || raw.changeAmount || '0';
  const amount = formatTokenAmount(String(amountRaw || '0'), decimals);
  const timestamp = toSeconds(raw.block_time || raw.blockTime || raw.timestamp);

  return {
    chain: chain.name,
    hash: raw.trans_id || raw.signature || raw.txHash || raw.hash || '',
    timestamp,
    date: formatDate(timestamp),
    type: isIncoming ? 'in' : 'out',
    from,
    to,
    amount,
    tokenSymbol: raw.token_symbol || raw.tokenSymbol || raw.symbol || 'UNKNOWN',
    tokenAddress: raw.token_address || raw.mint || '',
    tokenDecimals: decimals,
    blockNumber: String(raw.slot || raw.block_id || raw.blockNumber || ''),
    valueNative: undefined,
    txType: 'transfer',
    tokenName: raw.token_name || raw.tokenName || undefined,
    decoded: undefined
  } as Transaction;
}

export function normalizeHeliusTx(raw: any, chain: Chain, ownerAddress: string, mintFilter?: string): Transaction[] {
  const hash = raw.signature || '';
  const timestamp = toSeconds(raw.timestamp);
  const date = formatDate(timestamp);
  const slot = String(raw.slot || '');
  const txType: Transaction['txType'] = raw.type === 'SWAP' ? 'swap' : 'transfer';
  const results: Transaction[] = [];

  // Token transfers — tokenAmount is already human-readable (Helius pre-divides by decimals)
  const tokenTransfers: any[] = raw.tokenTransfers || [];
  for (const t of tokenTransfers) {
    if (mintFilter && t.mint !== mintFilter) continue;
    const isIncoming = t.toUserAccount === ownerAddress;
    if (t.fromUserAccount !== ownerAddress && !isIncoming) continue;
    results.push({
      chain: chain.name,
      hash,
      timestamp,
      date,
      type: isIncoming ? 'in' : 'out',
      from: t.fromUserAccount || '',
      to: t.toUserAccount || '',
      amount: String(t.tokenAmount ?? 0),
      tokenSymbol: t.symbol || 'UNKNOWN',
      tokenAddress: t.mint || '',
      tokenDecimals: t.decimals ?? 9,
      blockNumber: slot,
      txType,
      tokenName: t.tokenName || undefined,
      decoded: undefined,
    } as Transaction);
  }

  // Native SOL transfers — only include if no token transfers matched
  if (results.length === 0 && !mintFilter) {
    const nativeTransfers: any[] = raw.nativeTransfers || [];
    for (const t of nativeTransfers) {
      const isIncoming = t.toUserAccount === ownerAddress;
      if (t.fromUserAccount !== ownerAddress && !isIncoming) continue;
      results.push({
        chain: chain.name,
        hash,
        timestamp,
        date,
        type: isIncoming ? 'in' : 'out',
        from: t.fromUserAccount || '',
        to: t.toUserAccount || '',
        amount: formatTokenAmount(String(t.amount || 0), 9),
        tokenSymbol: 'SOL',
        tokenAddress: 'So11111111111111111111111111111111111111112',
        tokenDecimals: 9,
        blockNumber: slot,
        txType: 'transfer',
        tokenName: 'Solana',
        decoded: undefined,
      } as Transaction);
    }
  }

  return results;
}

export function classifyTransaction(tx: Transaction, _raw?: any): Transaction {
  // placeholder: classification is already set for EVM/Solana in normalizers
  return tx;
}
