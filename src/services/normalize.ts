import type { Chain, Transaction } from '../types';
import { formatTokenAmount, formatDate } from '../utils/format';

function toSeconds(ts: any): number {
  if (!ts) return Math.floor(Date.now() / 1000);
  const n = Number(ts);
  if (n > 1e12) return Math.floor(n / 1000);
  return Math.floor(n);
}

const SPAM_PATTERN = /https?:|www\.|\.com\b|\.vip\b|\.us\b|\.io\b|\.net\b|\.org\b|visit |claim |reward|airdrop/i;

export function isSpamToken(tokenName?: string, tokenSymbol?: string): boolean {
  return SPAM_PATTERN.test(tokenName || '') || SPAM_PATTERN.test(tokenSymbol || '');
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
  const isToken = !!(raw.tokenSymbol || (raw.contractAddress && raw.contractAddress !== ''));

  const decimals = isToken ? parseInt(raw.tokenDecimal || raw.tokenDecimals || '18', 10) : 18;
  const valueRaw = isToken ? (raw.value || raw.amount || raw.tokenValue || raw.quantity || '0') : (raw.value || '0');
  const amount = formatTokenAmount(String(valueRaw || '0'), decimals);

  const timestamp = toSeconds(raw.timeStamp || raw.blockTime || raw.time || raw.timeStampUTC || raw.timestamp);

  const to = (raw.to || raw.dst || raw.destination || '').toString();
  const from = (raw.from || raw.src || raw.source || '').toString();

  const owner = ownerAddress ? ownerAddress.toLowerCase() : '';
  const isIncoming = owner ? (to.toLowerCase() === owner) : false;

  const txType = guessTxTypeFromEvm(raw);

  const gasUsed = raw.gasUsed ? BigInt(raw.gasUsed) : undefined;
  const gasPrice = raw.gasPrice ? BigInt(raw.gasPrice) : undefined;
  const fee = gasUsed !== undefined && gasPrice !== undefined
    ? formatTokenAmount(String(gasUsed * gasPrice), 18)
    : undefined;

  const status: Transaction['status'] = raw.isError === '1' ? 'failed' : 'success';

  return {
    chain: chain.name,
    hash: raw.hash || raw.transactionHash || raw.txHash || raw.signature || '',
    timestamp,
    date: formatDate(timestamp),
    type: isIncoming ? 'in' : 'out',
    from,
    to,
    amount,
    tokenSymbol: raw.tokenSymbol || (isToken ? 'UNKNOWN' : (chain.nativeCurrency || 'ETH')),
    tokenAddress: raw.contractAddress || raw.tokenAddress || '',
    tokenDecimals: decimals,
    blockNumber: String(raw.blockNumber || raw.block || raw.slot || ''),
    valueNative: isToken ? undefined : amount,
    txType,
    tokenName: raw.tokenName || undefined,
    fee,
    status,
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

const KNOWN_SOLANA_MINTS: Record<string, string> = {
  'So11111111111111111111111111111111111111112':  'SOL',
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So':  'mSOL',
  'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1':  'bSOL',
  'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn': 'jitoSOL',
  '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj': 'stSOL',
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 'BONK',
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN':  'JUP',
  'WENWENvqqNya429ubCdR81ZmD69brwQaaBYY6p3LCpk':   'WEN',
};

function resolveSymbol(mint: string, heliusSymbol?: string): string {
  if (heliusSymbol) return heliusSymbol;
  if (KNOWN_SOLANA_MINTS[mint]) return KNOWN_SOLANA_MINTS[mint];
  if (!mint) return 'UNKNOWN';
  return `${mint.slice(0, 4)}…${mint.slice(-4)}`;
}

export function normalizeHeliusTx(raw: any, chain: Chain, ownerAddress: string, mintFilter?: string): Transaction[] {
  const hash = raw.signature || '';
  const timestamp = toSeconds(raw.timestamp);
  const date = formatDate(timestamp);
  const slot = String(raw.slot || '');
  const txType: Transaction['txType'] = raw.type === 'SWAP' ? 'swap' : 'transfer';
  const fee = raw.fee !== undefined ? formatTokenAmount(String(raw.fee), 9) : undefined;
  const status: Transaction['status'] = raw.transactionError ? 'failed' : 'success';
  const protocol: string | undefined = raw.source && raw.source !== 'UNKNOWN' ? raw.source : undefined;
  const results: Transaction[] = [];

  // Token transfers — tokenAmount is already human-readable (Helius pre-divides by decimals)
  const tokenTransfers: any[] = raw.tokenTransfers || [];
  for (const t of tokenTransfers) {
    if (mintFilter && t.mint !== mintFilter) continue;
    const isIncoming = t.toUserAccount === ownerAddress;
    if (t.fromUserAccount !== ownerAddress && !isIncoming) continue;
    const mint: string = t.mint || '';
    const symbol = resolveSymbol(mint, t.symbol);
    results.push({
      chain: chain.name,
      hash,
      timestamp,
      date,
      type: isIncoming ? 'in' : 'out',
      from: t.fromUserAccount || '',
      to: t.toUserAccount || '',
      amount: String(t.tokenAmount ?? 0),
      tokenSymbol: symbol,
      tokenAddress: mint,
      tokenDecimals: t.decimals ?? 9,
      blockNumber: slot,
      txType,
      tokenName: t.tokenName || symbol,
      fee,
      status,
      protocol,
      decoded: undefined,
    } as Transaction);
  }

  // Native SOL transfers — try direct nativeTransfers first, then fall back to
  // accountData which captures SOL that flows through intermediary accounts (common
  // in pump.fun sells where the bonding curve is the direct sender, not the owner).
  if (!mintFilter) {
    const alreadyHasSol = results.some(
      r => r.tokenAddress === 'So11111111111111111111111111111111111111112'
    );

    if (!alreadyHasSol) {
      let solAmount = 0;
      let solFrom = '';
      let solTo = '';
      let capturedViaNative = false;

      const nativeTransfers: any[] = raw.nativeTransfers || [];
      for (const t of nativeTransfers) {
        if (!t.amount || t.amount === 0) continue;
        const isIncoming = t.toUserAccount === ownerAddress;
        if (t.fromUserAccount !== ownerAddress && !isIncoming) continue;
        solAmount = t.amount;
        solFrom = t.fromUserAccount || '';
        solTo = t.toUserAccount || '';
        capturedViaNative = true;
        break;
      }

      // Fallback: use accountData net balance change when nativeTransfers didn't
      // find a direct transfer (SOL arrived via intermediate accounts).
      if (!capturedViaNative) {
        const accountData: any[] = raw.accountData || [];
        const ownerData = accountData.find((a: any) => a.account === ownerAddress);
        const netChange: number = ownerData?.nativeBalanceChange ?? 0;
        // Exclude pure fee deductions (no real SOL movement, just gas)
        const feeAmt = raw.fee ?? 0;
        const movement = Math.abs(netChange) - (netChange < 0 ? 0 : feeAmt);
        if (movement > 0) {
          solAmount = Math.abs(netChange);
          solFrom = netChange < 0 ? ownerAddress : '';
          solTo   = netChange > 0 ? ownerAddress : '';
        }
      }

      if (solAmount > 0) {
        const isIncoming = solTo === ownerAddress;
        results.push({
          chain: chain.name,
          hash,
          timestamp,
          date,
          type: isIncoming ? 'in' : 'out',
          from: solFrom,
          to: solTo,
          amount: formatTokenAmount(String(solAmount), 9),
          tokenSymbol: 'SOL',
          tokenAddress: 'So11111111111111111111111111111111111111112',
          tokenDecimals: 9,
          blockNumber: slot,
          txType: results.length > 0 ? 'swap' : 'transfer',
          tokenName: 'Solana',
          fee,
          status,
          protocol,
          decoded: undefined,
        } as Transaction);
      }
    }
  }

  return results;
}

export function classifyTransaction(tx: Transaction, _raw?: any): Transaction {
  // placeholder: classification is already set for EVM/Solana in normalizers
  return tx;
}
