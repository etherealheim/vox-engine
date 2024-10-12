import 'dotenv/config';
import { sql } from '@vercel/postgres';
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { eq, and } from 'drizzle-orm';
import { politicians, politicianAffiliations, votingSessions, votes } from './db/schema';
import { scrapeVotingData } from './scrape-vote';

async function main() {
    // Connect to your database
    const db = drizzle(sql);

    // Define the range of 'g' values
    const startG = 83296;
    const endG = 83296;

    // Call scrapeVotingData
    const { votingSessionsData, politiciansData, votesData } = await scrapeVotingData(startG, endG);

    // Insert voting sessions
    for (const session of votingSessionsData) {
        // Check if the session already exists
        const existingSession = await db
            .select()
            .from(votingSessions)
            .where(eq(votingSessions.sessionId, session.sessionId))
            .then(res => res[0]);

        if (!existingSession) {
            // Insert the session
            await db.insert(votingSessions).values(session);
            console.log(`Inserted voting session with g=${session.sessionId}`);
        } else {
            console.log(`Voting session with g=${session.sessionId} already exists.`);
        }
    }

    // Insert politicians
    for (const politician of politiciansData) {
        // Check if the politician already exists
        const existingPolitician = await db
            .select()
            .from(politicians)
            .where(eq(politicians.handle, politician.handle))
            .then(res => res[0]);

        if (!existingPolitician) {
            // Insert the politician
            await db.insert(politicians).values(politician);
            console.log(`Inserted politician: ${politician.name}`);
        } else {
            console.log(`Politician ${politician.name} already exists.`);
        }
    }

    // Insert votes and affiliations
    for (const voteData of votesData) {
        // Get the politician
        const politician = await db
            .select()
            .from(politicians)
            .where(eq(politicians.handle, voteData.politicianHandle))
            .then(res => res[0]);

        if (!politician) {
            console.error(`Politician with handle ${voteData.politicianHandle} not found.`);
            continue;
        }

        // Get the voting session
        const session = await db
            .select()
            .from(votingSessions)
            .where(eq(votingSessions.sessionId, voteData.sessionId))
            .then(res => res[0]);

        if (!session) {
            console.error(`Voting session with sessionId ${voteData.sessionId} not found.`);
            continue;
        }

        // Check if the vote already exists
        const existingVote = await db
            .select()
            .from(votes)
            .where(
                and(
                    eq(votes.politicianId, politician.id),
                    eq(votes.votingSessionId, session.id)
                )
            )
            .then(res => res[0]);

        if (!existingVote) {
            // Insert the vote
            await db.insert(votes).values({
                politicianId: politician.id,
                votingSessionId: session.id,
                vote: voteData.vote,
            });
            console.log(`Inserted vote for ${politician.name} in session ${voteData.sessionId}`);
        } else {
            console.log(`Vote for ${politician.name} in session ${voteData.sessionId} already exists.`);
        }

        // Handle party affiliations
        const voteDate = voteData.voteDate;

        // Check if 'voteDate' is not null
        if (!voteDate) {
            console.error(`Vote date is null for politician ${politician.name}. Skipping affiliation.`);
            continue;
        }

        // Check if there's an existing affiliation covering the vote date
        const existingAffiliation = await db
            .select()
            .from(politicianAffiliations)
            .where(
                and(
                    eq(politicianAffiliations.politicianId, politician.id),
                    eq(politicianAffiliations.party, voteData.partyName),
                    eq(politicianAffiliations.validFrom, voteDate)
                )
            )
            .then(res => res[0]);

        if (!existingAffiliation) {
            // Insert new affiliation
            await db.insert(politicianAffiliations).values({
                politicianId: politician.id,
                party: voteData.partyName,
                validFrom: voteDate as string,
                validTo: null,
            });
            console.log(`Inserted affiliation for ${politician.name} with party ${voteData.partyName}`);
        } else {
            console.log(`Affiliation for ${politician.name} with party ${voteData.partyName} already exists.`);
        }
    }

    console.log('Data insertion completed.');
}

main().catch(error => {
    console.error('An error occurred:', error);
});