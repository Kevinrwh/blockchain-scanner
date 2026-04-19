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

  const chainsWithHits = Array.from(scanStatuses.values())
    .filter(s => s.transactionCount > 0)
    .map(s => getChainById(s.chainId)?.name || s.chainId);

  const chainsWithErrors = Array.from(scanStatuses.values())
    .filter(s => s.status === 'error' && s.error)
    .map(s => ({ chain: getChainById(s.chainId)?.name || s.chainId, error: s.error as string }));

  // Force dark body
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const toggleChain = (chainId: string) => {
    setSelectedChains(prev =>
      prev.includes(chainId) ? prev.filter(id => id !== chainId) : [...prev, chainId]
    );
  };

  const handleScan = async () => {
    const hasEvm = evmAddress.trim().length > 0;
    const hasSolana = solanaAddress.trim().length > 0;

    if (!hasEvm && !hasSolana) { setError('Enter at least one wallet address'); return; }
    if (hasEvm && !isValidEthereumAddress(evmAddress)) { setError('EVM address must start with 0x and be 42 characters'); return; }
    if (hasSolana && !isValidSolanaAddress(solanaAddress)) { setError('Invalid Solana address'); return; }
    if (hasEvm && selectedChains.length === 0) { setError('Select at least one EVM chain'); return; }

    setError(null);
    setIsScanning(true);
    setTransactions([]);

    const statuses = new Map<string, ChainScanStatus>();
    const evmChains = hasEvm ? EVM_CHAINS.filter(c => selectedChains.includes(c.id)) : [];
    evmChains.forEach(chain => statuses.set(chain.id, { chainId: chain.id, status: 'scanning', transactionCount: 0 }));
    if (hasSolana) statuses.set('solana', { chainId: 'solana', status: 'scanning', transactionCount: 0 });
    setScanStatuses(new Map(statuses));

    try {
      const allTransactions: Transaction[] = [];
      const updatedStatuses = new Map(statuses);

      if (hasEvm && evmChains.length > 0) {
        const evmResults = await scanMultipleChains(evmChains, evmAddress.trim(), tokenAddress || undefined);
        evmResults.forEach((result, chainId) => {
          allTransactions.push(...result.transactions);
          updatedStatuses.set(chainId, { chainId, status: result.error ? 'error' : 'success', error: result.error || undefined, transactionCount: result.transactions.length });
        });
        setScanStatuses(new Map(updatedStatuses));
      }

      if (hasSolana) {
        const solanaResults = await scanMultipleChains([SOLANA_CHAIN], solanaAddress.trim(), tokenAddress || undefined);
        solanaResults.forEach((result, chainId) => {
          allTransactions.push(...result.transactions);
          updatedStatuses.set(chainId, { chainId, status: result.error ? 'error' : 'success', error: result.error || undefined, transactionCount: result.transactions.length });
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

  const inputClass = 'w-full pl-8 pr-4 py-3 bg-terminal-dim border border-terminal-border text-terminal-text placeholder-terminal-muted font-mono text-sm focus:outline-none focus:border-accent transition-colors';
  const labelClass = 'block text-[10px] font-mono uppercase tracking-[0.2em] text-terminal-muted mb-2';

  return (
    <div className="min-h-screen bg-terminal-bg grid-bg relative overflow-x-hidden">
      <div className="scan-line" />

      {/* Corner decorations */}
      <div className="fixed top-4 left-4 w-5 h-5 border-t border-l border-terminal-border pointer-events-none z-50" />
      <div className="fixed top-4 right-4 w-5 h-5 border-t border-r border-terminal-border pointer-events-none z-50" />
      <div className="fixed bottom-4 left-4 w-5 h-5 border-b border-l border-terminal-border pointer-events-none z-50" />
      <div className="fixed bottom-4 right-4 w-5 h-5 border-b border-r border-terminal-border pointer-events-none z-50" />

      <div className="max-w-screen-xl mx-auto px-6 py-10">

        {/* Header */}
        <header className="flex items-center justify-between mb-10">
          <div>
            <div className="text-[10px] tracking-[0.3em] text-terminal-muted uppercase mb-1">[ Multichain Explorer ]</div>
            <h1 className="font-display text-2xl font-black tracking-wider text-terminal-text">
              CHAIN<span className="text-terminal-sub">SCANNER</span>
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-4 text-[10px] tracking-[0.15em] text-terminal-muted">
              <span><span className="status-dot active mr-1.5" style={{background:'#22c55e'}} />EVM ONLINE</span>
              <span><span className="status-dot active mr-1.5" style={{background:'#22c55e'}} />SOLANA ONLINE</span>
            </div>
            <button
              onClick={() => setIsApiKeyManagerOpen(true)}
              className="px-3 py-1.5 text-[10px] tracking-[0.15em] uppercase border border-terminal-border text-terminal-muted hover:border-terminal-sub hover:text-terminal-sub transition-colors"
            >
              API Keys
            </button>
          </div>
        </header>

        {/* Scan form */}
        <div className="border border-terminal-border bg-terminal-panel mb-4">
          <div className="px-5 py-3 border-b border-terminal-border">
            <span className="text-[10px] tracking-[0.2em] uppercase text-terminal-muted">[ Scan ]</span>
          </div>

          <div className="p-5 space-y-5">
            {/* EVM wallet */}
            <div>
              <label className={labelClass}>EVM Wallet Address</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-accent font-mono text-sm select-none">›</span>
                <input
                  type="text"
                  value={evmAddress}
                  onChange={e => setEvmAddress(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleScan()}
                  placeholder="0x..."
                  className={inputClass}
                />
              </div>
              <div className="mt-3">
                <ChainSelector selectedChains={selectedChains} onToggle={toggleChain} />
              </div>
            </div>

            <div className="border-t border-terminal-border" />

            {/* Solana wallet */}
            <div>
              <label className={labelClass}>Solana Wallet Address</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-accent font-mono text-sm select-none">›</span>
                <input
                  type="text"
                  value={solanaAddress}
                  onChange={e => setSolanaAddress(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleScan()}
                  placeholder="Solana address..."
                  className={inputClass}
                />
              </div>
            </div>

            {/* Advanced */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(v => !v)}
                className="text-[10px] tracking-[0.2em] uppercase text-terminal-muted hover:text-terminal-sub transition-colors flex items-center gap-2"
              >
                <span className={`transition-transform inline-block ${showAdvanced ? 'rotate-90' : ''}`}>▶</span>
                Advanced
              </button>
              {showAdvanced && (
                <div className="mt-3">
                  <label className={labelClass}>
                    Filter by token <span className="normal-case tracking-normal text-terminal-muted opacity-60">(optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-accent font-mono text-sm select-none">›</span>
                    <input
                      type="text"
                      value={tokenAddress}
                      onChange={e => setTokenAddress(e.target.value)}
                      placeholder="Token contract address or Solana mint"
                      className={inputClass}
                    />
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="px-4 py-3 border border-red-900/50 bg-red-950/20 text-red-400 text-xs tracking-wide">
                ⚠ {error}
              </div>
            )}

            <button
              onClick={handleScan}
              disabled={isScanning}
              className="w-full py-3.5 bg-accent text-[#0c0c0c] text-[11px] tracking-[0.3em] uppercase font-mono font-bold hover:bg-accent/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              {isScanning ? '[ SCANNING... ]' : '[ SCAN TRANSACTIONS ]'}
            </button>
          </div>
        </div>

        {/* Scan status */}
        {(isScanning || scanStatuses.size > 0) && (
          <div className="border border-terminal-border bg-terminal-panel mb-4">
            <div className="px-5 py-3 border-b border-terminal-border">
              <span className="text-[10px] tracking-[0.2em] uppercase text-terminal-muted">
                {isScanning ? '[ Scanning ]' : '[ Results ]'}
              </span>
            </div>
            <div className="p-5 space-y-2">
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
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className="text-[10px] tracking-[0.15em] uppercase text-terminal-muted">Activity on:</span>
                {chainsWithHits.map(name => (
                  <span key={name} className="px-2 py-0.5 border border-terminal-border text-[10px] tracking-[0.1em] uppercase text-terminal-sub">
                    {name}
                  </span>
                ))}
              </div>
            )}

            {chainsWithErrors.length > 0 && (
              <div className="mb-4 px-4 py-3 border border-yellow-900/50 bg-yellow-950/10">
                <p className="text-[10px] tracking-[0.2em] uppercase text-yellow-600 mb-1">[ Errors ]</p>
                {chainsWithErrors.map(item => (
                  <p key={item.chain} className="text-xs text-yellow-700">
                    <span className="font-medium">{item.chain}:</span> {item.error}
                  </p>
                ))}
              </div>
            )}

            <div className="mb-4">
              <Summary transactions={transactions} />
            </div>

            <div className="border border-terminal-border bg-terminal-panel">
              <div className="px-5 py-3 border-b border-terminal-border flex items-center justify-between">
                <span className="text-[10px] tracking-[0.2em] uppercase text-terminal-muted">[ Transactions ]</span>
                <span className="text-[10px] text-terminal-muted">{transactions.length} total</span>
              </div>
              <div className="p-5">
                <TransactionTable transactions={transactions} onExport={() => exportToCSV(transactions)} />
              </div>
            </div>
          </>
        )}

        {!isScanning && transactions.length === 0 && scanStatuses.size === 0 && (
          <div className="text-center py-20 text-terminal-muted">
            <p className="text-[10px] tracking-[0.3em] uppercase">Enter a wallet address above to begin</p>
          </div>
        )}
      </div>

      <ApiKeyManager isOpen={isApiKeyManagerOpen} onClose={() => setIsApiKeyManagerOpen(false)} />
    </div>
  );
}

export default App;
