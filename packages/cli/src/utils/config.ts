/**
 * Configuration utilities
 */

import fs from 'fs-extra';
import path from 'path';
import type { ProjectConfig, CLIContext } from '../types.js';

const CONFIG_FILENAMES = ['samterminal.config.json', 'samterminal.json', '.samterminalrc.json'];

/**
 * Find config file in directory
 */
export async function findConfigFile(dir: string): Promise<string | null> {
  for (const filename of CONFIG_FILENAMES) {
    const filepath = path.join(dir, filename);
    if (await fs.pathExists(filepath)) {
      return filepath;
    }
  }
  return null;
}

/**
 * Load project config
 */
export async function loadConfig(configPath: string): Promise<ProjectConfig> {
  const content = await fs.readFile(configPath, 'utf-8');
  return JSON.parse(content) as ProjectConfig;
}

/**
 * Save project config
 */
export async function saveConfig(configPath: string, config: ProjectConfig): Promise<void> {
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
}

/**
 * Create default config
 */
export function createDefaultConfig(name: string): ProjectConfig {
  return {
    name,
    version: '1.0.0',
    samterminalVersion: '^1.0.0',
    plugins: [],
    runtime: {
      logLevel: 'info',
      hotReload: true,
    },
  };
}

/**
 * Detect package manager
 */
export async function detectPackageManager(
  dir: string,
): Promise<'npm' | 'pnpm' | 'yarn'> {
  if (await fs.pathExists(path.join(dir, 'pnpm-lock.yaml'))) {
    return 'pnpm';
  }
  if (await fs.pathExists(path.join(dir, 'yarn.lock'))) {
    return 'yarn';
  }
  return 'npm';
}

/**
 * Get CLI context
 */
export async function getCLIContext(cwd?: string): Promise<CLIContext> {
  const dir = cwd || process.cwd();

  const configPath = await findConfigFile(dir);
  const config = configPath ? await loadConfig(configPath) : undefined;
  const packageManager = await detectPackageManager(dir);

  return {
    cwd: dir,
    config,
    configPath: configPath || undefined,
    isProject: !!configPath,
    packageManager,
  };
}

/**
 * Validate project config
 */
export function validateConfig(config: unknown): config is ProjectConfig {
  if (!config || typeof config !== 'object') {
    return false;
  }

  const c = config as Record<string, unknown>;

  if (typeof c.name !== 'string' || !c.name) {
    return false;
  }

  if (typeof c.version !== 'string') {
    return false;
  }

  if (typeof c.samterminalVersion !== 'string') {
    return false;
  }

  if (!Array.isArray(c.plugins)) {
    return false;
  }

  return true;
}

/**
 * Get config value with fallback
 */
export function getConfigValue<T>(
  config: ProjectConfig | undefined,
  path: string,
  fallback: T,
): T {
  if (!config) return fallback;

  const parts = path.split('.');
  let current: unknown = config;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return fallback;
    }
  }

  return current as T;
}
