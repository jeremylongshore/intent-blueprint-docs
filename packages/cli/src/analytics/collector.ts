/**
 * Analytics Collector
 * Collects and stores usage metrics
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { randomUUID } from 'crypto';
import type {
  AnalyticsEvent,
  EventType,
  EventMetadata,
  AnalyticsConfig,
  SessionStats,
} from './types.js';
import { DEFAULT_ANALYTICS_CONFIG } from './types.js';

/**
 * Analytics Collector
 */
export class AnalyticsCollector {
  private config: AnalyticsConfig;
  private sessionId: string;
  private sessionStart: Date;
  private events: AnalyticsEvent[] = [];
  private metadata: EventMetadata;
  private userId?: string;

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = { ...DEFAULT_ANALYTICS_CONFIG, ...config };
    this.sessionId = randomUUID();
    this.sessionStart = new Date();
    this.metadata = this.createMetadata();
  }

  /**
   * Create event metadata
   */
  private createMetadata(): EventMetadata {
    return {
      version: '1.0.0',
      platform: process.platform,
      nodeVersion: process.version,
      cliVersion: '2.9.0', // Kept in sync by the release version gate.
      environment: process.env.NODE_ENV,
    };
  }

  /**
   * Set user ID for tracking
   */
  setUserId(userId: string): void {
    this.userId = this.config.anonymize ? this.anonymizeId(userId) : userId;
  }

  /**
   * Anonymize an ID
   */
  private anonymizeId(id: string): string {
    // Simple hash for anonymization
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      const char = id.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `user_${Math.abs(hash).toString(16)}`;
  }

  /**
   * Track an event
   */
  track(type: EventType, data: Record<string, unknown> = {}): void {
    if (!this.config.enabled) return;
    if (!this.config.trackUsage && !type.includes('error')) return;
    if (!this.config.trackErrors && type === 'error_occurred') return;

    const event: AnalyticsEvent = {
      id: randomUUID(),
      type,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId,
      data: this.sanitizeData(data),
      metadata: this.metadata,
    };

    this.events.push(event);

    // Auto-flush after a certain number of events
    if (this.events.length >= 100) {
      this.flush();
    }
  }

  /**
   * Sanitize data to remove sensitive information
   */
  private sanitizeData(data: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth', 'credential'];

    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeData(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Convenience methods for common events
   */
  trackTemplateGenerated(templateId: string, variables: string[], format: string, duration: number): void {
    this.track('template_generated', {
      templateId,
      variableCount: variables.length,
      format,
      duration,
    });
  }

  trackPackInstalled(packId: string, version: string): void {
    this.track('pack_installed', { packId, version });
  }

  trackPackUninstalled(packId: string): void {
    this.track('pack_uninstalled', { packId });
  }

  trackExportCompleted(destination: string, format: string, success: boolean): void {
    this.track('export_completed', { destination, format, success });
  }

  trackValidationRun(validators: string[], errorsFound: number, warningsFound: number): void {
    this.track('validation_run', { validators, errorsFound, warningsFound });
  }

  trackInterviewStarted(templateId: string): void {
    this.track('interview_started', { templateId });
  }

  trackInterviewCompleted(templateId: string, questionsAnswered: number, duration: number): void {
    this.track('interview_completed', { templateId, questionsAnswered, duration });
  }

  trackError(errorType: string, errorMessage: string, context?: Record<string, unknown>): void {
    this.track('error_occurred', {
      errorType,
      errorMessage: errorMessage.substring(0, 500), // Limit message length
      context,
    });
  }

  /**
   * Flush events to storage
   */
  flush(): void {
    if (this.events.length === 0) return;

    const storageDir = this.config.storageDir;
    if (!existsSync(storageDir)) {
      mkdirSync(storageDir, { recursive: true });
    }

    const filename = `events_${this.sessionId}_${Date.now()}.json`;
    const filepath = join(storageDir, filename);

    writeFileSync(filepath, JSON.stringify(this.events, null, 2));
    this.events = [];
  }

  /**
   * End the session
   */
  endSession(): SessionStats {
    this.track('session_ended', {});
    this.flush();

    const endTime = new Date();
    const duration = endTime.getTime() - this.sessionStart.getTime();

    return {
      sessionId: this.sessionId,
      startTime: this.sessionStart.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      eventsCount: this.events.length,
      templatesGenerated: 0, // Would be calculated from events
      errors: 0, // Would be calculated from events
    };
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Load events from storage
   */
  loadEvents(days: number = 30): AnalyticsEvent[] {
    const storageDir = this.config.storageDir;
    if (!existsSync(storageDir)) return [];

    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const allEvents: AnalyticsEvent[] = [];

    const files = readdirSync(storageDir).filter(f => f.startsWith('events_') && f.endsWith('.json'));

    for (const file of files) {
      const filepath = join(storageDir, file);
      try {
        const content = readFileSync(filepath, 'utf-8');
        const events = JSON.parse(content) as AnalyticsEvent[];

        for (const event of events) {
          const eventTime = new Date(event.timestamp).getTime();
          if (eventTime >= cutoff) {
            allEvents.push(event);
          }
        }
      } catch {
        // Skip corrupted files
      }
    }

    return allEvents.sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  /**
   * Clean up old events
   */
  cleanup(): number {
    const storageDir = this.config.storageDir;
    if (!existsSync(storageDir)) return 0;

    const cutoff = Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000;
    let removed = 0;

    const files = readdirSync(storageDir).filter(f => f.startsWith('events_') && f.endsWith('.json'));

    for (const file of files) {
      const filepath = join(storageDir, file);
      try {
        const content = readFileSync(filepath, 'utf-8');
        const events = JSON.parse(content) as AnalyticsEvent[];

        // If all events are old, delete the file
        const allOld = events.every(e => new Date(e.timestamp).getTime() < cutoff);
        if (allOld) {
          unlinkSync(filepath);
          removed++;
        }
      } catch {
        // Skip corrupted files
      }
    }

    return removed;
  }
}

/**
 * Create an analytics collector instance
 */
export function createAnalyticsCollector(config?: Partial<AnalyticsConfig>): AnalyticsCollector {
  return new AnalyticsCollector(config);
}
