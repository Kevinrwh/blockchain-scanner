import { useState } from 'react';
import { CHAINS } from '../config/chains';
import { getApiKey, saveApiKey } from '../utils/storage';

interface ApiKeyManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ApiKeyManager({ isOpen, onClose }: ApiKeyManagerProps) {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>(() => {
    const keys: Record<string, string> = {};
    CHAINS.forEach(chain => {
      keys[chain.id] = getApiKey(chain.id) || '';
    });
    return keys;
  });
  
  const handleSave = (chainId: string, value: string) => {
    saveApiKey(chainId, value);
    setApiKeys(prev => ({ ...prev, [chainId]: value }));
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
          Add your API keys to increase rate limits. Leave empty to use free tier.
        </p>
        
        <div className="space-y-4">
          {CHAINS.map(chain => (
            <div key={chain.id}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {chain.logo} {chain.name}
              </label>
              <input
                type="text"
                value={apiKeys[chain.id] || ''}
                onChange={(e) => handleSave(chain.id, e.target.value)}
                placeholder="Enter API key (optional)"
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          ))}
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
