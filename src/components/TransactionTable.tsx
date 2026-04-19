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
    let aVal: any, bVal: any;
    
    switch (sortField) {
      case 'date':
        aVal = a.timestamp;
        bVal = b.timestamp;
        break;
      case 'chain':
        aVal = a.chain;
        bVal = b.chain;
        break;
      case 'type':
        aVal = a.type;
        bVal = b.type;
        break;
      case 'amount':
        aVal = parseFloat(a.amount);
        bVal = parseFloat(b.amount);
        break;
      case 'token':
        aVal = a.tokenSymbol;
        bVal = b.tokenSymbol;
        break;
      default:
        return 0;
    }
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
  
  const filteredTransactions = sortedTransactions.filter(tx => {
    if (txTypeFilter !== 'all' && (tx.txType || 'unknown') !== txTypeFilter) return false;
    return (
      tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.tokenSymbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.to.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });
  
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕';
    return sortDirection === 'asc' ? '↑' : '↓';
  };
  
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p className="text-lg">No transactions found</p>
        <p className="text-sm mt-2">Try scanning with different parameters</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 flex-1 max-w-md"
          />
          <select
            value={txTypeFilter}
            onChange={(e) => setTxTypeFilter(e.target.value as any)}
            className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 text-sm"
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
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Export CSV
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b dark:border-gray-700">
              <th
                className="p-3 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => handleSort('date')}
              >
                Date {getSortIcon('date')}
              </th>
              <th
                className="p-3 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => handleSort('chain')}
              >
                Chain {getSortIcon('chain')}
              </th>
              <th
                className="p-3 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => handleSort('type')}
              >
                Type {getSortIcon('type')}
              </th>
              <th
                className="p-3 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => handleSort('amount')}
              >
                Amount {getSortIcon('amount')}
              </th>
              <th
                className="p-3 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => handleSort('token')}
              >
                Token {getSortIcon('token')}
              </th>
              <th className="p-3 text-left">TX Hash</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((tx, idx) => {
              const chain = getChainByName(tx.chain);
              return (
                <tr
                  key={`${tx.hash}-${idx}`}
                  className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="p-3 text-sm">{tx.date}</td>
                  <td className="p-3">
                    <span className="text-lg">{chain?.logo || ''}</span>
                    <span className="ml-1 text-sm">{tx.chain}</span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        tx.type === 'in'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}
                    >
                      {tx.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-sm">{tx.amount}</td>
                  <td className="p-3 text-sm">{tx.tokenSymbol}</td>
                  <td className="p-3">
                    <a
                      href={`${chain?.explorerUrl}/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline font-mono text-sm"
                    >
                      {formatAddress(tx.hash)}
                    </a>
                    <button
                      onClick={() => copyToClipboard(tx.hash)}
                      className="ml-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      title="Copy hash"
                    >
                      📋
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Showing {filteredTransactions.length} of {transactions.length} transactions
      </div>
    </div>
  );
}
