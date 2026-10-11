import fs from 'fs';
import path from 'path';
import { drizzle } from 'drizzle-orm/postgres-js';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { PGlite } from '@electric-sql/pglite';
import postgres from 'postgres';
import * as schema from '../shared/schema';

// Database configuration:
// - A real remote DATABASE_URL (hosted Postgres) uses the postgres.js driver.
// - Otherwise the database runs embedded via PGlite (Postgres in WASM) with
//   its data directory persisted on the mounted Render Disk - the same
//   disk-based persistence model as the PharmaPOS deployment.
const connectionString = process.env.DATABASE_URL || '';
const isRemotePostgres =
  /^postgres(ql)?:\/\//.test(connectionString) &&
  !/localhost|127\.0\.0\.1/.test(connectionString);

const isProduction = process.env.NODE_ENV === 'production';

function resolveDataDir(): string {
  const configured = process.env.DATA_DIR;
  if (configured) return configured;
  // Render Disk mount used by the PharmaPOS deployment pattern
  const diskPath = '/opt/render/project/src/data';
  if (fs.existsSync('/opt/render/project/src')) return path.join(diskPath, 'pgdata');
  return path.join(process.cwd(), 'data', 'pgdata');
}

let client: ReturnType<typeof postgres> | null = null;
let pglite: PGlite | null = null;
let db: any;

if (isRemotePostgres) {
  const poolConfig = {
    max: isProduction ? 50 : 10,
    idle_timeout: isProduction ? 60 : 30,
    connect_timeout: 10,
    max_lifetime: isProduction ? 2 * 60 * 60 : 60 * 60,
    prepare: false,
    onnotice: (notice: any) => console.log('Database notice:', notice),
    debug: process.env.NODE_ENV === 'development',
    transform: postgres.camel,
    retry: 3,
    backoff: { min: 100, max: 1000, factor: 2 },
    statement_timeout: isProduction ? 30000 : 60000,
    ...(process.env.DATABASE_READ_URL && {
      read_url: process.env.DATABASE_READ_URL,
    }),
  };

  client = postgres(connectionString, poolConfig);
  db = drizzle(client, {
    schema,
    logger: process.env.NODE_ENV === 'development',
  });
  console.log('Database: remote PostgreSQL via postgres.js');
} else {
  const dataDir = resolveDataDir();
  fs.mkdirSync(dataDir, { recursive: true });
  pglite = new PGlite(dataDir);
  db = drizzlePglite(pglite, {
    schema,
    logger: process.env.NODE_ENV === 'development',
  });
  console.log(`Database: embedded PGlite (Postgres in WASM) persisted at ${dataDir}`);
}

// Apply the generated schema SQL once when starting from an empty PGlite data dir.
async function ensurePgliteSchema(): Promise<void> {
  if (!pglite) return;
  try {
    const existing = await pglite.query(
      "SELECT to_regclass('public.users') AS t",
    );
    if (existing.rows?.[0]?.t) return;

    const migrationsDir = path.resolve(process.cwd(), 'migrations');
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      for (const statement of sql.split('--> statement-breakpoint')) {
        const trimmed = statement.trim();
        if (trimmed) await pglite.exec(trimmed);
      }
      console.log(`Applied migration: ${file}`);
    }
    console.log('PGlite schema ready');
  } catch (error) {
    console.error('PGlite schema setup failed:', error);
    throw error;
  }
}

if (pglite) {
  void ensurePgliteSchema();
}

// Enhanced connection pool monitoring
export const getPoolStats = () => {
  if (pglite) {
    return {
      totalConnections: 1,
      idleConnections: 0,
      waitingConnections: 0,
      activeConnections: 1,
      poolUtilization: 'embedded',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      driver: 'pglite',
    };
  }
  const maxConnections = isProduction ? 50 : 10;
  const estimatedActive = isProduction ? Math.min(maxConnections * 0.6, 30) : Math.min(maxConnections * 0.3, 3);
  const estimatedIdle = maxConnections - estimatedActive;

  const stats = {
    totalConnections: maxConnections,
    idleConnections: estimatedIdle,
    waitingConnections: 0,
    activeConnections: estimatedActive,
    poolUtilization: ((estimatedActive / maxConnections) * 100).toFixed(1) + '%',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    driver: 'postgres.js',
  };

  if (parseFloat(stats.poolUtilization) > 80) {
    console.warn(`High database pool utilization: ${stats.poolUtilization}`);
  }

  return stats;
};

// Advanced health check with performance metrics
export const checkDatabaseHealth = async () => {
  try {
    const start = Date.now();
    let connectivityTime = 0;
    let queryTime = 0;
    let transactionTime = 0;

    if (pglite) {
      const t0 = Date.now();
      await pglite.query('SELECT 1');
      connectivityTime = Date.now() - t0;

      const t1 = Date.now();
      await pglite.query('SELECT COUNT(*) FROM users');
      queryTime = Date.now() - t1;

      const t2 = Date.now();
      await pglite.transaction(async (tx: any) => {
        await tx.query('SELECT 1');
      });
      transactionTime = Date.now() - t2;
    } else if (client) {
      const t0 = Date.now();
      await client`SELECT 1`;
      connectivityTime = Date.now() - t0;

      const t1 = Date.now();
      await client`SELECT COUNT(*) FROM users LIMIT 1`;
      queryTime = Date.now() - t1;

      const t2 = Date.now();
      await client.begin(async (tx) => {
        await tx`SELECT 1`;
        return true;
      });
      transactionTime = Date.now() - t2;
    }

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
    if (pglite) {
      await pglite.close();
    } else if (client) {
      await client.end();
    }
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

export { db, schema };
