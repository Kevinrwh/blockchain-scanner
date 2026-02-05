import type { ChainScanStatus } from '../types';
import { getChainById } from '../config/chains';

interface ChainStatusProps {
  status: ChainScanStatus;
}

export function ChainStatus({ status }: ChainStatusProps) {
  const chain = getChainById(status.chainId);
  
  if (!chain) return null;
  
  const getStatusColor = () => {
    switch (status.status) {
      case 'scanning':
        return 'text-blue-500';
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };
  
  const getStatusIcon = () => {
    switch (status.status) {
      case 'scanning':
        return '⏳';
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      default:
        return '○';
    }
  };
  
  return (
    <div className="flex items-center justify-between p-2 border rounded-lg">
      <div className="flex items-center space-x-2">
        <span className="text-lg">{chain.logo}</span>
        <span className="font-medium text-gray-700 dark:text-gray-300">
          {chain.name}
        </span>
      </div>
      <div className="flex items-center space-x-2">
        {status.status === 'scanning' && (
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        )}
        <span className={`text-sm ${getStatusColor()}`}>
          {getStatusIcon()} {status.transactionCount} txns
        </span>
        {status.error && (
          <div className="group relative">
            <span className="text-xs text-red-500 cursor-help">⚠</span>
            <div className="absolute right-0 top-full mt-1 w-64 p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
              {status.error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
