/**
 * Flow Presets tests
 */


import {
  createEmptyFlow,
  SIMPLE_ACTION_TEMPLATE,
  CONDITIONAL_TEMPLATE,
  ERROR_HANDLING_TEMPLATE,
  SCHEDULED_TEMPLATE,
  FLOW_TEMPLATES,
  getTemplate,
  getTemplatesByCategory,
  createFromTemplate,
  getTemplateCategories,
} from './presets.js';

// Console is mocked in jest.setup.mjs

describe('createEmptyFlow', () => {

  it('should create flow with name', () => {
    const flow = createEmptyFlow('Test Flow');

    expect(flow.name).toBe('Test Flow');
    expect(flow.id).toBeDefined();
  });

  it('should create flow with description', () => {
    const flow = createEmptyFlow('Test Flow', 'A test flow description');

    expect(flow.description).toBe('A test flow description');
  });

  it('should have version 1.0.0', () => {
    const flow = createEmptyFlow('Test Flow');

    expect(flow.version).toBe('1.0.0');
  });

  it('should have a trigger node', () => {
    const flow = createEmptyFlow('Test Flow');

    expect(flow.nodes).toHaveLength(1);
    expect(flow.nodes[0].type).toBe('trigger');
    expect(flow.nodes[0].data.triggerType).toBe('manual');
  });

  it('should have empty edges', () => {
    const flow = createEmptyFlow('Test Flow');

    expect(flow.edges).toEqual([]);
  });

  it('should have empty variables', () => {
    const flow = createEmptyFlow('Test Flow');

    expect(flow.variables).toEqual([]);
  });

  it('should have default settings', () => {
    const flow = createEmptyFlow('Test Flow');

    expect(flow.settings).toEqual({
      maxExecutionTime: 60000,
      retryOnFailure: false,
      logLevel: 'info',
    });
  });

  it('should have timestamps', () => {
    const flow = createEmptyFlow('Test Flow');

    expect(flow.createdAt).toBeInstanceOf(Date);
    expect(flow.updatedAt).toBeInstanceOf(Date);
  });
});

describe('SIMPLE_ACTION_TEMPLATE', () => {
  it('should have correct id', () => {
    expect(SIMPLE_ACTION_TEMPLATE.id).toBe('simple-action');
  });

  it('should have name and description', () => {
    expect(SIMPLE_ACTION_TEMPLATE.name).toBe('Simple Action');
    expect(SIMPLE_ACTION_TEMPLATE.description).toBe('A basic flow with one action');
  });

  it('should be in Basic category', () => {
    expect(SIMPLE_ACTION_TEMPLATE.category).toBe('Basic');
  });

  it('should have trigger, action, and output nodes', () => {
    const nodes = SIMPLE_ACTION_TEMPLATE.flow.nodes;

    expect(nodes).toHaveLength(3);
    expect(nodes.find((n) => n.type === 'trigger')).toBeDefined();
    expect(nodes.find((n) => n.type === 'action')).toBeDefined();
    expect(nodes.find((n) => n.type === 'output')).toBeDefined();
  });

  it('should have correct edges', () => {
    const edges = SIMPLE_ACTION_TEMPLATE.flow.edges;

    expect(edges).toHaveLength(2);
    expect(edges.find((e) => e.source === 'trigger' && e.target === 'action')).toBeDefined();
    expect(edges.find((e) => e.source === 'action' && e.target === 'output')).toBeDefined();
  });
});

describe('CONDITIONAL_TEMPLATE', () => {
  it('should have correct id', () => {
    expect(CONDITIONAL_TEMPLATE.id).toBe('conditional');
  });

  it('should have name and description', () => {
    expect(CONDITIONAL_TEMPLATE.name).toBe('Conditional Flow');
    expect(CONDITIONAL_TEMPLATE.description).toBe('A flow with conditional branching');
  });

  it('should be in Basic category', () => {
    expect(CONDITIONAL_TEMPLATE.category).toBe('Basic');
  });

  it('should have trigger, condition, true/false actions, and output nodes', () => {
    const nodes = CONDITIONAL_TEMPLATE.flow.nodes;

    expect(nodes).toHaveLength(5);
    expect(nodes.find((n) => n.type === 'trigger')).toBeDefined();
    expect(nodes.find((n) => n.type === 'condition')).toBeDefined();
    expect(nodes.find((n) => n.id === 'true-action')).toBeDefined();
    expect(nodes.find((n) => n.id === 'false-action')).toBeDefined();
    expect(nodes.find((n) => n.type === 'output')).toBeDefined();
  });

  it('should have true and false branch edges', () => {
    const edges = CONDITIONAL_TEMPLATE.flow.edges;

    const trueEdge = edges.find((e) => e.source === 'condition' && e.target === 'true-action');
    const falseEdge = edges.find((e) => e.source === 'condition' && e.target === 'false-action');

    expect(trueEdge).toBeDefined();
    expect(falseEdge).toBeDefined();
    expect(trueEdge?.sourceHandle).toBe('true');
    expect(falseEdge?.sourceHandle).toBe('false');
  });
});

describe('ERROR_HANDLING_TEMPLATE', () => {
  it('should have correct id', () => {
    expect(ERROR_HANDLING_TEMPLATE.id).toBe('error-handling');
  });

  it('should have name and description', () => {
    expect(ERROR_HANDLING_TEMPLATE.name).toBe('Error Handling');
    expect(ERROR_HANDLING_TEMPLATE.description).toBe('A flow with error handling');
  });

  it('should be in Basic category', () => {
    expect(ERROR_HANDLING_TEMPLATE.category).toBe('Basic');
  });

  it('should have main action and error handler nodes', () => {
    const nodes = ERROR_HANDLING_TEMPLATE.flow.nodes;

    expect(nodes.find((n) => n.id === 'main-action')).toBeDefined();
    expect(nodes.find((n) => n.id === 'error-handler')).toBeDefined();
  });

  it('should have success and error edges from main action', () => {
    const edges = ERROR_HANDLING_TEMPLATE.flow.edges;

    const successEdge = edges.find(
      (e) => e.source === 'main-action' && e.sourceHandle === 'output',
    );
    const errorEdge = edges.find(
      (e) => e.source === 'main-action' && e.sourceHandle === 'error',
    );

    expect(successEdge).toBeDefined();
    expect(errorEdge).toBeDefined();
    expect(successEdge?.type).toBe('success');
    expect(errorEdge?.type).toBe('failure');
  });
});

describe('SCHEDULED_TEMPLATE', () => {
  it('should have correct id', () => {
    expect(SCHEDULED_TEMPLATE.id).toBe('scheduled');
  });

  it('should have name and description', () => {
    expect(SCHEDULED_TEMPLATE.name).toBe('Scheduled Flow');
    expect(SCHEDULED_TEMPLATE.description).toBe('A flow that runs on a schedule');
  });

  it('should be in Automation category', () => {
    expect(SCHEDULED_TEMPLATE.category).toBe('Automation');
  });

  it('should have schedule trigger', () => {
    const trigger = SCHEDULED_TEMPLATE.flow.nodes.find((n) => n.type === 'trigger');

    expect(trigger?.data.triggerType).toBe('schedule');
    expect(trigger?.data.config.cron).toBe('0 * * * *');
    expect(trigger?.data.config.timezone).toBe('UTC');
  });

  it('should have log output type', () => {
    const output = SCHEDULED_TEMPLATE.flow.nodes.find((n) => n.type === 'output');

    expect(output?.data.outputType).toBe('log');
  });
});

describe('FLOW_TEMPLATES', () => {
  it('should contain all templates', () => {
    expect(FLOW_TEMPLATES).toHaveLength(4);
    expect(FLOW_TEMPLATES).toContain(SIMPLE_ACTION_TEMPLATE);
    expect(FLOW_TEMPLATES).toContain(CONDITIONAL_TEMPLATE);
    expect(FLOW_TEMPLATES).toContain(ERROR_HANDLING_TEMPLATE);
    expect(FLOW_TEMPLATES).toContain(SCHEDULED_TEMPLATE);
  });
});

describe('getTemplate', () => {
  it('should return template by id', () => {
    const template = getTemplate('simple-action');

    expect(template).toBe(SIMPLE_ACTION_TEMPLATE);
  });

  it('should return undefined for unknown id', () => {
    const template = getTemplate('unknown');

    expect(template).toBeUndefined();
  });

  it('should return conditional template', () => {
    const template = getTemplate('conditional');

    expect(template).toBe(CONDITIONAL_TEMPLATE);
  });

  it('should return error-handling template', () => {
    const template = getTemplate('error-handling');

    expect(template).toBe(ERROR_HANDLING_TEMPLATE);
  });

  it('should return scheduled template', () => {
    const template = getTemplate('scheduled');

    expect(template).toBe(SCHEDULED_TEMPLATE);
  });
});

describe('getTemplatesByCategory', () => {
  it('should return templates in Basic category', () => {
    const templates = getTemplatesByCategory('Basic');

    expect(templates).toHaveLength(3);
    expect(templates).toContain(SIMPLE_ACTION_TEMPLATE);
    expect(templates).toContain(CONDITIONAL_TEMPLATE);
    expect(templates).toContain(ERROR_HANDLING_TEMPLATE);
  });

  it('should return templates in Automation category', () => {
    const templates = getTemplatesByCategory('Automation');

    expect(templates).toHaveLength(1);
    expect(templates).toContain(SCHEDULED_TEMPLATE);
  });

  it('should return empty array for unknown category', () => {
    const templates = getTemplatesByCategory('Unknown');

    expect(templates).toEqual([]);
  });
});

describe('createFromTemplate', () => {

  it('should create flow from template', () => {
    const flow = createFromTemplate('simple-action');

    expect(flow).toBeDefined();
    expect(flow?.name).toBe('Simple Action Flow');
    expect(flow?.id).toBeDefined();
  });

  it('should use custom name if provided', () => {
    const flow = createFromTemplate('simple-action', 'Custom Flow Name');

    expect(flow?.name).toBe('Custom Flow Name');
  });

  it('should return undefined for unknown template', () => {
    const flow = createFromTemplate('unknown');

    expect(flow).toBeUndefined();
  });

  it('should have new timestamps', () => {
    const flow = createFromTemplate('simple-action');

    expect(flow?.createdAt).toBeInstanceOf(Date);
    expect(flow?.updatedAt).toBeInstanceOf(Date);
  });

  it('should create independent copies', () => {
    const flow1 = createFromTemplate('simple-action');
    const flow2 = createFromTemplate('simple-action');

    expect(flow1?.id).not.toBe(flow2?.id);
  });

  it('should preserve template flow structure', () => {
    const flow = createFromTemplate('conditional');

    expect(flow?.nodes).toHaveLength(5);
    expect(flow?.edges).toHaveLength(5);
  });
});

describe('getTemplateCategories', () => {
  it('should return all unique categories', () => {
    const categories = getTemplateCategories();

    expect(categories).toContain('Basic');
    expect(categories).toContain('Automation');
  });

  it('should not have duplicates', () => {
    const categories = getTemplateCategories();
    const uniqueCategories = [...new Set(categories)];

    expect(categories.length).toBe(uniqueCategories.length);
  });
});
