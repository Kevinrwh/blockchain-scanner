import { useState } from 'react';
import type { ChainScanStatus } from '../types';
import { getChainById } from '../config/chains';

interface ChainStatusProps {
  status: ChainScanStatus;
}

export function ChainStatus({ status }: ChainStatusProps) {
  const [showError, setShowError] = useState(false);
  const chain = getChainById(status.chainId);
  if (!chain) return null;

  const isScanning = status.status === 'scanning';
  const isSuccess  = status.status === 'success';
  const isError    = status.status === 'error';

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-2.5 border border-terminal-border bg-[#111]">
        <div className="flex items-center gap-2.5">
          <span className="text-base">{chain.logo}</span>
          <span className="text-xs tracking-[0.1em] uppercase text-terminal-text">{chain.name}</span>
        </div>

        <div className="flex items-center gap-3">
          {isScanning && (
            <div className="w-3 h-3 border border-accent border-t-transparent rounded-full animate-spin" />
          )}
          <span className={`text-[10px] tracking-[0.1em] uppercase font-mono ${
            isScanning ? 'text-terminal-sub' :
            isSuccess  ? 'text-accent'  :
            isError    ? 'text-red-600'      :
                         'text-terminal-muted'
          }`}>
            {isScanning ? 'Scanning...' :
             isSuccess  ? `${status.transactionCount} txns` :
             isError    ? '0 txns' : '—'}
          </span>

          {isError && status.error && (
            <button
              onClick={() => setShowError(v => !v)}
              className="text-[10px] tracking-[0.15em] uppercase font-mono px-2 py-0.5 border border-yellow-800 text-yellow-600 hover:bg-yellow-900/20 transition-colors"
            >
              {showError ? 'Hide' : '⚠ Error'}
            </button>
          )}
        </div>
      </div>

      {isError && showError && status.error && (
        <div className="border border-t-0 border-yellow-900/60 bg-[#0f0c00] px-4 py-3">
          <p className="text-[10px] tracking-[0.15em] uppercase text-yellow-600 mb-1">Error</p>
          <p className="text-xs font-mono text-yellow-500 leading-relaxed">{status.error}</p>
        </div>
      )}
    </div>
  );
}
