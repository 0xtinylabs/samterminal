/**
 * Basic Agent Example
 *
 * This is the simplest SamTerminal agent setup.
 * It demonstrates core concepts without any plugins.
 */

import { createCore, type AgentConfig } from '@samterminal/core';

async function main() {
  console.log('=== SamTerminal Basic Agent Example ===\n');

  // Step 1: Create a core instance
  const core = createCore({
    logLevel: 'debug', // Enable debug logging for learning
  });

  // Step 2: Initialize the core
  console.log('1. Initializing core...');
  await core.initialize();
  console.log('   Core initialized!\n');

  // Step 3: Start the core
  console.log('2. Starting core...');
  await core.start();
  console.log('   Core started!\n');

  // Step 4: Create an agent
  console.log('3. Creating agent...');
  const agentConfig: AgentConfig = {
    name: 'basic-agent',
    description: 'A minimal SamTerminal agent',
    plugins: [], // No plugins for basic example
  };

  const agent = await core.createAgent(agentConfig);
  console.log(`   Agent created: ${agent.name}\n`);

  // Step 5: Demonstrate event system
  console.log('4. Setting up event listeners...');

  core.events.on('agent:started', (data) => {
    console.log(`   Event: Agent ${data.name} started`);
  });

  core.events.on('agent:stopped', (data) => {
    console.log(`   Event: Agent ${data.name} stopped`);
  });

  // Step 6: Demonstrate hooks
  console.log('5. Registering hooks...');

  core.hooks.register({
    name: 'my-custom-hook',
    event: 'action:before',
    handler: async () => {
      console.log(`   Hook triggered: action:before`);
    },
  });

  // Step 7: Show runtime state
  console.log('\n6. Runtime Information:');
  console.log(`   Version: ${core.getVersion()}`);
  console.log(`   Agent: ${agent.name} (${agent.status})`);
  console.log(`   Plugins loaded: ${core.plugins.getAll().length}`);

  // Step 8: Cleanup
  console.log('\n7. Stopping agent...');
  await core.stop();
  console.log('   Agent stopped!\n');

  console.log('=== Basic Agent Example Complete ===');
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
