import type { Transaction } from '../types';
import { getChainByName } from '../config/chains';

interface SummaryProps {
  transactions: Transaction[];
}

export function Summary({ transactions }: SummaryProps) {
  const summaryByChain = transactions.reduce((acc, tx) => {
    const key = tx.chain.toLowerCase();
    if (!acc[key]) acc[key] = { chain: tx.chain, totalIn: 0, totalOut: 0, count: 0 };
    const amount = parseFloat(tx.amount);
    if (tx.type === 'in') acc[key].totalIn += amount;
    else acc[key].totalOut += amount;
    acc[key].count++;
    return acc;
  }, {} as Record<string, { chain: string; totalIn: number; totalOut: number; count: number }>);

  const chains = Object.values(summaryByChain);
  if (chains.length === 0) return null;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
        Summary
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {chains.map((s) => {
          const chain = getChainByName(s.chain);
          return (
            <div key={s.chain} className="rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{chain?.logo}</span>
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{s.chain}</span>
                <span className="ml-auto text-xs text-zinc-400 dark:text-zinc-500">{s.count} txns</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">Received</span>
                  <span className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400">
                    +{s.totalIn.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">Sent</span>
                  <span className="text-xs font-mono font-medium text-rose-500 dark:text-rose-400">
                    -{s.totalOut.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
