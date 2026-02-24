/**
 * Flow Service
 * High-level API for flow management
 */

import type { Flow, FlowTemplate, UUID } from '../types/index.js';
import { FlowEngineImpl, createFlowEngine } from './engine.js';
import { createEmptyFlow, createFromTemplate, FLOW_TEMPLATES } from './presets.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger({ prefix: 'FlowService' });

/**
 * Flow Service
 * Provides CRUD operations and utilities for flows
 */
export class FlowService {
  private engine: FlowEngineImpl;

  constructor(engine?: FlowEngineImpl) {
    this.engine = engine ?? createFlowEngine();
  }

  /**
   * Get the underlying engine
   */
  getEngine(): FlowEngineImpl {
    return this.engine;
  }

  /**
   * Create a new empty flow
   */
  createEmpty(name: string, description?: string): Flow {
    const flow = createEmptyFlow(name, description);
    return this.engine.create(flow);
  }

  /**
   * Create a flow from a template
   */
  createFromTemplate(templateId: string, name?: string): Flow {
    const flow = createFromTemplate(templateId, name);
    if (!flow) {
      throw new Error(`Template not found: ${templateId}`);
    }
    return this.engine.create(flow);
  }

  /**
   * Import a flow from JSON
   */
  import(flowJson: string | object): Flow {
    const flowData = typeof flowJson === 'string' ? JSON.parse(flowJson) : flowJson;

    // Validate required fields
    if (!flowData.name) {
      throw new Error('Flow must have a name');
    }

    if (!flowData.nodes || !Array.isArray(flowData.nodes)) {
      throw new Error('Flow must have nodes array');
    }

    // Create flow without id (will be generated)
    const { id, createdAt, updatedAt, ...rest } = flowData;

    return this.engine.create(rest);
  }

  /**
   * Export a flow to JSON
   */
  export(flowId: UUID): string {
    const flow = this.engine.get(flowId);
    if (!flow) {
      throw new Error(`Flow not found: ${flowId}`);
    }

    return JSON.stringify(flow, null, 2);
  }

  /**
   * Clone a flow
   */
  clone(flowId: UUID, newName?: string): Flow {
    const flow = this.engine.get(flowId);
    if (!flow) {
      throw new Error(`Flow not found: ${flowId}`);
    }

    const { id, createdAt, updatedAt, ...rest } = flow;

    return this.engine.create({
      ...rest,
      name: newName ?? `${flow.name} (Copy)`,
    });
  }

  /**
   * Get flow by ID
   */
  get(flowId: UUID): Flow | undefined {
    return this.engine.get(flowId);
  }

  /**
   * Get all flows
   */
  getAll(): Flow[] {
    return this.engine.getAll();
  }

  /**
   * Search flows by name
   */
  search(query: string): Flow[] {
    const lowerQuery = query.toLowerCase();
    return this.engine.getAll().filter((flow) => {
      return (
        flow.name.toLowerCase().includes(lowerQuery) ||
        flow.description?.toLowerCase().includes(lowerQuery)
      );
    });
  }

  /**
   * Update a flow
   */
  update(flowId: UUID, updates: Partial<Flow>): Flow {
    const flow = this.engine.update(flowId, updates);
    if (!flow) {
      throw new Error(`Flow not found: ${flowId}`);
    }
    return flow;
  }

  /**
   * Delete a flow
   */
  delete(flowId: UUID): boolean {
    return this.engine.delete(flowId);
  }

  /**
   * Validate a flow
   */
  validate(flowId: UUID): { valid: boolean; errors: string[] } {
    const flow = this.engine.get(flowId);
    if (!flow) {
      return { valid: false, errors: ['Flow not found'] };
    }
    return this.engine.validate(flow);
  }

  /**
   * Execute a flow
   */
  async execute(flowId: UUID, input?: Record<string, unknown>) {
    return this.engine.execute(flowId, input);
  }

  /**
   * Get available templates
   */
  getTemplates(): FlowTemplate[] {
    return [...FLOW_TEMPLATES];
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): FlowTemplate | undefined {
    return FLOW_TEMPLATES.find((t) => t.id === templateId);
  }

  /**
   * Clear all flows
   */
  clear(): void {
    this.engine.clear();
  }
}

/**
 * Create a new flow service
 */
export function createFlowService(engine?: FlowEngineImpl): FlowService {
  return new FlowService(engine);
}
