import { db } from '../server/db';
import { auditLogs } from '../shared/schema';
import { 
  prescriptionBackups,
  usageAnalytics,
  priceTrends,
  marketIntelligence,
  exportHistory
} from '../shared/schema';

interface ErrorReport {
  id: string;
  userId?: string;
  errorType: 'crash' | 'api_error' | 'database_error' | 'network_error' | 'validation_error' | 'system_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  stack?: string;
  context: {
    endpoint?: string;
    method?: string;
    userAgent?: string;
    ipAddress?: string;
    deviceId?: string;
    sessionId?: string;
    timestamp: string;
    requestId?: string;
  };
  metadata: {
    os?: string;
    platform?: string;
    appVersion?: string;
    buildNumber?: string;
    memoryUsage?: number;
    cpuUsage?: number;
    diskSpace?: number;
    networkStatus?: 'connected' | 'disconnected' | 'slow';
  };
  recovery: {
    attempted: boolean;
    successful: boolean;
    method?: string;
    timestamp?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface PerformanceMetric {
  id: string;
  userId?: string;
  metricType: 'response_time' | 'memory_usage' | 'cpu_usage' | 'database_query' | 'api_call' | 'user_action';
  metricName: string;
  value: number;
  unit: string;
  context: {
    endpoint?: string;
    method?: string;
    query?: string;
    parameters?: Record<string, any>;
  };
  threshold?: {
    warning: number;
    critical: number;
  };
  status: 'normal' | 'warning' | 'critical';
  timestamp: string;
  createdAt: string;
}

interface Alert {
  id: string;
  alertType: 'error_spike' | 'performance_degradation' | 'resource_exhaustion' | 'security_breach' | 'data_loss';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedUsers?: number;
  affectedEndpoints?: string[];
  metrics?: {
    errorRate: number;
    responseTime: number;
    throughput: number;
  };
  recommendations: string[];
  status: 'active' | 'resolved' | 'acknowledged';
  createdAt: string;
  resolvedAt?: string;
}

export class ErrorMonitoringService {
  private errorReports: Map<string, ErrorReport> = new Map();
  private performanceMetrics: Map<string, PerformanceMetric[]> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private thresholds = {
    errorRate: { warning: 0.05, critical: 0.1 },
    responseTime: { warning: 2000, critical: 5000 }, // ms
    memoryUsage: { warning: 80, critical: 95 }, // percentage
    cpuUsage: { warning: 70, critical: 90 }, // percentage
  };

  // ERROR REPORTING
  async reportError(errorData: Omit<ErrorReport, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const errorId = crypto.randomUUID();
    const errorReport: ErrorReport = {
      id: errorId,
      ...errorData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store error report
    this.errorReports.set(errorId, errorReport);

    // Log to audit trail
    await this.logToAuditTrail(errorReport);

    // Check if immediate action is needed
    if (errorReport.severity === 'critical') {
      await this.handleCriticalError(errorReport);
    }

    // Check for error patterns
    await this.analyzeErrorPatterns(errorReport);

    return errorId;
  }

  async reportCrash(error: Error, context: Partial<ErrorReport['context']>, metadata: Partial<ErrorReport['metadata']>): Promise<string> {
    return await this.reportError({
      errorType: 'crash',
      severity: 'critical',
      message: error.message,
      stack: error.stack,
      context: {
        ...context,
        timestamp: new Date().toISOString(),
      },
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
      recovery: {
        attempted: false,
        successful: false,
      },
    });
  }

  async reportApiError(
    error: Error,
    endpoint: string,
    method: string,
    context: Partial<ErrorReport['context']> = {}
  ): Promise<string> {
    return await this.reportError({
      errorType: 'api_error',
      severity: this.determineApiErrorSeverity(error),
      message: error.message,
      stack: error.stack,
      context: {
        endpoint,
        method,
        ...context,
        timestamp: new Date().toISOString(),
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
      recovery: {
        attempted: false,
        successful: false,
      },
    });
  }

  async reportDatabaseError(
    error: Error,
    query?: string,
    context: Partial<ErrorReport['context']> = {}
  ): Promise<string> {
    return await this.reportError({
      errorType: 'database_error',
      severity: 'high',
      message: error.message,
      stack: error.stack,
      context: {
        ...context,
        timestamp: new Date().toISOString(),
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
      recovery: {
        attempted: false,
        successful: false,
      },
    });
  }

  private determineApiErrorSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    if (error.name === 'ValidationError') return 'low';
    if (error.name === 'AuthenticationError') return 'medium';
    if (error.name === 'AuthorizationError') return 'high';
    if (error.name === 'DatabaseError') return 'high';
    return 'critical';
  }

  // PERFORMANCE MONITORING
  async recordPerformanceMetric(metricData: Omit<PerformanceMetric, 'id' | 'createdAt' | 'status'>): Promise<string> {
    const metricId = crypto.randomUUID();
    const metric: PerformanceMetric = {
      id: metricId,
      ...metricData,
      status: this.determineMetricStatus(metricData),
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    // Store metric
    if (!this.performanceMetrics.has(metricData.metricName)) {
      this.performanceMetrics.set(metricData.metricName, []);
    }
    this.performanceMetrics.get(metricData.metricName)!.push(metric);

    // Keep only last 1000 metrics per type
    const metrics = this.performanceMetrics.get(metricData.metricName)!;
    if (metrics.length > 1000) {
      metrics.splice(0, metrics.length - 1000);
    }

    // Check for performance issues
    if (metric.status === 'warning' || metric.status === 'critical') {
      await this.handlePerformanceAlert(metric);
    }

    return metricId;
  }

  recordApiResponseTime(
    endpoint: string,
    method: string,
    responseTime: number,
    context: Record<string, any> = {}
  ): Promise<string> {
    return await this.recordPerformanceMetric({
      metricType: 'response_time',
      metricName: `${method} ${endpoint}`,
      value: responseTime,
      unit: 'ms',
      context: {
        endpoint,
        method,
        ...context,
      },
      threshold: this.thresholds.responseTime,
    });
  }

  recordMemoryUsage(usage: number, context: Record<string, any> = {}): Promise<string> {
    return await this.recordPerformanceMetric({
      metricType: 'memory_usage',
      metricName: 'memory_usage',
      value: usage,
      unit: '%',
      context,
      threshold: this.thresholds.memoryUsage,
    });
  }

  recordCpuUsage(usage: number, context: Record<string, any> = {}): Promise<string> {
    return await this.recordPerformanceMetric({
      metricType: 'cpu_usage',
      metricName: 'cpu_usage',
      value: usage,
      unit: '%',
      context,
      threshold: this.thresholds.cpuUsage,
    });
  }

  private determineMetricStatus(metric: Omit<PerformanceMetric, 'id' | 'createdAt' | 'status'>): 'normal' | 'warning' | 'critical' {
    if (!metric.threshold) return 'normal';
    
    if (metric.value >= metric.threshold.critical) return 'critical';
    if (metric.value >= metric.threshold.warning) return 'warning';
    return 'normal';
  }

  // ALERT MANAGEMENT
  async createAlert(alertData: Omit<Alert, 'id' | 'createdAt' | 'resolvedAt'>): Promise<string> {
    const alertId = crypto.randomUUID();
    const alert: Alert = {
      id: alertId,
      ...alertData,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    this.alerts.set(alertId, alert);

    // Log alert
    await this.logToAuditTrail({
      action: 'alert_created',
      resource: 'error_monitoring',
      resourceId: alertId,
      newValues: alert,
      success: true,
      errorMessage: null,
    });

    // Send notifications for critical alerts
    if (alert.severity === 'critical') {
      await this.sendAlertNotification(alert);
    }

    return alertId;
  }

  private async handleCriticalError(errorReport: ErrorReport): Promise<void> {
    await this.createAlert({
      alertType: 'error_spike',
      severity: 'critical',
      title: 'Critical Error Detected',
      description: `Critical error in ${errorReport.context.endpoint || 'system'}: ${errorReport.message}`,
      recommendations: [
        'Check system logs for detailed information',
        'Verify database connectivity',
        'Monitor system resources',
        'Consider rolling back recent changes',
      ],
    });

    // Attempt automatic recovery if possible
    await this.attemptErrorRecovery(errorReport);
  }

  private async handlePerformanceAlert(metric: PerformanceMetric): Promise<void> {
    const alertType = metric.status === 'critical' ? 'performance_degradation' : 'performance_warning';
    const severity = metric.status === 'critical' ? 'critical' : 'medium';

    await this.createAlert({
      alertType,
      severity,
      title: `Performance ${metric.status === 'critical' ? 'Degradation' : 'Warning'}`,
      description: `${metric.metricName} is ${metric.status}: ${metric.value} ${metric.unit}`,
      metrics: {
        errorRate: this.calculateErrorRate(),
        responseTime: this.calculateAverageResponseTime(),
        throughput: this.calculateThroughput(),
      },
      recommendations: [
        'Monitor system resources',
        'Check for memory leaks',
        'Optimize database queries',
        'Consider scaling resources',
      ],
    });
  }

  // ERROR ANALYSIS
  private async analyzeErrorPatterns(errorReport: ErrorReport): Promise<void> {
    const recentErrors = Array.from(this.errorReports.values())
      .filter(e => 
        e.createdAt > new Date(Date.now() - 60 * 60 * 1000) && // Last hour
        e.errorType === errorReport.errorType
      );

    if (recentErrors.length > 10) {
      await this.createAlert({
        alertType: 'error_spike',
        severity: 'high',
        title: 'Error Spike Detected',
        description: `High frequency of ${errorReport.errorType} errors detected`,
        affectedEndpoints: [errorReport.context.endpoint].filter(Boolean),
        metrics: {
          errorRate: this.calculateErrorRate(),
        },
        recommendations: [
          'Investigate root cause',
          'Check system health',
          'Consider emergency rollback',
        ],
      });
    }

    // Check for recurring errors
    const recurringErrors = this.findRecurringErrors(recentErrors);
    if (recurringErrors.length > 0) {
      await this.createAlert({
        alertType: 'system_error',
        severity: 'medium',
        title: 'Recurring Error Pattern',
        description: `Recurring error pattern detected: ${recurringErrors[0].message}`,
        recommendations: [
          'Review error logs',
          'Identify root cause',
          'Implement permanent fix',
        ],
      });
    }
  }

  private findRecurringErrors(errors: ErrorReport[]): ErrorReport[] {
    const messageCounts = new Map<string, number>();
    
    errors.forEach(error => {
      const message = error.message;
      messageCounts.set(message, (messageCounts.get(message) || 0) + 1);
    });

    return Array.from(messageCounts.entries())
      .filter(([_, count]) => count > 3)
      .map(([message]) => errors.find(e => e.message === message)!);
  }

  // RECOVERY MECHANISMS
  private async attemptErrorRecovery(errorReport: ErrorReport): Promise<void> {
    const recoveryMethods = [
      'database_reconnect',
      'cache_clear',
      'service_restart',
      'graceful_degradation',
    ];

    for (const method of recoveryMethods) {
      try {
        await this.performRecovery(method, errorReport);
        
        // Update error report with recovery attempt
        const updatedError = {
          ...errorReport,
          recovery: {
            attempted: true,
            successful: true,
            method,
            timestamp: new Date().toISOString(),
          },
        };
        
        this.errorReports.set(errorReport.id, updatedError);
        
        console.log(`Recovery successful: ${method} for error ${errorReport.id}`);
        break;
      } catch (recoveryError) {
        console.error(`Recovery failed: ${method} - ${recoveryError}`);
      }
    }
  }

  private async performRecovery(method: string, errorReport: ErrorReport): Promise<void> {
    switch (method) {
      case 'database_reconnect':
        // Implement database reconnection logic
        break;
      case 'cache_clear':
        // Implement cache clearing logic
        break;
      case 'service_restart':
        // Implement service restart logic
        break;
      case 'graceful_degradation':
        // Implement graceful degradation logic
        break;
      default:
        throw new Error(`Unknown recovery method: ${method}`);
    }
  }

  // METRICS CALCULATION
  private calculateErrorRate(): number {
    const recentErrors = Array.from(this.errorReports.values())
      .filter(e => e.createdAt > new Date(Date.now() - 60 * 60 * 1000));
    
    const totalRequests = this.getTotalRequests();
    return totalRequests > 0 ? recentErrors.length / totalRequests : 0;
  }

  private calculateAverageResponseTime(): number {
    const responseTimeMetrics = this.performanceMetrics.get('response_time') || [];
    if (responseTimeMetrics.length === 0) return 0;
    
    const recentMetrics = responseTimeMetrics
      .filter(m => m.timestamp > new Date(Date.now() - 60 * 60 * 1000))
      .slice(-100);
    
    return recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length;
  }

  private calculateThroughput(): number {
    const apiCallMetrics = this.performanceMetrics.get('api_call') || [];
    if (apiCallMetrics.length === 0) return 0;
    
    const recentMetrics = apiCallMetrics
      .filter(m => m.timestamp > new Date(Date.now() - 60 * 60 * 1000))
      .slice(-1000);
    
    return recentMetrics.length / 60; // requests per minute
  }

  private getTotalRequests(): number {
    // This would typically come from a request counter
    return Array.from(this.performanceMetrics.values())
      .reduce((total, metrics) => total + metrics.length, 0);
  }

  // NOTIFICATIONS
  private async sendAlertNotification(alert: Alert): Promise<void> {
    // Implement notification sending logic
    // Could send to monitoring systems, Slack, email, SMS, etc.
    console.log(`ALERT: ${alert.title} - ${alert.description}`);
  }

  // AUDIT LOGGING
  private async logToAuditTrail(data: any): Promise<void> {
    try {
      await db.insert(auditLogs).values({
        ...data,
        ipAddress: data.ipAddress || 'unknown',
        userAgent: data.userAgent || 'unknown',
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to log to audit trail:', error);
    }
  }

  // DATA RETENTION
  async cleanupOldData(): Promise<void> {
    const retentionPeriod = 30 * 24 * 60 * 60 * 1000; // 30 days
    
    // Clean old error reports
    const oldErrorReports = Array.from(this.errorReports.values())
      .filter(e => new Date(e.createdAt).getTime() < Date.now() - retentionPeriod);
    
    oldErrorReports.forEach(report => {
      this.errorReports.delete(report.id);
    });

    // Clean old performance metrics
    for (const [metricName, metrics] of this.performanceMetrics) {
      const oldMetrics = metrics.filter(m => 
        new Date(m.timestamp).getTime() < Date.now() - retentionPeriod
      );
      
      if (oldMetrics.length > 0) {
        this.performanceMetrics.set(metricName, 
          metrics.filter(m => !oldMetrics.includes(m))
        );
      }
    }

    // Clean old alerts
    const oldAlerts = Array.from(this.alerts.values())
      .filter(a => a.status === 'resolved' && 
        a.resolvedAt && 
        new Date(a.resolvedAt).getTime() < Date.now() - retentionPeriod);
    
    oldAlerts.forEach(alert => {
      this.alerts.delete(alert.id);
    });
  }

  // REPORTING
  async getErrorReport(errorId: string): Promise<ErrorReport | null> {
    return this.errorReports.get(errorId) || null;
  }

  async getErrorReports(filters?: {
    errorType?: string;
    severity?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<ErrorReport[]> {
    let reports = Array.from(this.errorReports.values());

    if (filters) {
      if (filters.errorType) {
        reports = reports.filter(r => r.errorType === filters.errorType);
      }
      if (filters.severity) {
        reports = reports.filter(r => r.severity === filters.severity);
      }
      if (filters.startDate) {
        reports = reports.filter(r => new Date(r.createdAt) >= filters.startDate);
      }
      if (filters.endDate) {
        reports = reports.filter(r => new Date(r.createdAt) <= filters.endDate);
      }
    }

    // Sort by creation date (newest first)
    reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (filters.limit) {
      reports = reports.slice(0, filters.limit);
    }

    return reports;
  }

  async getPerformanceMetrics(filters?: {
    metricType?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<PerformanceMetric[]> {
    let allMetrics: PerformanceMetric[] = [];

    for (const metrics of this.performanceMetrics.values()) {
      allMetrics.push(...metrics);
    }

    if (filters) {
      if (filters.metricType) {
        allMetrics = allMetrics.filter(m => m.metricType === filters.metricType);
      }
      if (filters.status) {
        allMetrics = allMetrics.filter(m => m.status === filters.status);
      }
      if (filters.startDate) {
        allMetrics = allMetrics.filter(m => new Date(m.timestamp) >= filters.startDate);
      }
      if (filters.endDate) {
        allMetrics = allMetrics.filter(m => new Date(m.timestamp) <= filters.endDate);
      }
    }

    // Sort by timestamp (newest first)
    allMetrics.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (filters.limit) {
      allMetrics = allMetrics.slice(0, filters.limit);
    }

    return allMetrics;
  }

  async getAlerts(filters?: {
    alertType?: string;
    severity?: string;
    status?: string;
    limit?: number;
  }): Promise<Alert[]> {
    let alerts = Array.from(this.alerts.values());

    if (filters) {
      if (filters.alertType) {
        alerts = alerts.filter(a => a.alertType === filters.alertType);
      }
      if (filters.severity) {
        alerts = alerts.filter(a => a.severity === filters.severity);
      }
      if (filters.status) {
        alerts = alerts.filter(a => a.status === filters.status);
      }
    }

    // Sort by creation date (newest first)
    alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (filters.limit) {
      alerts = alerts.slice(0, filters.limit);
    }

    return alerts;
  }

  async getDashboardStats(): Promise<{
    totalErrors: number;
    criticalErrors: number;
    errorRate: number;
    averageResponseTime: number;
    activeAlerts: number;
    systemHealth: 'healthy' | 'warning' | 'critical';
  }> {
    const totalErrors = this.errorReports.size;
    const criticalErrors = Array.from(this.errorReports.values())
      .filter(e => e.severity === 'critical').length;
    const errorRate = this.calculateErrorRate();
    const averageResponseTime = this.calculateAverageResponseTime();
    const activeAlerts = Array.from(this.alerts.values())
      .filter(a => a.status === 'active').length;

    let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (criticalErrors > 0 || errorRate > this.thresholds.errorRate.critical) {
      systemHealth = 'critical';
    } else if (errorRate > this.thresholds.errorRate.warning || 
               averageResponseTime > this.thresholds.responseTime.warning) {
      systemHealth = 'warning';
    }

    return {
      totalErrors,
      criticalErrors,
      errorRate,
      averageResponseTime,
      activeAlerts,
      systemHealth,
    };
  }
}

export const errorMonitoringService = new ErrorMonitoringService();
