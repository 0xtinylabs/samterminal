/**
 * samterminal plugin commands
 */

import chalk from 'chalk';
import ora from 'ora';
import { spawnSync } from 'child_process';
import type { PluginOptions, CommandResult, PluginConfig } from '../types.js';
import {
  logger,
  getCLIContext,
  saveConfig,
  isValidPackageName,
} from '../utils/index.js';

/**
 * Known SamTerminal plugins
 */
const KNOWN_PLUGINS: Record<string, { description: string; version: string }> = {
  telegram: { description: 'Telegram bot integration', version: '^1.0.0' },
  ai: { description: 'AI/LLM integration (OpenAI, Anthropic)', version: '^1.0.0' },
  tokendata: { description: 'Token data and prices', version: '^1.0.0' },
  walletdata: { description: 'Wallet balances and transactions', version: '^1.0.0' },
  swap: { description: 'Token swap functionality', version: '^1.0.0' },
  onboarding: { description: 'User onboarding flows', version: '^1.0.0' },
};

/**
 * Normalize plugin name
 */
function normalizePluginName(name: string): string {
  // If already a full package name, return as is
  if (name.startsWith('@')) {
    return name;
  }

  // If it's a known plugin shorthand
  if (name in KNOWN_PLUGINS) {
    return `@samterminal/plugin-${name}`;
  }

  // Otherwise, assume it's a full package name
  return name;
}

/**
 * Get short name from full plugin name
 */
function getShortName(fullName: string): string {
  if (fullName.startsWith('@samterminal/plugin-')) {
    return fullName.replace('@samterminal/plugin-', '');
  }
  return fullName;
}

/**
 * Install a plugin
 */
export async function pluginInstall(
  pluginName: string,
  options: PluginOptions = {},
): Promise<CommandResult> {
  try {
    const context = await getCLIContext();

    if (!context.isProject) {
      logger.error('Not in a SamTerminal project directory');
      return {
        success: false,
        error: new Error('Not in a SamTerminal project'),
      };
    }

    const fullName = normalizePluginName(pluginName);

    if (!isValidPackageName(fullName)) {
      logger.error('Invalid package name');
      return {
        success: false,
        error: new Error('Invalid package name'),
      };
    }

    const version = options.version || 'latest';

    console.log();
    logger.info(`Installing plugin: ${chalk.bold(fullName)}`);

    // Install package
    const spinner = ora('Installing package...').start();

    try {
      const pkg = `${fullName}@${version}`;
      const pmCommands: Record<string, { cmd: string; args: string[] }> = {
        npm: { cmd: 'npm', args: ['install', pkg] },
        pnpm: { cmd: 'pnpm', args: ['add', pkg] },
        yarn: { cmd: 'yarn', args: ['add', pkg] },
      };

      const { cmd, args } = pmCommands[context.packageManager];
      const result = spawnSync(cmd, args, { cwd: context.cwd, stdio: 'pipe', shell: false });
      if (result.status !== 0) {
        throw new Error(result.stderr?.toString() || 'Install failed');
      }
      spinner.succeed('Package installed');
    } catch (err) {
      spinner.fail('Failed to install package');
      throw err;
    }

    // Update config if --save
    if (options.save !== false && context.config && context.configPath) {
      const pluginConfig: PluginConfig = {
        name: fullName,
        enabled: true,
      };

      // Check if plugin already in config
      const existingIndex = context.config.plugins.findIndex(
        (p) => p.name === fullName,
      );

      if (existingIndex >= 0) {
        context.config.plugins[existingIndex] = pluginConfig;
      } else {
        context.config.plugins.push(pluginConfig);
      }

      await saveConfig(context.configPath, context.config);
      logger.success('Config updated');
    }

    console.log();
    logger.success(`Plugin ${chalk.bold(getShortName(fullName))} installed`);
    console.log();

    return {
      success: true,
      message: `Plugin ${fullName} installed`,
      data: { plugin: fullName },
    };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error(error.message);
    return { success: false, error };
  }
}

/**
 * Remove a plugin
 */
export async function pluginRemove(
  pluginName: string,
  options: PluginOptions = {},
): Promise<CommandResult> {
  try {
    const context = await getCLIContext();

    if (!context.isProject) {
      logger.error('Not in a SamTerminal project directory');
      return {
        success: false,
        error: new Error('Not in a SamTerminal project'),
      };
    }

    const fullName = normalizePluginName(pluginName);

    if (!isValidPackageName(fullName)) {
      logger.error('Invalid package name');
      return {
        success: false,
        error: new Error('Invalid package name'),
      };
    }

    console.log();
    logger.info(`Removing plugin: ${chalk.bold(fullName)}`);

    // Remove package
    const spinner = ora('Removing package...').start();

    try {
      const pmCommands: Record<string, { cmd: string; args: string[] }> = {
        npm: { cmd: 'npm', args: ['uninstall', fullName] },
        pnpm: { cmd: 'pnpm', args: ['remove', fullName] },
        yarn: { cmd: 'yarn', args: ['remove', fullName] },
      };

      const { cmd, args } = pmCommands[context.packageManager];
      const result = spawnSync(cmd, args, { cwd: context.cwd, stdio: 'pipe', shell: false });
      if (result.status !== 0) {
        throw new Error(result.stderr?.toString() || 'Remove failed');
      }
      spinner.succeed('Package removed');
    } catch (err) {
      spinner.fail('Failed to remove package');
      // Continue to remove from config even if package removal fails
    }

    // Update config
    if (context.config && context.configPath) {
      context.config.plugins = context.config.plugins.filter(
        (p) => p.name !== fullName,
      );

      await saveConfig(context.configPath, context.config);
      logger.success('Config updated');
    }

    console.log();
    logger.success(`Plugin ${chalk.bold(getShortName(fullName))} removed`);
    console.log();

    return {
      success: true,
      message: `Plugin ${fullName} removed`,
      data: { plugin: fullName },
    };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error(error.message);
    return { success: false, error };
  }
}

/**
 * List installed plugins
 */
export async function pluginList(): Promise<CommandResult> {
  try {
    const context = await getCLIContext();

    if (!context.isProject) {
      logger.error('Not in a SamTerminal project directory');
      return {
        success: false,
        error: new Error('Not in a SamTerminal project'),
      };
    }

    console.log();
    console.log(chalk.bold.cyan('Installed Plugins'));
    console.log();

    if (!context.config?.plugins.length) {
      console.log(chalk.gray('  No plugins installed'));
      console.log();
      console.log(`  Run ${chalk.cyan('sam plugin install <name>')} to install a plugin`);
    } else {
      for (const plugin of context.config.plugins) {
        const status = plugin.enabled !== false ? chalk.green('enabled') : chalk.gray('disabled');
        const shortName = getShortName(plugin.name);
        console.log(`  ${chalk.bold(shortName)} ${chalk.gray(`(${plugin.name})`)} - ${status}`);
      }
    }

    console.log();

    // Show available plugins
    console.log(chalk.bold('Available Plugins'));
    console.log();

    for (const [name, info] of Object.entries(KNOWN_PLUGINS)) {
      const installed = context.config?.plugins.some(
        (p) => p.name === `@samterminal/plugin-${name}`,
      );
      const status = installed ? chalk.green(' [installed]') : '';
      console.log(`  ${chalk.bold(name)}${status} - ${info.description}`);
    }

    console.log();

    return {
      success: true,
      data: { plugins: context.config?.plugins || [] },
    };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error(error.message);
    return { success: false, error };
  }
}

/**
 * Enable a plugin
 */
export async function pluginEnable(pluginName: string): Promise<CommandResult> {
  try {
    const context = await getCLIContext();

    if (!context.isProject || !context.config || !context.configPath) {
      logger.error('Not in a SamTerminal project directory');
      return {
        success: false,
        error: new Error('Not in a SamTerminal project'),
      };
    }

    const fullName = normalizePluginName(pluginName);
    const plugin = context.config.plugins.find((p) => p.name === fullName);

    if (!plugin) {
      logger.error(`Plugin ${fullName} not found in config`);
      return {
        success: false,
        error: new Error('Plugin not found'),
      };
    }

    plugin.enabled = true;
    await saveConfig(context.configPath, context.config);

    logger.success(`Plugin ${getShortName(fullName)} enabled`);

    return {
      success: true,
      message: `Plugin ${fullName} enabled`,
    };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error(error.message);
    return { success: false, error };
  }
}

/**
 * Disable a plugin
 */
export async function pluginDisable(pluginName: string): Promise<CommandResult> {
  try {
    const context = await getCLIContext();

    if (!context.isProject || !context.config || !context.configPath) {
      logger.error('Not in a SamTerminal project directory');
      return {
        success: false,
        error: new Error('Not in a SamTerminal project'),
      };
    }

    const fullName = normalizePluginName(pluginName);
    const plugin = context.config.plugins.find((p) => p.name === fullName);

    if (!plugin) {
      logger.error(`Plugin ${fullName} not found in config`);
      return {
        success: false,
        error: new Error('Plugin not found'),
      };
    }

    plugin.enabled = false;
    await saveConfig(context.configPath, context.config);

    logger.success(`Plugin ${getShortName(fullName)} disabled`);

    return {
      success: true,
      message: `Plugin ${fullName} disabled`,
    };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error(error.message);
    return { success: false, error };
  }
}
