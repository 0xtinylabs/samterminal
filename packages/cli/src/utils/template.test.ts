/**
 * Template utility tests
 */


import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import {
  getTemplateFiles,
  scaffoldProject,
  getAvailableTemplates,
  getTemplateDescription,
  getTemplatePlugins,
} from './template.js';
import type { InitOptions, TemplateType } from '../types.js';

describe('Template Utilities', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `samterminal-template-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('getAvailableTemplates', () => {
    it('should return all template types', () => {
      const templates = getAvailableTemplates();

      expect(templates).toContain('basic');
      expect(templates).toContain('telegram-bot');
      expect(templates).toContain('web3-agent');
      expect(templates).toContain('custom');
      expect(templates).toHaveLength(4);
    });
  });

  describe('getTemplateDescription', () => {
    it('should return description for basic', () => {
      const desc = getTemplateDescription('basic');
      expect(desc).toContain('Basic');
    });

    it('should return description for telegram-bot', () => {
      const desc = getTemplateDescription('telegram-bot');
      expect(desc).toContain('Telegram');
    });

    it('should return description for web3-agent', () => {
      const desc = getTemplateDescription('web3-agent');
      expect(desc).toContain('Web3');
    });

    it('should return description for custom', () => {
      const desc = getTemplateDescription('custom');
      expect(desc).toContain('Custom');
    });

    it('should return unknown for invalid template', () => {
      const desc = getTemplateDescription('invalid' as TemplateType);
      expect(desc).toContain('Unknown');
    });
  });

  describe('getTemplatePlugins', () => {
    it('should return empty array for basic', () => {
      const plugins = getTemplatePlugins('basic');
      expect(plugins).toEqual([]);
    });

    it('should return telegram plugins for telegram-bot', () => {
      const plugins = getTemplatePlugins('telegram-bot');
      expect(plugins).toContain('telegram');
      expect(plugins).toContain('ai');
      expect(plugins).toContain('onboarding');
    });

    it('should return web3 plugins for web3-agent', () => {
      const plugins = getTemplatePlugins('web3-agent');
      expect(plugins).toContain('tokendata');
      expect(plugins).toContain('walletdata');
      expect(plugins).toContain('swap');
      expect(plugins).toContain('telegram');
    });

    it('should return empty array for custom', () => {
      const plugins = getTemplatePlugins('custom');
      expect(plugins).toEqual([]);
    });
  });

  describe('getTemplateFiles', () => {
    it('should include package.json', () => {
      const options: InitOptions = {
        name: 'test-project',
        template: 'basic',
        typescript: true,
      };

      const files = getTemplateFiles(options);
      const packageJson = files.find((f) => f.path === 'package.json');

      expect(packageJson).toBeDefined();
      expect(packageJson?.content).toContain('"name": "test-project"');
    });

    it('should include samterminal.config.json', () => {
      const options: InitOptions = {
        name: 'test-project',
        template: 'basic',
        typescript: true,
      };

      const files = getTemplateFiles(options);
      const config = files.find((f) => f.path === 'samterminal.config.json');

      expect(config).toBeDefined();
      expect(config?.content).toContain('test-project');
    });

    it('should include TypeScript entry for TS projects', () => {
      const options: InitOptions = {
        name: 'test-project',
        template: 'basic',
        typescript: true,
      };

      const files = getTemplateFiles(options);
      const entry = files.find((f) => f.path === 'src/index.ts');

      expect(entry).toBeDefined();
    });

    it('should include JavaScript entry for JS projects', () => {
      const options: InitOptions = {
        name: 'test-project',
        template: 'basic',
        typescript: false,
      };

      const files = getTemplateFiles(options);
      const entry = files.find((f) => f.path === 'src/index.js');

      expect(entry).toBeDefined();
    });

    it('should include tsconfig.json for TS projects', () => {
      const options: InitOptions = {
        name: 'test-project',
        template: 'basic',
        typescript: true,
      };

      const files = getTemplateFiles(options);
      const tsconfig = files.find((f) => f.path === 'tsconfig.json');

      expect(tsconfig).toBeDefined();
    });

    it('should not include tsconfig.json for JS projects', () => {
      const options: InitOptions = {
        name: 'test-project',
        template: 'basic',
        typescript: false,
      };

      const files = getTemplateFiles(options);
      const tsconfig = files.find((f) => f.path === 'tsconfig.json');

      expect(tsconfig).toBeUndefined();
    });

    it('should include .env.example', () => {
      const options: InitOptions = {
        name: 'test-project',
        template: 'basic',
        typescript: true,
      };

      const files = getTemplateFiles(options);
      const env = files.find((f) => f.path === '.env.example');

      expect(env).toBeDefined();
    });

    it('should include .gitignore', () => {
      const options: InitOptions = {
        name: 'test-project',
        template: 'basic',
        typescript: true,
      };

      const files = getTemplateFiles(options);
      const gitignore = files.find((f) => f.path === '.gitignore');

      expect(gitignore).toBeDefined();
      expect(gitignore?.content).toContain('node_modules');
    });

    it('should include README.md', () => {
      const options: InitOptions = {
        name: 'test-project',
        template: 'basic',
        typescript: true,
      };

      const files = getTemplateFiles(options);
      const readme = files.find((f) => f.path === 'README.md');

      expect(readme).toBeDefined();
      expect(readme?.content).toContain('# test-project');
    });

    it('should include plugin dependencies in package.json', () => {
      const options: InitOptions = {
        name: 'test-project',
        template: 'custom',
        typescript: true,
        plugins: ['telegram', 'ai'],
      };

      const files = getTemplateFiles(options);
      const packageJson = files.find((f) => f.path === 'package.json');

      expect(packageJson?.content).toContain('@samterminal/plugin-telegram');
      expect(packageJson?.content).toContain('@samterminal/plugin-ai');
    });

    it('should include plugin imports in entry file', () => {
      const options: InitOptions = {
        name: 'test-project',
        template: 'custom',
        typescript: true,
        plugins: ['telegram'],
      };

      const files = getTemplateFiles(options);
      const entry = files.find((f) => f.path === 'src/index.ts');

      expect(entry?.content).toContain('createTelegramPlugin');
    });

    it('should include plugin env vars in .env.example', () => {
      const options: InitOptions = {
        name: 'test-project',
        template: 'custom',
        typescript: true,
        plugins: ['telegram', 'ai'],
      };

      const files = getTemplateFiles(options);
      const env = files.find((f) => f.path === '.env.example');

      expect(env?.content).toContain('TELEGRAM_BOT_TOKEN');
      expect(env?.content).toContain('OPENAI_API_KEY');
    });
  });

  describe('scaffoldProject', () => {
    it('should create project directory', async () => {
      const projectDir = path.join(tempDir, 'my-project');
      const options: InitOptions = {
        name: 'my-project',
        template: 'basic',
        typescript: true,
      };

      await scaffoldProject(projectDir, options);

      expect(await fs.pathExists(projectDir)).toBe(true);
    });

    it('should create src directory', async () => {
      const projectDir = path.join(tempDir, 'my-project');
      const options: InitOptions = {
        name: 'my-project',
        template: 'basic',
        typescript: true,
      };

      await scaffoldProject(projectDir, options);

      expect(await fs.pathExists(path.join(projectDir, 'src'))).toBe(true);
    });

    it('should create all template files', async () => {
      const projectDir = path.join(tempDir, 'my-project');
      const options: InitOptions = {
        name: 'my-project',
        template: 'basic',
        typescript: true,
      };

      await scaffoldProject(projectDir, options);

      expect(await fs.pathExists(path.join(projectDir, 'package.json'))).toBe(true);
      expect(await fs.pathExists(path.join(projectDir, 'samterminal.config.json'))).toBe(true);
      expect(await fs.pathExists(path.join(projectDir, 'src/index.ts'))).toBe(true);
      expect(await fs.pathExists(path.join(projectDir, '.env.example'))).toBe(true);
      expect(await fs.pathExists(path.join(projectDir, '.gitignore'))).toBe(true);
      expect(await fs.pathExists(path.join(projectDir, 'tsconfig.json'))).toBe(true);
    });

    it('should write correct file contents', async () => {
      const projectDir = path.join(tempDir, 'my-project');
      const options: InitOptions = {
        name: 'my-project',
        template: 'basic',
        typescript: true,
      };

      await scaffoldProject(projectDir, options);

      const packageJson = await fs.readFile(
        path.join(projectDir, 'package.json'),
        'utf-8',
      );
      const parsed = JSON.parse(packageJson);

      expect(parsed.name).toBe('my-project');
      expect(parsed.dependencies['@samterminal/core']).toBeDefined();
    });
  });
});
