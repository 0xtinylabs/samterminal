/**
 * CLI types for @samterminal/cli
 */

/**
 * Project configuration
 */
export interface ProjectConfig {
  /** Project name */
  name: string;

  /** Project version */
  version: string;

  /** Project description */
  description?: string;

  /** SamTerminal core version */
  samterminalVersion: string;

  /** Enabled plugins */
  plugins: PluginConfig[];

  /** Runtime settings */
  runtime?: RuntimeConfig;

  /** Environment variables */
  env?: Record<string, string>;
}

/**
 * Plugin configuration
 */
export interface PluginConfig {
  /** Plugin name/package */
  name: string;

  /** Plugin version */
  version?: string;

  /** Plugin options */
  options?: Record<string, unknown>;

  /** Is plugin enabled */
  enabled?: boolean;
}

/**
 * Runtime configuration
 */
export interface RuntimeConfig {
  /** Log level */
  logLevel?: 'debug' | 'info' | 'warn' | 'error';

  /** Enable hot reload */
  hotReload?: boolean;

  /** Port for dev server */
  port?: number;

  /** Max concurrent tasks */
  maxConcurrency?: number;
}

/**
 * Template type
 */
export type TemplateType = 'basic' | 'telegram-bot' | 'web3-agent' | 'custom';

/**
 * Init options
 */
export interface InitOptions {
  /** Project name */
  name: string;

  /** Template to use */
  template: TemplateType;

  /** Directory to create project in */
  directory?: string;

  /** Plugins to include */
  plugins?: string[];

  /** Skip npm install */
  skipInstall?: boolean;

  /** Use TypeScript */
  typescript?: boolean;

  /** Package manager */
  packageManager?: 'npm' | 'pnpm' | 'yarn';
}

/**
 * Run options
 */
export interface RunOptions {
  /** Config file path */
  config?: string;

  /** Environment */
  env?: string;

  /** Enable watch mode */
  watch?: boolean;

  /** Port override */
  port?: number;

  /** Verbose logging */
  verbose?: boolean;
}

/**
 * Plugin command options
 */
export interface PluginOptions {
  /** Save to config */
  save?: boolean;

  /** Plugin version */
  version?: string;

  /** Force operation */
  force?: boolean;
}

/**
 * CLI context
 */
export interface CLIContext {
  /** Current working directory */
  cwd: string;

  /** Project config (if in project) */
  config?: ProjectConfig;

  /** Config file path */
  configPath?: string;

  /** Is in project directory */
  isProject: boolean;

  /** Package manager */
  packageManager: 'npm' | 'pnpm' | 'yarn';
}

/**
 * Command result
 */
export interface CommandResult {
  /** Success status */
  success: boolean;

  /** Result message */
  message?: string;

  /** Error if failed */
  error?: Error;

  /** Additional data */
  data?: Record<string, unknown>;
}
