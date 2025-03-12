import { Pool } from 'pg';
import { db } from '../src/db/config';
import { tweets, politicians } from '../src/db/schema';
import { eq, desc, count, sql } from 'drizzle-orm';
import { getClient, closePool } from '../src/db/config';
import { LRUCache } from 'lru-cache';

// Cache item type definition
interface CacheItem<T> {
  data: T;
  timestamp: number;
}

// Constants
const TWITTER_API_BASE = 'https://api.twitter.com/2';
const CACHE_TTL = 10 * 60 * 1000; // Increase cache TTL to 10 minutes to reduce API calls
const MAX_RETRIES = 3; // Maximum number of retries for rate-limited requests
const INITIAL_RETRY_DELAY = 5000; // Initial retry delay in milliseconds (5 seconds)

// Validate Twitter API key
if (!process.env.TWITTER_API_KEY) {
  console.error('TWITTER_API_KEY environment variable is not set');
} else if (process.env.TWITTER_API_KEY.length < 25) {
  console.error('TWITTER_API_KEY appears to be invalid (too short)');
}

// Check if we have an access token for user authentication
const hasAccessToken = !!process.env.TWITTER_ACCESS_TOKEN;
if (hasAccessToken) {
  console.log('Twitter access token is configured for user authentication');
}

// Database configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
};

// Initialize database connection pool
const pool = new Pool(dbConfig);

// Use LRU Cache instead of simple Map for better memory management
const cache = new LRUCache<string, CacheItem<any>>({
  max: 500, // Maximum number of items in cache
  ttl: CACHE_TTL, // Default TTL
});

// Keep track of stale cache entries for fallback
const staleCache = new Map<string, CacheItem<any>>();

// Rate limiting tracking
const rateLimitInfo = {
  remaining: 300, // Default assumption
  reset: Date.now() + 15 * 60 * 1000, // Default 15 minutes from now
  lastUpdated: Date.now()
};

/**
 * Sleep for a specified number of milliseconds
 * @param ms Milliseconds to sleep
 * @returns Promise that resolves after the specified time
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Make a rate-limited API request with exponential backoff
 * @param url URL to fetch
 * @param options Fetch options
 * @param retryCount Current retry count
 * @returns Response from the API
 */
async function rateLimitedFetch(url: string, options: RequestInit, retryCount = 0): Promise<Response> {
  // Check if we're currently rate limited
  const now = Date.now();
  if (rateLimitInfo.remaining <= 0 && now < rateLimitInfo.reset) {
    const waitTime = rateLimitInfo.reset - now + 1000; // Add 1 second buffer
    console.log(`Rate limited. Waiting ${waitTime / 1000} seconds before retrying...`);
    await sleep(waitTime);
  }
  
  try {
    const response = await fetch(url, options);
    
    // Update rate limit info from headers
    const remaining = response.headers.get('x-rate-limit-remaining');
    const reset = response.headers.get('x-rate-limit-reset');
    
    if (remaining) {
      rateLimitInfo.remaining = parseInt(remaining, 10);
    }
    
    if (reset) {
      rateLimitInfo.reset = parseInt(reset, 10) * 1000; // Convert to milliseconds
    }
    
    rateLimitInfo.lastUpdated = now;
    
    // Handle rate limiting
    if (response.status === 429) {
      if (retryCount >= MAX_RETRIES) {
        throw new Error(`Twitter API rate limit exceeded. Maximum retries (${MAX_RETRIES}) reached.`);
      }
      
      // Get retry-after header or use exponential backoff
      const retryAfter = response.headers.get('retry-after');
      const delay = retryAfter 
        ? parseInt(retryAfter, 10) * 1000 
        : INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      
      console.log(`Rate limited. Retrying in ${delay / 1000} seconds... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await sleep(delay);
      
      // Retry the request
      return rateLimitedFetch(url, options, retryCount + 1);
    }
    
    return response;
  } catch (error) {
    console.error('Error making Twitter API request:', error);
    throw error;
  }
}

/**
 * Get cached data or fetch new data
 * @param key Cache key
 * @param fetchFn Function to fetch data if not cached
 * @returns Cached or fresh data
 */
async function getCachedOrFetch<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
  // Get the cached value
  const cachedValue = cache.get(key);
  
  // If we have a valid cached value, store it in stale cache and return its data
  if (cachedValue) {
    staleCache.set(key, cachedValue);
    return cachedValue.data as T;
  }
  
  try {
    // Fetch fresh data
    const data = await fetchFn();
    
    // Cache the fresh data
    const cacheItem = { data, timestamp: Date.now() };
    cache.set(key, cacheItem);
    staleCache.set(key, cacheItem);
    
    return data;
  } catch (error) {
    // If fetch fails and we have stale data, use it as a fallback
    const staleValue = staleCache.get(key);
    if (staleValue) {
      console.warn(`Using stale cached data for ${key} due to fetch error`);
      return staleValue.data as T;
    }
    
    // No cached data available, rethrow the error
    throw error;
  }
}

/**
 * Fetch tweets from a Twitter user using the Twitter API v2
 * @param username Twitter username without the @ symbol
 * @param maxResults Maximum number of tweets to fetch (max 100)
 * @returns Array of tweets
 */
export async function fetchUserTweets(username: string, maxResults: number = 100) {
  try {
    // Validate Twitter API key
    if (!process.env.TWITTER_API_KEY) {
      throw new Error('Twitter API key is not configured. Please set the TWITTER_API_KEY environment variable.');
    }
    
    // Get user ID from username
    const userId = await getUserIdFromUsername(username);
    if (!userId) {
      throw new Error(`Could not find user ID for username: ${username}. This may be due to an invalid Twitter API key or the username doesn't exist.`);
    }

    // Check cache for user tweets to reduce API calls
    const cacheKey = `tweets_${userId}_${maxResults}`;
    return getCachedOrFetch(cacheKey, async () => {
      // Fetch tweets
      const url = `${TWITTER_API_BASE}/users/${userId}/tweets`;
      const params = new URLSearchParams({
        max_results: Math.min(maxResults, 100).toString(), // Ensure we don't exceed API limit
        'tweet.fields': 'created_at', // Removed public_metrics to focus on minimal data collection
        exclude: 'retweets,replies'
      });

      const response = await rateLimitedFetch(`${url}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${process.env.TWITTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Twitter API error response:', errorData);
        
        if (errorData.errors && errorData.errors.length > 0) {
          const errorMessage = errorData.errors.map((e: any) => e.message || e.title).join(', ');
          throw new Error(`Twitter API error: ${errorMessage}`);
        }
        
        throw new Error(`Twitter API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.data) {
        return [];
      }

      // Transform the data to our format - only include id, text, created_at, and generate tweet URL
      return data.data.map((tweet: any) => ({
        id: tweet.id,
        text: tweet.text,
        created_at: tweet.created_at,
        url: `https://twitter.com/${username}/status/${tweet.id}`
      }));
    });
  } catch (error) {
    console.error('Error fetching tweets:', error);
    throw error;
  }
}

/**
 * Get user ID from username using Twitter API v2
 * @param username Twitter username without the @ symbol
 * @returns User ID
 */
async function getUserIdFromUsername(username: string): Promise<string | null> {
  // Clean up username first to avoid unnecessary API calls
  const cleanUsername = username.trim().replace('@', '').split('/').pop()?.split('?')[0] || '';
  if (!cleanUsername) {
    return null;
  }
  
  const cacheKey = `twitter_user_${cleanUsername.toLowerCase()}`; // Use lowercase for consistent cache keys
  
  return getCachedOrFetch(cacheKey, async () => {
    try {
      // Validate Twitter API key
      if (!process.env.TWITTER_API_KEY) {
        throw new Error('Twitter API key is not configured');
      }
      
      const url = `${TWITTER_API_BASE}/users/by/username/${cleanUsername}`;
      const response = await rateLimitedFetch(url, {
        headers: {
          'Authorization': `Bearer ${process.env.TWITTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Twitter API error response for username lookup:', errorData);
        
        if (errorData.errors && errorData.errors.length > 0) {
          // Check for specific error types
          for (const error of errorData.errors) {
            if (error.title === 'Unauthorized' || error.message?.includes('authorization')) {
              throw new Error('Twitter API authorization failed. Please check your API key.');
            }
            if (error.title === 'Not Found' || error.message?.includes('not found')) {
              console.warn(`Twitter username not found: ${cleanUsername}`);
              return null;
            }
          }
          
          const errorMessage = errorData.errors.map((e: any) => e.message || e.title).join(', ');
          throw new Error(`Twitter API error: ${errorMessage}`);
        }
        
        throw new Error(`Twitter API error: ${response.status} ${response.statusText}`);
      }
  
      const data = await response.json();
      return data.data?.id || null;
    } catch (error) {
      console.error(`Error getting user ID for ${cleanUsername}:`, error);
      return null;
    }
  });
}

/**
 * Get politicians with Twitter handles from the database
 * @returns Array of politicians with Twitter handles
 */
export async function getPoliticiansWithTwitter() {
  const cacheKey = 'politicians_with_twitter';
  
  return getCachedOrFetch(cacheKey, async () => {
    let client;
    try {
      client = await getClient();
      
      // Use more efficient query with direct client
      const result = await db.select({
        id: politicians.id,
        name: politicians.name,
        twitter: politicians.twitterHandle,
      })
      .from(politicians)
      .where(sql`${politicians.twitterHandle} IS NOT NULL`)
      .orderBy(politicians.name);
      
      return result;
    } catch (error) {
      console.error('Error fetching politicians with Twitter handles:', error);
      throw error;
    } finally {
      if (client) client.release();
    }
  });
}

/**
 * Save tweets to the database
 * @param tweetData Array of tweets
 * @param politicianId Politician ID
 * @returns Number of tweets saved
 */
export async function saveTweetsToDatabase(tweetData: any[], politicianId: number) {
  if (!tweetData || tweetData.length === 0) {
    return 0;
  }
  
  let client;
  try {
    client = await getClient();
    
    // Begin transaction for batch operation
    await client.query('BEGIN');
    
    let savedCount = 0;
    
    // Get existing tweet IDs to avoid unnecessary checks
    const existingTweetsResult = await client.query(
      'SELECT tweet_id FROM tweets WHERE politician_id = $1',
      [politicianId]
    );
    
    // Create a Set for O(1) lookups
    const existingTweetIds = new Set(existingTweetsResult.rows.map(row => row.tweet_id));
    
    // Prepare values for batch insert
    const values = [];
    const newTweetIds = [];
    
    for (const tweet of tweetData) {
      if (!existingTweetIds.has(tweet.id)) {
        values.push([
          tweet.id,
          politicianId,
          tweet.text,
          new Date(tweet.created_at)
        ]);
        newTweetIds.push(tweet.id);
      }
    }
    
    // Batch insert if there are new tweets
    if (values.length > 0) {
      const placeholders = values.map((_, i) => 
        `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`
      ).join(', ');
      
      const flatValues = values.flat();
      
      await client.query(
        `INSERT INTO tweets (tweet_id, politician_id, text, created_at)
         VALUES ${placeholders}`,
        flatValues
      );
      
      savedCount = values.length;
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    
    // Clear relevant caches
    cache.delete('recent_tweets_10');
    cache.delete('tweet_stats');
    
    return savedCount;
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Error saving tweets to database:', error);
    throw error;
  } finally {
    if (client) client.release();
  }
}

/**
 * Get recent tweets from the database
 * @param limit Maximum number of tweets to return
 * @returns Array of recent tweets
 */
export async function getRecentTweets(limit: number = 10) {
  const cacheKey = `recent_tweets_${limit}`;
  
  return getCachedOrFetch(cacheKey, async () => {
    let client;
    try {
      client = await getClient();
      
      // Use prepared statement for better security and performance
      // Updated to use new schema column names
      const query = `
        SELECT t.id, t.external_id as tweet_id, t.politician_id, 
               p.name as politician_name, 
               t.content, t.posted_at as created_at,
               t.media_urls, t.metrics,
               p.twitter_handle, p.profile_image_url,
               party.name as party_name
        FROM tweets t
        JOIN politicians p ON t.politician_id = p.id
        LEFT JOIN parties party ON p.party_id = party.id
        ORDER BY t.posted_at DESC
        LIMIT $1
      `;
      
      const result = await client.query(query, [limit]);
      
      // Map the results to ensure consistent property names in the API
      // We maintain backward compatibility with 'text' for existing consumers
      return result.rows.map(row => ({
        ...row,
        text: row.content // Add text property for backward compatibility
      }));
    } catch (error) {
      console.error('Error fetching recent tweets:', error);
      throw error;
    } finally {
      if (client) client.release();
    }
  });
}

/**
 * Get tweet statistics from the database
 * @returns Tweet statistics
 */
export async function getTweetStats() {
  const cacheKey = 'tweet_stats';
  
  return getCachedOrFetch(cacheKey, async () => {
    let client;
    try {
      client = await getClient();
      
      // Use a single query to get all stats for better performance
      // Updated to use new schema column names
      const result = await client.query(`
        SELECT
          (SELECT COUNT(*) FROM tweets) as total_tweets,
          (SELECT COUNT(DISTINCT politician_id) FROM tweets) as politicians_with_tweets,
          (SELECT posted_at FROM tweets ORDER BY posted_at DESC LIMIT 1) as latest_tweet,
          (SELECT COUNT(*) FROM politicians) as total_politicians,
          (SELECT COUNT(*) FROM parties) as total_parties
      `);
      
      return {
        total_tweets: parseInt(result.rows[0].total_tweets) || 0,
        politicians_with_tweets: parseInt(result.rows[0].politicians_with_tweets) || 0,
        latest_tweet: result.rows[0].latest_tweet,
        total_politicians: parseInt(result.rows[0].total_politicians) || 0,
        total_parties: parseInt(result.rows[0].total_parties) || 0
      };
    } catch (error) {
      console.error('Error fetching tweet stats:', error);
      throw error;
    } finally {
      if (client) client.release();
    }
  });
}

/**
 * Check and fix Twitter handles in the database
 * This function checks all politicians with Twitter handles and attempts to fix any issues
 * @returns Results of the check and fix operation
 */
export async function checkAndFixTwitterHandles() {
  let client;
  try {
    client = await getClient();
    const results = {
      total: 0,
      fixed: 0,
      errors: 0,
      details: [] as any[]
    };
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Get all politicians with Twitter handles
    const politiciansResult = await client.query(`
      SELECT id, name, twitter_handle
      FROM politicians
      WHERE twitter_handle IS NOT NULL
    `);
    
    results.total = politiciansResult.rows.length;
    
    // Batch updates for better performance
    const updates = [];
    
    // Process each politician
    for (const politician of politiciansResult.rows) {
      try {
        let twitterHandle = politician.twitter_handle;
        let fixed = false;
        let originalHandle = twitterHandle;
        
        // Extract handle from URL if needed
        if (twitterHandle.includes('twitter.com/')) {
          twitterHandle = twitterHandle.split('twitter.com/').pop() || '';
          fixed = true;
        }
        if (twitterHandle.includes('x.com/')) {
          twitterHandle = twitterHandle.split('x.com/').pop() || '';
          fixed = true;
        }
        
        // Remove any trailing slash or parameters
        if (twitterHandle.includes('/') || twitterHandle.includes('?')) {
          twitterHandle = twitterHandle.split('/')[0];
          twitterHandle = twitterHandle.split('?')[0];
          fixed = true;
        }
        
        // Remove @ if present
        if (twitterHandle.startsWith('@')) {
          twitterHandle = twitterHandle.substring(1);
          fixed = true;
        }
        
        // Trim whitespace
        if (twitterHandle !== twitterHandle.trim()) {
          twitterHandle = twitterHandle.trim();
          fixed = true;
        }
        
        // Add to batch update if fixed
        if (fixed && twitterHandle) {
          updates.push({
            id: politician.id,
            handle: twitterHandle,
            original: originalHandle
          });
        }
        
        results.details.push({
          id: politician.id,
          name: politician.name,
          original: originalHandle,
          fixed: fixed ? twitterHandle : null,
          status: fixed ? 'fixed' : 'ok'
        });
      } catch (error) {
        console.error(`Error fixing Twitter handle for politician ${politician.name}:`, error);
        results.errors++;
        results.details.push({
          id: politician.id,
          name: politician.name,
          handle: politician.twitter_handle,
          status: 'error',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    // Perform batch update if there are fixes
    if (updates.length > 0) {
      const placeholders = updates.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ');
      const params = updates.flatMap(u => [u.id, u.handle]);
      
      await client.query(
        `UPDATE politicians AS p
         SET twitter_handle = c.handle
         FROM (VALUES ${placeholders}) AS c(id, handle)
         WHERE p.id = c.id::integer`,
        params
      );
      
      results.fixed = updates.length;
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    // Invalidate cache
    cache.delete('politicians_with_twitter');
    
    return results;
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Error checking and fixing Twitter handles:', error);
    throw error;
  } finally {
    if (client) client.release();
  }
} 