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
    <div className="border border-terminal-border bg-terminal-panel">
      <div className="px-5 py-3 border-b border-terminal-border">
        <span className="text-[10px] tracking-[0.2em] uppercase text-terminal-muted">[ Summary ]</span>
      </div>
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {chains.map((s) => {
          const chain = getChainByName(s.chain);
          return (
            <div key={s.chain} className="border border-terminal-border bg-terminal-dim p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{chain?.logo}</span>
                <span className="text-xs tracking-[0.1em] uppercase text-terminal-text">{s.chain}</span>
                <span className="ml-auto text-[10px] text-terminal-muted">{s.count} txns</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] tracking-[0.1em] uppercase text-terminal-muted">Received</span>
                  <span className="text-xs font-mono text-accent">
                    +{s.totalIn.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] tracking-[0.1em] uppercase text-terminal-muted">Sent</span>
                  <span className="text-xs font-mono text-red-800">
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
