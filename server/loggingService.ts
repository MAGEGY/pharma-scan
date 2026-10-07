import { db } from '../server/db';
import { auditLogs } from '../shared/schema';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  context: {
    userId?: string;
    sessionId?: string;
    requestId?: string;
    endpoint?: string;
    method?: string;
    userAgent?: string;
    ipAddress?: string;
    deviceId?: string;
    platform?: string;
    appVersion?: string;
  };
  metadata: {
    duration?: number;
    responseSize?: number;
    statusCode?: number;
    error?: {
      name: string;
      message: string;
      stack?: string;
    };
    performance?: {
      memoryUsage?: number;
      cpuUsage?: number;
      databaseQueries?: number;
      cacheHits?: number;
    };
    business?: {
      drugId?: number;
      drugName?: string;
      action?: string;
      result?: string;
      value?: number;
    };
  };
  tags: string[];
  correlationId?: string;
  source: string;
  environment: string;
}

interface LogFilter {
  level?: LogEntry['level'][];
  startTime?: Date;
  endTime?: Date;
  userId?: string;
  sessionId?: string;
  endpoint?: string;
  tags?: string[];
  source?: string;
  limit?: number;
  offset?: number;
}

interface LogAnalytics {
  totalLogs: number;
  logsByLevel: Record<LogEntry['level'], number>;
  logsByHour: Array<{
    hour: string;
    count: number;
  }>;
  topErrors: Array<{
    message: string;
    count: number;
    lastOccurrence: string;
  }>;
  performanceMetrics: {
    averageResponseTime: number;
    errorRate: number;
    throughput: number;
  };
  userActivity: {
    activeUsers: number;
    topUsers: Array<{
      userId: string;
      activityCount: number;
    }>;
  };
}

export class LoggingService {
  private logBuffer: LogEntry[] = [];
  private bufferSize = 1000;
  private flushInterval = 5000; // 5 seconds
  private logLevels: Record<LogEntry['level'], number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4,
  };

  constructor() {
    this.startLogFlushScheduler();
  }

  // CORE LOGGING METHODS
  debug(message: string, context: Partial<LogEntry['context']> = {}, metadata: Partial<LogEntry['metadata']> = {}): void {
    this.log('debug', message, context, metadata);
  }

  info(message: string, context: Partial<LogEntry['context']> = {}, metadata: Partial<LogEntry['metadata']> = {}): void {
    this.log('info', message, context, metadata);
  }

  warn(message: string, context: Partial<LogEntry['context']> = {}, metadata: Partial<LogEntry['metadata']> = {}): void {
    this.log('warn', message, context, metadata);
  }

  error(message: string, context: Partial<LogEntry['context']> = {}, metadata: Partial<LogEntry['metadata']> = {}): void {
    this.log('error', message, context, metadata);
  }

  fatal(message: string, context: Partial<LogEntry['context']> = {}, metadata: Partial<LogEntry['metadata']> = {}): void {
    this.log('fatal', message, context, metadata);
  }

  private log(level: LogEntry['level'], message: string, context: Partial<LogEntry['context']>, metadata: Partial<LogEntry['metadata']>): void {
    const logEntry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...context,
        requestId: context.requestId || this.generateRequestId(),
        userAgent: context.userAgent || this.getUserAgent(),
        ipAddress: context.ipAddress || this.getIpAddress(),
        platform: context.platform || this.getPlatform(),
        appVersion: context.appVersion || this.getAppVersion(),
      },
      metadata: {
        ...metadata,
      },
      tags: this.generateTags(level, context, metadata),
      correlationId: this.getCorrelationId(context),
      source: this.getSource(),
      environment: process.env.NODE_ENV || 'development',
    };

    // Add to buffer
    this.logBuffer.push(logEntry);

    // Flush buffer if it's full or if it's a high-priority log
    if (this.logBuffer.length >= this.bufferSize || this.logLevels[level] >= this.logLevels.error) {
      this.flushLogs();
    }

    // Also output to console for development
    if (process.env.NODE_ENV !== 'production') {
      this.outputToConsole(logEntry);
    }
  }

  // SPECIALIZED LOGGING METHODS
  logApiRequest(
    method: string,
    endpoint: string,
    context: Partial<LogEntry['context']>,
    metadata: Partial<LogEntry['metadata']> = {}
  ): void {
    this.info(`API Request: ${method} ${endpoint}`, {
      ...context,
      method,
      endpoint,
    }, {
      ...metadata,
      business: {
        ...metadata.business,
        action: 'api_request',
      },
    });
  }

  logApiResponse(
    method: string,
    endpoint: string,
    statusCode: number,
    duration: number,
    context: Partial<LogEntry['context']>,
    metadata: Partial<LogEntry['metadata']> = {}
  ): void {
    const level = statusCode >= 400 ? 'warn' : statusCode >= 500 ? 'error' : 'info';
    
    this.log(level, `API Response: ${method} ${endpoint} - ${statusCode}`, {
      ...context,
      method,
      endpoint,
    }, {
      ...metadata,
      statusCode,
      duration,
      business: {
        ...metadata.business,
        action: 'api_response',
        result: statusCode.toString(),
      },
    });
  }

  logDatabaseQuery(
    query: string,
    duration: number,
    success: boolean,
    context: Partial<LogEntry['context']>,
    metadata: Partial<LogEntry['metadata']> = {}
  ): void {
    const level = success ? 'debug' : 'error';
    
    this.log(level, `Database Query: ${query.substring(0, 100)}...`, context, {
      ...metadata,
      duration,
      performance: {
        ...metadata.performance,
        databaseQueries: (metadata.performance?.databaseQueries || 0) + 1,
      },
      business: {
        ...metadata.business,
        action: 'database_query',
        result: success ? 'success' : 'error',
      },
    });
  }

  logUserAction(
    action: string,
    userId: string,
    context: Partial<LogEntry['context']>,
    metadata: Partial<LogEntry['metadata']> = {}
  ): void {
    this.info(`User Action: ${action}`, {
      ...context,
      userId,
    }, {
      ...metadata,
      business: {
        ...metadata.business,
        action,
      },
    });
  }

  logBusinessEvent(
    event: string,
    context: Partial<LogEntry['context']>,
    metadata: Partial<LogEntry['metadata']> = {}
  ): void {
    this.info(`Business Event: ${event}`, context, {
      ...metadata,
      business: {
        ...metadata.business,
        action: event,
      },
    });
  }

  logPerformanceMetric(
    metric: string,
    value: number,
    context: Partial<LogEntry['context']>,
    metadata: Partial<LogEntry['metadata']> = {}
  ): void {
    this.debug(`Performance: ${metric} = ${value}`, context, {
      ...metadata,
      performance: {
        ...metadata.performance,
        [metric]: value,
      },
    });
  }

  logSecurityEvent(
    event: string,
    context: Partial<LogEntry['context']>,
    metadata: Partial<LogEntry['metadata']> = {}
  ): void {
    this.warn(`Security Event: ${event}`, context, {
      ...metadata,
      tags: [...(metadata.tags || []), 'security'],
    });
  }

  // LOG RETRIEVAL
  async getLogs(filter: LogFilter = {}): Promise<LogEntry[]> {
    try {
      let query = db.select().from(auditLogs);

      // Apply filters
      if (filter.level && filter.level.length > 0) {
        query = query.where(
          // This would need to be implemented based on your ORM
          // For now, we'll return filtered results from memory
        );
      }

      // For now, return from buffer (in production, query database)
      let logs = [...this.logBuffer];

      if (filter.level) {
        logs = logs.filter(log => filter.level!.includes(log.level));
      }

      if (filter.startTime) {
        logs = logs.filter(log => new Date(log.timestamp) >= filter.startTime!);
      }

      if (filter.endTime) {
        logs = logs.filter(log => new Date(log.timestamp) <= filter.endTime!);
      }

      if (filter.userId) {
        logs = logs.filter(log => log.context.userId === filter.userId);
      }

      if (filter.sessionId) {
        logs = logs.filter(log => log.context.sessionId === filter.sessionId);
      }

      if (filter.endpoint) {
        logs = logs.filter(log => log.context.endpoint === filter.endpoint);
      }

      if (filter.tags && filter.tags.length > 0) {
        logs = logs.filter(log => 
          filter.tags!.some(tag => log.tags.includes(tag))
        );
      }

      if (filter.source) {
        logs = logs.filter(log => log.source === filter.source);
      }

      // Sort by timestamp (newest first)
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Apply pagination
      if (filter.offset) {
        logs = logs.slice(filter.offset);
      }

      if (filter.limit) {
        logs = logs.slice(0, filter.limit);
      }

      return logs;
    } catch (error) {
      this.error('Failed to retrieve logs', {}, { error: error.message });
      return [];
    }
  }

  async getLogAnalytics(timeRange: {
    startTime?: Date;
    endTime?: Date;
  } = {}): Promise<LogAnalytics> {
    const logs = await this.getLogs({
      startTime: timeRange.startTime,
      endTime: timeRange.endTime,
    });

    const analytics: LogAnalytics = {
      totalLogs: logs.length,
      logsByLevel: {
        debug: 0,
        info: 0,
        warn: 0,
        error: 0,
        fatal: 0,
      },
      logsByHour: [],
      topErrors: [],
      performanceMetrics: {
        averageResponseTime: 0,
        errorRate: 0,
        throughput: 0,
      },
      userActivity: {
        activeUsers: 0,
        topUsers: [],
      },
    };

    // Calculate logs by level
    logs.forEach(log => {
      analytics.logsByLevel[log.level]++;
    });

    // Calculate logs by hour
    const logsByHourMap = new Map<string, number>();
    logs.forEach(log => {
      const hour = new Date(log.timestamp).toISOString().substring(0, 13); // YYYY-MM-DDTHH
      logsByHourMap.set(hour, (logsByHourMap.get(hour) || 0) + 1);
    });

    analytics.logsByHour = Array.from(logsByHourMap.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour.localeCompare(b.hour));

    // Calculate top errors
    const errorLogs = logs.filter(log => log.level === 'error' || log.level === 'fatal');
    const errorCounts = new Map<string, { count: number; lastOccurrence: string }>();
    
    errorLogs.forEach(log => {
      const existing = errorCounts.get(log.message);
      if (existing) {
        existing.count++;
        if (new Date(log.timestamp) > new Date(existing.lastOccurrence)) {
          existing.lastOccurrence = log.timestamp;
        }
      } else {
        errorCounts.set(log.message, {
          count: 1,
          lastOccurrence: log.timestamp,
        });
      }
    });

    analytics.topErrors = Array.from(errorCounts.entries())
      .map(([message, data]) => ({ message, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate performance metrics
    const apiLogs = logs.filter(log => log.context.endpoint);
    const errorApiLogs = apiLogs.filter(log => log.metadata.statusCode && log.metadata.statusCode >= 400);
    
    analytics.performanceMetrics.errorRate = apiLogs.length > 0 ? errorApiLogs.length / apiLogs.length : 0;
    analytics.performanceMetrics.throughput = logs.length / (logs.length > 0 ? 
      (new Date(logs[logs.length - 1].timestamp).getTime() - new Date(logs[0].timestamp).getTime()) / 1000 / 60 : 1
    );

    const responseTimes = apiLogs
      .filter(log => log.metadata.duration)
      .map(log => log.metadata.duration!);
    
    if (responseTimes.length > 0) {
      analytics.performanceMetrics.averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    }

    // Calculate user activity
    const userLogs = logs.filter(log => log.context.userId);
    const userActivityMap = new Map<string, number>();
    
    userLogs.forEach(log => {
      userActivityMap.set(log.context.userId!, (userActivityMap.get(log.context.userId!) || 0) + 1);
    });

    analytics.userActivity.activeUsers = userActivityMap.size;
    analytics.userActivity.topUsers = Array.from(userActivityMap.entries())
      .map(([userId, activityCount]) => ({ userId, activityCount }))
      .sort((a, b) => b.activityCount - a.activityCount)
      .slice(0, 10);

    return analytics;
  }

  // LOG MANAGEMENT
  async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    try {
      // In production, this would batch insert logs to database
      for (const log of logsToFlush) {
        await db.insert(auditLogs).values({
          action: 'log_entry',
          resource: 'logging',
          resourceId: log.id,
          newValues: {
            level: log.level,
            message: log.message,
            context: log.context,
            metadata: log.metadata,
            tags: log.tags,
            correlationId: log.correlationId,
            source: log.source,
            environment: log.environment,
          },
          success: true,
          errorMessage: null,
          ipAddress: log.context.ipAddress || 'unknown',
          userAgent: log.context.userAgent || 'unknown',
          createdAt: new Date(log.timestamp),
        });
      }

      console.log(`Flushed ${logsToFlush.length} log entries to database`);
    } catch (error) {
      console.error('Failed to flush logs to database:', error);
      
      // Re-add logs to buffer for retry
      this.logBuffer.unshift(...logsToFlush);
    }
  }

  async clearLogs(filter: LogFilter = {}): Promise<number> {
    try {
      // In production, this would delete logs from database based on filter
      const logsToDelete = await this.getLogs(filter);
      
      // For now, just remove from buffer
      this.logBuffer = this.logBuffer.filter(log => !logsToDelete.includes(log));
      
      return logsToDelete.length;
    } catch (error) {
      this.error('Failed to clear logs', {}, { error: error.message });
      return 0;
    }
  }

  // UTILITY METHODS
  private generateRequestId(): string {
    return crypto.randomUUID().substring(0, 8);
  }

  private getUserAgent(): string {
    return 'pharma-scan-server';
  }

  private getIpAddress(): string {
    return '127.0.0.1';
  }

  private getPlatform(): string {
    return 'server';
  }

  private getAppVersion(): string {
    return process.env.npm_package_version || '1.0.0';
  }

  private generateTags(
    level: LogEntry['level'],
    context: Partial<LogEntry['context']>,
    metadata: Partial<LogEntry['metadata']>
  ): string[] {
    const tags: string[] = [level];

    if (context.userId) tags.push('user-activity');
    if (context.endpoint) tags.push('api');
    if (context.sessionId) tags.push('session');
    if (metadata.business?.action) tags.push('business');
    if (metadata.error) tags.push('error');
    if (metadata.performance) tags.push('performance');
    if (metadata.business?.drugId) tags.push('drug-related');

    return tags;
  }

  private getCorrelationId(context: Partial<LogEntry['context']>): string | undefined {
    return context.correlationId || context.requestId;
  }

  private getSource(): string {
    return 'pharma-scan-server';
  }

  private outputToConsole(logEntry: LogEntry): void {
    const timestamp = new Date(logEntry.timestamp).toISOString();
    const message = `[${timestamp}] ${logEntry.level.toUpperCase()}: ${logEntry.message}`;
    
    switch (logEntry.level) {
      case 'debug':
        console.debug(message, logEntry.context, logEntry.metadata);
        break;
      case 'info':
        console.info(message, logEntry.context, logEntry.metadata);
        break;
      case 'warn':
        console.warn(message, logEntry.context, logEntry.metadata);
        break;
      case 'error':
      case 'fatal':
        console.error(message, logEntry.context, logEntry.metadata);
        break;
    }
  }

  private startLogFlushScheduler(): void {
    setInterval(() => {
      this.flushLogs();
    }, this.flushInterval);
  }

  // MIDDLEWARE HELPERS
  static createRequestLogger() {
    return (req: any, res: any, next: any) => {
      const startTime = Date.now();
      const requestId = crypto.randomUUID().substring(0, 8);
      
      // Add request ID to request object
      req.requestId = requestId;
      
      // Log request
      const loggingService = new LoggingService();
      loggingService.logApiRequest(
        req.method,
        req.path,
        {
          requestId,
          sessionId: req.sessionId,
          userId: req.userId,
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip,
        },
        {
          headers: req.headers,
          query: req.query,
        }
      );

      // Override res.end to log response
      const originalEnd = res.end;
      res.end = function(...args: any[]) {
        const duration = Date.now() - startTime;
        
        loggingService.logApiResponse(
          req.method,
          req.path,
          res.statusCode,
          duration,
          {
            requestId,
            sessionId: req.sessionId,
            userId: req.userId,
          },
          {
            responseSize: res.get('Content-Length'),
          }
        );

        originalEnd.apply(this, args);
      };

      next();
    };
  }

  static createErrorLogger() {
    return (error: Error, req: any, res: any, next: any) => {
      const loggingService = new LoggingService();
      
      loggingService.error('Unhandled error', {
        requestId: req.requestId,
        sessionId: req.sessionId,
        userId: req.userId,
        method: req.method,
        endpoint: req.path,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
      }, {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      });

      next(error);
    };
  }
}

export const loggingService = new LoggingService();
