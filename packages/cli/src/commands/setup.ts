/**
 * SamTerminal Setup Command
 *
 * Automates the complete setup process:
 * 1. Check prerequisites (node, pnpm, go, protoc)
 * 2. Check/create .env file
 * 3. Install dependencies
 * 4. Generate protobuf code
 * 5. Build all packages
 * 6. Run database migrations
 */

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import ora, { type Ora } from 'ora';
import inquirer from 'inquirer';
import { logger } from '../utils/index.js';

const execAsync = promisify(exec);

export interface SetupOptions {
  skipInstall?: boolean;
  skipMigrate?: boolean;
  skipBuild?: boolean;
  skipEnvCheck?: boolean;
  docker?: boolean;
  verbose?: boolean;
}

interface Prerequisite {
  name: string;
  command: string;
  versionFlag: string;
  required: boolean;
  installHint: string;
}

const PREREQUISITES: Prerequisite[] = [
  {
    name: 'Node.js',
    command: 'node',
    versionFlag: '--version',
    required: true,
    installHint: 'https://nodejs.org/ (v18+ required)',
  },
  {
    name: 'pnpm',
    command: 'pnpm',
    versionFlag: '--version',
    required: true,
    installHint: 'npm install -g pnpm',
  },
  {
    name: 'Go',
    command: 'go',
    versionFlag: 'version',
    required: false,
    installHint: 'https://go.dev/dl/ (v1.24+ required for Go services)',
  },
  {
    name: 'Protocol Buffers',
    command: 'protoc',
    versionFlag: '--version',
    required: false,
    installHint: 'brew install protobuf (macOS) or apt install protobuf-compiler (Linux)',
  },
];

/**
 * Check if a command exists and get its version
 */
async function checkCommand(cmd: string, versionFlag: string): Promise<{ exists: boolean; version?: string }> {
  try {
    const { stdout } = await execAsync(`${cmd} ${versionFlag}`);
    const version = stdout.trim().split('\n')[0];
    return { exists: true, version };
  } catch {
    return { exists: false };
  }
}

/**
 * Check all prerequisites
 */
async function checkPrerequisites(spinner: Ora): Promise<{ passed: boolean; missing: Prerequisite[] }> {
  const missing: Prerequisite[] = [];
  const results: { name: string; version?: string; status: 'ok' | 'missing' | 'optional' }[] = [];

  for (const prereq of PREREQUISITES) {
    const result = await checkCommand(prereq.command, prereq.versionFlag);

    if (result.exists) {
      results.push({ name: prereq.name, version: result.version, status: 'ok' });
    } else if (prereq.required) {
      results.push({ name: prereq.name, status: 'missing' });
      missing.push(prereq);
    } else {
      results.push({ name: prereq.name, status: 'optional' });
    }
  }

  spinner.stop();

  console.log();
  console.log(chalk.bold('Prerequisites:'));
  for (const r of results) {
    const icon = r.status === 'ok' ? chalk.green('✓') : r.status === 'missing' ? chalk.red('✗') : chalk.yellow('○');
    const versionStr = r.version ? chalk.gray(` (${r.version})`) : '';
    const statusStr = r.status === 'optional' ? chalk.yellow(' [optional]') : '';
    console.log(`  ${icon} ${r.name}${versionStr}${statusStr}`);
  }
  console.log();

  const requiredMissing = missing.filter((m) => m.required);
  return { passed: requiredMissing.length === 0, missing };
}

/**
 * Check if .env file exists, offer to create from example
 */
async function checkEnvFile(projectRoot: string): Promise<boolean> {
  const envPath = path.join(projectRoot, '.env');
  const envExamplePath = path.join(projectRoot, '.env.example');

  if (await fs.pathExists(envPath)) {
    logger.success('.env file found');
    return true;
  }

  if (!(await fs.pathExists(envExamplePath))) {
    logger.warn('.env.example not found, skipping env setup');
    return true;
  }

  const { shouldCreate } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'shouldCreate',
      message: '.env file not found. Create from .env.example?',
      default: true,
    },
  ]);

  if (shouldCreate) {
    await fs.copy(envExamplePath, envPath);
    logger.success('.env file created from .env.example');
    logger.warn('Please edit .env and add your API keys before running the services');
    return true;
  }

  return false;
}

/**
 * Run a command with spinner
 */
async function runCommand(
  command: string,
  args: string[],
  options: { cwd?: string; description: string; verbose?: boolean }
): Promise<boolean> {
  const spinner = ora(options.description).start();

  return new Promise((resolve) => {
    const proc = spawn(command, args, {
      cwd: options.cwd || process.cwd(),
      stdio: options.verbose ? 'inherit' : 'pipe',
      shell: true,
    });

    let stderr = '';

    if (!options.verbose && proc.stderr) {
      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });
    }

    proc.on('close', (code) => {
      if (code === 0) {
        spinner.succeed(options.description);
        resolve(true);
      } else {
        spinner.fail(options.description);
        if (stderr) {
          console.error(chalk.red(stderr));
        }
        resolve(false);
      }
    });

    proc.on('error', (err) => {
      spinner.fail(`${options.description}: ${err.message}`);
      resolve(false);
    });
  });
}

/**
 * Find project root (where package.json with "samterminal" name exists)
 */
async function findProjectRoot(): Promise<string | null> {
  let currentDir = process.cwd();

  while (currentDir !== path.dirname(currentDir)) {
    const pkgPath = path.join(currentDir, 'package.json');
    if (await fs.pathExists(pkgPath)) {
      const pkg = await fs.readJson(pkgPath);
      if (pkg.name === 'samterminal') {
        return currentDir;
      }
    }
    currentDir = path.dirname(currentDir);
  }

  return null;
}

/**
 * Main setup command
 */
export async function setupCommand(options: SetupOptions = {}): Promise<void> {
  console.log();
  console.log(chalk.bold.cyan('SamTerminal Setup'));
  console.log(chalk.gray('─'.repeat(40)));
  console.log();

  // Find project root
  const projectRoot = await findProjectRoot();
  if (!projectRoot) {
    logger.error('Could not find SamTerminal project root. Make sure you are in the SamTerminal directory.');
    process.exit(1);
  }

  logger.info(`Project root: ${chalk.cyan(projectRoot)}`);

  // Step 1: Check prerequisites
  const prereqSpinner = ora('Checking prerequisites...').start();
  const { passed, missing } = await checkPrerequisites(prereqSpinner);

  if (!passed) {
    logger.error('Missing required prerequisites:');
    for (const m of missing.filter((p) => p.required)) {
      console.log(chalk.red(`  • ${m.name}: ${m.installHint}`));
    }
    process.exit(1);
  }

  // Step 2: Check .env file
  if (!options.skipEnvCheck) {
    await checkEnvFile(projectRoot);
  }

  const steps = [
    {
      name: 'install',
      skip: options.skipInstall,
      run: () =>
        runCommand('pnpm', ['install'], {
          cwd: projectRoot,
          description: 'Installing dependencies',
          verbose: options.verbose,
        }),
    },
    {
      name: 'proto',
      skip: false,
      run: () =>
        runCommand('pnpm', ['proto:gen'], {
          cwd: projectRoot,
          description: 'Generating protobuf code',
          verbose: options.verbose,
        }),
    },
    {
      name: 'build',
      skip: options.skipBuild,
      run: () =>
        runCommand('pnpm', ['build'], {
          cwd: projectRoot,
          description: 'Building all packages',
          verbose: options.verbose,
        }),
    },
    {
      name: 'migrate',
      skip: options.skipMigrate,
      run: () =>
        runCommand('pnpm', ['db:migrate'], {
          cwd: projectRoot,
          description: 'Running database migrations',
          verbose: options.verbose,
        }),
    },
  ];

  console.log();
  logger.info('Starting setup process...');
  console.log();

  let failed = false;
  for (const step of steps) {
    if (step.skip) {
      logger.info(`Skipping ${step.name}`);
      continue;
    }

    const success = await step.run();
    if (!success) {
      failed = true;
      logger.error(`Setup failed at step: ${step.name}`);
      break;
    }
  }

  console.log();

  if (failed) {
    logger.error('Setup incomplete. Please fix the errors above and try again.');
    process.exit(1);
  }

  console.log(chalk.green('═'.repeat(40)));
  console.log(chalk.bold.green('  ✓ SamTerminal setup complete!'));
  console.log(chalk.green('═'.repeat(40)));
  console.log();
  console.log(chalk.bold('Next steps:'));
  console.log(`  1. Edit ${chalk.cyan('.env')} with your API keys`);
  console.log(`  2. Run ${chalk.cyan('pnpm dev')} to start development`);
  console.log();
}
