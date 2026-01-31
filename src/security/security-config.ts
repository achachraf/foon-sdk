import { SecurityOptions } from '../types';

/**
 * Default security settings
 */
export const DEFAULT_SECURITY_OPTIONS: Required<SecurityOptions> = {
  maxInputSize: 1024 * 1024, // 1MB
  maxDepth: 10,
  maxKeys: 1000,
  maxStringLength: 10000,
  redactKeys: ['password', 'token', 'authorization', 'secret', 'apiKey', 'apiSecret', 'auth'],
  sanitizePrompt: true,
  includeValues: false,
};

/**
 * Merge user security options with defaults
 */
export function mergeSecurityOptions(options?: SecurityOptions): Required<SecurityOptions> {
  return {
    ...DEFAULT_SECURITY_OPTIONS,
    ...options,
  };
}
