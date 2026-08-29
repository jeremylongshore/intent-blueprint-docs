/**
 * REST API Server
 * Lightweight HTTP server for programmatic access
 */

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { randomUUID } from 'crypto';
import { URL } from 'url';
import type {
  ApiConfig,
  ApiContext,
  ApiRequest,
  ApiResponse,
  ApiResponseWriter,
  RouteHandler,
  HealthCheckResponse,
  GenerateRequest,
  GenerateResponse,
  TemplateListResponse,
  TemplateDetailResponse,
  AuditListRequest,
  AuditListResponse,
  AuditStatsResponse,
} from './types.js';
import { TemplateEngine } from '../templates/engine.js';
import { VERSION } from '../../version.js';
import { TemplateLoader } from '../templates/loader.js';
import { AuditTrail } from '../team/audit.js';
import type { CustomTemplate } from '../templates/types.js';

const DEFAULT_PORT = 3456;
const DEFAULT_HOST = 'localhost';

export class ApiServer {
  private config: Required<ApiConfig>;
  private server: ReturnType<typeof createServer> | null = null;
  private startTime: number = Date.now();
  private routes: Map<string, Map<string, RouteHandler>> = new Map();
  private templateEngine: TemplateEngine;
  private templateLoader: TemplateLoader;
  private auditTrail: AuditTrail;

  constructor(config: ApiConfig = {}) {
    this.config = {
      port: config.port ?? DEFAULT_PORT,
      host: config.host ?? DEFAULT_HOST,
      apiKey: config.apiKey ?? '',
      cors: config.cors ?? true,
      allowedOrigins: config.allowedOrigins ?? ['*'],
      rateLimit: config.rateLimit ?? 60,
      logging: config.logging ?? true,
    };

    this.templateEngine = new TemplateEngine();
    this.templateLoader = new TemplateLoader();
    this.auditTrail = new AuditTrail();

    this.registerRoutes();
  }

  /**
   * Register all API routes
   */
  private registerRoutes(): void {
    // Health check
    this.route('GET', '/health', this.handleHealth.bind(this));
    this.route('GET', '/api/health', this.handleHealth.bind(this));

    // Templates
    this.route('GET', '/api/templates', this.handleListTemplates.bind(this));
    this.route('GET', '/api/templates/:id', this.handleGetTemplate.bind(this));
    this.route('POST', '/api/templates', this.handleCreateTemplate.bind(this));

    // Generation
    this.route('POST', '/api/generate', this.handleGenerate.bind(this));

    // Audit
    this.route('GET', '/api/audit', this.handleListAudit.bind(this));
    this.route('GET', '/api/audit/stats', this.handleAuditStats.bind(this));

    // Webhooks (placeholder endpoints)
    this.route('GET', '/api/webhooks', this.handleListWebhooks.bind(this));
    this.route('POST', '/api/webhooks', this.handleCreateWebhook.bind(this));
    this.route('DELETE', '/api/webhooks/:id', this.handleDeleteWebhook.bind(this));
  }

  /**
   * Register a route
   */
  private route(method: string, path: string, handler: RouteHandler): void {
    if (!this.routes.has(path)) {
      this.routes.set(path, new Map());
    }
    this.routes.get(path)!.set(method, handler);
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = createServer(this.handleRequest.bind(this));
      this.server.listen(this.config.port, this.config.host, () => {
        this.startTime = Date.now();
        if (this.config.logging) {
          console.log(`Blueprint API server started on http://${this.config.host}:${this.config.port}`);
        }
        resolve();
      });
    });
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          if (this.config.logging) {
            console.log('Blueprint API server stopped');
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Handle incoming request
   */
  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const startTime = Date.now();
    const requestId = randomUUID();

    // Parse URL
    const url = new URL(req.url || '/', `http://${this.config.host}`);
    const method = req.method || 'GET';
    const path = url.pathname;

    // CORS headers
    if (this.config.cors) {
      const origin = req.headers.origin || '*';
      const allowedOrigin = this.config.allowedOrigins.includes('*')
        ? '*'
        : this.config.allowedOrigins.includes(origin)
          ? origin
          : '';

      if (allowedOrigin) {
        res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
      }
    }

    // Handle preflight
    if (method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Create response writer
    const writer = this.createResponseWriter(res, requestId, startTime);

    // Authenticate
    if (this.config.apiKey && !this.authenticate(req)) {
      writer.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid or missing API key' },
      });
      return;
    }

    // Find route
    const { handler, params } = this.findRoute(method, path);
    if (!handler) {
      writer.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Route not found: ${method} ${path}` },
      });
      return;
    }

    // Parse body
    let body: unknown = {};
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      try {
        body = await this.parseBody(req);
      } catch {
        writer.status(400).json({
          success: false,
          error: { code: 'INVALID_BODY', message: 'Invalid request body' },
        });
        return;
      }
    }

    // Create request object
    const apiRequest: ApiRequest = {
      method,
      path,
      params,
      query: Object.fromEntries(url.searchParams),
      body,
      headers: this.parseHeaders(req),
      context: {
        requestId,
        timestamp: new Date(),
      },
    };

    // Execute handler
    try {
      await handler(apiRequest, writer);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      writer.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message },
      });
    }

    // Log request
    if (this.config.logging) {
      const duration = Date.now() - startTime;
      console.log(`[${requestId.slice(0, 8)}] ${method} ${path} - ${res.statusCode} (${duration}ms)`);
    }
  }

  /**
   * Authenticate request
   */
  private authenticate(req: IncomingMessage): boolean {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    return apiKey === this.config.apiKey;
  }

  /**
   * Find matching route
   */
  private findRoute(method: string, path: string): { handler: RouteHandler | null; params: Record<string, string> } {
    const params: Record<string, string> = {};

    // Check exact match first
    const exactRoutes = this.routes.get(path);
    if (exactRoutes?.has(method)) {
      return { handler: exactRoutes.get(method)!, params };
    }

    // Check pattern matches
    for (const [pattern, methods] of this.routes) {
      const match = this.matchRoute(pattern, path);
      if (match && methods.has(method)) {
        return { handler: methods.get(method)!, params: match };
      }
    }

    return { handler: null, params };
  }

  /**
   * Match route pattern
   */
  private matchRoute(pattern: string, path: string): Record<string, string> | null {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    if (patternParts.length !== pathParts.length) return null;

    const params: Record<string, string> = {};

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = pathParts[i];
      } else if (patternParts[i] !== pathParts[i]) {
        return null;
      }
    }

    return params;
  }

  /**
   * Parse request body
   */
  private parseBody(req: IncomingMessage): Promise<unknown> {
    return new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => data += chunk);
      req.on('end', () => {
        try {
          resolve(data ? JSON.parse(data) : {});
        } catch (error) {
          reject(error);
        }
      });
      req.on('error', reject);
    });
  }

  /**
   * Parse headers
   */
  private parseHeaders(req: IncomingMessage): Record<string, string> {
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === 'string') {
        headers[key] = value;
      } else if (Array.isArray(value)) {
        headers[key] = value[0];
      }
    }
    return headers;
  }

  /**
   * Create response writer
   */
  private createResponseWriter(
    res: ServerResponse,
    requestId: string,
    startTime: number
  ): ApiResponseWriter {
    let statusCode = 200;

    return {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json<T>(data: ApiResponse<T>) {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          ...data,
          meta: {
            requestId,
            timestamp: new Date().toISOString(),
            duration: Date.now() - startTime,
          },
        }));
      },
      send(body: string) {
        res.writeHead(statusCode, { 'Content-Type': 'text/plain' });
        res.end(body);
      },
    };
  }

  /**
   * Load templates into engine
   */
  loadTemplates(templates: CustomTemplate[]): void {
    for (const template of templates) {
      this.templateEngine.registerTemplate(template);
    }
  }

  // Route handlers

  private handleHealth(_req: ApiRequest, res: ApiResponseWriter): void {
    const response: HealthCheckResponse = {
      status: 'healthy',
      version: VERSION,
      uptime: Date.now() - this.startTime,
      checks: {
        templates: true,
        audit: this.auditTrail.isEnabled(),
      },
    };
    res.json({ success: true, data: response });
  }

  private handleListTemplates(_req: ApiRequest, res: ApiResponseWriter): void {
    const templates = this.templateEngine.listTemplates();
    const response: TemplateListResponse = {
      templates: templates.map(t => ({
        id: t.meta.id,
        name: t.meta.name,
        description: t.meta.description,
        version: t.meta.version,
        category: t.meta.category,
        scope: t.meta.scope,
        author: t.meta.author,
        tags: t.meta.tags,
      })),
      total: templates.length,
    };
    res.json({ success: true, data: response });
  }

  private handleGetTemplate(req: ApiRequest, res: ApiResponseWriter): void {
    const { id } = req.params;
    const template = this.templateEngine.getTemplate(id);

    if (!template) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Template not found: ${id}` },
      });
      return;
    }

    const response: TemplateDetailResponse = { template };
    res.json({ success: true, data: response });
  }

  private handleCreateTemplate(req: ApiRequest, res: ApiResponseWriter): void {
    const template = req.body as CustomTemplate;

    if (!template.meta?.id) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_TEMPLATE', message: 'Template must have meta.id' },
      });
      return;
    }

    this.templateEngine.registerTemplate(template);
    res.status(201).json({ success: true, data: { template } });
  }

  private handleGenerate(req: ApiRequest, res: ApiResponseWriter): void {
    const startTime = Date.now();
    const { templateId, variables, format } = req.body as GenerateRequest;

    const template = this.templateEngine.getTemplate(templateId);
    if (!template) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Template not found: ${templateId}` },
      });
      return;
    }

    try {
      const content = this.templateEngine.process(template, { variables });

      const response: GenerateResponse = {
        content: format === 'json' ? JSON.stringify({ content }) : content,
        template: {
          id: template.meta.id,
          name: template.meta.name,
          version: template.meta.version,
        },
        variables,
        generatedAt: new Date().toISOString(),
      };

      // Log to audit trail
      this.auditTrail.logGeneration({
        user: req.context.clientId,
        template: templateId,
        variables,
        duration: Date.now() - startTime,
        success: true,
      });

      res.json({ success: true, data: response });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Generation failed';

      this.auditTrail.logGeneration({
        user: req.context.clientId,
        template: templateId,
        variables,
        duration: Date.now() - startTime,
        success: false,
        error: message,
      });

      res.status(400).json({
        success: false,
        error: { code: 'GENERATION_FAILED', message },
      });
    }
  }

  private handleListAudit(req: ApiRequest, res: ApiResponseWriter): void {
    const {
      user,
      template,
      action,
      startDate,
      endDate,
      page = '1',
      pageSize = '20',
    } = req.query as unknown as AuditListRequest;

    let entries = this.auditTrail.readAll();

    // Apply filters
    if (user) entries = entries.filter(e => e.user === user);
    if (template) entries = entries.filter(e => e.template === template);
    if (action) entries = entries.filter(e => e.action === action);
    if (startDate) entries = entries.filter(e => new Date(e.timestamp) >= new Date(startDate));
    if (endDate) entries = entries.filter(e => new Date(e.timestamp) <= new Date(endDate));

    // Paginate
    const pageNum = parseInt(page as string) || 1;
    const pageSizeNum = parseInt(pageSize as string) || 20;
    const start = (pageNum - 1) * pageSizeNum;
    const paginatedEntries = entries.slice(start, start + pageSizeNum);

    const response: AuditListResponse = {
      entries: paginatedEntries,
      total: entries.length,
      page: pageNum,
      pageSize: pageSizeNum,
    };

    res.json({ success: true, data: response });
  }

  private handleAuditStats(_req: ApiRequest, res: ApiResponseWriter): void {
    const stats = this.auditTrail.getStats();
    const response: AuditStatsResponse = {
      totalGenerations: stats.totalGenerations,
      successfulGenerations: stats.successfulGenerations,
      failedGenerations: stats.failedGenerations,
      averageDuration: stats.averageDuration,
      byTemplate: stats.byTemplate,
      byUser: stats.byUser,
      byAction: stats.byAction,
    };
    res.json({ success: true, data: response });
  }

  private handleListWebhooks(_req: ApiRequest, res: ApiResponseWriter): void {
    // Placeholder - webhooks stored elsewhere
    res.json({ success: true, data: { webhooks: [], total: 0 } });
  }

  private handleCreateWebhook(req: ApiRequest, res: ApiResponseWriter): void {
    // Placeholder
    res.status(201).json({ success: true, data: { webhook: req.body } });
  }

  private handleDeleteWebhook(req: ApiRequest, res: ApiResponseWriter): void {
    // Placeholder
    res.json({ success: true, data: { deleted: req.params.id } });
  }
}

/**
 * Create an API server instance
 */
export function createApiServer(config?: ApiConfig): ApiServer {
  return new ApiServer(config);
}
