/**
 * SamTerminal Doctor Command
 *
 * Diagnostic tool that checks:
 * 1. System prerequisites (Node.js, pnpm, Go, protoc, Docker)
 * 2. Service connectivity (PostgreSQL, Redis)
 * 3. API key configuration and validity
 * 4. Project configuration health
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import ora from 'ora';
import { logger, validateAllKeys, API_KEY_DEFINITIONS } from '../utils/index.js';
import type { CommandResult } from '../types.js';

const execAsync = promisify(exec);

/**
 * Doctor check result
 */
interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn' | 'skip';
  message: string;
  detail?: string;
}

/**
 * Check if a command exists and get version
 */
async function checkCommand(cmd: string, versionFlag: string): Promise<{ exists: boolean; version?: string }> {
  try {
    const { stdout } = await execAsync(`${cmd} ${versionFlag}`);
    return { exists: true, version: stdout.trim().split('\n')[0] };
  } catch {
    return { exists: false };
  }
}

/**
 * Check TCP connectivity to a host:port
 */
async function checkTcpConnection(host: string, port: number, timeoutMs: number = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    const net = require('net') as typeof import('net');
    const socket = new net.Socket();

    socket.setTimeout(timeoutMs);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

/**
 * Parse database URL for host/port
 */
function parseDatabaseUrl(url: string): { host: string; port: number } | null {
  try {
    const match = url.match(/@([^:/?]+):?(\d+)?/);
    if (match) {
      return { host: match[1], port: parseInt(match[2] ?? '5432', 10) };
    }
  } catch { /* ignore */ }
  return null;
}

/**
 * Parse Redis URL for host/port
 */
function parseRedisUrl(url: string): { host: string; port: number } | null {
  try {
    const match = url.match(/:\/\/([^:/?]+):?(\d+)?/);
    if (match) {
      return { host: match[1], port: parseInt(match[2] ?? '6379', 10) };
    }
  } catch { /* ignore */ }
  return null;
}

/**
 * Run all prerequisite checks
 */
async function checkPrerequisites(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  const prereqs = [
    { name: 'Node.js', cmd: 'node', flag: '--version', required: true, minVersion: '18' },
    { name: 'pnpm', cmd: 'pnpm', flag: '--version', required: true, minVersion: null },
    { name: 'Go', cmd: 'go', flag: 'version', required: false, minVersion: null },
    { name: 'Protocol Buffers', cmd: 'protoc', flag: '--version', required: false, minVersion: null },
    { name: 'Docker', cmd: 'docker', flag: '--version', required: false, minVersion: null },
  ];

  for (const prereq of prereqs) {
    const check = await checkCommand(prereq.cmd, prereq.flag);

    if (check.exists) {
      // Check minimum version if applicable
      if (prereq.minVersion && check.version) {
        const versionMatch = check.version.match(/v?(\d+)/);
        const major = versionMatch ? parseInt(versionMatch[1], 10) : 0;
        const required = parseInt(prereq.minVersion, 10);

        if (major < required) {
          results.push({
            name: prereq.name,
            status: 'fail',
            message: `${check.version} (v${prereq.minVersion}+ required)`,
          });
          continue;
        }
      }

      results.push({
        name: prereq.name,
        status: 'pass',
        message: check.version ?? 'found',
      });
    } else if (prereq.required) {
      results.push({
        name: prereq.name,
        status: 'fail',
        message: 'Not found',
      });
    } else {
      results.push({
        name: prereq.name,
        status: 'warn',
        message: 'Not found (optional)',
      });
    }
  }

  return results;
}

/**
 * Run service connectivity checks
 */
async function checkServices(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  // PostgreSQL
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    const parsed = parseDatabaseUrl(dbUrl);
    if (parsed) {
      const reachable = await checkTcpConnection(parsed.host, parsed.port);
      results.push({
        name: `PostgreSQL (${parsed.host}:${parsed.port})`,
        status: reachable ? 'pass' : 'fail',
        message: reachable ? 'Reachable' : 'Unreachable',
      });
    } else {
      results.push({
        name: 'PostgreSQL',
        status: 'warn',
        message: 'Could not parse DATABASE_URL',
      });
    }
  } else {
    results.push({
      name: 'PostgreSQL',
      status: 'skip',
      message: 'DATABASE_URL not set',
    });
  }

  // Redis
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    const parsed = parseRedisUrl(redisUrl);
    if (parsed) {
      const reachable = await checkTcpConnection(parsed.host, parsed.port);
      results.push({
        name: `Redis (${parsed.host}:${parsed.port})`,
        status: reachable ? 'pass' : 'fail',
        message: reachable ? 'Reachable' : 'Unreachable',
      });
    } else {
      results.push({
        name: 'Redis',
        status: 'warn',
        message: 'Could not parse REDIS_URL',
      });
    }
  } else {
    results.push({
      name: 'Redis',
      status: 'skip',
      message: 'REDIS_URL not set',
    });
  }

  // Docker
  const dockerCheck = await checkCommand('docker', 'info --format "{{.ServerVersion}}"');
  if (dockerCheck.exists) {
    results.push({
      name: 'Docker Engine',
      status: 'pass',
      message: `Running (${dockerCheck.version})`,
    });
  } else {
    results.push({
      name: 'Docker Engine',
      status: 'warn',
      message: 'Not running (optional for development)',
    });
  }

  return results;
}

/**
 * Run API key checks
 */
async function checkApiKeys(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const validationResults = await validateAllKeys();

  for (const [envVar, result] of validationResults) {
    const def = API_KEY_DEFINITIONS.find((d) => d.envVar === envVar);
    const name = def?.name ?? envVar;

    if (result.valid) {
      results.push({
        name,
        status: 'pass',
        message: result.message,
      });
    } else if (result.message === 'Not set') {
      results.push({
        name,
        status: def?.required ? 'fail' : 'warn',
        message: 'Not set',
        detail: def?.required
          ? `Required for: ${def.requiredBy.join(', ')}`
          : `Optional for: ${def?.requiredBy.join(', ')}`,
      });
    } else {
      results.push({
        name,
        status: 'fail',
        message: result.message,
      });
    }
  }

  return results;
}

/**
 * Check project configuration
 */
async function checkProjectConfig(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  // Check .env file
  const envPath = path.join(process.cwd(), '.env');
  const envExists = await fs.pathExists(envPath);
  results.push({
    name: '.env file',
    status: envExists ? 'pass' : 'warn',
    message: envExists ? 'Found' : 'Missing (copy from .env.example)',
  });

  // Check samterminal.config.json
  const configPath = path.join(process.cwd(), 'samterminal.config.json');
  const configExists = await fs.pathExists(configPath);
  results.push({
    name: 'samterminal.config.json',
    status: configExists ? 'pass' : 'skip',
    message: configExists ? 'Found' : 'Not found (not in project dir?)',
  });

  if (configExists) {
    try {
      const config = await fs.readJson(configPath);
      const pluginCount = config.plugins?.length ?? 0;
      results.push({
        name: 'Plugin configuration',
        status: pluginCount > 0 ? 'pass' : 'warn',
        message: `${pluginCount} plugin(s) configured`,
      });
    } catch {
      results.push({
        name: 'Plugin configuration',
        status: 'fail',
        message: 'Could not parse samterminal.config.json',
      });
    }
  }

  return results;
}

/**
 * Format check result for display
 */
function formatResult(result: CheckResult): string {
  const icons: Record<CheckResult['status'], string> = {
    pass: chalk.green('✓'),
    fail: chalk.red('✗'),
    warn: chalk.yellow('○'),
    skip: chalk.gray('–'),
  };

  const icon = icons[result.status];
  const nameStr = result.name;
  const messageStr = result.status === 'pass'
    ? chalk.green(result.message)
    : result.status === 'fail'
      ? chalk.red(result.message)
      : result.status === 'warn'
        ? chalk.yellow(result.message)
        : chalk.gray(result.message);

  let line = `  ${icon} ${nameStr}: ${messageStr}`;
  if (result.detail) {
    line += `\n      ${chalk.gray(result.detail)}`;
  }
  return line;
}

/**
 * Execute doctor command
 */
export async function doctorCommand(): Promise<CommandResult> {
  console.log();
  console.log(chalk.bold.cyan('SAM Terminal Doctor'));
  console.log(chalk.gray('─'.repeat(40)));

  // 1. Prerequisites
  console.log();
  console.log(chalk.bold('System Prerequisites'));
  const prereqSpinner = ora('Checking prerequisites...').start();
  const prereqResults = await checkPrerequisites();
  prereqSpinner.stop();
  prereqResults.forEach((r) => console.log(formatResult(r)));

  // 2. Services
  console.log();
  console.log(chalk.bold('Services'));
  const serviceSpinner = ora('Checking services...').start();
  const serviceResults = await checkServices();
  serviceSpinner.stop();
  serviceResults.forEach((r) => console.log(formatResult(r)));

  // 3. API Keys
  console.log();
  console.log(chalk.bold('API Keys'));
  const apiSpinner = ora('Validating API keys...').start();
  const apiResults = await checkApiKeys();
  apiSpinner.stop();
  apiResults.forEach((r) => console.log(formatResult(r)));

  // 4. Project Config
  console.log();
  console.log(chalk.bold('Project Configuration'));
  const configResults = await checkProjectConfig();
  configResults.forEach((r) => console.log(formatResult(r)));

  // Summary
  const allResults = [...prereqResults, ...serviceResults, ...apiResults, ...configResults];
  const passCount = allResults.filter((r) => r.status === 'pass').length;
  const failCount = allResults.filter((r) => r.status === 'fail').length;
  const warnCount = allResults.filter((r) => r.status === 'warn').length;

  console.log();
  console.log(chalk.gray('─'.repeat(40)));
  console.log();

  if (failCount === 0) {
    console.log(chalk.bold.green(`  All checks passed! (${passCount} pass, ${warnCount} warnings)`));
  } else {
    console.log(chalk.bold.red(`  ${failCount} issue(s) found`));
    console.log(chalk.gray(`  ${passCount} pass, ${warnCount} warnings, ${failCount} failures`));
  }

  // Recommendations
  const recommendations: string[] = [];

  const missingKeys = apiResults.filter((r) => r.status === 'fail' && r.message === 'Not set');
  if (missingKeys.length > 0) {
    recommendations.push(`Set missing API keys: ${missingKeys.map((r) => r.name).join(', ')}`);
  }

  const unreachableServices = serviceResults.filter((r) => r.status === 'fail');
  if (unreachableServices.length > 0) {
    recommendations.push('Start required services: docker compose up -d');
  }

  if (recommendations.length > 0) {
    console.log();
    console.log(chalk.bold('Recommendations:'));
    recommendations.forEach((r) => console.log(`  ${chalk.yellow('→')} ${r}`));
  }

  console.log();

  return {
    success: failCount === 0,
    message: failCount === 0
      ? 'All checks passed'
      : `${failCount} issue(s) found`,
    data: {
      pass: passCount,
      fail: failCount,
      warn: warnCount,
      total: allResults.length,
    },
  };
}
