import { CHAINS } from '../config/chains';

interface ChainSelectorProps {
  selectedChains: string[];
  onToggle: (chainId: string) => void;
}

export function ChainSelector({ selectedChains, onToggle }: ChainSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Select Chains to Scan
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {CHAINS.map((chain) => (
          <label
            key={chain.id}
            className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <input
              type="checkbox"
              checked={selectedChains.includes(chain.id)}
              onChange={() => onToggle(chain.id)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-lg">{chain.logo}</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {chain.name}
            </span>
            {chain.freeTierAvailable === false && (
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200">
                Paid
              </span>
            )}
          </label>
        ))}
      </div>
    </div>
  );
}
