import type { Chain, Transaction } from '../types';
import { getApiKey } from '../utils/storage';
import { normalizeEvmTx, normalizeHeliusTx, isSpamToken } from './normalize';

interface ApiResponse {
  status: string;
  message: string;
  result: any[];
}

function maskAddress(address: string): string {
  if (!address) return '';
  if (address.length <= 10) return '***';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

async function fetchWithRetry(
  url: string,
  retries = 3,
  delay = 1000,
  headers?: HeadersInit
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, { headers });
      if (response.ok) {
        return response;
      }
      if (response.status === 429) {
        // Rate limit - wait longer
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1) * 2));
        continue;
      }
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}

async function scanSolana(
  chain: Chain,
  address: string,
  tokenAddress?: string
): Promise<Transaction[]> {
  const apiKey = getApiKey(chain.id);
  if (!apiKey) {
    throw new Error('Helius API key required — add one via API Keys');
  }

  const limit = 100;
  const allTransactions: Transaction[] = [];
  const seenSignatures = new Set<string>();
  let before: string | undefined;

  for (let page = 0; page < 20; page++) {
    let url = `${chain.apiUrl}/addresses/${address}/transactions?api-key=${apiKey}&limit=${limit}`;
    if (before) url += `&before=${before}`;

    console.log(`Scanning ${chain.name} page ${page + 1}:`, url.replace(apiKey, '[API_KEY]').replace(address, maskAddress(address)));

    const response = await fetchWithRetry(url, 3, 1000);
    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) break;

    for (const tx of data) {
      if (tx.signature && seenSignatures.has(tx.signature)) continue;
      if (tx.signature) seenSignatures.add(tx.signature);
      const normalized = normalizeHeliusTx(tx, chain, address, tokenAddress);
      allTransactions.push(...normalized);
    }

    if (data.length < limit) break;
    before = data[data.length - 1].signature;
    await new Promise(r => setTimeout(r, 200));
  }

  return allTransactions.filter(tx => tx.hash);
}

async function scanEvm(
  chain: Chain,
  address: string,
  tokenAddress?: string
): Promise<Transaction[]> {
  if (!chain.evmChainId) {
    throw new Error('Missing chain ID for EVM scan');
  }
  
  const apiKey = getApiKey('etherscan') || getApiKey(chain.id);
  const apiKeyParam = apiKey ? `&apikey=${apiKey}` : '';
  
  // Normalize addresses to lowercase for API calls (EVM chains)
  const normalizedAddress = address.toLowerCase();
  const normalizedTokenAddress = tokenAddress?.toLowerCase();
  
  const pageSize = 100;
  const maxPages = 20;
  
  const fetchPaged = async (action: 'tokentx' | 'txlist'): Promise<any[]> => {
    const allTransactions: any[] = [];
    
    for (let page = 1; page <= maxPages; page++) {
      let url = '';
      
      if (action === 'tokentx') {
        if (normalizedTokenAddress) {
          url = `${chain.apiUrl}?chainid=${chain.evmChainId}&module=account&action=tokentx&address=${normalizedAddress}&contractaddress=${normalizedTokenAddress}&page=${page}&offset=${pageSize}&startblock=0&endblock=99999999&sort=desc${apiKeyParam}`;
        } else {
          url = `${chain.apiUrl}?chainid=${chain.evmChainId}&module=account&action=tokentx&address=${normalizedAddress}&page=${page}&offset=${pageSize}&startblock=0&endblock=99999999&sort=desc${apiKeyParam}`;
        }
      } else {
        url = `${chain.apiUrl}?chainid=${chain.evmChainId}&module=account&action=txlist&address=${normalizedAddress}&page=${page}&offset=${pageSize}&startblock=0&endblock=99999999&sort=desc${apiKeyParam}`;
      }
      
      console.log(
        `Scanning ${chain.name} ${action} page ${page} with URL:`,
        url.replace(apiKey || '', '[API_KEY]').replace(normalizedAddress, maskAddress(normalizedAddress))
      );
      
      const response = await fetchWithRetry(url);
      const data: ApiResponse = await response.json();
      
      console.log(`API Response for ${chain.name} ${action} page ${page}:`, {
        status: data.status,
        message: data.message,
        resultType: typeof data.result,
        resultLength: Array.isArray(data.result) ? data.result.length : 'not array'
      });
      
      if (data.status === '0') {
        if (typeof data.result === 'string' && data.result === '0') {
          break;
        }
        if (data.message === 'No transactions found' || 
            data.message === 'No token transfers found' ||
            data.message?.toLowerCase().includes('no transactions')) {
          break;
        }
        if (data.message && !data.message.includes('No transactions')) {
          const errorMessage =
            data.message === 'NOTOK' && typeof data.result === 'string'
              ? data.result
              : data.message;
          throw new Error(errorMessage || 'API error');
        }
      }
      
      if (!data.result || (typeof data.result === 'string' && data.result === '0')) {
        break;
      }
      
      if (!Array.isArray(data.result)) {
        console.warn(`Unexpected result format for ${chain.name}:`, data.result);
        break;
      }
      
      const validTransactions = data.result.filter((tx: any) => tx && tx.hash);
      allTransactions.push(...validTransactions);
      
      if (validTransactions.length < pageSize) {
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 400));
    }

    return allTransactions;
  };

  const tokenTransfers = await fetchPaged('tokentx');
  if (!normalizedTokenAddress) await new Promise(r => setTimeout(r, 400));
  const nativeTransfers = normalizedTokenAddress ? [] : await fetchPaged('txlist');
  
  const tokenMapped = tokenTransfers.map((tx: any) => normalizeEvmTx(tx, chain, address));
  const nativeMapped = nativeTransfers.map((tx: any) => normalizeEvmTx(tx, chain, address));

  return [...tokenMapped, ...nativeMapped].filter(
    (tx: Transaction) => tx.hash && !isSpamToken(tx.tokenName, tx.tokenSymbol)
  );
}

export async function scanChain(
  chain: Chain,
  address: string,
  tokenAddress?: string
): Promise<Transaction[]> {
  // Route to Solana handler if it's Solana
  if (chain.id === 'solana') {
    return scanSolana(chain, address, tokenAddress);
  }
  
  try {
    return await scanEvm(chain, address, tokenAddress);
  } catch (error) {
    console.error(`Error scanning ${chain.name}:`, error);
    throw error;
  }
}

export interface ChainScanResult {
  chainId: string;
  transactions: Transaction[];
  error: string | null;
}

export async function scanMultipleChains(
  chains: Chain[],
  address: string,
  tokenAddress?: string
): Promise<Map<string, ChainScanResult>> {
  const results = new Map<string, ChainScanResult>();

  for (const chain of chains) {
    try {
      const transactions = await scanChain(chain, address, tokenAddress);
      results.set(chain.id, { chainId: chain.id, transactions, error: null });
    } catch (error) {
      results.set(chain.id, {
        chainId: chain.id,
        transactions: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    // pause between chains to stay under free-tier rate limit (3 req/sec)
    if (chains.indexOf(chain) < chains.length - 1) {
      await new Promise(r => setTimeout(r, 800));
    }
  }

  return results;
}
