/**
 * samterminal run command
 */

import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import ora from 'ora';
import { spawn, ChildProcess } from 'child_process';
import type { RunOptions, CommandResult, ProjectConfig } from '../types.js';
import {
  logger,
  getCLIContext,
  loadConfig,
  findConfigFile,
  isValidPort,
} from '../utils/index.js';

let childProcess: ChildProcess | null = null;

/**
 * Handle process termination
 */
function setupCleanup(): void {
  const cleanup = (signal: string) => {
    if (childProcess) {
      // Send SIGTERM for graceful shutdown
      childProcess.kill('SIGTERM');

      // Force kill after 5 seconds if still running
      const forceKillTimeout = setTimeout(() => {
        if (childProcess) {
          childProcess.kill('SIGKILL');
          childProcess = null;
        }
      }, 5000);

      childProcess.on('exit', () => {
        clearTimeout(forceKillTimeout);
        childProcess = null;
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  };

  process.on('SIGINT', () => cleanup('SIGINT'));
  process.on('SIGTERM', () => cleanup('SIGTERM'));
}

/**
 * Find entry point
 */
async function findEntryPoint(cwd: string, config?: ProjectConfig): Promise<string | null> {
  // Check common entry points
  const candidates = [
    'src/index.ts',
    'src/index.js',
    'src/main.ts',
    'src/main.js',
    'index.ts',
    'index.js',
  ];

  for (const candidate of candidates) {
    const filepath = path.join(cwd, candidate);
    if (await fs.pathExists(filepath)) {
      return filepath;
    }
  }

  return null;
}

/**
 * Start the agent process
 */
async function startAgent(
  entryPoint: string,
  options: RunOptions,
): Promise<ChildProcess> {
  const isTypeScript = entryPoint.endsWith('.ts');

  // Allowed environment variable names
  const ENV_WHITELIST = ['development', 'production', 'staging', 'test'];

  // Prepare environment
  const env: Record<string, string | undefined> = {
    ...process.env,
    NODE_ENV: ENV_WHITELIST.includes(options.env || '') ? options.env : 'development',
  };

  if (options.port) {
    if (!isValidPort(Number(options.port))) {
      throw new Error('Invalid port number. Must be between 1 and 65535.');
    }
    env.PORT = String(options.port);
  }

  if (options.verbose) {
    env.LOG_LEVEL = 'debug';
  }

  // Determine how to run the file
  let command: string;
  let args: string[];

  if (isTypeScript) {
    // Use tsx for TypeScript
    command = 'npx';
    args = ['tsx'];

    if (options.watch) {
      args.push('watch');
    }

    args.push(entryPoint);
  } else {
    // Use node for JavaScript
    command = 'node';
    args = [];

    if (options.watch) {
      args.push('--watch');
    }

    args.push(entryPoint);
  }

  const child = spawn(command, args, {
    cwd: process.cwd(),
    env,
    stdio: 'inherit',
  });

  return child;
}

/**
 * Execute run command
 */
export async function runCommand(options: RunOptions = {}): Promise<CommandResult> {
  try {
    const context = await getCLIContext();

    // Check if in project
    if (!context.isProject) {
      logger.error('Not in a SamTerminal project directory');
      logger.info('Run "sam init" to create a new project');
      return {
        success: false,
        error: new Error('Not in a SamTerminal project'),
      };
    }

    console.log();
    console.log(chalk.bold.cyan(`Starting SamTerminal agent: ${context.config?.name || 'unnamed'}`));
    console.log();

    // Find entry point
    const entryPoint = await findEntryPoint(context.cwd, context.config);

    if (!entryPoint) {
      logger.error('Could not find entry point (src/index.ts or src/index.js)');
      return {
        success: false,
        error: new Error('Entry point not found'),
      };
    }

    logger.info(`Entry point: ${chalk.gray(entryPoint)}`);

    if (options.watch) {
      logger.info('Watch mode enabled');
    }

    // Setup cleanup handlers
    setupCleanup();

    // Start the agent
    const spinner = ora('Starting agent...').start();

    try {
      childProcess = await startAgent(entryPoint, options);
      spinner.stop();

      // Wait for process to exit
      return new Promise((resolve) => {
        childProcess!.on('exit', (code, signal) => {
          const exitCode = code ?? (signal === 'SIGTERM' ? 0 : 1);
          if (exitCode === 0) {
            resolve({ success: true, message: 'Agent stopped' });
          } else {
            resolve({
              success: false,
              error: new Error(`Agent exited with code ${exitCode}`),
            });
          }
          // Propagate exit code
          process.exitCode = exitCode;
        });

        childProcess!.on('error', (err) => {
          logger.error(`Failed to start agent: ${err.message}`);
          resolve({ success: false, error: err });
        });
      });
    } catch (err) {
      spinner.fail('Failed to start agent');
      throw err;
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error(error.message);
    return { success: false, error };
  }
}

/**
 * Stop the running agent
 */
export function stopAgent(): void {
  if (childProcess) {
    childProcess.kill();
    childProcess = null;
    logger.info('Agent stopped');
  }
}
