/**
 * Dev command tests
 */

import { jest } from '@jest/globals';

// Mock run module using unstable_mockModule for ESM compatibility
jest.unstable_mockModule('./run.js', () => ({
  runCommand: jest.fn().mockResolvedValue({ success: true }),
}));

const { devCommand } = await import('./dev.js');
const runModule = await import('./run.js');

describe('Dev Command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('devCommand', () => {
    it('should call runCommand with watch: true', async () => {
      await devCommand();

      expect(runModule.runCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          watch: true,
        }),
      );
    });

    it('should set env to development by default', async () => {
      await devCommand();

      expect(runModule.runCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          env: 'development',
        }),
      );
    });

    it('should preserve custom env if provided', async () => {
      await devCommand({ env: 'staging' });

      expect(runModule.runCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          env: 'staging',
          watch: true,
        }),
      );
    });

    it('should pass through port option', async () => {
      await devCommand({ port: 4000 });

      expect(runModule.runCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 4000,
          watch: true,
          env: 'development',
        }),
      );
    });

    it('should pass through verbose option', async () => {
      await devCommand({ verbose: true });

      expect(runModule.runCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          verbose: true,
          watch: true,
        }),
      );
    });

    it('should return result from runCommand', async () => {
      const mockResult = { success: true, message: 'Agent started' };
      jest.mocked(runModule.runCommand).mockResolvedValue(mockResult);

      const result = await devCommand();

      expect(result).toEqual(mockResult);
    });

    it('should return error result if runCommand fails', async () => {
      const mockResult = {
        success: false,
        error: new Error('Failed to start'),
      };
      jest.mocked(runModule.runCommand).mockResolvedValue(mockResult);

      const result = await devCommand();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should override watch even if explicitly set to false', async () => {
      await devCommand({ watch: false } as any);

      expect(runModule.runCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          watch: true,
        }),
      );
    });
  });
});
