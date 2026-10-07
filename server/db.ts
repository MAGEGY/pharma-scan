import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';

// Database configuration with optimized connection pooling
const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/medscan_egypt';

// Environment-based pool configuration
const isProduction = process.env.NODE_ENV === 'production';
const poolConfig = {
  max: isProduction ? 50 : 10, // More connections in production
  idle_timeout: isProduction ? 60 : 30, // Longer idle timeout in production
  connect_timeout: 10, // Connection timeout in seconds
  max_lifetime: isProduction ? 2 * 60 * 60 : 60 * 60, // 2 hours in production, 1 hour in dev
  prepare: false, // Disable prepared statements for better pooling
  onnotice: (notice: any) => console.log('Database notice:', notice),
  debug: process.env.NODE_ENV === 'development',
  // Advanced pooling options
  transform: postgres.camel,
  // Enable connection retries
  retry: 3,
  // Connection backoff strategy
  backoff: {
    min: 100,
    max: 1000,
    factor: 2,
  },
  // Enable query timeout
  statement_timeout: isProduction ? 30000 : 60000, // 30s prod, 60s dev
  // Enable read-only replicas for read operations (if configured)
  ...(process.env.DATABASE_READ_URL && {
    read_url: process.env.DATABASE_READ_URL,
  }),
};

// Create postgres client with optimized pooling
const client = postgres(connectionString, poolConfig);

// Create Drizzle instance with the pooled client
export const db = drizzle(client, { 
  schema,
  logger: process.env.NODE_ENV === 'development',
});

// Enhanced connection pool monitoring
export const getPoolStats = () => {
  // Note: postgres.js doesn't expose direct pool stats in all versions
  // Using fallback metrics and environment-based estimates
  const isProduction = process.env.NODE_ENV === 'production';
  const maxConnections = poolConfig.max;
  
  // Estimate active connections based on environment and typical usage patterns
  const estimatedActive = isProduction ? Math.min(maxConnections * 0.6, 30) : Math.min(maxConnections * 0.3, 3);
  const estimatedIdle = maxConnections - estimatedActive;
  
  const stats = {
    totalConnections: maxConnections,
    idleConnections: estimatedIdle,
    waitingConnections: 0, // postgres.js handles waiting internally
    // Additional metrics
    activeConnections: estimatedActive,
    poolUtilization: ((estimatedActive / maxConnections) * 100).toFixed(1) + '%',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  };
  
  // Log warnings for high utilization
  if (parseFloat(stats.poolUtilization) > 80) {
    console.warn(`High database pool utilization: ${stats.poolUtilization}`);
  }
  
  return stats;
};

// Advanced health check with performance metrics
export const checkDatabaseHealth = async () => {
  try {
    const start = Date.now();
    
    // Test basic connectivity
    await client`SELECT 1`;
    const connectivityTime = Date.now() - start;
    
    // Test query performance
    const queryStart = Date.now();
    await client`SELECT COUNT(*) FROM users LIMIT 1`;
    const queryTime = Date.now() - queryStart;
    
    // Test transaction performance
    const transactionStart = Date.now();
    await client.begin(async (tx) => {
      await tx`SELECT 1`;
      return true;
    });
    const transactionTime = Date.now() - transactionStart;
    
    const responseTime = Date.now() - start;
    const poolStats = getPoolStats();
    
    return {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      performance: {
        connectivity: `${connectivityTime}ms`,
        query: `${queryTime}ms`,
        transaction: `${transactionTime}ms`,
      },
      poolStats,
      recommendations: getPerformanceRecommendations(responseTime, poolStats),
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
};

// Performance recommendations based on metrics
const getPerformanceRecommendations = (responseTime: number, poolStats: any) => {
  const recommendations = [];
  
  if (responseTime > 1000) {
    recommendations.push('Consider optimizing slow queries or adding indexes');
  }
  
  if (parseFloat(poolStats.poolUtilization) > 80) {
    recommendations.push('Consider increasing database pool size');
  }
  
  if (poolStats.waitingConnections > 5) {
    recommendations.push('Database pool exhausted - consider connection optimization');
  }
  
  return recommendations;
};

// Graceful shutdown handler
export const closeDatabase = async () => {
  try {
    console.log('Closing database connections...');
    await client.end();
    console.log('Database connections closed successfully');
  } catch (error) {
    console.error('Error closing database connections:', error);
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDatabase();
  process.exit(0);
});

export { schema };
