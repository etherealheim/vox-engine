import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { db } from '../../../src/db/config';
import { politicians, tweets, votes, votingSessions, scrapingLogs } from '../../../src/db/schema';
import { getClient } from '../../../src/db/config';
import { sql } from 'drizzle-orm';

/**
 * POST handler for database operations
 * Handles operations like erasing the database
 */
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (!action) {
    return NextResponse.json(
      { error: 'Missing action parameter' },
      { status: 400 }
    );
  }

  switch (action) {
    case 'erase':
      return eraseDatabase();
    default:
      return NextResponse.json(
        { error: 'Invalid action parameter' },
        { status: 400 }
      );
  }
}

/**
 * Erase all data from the database
 * Uses transactions to ensure atomicity
 */
async function eraseDatabase() {
  let client;
  try {
    client = await getClient();
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Delete all data from tables in proper order (respecting foreign key constraints)
    await client.query('DELETE FROM tweets');
    await client.query('DELETE FROM votes');
    await client.query('DELETE FROM voting_sessions');
    await client.query('DELETE FROM scraping_logs');
    await client.query('DELETE FROM politicians');
    
    // Commit transaction
    await client.query('COMMIT');
    
    return NextResponse.json({ success: true, message: 'Database erased successfully' });
  } catch (error) {
    // Rollback transaction on error
    if (client) {
      await client.query('ROLLBACK');
    }
    
    console.error('Error erasing database:', error);
    
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
} 