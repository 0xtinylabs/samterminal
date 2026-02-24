/**
 * Utility exports for @samterminal/cli
 */

export {
  logger,
  createLogger,
  setLogLevel,
  getLogLevel,
  debug,
  info,
  success,
  warn,
  error,
  type LogLevel,
} from './logger.js';

export {
  findConfigFile,
  loadConfig,
  saveConfig,
  createDefaultConfig,
  detectPackageManager,
  getCLIContext,
  validateConfig,
  getConfigValue,
} from './config.js';

export {
  getTemplateFiles,
  scaffoldProject,
  getAvailableTemplates,
  getTemplateDescription,
  getTemplatePlugins,
  getProfilePlugins,
  getAvailableProfiles,
  generateEnvContent,
  PROFILE_DEFINITIONS,
  CHAIN_DEFINITIONS,
  type ProfileType,
  type ProfileDefinition,
  type ChainDefinition,
} from './template.js';

export {
  validateAlchemyKey,
  validateMoralisKey,
  validateTelegramToken,
  validateOpenAIKey,
  validateAnthropicKey,
  validateZeroExKey,
  validateAllKeys,
  getRequiredKeysForPlugins,
  isPlaceholderValue,
  API_KEY_DEFINITIONS,
  type ValidationResult,
  type ApiKeyDefinition,
} from './validator.js';

export {
  isValidPackageName,
  isValidProjectName,
  isValidEnvValue,
  isValidPort,
} from './validation.js';
