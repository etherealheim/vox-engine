// delete.ts (or reset-database.ts)

import 'dotenv/config';
import { sql } from '@vercel/postgres';
import { drizzle } from 'drizzle-orm/vercel-postgres';
import {
    politicians,
    politicianAffiliations,
    votingSessions,
    votes,
} from './db/schema';

async function resetDatabase() {
    // Connect to your database
    const db = drizzle(sql);

    try {
        // Begin a transaction
        await db.transaction(async (trx) => {
            // Delete data from tables in order to avoid foreign key constraint issues

            // 1. Delete from 'votes' table (child of 'politicians' and 'votingSessions')
            await trx.delete(votes);
            console.log('Deleted data from votes table.');

            // 2. Delete from 'politicianAffiliations' table (child of 'politicians')
            await trx.delete(politicianAffiliations);
            console.log('Deleted data from politicianAffiliations table.');

            // 3. Delete from 'votingSessions' table
            await trx.delete(votingSessions);
            console.log('Deleted data from votingSessions table.');

            // 4. Delete from 'politicians' table
            await trx.delete(politicians);
            console.log('Deleted data from politicians table.');
        });

        console.log('All tables have been cleared successfully.');
    } catch (error) {
        console.error('An error occurred while resetting the database:', error);
    }
}

resetDatabase().catch((error) => {
    console.error('An unexpected error occurred:', error);
});
