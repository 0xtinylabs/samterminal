/**
 * Config utility tests
 */


import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import {
  findConfigFile,
  loadConfig,
  saveConfig,
  createDefaultConfig,
  detectPackageManager,
  getCLIContext,
  validateConfig,
  getConfigValue,
} from './config.js';
import type { ProjectConfig } from '../types.js';

describe('Config Utilities', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `samterminal-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('findConfigFile', () => {
    it('should find samterminal.config.json', async () => {
      await fs.writeFile(path.join(tempDir, 'samterminal.config.json'), '{}');

      const result = await findConfigFile(tempDir);

      expect(result).toBe(path.join(tempDir, 'samterminal.config.json'));
    });

    it('should find samterminal.json', async () => {
      await fs.writeFile(path.join(tempDir, 'samterminal.json'), '{}');

      const result = await findConfigFile(tempDir);

      expect(result).toBe(path.join(tempDir, 'samterminal.json'));
    });

    it('should find .samterminalrc.json', async () => {
      await fs.writeFile(path.join(tempDir, '.samterminalrc.json'), '{}');

      const result = await findConfigFile(tempDir);

      expect(result).toBe(path.join(tempDir, '.samterminalrc.json'));
    });

    it('should prefer samterminal.config.json over others', async () => {
      await fs.writeFile(path.join(tempDir, 'samterminal.config.json'), '{}');
      await fs.writeFile(path.join(tempDir, 'samterminal.json'), '{}');

      const result = await findConfigFile(tempDir);

      expect(result).toBe(path.join(tempDir, 'samterminal.config.json'));
    });

    it('should return null if no config found', async () => {
      const result = await findConfigFile(tempDir);

      expect(result).toBeNull();
    });
  });

  describe('loadConfig', () => {
    it('should load and parse config file', async () => {
      const config: ProjectConfig = {
        name: 'test-project',
        version: '1.0.0',
        samterminalVersion: '^1.0.0',
        plugins: [],
      };
      const configPath = path.join(tempDir, 'samterminal.config.json');
      await fs.writeFile(configPath, JSON.stringify(config));

      const result = await loadConfig(configPath);

      expect(result.name).toBe('test-project');
      expect(result.version).toBe('1.0.0');
    });
  });

  describe('saveConfig', () => {
    it('should save config to file', async () => {
      const config: ProjectConfig = {
        name: 'test-project',
        version: '2.0.0',
        samterminalVersion: '^1.0.0',
        plugins: [{ name: '@samterminal/plugin-telegram', enabled: true }],
      };
      const configPath = path.join(tempDir, 'samterminal.config.json');

      await saveConfig(configPath, config);

      const content = await fs.readFile(configPath, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed.name).toBe('test-project');
      expect(parsed.plugins).toHaveLength(1);
    });

    it('should format with 2 spaces', async () => {
      const config: ProjectConfig = {
        name: 'test',
        version: '1.0.0',
        samterminalVersion: '^1.0.0',
        plugins: [],
      };
      const configPath = path.join(tempDir, 'samterminal.config.json');

      await saveConfig(configPath, config);

      const content = await fs.readFile(configPath, 'utf-8');
      expect(content).toContain('  "name"'); // 2 space indent
    });
  });

  describe('createDefaultConfig', () => {
    it('should create config with name', () => {
      const config = createDefaultConfig('my-project');

      expect(config.name).toBe('my-project');
      expect(config.version).toBe('1.0.0');
      expect(config.samterminalVersion).toBe('^1.0.0');
      expect(config.plugins).toEqual([]);
    });

    it('should include default runtime settings', () => {
      const config = createDefaultConfig('test');

      expect(config.runtime?.logLevel).toBe('info');
      expect(config.runtime?.hotReload).toBe(true);
    });
  });

  describe('detectPackageManager', () => {
    it('should detect pnpm', async () => {
      await fs.writeFile(path.join(tempDir, 'pnpm-lock.yaml'), '');

      const result = await detectPackageManager(tempDir);

      expect(result).toBe('pnpm');
    });

    it('should detect yarn', async () => {
      await fs.writeFile(path.join(tempDir, 'yarn.lock'), '');

      const result = await detectPackageManager(tempDir);

      expect(result).toBe('yarn');
    });

    it('should default to npm', async () => {
      const result = await detectPackageManager(tempDir);

      expect(result).toBe('npm');
    });

    it('should prefer pnpm over yarn', async () => {
      await fs.writeFile(path.join(tempDir, 'pnpm-lock.yaml'), '');
      await fs.writeFile(path.join(tempDir, 'yarn.lock'), '');

      const result = await detectPackageManager(tempDir);

      expect(result).toBe('pnpm');
    });
  });

  describe('getCLIContext', () => {
    it('should return context with isProject=false when no config', async () => {
      const context = await getCLIContext(tempDir);

      expect(context.isProject).toBe(false);
      expect(context.config).toBeUndefined();
      expect(context.configPath).toBeUndefined();
    });

    it('should return context with isProject=true when config exists', async () => {
      const config: ProjectConfig = {
        name: 'test',
        version: '1.0.0',
        samterminalVersion: '^1.0.0',
        plugins: [],
      };
      await fs.writeFile(
        path.join(tempDir, 'samterminal.config.json'),
        JSON.stringify(config),
      );

      const context = await getCLIContext(tempDir);

      expect(context.isProject).toBe(true);
      expect(context.config?.name).toBe('test');
      expect(context.configPath).toBe(path.join(tempDir, 'samterminal.config.json'));
    });

    it('should detect package manager', async () => {
      await fs.writeFile(path.join(tempDir, 'pnpm-lock.yaml'), '');

      const context = await getCLIContext(tempDir);

      expect(context.packageManager).toBe('pnpm');
    });

    it('should include cwd', async () => {
      const context = await getCLIContext(tempDir);

      expect(context.cwd).toBe(tempDir);
    });
  });

  describe('validateConfig', () => {
    it('should return true for valid config', () => {
      const config = {
        name: 'test',
        version: '1.0.0',
        samterminalVersion: '^1.0.0',
        plugins: [],
      };

      expect(validateConfig(config)).toBe(true);
    });

    it('should return false for null', () => {
      expect(validateConfig(null)).toBe(false);
    });

    it('should return false for non-object', () => {
      expect(validateConfig('string')).toBe(false);
      expect(validateConfig(123)).toBe(false);
    });

    it('should return false for missing name', () => {
      const config = {
        version: '1.0.0',
        samterminalVersion: '^1.0.0',
        plugins: [],
      };

      expect(validateConfig(config)).toBe(false);
    });

    it('should return false for empty name', () => {
      const config = {
        name: '',
        version: '1.0.0',
        samterminalVersion: '^1.0.0',
        plugins: [],
      };

      expect(validateConfig(config)).toBe(false);
    });

    it('should return false for missing version', () => {
      const config = {
        name: 'test',
        samterminalVersion: '^1.0.0',
        plugins: [],
      };

      expect(validateConfig(config)).toBe(false);
    });

    it('should return false for missing samterminalVersion', () => {
      const config = {
        name: 'test',
        version: '1.0.0',
        plugins: [],
      };

      expect(validateConfig(config)).toBe(false);
    });

    it('should return false for non-array plugins', () => {
      const config = {
        name: 'test',
        version: '1.0.0',
        samterminalVersion: '^1.0.0',
        plugins: 'not-array',
      };

      expect(validateConfig(config)).toBe(false);
    });
  });

  describe('getConfigValue', () => {
    const config: ProjectConfig = {
      name: 'test',
      version: '1.0.0',
      samterminalVersion: '^1.0.0',
      plugins: [],
      runtime: {
        logLevel: 'debug',
        hotReload: true,
        port: 3000,
      },
    };

    it('should get top-level value', () => {
      const result = getConfigValue(config, 'name', 'default');
      expect(result).toBe('test');
    });

    it('should get nested value', () => {
      const result = getConfigValue(config, 'runtime.logLevel', 'info');
      expect(result).toBe('debug');
    });

    it('should return fallback for missing path', () => {
      const result = getConfigValue(config, 'runtime.missing', 'default');
      expect(result).toBe('default');
    });

    it('should return fallback for undefined config', () => {
      const result = getConfigValue(undefined, 'name', 'default');
      expect(result).toBe('default');
    });

    it('should return fallback for deep missing path', () => {
      const result = getConfigValue(config, 'a.b.c.d', 'fallback');
      expect(result).toBe('fallback');
    });
  });
});
