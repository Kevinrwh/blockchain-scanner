import type { Chain } from '../types';

export const CHAINS: Chain[] = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    apiUrl: 'https://api.etherscan.io/api',
    explorerUrl: 'https://etherscan.io',
    logo: '⟠',
    color: 'bg-blue-500'
  },
  {
    id: 'bsc',
    name: 'Binance Smart Chain',
    apiUrl: 'https://api.bscscan.com/api',
    explorerUrl: 'https://bscscan.com',
    logo: '🟡',
    color: 'bg-yellow-500'
  },
  {
    id: 'polygon',
    name: 'Polygon',
    apiUrl: 'https://api.polygonscan.com/api',
    explorerUrl: 'https://polygonscan.com',
    logo: '🟣',
    color: 'bg-purple-500'
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum',
    apiUrl: 'https://api.arbiscan.io/api',
    explorerUrl: 'https://arbiscan.io',
    logo: '🔵',
    color: 'bg-cyan-500'
  },
  {
    id: 'optimism',
    name: 'Optimism',
    apiUrl: 'https://api-optimistic.etherscan.io/api',
    explorerUrl: 'https://optimistic.etherscan.io',
    logo: '🔴',
    color: 'bg-red-500'
  },
  {
    id: 'base',
    name: 'Base',
    apiUrl: 'https://api.basescan.org/api',
    explorerUrl: 'https://basescan.org',
    logo: '🔷',
    color: 'bg-indigo-500'
  },
  {
    id: 'avalanche',
    name: 'Avalanche',
    apiUrl: 'https://api.snowtrace.io/api',
    explorerUrl: 'https://snowscan.xyz',
    logo: '❄️',
    color: 'bg-sky-500'
  },
  {
    id: 'solana',
    name: 'Solana',
    apiUrl: 'https://public-api.solscan.io',
    explorerUrl: 'https://solscan.io',
    logo: '◎',
    color: 'bg-purple-600'
  }
];

export function getChainById(id: string): Chain | undefined {
  return CHAINS.find(chain => chain.id === id);
}

export function getChainByName(name: string): Chain | undefined {
  return CHAINS.find(chain => 
    chain.name.toLowerCase() === name.toLowerCase() ||
    chain.id.toLowerCase() === name.toLowerCase()
  );
}
