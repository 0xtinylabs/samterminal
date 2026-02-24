/**
 * Flow Service tests
 */


import { FlowService, createFlowService } from './service.js';
import { FlowEngineImpl } from './engine.js';
import { createTriggerNode } from './nodes.js';
import type { Flow } from '../types/index.js';

describe('FlowService', () => {
  let service: FlowService;

  const createBasicFlowData = (): Omit<Flow, 'id' | 'createdAt' | 'updatedAt'> => ({
    name: 'Test Flow',
    description: 'A test flow',
    nodes: [
      createTriggerNode({ id: 'trigger', name: 'Start' }, { triggerType: 'manual', config: {} }),
    ],
    edges: [],
    variables: {},
    status: 'active',
  });

  beforeEach(() => {
    service = new FlowService();
  });

  describe('getEngine', () => {
    it('should return the underlying engine', () => {
      expect(service.getEngine()).toBeInstanceOf(FlowEngineImpl);
    });
  });

  describe('createEmpty', () => {
    it('should create empty flow with name', () => {
      const flow = service.createEmpty('My Flow');

      expect(flow.name).toBe('My Flow');
      expect(flow.nodes).toBeDefined();
      expect(flow.edges).toBeDefined();
    });

    it('should create empty flow with description', () => {
      const flow = service.createEmpty('My Flow', 'Description');

      expect(flow.description).toBe('Description');
    });
  });

  describe('createFromTemplate', () => {
    it('should throw for unknown template', () => {
      expect(() => service.createFromTemplate('unknown')).toThrow(
        'Template not found'
      );
    });
  });

  describe('import', () => {
    it('should import flow from object', () => {
      const flowData = createBasicFlowData();
      const flow = service.import(flowData);

      expect(flow.name).toBe('Test Flow');
      expect(flow.id).toBeDefined();
    });

    it('should import flow from JSON string', () => {
      const flowData = createBasicFlowData();
      const flow = service.import(JSON.stringify(flowData));

      expect(flow.name).toBe('Test Flow');
    });

    it('should throw if name is missing', () => {
      expect(() => service.import({ nodes: [] })).toThrow(
        'Flow must have a name'
      );
    });

    it('should throw if nodes is missing', () => {
      expect(() => service.import({ name: 'Test' })).toThrow(
        'Flow must have nodes array'
      );
    });

    it('should generate new ID for imported flow', () => {
      const flowData = { ...createBasicFlowData(), id: 'old-id' };
      const flow = service.import(flowData);

      expect(flow.id).not.toBe('old-id');
    });
  });

  describe('export', () => {
    it('should export flow as JSON string', () => {
      const flow = service.createEmpty('My Flow');
      const json = service.export(flow.id);

      const parsed = JSON.parse(json);
      expect(parsed.name).toBe('My Flow');
    });

    it('should throw for unknown flow', () => {
      expect(() => service.export('unknown')).toThrow('Flow not found');
    });
  });

  describe('clone', () => {
    it('should clone flow with new ID', () => {
      const original = service.createEmpty('Original');
      const cloned = service.clone(original.id);

      expect(cloned.id).not.toBe(original.id);
      expect(cloned.name).toBe('Original (Copy)');
    });

    it('should use custom name for clone', () => {
      const original = service.createEmpty('Original');
      const cloned = service.clone(original.id, 'Cloned Flow');

      expect(cloned.name).toBe('Cloned Flow');
    });

    it('should throw for unknown flow', () => {
      expect(() => service.clone('unknown')).toThrow('Flow not found');
    });
  });

  describe('get', () => {
    it('should get flow by ID', () => {
      const flow = service.createEmpty('My Flow');
      expect(service.get(flow.id)).toEqual(flow);
    });

    it('should return undefined for unknown ID', () => {
      expect(service.get('unknown')).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('should return all flows', () => {
      service.createEmpty('Flow 1');
      service.createEmpty('Flow 2');

      expect(service.getAll()).toHaveLength(2);
    });
  });

  describe('search', () => {
    it('should search by name', () => {
      service.createEmpty('Alpha Flow');
      service.createEmpty('Beta Flow');
      service.createEmpty('Gamma');

      const results = service.search('Flow');

      expect(results).toHaveLength(2);
    });

    it('should search case insensitively', () => {
      service.createEmpty('Test Flow');

      const results = service.search('TEST');

      expect(results).toHaveLength(1);
    });

    it('should search by description', () => {
      const flow = service.createEmpty('Flow', 'Contains keyword here');

      const results = service.search('keyword');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(flow.id);
    });
  });

  describe('update', () => {
    it('should update flow', () => {
      const flow = service.createEmpty('Original');
      const updated = service.update(flow.id, { name: 'Updated' });

      expect(updated.name).toBe('Updated');
    });

    it('should throw for unknown flow', () => {
      expect(() => service.update('unknown', { name: 'Test' })).toThrow(
        'Flow not found'
      );
    });
  });

  describe('delete', () => {
    it('should delete flow', () => {
      const flow = service.createEmpty('My Flow');
      const result = service.delete(flow.id);

      expect(result).toBe(true);
      expect(service.get(flow.id)).toBeUndefined();
    });

    it('should return false for unknown flow', () => {
      expect(service.delete('unknown')).toBe(false);
    });
  });

  describe('validate', () => {
    it('should validate flow', () => {
      const flow = service.createEmpty('My Flow');
      const result = service.validate(flow.id);

      expect(result.valid).toBeDefined();
    });

    it('should return invalid for unknown flow', () => {
      const result = service.validate('unknown');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Flow not found');
    });
  });

  describe('getTemplates', () => {
    it('should return available templates', () => {
      const templates = service.getTemplates();
      expect(Array.isArray(templates)).toBe(true);
    });
  });

  describe('getTemplate', () => {
    it('should return undefined for unknown template', () => {
      expect(service.getTemplate('unknown')).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('should clear all flows', () => {
      service.createEmpty('Flow 1');
      service.createEmpty('Flow 2');

      service.clear();

      expect(service.getAll()).toHaveLength(0);
    });
  });
});

describe('createFlowService', () => {
  it('should create a new FlowService', () => {
    const service = createFlowService();
    expect(service).toBeInstanceOf(FlowService);
  });

  it('should accept custom engine', () => {
    const engine = new FlowEngineImpl();
    const service = createFlowService(engine);

    expect(service.getEngine()).toBe(engine);
  });
});
