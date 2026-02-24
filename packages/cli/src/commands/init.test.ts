/**
 * Init command tests
 */

import { jest } from '@jest/globals';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

// Mock child_process using unstable_mockModule for ESM compatibility
jest.unstable_mockModule('child_process', () => ({
  execSync: jest.fn(),
  spawnSync: jest.fn(() => ({ status: 0, stdout: '', stderr: '' })),
}));

// Mock inquirer
jest.unstable_mockModule('inquirer', () => ({
  default: {
    prompt: jest.fn(),
  },
}));

// Mock ora
jest.unstable_mockModule('ora', () => ({
  default: jest.fn(() => ({
    start: jest.fn().mockReturnThis(),
    stop: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
  })),
}));

const { initCommand } = await import('./init.js');
const childProcess = await import('child_process');
const inquirer = await import('inquirer');

// Mock console
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('Init Command', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `samterminal-init-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
    originalCwd = process.cwd();
    process.chdir(tempDir);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.remove(tempDir);
  });

  describe('initCommand with options', () => {
    it('should create project with provided options', async () => {
      const result = await initCommand(undefined, {
        name: 'test-project',
        template: 'basic',
        typescript: true,
        packageManager: 'pnpm',
        skipInstall: true,
      });

      expect(result.success).toBe(true);
      expect(result.data?.path).toContain('test-project');
    });

    it('should create project directory', async () => {
      await initCommand(undefined, {
        name: 'my-project',
        template: 'basic',
        typescript: true,
        skipInstall: true,
      });

      expect(await fs.pathExists(path.join(tempDir, 'my-project'))).toBe(true);
    });

    it('should create package.json', async () => {
      await initCommand(undefined, {
        name: 'my-project',
        template: 'basic',
        typescript: true,
        skipInstall: true,
      });

      const pkgPath = path.join(tempDir, 'my-project', 'package.json');
      expect(await fs.pathExists(pkgPath)).toBe(true);

      const pkg = await fs.readJSON(pkgPath);
      expect(pkg.name).toBe('my-project');
    });

    it('should create samterminal.config.json', async () => {
      await initCommand(undefined, {
        name: 'my-project',
        template: 'basic',
        typescript: true,
        skipInstall: true,
      });

      const configPath = path.join(tempDir, 'my-project', 'samterminal.config.json');
      expect(await fs.pathExists(configPath)).toBe(true);
    });

    it('should create TypeScript files for TS projects', async () => {
      await initCommand(undefined, {
        name: 'ts-project',
        template: 'basic',
        typescript: true,
        skipInstall: true,
      });

      expect(
        await fs.pathExists(path.join(tempDir, 'ts-project', 'src/index.ts')),
      ).toBe(true);
      expect(
        await fs.pathExists(path.join(tempDir, 'ts-project', 'tsconfig.json')),
      ).toBe(true);
    });

    it('should create JavaScript files for JS projects', async () => {
      await initCommand(undefined, {
        name: 'js-project',
        template: 'basic',
        typescript: false,
        skipInstall: true,
      });

      expect(
        await fs.pathExists(path.join(tempDir, 'js-project', 'src/index.js')),
      ).toBe(true);
      expect(
        await fs.pathExists(path.join(tempDir, 'js-project', 'tsconfig.json')),
      ).toBe(false);
    });

    it('should create .env.example', async () => {
      await initCommand(undefined, {
        name: 'my-project',
        template: 'basic',
        typescript: true,
        skipInstall: true,
      });

      expect(
        await fs.pathExists(path.join(tempDir, 'my-project', '.env.example')),
      ).toBe(true);
    });

    it('should create .gitignore', async () => {
      await initCommand(undefined, {
        name: 'my-project',
        template: 'basic',
        typescript: true,
        skipInstall: true,
      });

      const gitignorePath = path.join(tempDir, 'my-project', '.gitignore');
      expect(await fs.pathExists(gitignorePath)).toBe(true);

      const content = await fs.readFile(gitignorePath, 'utf-8');
      expect(content).toContain('node_modules');
    });

    it('should create README.md', async () => {
      await initCommand(undefined, {
        name: 'my-project',
        template: 'basic',
        typescript: true,
        skipInstall: true,
      });

      const readmePath = path.join(tempDir, 'my-project', 'README.md');
      expect(await fs.pathExists(readmePath)).toBe(true);

      const content = await fs.readFile(readmePath, 'utf-8');
      expect(content).toContain('# my-project');
    });
  });

  describe('initCommand with plugins', () => {
    it('should include plugins in package.json', async () => {
      await initCommand(undefined, {
        name: 'plugin-project',
        template: 'custom',
        plugins: ['telegram', 'ai'],
        typescript: true,
        skipInstall: true,
      });

      const pkgPath = path.join(tempDir, 'plugin-project', 'package.json');
      const pkg = await fs.readJSON(pkgPath);

      expect(pkg.dependencies['@samterminal/plugin-telegram']).toBeDefined();
      expect(pkg.dependencies['@samterminal/plugin-ai']).toBeDefined();
    });

    it('should include plugin imports in entry file', async () => {
      await initCommand(undefined, {
        name: 'plugin-project',
        template: 'custom',
        plugins: ['telegram'],
        typescript: true,
        skipInstall: true,
      });

      const entryPath = path.join(tempDir, 'plugin-project', 'src/index.ts');
      const content = await fs.readFile(entryPath, 'utf-8');

      expect(content).toContain('createTelegramPlugin');
    });

    it('should include plugin env vars in .env.example', async () => {
      await initCommand(undefined, {
        name: 'plugin-project',
        template: 'custom',
        plugins: ['telegram', 'ai'],
        typescript: true,
        skipInstall: true,
      });

      const envPath = path.join(tempDir, 'plugin-project', '.env.example');
      const content = await fs.readFile(envPath, 'utf-8');

      expect(content).toContain('TELEGRAM_BOT_TOKEN');
      expect(content).toContain('OPENAI_API_KEY');
    });
  });

  describe('initCommand with templates', () => {
    it('should use basic template', async () => {
      const result = await initCommand(undefined, {
        name: 'basic-project',
        template: 'basic',
        typescript: true,
        skipInstall: true,
      });

      expect(result.success).toBe(true);
    });

    it('should use telegram-bot template with plugins', async () => {
      // Note: When options are provided directly, plugins must be explicitly set
      // The getTemplatePlugins is only called in interactive prompt mode
      await initCommand(undefined, {
        name: 'telegram-project',
        template: 'telegram-bot',
        plugins: ['telegram', 'ai', 'onboarding'], // Explicitly set plugins
        typescript: true,
        skipInstall: true,
      });

      const pkgPath = path.join(tempDir, 'telegram-project', 'package.json');
      const pkg = await fs.readJSON(pkgPath);

      // telegram-bot template includes telegram, ai, onboarding plugins
      expect(pkg.dependencies['@samterminal/plugin-telegram']).toBeDefined();
      expect(pkg.dependencies['@samterminal/plugin-ai']).toBeDefined();
      expect(pkg.dependencies['@samterminal/plugin-onboarding']).toBeDefined();
    });
  });

  describe('initCommand install', () => {
    it('should install dependencies when skipInstall is false', async () => {
      const { spawnSync } = childProcess;

      await initCommand(undefined, {
        name: 'install-project',
        template: 'basic',
        typescript: true,
        packageManager: 'pnpm',
        skipInstall: false,
      });

      expect(spawnSync).toHaveBeenCalledWith(
        'pnpm',
        ['install'],
        expect.objectContaining({
          cwd: expect.stringContaining('install-project'),
        }),
      );
    });

    it('should use npm install for npm', async () => {
      const { spawnSync } = childProcess;

      await initCommand(undefined, {
        name: 'npm-project',
        template: 'basic',
        typescript: true,
        packageManager: 'npm',
        skipInstall: false,
      });

      expect(spawnSync).toHaveBeenCalledWith(
        'npm',
        ['install'],
        expect.any(Object),
      );
    });

    it('should use yarn for yarn', async () => {
      const { spawnSync } = childProcess;

      await initCommand(undefined, {
        name: 'yarn-project',
        template: 'basic',
        typescript: true,
        packageManager: 'yarn',
        skipInstall: false,
      });

      expect(spawnSync).toHaveBeenCalledWith('yarn', [], expect.any(Object));
    });

    it('should not install dependencies when skipInstall is true', async () => {
      const { spawnSync } = childProcess;

      await initCommand(undefined, {
        name: 'skip-install-project',
        template: 'basic',
        typescript: true,
        skipInstall: true,
      });

      expect(spawnSync).not.toHaveBeenCalled();
    });

    it('should handle install failure gracefully', async () => {
      const { spawnSync } = childProcess;
      jest.mocked(spawnSync).mockReturnValue({ status: 1, stderr: Buffer.from('Install failed'), stdout: Buffer.from(''), pid: 0, output: [], signal: null } as never);

      const result = await initCommand(undefined, {
        name: 'fail-install-project',
        template: 'basic',
        typescript: true,
        packageManager: 'pnpm',
        skipInstall: false,
      });

      // Should still succeed, just warn about install failure
      expect(result.success).toBe(true);
    });
  });

  describe('initCommand with prompts', () => {
    it('should prompt for overwrite if directory exists', async () => {
      const targetDir = path.join(tempDir, 'existing-project');
      await fs.ensureDir(targetDir);

      jest.mocked(inquirer.default.prompt).mockResolvedValue({ overwrite: true });

      await initCommand(undefined, {
        name: 'existing-project',
        template: 'basic',
        typescript: true,
        skipInstall: true,
      });

      expect(inquirer.default.prompt).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'overwrite',
          }),
        ]),
      );
    });

    it('should cancel if user does not want to overwrite', async () => {
      const targetDir = path.join(tempDir, 'existing-project');
      await fs.ensureDir(targetDir);

      jest.mocked(inquirer.default.prompt).mockResolvedValue({ overwrite: false });

      const result = await initCommand(undefined, {
        name: 'existing-project',
        template: 'basic',
        typescript: true,
        skipInstall: true,
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('cancelled');
    });

    it('should remove existing directory if user confirms overwrite', async () => {
      const targetDir = path.join(tempDir, 'overwrite-project');
      await fs.ensureDir(targetDir);
      await fs.writeFile(path.join(targetDir, 'old-file.txt'), 'old content');

      jest.mocked(inquirer.default.prompt).mockResolvedValue({ overwrite: true });

      await initCommand(undefined, {
        name: 'overwrite-project',
        template: 'basic',
        typescript: true,
        skipInstall: true,
      });

      // Old file should be gone
      expect(
        await fs.pathExists(path.join(targetDir, 'old-file.txt')),
      ).toBe(false);
      // New files should exist
      expect(
        await fs.pathExists(path.join(targetDir, 'package.json')),
      ).toBe(true);
    });
  });

  describe('initCommand error handling', () => {
    it('should return error on scaffold failure', async () => {
      // Create a directory that will cause issues
      const targetDir = path.join(tempDir, 'error-project');
      await fs.ensureDir(targetDir);
      await fs.chmod(targetDir, 0o444); // Read-only

      const result = await initCommand(undefined, {
        name: 'error-project/sub', // This should fail
        template: 'basic',
        typescript: true,
        skipInstall: true,
      });

      // Restore permissions for cleanup
      await fs.chmod(targetDir, 0o755);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('initCommand return values', () => {
    it('should return success with project path', async () => {
      const result = await initCommand(undefined, {
        name: 'success-project',
        template: 'basic',
        typescript: true,
        skipInstall: true,
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('success-project');
      expect(result.data?.path).toContain('success-project');
    });
  });
});
