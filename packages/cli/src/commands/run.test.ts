/**
 * Run command tests
 */

import { jest } from '@jest/globals';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import type { ProjectConfig } from '../types.js';

// Mock child_process using unstable_mockModule for ESM compatibility
jest.unstable_mockModule('child_process', () => ({
  spawn: jest.fn(() => ({
    on: jest.fn((event: string, callback: (code: number) => void) => {
      if (event === 'exit') {
        // Simulate immediate exit for tests
        setTimeout(() => callback(0), 10);
      }
    }),
    kill: jest.fn(),
  })),
  execSync: jest.fn(),
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

const { runCommand, stopAgent } = await import('./run.js');
const childProcess = await import('child_process');

// Mock console
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('Run Command', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `samterminal-run-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
    await fs.ensureDir(path.join(tempDir, 'src'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.remove(tempDir);
  });

  const createProject = async (entryFile = 'src/index.ts') => {
    const config: ProjectConfig = {
      name: 'test-project',
      version: '1.0.0',
      samterminalVersion: '^1.0.0',
      plugins: [],
    };
    await fs.writeFile(
      path.join(tempDir, 'samterminal.config.json'),
      JSON.stringify(config, null, 2),
    );
    await fs.writeFile(
      path.join(tempDir, entryFile),
      'console.log("Hello");',
    );
  };

  describe('runCommand', () => {
    it('should fail if not in project directory', async () => {
      const result = await runCommand();

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Not in a SamTerminal project');
    });

    it('should fail if no entry point found', async () => {
      const config: ProjectConfig = {
        name: 'test-project',
        version: '1.0.0',
        samterminalVersion: '^1.0.0',
        plugins: [],
      };
      await fs.writeFile(
        path.join(tempDir, 'samterminal.config.json'),
        JSON.stringify(config, null, 2),
      );

      const result = await runCommand();

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Entry point not found');
    });

    it('should find src/index.ts entry point', async () => {
      await createProject('src/index.ts');
      const { spawn } = childProcess;

      await runCommand();

      expect(spawn).toHaveBeenCalledWith(
        'npx',
        expect.arrayContaining(['tsx', expect.stringContaining('index.ts')]),
        expect.any(Object),
      );
    });

    it('should find src/index.js entry point', async () => {
      await createProject('src/index.js');
      const { spawn } = childProcess;

      await runCommand();

      expect(spawn).toHaveBeenCalledWith(
        'node',
        expect.arrayContaining([expect.stringContaining('index.js')]),
        expect.any(Object),
      );
    });

    it('should use watch mode when specified', async () => {
      await createProject('src/index.ts');
      const { spawn } = childProcess;

      await runCommand({ watch: true });

      expect(spawn).toHaveBeenCalledWith(
        'npx',
        expect.arrayContaining(['tsx', 'watch']),
        expect.any(Object),
      );
    });

    it('should set PORT environment variable', async () => {
      await createProject('src/index.ts');
      const { spawn } = childProcess;

      await runCommand({ port: 4000 });

      expect(spawn).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        expect.objectContaining({
          env: expect.objectContaining({ PORT: '4000' }),
        }),
      );
    });

    it('should set verbose logging', async () => {
      await createProject('src/index.ts');
      const { spawn } = childProcess;

      await runCommand({ verbose: true });

      expect(spawn).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        expect.objectContaining({
          env: expect.objectContaining({ LOG_LEVEL: 'debug' }),
        }),
      );
    });

    it('should set environment', async () => {
      await createProject('src/index.ts');
      const { spawn } = childProcess;

      await runCommand({ env: 'production' });

      expect(spawn).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        expect.objectContaining({
          env: expect.objectContaining({ NODE_ENV: 'production' }),
        }),
      );
    });
  });

  describe('stopAgent', () => {
    it('should stop running agent', async () => {
      await createProject('src/index.ts');

      // Start and immediately stop
      const runPromise = runCommand();

      // Wait a bit for the process to "start"
      await new Promise(resolve => setTimeout(resolve, 5));

      stopAgent();

      // The promise should resolve
      const result = await runPromise;
      expect(result).toBeDefined();
    });
  });
});
