/**
 * samterminal init command
 */

import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { spawnSync } from 'child_process';
import type { InitOptions, TemplateType, CommandResult } from '../types.js';
import {
  logger,
  scaffoldProject,
  getAvailableTemplates,
  getTemplateDescription,
  getTemplatePlugins,
  getProfilePlugins,
  getAvailableProfiles,
  getRequiredKeysForPlugins,
  generateEnvContent,
  isPlaceholderValue,
  detectPackageManager,
  isValidProjectName,
  CHAIN_DEFINITIONS,
  type ProfileType,
} from '../utils/index.js';

/**
 * Available plugins
 */
const AVAILABLE_PLUGINS = [
  { name: 'telegram', description: 'Telegram bot integration' },
  { name: 'ai', description: 'AI/LLM integration (OpenAI, Anthropic)' },
  { name: 'tokendata', description: 'Token data and prices' },
  { name: 'walletdata', description: 'Wallet balances and transactions' },
  { name: 'swap', description: 'Token swap functionality' },
  { name: 'onboarding', description: 'User onboarding flows' },
];

/**
 * Prompt answers interface (classic mode)
 */
interface PromptAnswers {
  name: string;
  template: TemplateType;
  plugins?: string[];
  typescript: boolean;
  packageManager: 'npm' | 'pnpm' | 'yarn';
  skipInstall: boolean;
}

/**
 * Wizard answers interface (wizard mode)
 */
interface WizardAnswers {
  name: string;
  profile: ProfileType;
  plugins?: string[];
  chains: string[];
  apiKeys: Record<string, string>;
  packageManager: 'npm' | 'pnpm' | 'yarn';
  skipInstall: boolean;
}

/**
 * Prompt for init options (classic mode)
 */
async function promptOptions(name?: string): Promise<InitOptions> {
  const answers = await inquirer.prompt<PromptAnswers>([
    {
      type: 'input',
      name: 'name',
      message: 'Project name:',
      default: name || 'my-samterminal-agent',
      validate: (input: string) => {
        if (!input.trim()) {
          return 'Project name is required';
        }
        if (!/^[a-z0-9-_]+$/i.test(input)) {
          return 'Project name can only contain letters, numbers, hyphens, and underscores';
        }
        return true;
      },
    },
    {
      type: 'list',
      name: 'template',
      message: 'Select a template:',
      choices: getAvailableTemplates().map((t) => ({
        name: `${t} - ${getTemplateDescription(t)}`,
        value: t,
      })),
    },
    {
      type: 'checkbox',
      name: 'plugins',
      message: 'Select plugins to include:',
      choices: AVAILABLE_PLUGINS.map((p) => ({
        name: `${p.name} - ${p.description}`,
        value: p.name,
      })),
      when: (answers: { template: TemplateType }) => answers.template === 'custom',
    },
    {
      type: 'confirm',
      name: 'typescript',
      message: 'Use TypeScript?',
      default: true,
    },
    {
      type: 'list',
      name: 'packageManager',
      message: 'Package manager:',
      choices: ['pnpm', 'npm', 'yarn'],
      default: 'pnpm',
    },
    {
      type: 'confirm',
      name: 'skipInstall',
      message: 'Skip npm install?',
      default: false,
    },
  ]);

  // Get plugins based on template if not custom
  const plugins =
    answers.template === 'custom'
      ? answers.plugins
      : getTemplatePlugins(answers.template);

  return {
    name: answers.name,
    template: answers.template,
    plugins,
    typescript: answers.typescript,
    packageManager: answers.packageManager,
    skipInstall: answers.skipInstall,
  };
}

/**
 * Interactive wizard flow (new --wizard mode)
 */
async function wizardFlow(name?: string): Promise<{ options: InitOptions; envContent: string }> {
  const profiles = getAvailableProfiles();

  // Step 1: Project name
  const { projectName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: `${chalk.bold('Step 1/6')} - Project name:`,
      default: name || 'my-samterminal-agent',
      validate: (input: string) => {
        if (!input.trim()) return 'Project name is required';
        if (!/^[a-z0-9-_]+$/.test(input)) {
          return 'Use only lowercase letters, numbers, hyphens, and underscores';
        }
        return true;
      },
    },
  ]);

  // Step 2: Usage profile
  const { profile } = await inquirer.prompt([
    {
      type: 'list',
      name: 'profile',
      message: `${chalk.bold('Step 2/6')} - Usage profile:`,
      choices: profiles.map((p) => ({
        name: `${p.label} - ${chalk.gray(p.description)}`,
        value: p.name,
      })),
    },
  ]);

  // Get plugins (custom = checkbox, others = automatic)
  let selectedPlugins: string[];
  if (profile === 'custom') {
    const { plugins } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'plugins',
        message: 'Select plugins:',
        choices: AVAILABLE_PLUGINS.map((p) => ({
          name: `${p.name} - ${p.description}`,
          value: p.name,
        })),
      },
    ]);
    selectedPlugins = plugins;
  } else {
    selectedPlugins = getProfilePlugins(profile);
    console.log(chalk.gray(`  Plugins: ${selectedPlugins.join(', ')}`));
  }

  // Step 3: Chain selection
  const { chains } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'chains',
      message: `${chalk.bold('Step 3/6')} - Select chains:`,
      choices: CHAIN_DEFINITIONS.map((c) => ({
        name: c.name,
        value: c.id,
        checked: c.default,
      })),
      validate: (input: string[]) => {
        if (input.length === 0) return 'Select at least one chain';
        return true;
      },
    },
  ]);

  // Step 4: API key configuration
  console.log();
  console.log(chalk.bold(`Step 4/6`) + ' - API Key Configuration');
  console.log(chalk.gray('  Leave blank to skip (you can add them to .env later)'));
  console.log();

  const requiredKeys = getRequiredKeysForPlugins(selectedPlugins);
  const apiKeys: Record<string, string> = {};

  for (const keyDef of requiredKeys) {
    const requiredLabel = keyDef.required ? chalk.red(' (required)') : chalk.gray(' (optional)');
    const { value } = await inquirer.prompt([
      {
        type: 'password',
        name: 'value',
        message: `  ${keyDef.name}${requiredLabel}:`,
        mask: '*',
      },
    ]);

    if (value && !isPlaceholderValue(value)) {
      // Validate the key
      const spinner = ora(`  Validating ${keyDef.name}...`).start();
      const result = await keyDef.validate(value);

      if (result.valid) {
        spinner.succeed(`  ${keyDef.name}: ${chalk.green(result.message)}`);
        apiKeys[keyDef.envVar] = value;
      } else {
        spinner.warn(`  ${keyDef.name}: ${chalk.yellow(result.message)}`);
        const { useAnyway } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'useAnyway',
            message: '  Use this key anyway?',
            default: false,
          },
        ]);
        if (useAnyway) {
          apiKeys[keyDef.envVar] = value;
        }
      }
    } else if (keyDef.required) {
      console.log(chalk.yellow(`  Warning: ${keyDef.name} is required for ${keyDef.requiredBy.join(', ')} plugin(s)`));
    }
  }

  // Step 5: Package manager
  const { packageManager } = await inquirer.prompt([
    {
      type: 'list',
      name: 'packageManager',
      message: `${chalk.bold('Step 5/6')} - Package manager:`,
      choices: [
        { name: 'pnpm (recommended)', value: 'pnpm' },
        { name: 'npm', value: 'npm' },
        { name: 'yarn', value: 'yarn' },
      ],
      default: 'pnpm',
    },
  ]);

  // Step 6: Auto install
  const { skipInstall } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'skipInstall',
      message: `${chalk.bold('Step 6/6')} - Install dependencies now?`,
      default: true,
    },
  ]);

  // Generate .env content
  const envContent = generateEnvContent(apiKeys, selectedPlugins, chains);

  // Map profile to template
  const templateMap: Record<ProfileType, TemplateType> = {
    minimal: 'basic',
    trader: 'web3-agent',
    notifier: 'telegram-bot',
    full: 'web3-agent',
    custom: 'custom',
  };

  return {
    options: {
      name: projectName,
      template: templateMap[profile as ProfileType],
      plugins: selectedPlugins,
      typescript: true,
      packageManager,
      skipInstall: !skipInstall, // inverted because question asks "install now?"
    },
    envContent,
  };
}

/**
 * Install dependencies
 */
async function installDependencies(
  dir: string,
  packageManager: 'npm' | 'pnpm' | 'yarn',
): Promise<void> {
  const commands: Record<string, { cmd: string; args: string[] }> = {
    npm: { cmd: 'npm', args: ['install'] },
    pnpm: { cmd: 'pnpm', args: ['install'] },
    yarn: { cmd: 'yarn', args: [] },
  };

  const { cmd, args } = commands[packageManager];
  const result = spawnSync(cmd, args, {
    cwd: dir,
    stdio: 'inherit',
    shell: false,
  });
  if (result.status !== 0) {
    throw new Error('Dependency installation failed');
  }
}

/**
 * Execute init command
 */
export async function initCommand(
  name?: string,
  options?: Partial<InitOptions> & { wizard?: boolean },
): Promise<CommandResult> {
  try {
    console.log();
    console.log(chalk.bold.cyan('Create a new SamTerminal project'));
    console.log();

    let initOptions: InitOptions;
    let envContent: string | null = null;

    if (options?.wizard) {
      // Wizard mode
      const result = await wizardFlow(name);
      initOptions = result.options;
      envContent = result.envContent;
    } else if (options?.name) {
      // Non-interactive mode (all options provided)
      initOptions = {
        name: options.name,
        template: options.template || 'basic',
        plugins: options.plugins || [],
        typescript: options.typescript ?? true,
        packageManager: options.packageManager || 'pnpm',
        skipInstall: options.skipInstall ?? false,
      } as InitOptions;
    } else {
      // Classic interactive mode
      initOptions = await promptOptions(name);
    }

    // Validate project name
    if (!isValidProjectName(initOptions.name)) {
      logger.error('Invalid project name. Use only letters, numbers, hyphens, and underscores.');
      return {
        success: false,
        error: new Error('Invalid project name'),
      };
    }

    const targetDir = path.resolve(process.cwd(), initOptions.name);

    // Path traversal protection
    const cwd = process.cwd();
    if (!targetDir.startsWith(cwd)) {
      logger.error('Invalid project path: path traversal detected');
      return {
        success: false,
        error: new Error('Path traversal detected'),
      };
    }

    // Check if directory exists
    if (await fs.pathExists(targetDir)) {
      // Check for symlink (TOCTOU mitigation)
      const stat = await fs.lstat(targetDir);
      if (stat.isSymbolicLink()) {
        logger.error('Target is a symbolic link, refusing to overwrite');
        return {
          success: false,
          error: new Error('Symlink detected'),
        };
      }

      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: `Directory ${initOptions.name} already exists. Overwrite?`,
          default: false,
        },
      ]);

      if (!overwrite) {
        logger.warn('Operation cancelled');
        return { success: false, message: 'Operation cancelled' };
      }

      await fs.remove(targetDir);
    }

    // Scaffold project
    const spinner = ora('Creating project...').start();

    try {
      await scaffoldProject(targetDir, initOptions);

      // Write .env file if wizard mode generated one
      if (envContent) {
        await fs.writeFile(path.join(targetDir, '.env'), envContent);
      }

      spinner.succeed('Project created');
    } catch (err) {
      spinner.fail('Failed to create project');
      throw err;
    }

    // Install dependencies
    if (!initOptions.skipInstall) {
      const installSpinner = ora('Installing dependencies...').start();

      try {
        await installDependencies(targetDir, initOptions.packageManager!);
        installSpinner.succeed('Dependencies installed');
      } catch (err) {
        installSpinner.fail('Failed to install dependencies');
        logger.warn('You can run install manually later');
      }
    }

    // Success message
    console.log();

    if (envContent) {
      // Wizard mode summary
      const plugins = initOptions.plugins ?? [];
      const keyCount = envContent.split('\n').filter((l) => l.includes('=') && !l.startsWith('#') && !l.includes('DATABASE') && !l.includes('REDIS') && !l.includes('DEFAULT_CHAIN') && !l.includes('ENABLED_CHAINS')).length;
      const configuredKeys = envContent.split('\n').filter((l) => {
        if (l.startsWith('#') || !l.includes('=')) return false;
        const value = l.split('=')[1]?.trim();
        return value && value !== '';
      }).length;

      console.log(chalk.green('═'.repeat(50)));
      console.log(chalk.bold.green(`  Project ${initOptions.name} created!`));
      console.log(chalk.green('═'.repeat(50)));
      console.log();
      console.log(`  ${chalk.green('✓')} ${plugins.length} plugin(s): ${plugins.join(', ')}`);
      console.log(`  ${chalk.green('✓')} .env created with ${configuredKeys} API key(s) configured`);
      if (!initOptions.skipInstall) {
        console.log(`  ${chalk.green('✓')} Dependencies installed`);
      }
      console.log();
      console.log('Next steps:');
      console.log(chalk.gray(`  cd ${initOptions.name}`));
      if (configuredKeys < keyCount) {
        console.log(chalk.gray('  # Edit .env to add missing API keys'));
      }
      console.log(chalk.gray(`  ${initOptions.packageManager} run dev`));
      console.log();
      console.log(chalk.gray('Run `sam doctor` to check your configuration'));
    } else {
      // Classic mode summary
      logger.success(`Project ${chalk.bold(initOptions.name)} created successfully!`);
      console.log();
      console.log('Next steps:');
      console.log(chalk.gray(`  cd ${initOptions.name}`));
      if (initOptions.skipInstall) {
        console.log(chalk.gray(`  ${initOptions.packageManager} install`));
      }
      console.log(chalk.gray('  cp .env.example .env'));
      console.log(chalk.gray(`  ${initOptions.packageManager} run dev`));
    }

    console.log();

    return {
      success: true,
      message: `Project ${initOptions.name} created`,
      data: { path: targetDir },
    };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error(error.message);
    return { success: false, error };
  }
}
