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

function App() {
  const [walletAddress, setWalletAddress] = useState('');
  const [tokenAddress, setTokenAddress] = useState('');
  const [selectedChains, setSelectedChains] = useState<string[]>(
    CHAINS.filter(c => c.freeTierAvailable === true).map(c => c.id)
  );
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [scanStatuses, setScanStatuses] = useState<Map<string, ChainScanStatus>>(new Map());
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApiKeyManagerOpen, setIsApiKeyManagerOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true' || 
           (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  
  const chainsWithHits = Array.from(scanStatuses.values())
    .filter(status => status.transactionCount > 0)
    .map(status => getChainById(status.chainId)?.name || status.chainId);
  
  const chainsWithErrors = Array.from(scanStatuses.values())
    .filter(status => status.status === 'error' && status.error)
    .map(status => ({
      chain: getChainById(status.chainId)?.name || status.chainId,
      error: status.error as string
    }));
  
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);
  
  const toggleChain = (chainId: string) => {
    setSelectedChains(prev =>
      prev.includes(chainId)
        ? prev.filter(id => id !== chainId)
        : [...prev, chainId]
    );
  };
  
  const handleScan = async () => {
    if (!walletAddress) {
      setError('Please enter a wallet address');
      return;
    }
    
    // Validate address based on selected chains
    const chainsToScan = CHAINS.filter(c => selectedChains.includes(c.id));
    const hasSolana = chainsToScan.some(c => c.id === 'solana');
    const hasEVM = chainsToScan.some(c => c.id !== 'solana');
    const isEvmAddress = isValidEthereumAddress(walletAddress);
    const isSolAddress = isValidSolanaAddress(walletAddress);
    
    if (hasEVM && hasSolana) {
      if (!isEvmAddress && !isSolAddress) {
        setError('Please enter a valid Ethereum (0x...) or Solana address');
        return;
      }
    } else if (hasEVM && !isEvmAddress) {
      setError('Please enter a valid Ethereum address (0x...)');
      return;
    } else if (hasSolana && !isSolAddress) {
      setError('Please enter a valid Solana address');
      return;
    }
    
    if (selectedChains.length === 0) {
      setError('Please select at least one chain');
      return;
    }
    
    setError(null);
    setIsScanning(true);
    setTransactions([]);
    
    const statuses = new Map<string, ChainScanStatus>();
    const compatibleChains = chainsToScan.filter(chain =>
      chain.id === 'solana' ? isSolAddress : isEvmAddress
    );
    const incompatibleChains = chainsToScan.filter(chain =>
      chain.id === 'solana' ? !isSolAddress : !isEvmAddress
    );

    compatibleChains.forEach(chain => {
      statuses.set(chain.id, { chainId: chain.id, status: 'scanning', transactionCount: 0 });
    });

    incompatibleChains.forEach(chain => {
      statuses.set(chain.id, {
        chainId: chain.id,
        status: 'error',
        error: chain.id === 'solana' ? 'Solana requires a Solana address' : 'EVM chain requires a 0x address',
        transactionCount: 0
      });
    });

    setScanStatuses(statuses);
    
    try {
      const results = await scanMultipleChains(
        compatibleChains,
        walletAddress,
        tokenAddress || undefined
      );
      
      const allTransactions: Transaction[] = [];
      const updatedStatuses = new Map(statuses);
      
      results.forEach((result, chainId) => {
        allTransactions.push(...result.transactions);
        updatedStatuses.set(chainId, {
          chainId,
          status: result.error ? 'error' : 'success',
          error: result.error || undefined,
          transactionCount: result.transactions.length
        });
      });
      
      setTransactions(allTransactions);
      setScanStatuses(updatedStatuses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while scanning');
    } finally {
      setIsScanning(false);
    }
  };
  
  const handleExport = () => {
    exportToCSV(transactions);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Multi-Chain EVM Transaction Scanner
            </h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsApiKeyManagerOpen(true)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                API Keys
              </button>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Scan token transactions across multiple EVM chains and Solana
          </p>
        </header>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Wallet Address *
              </label>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 font-mono"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Token Contract Address (Optional)
              </label>
              <input
                type="text"
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                placeholder="0x... or Solana mint address (leave empty for all tokens)"
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 font-mono"
              />
            </div>
            
            <ChainSelector
              selectedChains={selectedChains}
              onToggle={toggleChain}
            />
            
            <div className="p-3 bg-amber-50 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded-lg text-sm">
              An Etherscan API key is required. Add yours via the API Keys button above.
            </div>
            
            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
                {error}
              </div>
            )}
            
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isScanning ? 'Scanning...' : 'Scan Transactions'}
            </button>
          </div>
        </div>
        
        {(isScanning || scanStatuses.size > 0) && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              {isScanning ? 'Scan Progress' : 'Scan Results'}
            </h2>
            <div className="space-y-2">
              {Array.from(scanStatuses.values()).map(status => (
                <ChainStatus key={status.chainId} status={status} />
              ))}
            </div>
          </div>
        )}
        
        {transactions.length > 0 && (
          <>
            <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Chains With Hits
              </h2>
              {chainsWithHits.length > 0 ? (
                <p className="text-gray-700 dark:text-gray-300">
                  {chainsWithHits.join(', ')}
                </p>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  No chains returned transactions in this scan.
                </p>
              )}
            </div>
            
            {chainsWithErrors.length > 0 && (
              <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Chains With Errors
                </h2>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  {chainsWithErrors.map(item => (
                    <li key={item.chain} className="flex items-start justify-between gap-3">
                      <span className="font-medium">{item.chain}</span>
                      <span className="text-gray-500 dark:text-gray-400">{item.error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mb-6">
              <Summary transactions={transactions} />
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Transactions ({transactions.length})
              </h2>
              <TransactionTable transactions={transactions} onExport={handleExport} />
            </div>
          </>
        )}
        
        {!isScanning && transactions.length === 0 && !error && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center text-gray-500 dark:text-gray-400">
            <p>Enter a wallet address and click "Scan Transactions" to begin</p>
          </div>
        )}
      </div>
      
      <ApiKeyManager
        isOpen={isApiKeyManagerOpen}
        onClose={() => setIsApiKeyManagerOpen(false)}
      />
    </div>
  );
}

export default App;
