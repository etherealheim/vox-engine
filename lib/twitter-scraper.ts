/**
 * Twitter Scraper Module
 * 
 * This module provides functionality for scraping Twitter data for politicians.
 * It includes functions for fetching tweets, checking and fixing Twitter handles,
 * and managing the scraping process.
 */

import { db } from '../drizzle/db';
import { tweets, politicians } from '../drizzle/schema';
import { eq, desc, sql } from 'drizzle-orm';

/**
 * Politician interface
 */
export interface Politician {
  id: number;
  name: string;
  twitter: string;
}

/**
 * Tweet interface
 */
export interface Tweet {
  id: string;
  tweet_id?: string;
  politician_id: number;
  politician_name?: string;
  content: string;
  url?: string;
  posted_at?: string;
  created_at: string;
}

/**
 * Fetch results interface
 */
export interface FetchResults {
  totalPoliticians: number;
  processedPoliticians: number;
  totalNewTweets: number;
  totalSkippedTweets: number;
  details: {
    politicianId: number;
    name: string;
    twitterHandle: string;
    newTweets: number;
    skippedTweets: number;
    totalTweets: number;
    error?: string;
  }[];
  rateLimited: boolean;
}

/**
 * Scraper status interface
 */
export interface ScraperStatus {
  isRunning: boolean;
  progress: number;
  totalItems: number;
  processedItems: number;
  startTime: string | null;
  errors: Array<{ time: string; message: string }>;
  logs: Array<{ time: string; message: string }>;
}

/**
 * Twitter statistics interface
 */
export interface TwitterStats {
  total_tweets: number;
  politicians_with_tweets: number;
  latest_tweet: string;
}

/**
 * Fetch politicians with Twitter handles
 */
export async function fetchPoliticiansWithTwitter(): Promise<Politician[]> {
  try {
    const politiciansWithTwitter = await db
      .select({
        id: politicians.id,
        name: politicians.name,
        twitter: politicians.twitter,
      })
      .from(politicians)
      .where(sql`${politicians.twitter} IS NOT NULL AND ${politicians.twitter} != ''`);
    
    return politiciansWithTwitter;
  } catch (error) {
    console.error('Error fetching politicians with Twitter handles:', error);
    throw new Error('Failed to fetch politicians with Twitter handles');
  }
}

/**
 * Fetch recent tweets
 */
export async function fetchRecentTweets(limit: number = 10): Promise<Tweet[]> {
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
    
    return recentTweets;
  } catch (error) {
    console.error('Error fetching recent tweets:', error);
    throw new Error('Failed to fetch recent tweets');
  }
}

/**
 * Fetch Twitter statistics
 */
export async function fetchTwitterStats(): Promise<TwitterStats> {
  try {
    // Get total tweets count
    const totalTweetsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(tweets);
    
    // Get count of politicians with tweets
    const politiciansWithTweetsResult = await db
      .select({ count: sql<number>`count(distinct ${tweets.politician_id})` })
      .from(tweets);
    
    // Get latest tweet date
    const latestTweetResult = await db
      .select({ latest: sql<string>`max(${tweets.posted_at})` })
      .from(tweets);
    
    return {
      total_tweets: totalTweetsResult[0]?.count || 0,
      politicians_with_tweets: politiciansWithTweetsResult[0]?.count || 0,
      latest_tweet: latestTweetResult[0]?.latest || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching Twitter statistics:', error);
    throw new Error('Failed to fetch Twitter statistics');
  }
}

/**
 * Fetch tweets from Twitter API
 * This is a placeholder for the actual Twitter API integration
 */
export async function fetchUserTweets(twitterHandle: string, maxTweets: number = 100): Promise<any[]> {
  // This would be replaced with actual Twitter API calls
  // For now, we'll just return a mock response
  console.log(`Fetching up to ${maxTweets} tweets for @${twitterHandle}`);
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Return mock data
  return [];
}

/**
 * Save tweets to database
 */
export async function saveTweetsToDatabase(tweets: any[], politicianId: number): Promise<number> {
  // This would save tweets to the database
  // For now, we'll just return a mock count
  return tweets.length;
}

/**
 * Check and fix Twitter handles
 */
export async function checkAndFixTwitterHandles(): Promise<any> {
  try {
    // Get all politicians with Twitter handles
    const politiciansWithTwitter = await fetchPoliticiansWithTwitter();
    
    // Process each politician's Twitter handle
    const results = {
      total: politiciansWithTwitter.length,
      fixed: 0,
      details: [] as any[],
    };
    
    for (const politician of politiciansWithTwitter) {
      let twitterHandle = politician.twitter;
      let originalHandle = twitterHandle;
      let fixed = false;
      
      // Clean up Twitter handle
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
      
      twitterHandle = twitterHandle.trim();
      
      // If handle was fixed, update in database
      if (fixed && twitterHandle !== originalHandle) {
        await db
          .update(politicians)
          .set({ twitter: twitterHandle })
          .where(eq(politicians.id, politician.id));
        
        results.fixed++;
        results.details.push({
          id: politician.id,
          name: politician.name,
          original: originalHandle,
          fixed: twitterHandle,
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error checking and fixing Twitter handles:', error);
    throw new Error('Failed to check and fix Twitter handles');
  }
}

/**
 * Update Twitter handle for a politician
 */
export async function updateTwitterHandle(politicianId: number, twitterHandle: string): Promise<boolean> {
  try {
    // Clean up handle if needed
    let cleanHandle = twitterHandle;
    if (cleanHandle.startsWith('@')) {
      cleanHandle = cleanHandle.substring(1);
    }
    
    // Update in database
    await db
      .update(politicians)
      .set({ twitter: cleanHandle })
      .where(eq(politicians.id, politicianId));
    
    return true;
  } catch (error) {
    console.error('Error updating Twitter handle:', error);
    throw new Error('Failed to update Twitter handle');
  }
}

/**
 * Fetch tweets for all politicians with Twitter handles
 */
export async function fetchTweetsForAllPoliticians(maxTweetsPerPolitician: number = 100): Promise<FetchResults> {
  try {
    // Get all politicians with Twitter handles
    const politicians = await fetchPoliticiansWithTwitter();
    
    const results: FetchResults = {
      totalPoliticians: politicians.length,
      processedPoliticians: 0,
      totalNewTweets: 0,
      totalSkippedTweets: 0,
      details: [],
      rateLimited: false,
    };
    
    // Process each politician
    for (const politician of politicians) {
      try {
        // Extract Twitter handle
        let twitterHandle = politician.twitter;
        if (!twitterHandle) {
          throw new Error('Twitter handle is empty');
        }
        
        // Clean up handle if needed
        if (twitterHandle.includes('twitter.com/')) {
          twitterHandle = twitterHandle.split('twitter.com/').pop() || '';
        }
        if (twitterHandle.includes('x.com/')) {
          twitterHandle = twitterHandle.split('x.com/').pop() || '';
        }
        
        // Remove any trailing slash or parameters
        twitterHandle = twitterHandle.split('/')[0];
        twitterHandle = twitterHandle.split('?')[0];
        twitterHandle = twitterHandle.trim();
        
        if (!twitterHandle) {
          throw new Error('Could not extract valid Twitter handle');
        }
        
        // Fetch tweets
        const tweets = await fetchUserTweets(twitterHandle, maxTweetsPerPolitician);
        
        // Save tweets to database
        const savedCount = await saveTweetsToDatabase(tweets, politician.id);
        
        // Update results
        results.processedPoliticians++;
        results.totalNewTweets += savedCount;
        results.totalSkippedTweets += (tweets.length - savedCount);
        
        results.details.push({
          politicianId: politician.id,
          name: politician.name,
          twitterHandle,
          newTweets: savedCount,
          skippedTweets: tweets.length - savedCount,
          totalTweets: tweets.length,
        });
      } catch (error: any) {
        // Check for rate limiting
        if (error.message && error.message.includes('rate limit')) {
          results.rateLimited = true;
        }
        
        // Add error to results
        results.details.push({
          politicianId: politician.id,
          name: politician.name,
          twitterHandle: politician.twitter,
          newTweets: 0,
          skippedTweets: 0,
          totalTweets: 0,
          error: error.message,
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error fetching tweets for all politicians:', error);
    throw new Error('Failed to fetch tweets for all politicians');
  }
} 