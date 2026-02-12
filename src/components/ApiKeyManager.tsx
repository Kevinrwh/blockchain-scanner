import { useState } from 'react';
import { getApiKey, saveApiKey } from '../utils/storage';

interface ApiKeyManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ApiKeyManager({ isOpen, onClose }: ApiKeyManagerProps) {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>(() => ({
    etherscan: getApiKey('etherscan') || '',
    solana: getApiKey('solana') || ''
  }));
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  
  const handleSave = (keyId: string, value: string) => {
    saveApiKey(keyId, value);
    setApiKeys(prev => ({ ...prev, [keyId]: value }));
  };
  
  const handleTestEtherscanKey = async () => {
    if (!apiKeys.etherscan) {
      setTestResult('Please enter an Etherscan API key first.');
      return;
    }
    
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const testAddress = '0x0000000000000000000000000000000000000000';
      const url = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=balance&address=${testAddress}&tag=latest&apikey=${apiKeys.etherscan}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === '1') {
        setTestResult('Etherscan API key looks valid.');
      } else {
        const message = data.message === 'NOTOK' && typeof data.result === 'string'
          ? data.result
          : data.message || 'Invalid response from Etherscan.';
        setTestResult(`Etherscan key test failed: ${message}`);
      }
    } catch (error) {
      setTestResult('Etherscan key test failed: network error.');
    } finally {
      setIsTesting(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            API Key Management
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          EVM chains share a single Etherscan v2 API key. Solana uses a separate key. Leave empty to use free tier.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Etherscan (All EVM chains)
            </label>
            <input
              type="text"
              value={apiKeys.etherscan || ''}
              onChange={(e) => handleSave('etherscan', e.target.value)}
              placeholder="Enter Etherscan API key (optional)"
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Free tier still requires a free API key. Some chains (Base, BSC, Optimism, Avalanche) are not available on the free tier.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={handleTestEtherscanKey}
                disabled={isTesting}
                className="px-3 py-1.5 text-xs border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {isTesting ? 'Testing...' : 'Test Key'}
              </button>
              {testResult && (
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  {testResult}
                </span>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Solana (Solscan)
            </label>
            <input
              type="text"
              value={apiKeys.solana || ''}
              onChange={(e) => handleSave('solana', e.target.value)}
              placeholder="Enter Solscan API key (optional)"
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
