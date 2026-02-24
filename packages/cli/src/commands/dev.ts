/**
 * samterminal dev command
 */

import type { RunOptions, CommandResult } from '../types.js';
import { runCommand } from './run.js';

/**
 * Execute dev command (run with watch mode)
 */
export async function devCommand(options: RunOptions = {}): Promise<CommandResult> {
  return runCommand({
    ...options,
    watch: true,
    env: options.env || 'development',
  });
}
