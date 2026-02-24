/**
 * Logger utility tests
 */


import {
  setLogLevel,
  getLogLevel,
  debug,
  info,
  success,
  warn,
  error,
  blank,
  title,
  step,
  createLogger,
  logger,
} from './logger.js';

describe('Logger Utilities', () => {
  let consoleLogSpy: ReturnType<typeof jest.spyOn>;
  let consoleErrorSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    setLogLevel('info'); // Reset to default
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('setLogLevel and getLogLevel', () => {
    it('should set and get log level', () => {
      setLogLevel('debug');
      expect(getLogLevel()).toBe('debug');

      setLogLevel('warn');
      expect(getLogLevel()).toBe('warn');
    });
  });

  describe('debug', () => {
    it('should not log when level is info', () => {
      setLogLevel('info');
      debug('test message');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should log when level is debug', () => {
      setLogLevel('debug');
      debug('test message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should include DEBUG prefix', () => {
      setLogLevel('debug');
      debug('test message');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
        // No additional args
      );
    });

    it('should pass additional arguments', () => {
      setLogLevel('debug');
      debug('message', { key: 'value' });
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.any(String),
        { key: 'value' },
      );
    });
  });

  describe('info', () => {
    it('should log when level is info', () => {
      setLogLevel('info');
      info('test message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should not log when level is warn', () => {
      setLogLevel('warn');
      info('test message');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should include INFO prefix', () => {
      info('test message');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
      );
    });
  });

  describe('success', () => {
    it('should log when level is info', () => {
      setLogLevel('info');
      success('test message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should include OK prefix', () => {
      success('test message');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[OK]'),
      );
    });
  });

  describe('warn', () => {
    it('should log when level is warn', () => {
      setLogLevel('warn');
      warn('test message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log when level is info', () => {
      setLogLevel('info');
      warn('test message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should not log when level is error', () => {
      setLogLevel('error');
      warn('test message');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should include WARN prefix', () => {
      warn('test message');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]'),
      );
    });
  });

  describe('error', () => {
    it('should always log at any level', () => {
      setLogLevel('error');
      error('test message');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should use console.error', () => {
      error('test message');
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should include ERROR prefix', () => {
      error('test message');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
      );
    });
  });

  describe('blank', () => {
    it('should log empty line', () => {
      blank();
      expect(consoleLogSpy).toHaveBeenCalledWith();
    });
  });

  describe('title', () => {
    it('should log title with underline', () => {
      title('Test Title');
      expect(consoleLogSpy).toHaveBeenCalledTimes(3); // blank + title + underline
    });
  });

  describe('step', () => {
    it('should log step with number', () => {
      step(1, 3, 'Installing...');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[1/3]'),
        'Installing...',
      );
    });
  });

  describe('createLogger', () => {
    it('should create logger with prefix', () => {
      const log = createLogger('MyPlugin');
      log.info('test message');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[MyPlugin]'),
      );
    });

    it('should create logger without prefix', () => {
      const log = createLogger();
      log.info('test message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should have all log methods', () => {
      const log = createLogger('Test');
      expect(log.debug).toBeDefined();
      expect(log.info).toBeDefined();
      expect(log.success).toBeDefined();
      expect(log.warn).toBeDefined();
      expect(log.error).toBeDefined();
    });
  });

  describe('logger object', () => {
    it('should have all methods', () => {
      expect(logger.debug).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.success).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.blank).toBeDefined();
      expect(logger.title).toBeDefined();
      expect(logger.step).toBeDefined();
      expect(logger.setLevel).toBeDefined();
      expect(logger.getLevel).toBeDefined();
    });

    it('should set and get level', () => {
      logger.setLevel('debug');
      expect(logger.getLevel()).toBe('debug');
    });
  });
});
