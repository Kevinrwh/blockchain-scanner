import type { Chain, Transaction } from '../types';
import { getApiKey } from '../utils/storage';
import { formatTokenAmount, formatDate } from '../utils/format';

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
  // Solana uses Solscan API which has a different structure
  const apiKey = getApiKey(chain.id);
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  
  if (apiKey) {
    headers['token'] = apiKey;
  }
  
  try {
    // Solscan API endpoint for token transfers
    // Note: Solscan API structure may vary, using common endpoint pattern
    let url = `${chain.apiUrl}/account/spl-token-transfers?address=${address}&offset=0&limit=100`;
    
    if (tokenAddress) {
      // Filter by token mint address
      url += `&mint=${tokenAddress}`;
    }
    
    console.log(`Scanning ${chain.name} with URL:`, url.replace(address, maskAddress(address)));
    
    const response = await fetchWithRetry(url, 3, 1000, headers);
    const data = await response.json();
    
    console.log(`API Response for ${chain.name}:`, {
      dataLength: Array.isArray(data) ? data.length : 'not array',
      dataType: typeof data,
      data: data
    });
    
    // Handle different response formats
    let transactions: any[] = [];
    if (Array.isArray(data)) {
      transactions = data;
    } else if (data.data && Array.isArray(data.data)) {
      transactions = data.data;
    } else if (data.result && Array.isArray(data.result)) {
      transactions = data.result;
    } else {
      return [];
    }
    
    if (transactions.length === 0) {
      return [];
    }
    
    return transactions.map((tx: any) => {
      // Solana transaction structure is different - handle various field names
      const dest = tx.destination || tx.dst || tx.to || '';
      const src = tx.source || tx.src || tx.from || '';
      const isIncoming = dest.toLowerCase() === address.toLowerCase();
      
      const decimals = tx.tokenDecimals || tx.decimals || 9; // Solana tokens typically use 9 decimals
      const amount = tx.amount || tx.changeAmount || tx.quantity || '0';
      const formattedAmount = formatTokenAmount(amount.toString(), decimals);
      
      // Convert Solana timestamp (seconds or milliseconds) to Unix timestamp (seconds)
      let timestamp = Math.floor(Date.now() / 1000);
      if (tx.blockTime) {
        timestamp = tx.blockTime > 10000000000 
          ? Math.floor(tx.blockTime / 1000) // If milliseconds
          : tx.blockTime; // If already in seconds
      } else if (tx.timestamp) {
        timestamp = tx.timestamp > 10000000000 
          ? Math.floor(tx.timestamp / 1000)
          : tx.timestamp;
      }
      
      return {
        chain: chain.name,
        hash: tx.signature || tx.txHash || tx.hash || '',
        timestamp,
        date: formatDate(timestamp),
        type: isIncoming ? 'in' : 'out',
        from: src,
        to: dest,
        amount: formattedAmount,
        tokenSymbol: tx.tokenSymbol || tx.symbol || tx.tokenName || 'UNKNOWN',
        tokenAddress: tx.mint || tx.tokenMint || tokenAddress || '',
        tokenDecimals: decimals,
        blockNumber: (tx.slot || tx.blockNumber || '').toString()
      } as Transaction;
    }).filter((tx: Transaction) => tx.hash); // Filter out invalid transactions
  } catch (error) {
    console.error(`Error scanning ${chain.name}:`, error);
    throw error;
  }
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
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return allTransactions;
  };
  
  const tokenTransfers = await fetchPaged('tokentx');
  const nativeTransfers = normalizedTokenAddress ? [] : await fetchPaged('txlist');
  
  const tokenMapped = tokenTransfers.map((tx: any) => {
    const isIncoming = tx.to.toLowerCase() === address.toLowerCase();
    const decimals = parseInt(tx.tokenDecimal || '18', 10);
    const amount = formatTokenAmount(tx.value || '0', decimals);
    
    const timestamp = parseInt(tx.timeStamp, 10);
    return {
      chain: chain.name,
      hash: tx.hash,
      timestamp,
      date: formatDate(timestamp),
      type: isIncoming ? 'in' : 'out',
      from: tx.from,
      to: tx.to,
      amount,
      tokenSymbol: tx.tokenSymbol || 'UNKNOWN',
      tokenAddress: tx.contractAddress,
      tokenDecimals: decimals,
      blockNumber: tx.blockNumber
    } as Transaction;
  });
  
  const nativeMapped = nativeTransfers.map((tx: any) => {
    const to = tx.to || '';
    const isIncoming = to.toLowerCase() === address.toLowerCase();
    const amount = formatTokenAmount(tx.value || '0', 18);
    
    const timestamp = parseInt(tx.timeStamp, 10);
    return {
      chain: chain.name,
      hash: tx.hash,
      timestamp,
      date: formatDate(timestamp),
      type: isIncoming ? 'in' : 'out',
      from: tx.from,
      to,
      amount,
      tokenSymbol: 'NATIVE',
      tokenAddress: '',
      tokenDecimals: 18,
      blockNumber: tx.blockNumber
    } as Transaction;
  });
  
  return [...tokenMapped, ...nativeMapped];
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
  
  const promises = chains.map(async (chain) => {
    try {
      const transactions = await scanChain(chain, address, tokenAddress);
      const result: ChainScanResult = {
        chainId: chain.id,
        transactions,
        error: null
      };
      results.set(chain.id, result);
      return result;
    } catch (error) {
      const result: ChainScanResult = {
        chainId: chain.id,
        transactions: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      results.set(chain.id, result);
      return result;
    }
  });
  
  await Promise.all(promises);
  return results;
}
