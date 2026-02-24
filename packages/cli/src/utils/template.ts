/**
 * Template utilities for project scaffolding
 */

import fs from 'fs-extra';
import path from 'path';
import type { TemplateType, InitOptions, ProjectConfig } from '../types.js';

/**
 * Template file definition
 */
interface TemplateFile {
  path: string;
  content: string;
}

/**
 * Get package.json content for template
 */
function getPackageJson(options: InitOptions): string {
  const deps: Record<string, string> = {
    '@samterminal/core': '^1.0.0',
  };

  // Add plugin dependencies
  if (options.plugins?.includes('telegram')) {
    deps['@samterminal/plugin-telegram'] = '^1.0.0';
  }
  if (options.plugins?.includes('ai')) {
    deps['@samterminal/plugin-ai'] = '^1.0.0';
  }
  if (options.plugins?.includes('tokendata')) {
    deps['@samterminal/plugin-tokendata'] = '^1.0.0';
  }
  if (options.plugins?.includes('walletdata')) {
    deps['@samterminal/plugin-walletdata'] = '^1.0.0';
  }
  if (options.plugins?.includes('swap')) {
    deps['@samterminal/plugin-swap'] = '^1.0.0';
  }
  if (options.plugins?.includes('onboarding')) {
    deps['@samterminal/plugin-onboarding'] = '^1.0.0';
  }

  const pkg = {
    name: options.name,
    version: '1.0.0',
    type: 'module',
    scripts: {
      start: 'sam run',
      dev: 'sam run --watch',
      build: options.typescript ? 'tsc' : undefined,
    },
    dependencies: deps,
    devDependencies: options.typescript
      ? {
          typescript: '^5.7.0',
          '@types/node': '^22.0.0',
        }
      : {},
  };

  return JSON.stringify(pkg, null, 2);
}

/**
 * Get samterminal.config.json content
 */
function getSamTerminalConfig(options: InitOptions): ProjectConfig {
  const plugins = options.plugins?.map((name) => ({
    name: name.startsWith('@samterminal/') ? name : `@samterminal/plugin-${name}`,
    enabled: true,
  })) || [];

  return {
    name: options.name,
    version: '1.0.0',
    samterminalVersion: '^1.0.0',
    plugins,
    runtime: {
      logLevel: 'info',
      hotReload: true,
    },
  };
}

/**
 * Get main entry file content
 */
function getMainFile(options: InitOptions): string {
  const ext = options.typescript ? 'ts' : 'js';
  const imports: string[] = [
    `import { SamTerminal } from '@samterminal/core';`,
  ];

  const pluginImports: string[] = [];
  const pluginUses: string[] = [];

  if (options.plugins?.includes('telegram')) {
    imports.push(`import { createTelegramPlugin } from '@samterminal/plugin-telegram';`);
    pluginImports.push('telegram');
    pluginUses.push(`  await samterminal.use(createTelegramPlugin({
    botToken: process.env.TELEGRAM_BOT_TOKEN,
  }));`);
  }

  if (options.plugins?.includes('ai')) {
    imports.push(`import { createAIPlugin } from '@samterminal/plugin-ai';`);
    pluginUses.push(`  await samterminal.use(createAIPlugin({
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
  }));`);
  }

  if (options.plugins?.includes('onboarding')) {
    imports.push(`import { createOnboardingPlugin } from '@samterminal/plugin-onboarding';`);
    pluginUses.push(`  await samterminal.use(createOnboardingPlugin());`);
  }

  return `${imports.join('\n')}

async function main() {
  const samterminal = new SamTerminal({
    name: '${options.name}',
  });

${pluginUses.length > 0 ? pluginUses.join('\n\n') : '  // Add your plugins here'}

  await samterminal.start();

  console.log('SamTerminal agent started!');
}

main().catch(console.error);
`;
}

/**
 * Get .env.example content
 */
function getEnvExample(options: InitOptions): string {
  const lines: string[] = [
    '# SamTerminal Configuration',
    '',
  ];

  if (options.plugins?.includes('telegram')) {
    lines.push('# Telegram Bot Token');
    lines.push('TELEGRAM_BOT_TOKEN=your_bot_token_here');
    lines.push('');
  }

  if (options.plugins?.includes('ai')) {
    lines.push('# OpenAI API Key');
    lines.push('OPENAI_API_KEY=your_api_key_here');
    lines.push('');
    lines.push('# Anthropic API Key (optional)');
    lines.push('ANTHROPIC_API_KEY=your_api_key_here');
    lines.push('');
  }

  if (options.plugins?.includes('tokendata') || options.plugins?.includes('walletdata')) {
    lines.push('# DexScreener API (optional)');
    lines.push('DEXSCREENER_API_KEY=your_api_key_here');
    lines.push('');
    lines.push('# Moralis API Key');
    lines.push('MORALIS_API_KEY=your_api_key_here');
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Get .gitignore content
 */
function getGitignore(): string {
  return `# Dependencies
node_modules/

# Build output
dist/

# Environment variables
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/
`;
}

/**
 * Get tsconfig.json content
 */
function getTsConfig(): string {
  return JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      esModuleInterop: true,
      strict: true,
      skipLibCheck: true,
      outDir: './dist',
      rootDir: './src',
      declaration: true,
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist'],
  }, null, 2);
}

/**
 * Get README content
 */
function getReadme(options: InitOptions): string {
  return `# ${options.name}

A SamTerminal agent project.

## Getting Started

\`\`\`bash
# Install dependencies
${options.packageManager || 'npm'} install

# Create .env from example
cp .env.example .env

# Start the agent
${options.packageManager || 'npm'} run dev
\`\`\`

## Configuration

Edit \`samterminal.config.json\` to configure your agent.

## Plugins

${options.plugins?.length ? options.plugins.map(p => `- @samterminal/plugin-${p}`).join('\n') : 'No plugins configured.'}

## License

MIT
`;
}

/**
 * Get template files for a template type
 */
export function getTemplateFiles(options: InitOptions): TemplateFile[] {
  const ext = options.typescript ? 'ts' : 'js';
  const files: TemplateFile[] = [
    { path: 'package.json', content: getPackageJson(options) },
    { path: 'samterminal.config.json', content: JSON.stringify(getSamTerminalConfig(options), null, 2) },
    { path: `src/index.${ext}`, content: getMainFile(options) },
    { path: '.env.example', content: getEnvExample(options) },
    { path: '.gitignore', content: getGitignore() },
    { path: 'README.md', content: getReadme(options) },
  ];

  if (options.typescript) {
    files.push({ path: 'tsconfig.json', content: getTsConfig() });
  }

  return files;
}

/**
 * Scaffold project from template
 */
export async function scaffoldProject(
  targetDir: string,
  options: InitOptions,
): Promise<void> {
  // Ensure directory exists
  await fs.ensureDir(targetDir);
  await fs.ensureDir(path.join(targetDir, 'src'));

  // Get template files
  const files = getTemplateFiles(options);

  // Write files
  for (const file of files) {
    const filepath = path.join(targetDir, file.path);
    await fs.ensureDir(path.dirname(filepath));
    await fs.writeFile(filepath, file.content);
  }
}

/**
 * Get available templates
 */
export function getAvailableTemplates(): TemplateType[] {
  return ['basic', 'telegram-bot', 'web3-agent', 'custom'];
}

/**
 * Get template description
 */
export function getTemplateDescription(template: TemplateType): string {
  switch (template) {
    case 'basic':
      return 'Basic SamTerminal agent with minimal setup';
    case 'telegram-bot':
      return 'Telegram bot with AI capabilities';
    case 'web3-agent':
      return 'Web3 agent with token/wallet data and swap support';
    case 'custom':
      return 'Custom configuration - select your own plugins';
    default:
      return 'Unknown template';
  }
}

/**
 * Get default plugins for template
 */
export function getTemplatePlugins(template: TemplateType): string[] {
  switch (template) {
    case 'basic':
      return [];
    case 'telegram-bot':
      return ['telegram', 'ai', 'onboarding'];
    case 'web3-agent':
      return ['tokendata', 'walletdata', 'swap', 'telegram'];
    case 'custom':
      return [];
    default:
      return [];
  }
}

/**
 * Profile type for wizard-based init
 */
export type ProfileType = 'minimal' | 'trader' | 'notifier' | 'full' | 'custom';

/**
 * Profile definition
 */
export interface ProfileDefinition {
  name: ProfileType;
  label: string;
  description: string;
  plugins: string[];
}

/**
 * Available profiles with their plugin mappings
 */
export const PROFILE_DEFINITIONS: ProfileDefinition[] = [
  {
    name: 'minimal',
    label: 'Minimal (Read-Only)',
    description: 'Token/wallet monitoring only - no trading, no notifications',
    plugins: ['tokendata', 'walletdata'],
  },
  {
    name: 'trader',
    label: 'Trader (Active Trading)',
    description: 'Full trading capabilities with AI-powered analysis',
    plugins: ['tokendata', 'walletdata', 'swap', 'ai'],
  },
  {
    name: 'notifier',
    label: 'Notifier (Alerts Only)',
    description: 'Token monitoring with Telegram alerts - no trading',
    plugins: ['tokendata', 'walletdata', 'telegram'],
  },
  {
    name: 'full',
    label: 'Full (Everything)',
    description: 'All plugins enabled - trading, alerts, AI, onboarding',
    plugins: ['tokendata', 'walletdata', 'swap', 'telegram', 'ai', 'onboarding'],
  },
  {
    name: 'custom',
    label: 'Custom',
    description: 'Select plugins manually',
    plugins: [],
  },
];

/**
 * Get plugins for a profile
 */
export function getProfilePlugins(profile: ProfileType): string[] {
  const definition = PROFILE_DEFINITIONS.find((p) => p.name === profile);
  return definition?.plugins ?? [];
}

/**
 * Get all available profiles
 */
export function getAvailableProfiles(): ProfileDefinition[] {
  return PROFILE_DEFINITIONS;
}

/**
 * Supported chains for wizard
 */
export interface ChainDefinition {
  id: string;
  name: string;
  default: boolean;
}

/**
 * Available chains
 */
export const CHAIN_DEFINITIONS: ChainDefinition[] = [
  { id: 'base', name: 'Base', default: true },
  { id: 'ethereum', name: 'Ethereum', default: false },
  { id: 'arbitrum', name: 'Arbitrum', default: false },
  { id: 'polygon', name: 'Polygon', default: false },
  { id: 'optimism', name: 'Optimism', default: false },
  { id: 'bsc', name: 'BSC', default: false },
];

/**
 * Get .env content from API keys and chain config
 */
export function generateEnvContent(
  apiKeys: Record<string, string>,
  plugins: string[],
  chains: string[],
): string {
  const lines: string[] = [
    '# SAM Terminal Configuration',
    `# Generated at ${new Date().toISOString()}`,
    '',
    '# Chains',
    `DEFAULT_CHAIN=${chains[0] ?? 'base'}`,
    `ENABLED_CHAINS=${chains.join(',')}`,
    '',
  ];

  if (plugins.includes('tokendata') || plugins.includes('walletdata') || plugins.includes('swap')) {
    lines.push('# RPC / Data Provider');
    lines.push(`ALCHEMY_API_KEY=${apiKeys['ALCHEMY_API_KEY'] ?? ''}`);
    lines.push(`MORALIS_API_KEY=${apiKeys['MORALIS_API_KEY'] ?? ''}`);
    lines.push('');
  }

  if (plugins.includes('swap')) {
    lines.push('# Swap (0x API)');
    lines.push(`ZEROX_API_KEY=${apiKeys['ZEROX_API_KEY'] ?? ''}`);
    lines.push('');
  }

  if (plugins.includes('telegram')) {
    lines.push('# Telegram');
    lines.push(`MAIN_BOT_TOKEN=${apiKeys['MAIN_BOT_TOKEN'] ?? ''}`);
    lines.push('');
  }

  if (plugins.includes('ai')) {
    lines.push('# AI Providers');
    lines.push(`OPENAI_API_KEY=${apiKeys['OPENAI_API_KEY'] ?? ''}`);
    lines.push(`ANTHROPIC_API_KEY=${apiKeys['ANTHROPIC_API_KEY'] ?? ''}`);
    lines.push('');
  }

  // Database (always included)
  lines.push('# Database');
  lines.push('DATABASE_URL=postgresql://user:password@localhost:5432/samterminal');
  lines.push('REDIS_URL=redis://localhost:6379');
  lines.push('');

  return lines.join('\n');
}
