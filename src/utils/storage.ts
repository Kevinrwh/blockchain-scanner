import type { ApiKeyConfig } from '../types';

const API_KEYS_STORAGE_KEY = 'evm_scanner_api_keys';

export function getApiKeys(): ApiKeyConfig {
  try {
    const stored = localStorage.getItem(API_KEYS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function saveApiKey(chainId: string, apiKey: string): void {
  const keys = getApiKeys();
  keys[chainId] = apiKey;
  localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(keys));
}

export function getApiKey(chainId: string): string | undefined {
  return getApiKeys()[chainId];
}
