import { useState } from 'react';
import type { Transaction } from '../types';
import { formatAddress, copyToClipboard } from '../utils/address';
import { getChainByName } from '../config/chains';

interface TransactionTableProps {
  transactions: Transaction[];
  onExport: () => void;
}

type SortField = 'date' | 'chain' | 'type' | 'amount' | 'token';
type SortDirection = 'asc' | 'desc';

export function TransactionTable({ transactions, onExport }: TransactionTableProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'transfer' | 'swap' | 'contract' | 'internal' | 'unknown'>('all');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    let aVal: string | number, bVal: string | number;
    switch (sortField) {
      case 'date':   aVal = a.timestamp; bVal = b.timestamp; break;
      case 'chain':  aVal = a.chain;     bVal = b.chain;     break;
      case 'type':   aVal = a.type;      bVal = b.type;      break;
      case 'amount': aVal = parseFloat(a.amount); bVal = parseFloat(b.amount); break;
      case 'token':  aVal = a.tokenSymbol; bVal = b.tokenSymbol; break;
      default: return 0;
    }
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredTransactions = sortedTransactions.filter(tx => {
    if (txTypeFilter !== 'all' && (tx.txType || 'unknown') !== txTypeFilter) return false;
    const q = searchTerm.toLowerCase();
    return (
      tx.hash.toLowerCase().includes(q) ||
      tx.tokenSymbol.toLowerCase().includes(q) ||
      tx.from.toLowerCase().includes(q) ||
      tx.to.toLowerCase().includes(q)
    );
  });

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="ml-1 text-zinc-400">
      {sortField !== field ? '↕' : sortDirection === 'asc' ? '↑' : '↓'}
    </span>
  );

  const th = 'px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 cursor-pointer hover:text-zinc-600 dark:hover:text-zinc-300 select-none whitespace-nowrap';

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 justify-between">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search by hash, token, address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-64"
          />
          <select
            value={txTypeFilter}
            onChange={(e) => setTxTypeFilter(e.target.value as typeof txTypeFilter)}
            className="px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All types</option>
            <option value="transfer">Transfer</option>
            <option value="swap">Swap</option>
            <option value="contract">Contract</option>
            <option value="internal">Internal</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
        <button
          onClick={onExport}
          className="px-3 py-2 text-sm font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-100 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50">
            <tr>
              <th className={th} onClick={() => handleSort('date')}>Date <SortIcon field="date" /></th>
              <th className={th} onClick={() => handleSort('chain')}>Chain <SortIcon field="chain" /></th>
              <th className={th} onClick={() => handleSort('type')}>Type <SortIcon field="type" /></th>
              <th className={th} onClick={() => handleSort('amount')}>Amount <SortIcon field="amount" /></th>
              <th className={th} onClick={() => handleSort('token')}>Token <SortIcon field="token" /></th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Hash</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filteredTransactions.map((tx, idx) => {
              const chain = getChainByName(tx.chain);
              return (
                <tr key={`${tx.hash}-${idx}`} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="px-3 py-3 text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">{tx.date}</td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className="flex items-center gap-1.5">
                      <span>{chain?.logo}</span>
                      <span className="text-xs text-zinc-600 dark:text-zinc-300">{tx.chain}</span>
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      tx.type === 'in'
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                        : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    }`}>
                      {tx.type === 'in' ? '↓ IN' : '↑ OUT'}
                    </span>
                  </td>
                  <td className={`px-3 py-3 font-mono text-xs font-medium ${
                    tx.type === 'in'
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {tx.type === 'in' ? '+' : '-'}{tx.amount}
                  </td>
                  <td className="px-3 py-3 text-xs font-medium text-zinc-700 dark:text-zinc-300">{tx.tokenSymbol}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`${chain?.explorerUrl}/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
                      >
                        {formatAddress(tx.hash)}
                      </a>
                      <button
                        onClick={() => copyToClipboard(tx.hash)}
                        className="text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400 transition-colors text-xs"
                        title="Copy hash"
                      >
                        ⧉
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        Showing {filteredTransactions.length} of {transactions.length} transactions
      </p>
    </div>
  );
}
