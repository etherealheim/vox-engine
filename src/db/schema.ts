import { pgTable, serial, text, integer, date } from 'drizzle-orm/pg-core';

// Politicians table (static information)
export const politicians = pgTable('politicians', {
    id: serial('id').primaryKey(),              // Auto-incremented unique identifier
    name: text('name').notNull().unique(),      // Politician's full name
    handle: text('handle').notNull().unique(),  // Politician handle (e.g., "miroslav-kalousek")
    twitter: text('twitter'),                   // Optional Twitter link
    wikipedia: text('wikipedia'),               // Optional Wikipedia link
});

// Political party affiliations table (with validFrom and validTo)
export const politicianAffiliations = pgTable('politician_affiliations', {
    id: serial('id').primaryKey(),              // Auto-incremented unique identifier
    politicianId: integer('politician_id').references(() => politicians.id), // Foreign key reference to politicians
    party: text('party').notNull(),             // Party affiliation during this period
    validFrom: date('valid_from').notNull(),    // When the affiliation starts
    validTo: date('valid_to'),                  // When the affiliation ends (null for current party)
});

// Voting sessions table
export const votingSessions = pgTable('voting_sessions', {
    id: serial('id').primaryKey(),              // Auto-incremented unique identifier
    sessionId: integer('session_id').notNull().unique(), // Unique 'g' value
    date: date('date'),                         // Date of the session
    time: text('time'),                         // Time of the session
    title: text('title'),                       // Title of the vote
    meetingDetails: text('meeting_details'),    // Additional meeting details
});

// Votes table (linking politicians to voting sessions with their vote)
export const votes = pgTable('votes', {
    id: serial('id').primaryKey(),              // Auto-incremented unique identifier
    politicianId: integer('politician_id').references(() => politicians.id), // Foreign key reference to politicians
    votingSessionId: integer('voting_session_id').references(() => votingSessions.id), // Foreign key reference to voting sessions
    vote: text('vote'),                         // The actual vote (Yes, No, Not logged in, etc.)
}, (table) => ({
    uniqueConstraint: { columns: [table.politicianId, table.votingSessionId] } // Ensure one vote per session per politician
}));
