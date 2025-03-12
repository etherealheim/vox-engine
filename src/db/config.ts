import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, PoolClient } from 'pg';
import * as schema from './schema';

/**
 * Database configuration
 * Loads environment variables and creates a PostgreSQL connection pool with optimized settings
 */

// Load environment variables
const POSTGRES_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!POSTGRES_URL) {
  throw new Error('POSTGRES_URL or DATABASE_URL environment variable is not set');
}

// Connection pool configuration with optimized settings
const poolConfig = {
  connectionString: POSTGRES_URL,
  max: 20, // Maximum number of clients in the pool - increased for better concurrency
  min: 5, // Minimum number of idle clients to maintain in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait for a connection
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
};

// Create a PostgreSQL connection pool
const pool = new Pool(poolConfig);

// Add error handler to prevent app crashes on connection issues
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // Don't exit the process in production - let the app continue running
  if (process.env.NODE_ENV !== 'production') {
    process.exit(-1);
  }
});

// Track connection metrics
let totalConnections = 0;
let activeConnections = 0;

pool.on('connect', () => {
  totalConnections++;
  activeConnections++;
  if (process.env.NODE_ENV !== 'production') {
    console.log(`DB Connection opened. Active: ${activeConnections}, Total: ${totalConnections}`);
  }
});

pool.on('remove', () => {
  activeConnections--;
  if (process.env.NODE_ENV !== 'production') {
    console.log(`DB Connection closed. Active: ${activeConnections}, Total: ${totalConnections}`);
  }
});

// Create a Drizzle instance with the schema
export const db = drizzle(pool, { schema });

/**
 * Get a client from the pool with retry logic
 * @param {number} retries - Number of retries
 * @returns {Promise<PoolClient>} - A client from the pool
 */
export const getClient = async (retries = 3): Promise<PoolClient> => {
  try {
    const client = await pool.connect();
    
    // Set statement timeout to prevent long-running queries
    await client.query('SET statement_timeout = 10000'); // 10 seconds
    
    return client;
  } catch (error) {
    if (retries > 0) {
      console.warn(`Failed to get client from pool, retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 500));
      return getClient(retries - 1);
    }
    throw error;
  }
};

/**
 * Execute a query with a client from the pool
 * @param {string} query - The SQL query
 * @param {any[]} params - The query parameters
 * @returns {Promise<any>} - Query result
 */
export const executeQuery = async (query: string, params: any[] = []) => {
  const client = await getClient();
  try {
    const result = await client.query(query, params);
    return result;
  } finally {
    client.release();
  }
};

/**
 * Close the pool
 * @returns {Promise<void>} - A promise that resolves when the pool is closed
 */
export const closePool = async () => {
  console.log('Closing database connection pool...');
  await pool.end();
  console.log('Database connection pool closed.');
}; 