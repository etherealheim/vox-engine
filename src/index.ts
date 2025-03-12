/**
 * Main Entry Point
 * 
 * This file serves as the main entry point for the application.
 * It exports the essential modules and provides a convenient way to import them.
 */

// Export database modules
export * from './db/schema';

// Re-export with explicit naming to avoid conflicts
import { db, getClient, closePool as dbClosePool } from './db/config';
import { 
  executeQuery as dbExecuteQuery, 
  executeTransaction, 
  getDatabaseStats,
  getRecentVotingSessions,
  getRecentTweets,
  getPoliticianData,
  getPoliticiansWithTwitter,
  invalidateCache,
  clearCache,
  getCacheStats,
  closePool as utilsClosePool
} from './db/utils';

// Export database functions with renamed conflicts
export { 
  db, 
  getClient, 
  dbClosePool,
  dbExecuteQuery,
  executeTransaction,
  getDatabaseStats,
  getRecentVotingSessions,
  getRecentTweets,
  getPoliticianData,
  getPoliticiansWithTwitter,
  invalidateCache,
  clearCache,
  getCacheStats,
  utilsClosePool
};

// Export scraper modules with explicit imports to avoid conflicts
import type { ScraperStatus as TwitterScraperStatusType } from '../lib/twitter-scraper';
import { 
  fetchPoliticiansWithTwitter,
  fetchRecentTweets,
  fetchTwitterStats,
  fetchUserTweets,
  saveTweetsToDatabase,
  checkAndFixTwitterHandles,
  updateTwitterHandle,
  fetchTweetsForAllPoliticians
} from '../lib/twitter-scraper';

import type { ScraperStatus as VoteScraperStatusType } from '../lib/vote-scraper';
import {
  fetchRecentSessions,
  fetchVoteStats,
  fetchPoliticianVotingData,
  sessionExists,
  saveVotingSession,
  saveVote,
  startVoteScraping
} from '../lib/vote-scraper';

// Export types with 'export type'
export type { TwitterScraperStatusType, VoteScraperStatusType };

// Export scraper functions
export {
  fetchPoliticiansWithTwitter,
  fetchRecentTweets,
  fetchTwitterStats,
  fetchUserTweets,
  saveTweetsToDatabase,
  checkAndFixTwitterHandles,
  updateTwitterHandle,
  fetchTweetsForAllPoliticians,
  
  fetchRecentSessions,
  fetchVoteStats,
  fetchPoliticianVotingData,
  sessionExists,
  saveVotingSession,
  saveVote,
  startVoteScraping
};

// Log initialization
console.log('Vox Engine initialized'); 