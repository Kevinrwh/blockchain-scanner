import type { Chain } from '../types';

export const CHAINS: Chain[] = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    apiUrl: 'https://api.etherscan.io/v2/api',
    explorerUrl: 'https://etherscan.io',
    logo: '⟠',
    color: 'bg-blue-500',
    apiProvider: 'etherscan_v2',
    evmChainId: 1,
    freeTierAvailable: true
  },
  {
    id: 'bsc',
    name: 'Binance Smart Chain',
    apiUrl: 'https://api.etherscan.io/v2/api',
    explorerUrl: 'https://bscscan.com',
    logo: '🟡',
    color: 'bg-yellow-500',
    apiProvider: 'etherscan_v2',
    evmChainId: 56,
    freeTierAvailable: false
  },
  {
    id: 'polygon',
    name: 'Polygon',
    apiUrl: 'https://api.etherscan.io/v2/api',
    explorerUrl: 'https://polygonscan.com',
    logo: '🟣',
    color: 'bg-purple-500',
    apiProvider: 'etherscan_v2',
    evmChainId: 137,
    freeTierAvailable: true
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum',
    apiUrl: 'https://api.etherscan.io/v2/api',
    explorerUrl: 'https://arbiscan.io',
    logo: '🔵',
    color: 'bg-cyan-500',
    apiProvider: 'etherscan_v2',
    evmChainId: 42161,
    freeTierAvailable: true
  },
  {
    id: 'optimism',
    name: 'Optimism',
    apiUrl: 'https://api.etherscan.io/v2/api',
    explorerUrl: 'https://optimistic.etherscan.io',
    logo: '🔴',
    color: 'bg-red-500',
    apiProvider: 'etherscan_v2',
    evmChainId: 10,
    freeTierAvailable: false
  },
  {
    id: 'base',
    name: 'Base',
    apiUrl: 'https://api.etherscan.io/v2/api',
    explorerUrl: 'https://basescan.org',
    logo: '🔷',
    color: 'bg-indigo-500',
    apiProvider: 'etherscan_v2',
    evmChainId: 8453,
    freeTierAvailable: false
  },
  {
    id: 'avalanche',
    name: 'Avalanche',
    apiUrl: 'https://api.etherscan.io/v2/api',
    explorerUrl: 'https://snowscan.xyz',
    logo: '❄️',
    color: 'bg-sky-500',
    apiProvider: 'etherscan_v2',
    evmChainId: 43114,
    freeTierAvailable: false
  },
  {
    id: 'solana',
    name: 'Solana',
    apiUrl: 'https://public-api.solscan.io',
    explorerUrl: 'https://solscan.io',
    logo: '◎',
    color: 'bg-purple-600',
    apiProvider: 'solscan'
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
