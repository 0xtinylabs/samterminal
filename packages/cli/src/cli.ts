#!/usr/bin/env node

/**
 * SAM Terminal CLI
 */

import { Command } from 'commander';
import chalk from 'chalk';
import {
  initCommand,
  runCommand,
  devCommand,
  setupCommand,
  doctorCommand,
  pluginInstall,
  pluginRemove,
  pluginList,
  pluginEnable,
  pluginDisable,
  orderCreate,
  orderList,
  orderCancel,
  orderPause,
  orderResume,
  orderGet,
} from './commands/index.js';
import { setLogLevel } from './utils/index.js';

const VERSION = '1.0.0';

const program = new Command();

// ASCII art banner
const banner = `
${chalk.cyan('╔═══════════════════════════════════════╗')}
${chalk.cyan('║')}           ${chalk.bold.white('SAM Terminal')} ${chalk.gray(`v${VERSION}`)}              ${chalk.cyan('║')}
${chalk.cyan('║')}   ${chalk.gray('Build powerful trading agents easily')}    ${chalk.cyan('║')}
${chalk.cyan('╚═══════════════════════════════════════╝')}
`;

program
  .name('sam')
  .description('CLI for SAM Terminal - Create and manage SAM Terminal agents')
  .version(VERSION)
  .option('-v, --verbose', 'Enable verbose output')
  .hook('preAction', (thisCommand) => {
    const opts = thisCommand.opts();
    if (opts.verbose) {
      setLogLevel('debug');
    }
  });

// Init command
program
  .command('init [name]')
  .description('Create a new SAM Terminal project')
  .option('-t, --template <template>', 'Template to use (basic, telegram-bot, web3-agent, custom)')
  .option('--typescript', 'Use TypeScript (default: true)')
  .option('--no-typescript', 'Use JavaScript')
  .option('-p, --plugins <plugins...>', 'Plugins to include')
  .option('--skip-install', 'Skip npm install')
  .option('--pm <manager>', 'Package manager (npm, pnpm, yarn)')
  .option('-w, --wizard', 'Interactive wizard with profile presets and API key setup')
  .action(async (name, options) => {
    console.log(banner);
    await initCommand(name, {
      name,
      template: options.template,
      typescript: options.typescript,
      plugins: options.plugins,
      skipInstall: options.skipInstall,
      packageManager: options.pm,
      wizard: options.wizard,
    });
  });

// Run command
program
  .command('run')
  .description('Start the SAM Terminal agent')
  .option('-c, --config <path>', 'Config file path')
  .option('-e, --env <environment>', 'Environment (development, production)')
  .option('-w, --watch', 'Enable watch mode')
  .option('-p, --port <port>', 'Port override', parseInt)
  .action(async (options) => {
    await runCommand({
      config: options.config,
      env: options.env,
      watch: options.watch,
      port: options.port,
      verbose: program.opts().verbose,
    });
  });

// Dev command (shortcut for run --watch)
program
  .command('dev')
  .description('Start the SAM Terminal agent in development mode')
  .option('-c, --config <path>', 'Config file path')
  .option('-p, --port <port>', 'Port override', parseInt)
  .action(async (options) => {
    await devCommand({
      config: options.config,
      port: options.port,
      verbose: program.opts().verbose,
    });
  });

// Setup command
program
  .command('setup')
  .description('Setup SAM Terminal development environment (install, build, migrate)')
  .option('--skip-install', 'Skip dependency installation')
  .option('--skip-build', 'Skip building packages')
  .option('--skip-migrate', 'Skip database migrations')
  .option('--skip-env-check', 'Skip .env file check')
  .action(async (options) => {
    console.log(banner);
    await setupCommand({
      skipInstall: options.skipInstall,
      skipBuild: options.skipBuild,
      skipMigrate: options.skipMigrate,
      skipEnvCheck: options.skipEnvCheck,
      verbose: program.opts().verbose,
    });
  });

// Doctor command
program
  .command('doctor')
  .description('Check system prerequisites, service connectivity, and API key configuration')
  .action(async () => {
    console.log(banner);
    await doctorCommand();
  });

// Plugin command group
const pluginCmd = program
  .command('plugin')
  .description('Manage SAM Terminal plugins');

pluginCmd
  .command('install <plugin>')
  .alias('add')
  .description('Install a plugin')
  .option('--version <version>', 'Plugin version')
  .option('--no-save', 'Do not save to config')
  .action(async (plugin, options) => {
    await pluginInstall(plugin, {
      version: options.version,
      save: options.save,
    });
  });

pluginCmd
  .command('remove <plugin>')
  .alias('rm')
  .alias('uninstall')
  .description('Remove a plugin')
  .action(async (plugin) => {
    await pluginRemove(plugin);
  });

pluginCmd
  .command('list')
  .alias('ls')
  .description('List installed plugins')
  .action(async () => {
    await pluginList();
  });

pluginCmd
  .command('enable <plugin>')
  .description('Enable a plugin')
  .action(async (plugin) => {
    await pluginEnable(plugin);
  });

pluginCmd
  .command('disable <plugin>')
  .description('Disable a plugin')
  .action(async (plugin) => {
    await pluginDisable(plugin);
  });

// Order command group
const orderCmd = program
  .command('order')
  .description('Manage trading orders');

orderCmd
  .command('create <type>')
  .description('Create a new order (stop-loss, take-profit, dca, etc.)')
  .option('--token <token>', 'Token address or symbol')
  .option('--trigger-price <price>', 'Trigger price for stop-loss/take-profit')
  .option('--sell-percent <percent>', 'Percentage to sell (default: 100)')
  .option('--buy-token <token>', 'Token to buy')
  .option('--sell-token <token>', 'Token to sell/spend')
  .option('--amount <amount>', 'Amount per execution')
  .option('--interval <interval>', 'DCA interval (hourly, daily, weekly, monthly)')
  .option('-c, --condition <condition...>', 'Condition (e.g., "price lt 3000")')
  .option('--trail-percent <percent>', 'Trail percentage for trailing-stop')
  .option('--stop-price <price>', 'Stop-loss price for dual-protection')
  .option('--target-price <price>', 'Take-profit price for dual-protection')
  .option('--notify <channels...>', 'Notification channels')
  .action(async (type, options) => {
    await orderCreate(type, options);
  });

orderCmd
  .command('list')
  .alias('ls')
  .description('List orders')
  .option('-s, --status <status>', 'Filter by status (active, paused, completed)')
  .option('-t, --type <type>', 'Filter by order type')
  .option('--token <token>', 'Filter by token')
  .option('-l, --limit <limit>', 'Limit results')
  .action(async (options) => {
    await orderList(options);
  });

orderCmd
  .command('get <orderId>')
  .description('Get order details')
  .action(async (orderId) => {
    await orderGet(orderId);
  });

orderCmd
  .command('cancel <orderId>')
  .description('Cancel an order')
  .action(async (orderId) => {
    await orderCancel(orderId);
  });

orderCmd
  .command('pause <orderId>')
  .description('Pause an order')
  .action(async (orderId) => {
    await orderPause(orderId);
  });

orderCmd
  .command('resume <orderId>')
  .description('Resume a paused order')
  .action(async (orderId) => {
    await orderResume(orderId);
  });

// Info command
program
  .command('info')
  .description('Display environment and project info')
  .action(async () => {
    const { getCLIContext } = await import('./utils/index.js');
    const context = await getCLIContext();

    console.log(banner);
    console.log(chalk.bold('Environment'));
    console.log(`  Node.js: ${process.version}`);
    console.log(`  Platform: ${process.platform}`);
    console.log(`  Package Manager: ${context.packageManager}`);
    console.log();

    if (context.isProject) {
      console.log(chalk.bold('Project'));
      console.log(`  Name: ${context.config?.name}`);
      console.log(`  Version: ${context.config?.version}`);
      console.log(`  SAM Terminal: ${context.config?.samterminalVersion}`);
      console.log(`  Plugins: ${context.config?.plugins.length || 0}`);
    } else {
      console.log(chalk.gray('Not in a SAM Terminal project directory'));
    }

    console.log();
  });

// Parse arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  console.log(banner);
  program.help();
}
