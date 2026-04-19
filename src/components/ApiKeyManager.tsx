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
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleSave = (keyId: string, value: string) => {
    saveApiKey(keyId, value);
    setApiKeys(prev => ({ ...prev, [keyId]: value }));
  };

  const handleTestEtherscanKey = async () => {
    if (!apiKeys.etherscan) { setTestResult({ ok: false, msg: 'Enter an Etherscan API key first.' }); return; }
    setIsTesting(true);
    setTestResult(null);
    try {
      const url = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=balance&address=0x0000000000000000000000000000000000000000&tag=latest&apikey=${apiKeys.etherscan}`;
      const data = await fetch(url).then(r => r.json());
      if (data.status === '1') {
        setTestResult({ ok: true, msg: 'Key is valid.' });
      } else {
        const msg = data.message === 'NOTOK' && typeof data.result === 'string' ? data.result : data.message || 'Invalid response.';
        setTestResult({ ok: false, msg });
      }
    } catch {
      setTestResult({ ok: false, msg: 'Network error.' });
    } finally {
      setIsTesting(false);
    }
  };

  if (!isOpen) return null;

  const inputClass = 'w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all';
  const labelClass = 'block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">API Keys</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors text-lg leading-none">✕</button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <label className={labelClass}>Etherscan — all EVM chains</label>
            <input
              type="text"
              value={apiKeys.etherscan}
              onChange={(e) => handleSave('etherscan', e.target.value)}
              placeholder="Etherscan API key"
              className={inputClass}
            />
            <p className="mt-1.5 text-xs text-zinc-400 dark:text-zinc-500">
              Required for Ethereum, Polygon, Arbitrum. Paid plan needed for Base, BSC, Avalanche.
            </p>
            <div className="mt-2.5 flex items-center gap-3">
              <button
                onClick={handleTestEtherscanKey}
                disabled={isTesting}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                {isTesting ? 'Testing...' : 'Test Key'}
              </button>
              {testResult && (
                <span className={`text-xs font-medium ${testResult.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                  {testResult.ok ? '✓' : '✗'} {testResult.msg}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className={labelClass}>Helius — Solana</label>
            <input
              type="text"
              value={apiKeys.solana}
              onChange={(e) => handleSave('solana', e.target.value)}
              placeholder="Helius API key"
              className={inputClass}
            />
            <p className="mt-1.5 text-xs text-zinc-400 dark:text-zinc-500">
              Free tier available at helius.dev
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
