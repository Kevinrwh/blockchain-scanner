import { useState } from 'react';
import { getApiKey, saveApiKey } from '../utils/storage';

interface ApiKeyManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ApiKeyManager({ isOpen, onClose }: ApiKeyManagerProps) {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>(() => ({
    etherscan: getApiKey('etherscan') || '',
    solana:    getApiKey('solana')    || ''
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

  const inputClass = 'w-full px-3 py-2.5 text-sm bg-terminal-dim border border-terminal-border text-terminal-text placeholder-terminal-muted font-mono focus:outline-none focus:border-terminal-sub transition-colors';
  const labelClass = 'block text-[10px] tracking-[0.2em] uppercase text-terminal-muted mb-1.5';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-terminal-panel border border-terminal-border w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-terminal-border">
          <span className="text-[10px] tracking-[0.2em] uppercase text-terminal-muted">[ API Keys ]</span>
          <button onClick={onClose} className="text-terminal-muted hover:text-terminal-sub transition-colors text-sm">✕</button>
        </div>

        <div className="px-5 py-5 space-y-5">
          <div>
            <label className={labelClass}>Etherscan — all EVM chains</label>
            <input
              type="text"
              value={apiKeys.etherscan}
              onChange={e => handleSave('etherscan', e.target.value)}
              placeholder="Etherscan API key"
              className={inputClass}
            />
            <p className="mt-1.5 text-[10px] text-terminal-muted tracking-wide">
              Required for Ethereum, Polygon, Arbitrum. Paid plan for Base, BSC, Avalanche.
            </p>
            <div className="mt-2.5 flex items-center gap-3">
              <button
                onClick={handleTestEtherscanKey}
                disabled={isTesting}
                className="px-3 py-1.5 text-[10px] tracking-[0.15em] uppercase border border-terminal-border text-terminal-muted hover:border-terminal-sub hover:text-terminal-sub transition-colors disabled:opacity-40"
              >
                {isTesting ? 'Testing...' : 'Test Key'}
              </button>
              {testResult && (
                <span className={`text-[10px] tracking-wide ${testResult.ok ? 'text-emerald-600' : 'text-red-700'}`}>
                  {testResult.ok ? '✓' : '✗'} {testResult.msg}
                </span>
              )}
            </div>
          </div>

          <div className="border-t border-terminal-border" />

          <div>
            <label className={labelClass}>Helius — Solana</label>
            <input
              type="text"
              value={apiKeys.solana}
              onChange={e => handleSave('solana', e.target.value)}
              placeholder="Helius API key"
              className={inputClass}
            />
            <p className="mt-1.5 text-[10px] text-terminal-muted tracking-wide">
              Free tier available at helius.dev
            </p>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-terminal-border flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-[10px] tracking-[0.2em] uppercase border border-terminal-border text-terminal-muted hover:border-terminal-sub hover:text-terminal-sub transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
