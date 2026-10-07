import { db } from '../server/db';
import { auditLogs } from '../shared/schema';
import { healthCheckService } from './healthCheckService';
import { loggingService } from './loggingService';

interface MetricData {
  timestamp: string;
  value: number;
  unit: string;
  metadata?: Record<string, any>;
}

interface DashboardMetric {
  id: string;
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'timeseries';
  currentValue: number;
  unit: string;
  description: string;
  category: 'performance' | 'business' | 'system' | 'user' | 'error';
  thresholds?: {
    warning: number;
    critical: number;
  };
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  history: MetricData[];
  lastUpdated: string;
}

interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'alert';
  title: string;
  category: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: {
    metrics?: string[];
    timeRange?: string;
    refreshInterval?: number;
    chartType?: 'line' | 'bar' | 'pie' | 'area';
    showLegend?: boolean;
    showGrid?: boolean;
  };
  data?: any;
}

interface DashboardAlert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  title: string;
  description: string;
  metric: string;
  currentValue: number;
  threshold: number;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export class MetricsDashboardService {
  private metrics: Map<string, DashboardMetric> = new Map();
  private widgets: Map<string, DashboardWidget> = new Map();
  private alerts: Map<string, DashboardAlert> = new Map();
  private updateInterval = 30000; // 30 seconds

  constructor() {
    this.initializeMetrics();
    this.initializeWidgets();
    this.startMetricsCollection();
  }

  // METRICS INITIALIZATION
  private initializeMetrics(): void {
    // Performance Metrics
    this.metrics.set('response_time', {
      id: 'response_time',
      name: 'Average Response Time',
      type: 'gauge',
      currentValue: 0,
      unit: 'ms',
      description: 'Average API response time',
      category: 'performance',
      thresholds: { warning: 1000, critical: 5000 },
      trend: 'stable',
      trendPercentage: 0,
      history: [],
      lastUpdated: new Date().toISOString(),
    });

    this.metrics.set('requests_per_second', {
      id: 'requests_per_second',
      name: 'Requests Per Second',
      type: 'gauge',
      currentValue: 0,
      unit: 'req/s',
      description: 'Current request rate',
      category: 'performance',
      thresholds: { warning: 100, critical: 500 },
      trend: 'stable',
      trendPercentage: 0,
      history: [],
      lastUpdated: new Date().toISOString(),
    });

    this.metrics.set('error_rate', {
      id: 'error_rate',
      name: 'Error Rate',
      type: 'gauge',
      currentValue: 0,
      unit: '%',
      description: 'Percentage of failed requests',
      category: 'error',
      thresholds: { warning: 5, critical: 10 },
      trend: 'stable',
      trendPercentage: 0,
      history: [],
      lastUpdated: new Date().toISOString(),
    });

    // Business Metrics
    this.metrics.set('active_users', {
      id: 'active_users',
      name: 'Active Users',
      type: 'gauge',
      currentValue: 0,
      unit: 'users',
      description: 'Number of currently active users',
      category: 'user',
      thresholds: { warning: 1000, critical: 2000 },
      trend: 'stable',
      trendPercentage: 0,
      history: [],
      lastUpdated: new Date().toISOString(),
    });

    this.metrics.set('daily_scans', {
      id: 'daily_scans',
      name: 'Daily Scans',
      type: 'counter',
      currentValue: 0,
      unit: 'scans',
      description: 'Number of scans performed today',
      category: 'business',
      thresholds: { warning: 1000, critical: 5000 },
      trend: 'stable',
      trendPercentage: 0,
      history: [],
      lastUpdated: new Date().toISOString(),
    });

    this.metrics.set('backup_success_rate', {
      id: 'backup_success_rate',
      name: 'Backup Success Rate',
      type: 'gauge',
      currentValue: 100,
      unit: '%',
      description: 'Percentage of successful backups',
      category: 'system',
      thresholds: { warning: 95, critical: 90 },
      trend: 'stable',
      trendPercentage: 0,
      history: [],
      lastUpdated: new Date().toISOString(),
    });

    // System Metrics
    this.metrics.set('memory_usage', {
      id: 'memory_usage',
      name: 'Memory Usage',
      type: 'gauge',
      currentValue: 0,
      unit: '%',
      description: 'System memory usage percentage',
      category: 'system',
      thresholds: { warning: 80, critical: 95 },
      trend: 'stable',
      trendPercentage: 0,
      history: [],
      lastUpdated: new Date().toISOString(),
    });

    this.metrics.set('cpu_usage', {
      id: 'cpu_usage',
      name: 'CPU Usage',
      type: 'gauge',
      currentValue: 0,
      unit: '%',
      description: 'System CPU usage percentage',
      category: 'system',
      thresholds: { warning: 70, critical: 90 },
      trend: 'stable',
      trendPercentage: 0,
      history: [],
      lastUpdated: new Date().toISOString(),
    });

    this.metrics.set('disk_usage', {
      id: 'disk_usage',
      name: 'Disk Usage',
      type: 'gauge',
      currentValue: 0,
      unit: '%',
      description: 'Disk space usage percentage',
      category: 'system',
      thresholds: { warning: 80, critical: 95 },
      trend: 'stable',
      trendPercentage: 0,
      history: [],
      lastUpdated: new Date().toISOString(),
    });

    this.metrics.set('database_connections', {
      id: 'database_connections',
      name: 'Database Connections',
      type: 'gauge',
      currentValue: 0,
      unit: 'connections',
      description: 'Active database connections',
      category: 'system',
      thresholds: { warning: 80, critical: 95 },
      trend: 'stable',
      trendPercentage: 0,
      history: [],
      lastUpdated: new Date().toISOString(),
    });
  }

  private initializeWidgets(): void {
    // Performance Overview Widget
    this.widgets.set('performance_overview', {
      id: 'performance_overview',
      type: 'chart',
      title: 'Performance Overview',
      category: 'performance',
      position: { x: 0, y: 0, width: 6, height: 4 },
      config: {
        metrics: ['response_time', 'requests_per_second', 'error_rate'],
        timeRange: '1h',
        chartType: 'line',
        showLegend: true,
        showGrid: true,
      },
    });

    // System Health Widget
    this.widgets.set('system_health', {
      id: 'system_health',
      type: 'chart',
      title: 'System Health',
      category: 'system',
      position: { x: 6, y: 0, width: 6, height: 4 },
      config: {
        metrics: ['memory_usage', 'cpu_usage', 'disk_usage'],
        timeRange: '1h',
        chartType: 'area',
        showLegend: true,
        showGrid: true,
      },
    });

    // User Activity Widget
    this.widgets.set('user_activity', {
      id: 'user_activity',
      type: 'chart',
      title: 'User Activity',
      category: 'user',
      position: { x: 0, y: 4, width: 6, height: 4 },
      config: {
        metrics: ['active_users'],
        timeRange: '24h',
        chartType: 'bar',
        showLegend: false,
        showGrid: true,
      },
    });

    // Business Metrics Widget
    this.widgets.set('business_metrics', {
      id: 'business_metrics',
      type: 'table',
      title: 'Business Metrics',
      category: 'business',
      position: { x: 6, y: 4, width: 6, height: 4 },
      config: {
        metrics: ['daily_scans', 'backup_success_rate'],
        timeRange: '24h',
      },
    });

    // Alerts Widget
    this.widgets.set('alerts', {
      id: 'alerts',
      type: 'alert',
      title: 'Active Alerts',
      category: 'error',
      position: { x: 0, y: 8, width: 12, height: 2 },
      config: {
        refreshInterval: 10000, // 10 seconds
      },
    });
  }

  // METRICS COLLECTION
  private async startMetricsCollection(): void {
    setInterval(async () => {
      try {
        await this.collectAllMetrics();
        await this.updateWidgets();
        await this.checkAlerts();
      } catch (error) {
        console.error('Failed to collect metrics:', error);
      }
    }, this.updateInterval);
  }

  private async collectAllMetrics(): Promise<void> {
    // Collect performance metrics
    await this.collectPerformanceMetrics();
    
    // Collect business metrics
    await this.collectBusinessMetrics();
    
    // Collect system metrics
    await this.collectSystemMetrics();
    
    // Collect user metrics
    await this.collectUserMetrics();
  }

  private async collectPerformanceMetrics(): Promise<void> {
    try {
      // Get response time
      const avgResponseTime = await this.getAverageResponseTime();
      this.updateMetric('response_time', avgResponseTime);

      // Get requests per second
      const requestsPerSecond = await this.getRequestsPerSecond();
      this.updateMetric('requests_per_second', requestsPerSecond);

      // Get error rate
      const errorRate = await this.getErrorRate();
      this.updateMetric('error_rate', errorRate);
    } catch (error) {
      console.error('Failed to collect performance metrics:', error);
    }
  }

  private async collectBusinessMetrics(): Promise<void> {
    try {
      // Get daily scans
      const dailyScans = await this.getDailyScans();
      this.updateMetric('daily_scans', dailyScans);

      // Get backup success rate
      const backupSuccessRate = await this.getBackupSuccessRate();
      this.updateMetric('backup_success_rate', backupSuccessRate);
    } catch (error) {
      console.error('Failed to collect business metrics:', error);
    }
  }

  private async collectSystemMetrics(): Promise<void> {
    try {
      // Get system metrics from health check service
      const systemMetrics = await healthCheckService.collectSystemMetrics();
      
      this.updateMetric('memory_usage', systemMetrics.memoryUsage);
      this.updateMetric('cpu_usage', systemMetrics.cpuUsage);
      this.updateMetric('disk_usage', systemMetrics.diskUsage);
      this.updateMetric('database_connections', systemMetrics.databaseConnections);
    } catch (error) {
      console.error('Failed to collect system metrics:', error);
    }
  }

  private async collectUserMetrics(): Promise<void> {
    try {
      // Get active users
      const activeUsers = await this.getActiveUsers();
      this.updateMetric('active_users', activeUsers);
    } catch (error) {
      console.error('Failed to collect user metrics:', error);
    }
  }

  private updateMetric(metricId: string, value: number): void {
    const metric = this.metrics.get(metricId);
    if (!metric) return;

    const previousValue = metric.currentValue;
    metric.currentValue = value;
    metric.lastUpdated = new Date().toISOString();

    // Calculate trend
    if (metric.history.length > 0) {
      const lastValue = metric.history[metric.history.length - 1].value;
      if (lastValue !== 0) {
        const change = ((value - lastValue) / lastValue) * 100;
        metric.trendPercentage = change;
        metric.trend = change > 5 ? 'up' : change < -5 ? 'down' : 'stable';
      }
    }

    // Add to history
    metric.history.push({
      timestamp: new Date().toISOString(),
      value,
      unit: metric.unit,
    });

    // Keep only last 100 data points
    if (metric.history.length > 100) {
      metric.history = metric.history.slice(-100);
    }

    // Check for alerts
    this.checkMetricAlert(metric);
  }

  private async checkMetricAlert(metric: DashboardMetric): Promise<void> {
    if (!metric.thresholds) return;

    const { warning, critical } = metric.thresholds;
    
    if (metric.currentValue >= critical) {
      await this.createAlert('critical', metric);
    } else if (metric.currentValue >= warning) {
      await this.createAlert('warning', metric);
    }
  }

  private async createAlert(type: DashboardAlert['type'], metric: DashboardMetric): Promise<void> {
    const alertId = `${metric.id}_${type}_${Date.now()}`;
    
    const alert: DashboardAlert = {
      id: alertId,
      type,
      title: `${metric.name} ${type === 'critical' ? 'Critical' : 'Warning'}`,
      description: `${metric.name} is ${metric.currentValue} ${metric.unit} (${type} threshold: ${metric.thresholds![type]})`,
      metric: metric.id,
      currentValue: metric.currentValue,
      threshold: metric.thresholds![type],
      timestamp: new Date().toISOString(),
      acknowledged: false,
    };

    this.alerts.set(alertId, alert);

    // Log alert
    loggingService.warn(`Dashboard Alert: ${alert.title}`, {}, {
      business: {
        action: 'alert_triggered',
        metric: metric.id,
        value: metric.currentValue,
        threshold: metric.thresholds![type],
      },
    });
  }

  // DATA RETRIEVAL METHODS
  private async getAverageResponseTime(): Promise<number> {
    try {
      const logs = await loggingService.getLogs({
        startTime: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
        tags: ['api'],
      });

      const responseTimes = logs
        .filter(log => log.metadata.duration)
        .map(log => log.metadata.duration!);

      return responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
        : 0;
    } catch (error) {
      return 0;
    }
  }

  private async getRequestsPerSecond(): Promise<number> {
    try {
      const logs = await loggingService.getLogs({
        startTime: new Date(Date.now() - 60 * 1000), // Last minute
        tags: ['api'],
      });

      return logs.length / 60; // requests per second
    } catch (error) {
      return 0;
    }
  }

  private async getErrorRate(): Promise<number> {
    try {
      const logs = await loggingService.getLogs({
        startTime: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
        tags: ['api'],
      });

      const errorLogs = logs.filter(log => 
        log.metadata.statusCode && log.metadata.statusCode >= 400
      );

      return logs.length > 0 ? (errorLogs.length / logs.length) * 100 : 0;
    } catch (error) {
      return 0;
    }
  }

  private async getDailyScans(): Promise<number> {
    try {
      const logs = await loggingService.getLogs({
        startTime: new Date(new Date().setHours(0, 0, 0, 0)), // Start of today
        tags: ['drug-related'],
      });

      return logs.length;
    } catch (error) {
      return 0;
    }
  }

  private async getBackupSuccessRate(): Promise<number> {
    try {
      const logs = await loggingService.getLogs({
        startTime: new Date(new Date().setHours(0, 0, 0, 0)), // Start of today
        tags: ['backup'],
      });

      const successLogs = logs.filter(log => 
        log.metadata.business?.result === 'success'
      );

      return logs.length > 0 ? (successLogs.length / logs.length) * 100 : 100;
    } catch (error) {
      return 100;
    }
  }

  private async getActiveUsers(): Promise<number> {
    try {
      const logs = await loggingService.getLogs({
        startTime: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
      });

      const uniqueUsers = new Set(
        logs
          .filter(log => log.context.userId)
          .map(log => log.context.userId!)
      );

      return uniqueUsers.size;
    } catch (error) {
      return 0;
    }
  }

  // WIDGET UPDATES
  private async updateWidgets(): Promise<void> {
    for (const widget of this.widgets.values()) {
      try {
        widget.data = await this.getWidgetData(widget);
      } catch (error) {
        console.error(`Failed to update widget ${widget.id}:`, error);
      }
    }
  }

  private async getWidgetData(widget: DashboardWidget): Promise<any> {
    switch (widget.type) {
      case 'chart':
        return this.getChartData(widget);
      case 'table':
        return this.getTableData(widget);
      case 'alert':
        return this.getAlertData(widget);
      default:
        return null;
    }
  }

  private async getChartData(widget: DashboardWidget): Promise<any> {
    if (!widget.config.metrics) return null;

    const data = {
      labels: [] as string[],
      datasets: [] as any[],
    };

    for (const metricId of widget.config.metrics) {
      const metric = this.metrics.get(metricId);
      if (!metric) continue;

      const timeRange = this.parseTimeRange(widget.config.timeRange || '1h');
      const history = metric.history
        .filter(point => new Date(point.timestamp) >= timeRange.startTime)
        .filter(point => new Date(point.timestamp) <= timeRange.endTime);

      if (data.labels.length === 0) {
        data.labels = history.map(point => 
          new Date(point.timestamp).toLocaleTimeString()
        );
      }

      data.datasets.push({
        label: metric.name,
        data: history.map(point => point.value),
        borderColor: this.getMetricColor(metricId),
        backgroundColor: this.getMetricColor(metricId, 0.2),
        tension: 0.4,
      });
    }

    return data;
  }

  private async getTableData(widget: DashboardWidget): Promise<any> {
    if (!widget.config.metrics) return null;

    const rows = widget.config.metrics.map(metricId => {
      const metric = this.metrics.get(metricId);
      if (!metric) return null;

      return {
        name: metric.name,
        value: `${metric.currentValue} ${metric.unit}`,
        trend: metric.trend,
        trendPercentage: metric.trendPercentage,
        status: this.getMetricStatus(metric),
      };
    }).filter(Boolean);

    return rows;
  }

  private async getAlertData(widget: DashboardWidget): Promise<any> {
    const alerts = Array.from(this.alerts.values())
      .filter(alert => !alert.acknowledged)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    return alerts;
  }

  private parseTimeRange(timeRange: string): { startTime: Date; endTime: Date } {
    const now = new Date();
    const endTime = now;

    let startTime: Date;
    switch (timeRange) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
    }

    return { startTime, endTime };
  }

  private getMetricColor(metricId: string, alpha: number = 1): string {
    const colors = {
      response_time: `rgba(255, 99, 132, ${alpha})`,
      requests_per_second: `rgba(54, 162, 235, ${alpha})`,
      error_rate: `rgba(255, 205, 86, ${alpha})`,
      active_users: `rgba(75, 192, 192, ${alpha})`,
      daily_scans: `rgba(153, 102, 255, ${alpha})`,
      backup_success_rate: `rgba(255, 159, 64, ${alpha})`,
      memory_usage: `rgba(255, 99, 132, ${alpha})`,
      cpu_usage: `rgba(255, 205, 86, ${alpha})`,
      disk_usage: `rgba(54, 162, 235, ${alpha})`,
      database_connections: `rgba(75, 192, 192, ${alpha})`,
    };

    return colors[metricId as keyof typeof colors] || `rgba(201, 203, 207, ${alpha})`;
  }

  private getMetricStatus(metric: DashboardMetric): 'good' | 'warning' | 'critical' {
    if (!metric.thresholds) return 'good';
    
    if (metric.currentValue >= metric.thresholds.critical) return 'critical';
    if (metric.currentValue >= metric.thresholds.warning) return 'warning';
    return 'good';
  }

  // API METHODS
  async getDashboardData(): Promise<{
    metrics: DashboardMetric[];
    widgets: DashboardWidget[];
    alerts: DashboardAlert[];
    timestamp: string;
  }> {
    return {
      metrics: Array.from(this.metrics.values()),
      widgets: Array.from(this.widgets.values()),
      alerts: Array.from(this.alerts.values()),
      timestamp: new Date().toISOString(),
    };
  }

  async getMetric(metricId: string): Promise<DashboardMetric | null> {
    return this.metrics.get(metricId) || null;
  }

  async getWidget(widgetId: string): Promise<DashboardWidget | null> {
    return this.widgets.get(widgetId) || null;
  }

  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (!alert) return;

    alert.acknowledged = true;
    alert.acknowledgedBy = userId;
    alert.acknowledgedAt = new Date().toISOString();

    loggingService.info(`Alert acknowledged: ${alert.title}`, {
      userId,
    }, {
      business: {
        action: 'alert_acknowledged',
        alertId,
      },
    });
  }

  private async checkAlerts(): Promise<void> {
    // Clean up old alerts (older than 24 hours)
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    for (const [alertId, alert] of this.alerts) {
      if (new Date(alert.timestamp) < cutoffTime && alert.acknowledged) {
        this.alerts.delete(alertId);
      }
    }
  }
}

export const metricsDashboardService = new MetricsDashboardService();
