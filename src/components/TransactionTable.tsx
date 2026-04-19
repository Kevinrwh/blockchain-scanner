import { useState } from 'react';
import type { Transaction } from '../types';
import { formatAddress, copyToClipboard } from '../utils/address';
import { formatAge } from '../utils/format';
import { getChainByName } from '../config/chains';

interface TransactionTableProps {
  transactions: Transaction[];
  onExport: () => void;
}

type SortField = 'age' | 'chain' | 'amount';
type SortDirection = 'asc' | 'desc';
type DirectionFilter = 'all' | 'received' | 'sent' | 'failed';

type SingleRow = { kind: 'single'; tx: Transaction };
type SwapRow   = { kind: 'swap';   out: Transaction; in: Transaction };
type DisplayRow = SingleRow | SwapRow;

const METHOD_LABEL: Record<string, string> = {
  transfer: 'Transfer',
  swap:     'Swap',
  contract: 'Execute',
  internal: 'Internal',
  unknown:  'Transfer',
};

const METHOD_STYLE: Record<string, string> = {
  transfer: 'border-zinc-300 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400',
  swap:     'border-indigo-400 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400',
  contract: 'border-purple-400 dark:border-purple-500 text-purple-600 dark:text-purple-400',
  internal: 'border-zinc-300 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400',
  unknown:  'border-zinc-300 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400',
};

function buildDisplayRows(txs: Transaction[]): DisplayRow[] {
  // Group by hash
  const groups = new Map<string, Transaction[]>();
  for (const tx of txs) {
    if (!groups.has(tx.hash)) groups.set(tx.hash, []);
    groups.get(tx.hash)!.push(tx);
  }

  const rows: DisplayRow[] = [];
  for (const group of groups.values()) {
    // Drop zero-amount entries when non-zero ones exist in the same group
    const nonZero = group.filter(tx => parseFloat(tx.amount) !== 0);
    const candidates = nonZero.length > 0 ? nonZero : group;

    if (candidates.length === 1) {
      rows.push({ kind: 'single', tx: candidates[0] });
      continue;
    }

    // Look for a swap pair: one IN + one OUT with different tokens
    const inTx  = candidates.find(t => t.type === 'in');
    const outTx = candidates.find(t => t.type === 'out');
    if (inTx && outTx && inTx.tokenSymbol !== outTx.tokenSymbol) {
      rows.push({ kind: 'swap', out: outTx, in: inTx });
    } else {
      // Multiple same-direction — show the most significant (largest amount)
      const primary = candidates.reduce((best, tx) =>
        parseFloat(tx.amount) > parseFloat(best.amount) ? tx : best
      );
      rows.push({ kind: 'single', tx: primary });
    }
  }
  return rows;
}

export function TransactionTable({ transactions, onExport }: TransactionTableProps) {
  const [sortField, setSortField]       = useState<SortField>('age');
  const [sortDirection, setSortDir]     = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm]     = useState('');
  const [directionFilter, setDirFilter] = useState<DirectionFilter>('all');

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const sorted = [...transactions].sort((a, b) => {
    let aVal: string | number, bVal: string | number;
    switch (sortField) {
      case 'age':    aVal = a.timestamp; bVal = b.timestamp; break;
      case 'chain':  aVal = a.chain;     bVal = b.chain;     break;
      case 'amount': aVal = parseFloat(a.amount); bVal = parseFloat(b.amount); break;
      default: return 0;
    }
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1  : -1;
    return 0;
  });

  const filtered = sorted.filter(tx => {
    if (directionFilter === 'received' && tx.type !== 'in')        return false;
    if (directionFilter === 'sent'     && tx.type !== 'out')       return false;
    if (directionFilter === 'failed'   && tx.status !== 'failed')  return false;
    const q = searchTerm.toLowerCase();
    if (!q) return true;
    return (
      tx.hash.toLowerCase().includes(q)        ||
      tx.tokenSymbol.toLowerCase().includes(q) ||
      tx.from.toLowerCase().includes(q)        ||
      tx.to.toLowerCase().includes(q)
    );
  });

  const displayRows = buildDisplayRows(filtered);

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="ml-1 text-zinc-400">
      {sortField !== field ? '↕' : sortDirection === 'asc' ? '↑' : '↓'}
    </span>
  );

  const th     = 'px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 select-none whitespace-nowrap';
  const thSort = th + ' cursor-pointer hover:text-zinc-600 dark:hover:text-zinc-300';

  const directionTabs: { key: DirectionFilter; label: string }[] = [
    { key: 'all',      label: 'All'      },
    { key: 'received', label: 'Received' },
    { key: 'sent',     label: 'Sent'     },
    { key: 'failed',   label: 'Failed'   },
  ];

  const AddressCell = ({ address }: { address: string }) => (
    <div className="flex items-center gap-1">
      <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{formatAddress(address)}</span>
      <button
        onClick={() => copyToClipboard(address)}
        className="text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400 transition-colors text-xs"
        title="Copy address"
      >⧉</button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden text-xs font-medium">
            {directionTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setDirFilter(tab.key)}
                className={`px-3 py-1.5 transition-colors ${
                  directionFilter === tab.key
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                    : 'bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search hash, token, address..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-64"
          />
        </div>
        <button
          onClick={onExport}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap"
        >
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-100 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50">
            <tr>
              <th className={th}>Tx Hash</th>
              <th className={th}>Method</th>
              <th className={thSort} onClick={() => handleSort('chain')}>Chain <SortIcon field="chain" /></th>
              <th className={thSort} onClick={() => handleSort('age')}>Age <SortIcon field="age" /></th>
              <th className={th}>From</th>
              <th className={th}></th>
              <th className={th}>To</th>
              <th className={thSort} onClick={() => handleSort('amount')}>Amount <SortIcon field="amount" /></th>
              <th className={th}>Fee</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {displayRows.map((row, idx) => {
              if (row.kind === 'swap') {
                const { out, in: inTx } = row;
                const chain    = getChainByName(out.chain);
                const isFailed = out.status === 'failed';

                return (
                  <tr key={`${out.hash}-${idx}`} className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors ${isFailed ? 'opacity-60' : ''}`}>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {isFailed && <span className="text-rose-500 text-xs" title="Failed">⊘</span>}
                        <a href={`${chain?.explorerUrl}/tx/${out.hash}`} target="_blank" rel="noopener noreferrer"
                          className="font-mono text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
                          {formatAddress(out.hash)}
                        </a>
                        <button onClick={() => copyToClipboard(out.hash)} className="text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 transition-colors text-xs" title="Copy hash">⧉</button>
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 rounded border text-[11px] font-medium ${METHOD_STYLE.swap}`}>Swap</span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <span>{chain?.logo}</span>
                        <span className="text-xs text-zinc-600 dark:text-zinc-300">{out.chain}</span>
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap" title={out.date}>
                      {formatAge(out.timestamp)}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap"><AddressCell address={out.from} /></td>
                    <td className="px-1 py-3">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        SWAP
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap"><AddressCell address={inTx.to} /></td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-xs font-medium text-rose-600 dark:text-rose-400">
                          -{out.amount} {out.tokenSymbol}
                        </span>
                        <span className="font-mono text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          +{inTx.amount} {inTx.tokenSymbol}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                      {out.fee ? `${out.fee} ${chain?.nativeCurrency || 'ETH'}` : '—'}
                    </td>
                  </tr>
                );
              }

              // Single row
              const { tx } = row;
              const chain    = getChainByName(tx.chain);
              const isFailed = tx.status === 'failed';
              const isIn     = tx.type === 'in';
              const methodKey = tx.txType || 'unknown';

              return (
                <tr key={`${tx.hash}-${idx}`} className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors ${isFailed ? 'opacity-60' : ''}`}>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {isFailed && <span className="text-rose-500 text-xs" title="Failed">⊘</span>}
                      <a href={`${chain?.explorerUrl}/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer"
                        className="font-mono text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
                        {formatAddress(tx.hash)}
                      </a>
                      <button onClick={() => copyToClipboard(tx.hash)} className="text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 transition-colors text-xs" title="Copy hash">⧉</button>
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-0.5 rounded border text-[11px] font-medium ${METHOD_STYLE[methodKey] || METHOD_STYLE.unknown}`}>
                      {METHOD_LABEL[methodKey] || 'Transfer'}
                    </span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className="flex items-center gap-1.5">
                      <span>{chain?.logo}</span>
                      <span className="text-xs text-zinc-600 dark:text-zinc-300">{tx.chain}</span>
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap" title={tx.date}>
                    {formatAge(tx.timestamp)}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap"><AddressCell address={tx.from} /></td>
                  <td className="px-1 py-3">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                      isIn
                        ? 'border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                        : 'border-rose-300 dark:border-rose-600 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    }`}>
                      {isIn ? 'IN' : 'OUT'}
                    </span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap"><AddressCell address={tx.to} /></td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex flex-col gap-0.5">
                      <span className={`font-mono text-xs font-medium ${
                        isFailed
                          ? 'text-zinc-400 dark:text-zinc-500 line-through'
                          : isIn
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {isIn ? '+' : '-'}{tx.amount} {tx.tokenSymbol}
                      </span>
                      {tx.protocol && (
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                          {tx.protocol.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                    {tx.fee ? `${tx.fee} ${chain?.nativeCurrency || 'ETH'}` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {displayRows.length === 0 && (
          <div className="py-12 text-center text-xs text-zinc-400 dark:text-zinc-600">
            No transactions match your filters
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        Showing {displayRows.length} of {transactions.length} transactions
      </p>
    </div>
  );
}
