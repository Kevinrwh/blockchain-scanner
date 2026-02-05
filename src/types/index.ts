export interface Chain {
  id: string;
  name: string;
  apiUrl: string;
  explorerUrl: string;
  logo: string;
  color: string;
}

export interface Transaction {
  chain: string;
  hash: string;
  timestamp: number;
  date: string;
  type: 'in' | 'out';
  from: string;
  to: string;
  amount: string;
  tokenSymbol: string;
  tokenAddress: string;
  tokenDecimals: number;
  blockNumber: string;
}

export interface ChainScanStatus {
  chainId: string;
  status: 'idle' | 'scanning' | 'success' | 'error';
  error?: string;
  transactionCount: number;
}

export interface ScanResult {
  transactions: Transaction[];
  summary: {
    chain: string;
    totalIn: string;
    totalOut: string;
    transactionCount: number;
  }[];
}

export interface ApiKeyConfig {
  [chainId: string]: string;
}
