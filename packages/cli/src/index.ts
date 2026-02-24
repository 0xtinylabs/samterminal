/**
 * @samterminal/cli
 *
 * CLI for SamTerminal - Create and manage SamTerminal agents
 */

// Type exports
export type {
  ProjectConfig,
  PluginConfig,
  RuntimeConfig,
  TemplateType,
  InitOptions,
  RunOptions,
  PluginOptions,
  CLIContext,
  CommandResult,
} from './types.js';

// Command exports
export {
  initCommand,
  runCommand,
  stopAgent,
  devCommand,
  pluginInstall,
  pluginRemove,
  pluginList,
  pluginEnable,
  pluginDisable,
} from './commands/index.js';

// Utility exports
export {
  logger,
  createLogger,
  setLogLevel,
  getLogLevel,
  findConfigFile,
  loadConfig,
  saveConfig,
  createDefaultConfig,
  detectPackageManager,
  getCLIContext,
  validateConfig,
  getConfigValue,
  getTemplateFiles,
  scaffoldProject,
  getAvailableTemplates,
  getTemplateDescription,
  getTemplatePlugins,
} from './utils/index.js';
