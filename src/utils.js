import { CONFIG } from './config.js';

export const debug = {
  log: (...args) => CONFIG.DEBUG && console.log('[DEBUG]', ...args),
  error: (...args) => CONFIG.DEBUG && console.error('[DEBUG]', ...args)
};

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
} 
