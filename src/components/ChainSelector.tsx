import { CHAINS } from '../config/chains';

const EVM_CHAINS = CHAINS.filter(c => c.id !== 'solana');

interface ChainSelectorProps {
  selectedChains: string[];
  onToggle: (chainId: string) => void;
}

export function ChainSelector({ selectedChains, onToggle }: ChainSelectorProps) {
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {EVM_CHAINS.map((chain) => {
          const selected = selectedChains.includes(chain.id);
          return (
            <button
              key={chain.id}
              type="button"
              onClick={() => onToggle(chain.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                selected
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                  : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600'
              }`}
            >
              <span>{chain.logo}</span>
              <span>{chain.name}</span>
              {chain.freeTierAvailable === false && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                  Paid
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
