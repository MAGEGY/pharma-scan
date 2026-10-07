import { db } from '../server/db';
import { auditLogs } from '../shared/schema';

interface HealthCheck {
  id: string;
  serviceName: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastChecked: string;
  responseTime: number;
  details: {
    database?: {
      connected: boolean;
      responseTime: number;
      error?: string;
    };
    redis?: {
      connected: boolean;
      responseTime: number;
      error?: string;
    };
    externalApis?: {
      [apiName: string]: {
        connected: boolean;
        responseTime: number;
        error?: string;
      };
    };
    diskSpace?: {
      available: number;
      total: number;
      percentage: number;
    };
    memory?: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu?: {
      usage: number;
      cores: number;
    };
  };
  recommendations: string[];
  threshold: {
    warning: number;
    critical: number;
  };
}

interface SystemMetrics {
  id: string;
  timestamp: string;
  uptime: number;
  activeUsers: number;
  requestsPerSecond: number;
  averageResponseTime: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
  databaseConnections: number;
  cacheHitRate: number;
}

export class HealthCheckService {
  private healthChecks: Map<string, HealthCheck> = new Map();
  private systemMetrics: SystemMetrics[] = [];
  private thresholds = {
    responseTime: { warning: 1000, critical: 5000 }, // ms
    errorRate: { warning: 0.05, critical: 0.1 }, // percentage
    memoryUsage: { warning: 80, critical: 95 }, // percentage
    cpuUsage: { warning: 70, critical: 90 }, // percentage
    diskUsage: { warning: 80, critical: 95 }, // percentage
    databaseConnections: { warning: 80, critical: 95 }, // percentage
  };

  // HEALTH CHECKS
  async performHealthCheck(serviceName: string): Promise<HealthCheck> {
    const startTime = Date.now();
    const healthCheck: HealthCheck = {
      id: crypto.randomUUID(),
      serviceName,
      status: 'unknown',
      lastChecked: new Date().toISOString(),
      responseTime: 0,
      details: {},
      recommendations: [],
      threshold: this.getServiceThresholds(serviceName),
    };

    try {
      switch (serviceName) {
        case 'database':
          healthCheck.details.database = await this.checkDatabaseHealth();
          break;
        case 'redis':
          healthCheck.details.redis = await this.checkRedisHealth();
          break;
        case 'external-apis':
          healthCheck.details.externalApis = await this.checkExternalApisHealth();
          break;
        case 'system-resources':
          healthCheck.details.memory = await this.checkMemoryUsage();
          healthCheck.details.cpu = await this.checkCpuUsage();
          healthCheck.details.diskSpace = await this.checkDiskSpace();
          break;
        case 'application':
          healthCheck.details = await this.checkApplicationHealth();
          break;
        default:
          throw new Error(`Unknown service: ${serviceName}`);
      }

      // Determine overall status
      healthCheck.status = this.determineHealthStatus(healthCheck);
      healthCheck.recommendations = this.generateRecommendations(healthCheck);

    } catch (error) {
      healthCheck.status = 'unhealthy';
      healthCheck.recommendations = [`Health check failed: ${error.message}`];
      await this.logHealthCheckError(serviceName, error);
    }

    healthCheck.responseTime = Date.now() - startTime;
    this.healthChecks.set(serviceName, healthCheck);

    // Log health check result
    await this.logHealthCheckResult(healthCheck);

    return healthCheck;
  }

  private async checkDatabaseHealth(): Promise<HealthCheck['details']['database']> {
    const startTime = Date.now();
    
    try {
      // Test database connection
      await db.select().limit(1);
      
      const responseTime = Date.now() - startTime;
      
      // Check connection pool status
      const poolStatus = await this.checkDatabasePool();
      
      return {
        connected: true,
        responseTime,
        ...poolStatus,
      };
    } catch (error) {
      return {
        connected: false,
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  private async checkDatabasePool(): Promise<any> {
    // This would check connection pool status
    // Implementation depends on the database pool library used
    return {
      activeConnections: 5,
      idleConnections: 10,
      totalConnections: 15,
    };
  }

  private async checkRedisHealth(): Promise<HealthCheck['details']['redis']> {
    const startTime = Date.now();
    
    try {
      // Mock Redis health check - in production, use actual Redis client
      const redis = require('redis').createClient();
      await redis.ping();
      await redis.quit();
      
      return {
        connected: true,
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        connected: false,
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  private async checkExternalApisHealth(): Promise<HealthCheck['details']['externalApis']> {
    const apis = [
      'open-fda',
      'meditrone-ai',
      'price-comparison',
      'backup-storage',
    ];

    const results: HealthCheck['details']['externalApis'] = {};

    for (const api of apis) {
      const startTime = Date.now();
      try {
        // Mock API health check - in production, make actual API calls
        const response = await this.makeApiHealthRequest(api);
        results[api] = {
          connected: response.status < 500,
          responseTime: Date.now() - startTime,
          error: response.status >= 500 ? `HTTP ${response.status}` : undefined,
        };
      } catch (error) {
        results[api] = {
          connected: false,
          responseTime: Date.now() - startTime,
          error: error.message,
        };
      }
    }

    return results;
  }

  private async makeApiHealthRequest(apiName: string): Promise<{ status: number }> {
    // Mock implementation - in production, make actual health check requests
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ status: 200 });
      }, 100);
    });
  }

  private async checkMemoryUsage(): Promise<HealthCheck['details']['memory']> {
    try {
      const totalMemory = require('os').totalmem();
      const freeMemory = require('os').freemem();
      const usedMemory = totalMemory - freeMemory;
      const percentage = (usedMemory / totalMemory) * 100;

      return {
        used: Math.round(usedMemory / 1024 / 1024), // MB
        total: Math.round(totalMemory / 1024 / 1024), // MB
        percentage: Math.round(percentage * 100) / 100,
      };
    } catch (error) {
      throw new Error(`Failed to check memory usage: ${error.message}`);
    }
  }

  private async checkCpuUsage(): Promise<HealthCheck['details']['cpu']> {
    try {
      const cpus = require('os').cpus();
      const loadAverage = require('os').loadavg();
      const cores = cpus.length;
      
      // Calculate CPU usage (simplified)
      const usage = Math.min(100, loadAverage[0] * 100);

      return {
        usage: Math.round(usage),
        cores,
      };
    } catch (error) {
      throw new Error(`Failed to check CPU usage: ${error.message}`);
    }
  }

  private async checkDiskSpace(): Promise<HealthCheck['details']['diskSpace']> {
    try {
      const fs = require('fs');
      const stats = fs.statSync(process.cwd());
      
      // This is a simplified disk space check
      // In production, use proper disk space checking
      const totalSpace = 1000000; // Mock 1TB
      const availableSpace = totalSpace * 0.2; // Mock 20% available
      
      return {
        available: Math.round(availableSpace / 1024 / 1024), // GB
        total: Math.round(totalSpace / 1024 / 1024), // GB
        percentage: Math.round(((totalSpace - availableSpace) / totalSpace) * 100),
      };
    } catch (error) {
      throw new Error(`Failed to check disk space: ${error.message}`);
    }
  }

  private async checkApplicationHealth(): Promise<any> {
    try {
      // Check various application health indicators
      const health = {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        activeConnections: 0, // Would be tracked by connection manager
        lastError: null, // Would be tracked by error monitoring
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      };

      return health;
    } catch (error) {
      throw new Error(`Failed to check application health: ${error.message}`);
    }
  }

  private determineHealthStatus(healthCheck: HealthCheck): 'healthy' | 'degraded' | 'unhealthy' {
    const { details } = healthCheck;

    // Check database health
    if (details.database && !details.database.connected) {
      return 'unhealthy';
    }

    // Check external APIs
    if (details.externalApis) {
      const failedApis = Object.values(details.externalApis)
        .filter(api => !api.connected).length;
      const totalApis = Object.keys(details.externalApis).length;
      
      if (failedApis > totalApis * 0.5) {
        return 'unhealthy';
      } else if (failedApis > 0) {
        return 'degraded';
      }
    }

    // Check system resources
    if (details.memory && details.memory.percentage > this.thresholds.memoryUsage.critical) {
      return 'unhealthy';
    } else if (details.memory && details.memory.percentage > this.thresholds.memoryUsage.warning) {
      return 'degraded';
    }

    if (details.cpu && details.cpu.usage > this.thresholds.cpuUsage.critical) {
      return 'unhealthy';
    } else if (details.cpu && details.cpu.usage > this.thresholds.cpuUsage.warning) {
      return 'degraded';
    }

    if (details.diskSpace && details.diskSpace.percentage > this.thresholds.diskUsage.critical) {
      return 'unhealthy';
    } else if (details.diskSpace && details.diskSpace.percentage > this.thresholds.diskUsage.warning) {
      return 'degraded';
    }

    return 'healthy';
  }

  private generateRecommendations(healthCheck: HealthCheck): string[] {
    const recommendations: string[] = [];
    const { details } = healthCheck;

    if (details.database && !details.database.connected) {
      recommendations.push('Check database connection and configuration');
    }

    if (details.database && details.database.responseTime > this.thresholds.responseTime.warning) {
      recommendations.push('Optimize database queries and connection pool');
    }

    if (details.externalApis) {
      Object.entries(details.externalApis).forEach(([api, status]) => {
        if (!status.connected) {
          recommendations.push(`Check ${api} API connectivity and configuration`);
        }
        if (status.responseTime > this.thresholds.responseTime.warning) {
          recommendations.push(`Optimize ${api} API response time`);
        }
      });
    }

    if (details.memory && details.memory.percentage > this.thresholds.memoryUsage.warning) {
      recommendations.push('Monitor memory usage and consider optimization');
    }

    if (details.cpu && details.cpu.usage > this.thresholds.cpuUsage.warning) {
      recommendations.push('Investigate high CPU usage and optimize processes');
    }

    if (details.diskSpace && details.diskSpace.percentage > this.thresholds.diskUsage.warning) {
      recommendations.push('Clean up disk space and consider storage expansion');
    }

    if (recommendations.length === 0) {
      recommendations.push('System is operating normally');
    }

    return recommendations;
  }

  private getServiceThresholds(serviceName: string): HealthCheck['threshold'] {
    switch (serviceName) {
      case 'database':
        return {
          warning: this.thresholds.responseTime.warning,
          critical: this.thresholds.responseTime.critical,
        };
      case 'external-apis':
        return {
          warning: this.thresholds.responseTime.warning,
          critical: this.thresholds.responseTime.critical,
        };
      case 'system-resources':
        return {
          warning: this.thresholds.memoryUsage.warning,
          critical: this.thresholds.memoryUsage.critical,
        };
      default:
        return {
          warning: 1000,
          critical: 5000,
        };
    }
  }

  // SYSTEM METRICS
  async collectSystemMetrics(): Promise<SystemMetrics> {
    const metrics: SystemMetrics = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      activeUsers: await this.getActiveUserCount(),
      requestsPerSecond: await this.getRequestsPerSecond(),
      averageResponseTime: await this.getAverageResponseTime(),
      errorRate: await this.getErrorRate(),
      memoryUsage: await this.getCurrentMemoryUsage(),
      cpuUsage: await this.getCurrentCpuUsage(),
      diskUsage: await this.getCurrentDiskUsage(),
      databaseConnections: await this.getDatabaseConnectionCount(),
      cacheHitRate: await this.getCacheHitRate(),
    };

    this.systemMetrics.push(metrics);

    // Keep only last 1000 metrics
    if (this.systemMetrics.length > 1000) {
      this.systemMetrics = this.systemMetrics.slice(-1000);
    }

    return metrics;
  }

  private async getActiveUserCount(): Promise<number> {
    // This would query the database for active users
    // Mock implementation
    return Math.floor(Math.random() * 1000) + 100;
  }

  private async getRequestsPerSecond(): Promise<number> {
    // This would calculate requests per second from logs
    // Mock implementation
    return Math.floor(Math.random() * 500) + 50;
  }

  private async getAverageResponseTime(): Promise<number> {
    // This would calculate from recent request logs
    // Mock implementation
    return Math.floor(Math.random() * 200) + 100;
  }

  private async getErrorRate(): Promise<number> {
    // This would calculate from error logs
    // Mock implementation
    return Math.random() * 0.05; // 0-5% error rate
  }

  private async getCurrentMemoryUsage(): Promise<number> {
    const memory = await this.checkMemoryUsage();
    return memory.percentage;
  }

  private async getCurrentCpuUsage(): Promise<number> {
    const cpu = await this.checkCpuUsage();
    return cpu.usage;
  }

  private async getCurrentDiskUsage(): Promise<number> {
    const disk = await this.checkDiskSpace();
    return disk.percentage;
  }

  private async getDatabaseConnectionCount(): Promise<number> {
    // This would check actual database connection pool
    // Mock implementation
    return Math.floor(Math.random() * 20) + 5;
  }

  private async getCacheHitRate(): Promise<number> {
    // This would check actual cache performance
    // Mock implementation
    return Math.random() * 0.9 + 0.1; // 10-100% hit rate
  }

  // LOGGING
  private async logHealthCheckResult(healthCheck: HealthCheck): Promise<void> {
    try {
      await db.insert(auditLogs).values({
        action: 'health_check',
        resource: healthCheck.serviceName,
        resourceId: healthCheck.id,
        newValues: {
          status: healthCheck.status,
          responseTime: healthCheck.responseTime,
          details: healthCheck.details,
          recommendations: healthCheck.recommendations,
        },
        success: healthCheck.status === 'healthy',
        errorMessage: healthCheck.status === 'unhealthy' ? 'Health check failed' : null,
        ipAddress: '127.0.0.1',
        userAgent: 'health-check-service',
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to log health check result:', error);
    }
  }

  private async logHealthCheckError(serviceName: string, error: Error): Promise<void> {
    try {
      await db.insert(auditLogs).values({
        action: 'health_check_error',
        resource: serviceName,
        errorMessage: error.message,
        success: false,
        ipAddress: '127.0.0.1',
        userAgent: 'health-check-service',
        createdAt: new Date(),
      });
    } catch (logError) {
      console.error('Failed to log health check error:', logError);
    }
  }

  // API METHODS
  async getHealthStatus(serviceName?: string): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    services: HealthCheck[];
    timestamp: string;
  }> {
    const services = serviceName ? [serviceName] : [
      'database',
      'redis',
      'external-apis',
      'system-resources',
      'application',
    ];

    const healthChecks = await Promise.all(
      services.map(service => this.performHealthCheck(service))
    );

    const overall = this.determineOverallHealth(healthChecks);

    return {
      overall,
      services: healthChecks,
      timestamp: new Date().toISOString(),
    };
  }

  private determineOverallHealth(healthChecks: HealthCheck[]): 'healthy' | 'degraded' | 'unhealthy' {
    const unhealthyCount = healthChecks.filter(check => check.status === 'unhealthy').length;
    const degradedCount = healthChecks.filter(check => check.status === 'degraded').length;

    if (unhealthyCount > 0) {
      return 'unhealthy';
    } else if (degradedCount > 0 || unhealthyCount > 0) {
      return 'degraded';
    }

    return 'healthy';
  }

  async getSystemMetrics(timeRange?: {
    startTime?: Date;
    endTime?: Date;
  }): Promise<SystemMetrics[]> {
    let metrics = [...this.systemMetrics];

    if (timeRange) {
      metrics = metrics.filter(metric => {
        const metricTime = new Date(metric.timestamp);
        return metricTime >= (timeRange.startTime || new Date(0)) &&
               metricTime <= (timeRange.endTime || new Date());
      });
    }

    return metrics;
  }

  async getServiceHealth(serviceName: string): Promise<HealthCheck | null> {
    return this.healthChecks.get(serviceName) || null;
  }

  async getAllServiceHealth(): Promise<HealthCheck[]> {
    return Array.from(this.healthChecks.values());
  }

  // HEALTH CHECK SCHEDULER
  startHealthCheckScheduler(): void {
    // Run health checks every 5 minutes
    setInterval(async () => {
      try {
        await this.getHealthStatus();
        console.log('Scheduled health check completed');
      } catch (error) {
        console.error('Scheduled health check failed:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Collect system metrics every minute
    setInterval(async () => {
      try {
        await this.collectSystemMetrics();
        console.log('System metrics collected');
      } catch (error) {
        console.error('System metrics collection failed:', error);
      }
    }, 60 * 1000); // 1 minute
  }
}

export const healthCheckService = new HealthCheckService();
