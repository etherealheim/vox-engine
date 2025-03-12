/**
 * Database Utility Module
 * 
 * This module provides a centralized interface for all database operations.
 * It includes functions for executing queries, managing transactions,
 * and retrieving common data patterns with caching support.
 */

import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
import LRUCache from 'lru-cache';
import { db } from './config';
import { politicians, tweets, votes, voting_sessions } from './schema';
import { eq, desc, sql as drizzleSql } from 'drizzle-orm';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Database configuration
const dbConfig = {
  user: process.env.POSTGRES_USER || 'default',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DATABASE || 'verceldb',
  password: process.env.POSTGRES_PASSWORD || '',
  port: parseInt(process.env.PGPORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
};

// Initialize database connection pool
const pool = new Pool(dbConfig);

// Log connection status
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // Don't exit the process in production - let the app continue running
  if (process.env.NODE_ENV !== 'production') {
    process.exit(-1);
  }
});

// Initialize cache with configuration
const cache = new LRUCache({
  max: 500, // Maximum number of items to store in the cache
  ttl: 1000 * 60 * 5, // Time to live: 5 minutes
  updateAgeOnGet: true, // Update the "recently used" status when getting an item
  allowStale: false // Don't serve stale items
});

/**
 * Execute a SQL query with parameters
 * @param {string} query - SQL query string
 * @param {Array} params - Query parameters
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Query results
 */
export async function executeQuery(query: string, params: any[] = [], options: any = {}) {
  const { useCache = false, cacheKey = null } = options;
  
  // Check cache if enabled
  if (useCache && cacheKey) {
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
  }
  
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    
    // Store in cache if enabled
    if (useCache && cacheKey) {
      cache.set(cacheKey, result);
    }
    
    return result;
  } finally {
    client.release();
  }
}

/**
 * Execute a function within a database transaction
 * @param {Function} callback - Function to execute within transaction
 * @returns {Promise<any>} - Result of the callback function
 */
export async function executeTransaction(callback: (client: PoolClient) => Promise<any>) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get database statistics
 * @returns {Promise<Object>} - Database statistics
 */
export async function getDatabaseStats() {
  const cacheKey = 'db_stats';
  const cachedStats = cache.get(cacheKey);
  
  if (cachedStats) {
    return cachedStats;
  }
  
  try {
    // Use Drizzle ORM for better type safety
    const politiciansCount = await db
      .select({ count: drizzleSql<number>`count(*)` })
      .from(politicians);
    
    const votesCount = await db
      .select({ count: drizzleSql<number>`count(*)` })
      .from(votes);
    
    const sessionsCount = await db
      .select({ count: drizzleSql<number>`count(*)` })
      .from(voting_sessions);
    
    const tweetsCount = await db
      .select({ count: drizzleSql<number>`count(*)` })
      .from(tweets);
    
    const stats = {
      politicians: politiciansCount[0]?.count || 0,
      votes: votesCount[0]?.count || 0,
      sessions: sessionsCount[0]?.count || 0,
      tweets: tweetsCount[0]?.count || 0,
      lastUpdated: new Date().toISOString()
    };
    
    // Cache the results
    cache.set(cacheKey, stats);
    
    return stats;
  } catch (error) {
    console.error('Error getting database stats:', error);
    throw error;
  }
}

/**
 * Get recent voting sessions
 * @param {number} limit - Maximum number of sessions to return
 * @returns {Promise<Array>} - Recent voting sessions
 */
export async function getRecentVotingSessions(limit = 10) {
  const cacheKey = `recent_sessions:${limit}`;
  const cachedSessions = cache.get(cacheKey);
  
  if (cachedSessions) {
    return cachedSessions;
  }
  
  try {
    const recentSessions = await db
      .select({
        id: voting_sessions.id,
        session_id: voting_sessions.session_id,
        title: voting_sessions.title,
        date: voting_sessions.date,
        vote_count: voting_sessions.vote_count,
        created_at: voting_sessions.created_at,
      })
      .from(voting_sessions)
      .orderBy(desc(voting_sessions.date))
      .limit(limit);
    
    // Cache the results
    cache.set(cacheKey, recentSessions);
    
    return recentSessions;
  } catch (error) {
    console.error('Error getting recent voting sessions:', error);
    throw error;
  }
}

/**
 * Get recent tweets
 * @param {number} limit - Maximum number of tweets to return
 * @returns {Promise<Array>} - Recent tweets
 */
export async function getRecentTweets(limit = 10) {
  const cacheKey = `recent_tweets:${limit}`;
  const cachedTweets = cache.get(cacheKey);
  
  if (cachedTweets) {
    return cachedTweets;
  }
  
  try {
    const recentTweets = await db
      .select({
        id: tweets.id,
        tweet_id: tweets.tweet_id,
        politician_id: tweets.politician_id,
        politician_name: politicians.name,
        content: tweets.content,
        url: tweets.url,
        posted_at: tweets.posted_at,
        created_at: tweets.created_at,
      })
      .from(tweets)
      .leftJoin(politicians, eq(tweets.politician_id, politicians.id))
      .orderBy(desc(tweets.created_at))
      .limit(limit);
    
    // Cache the results
    cache.set(cacheKey, recentTweets);
    
    return recentTweets;
  } catch (error) {
    console.error('Error getting recent tweets:', error);
    throw error;
  }
}

/**
 * Get politician data including voting history
 * @param {number} politicianId - Politician ID
 * @returns {Promise<Object>} - Politician data
 */
export async function getPoliticianData(politicianId: number) {
  const cacheKey = `politician:${politicianId}`;
  const cachedData = cache.get(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }
  
  try {
    // Get politician details
    const politician = await db
      .select({
        id: politicians.id,
        name: politicians.name,
        party: politicians.party,
        twitter: politicians.twitter,
      })
      .from(politicians)
      .where(eq(politicians.id, politicianId))
      .limit(1);
    
    if (!politician || politician.length === 0) {
      throw new Error('Politician not found');
    }
    
    // Get total votes for this politician
    const totalVotesResult = await db
      .select({ count: drizzleSql<number>`count(*)` })
      .from(votes)
      .where(eq(votes.politician_id, politicianId));
    
    // Get vote statistics by vote type
    const voteStatsResult = await db
      .select({
        vote: votes.vote,
        count: drizzleSql<string>`count(*)`,
      })
      .from(votes)
      .where(eq(votes.politician_id, politicianId))
      .groupBy(votes.vote);
    
    // Get recent votes
    const recentVotes = await db
      .select({
        vote: votes.vote,
        title: voting_sessions.title,
        date: voting_sessions.date,
        session_id: voting_sessions.session_id,
      })
      .from(votes)
      .innerJoin(voting_sessions, eq(votes.session_id, voting_sessions.id))
      .where(eq(votes.politician_id, politicianId))
      .orderBy(desc(voting_sessions.date))
      .limit(10);
    
    // Get recent tweets
    const recentTweets = await db
      .select({
        id: tweets.id,
        content: tweets.content,
        url: tweets.url,
        posted_at: tweets.posted_at,
      })
      .from(tweets)
      .where(eq(tweets.politician_id, politicianId))
      .orderBy(desc(tweets.posted_at))
      .limit(5);
    
    const politicianData = {
      politician: politician[0],
      totalVotes: totalVotesResult[0]?.count || 0,
      voteStats: voteStatsResult,
      recentVotes: recentVotes,
      recentTweets: recentTweets,
    };
    
    // Cache the results
    cache.set(cacheKey, politicianData);
    
    return politicianData;
  } catch (error) {
    console.error('Error getting politician data:', error);
    throw error;
  }
}

/**
 * Get politicians with Twitter handles
 * @returns {Promise<Array>} - Politicians with Twitter handles
 */
export async function getPoliticiansWithTwitter() {
  try {
    const politiciansWithTwitter = await db
      .select({
        id: politicians.id,
        name: politicians.name,
        twitter: politicians.twitter,
      })
      .from(politicians)
      .where(drizzleSql`${politicians.twitter} IS NOT NULL AND ${politicians.twitter} != ''`);
    
    return politiciansWithTwitter;
  } catch (error) {
    console.error('Error getting politicians with Twitter handles:', error);
    throw error;
  }
}

/**
 * Invalidate specific cache keys
 * @param {Array<string>} keys - Cache keys to invalidate
 */
export function invalidateCache(keys: string[]) {
  if (!keys || !Array.isArray(keys)) return;
  
  keys.forEach(key => {
    cache.delete(key);
  });
}

/**
 * Clear the entire cache
 */
export function clearCache() {
  cache.clear();
}

/**
 * Get cache statistics
 * @returns {Object} - Cache statistics
 */
export function getCacheStats() {
  return {
    size: cache.size,
    maxSize: cache.max,
    keys: Array.from(cache.keys()),
  };
}

/**
 * Close the database connection pool
 */
export async function closePool() {
  try {
    await pool.end();
    console.log('Database connection pool closed');
  } catch (error) {
    console.error('Error closing database connection pool:', error);
    throw error;
  }
} 