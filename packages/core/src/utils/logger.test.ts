/**
 * Logger tests
 */


import { Logger, createLogger, logger } from './logger.js';
import type { LogLevel } from '../types/index.js';

describe('Logger', () => {
  let consoleSpy: {
    debug: ReturnType<typeof jest.spyOn>;
    info: ReturnType<typeof jest.spyOn>;
    warn: ReturnType<typeof jest.spyOn>;
    error: ReturnType<typeof jest.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      debug: jest.spyOn(console, 'debug').mockImplementation(() => {}),
      info: jest.spyOn(console, 'info').mockImplementation(() => {}),
      warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
      error: jest.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create logger with default config', () => {
      const log = new Logger();
      log.info('test');

      expect(consoleSpy.info).toHaveBeenCalled();
    });

    it('should create logger with custom config', () => {
      const log = new Logger({ level: 'warn' });
      log.info('test');
      log.warn('warning');

      expect(consoleSpy.info).not.toHaveBeenCalled();
      expect(consoleSpy.warn).toHaveBeenCalled();
    });

    it('should create logger with context', () => {
      const log = new Logger({}, 'TestContext');
      log.info('test');

      const output = consoleSpy.info.mock.calls[0][0];
      expect(output).toContain('TestContext');
    });
  });

  describe('log levels', () => {
    it('should log debug when level is debug', () => {
      const log = new Logger({ level: 'debug' });
      log.debug('debug message');

      expect(consoleSpy.debug).toHaveBeenCalled();
    });

    it('should not log debug when level is info', () => {
      const log = new Logger({ level: 'info' });
      log.debug('debug message');

      expect(consoleSpy.debug).not.toHaveBeenCalled();
    });

    it('should log info when level is info', () => {
      const log = new Logger({ level: 'info' });
      log.info('info message');

      expect(consoleSpy.info).toHaveBeenCalled();
    });

    it('should not log info when level is warn', () => {
      const log = new Logger({ level: 'warn' });
      log.info('info message');

      expect(consoleSpy.info).not.toHaveBeenCalled();
    });

    it('should log warn when level is warn', () => {
      const log = new Logger({ level: 'warn' });
      log.warn('warn message');

      expect(consoleSpy.warn).toHaveBeenCalled();
    });

    it('should not log warn when level is error', () => {
      const log = new Logger({ level: 'error' });
      log.warn('warn message');

      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });

    it('should log error when level is error', () => {
      const log = new Logger({ level: 'error' });
      log.error('error message');

      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should always log error regardless of level', () => {
      const log = new Logger({ level: 'error' });
      log.debug('debug');
      log.info('info');
      log.warn('warn');
      log.error('error');

      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.info).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });

  describe('setLevel', () => {
    it('should change log level', () => {
      const log = new Logger({ level: 'info' });
      log.debug('should not log');
      expect(consoleSpy.debug).not.toHaveBeenCalled();

      log.setLevel('debug');
      log.debug('should log');
      expect(consoleSpy.debug).toHaveBeenCalled();
    });
  });

  describe('formatting', () => {
    it('should include timestamp when enabled', () => {
      const log = new Logger({ timestamps: true, colors: false });
      log.info('test');

      const output = consoleSpy.info.mock.calls[0][0];
      // ISO timestamp format check
      expect(output).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should not include timestamp when disabled', () => {
      const log = new Logger({ timestamps: false, colors: false });
      log.info('test');

      const output = consoleSpy.info.mock.calls[0][0];
      expect(output).not.toMatch(/\d{4}-\d{2}-\d{2}T/);
    });

    it('should include log level', () => {
      const log = new Logger({ colors: false });
      log.info('test');

      const output = consoleSpy.info.mock.calls[0][0];
      expect(output).toContain('INFO');
    });

    it('should include prefix when configured', () => {
      const log = new Logger({ prefix: 'MyApp', colors: false });
      log.info('test');

      const output = consoleSpy.info.mock.calls[0][0];
      expect(output).toContain('[MyApp]');
    });

    it('should include context', () => {
      const log = new Logger({ colors: false }, 'MyContext');
      log.info('test');

      const output = consoleSpy.info.mock.calls[0][0];
      expect(output).toContain('[MyContext]');
    });

    it('should include message', () => {
      const log = new Logger({ colors: false });
      log.info('test message');

      const output = consoleSpy.info.mock.calls[0][0];
      expect(output).toContain('test message');
    });

    it('should format meta as JSON', () => {
      const log = new Logger({ colors: false });
      log.info('test', { key: 'value' });

      const output = consoleSpy.info.mock.calls[0][0];
      expect(output).toContain('{"key":"value"}');
    });

    it('should not include meta when empty', () => {
      const log = new Logger({ colors: false });
      log.info('test', {});

      const output = consoleSpy.info.mock.calls[0][0];
      expect(output).not.toContain('{}');
    });
  });

  describe('colors', () => {
    it('should include ANSI color codes when enabled', () => {
      const log = new Logger({ colors: true });
      log.info('test');

      const output = consoleSpy.info.mock.calls[0][0];
      // Check for ANSI escape code
      expect(output).toContain('\x1b[');
    });

    it('should not include ANSI color codes when disabled', () => {
      const log = new Logger({ colors: false });
      log.info('test');

      const output = consoleSpy.info.mock.calls[0][0];
      expect(output).not.toContain('\x1b[');
    });
  });

  describe('child', () => {
    it('should create child logger with context', () => {
      const parent = new Logger({ prefix: 'Parent', colors: false });
      const child = parent.child('ChildContext');

      child.info('test');

      const output = consoleSpy.info.mock.calls[0][0];
      expect(output).toContain('[ChildContext]');
      expect(output).toContain('[Parent]');
    });

    it('should inherit parent settings', () => {
      const parent = new Logger({ level: 'warn', prefix: 'Parent' });
      const child = parent.child('Child');

      child.info('should not log');
      child.warn('should log');

      expect(consoleSpy.info).not.toHaveBeenCalled();
      expect(consoleSpy.warn).toHaveBeenCalled();
    });
  });

  describe('debug', () => {
    it('should log debug message', () => {
      const log = new Logger({ level: 'debug' });
      log.debug('debug message');

      expect(consoleSpy.debug).toHaveBeenCalled();
    });

    it('should log debug with meta', () => {
      const log = new Logger({ level: 'debug', colors: false });
      log.debug('debug message', { data: 'test' });

      const output = consoleSpy.debug.mock.calls[0][0];
      expect(output).toContain('{"data":"test"}');
    });
  });

  describe('info', () => {
    it('should log info message', () => {
      const log = new Logger();
      log.info('info message');

      expect(consoleSpy.info).toHaveBeenCalled();
    });

    it('should log info with meta', () => {
      const log = new Logger({ colors: false });
      log.info('info message', { data: 'test' });

      const output = consoleSpy.info.mock.calls[0][0];
      expect(output).toContain('{"data":"test"}');
    });
  });

  describe('warn', () => {
    it('should log warn message', () => {
      const log = new Logger();
      log.warn('warn message');

      expect(consoleSpy.warn).toHaveBeenCalled();
    });

    it('should log warn with meta', () => {
      const log = new Logger({ colors: false });
      log.warn('warn message', { data: 'test' });

      const output = consoleSpy.warn.mock.calls[0][0];
      expect(output).toContain('{"data":"test"}');
    });
  });

  describe('error', () => {
    it('should log error message', () => {
      const log = new Logger();
      log.error('error message');

      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should log error with meta', () => {
      const log = new Logger({ colors: false });
      log.error('error message', { data: 'test' });

      const output = consoleSpy.error.mock.calls[0][0];
      expect(output).toContain('{"data":"test"}');
    });

    it('should log Error object', () => {
      const log = new Logger({ colors: false });
      const error = new Error('Test error');
      log.error('error occurred', error);

      const output = consoleSpy.error.mock.calls[0][0];
      expect(output).toContain('Test error');
      expect(output).toContain('error');
    });

    it('should include stack trace for Error objects', () => {
      const log = new Logger({ colors: false });
      const error = new Error('Test error');
      log.error('error occurred', error);

      const output = consoleSpy.error.mock.calls[0][0];
      expect(output).toContain('stack');
    });

    it('should merge meta when logging Error', () => {
      const log = new Logger({ colors: false });
      const error = new Error('Test error');
      log.error('error occurred', error, { extra: 'data' });

      const output = consoleSpy.error.mock.calls[0][0];
      expect(output).toContain('extra');
      expect(output).toContain('data');
    });
  });

  describe('createEntry', () => {
    it('should create log entry object', () => {
      const log = new Logger({}, 'TestContext');
      const entry = log.createEntry('info', 'test message', { key: 'value' });

      expect(entry.level).toBe('info');
      expect(entry.message).toBe('test message');
      expect(entry.timestamp).toBeInstanceOf(Date);
      expect(entry.context).toBe('TestContext');
      expect(entry.meta).toEqual({ key: 'value' });
    });

    it('should create entry without context', () => {
      const log = new Logger();
      const entry = log.createEntry('warn', 'warning');

      expect(entry.context).toBeUndefined();
    });

    it('should create entry without meta', () => {
      const log = new Logger();
      const entry = log.createEntry('error', 'error message');

      expect(entry.meta).toBeUndefined();
    });
  });
});

describe('createLogger', () => {
  let consoleSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create Logger instance', () => {
    const log = createLogger();
    expect(log).toBeInstanceOf(Logger);
  });

  it('should accept config', () => {
    const log = createLogger({ level: 'warn' });
    log.info('test');

    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('should accept context', () => {
    const log = createLogger({ colors: false }, 'MyContext');
    log.info('test');

    const output = consoleSpy.mock.calls[0][0];
    expect(output).toContain('[MyContext]');
  });
});

describe('default logger', () => {
  let consoleSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be a Logger instance', () => {
    expect(logger).toBeInstanceOf(Logger);
  });

  it('should have SamTerminal prefix', () => {
    // Access internal config through method
    logger.info('test');
    const output = consoleSpy.mock.calls[0][0];
    expect(output).toContain('[SamTerminal]');
  });
});
