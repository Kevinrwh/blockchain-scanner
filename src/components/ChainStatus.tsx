import type { ChainScanStatus } from '../types';
import { getChainById } from '../config/chains';

interface ChainStatusProps {
  status: ChainScanStatus;
}

export function ChainStatus({ status }: ChainStatusProps) {
  const chain = getChainById(status.chainId);
  if (!chain) return null;

  const isScanning = status.status === 'scanning';
  const isSuccess = status.status === 'success';
  const isError = status.status === 'error';

  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
      <div className="flex items-center gap-2.5">
        <span className="text-base">{chain.logo}</span>
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{chain.name}</span>
      </div>

      <div className="flex items-center gap-2">
        {isScanning && (
          <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        )}
        <span className={`text-xs font-medium ${
          isScanning ? 'text-indigo-500 dark:text-indigo-400' :
          isSuccess  ? 'text-emerald-600 dark:text-emerald-400' :
          isError    ? 'text-rose-500 dark:text-rose-400' :
                       'text-zinc-400'
        }`}>
          {isScanning ? 'Scanning...' :
           isSuccess  ? `${status.transactionCount} txns` :
           isError    ? '0 txns' : '—'}
        </span>

        {isError && status.error && (
          <div className="group relative">
            <span className="text-xs text-amber-500 cursor-help select-none">⚠</span>
            <div className="absolute right-0 top-full mt-1 w-56 p-2.5 bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none leading-relaxed">
              {status.error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
