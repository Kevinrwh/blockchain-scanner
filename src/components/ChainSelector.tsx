import { CHAINS } from '../config/chains';

const EVM_CHAINS = CHAINS.filter(c => c.id !== 'solana');

interface ChainSelectorProps {
  selectedChains: string[];
  onToggle: (chainId: string) => void;
}

export function ChainSelector({ selectedChains, onToggle }: ChainSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {EVM_CHAINS.map((chain) => {
        const selected = selectedChains.includes(chain.id);
        return (
          <button
            key={chain.id}
            type="button"
            onClick={() => onToggle(chain.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-[0.12em] uppercase border transition-all font-mono ${
              selected
                ? 'border-accent text-accent bg-accent/10'
                : 'border-terminal-border text-terminal-muted hover:border-terminal-muted hover:text-terminal-sub'
            }`}
          >
            <span>{chain.logo}</span>
            <span>{chain.name}</span>
            {chain.freeTierAvailable === false && (
              <span className="text-[9px] px-1 border border-yellow-800/50 text-yellow-700">
                PAID
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
