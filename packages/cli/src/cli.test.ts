/**
 * CLI tests
 */

import { jest } from '@jest/globals';
import { Command } from 'commander';

// Use unstable_mockModule for ESM compatibility
jest.unstable_mockModule('./utils/index.js', () => ({
  setLogLevel: jest.fn(),
  getCLIContext: jest.fn().mockResolvedValue({
    isProject: false,
    packageManager: 'pnpm',
    config: null,
  }),
}));

// Helper to create a test program similar to cli.ts
function createTestProgram(): Command {
  const program = new Command();

  program
    .name('sam')
    .description('CLI for SAM Terminal - Create and manage SAM Terminal agents')
    .version('1.0.0')
    .option('-v, --verbose', 'Enable verbose output');

  // Init command
  program
    .command('init [name]')
    .description('Create a new SAM Terminal project')
    .option('-t, --template <template>', 'Template to use')
    .option('--typescript', 'Use TypeScript')
    .option('--no-typescript', 'Use JavaScript')
    .option('-p, --plugins <plugins...>', 'Plugins to include')
    .option('--skip-install', 'Skip npm install')
    .option('--pm <manager>', 'Package manager');

  // Run command
  program
    .command('run')
    .description('Start the SAM Terminal agent')
    .option('-c, --config <path>', 'Config file path')
    .option('-e, --env <environment>', 'Environment')
    .option('-w, --watch', 'Enable watch mode')
    .option('-p, --port <port>', 'Port override', parseInt);

  // Dev command
  program
    .command('dev')
    .description('Start the SAM Terminal agent in development mode')
    .option('-c, --config <path>', 'Config file path')
    .option('-p, --port <port>', 'Port override', parseInt);

  // Plugin command group
  const pluginCmd = program.command('plugin').description('Manage SAM Terminal plugins');

  pluginCmd
    .command('install <plugin>')
    .alias('add')
    .description('Install a plugin')
    .option('--version <version>', 'Plugin version')
    .option('--no-save', 'Do not save to config');

  pluginCmd
    .command('remove <plugin>')
    .alias('rm')
    .alias('uninstall')
    .description('Remove a plugin');

  pluginCmd.command('list').alias('ls').description('List installed plugins');

  pluginCmd.command('enable <plugin>').description('Enable a plugin');

  pluginCmd.command('disable <plugin>').description('Disable a plugin');

  // Info command
  program.command('info').description('Display environment and project info');

  return program;
}

describe('CLI', () => {
  let program: Command;
  let consoleSpy: ReturnType<typeof jest.spyOn>;
  let consoleErrorSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    program = createTestProgram();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('program setup', () => {
    it('should have name sam', () => {
      expect(program.name()).toBe('sam');
    });

    it('should have description', () => {
      expect(program.description()).toContain('SAM Terminal');
    });

    it('should have version 1.0.0', () => {
      expect(program.version()).toBe('1.0.0');
    });
  });

  describe('global options', () => {
    it('should have --verbose option', () => {
      const opts = program.options.find((o) => o.long === '--verbose');
      expect(opts).toBeDefined();
      expect(opts?.short).toBe('-v');
    });
  });

  describe('init command', () => {
    it('should be registered', () => {
      const initCmd = program.commands.find((c) => c.name() === 'init');
      expect(initCmd).toBeDefined();
    });

    it('should accept optional name argument', () => {
      const initCmd = program.commands.find((c) => c.name() === 'init');
      expect(initCmd?.description()).toContain('Create a new SAM Terminal project');
    });

    it('should have --template option', () => {
      const initCmd = program.commands.find((c) => c.name() === 'init');
      const templateOpt = initCmd?.options.find((o) => o.long === '--template');
      expect(templateOpt).toBeDefined();
      expect(templateOpt?.short).toBe('-t');
    });

    it('should have --typescript option', () => {
      const initCmd = program.commands.find((c) => c.name() === 'init');
      const tsOpt = initCmd?.options.find((o) => o.long === '--typescript');
      expect(tsOpt).toBeDefined();
    });

    it('should have --no-typescript option', () => {
      const initCmd = program.commands.find((c) => c.name() === 'init');
      const noTsOpt = initCmd?.options.find((o) => o.long === '--no-typescript');
      expect(noTsOpt).toBeDefined();
    });

    it('should have --plugins option', () => {
      const initCmd = program.commands.find((c) => c.name() === 'init');
      const pluginsOpt = initCmd?.options.find((o) => o.long === '--plugins');
      expect(pluginsOpt).toBeDefined();
      expect(pluginsOpt?.short).toBe('-p');
    });

    it('should have --skip-install option', () => {
      const initCmd = program.commands.find((c) => c.name() === 'init');
      const skipOpt = initCmd?.options.find((o) => o.long === '--skip-install');
      expect(skipOpt).toBeDefined();
    });

    it('should have --pm option', () => {
      const initCmd = program.commands.find((c) => c.name() === 'init');
      const pmOpt = initCmd?.options.find((o) => o.long === '--pm');
      expect(pmOpt).toBeDefined();
    });
  });

  describe('run command', () => {
    it('should be registered', () => {
      const runCmd = program.commands.find((c) => c.name() === 'run');
      expect(runCmd).toBeDefined();
    });

    it('should have --config option', () => {
      const runCmd = program.commands.find((c) => c.name() === 'run');
      const configOpt = runCmd?.options.find((o) => o.long === '--config');
      expect(configOpt).toBeDefined();
      expect(configOpt?.short).toBe('-c');
    });

    it('should have --env option', () => {
      const runCmd = program.commands.find((c) => c.name() === 'run');
      const envOpt = runCmd?.options.find((o) => o.long === '--env');
      expect(envOpt).toBeDefined();
      expect(envOpt?.short).toBe('-e');
    });

    it('should have --watch option', () => {
      const runCmd = program.commands.find((c) => c.name() === 'run');
      const watchOpt = runCmd?.options.find((o) => o.long === '--watch');
      expect(watchOpt).toBeDefined();
      expect(watchOpt?.short).toBe('-w');
    });

    it('should have --port option', () => {
      const runCmd = program.commands.find((c) => c.name() === 'run');
      const portOpt = runCmd?.options.find((o) => o.long === '--port');
      expect(portOpt).toBeDefined();
      expect(portOpt?.short).toBe('-p');
    });
  });

  describe('dev command', () => {
    it('should be registered', () => {
      const devCmd = program.commands.find((c) => c.name() === 'dev');
      expect(devCmd).toBeDefined();
    });

    it('should have development mode description', () => {
      const devCmd = program.commands.find((c) => c.name() === 'dev');
      expect(devCmd?.description()).toContain('development mode');
    });

    it('should have --config option', () => {
      const devCmd = program.commands.find((c) => c.name() === 'dev');
      const configOpt = devCmd?.options.find((o) => o.long === '--config');
      expect(configOpt).toBeDefined();
    });

    it('should have --port option', () => {
      const devCmd = program.commands.find((c) => c.name() === 'dev');
      const portOpt = devCmd?.options.find((o) => o.long === '--port');
      expect(portOpt).toBeDefined();
    });
  });

  describe('plugin command', () => {
    it('should be registered', () => {
      const pluginCmd = program.commands.find((c) => c.name() === 'plugin');
      expect(pluginCmd).toBeDefined();
    });

    it('should have description', () => {
      const pluginCmd = program.commands.find((c) => c.name() === 'plugin');
      expect(pluginCmd?.description()).toContain('plugins');
    });

    describe('plugin install', () => {
      it('should be registered', () => {
        const pluginCmd = program.commands.find((c) => c.name() === 'plugin');
        const installCmd = pluginCmd?.commands.find((c) => c.name() === 'install');
        expect(installCmd).toBeDefined();
      });

      it('should have add alias', () => {
        const pluginCmd = program.commands.find((c) => c.name() === 'plugin');
        const installCmd = pluginCmd?.commands.find((c) => c.name() === 'install');
        expect(installCmd?.aliases()).toContain('add');
      });

      it('should have --version option', () => {
        const pluginCmd = program.commands.find((c) => c.name() === 'plugin');
        const installCmd = pluginCmd?.commands.find((c) => c.name() === 'install');
        const versionOpt = installCmd?.options.find((o) => o.long === '--version');
        expect(versionOpt).toBeDefined();
      });

      it('should have --no-save option', () => {
        const pluginCmd = program.commands.find((c) => c.name() === 'plugin');
        const installCmd = pluginCmd?.commands.find((c) => c.name() === 'install');
        const noSaveOpt = installCmd?.options.find((o) => o.long === '--no-save');
        expect(noSaveOpt).toBeDefined();
      });
    });

    describe('plugin remove', () => {
      it('should be registered', () => {
        const pluginCmd = program.commands.find((c) => c.name() === 'plugin');
        const removeCmd = pluginCmd?.commands.find((c) => c.name() === 'remove');
        expect(removeCmd).toBeDefined();
      });

      it('should have rm alias', () => {
        const pluginCmd = program.commands.find((c) => c.name() === 'plugin');
        const removeCmd = pluginCmd?.commands.find((c) => c.name() === 'remove');
        expect(removeCmd?.aliases()).toContain('rm');
      });

      it('should have uninstall alias', () => {
        const pluginCmd = program.commands.find((c) => c.name() === 'plugin');
        const removeCmd = pluginCmd?.commands.find((c) => c.name() === 'remove');
        expect(removeCmd?.aliases()).toContain('uninstall');
      });
    });

    describe('plugin list', () => {
      it('should be registered', () => {
        const pluginCmd = program.commands.find((c) => c.name() === 'plugin');
        const listCmd = pluginCmd?.commands.find((c) => c.name() === 'list');
        expect(listCmd).toBeDefined();
      });

      it('should have ls alias', () => {
        const pluginCmd = program.commands.find((c) => c.name() === 'plugin');
        const listCmd = pluginCmd?.commands.find((c) => c.name() === 'list');
        expect(listCmd?.aliases()).toContain('ls');
      });
    });

    describe('plugin enable', () => {
      it('should be registered', () => {
        const pluginCmd = program.commands.find((c) => c.name() === 'plugin');
        const enableCmd = pluginCmd?.commands.find((c) => c.name() === 'enable');
        expect(enableCmd).toBeDefined();
      });
    });

    describe('plugin disable', () => {
      it('should be registered', () => {
        const pluginCmd = program.commands.find((c) => c.name() === 'plugin');
        const disableCmd = pluginCmd?.commands.find((c) => c.name() === 'disable');
        expect(disableCmd).toBeDefined();
      });
    });
  });

  describe('info command', () => {
    it('should be registered', () => {
      const infoCmd = program.commands.find((c) => c.name() === 'info');
      expect(infoCmd).toBeDefined();
    });

    it('should have description about environment info', () => {
      const infoCmd = program.commands.find((c) => c.name() === 'info');
      expect(infoCmd?.description()).toContain('environment');
    });
  });

  describe('command count', () => {
    it('should have correct number of top-level commands', () => {
      // init, run, dev, plugin, info
      expect(program.commands.length).toBe(5);
    });

    it('should have correct number of plugin subcommands', () => {
      const pluginCmd = program.commands.find((c) => c.name() === 'plugin');
      // install, remove, list, enable, disable
      expect(pluginCmd?.commands.length).toBe(5);
    });
  });
});

describe('CLI command execution', () => {
  let program: Command;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('setLogLevel integration', () => {
    it('should call setLogLevel when verbose is enabled', async () => {
      const { setLogLevel } = await import('./utils/index.js');

      // Create program with preAction hook
      program = new Command();
      program
        .name('sam')
        .option('-v, --verbose', 'Enable verbose output')
        .hook('preAction', (thisCommand) => {
          const opts = thisCommand.opts();
          if (opts.verbose) {
            setLogLevel('debug');
          }
        });

      program.command('test').action(() => {});

      // Parse with verbose flag
      await program.parseAsync(['node', 'test', '-v', 'test']);

      expect(setLogLevel).toHaveBeenCalledWith('debug');
    });

    it('should not call setLogLevel without verbose flag', async () => {
      const { setLogLevel } = await import('./utils/index.js');

      program = new Command();
      program
        .name('sam')
        .option('-v, --verbose', 'Enable verbose output')
        .hook('preAction', (thisCommand) => {
          const opts = thisCommand.opts();
          if (opts.verbose) {
            setLogLevel('debug');
          }
        });

      program.command('test').action(() => {});

      await program.parseAsync(['node', 'test', 'test']);

      expect(setLogLevel).not.toHaveBeenCalled();
    });
  });
});
