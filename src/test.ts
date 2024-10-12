// test.ts

import 'dotenv/config';
import { sql } from '@vercel/postgres';
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { eq } from 'drizzle-orm';
import {
    politicians,
    politicianAffiliations,
    votingSessions,
    votes,
} from './db/schema';

async function main() {
    // Get the handle from command-line arguments
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error('Please provide a politician handle as an argument.');
        process.exit(1);
    }
    const inputHandle = args.join('-').toLowerCase().trim();

    // Connect to your database
    const db = drizzle(sql);

    // List all politician handles to debug
    const allPoliticians = await db.select().from(politicians);
    console.log('List of politician handles in the database:');
    allPoliticians.forEach((p) => {
        console.log(`- ${p.handle}`);
    });

    // Find the politician by handle
    const politician = await db
        .select()
        .from(politicians)
        .where(eq(politicians.handle, inputHandle))
        .then((res) => res[0]);

    if (!politician) {
        console.log(`No politician found with handle: ${inputHandle}`);
        return;
    }

    console.log(`\nPolitician Information:`);
    console.log(`Name: ${politician.name}`);
    console.log(`Handle: ${politician.handle}`);
    console.log(`Twitter: ${politician.twitter || 'N/A'}`);
    console.log(`Wikipedia: ${politician.wikipedia || 'N/A'}`);

    // Get party affiliations
    const affiliations = await db
        .select()
        .from(politicianAffiliations)
        .where(eq(politicianAffiliations.politicianId, politician.id));

    if (affiliations.length > 0) {
        console.log(`\nParty Affiliations:`);
        for (const affiliation of affiliations) {
            console.log(`Party: ${affiliation.party}`);
            console.log(`Valid From: ${affiliation.validFrom}`);
            console.log(`Valid To: ${affiliation.validTo || 'Present'}`);
            console.log('---');
        }
    } else {
        console.log(`\nNo party affiliations found.`);
    }

    // Get voting records
    const votingRecords = await db
        .select({
            sessionId: votingSessions.sessionId,
            date: votingSessions.date,
            time: votingSessions.time,
            title: votingSessions.title,
            vote: votes.vote,
        })
        .from(votes)
        .leftJoin(
            votingSessions,
            eq(votes.votingSessionId, votingSessions.id)
        )
        .where(eq(votes.politicianId, politician.id))
        .orderBy(votingSessions.date);

    if (votingRecords.length > 0) {
        console.log(`\nVoting Records:`);
        for (const record of votingRecords) {
            console.log(`Session ID: ${record.sessionId}`);
            console.log(`Date: ${record.date}`);
            console.log(`Time: ${record.time}`);
            console.log(`Title: ${record.title}`);
            console.log(`Vote: ${record.vote}`);
            console.log('---');
        }
    } else {
        console.log(`\nNo voting records found.`);
    }
}

main().catch((error) => {
    console.error('An error occurred:', error);
});
