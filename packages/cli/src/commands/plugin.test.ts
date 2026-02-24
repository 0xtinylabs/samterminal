/**
 * Plugin command tests
 */

import { jest } from '@jest/globals';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import type { ProjectConfig } from '../types.js';

// Mock child_process using unstable_mockModule for ESM compatibility
jest.unstable_mockModule('child_process', () => ({
  execSync: jest.fn(),
  spawnSync: jest.fn(() => ({ status: 0, stdout: '', stderr: '' })),
}));

const {
  pluginInstall,
  pluginRemove,
  pluginList,
  pluginEnable,
  pluginDisable,
} = await import('./plugin.js');
const childProcess = await import('child_process');

// Mock console
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('Plugin Commands', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `samterminal-plugin-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
    originalCwd = process.cwd();
    process.chdir(tempDir);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.remove(tempDir);
  });

  const createProjectConfig = async (config?: Partial<ProjectConfig>) => {
    const fullConfig: ProjectConfig = {
      name: 'test-project',
      version: '1.0.0',
      samterminalVersion: '^1.0.0',
      plugins: [],
      ...config,
    };
    await fs.writeFile(
      path.join(tempDir, 'samterminal.config.json'),
      JSON.stringify(fullConfig, null, 2),
    );
    return fullConfig;
  };

  describe('pluginInstall', () => {
    it('should fail if not in project directory', async () => {
      const result = await pluginInstall('telegram');

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Not in a SamTerminal project');
    });

    it('should normalize plugin name', async () => {
      const { spawnSync } = childProcess;
      await createProjectConfig();

      await pluginInstall('telegram');

      expect(spawnSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([expect.stringContaining('@samterminal/plugin-telegram')]),
        expect.any(Object),
      );
    });

    it('should use full package name if provided', async () => {
      const { spawnSync } = childProcess;
      await createProjectConfig();

      await pluginInstall('@custom/plugin');

      expect(spawnSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([expect.stringContaining('@custom/plugin')]),
        expect.any(Object),
      );
    });

    it('should update config with new plugin', async () => {
      await createProjectConfig();

      await pluginInstall('telegram');

      const config = await fs.readJSON(path.join(tempDir, 'samterminal.config.json'));
      expect(config.plugins).toContainEqual(
        expect.objectContaining({ name: '@samterminal/plugin-telegram' }),
      );
    });

    it('should not duplicate plugin in config', async () => {
      await createProjectConfig({
        plugins: [{ name: '@samterminal/plugin-telegram', enabled: true }],
      });

      await pluginInstall('telegram');

      const config = await fs.readJSON(path.join(tempDir, 'samterminal.config.json'));
      expect(config.plugins.filter((p: any) => p.name === '@samterminal/plugin-telegram')).toHaveLength(1);
    });

    it('should not save to config when save=false', async () => {
      await createProjectConfig();

      await pluginInstall('telegram', { save: false });

      const config = await fs.readJSON(path.join(tempDir, 'samterminal.config.json'));
      expect(config.plugins).toHaveLength(0);
    });

    it('should use specified version', async () => {
      const { spawnSync } = childProcess;
      await createProjectConfig();

      await pluginInstall('telegram', { version: '2.0.0' });

      expect(spawnSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([expect.stringContaining('@2.0.0')]),
        expect.any(Object),
      );
    });

    it('should return success on install', async () => {
      await createProjectConfig();

      const result = await pluginInstall('telegram');

      expect(result.success).toBe(true);
      expect(result.data?.plugin).toBe('@samterminal/plugin-telegram');
    });
  });

  describe('pluginRemove', () => {
    it('should fail if not in project directory', async () => {
      const result = await pluginRemove('telegram');

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Not in a SamTerminal project');
    });

    it('should remove plugin from config', async () => {
      await createProjectConfig({
        plugins: [
          { name: '@samterminal/plugin-telegram', enabled: true },
          { name: '@samterminal/plugin-ai', enabled: true },
        ],
      });

      await pluginRemove('telegram');

      const config = await fs.readJSON(path.join(tempDir, 'samterminal.config.json'));
      expect(config.plugins).not.toContainEqual(
        expect.objectContaining({ name: '@samterminal/plugin-telegram' }),
      );
      expect(config.plugins).toContainEqual(
        expect.objectContaining({ name: '@samterminal/plugin-ai' }),
      );
    });

    it('should call package manager remove', async () => {
      const { spawnSync } = childProcess;
      await createProjectConfig();

      await pluginRemove('telegram');

      expect(spawnSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([expect.stringMatching(/uninstall|remove/)]),
        expect.any(Object),
      );
    });

    it('should return success on remove', async () => {
      await createProjectConfig({
        plugins: [{ name: '@samterminal/plugin-telegram', enabled: true }],
      });

      const result = await pluginRemove('telegram');

      expect(result.success).toBe(true);
    });
  });

  describe('pluginList', () => {
    it('should fail if not in project directory', async () => {
      const result = await pluginList();

      expect(result.success).toBe(false);
    });

    it('should list installed plugins', async () => {
      await createProjectConfig({
        plugins: [
          { name: '@samterminal/plugin-telegram', enabled: true },
          { name: '@samterminal/plugin-ai', enabled: false },
        ],
      });

      const result = await pluginList();

      expect(result.success).toBe(true);
      expect(result.data?.plugins).toHaveLength(2);
    });

    it('should return empty list when no plugins', async () => {
      await createProjectConfig();

      const result = await pluginList();

      expect(result.success).toBe(true);
      expect(result.data?.plugins).toHaveLength(0);
    });
  });

  describe('pluginEnable', () => {
    it('should fail if not in project directory', async () => {
      const result = await pluginEnable('telegram');

      expect(result.success).toBe(false);
    });

    it('should fail if plugin not found', async () => {
      await createProjectConfig();

      const result = await pluginEnable('telegram');

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('not found');
    });

    it('should enable a disabled plugin', async () => {
      await createProjectConfig({
        plugins: [{ name: '@samterminal/plugin-telegram', enabled: false }],
      });

      const result = await pluginEnable('telegram');

      expect(result.success).toBe(true);

      const config = await fs.readJSON(path.join(tempDir, 'samterminal.config.json'));
      expect(config.plugins[0].enabled).toBe(true);
    });
  });

  describe('pluginDisable', () => {
    it('should fail if not in project directory', async () => {
      const result = await pluginDisable('telegram');

      expect(result.success).toBe(false);
    });

    it('should fail if plugin not found', async () => {
      await createProjectConfig();

      const result = await pluginDisable('telegram');

      expect(result.success).toBe(false);
    });

    it('should disable an enabled plugin', async () => {
      await createProjectConfig({
        plugins: [{ name: '@samterminal/plugin-telegram', enabled: true }],
      });

      const result = await pluginDisable('telegram');

      expect(result.success).toBe(true);

      const config = await fs.readJSON(path.join(tempDir, 'samterminal.config.json'));
      expect(config.plugins[0].enabled).toBe(false);
    });
  });
});
