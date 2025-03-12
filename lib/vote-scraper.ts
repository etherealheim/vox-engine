/**
 * Vote Scraper Module
 * 
 * This module provides functionality for scraping voting data from the parliament website.
 * It includes functions for fetching voting sessions, processing votes, and managing the scraping process.
 */

import { db } from '../drizzle/db';
import { votes, voting_sessions, politicians } from '../drizzle/schema';
import { eq, desc, sql } from 'drizzle-orm';

/**
 * Vote interface
 */
export interface Vote {
  id: string;
  session_id: number;
  politician_id: number;
  politician_name?: string;
  party?: string;
  vote: string;
  created_at: string;
}

/**
 * Voting session interface
 */
export interface VotingSession {
  id: number;
  session_id: string;
  title: string;
  date: string;
  vote_count: number;
  created_at: string;
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
 * Vote statistics interface
 */
export interface VoteStats {
  total_votes: number;
  total_sessions: number;
  politicians_with_votes: number;
  latest_session: string;
}

/**
 * Scraper configuration interface
 */
export interface ScraperConfig {
  startG: number;
  endG: number;
  reverse: boolean;
  parallelSessions: number;
  dateFilter: string | null;
  skipExisting: boolean;
}

/**
 * Fetch recent voting sessions
 */
export async function fetchRecentSessions(limit: number = 10): Promise<VotingSession[]> {
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
    
    return recentSessions;
  } catch (error) {
    console.error('Error fetching recent voting sessions:', error);
    throw new Error('Failed to fetch recent voting sessions');
  }
}

/**
 * Fetch vote statistics
 */
export async function fetchVoteStats(): Promise<VoteStats> {
  try {
    // Get total votes count
    const totalVotesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(votes);
    
    // Get total sessions count
    const totalSessionsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(voting_sessions);
    
    // Get count of politicians with votes
    const politiciansWithVotesResult = await db
      .select({ count: sql<number>`count(distinct ${votes.politician_id})` })
      .from(votes);
    
    // Get latest session date
    const latestSessionResult = await db
      .select({ latest: sql<string>`max(${voting_sessions.date})` })
      .from(voting_sessions);
    
    return {
      total_votes: totalVotesResult[0]?.count || 0,
      total_sessions: totalSessionsResult[0]?.count || 0,
      politicians_with_votes: politiciansWithVotesResult[0]?.count || 0,
      latest_session: latestSessionResult[0]?.latest || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching vote statistics:', error);
    throw new Error('Failed to fetch vote statistics');
  }
}

/**
 * Fetch politician voting data
 */
export async function fetchPoliticianVotingData(politicianId: number): Promise<any> {
  try {
    // Get politician details
    const politician = await db
      .select({
        id: politicians.id,
        name: politicians.name,
        party: politicians.party,
      })
      .from(politicians)
      .where(eq(politicians.id, politicianId))
      .limit(1);
    
    if (!politician || politician.length === 0) {
      throw new Error('Politician not found');
    }
    
    // Get total votes for this politician
    const totalVotesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(votes)
      .where(eq(votes.politician_id, politicianId));
    
    // Get vote statistics by vote type
    const voteStatsResult = await db
      .select({
        vote: votes.vote,
        count: sql<string>`count(*)`,
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
    
    return {
      politician: politician[0],
      totalVotes: totalVotesResult[0]?.count || 0,
      voteStats: voteStatsResult,
      recentVotes: recentVotes,
    };
  } catch (error) {
    console.error('Error fetching politician voting data:', error);
    throw new Error('Failed to fetch politician voting data');
  }
}

/**
 * Check if a session exists in the database
 */
export async function sessionExists(sessionId: number): Promise<boolean> {
  try {
    const session = await db
      .select({ id: voting_sessions.id })
      .from(voting_sessions)
      .where(eq(voting_sessions.id, sessionId))
      .limit(1);
    
    return session.length > 0;
  } catch (error) {
    console.error('Error checking if session exists:', error);
    return false;
  }
}

/**
 * Save a voting session to the database
 */
export async function saveVotingSession(sessionId: string, title: string, date: string): Promise<number> {
  try {
    const numericSessionId = parseInt(sessionId, 10);
    
    // Check if session already exists
    const exists = await sessionExists(numericSessionId);
    if (exists) {
      // Get the existing session ID
      const session = await db
        .select({ id: voting_sessions.id })
        .from(voting_sessions)
        .where(eq(voting_sessions.id, numericSessionId))
        .limit(1);
      
      return session[0].id;
    }
    
    // Insert new session
    const result = await db
      .insert(voting_sessions)
      .values({
        id: numericSessionId,
        session_id: sessionId,
        title: title,
        date: date,
        vote_count: 0,
        created_at: new Date().toISOString(),
      })
      .returning({ id: voting_sessions.id });
    
    return result[0].id;
  } catch (error) {
    console.error('Error saving voting session:', error);
    throw new Error('Failed to save voting session');
  }
}

/**
 * Save a vote to the database
 */
export async function saveVote(sessionId: number, politicianName: string, party: string, vote: string): Promise<boolean> {
  try {
    // Find or create politician
    let politician = await db
      .select({ id: politicians.id })
      .from(politicians)
      .where(sql`lower(${politicians.name}) = lower(${politicianName})`)
      .limit(1);
    
    let politicianId;
    if (politician.length === 0) {
      // Create new politician
      const result = await db
        .insert(politicians)
        .values({
          name: politicianName,
          party: party,
          created_at: new Date().toISOString(),
        })
        .returning({ id: politicians.id });
      
      politicianId = result[0].id;
    } else {
      politicianId = politician[0].id;
      
      // Update party if it's different
      await db
        .update(politicians)
        .set({ party: party })
        .where(eq(politicians.id, politicianId));
    }
    
    // Check if vote already exists
    const existingVote = await db
      .select({ id: votes.id })
      .from(votes)
      .where(
        sql`${votes.session_id} = ${sessionId} AND ${votes.politician_id} = ${politicianId}`
      )
      .limit(1);
    
    if (existingVote.length > 0) {
      // Update existing vote
      await db
        .update(votes)
        .set({ vote: vote })
        .where(eq(votes.id, existingVote[0].id));
    } else {
      // Insert new vote
      await db
        .insert(votes)
        .values({
          session_id: sessionId,
          politician_id: politicianId,
          vote: vote,
          created_at: new Date().toISOString(),
        });
      
      // Increment vote count for the session
      await db
        .update(voting_sessions)
        .set({ 
          vote_count: sql`${voting_sessions.vote_count} + 1` 
        })
        .where(eq(voting_sessions.id, sessionId));
    }
    
    return true;
  } catch (error) {
    console.error('Error saving vote:', error);
    throw new Error('Failed to save vote');
  }
}

/**
 * Start vote scraping process
 */
export async function startVoteScraping(config: ScraperConfig): Promise<boolean> {
  try {
    // This would start the scraping process
    // For now, we'll just return success
    console.log('Starting vote scraping with config:', config);
    return true;
  } catch (error) {
    console.error('Error starting vote scraping:', error);
    throw new Error('Failed to start vote scraping');
  }
} 