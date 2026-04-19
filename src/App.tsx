import { useState, useEffect } from 'react';
import type { Transaction, ChainScanStatus } from './types';
import { CHAINS, getChainById } from './config/chains';
import { isValidEthereumAddress, isValidSolanaAddress } from './utils/address';
import { scanMultipleChains } from './services/api';
import { exportToCSV } from './utils/format';
import { ChainSelector } from './components/ChainSelector';
import { ChainStatus } from './components/ChainStatus';
import { TransactionTable } from './components/TransactionTable';
import { Summary } from './components/Summary';
import { ApiKeyManager } from './components/ApiKeyManager';

const EVM_CHAINS = CHAINS.filter(c => c.id !== 'solana');
const SOLANA_CHAIN = CHAINS.find(c => c.id === 'solana')!;

function App() {
  const [evmAddress, setEvmAddress] = useState('');
  const [solanaAddress, setSolanaAddress] = useState('');
  const [selectedChains, setSelectedChains] = useState<string[]>(
    EVM_CHAINS.filter(c => c.freeTierAvailable === true).map(c => c.id)
  );
  const [tokenAddress, setTokenAddress] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [scanStatuses, setScanStatuses] = useState<Map<string, ChainScanStatus>>(new Map());
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApiKeyManagerOpen, setIsApiKeyManagerOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('darkMode');
    return stored !== null ? stored === 'true' : true;
  });

  const chainsWithHits = Array.from(scanStatuses.values())
    .filter(s => s.transactionCount > 0)
    .map(s => getChainById(s.chainId)?.name || s.chainId);

  const chainsWithErrors = Array.from(scanStatuses.values())
    .filter(s => s.status === 'error' && s.error)
    .map(s => ({ chain: getChainById(s.chainId)?.name || s.chainId, error: s.error as string }));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  const toggleChain = (chainId: string) => {
    setSelectedChains(prev =>
      prev.includes(chainId) ? prev.filter(id => id !== chainId) : [...prev, chainId]
    );
  };

  const handleScan = async () => {
    const hasEvm = evmAddress.trim().length > 0;
    const hasSolana = solanaAddress.trim().length > 0;

    if (!hasEvm && !hasSolana) {
      setError('Enter at least one wallet address');
      return;
    }
    if (hasEvm && !isValidEthereumAddress(evmAddress)) {
      setError('EVM address must start with 0x and be 42 characters');
      return;
    }
    if (hasSolana && !isValidSolanaAddress(solanaAddress)) {
      setError('Invalid Solana address');
      return;
    }
    if (hasEvm && selectedChains.length === 0) {
      setError('Select at least one EVM chain');
      return;
    }

    setError(null);
    setIsScanning(true);
    setTransactions([]);

    const statuses = new Map<string, ChainScanStatus>();
    const evmChains = hasEvm ? EVM_CHAINS.filter(c => selectedChains.includes(c.id)) : [];

    evmChains.forEach(chain => {
      statuses.set(chain.id, { chainId: chain.id, status: 'scanning', transactionCount: 0 });
    });
    if (hasSolana) {
      statuses.set('solana', { chainId: 'solana', status: 'scanning', transactionCount: 0 });
    }
    setScanStatuses(new Map(statuses));

    try {
      const allTransactions: Transaction[] = [];
      const updatedStatuses = new Map(statuses);

      if (hasEvm && evmChains.length > 0) {
        const evmResults = await scanMultipleChains(evmChains, evmAddress.trim(), tokenAddress || undefined);
        evmResults.forEach((result, chainId) => {
          allTransactions.push(...result.transactions);
          updatedStatuses.set(chainId, {
            chainId,
            status: result.error ? 'error' : 'success',
            error: result.error || undefined,
            transactionCount: result.transactions.length
          });
        });
        setScanStatuses(new Map(updatedStatuses));
      }

      if (hasSolana) {
        const solanaResults = await scanMultipleChains([SOLANA_CHAIN], solanaAddress.trim(), tokenAddress || undefined);
        solanaResults.forEach((result, chainId) => {
          allTransactions.push(...result.transactions);
          updatedStatuses.set(chainId, {
            chainId,
            status: result.error ? 'error' : 'success',
            error: result.error || undefined,
            transactionCount: result.transactions.length
          });
        });
        setScanStatuses(new Map(updatedStatuses));
      }

      setTransactions(allTransactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while scanning');
    } finally {
      setIsScanning(false);
    }
  };

  const inputClass = 'w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all';
  const labelClass = 'block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2';

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors">
      <div className="max-w-screen-xl mx-auto px-6 py-10">

        {/* Header */}
        <header className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Chain Scanner</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Multi-chain transaction explorer</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsApiKeyManagerOpen(true)}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              API Keys
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-sm"
            >
              {darkMode ? '☀' : '☾'}
            </button>
          </div>
        </header>

        {/* Scan form */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 mb-4 space-y-6">

          {/* EVM wallet + chain selection */}
          <div className="space-y-3">
            <label className={labelClass}>EVM Wallet</label>
            <input
              type="text"
              value={evmAddress}
              onChange={(e) => setEvmAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              placeholder="0x..."
              className={inputClass}
            />
            <ChainSelector selectedChains={selectedChains} onToggle={toggleChain} />
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-800" />

          {/* Solana wallet */}
          <div>
            <label className={labelClass}>Solana Wallet</label>
            <input
              type="text"
              value={solanaAddress}
              onChange={(e) => setSolanaAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              placeholder="Solana address..."
              className={inputClass}
            />
          </div>

          {/* Advanced toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(v => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              <span className={`transition-transform ${showAdvanced ? 'rotate-90' : ''}`}>▶</span>
              Advanced
            </button>
            {showAdvanced && (
              <div className="mt-3 space-y-1.5">
                <label className={labelClass}>Filter by token <span className="normal-case font-normal text-zinc-400">(optional — leave empty for all transactions)</span></label>
                <input
                  type="text"
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value)}
                  placeholder="Token contract address or Solana mint"
                  className={inputClass}
                />
              </div>
            )}
          </div>

          {error && (
            <div className="px-4 py-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleScan}
            disabled={isScanning}
            className="w-full py-3 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
          >
            {isScanning ? 'Scanning...' : 'Scan Transactions'}
          </button>
        </div>

        {/* Scan status */}
        {(isScanning || scanStatuses.size > 0) && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
              {isScanning ? 'Scanning' : 'Results'}
            </p>
            <div className="space-y-2">
              {Array.from(scanStatuses.values()).map(status => (
                <ChainStatus key={status.chainId} status={status} />
              ))}
            </div>
          </div>
        )}

        {/* Transactions */}
        {transactions.length > 0 && (
          <>
            {chainsWithHits.length > 0 && (
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">Activity on:</span>
                {chainsWithHits.map(name => (
                  <span key={name} className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                    {name}
                  </span>
                ))}
              </div>
            )}

            {chainsWithErrors.length > 0 && (
              <div className="mb-4 px-4 py-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">Errors</p>
                {chainsWithErrors.map(item => (
                  <p key={item.chain} className="text-xs text-amber-700 dark:text-amber-300">
                    <span className="font-medium">{item.chain}:</span> {item.error}
                  </p>
                ))}
              </div>
            )}

            <div className="mb-4">
              <Summary transactions={transactions} />
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Transactions</p>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">{transactions.length} total</span>
              </div>
              <TransactionTable transactions={transactions} onExport={() => exportToCSV(transactions)} />
            </div>
          </>
        )}

        {!isScanning && transactions.length === 0 && scanStatuses.size === 0 && (
          <div className="text-center py-16 text-zinc-400 dark:text-zinc-600">
            <p className="text-sm">Enter a wallet address above to get started</p>
          </div>
        )}
      </div>

      <ApiKeyManager isOpen={isApiKeyManagerOpen} onClose={() => setIsApiKeyManagerOpen(false)} />
    </div>
  );
}

export default App;
