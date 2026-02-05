import type { Transaction } from '../types';
import { getChainByName } from '../config/chains';

interface SummaryProps {
  transactions: Transaction[];
}

export function Summary({ transactions }: SummaryProps) {
  const summaryByChain = transactions.reduce((acc, tx) => {
    const chainKey = tx.chain.toLowerCase();
    if (!acc[chainKey]) {
      acc[chainKey] = {
        chain: tx.chain,
        totalIn: 0,
        totalOut: 0,
        count: 0
      };
    }
    
    const amount = parseFloat(tx.amount);
    if (tx.type === 'in') {
      acc[chainKey].totalIn += amount;
    } else {
      acc[chainKey].totalOut += amount;
    }
    acc[chainKey].count++;
    
    return acc;
  }, {} as Record<string, { chain: string; totalIn: number; totalOut: number; count: number }>);
  
  const chains = Object.values(summaryByChain);
  
  if (chains.length === 0) return null;
  
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
        Transaction Summary
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chains.map((summary) => {
          const chain = getChainByName(summary.chain);
          return (
            <div
              key={summary.chain}
              className="bg-white dark:bg-gray-700 rounded-lg p-4 border dark:border-gray-600"
            >
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xl">{chain?.logo || ''}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {summary.chain}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total In:</span>
                  <span className="font-mono text-green-600 dark:text-green-400">
                    {summary.totalIn.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Out:</span>
                  <span className="font-mono text-red-600 dark:text-red-400">
                    {summary.totalOut.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Transactions:</span>
                  <span className="font-mono">{summary.count}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
