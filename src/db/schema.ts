import { pgTable, serial, text, timestamp, integer, boolean, index, uniqueIndex, varchar, date, primaryKey, json } from 'drizzle-orm/pg-core';

/**
 * Party table
 * Stores information about political parties
 */
export const parties = pgTable('parties', {
    id: serial('id').primaryKey(),                        // Auto-incremented unique identifier
    name: varchar('name', { length: 100 }).notNull(),     // Party name
    shortName: varchar('short_name', { length: 20 }),     // Abbreviation or short name
    logoUrl: text('logo_url'),                           // URL to party logo
    website: text('website'),                            // Party website
    createdAt: timestamp('created_at').defaultNow(),      // Timestamp when the record was created
    updatedAt: timestamp('updated_at').defaultNow(),      // Timestamp when the record was last updated
}, (table) => ({
    nameIdx: index('party_name_idx').on(table.name),
    shortNameIdx: index('party_short_name_idx').on(table.shortName),
}));

/**
 * Politicians table
 * Stores information about politicians
 */
export const politicians = pgTable('politicians', {
    id: serial('id').primaryKey(),                        // Auto-incremented unique identifier
    name: varchar('name', { length: 100 }).notNull(),     // Politician's full name
    partyId: integer('party_id').references(() => parties.id), // Foreign key reference to parties
    twitterHandle: varchar('twitter_handle', { length: 50 }), // Politician's Twitter handle (without @)
    officialTitle: varchar('official_title', { length: 100 }), // Official title or position
    biography: text('biography'),                       // Short biography
    profileImageUrl: text('profile_image_url'),         // URL to profile image
    isVerified: boolean('is_verified').default(false),    // Whether the politician is verified
    lastTwitterSync: timestamp('last_twitter_sync'),      // Last time Twitter data was synced
    createdAt: timestamp('created_at').defaultNow(),      // Timestamp when the record was created
    updatedAt: timestamp('updated_at').defaultNow(),      // Timestamp when the record was last updated
}, (table) => ({
    nameIdx: index('politician_name_idx').on(table.name),
    twitterIdx: index('politician_twitter_idx').on(table.twitterHandle),
    partyIdx: index('politician_party_idx').on(table.partyId),
}));

/**
 * Voting sessions table
 * Stores information about voting sessions
 */
export const votingSessions = pgTable('voting_sessions', {
    id: serial('id').primaryKey(),                        // Auto-incremented unique identifier
    externalId: varchar('external_id', { length: 50 }).unique(), // External ID from the source system (e.g., "G12345")
    title: varchar('title', { length: 200 }).notNull(),   // Title of the voting session
    description: text('description'),                     // Description of the voting session
    date: date('date').notNull(),                         // Date of the voting session
    category: varchar('category', { length: 100 }),       // Category or type of vote
    resultSummary: json('result_summary'),                // Summary of voting results as JSON (counts, percentages)
    sourceUrl: text('source_url'),                        // URL to the source of the data
    createdAt: timestamp('created_at').defaultNow(),      // Timestamp when the record was created
    updatedAt: timestamp('updated_at').defaultNow(),      // Timestamp when the record was last updated
}, (table) => ({
    dateIdx: index('voting_session_date_idx').on(table.date),
    externalIdIdx: uniqueIndex('voting_session_external_id_idx').on(table.externalId),
    categoryIdx: index('voting_session_category_idx').on(table.category),
}));

/**
 * Vote types enum
 * Defines the possible types of votes
 */
export const VoteType = {
    YES: 'yes',
    NO: 'no',
    ABSTAIN: 'abstain',
    ABSENT: 'absent',
    NOT_VOTING: 'not_voting',
} as const;

/**
 * Votes table
 * Links politicians to voting sessions with their vote
 */
export const votes = pgTable('votes', {
    id: serial('id').primaryKey(),                               // Auto-incremented unique identifier
    sessionId: integer('session_id').references(() => votingSessions.id).notNull(), // Foreign key reference to voting sessions
    politicianId: integer('politician_id').references(() => politicians.id).notNull(), // Foreign key reference to politicians
    vote: varchar('vote', { length: 20 }).notNull(),              // The actual vote (using VoteType values)
    comment: text('comment'),                                    // Optional comment or explanation for the vote
    metadata: json('metadata'),                                  // Additional metadata as JSON
    createdAt: timestamp('created_at').defaultNow(),             // Timestamp when the record was created
    updatedAt: timestamp('updated_at').defaultNow(),             // Timestamp when the record was last updated
}, (table) => ({
    sessionIdx: index('vote_session_idx').on(table.sessionId),
    politicianIdx: index('vote_politician_idx').on(table.politicianId),
    voteTypeIdx: index('vote_type_idx').on(table.vote),
    // Unique constraint to ensure one vote per politician per session
    uniqueConstraint: uniqueIndex('vote_unique_idx').on(table.politicianId, table.sessionId), 
}));

/**
 * Tweets table
 * Stores tweets from politicians
 */
export const tweets = pgTable('tweets', {
    id: serial('id').primaryKey(),                                 // Auto-incremented unique identifier
    externalId: varchar('external_id', { length: 50 }).unique().notNull(), // Unique tweet ID from Twitter
    politicianId: integer('politician_id').references(() => politicians.id).notNull(), // Foreign key reference to politicians
    content: text('content').notNull(),                            // Tweet content/text
    url: text('url'),                                              // URL to the original tweet
    postedAt: timestamp('posted_at').notNull(),                    // Timestamp when the tweet was posted 
    mediaUrls: json('media_urls'),                                 // Array of media URLs as JSON
    metrics: json('metrics'),                                      // Engagement metrics as JSON (likes, retweets, etc.)
    relatedSessionId: integer('related_session_id').references(() => votingSessions.id), // Optional reference to a related voting session
    sentimentScore: integer('sentiment_score'),                    // Optional sentiment analysis score
    createdAt: timestamp('created_at').defaultNow(),               // Timestamp when the record was created
    updatedAt: timestamp('updated_at').defaultNow(),               // Timestamp when the record was last updated
}, (table) => ({
    politicianIdx: index('tweet_politician_idx').on(table.politicianId),
    postedAtIdx: index('tweet_posted_at_idx').on(table.postedAt),
    externalIdIdx: uniqueIndex('tweet_external_id_idx').on(table.externalId),
    relatedSessionIdx: index('tweet_related_session_idx').on(table.relatedSessionId),
}));

/**
 * System logs table
 * Stores logs of system operations
 */
export const systemLogs = pgTable('system_logs', {
    id: serial('id').primaryKey(),                     // Auto-incremented unique identifier
    type: varchar('type', { length: 50 }).notNull(),   // Type of log (e.g., 'twitter_scrape', 'vote_scrape', 'error')
    status: varchar('status', { length: 50 }).notNull(), // Status (e.g., 'success', 'error', 'in_progress')
    message: text('message'),                         // Log message
    details: json('details'),                         // Additional details as JSON
    createdAt: timestamp('created_at').defaultNow(),  // Timestamp when the log was created
}, (table) => ({
    typeIdx: index('system_log_type_idx').on(table.type),
    statusIdx: index('system_log_status_idx').on(table.status),
    createdAtIdx: index('system_log_created_at_idx').on(table.createdAt),
}));

/**
 * Tweet-Vote association table
 * Optional: Links tweets to potentially related votes for analysis
 */
export const tweetVoteAssociations = pgTable('tweet_vote_associations', {
    tweetId: integer('tweet_id').references(() => tweets.id).notNull(),
    voteId: integer('vote_id').references(() => votes.id).notNull(),
    confidenceScore: integer('confidence_score'), // How confident we are in the association (0-100)
    associationType: varchar('association_type', { length: 50 }), // Type of association (e.g., 'direct_reference', 'temporal', 'keyword')
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
    pk: primaryKey(table.tweetId, table.voteId),
    tweetIdx: index('tweet_vote_assoc_tweet_idx').on(table.tweetId),
    voteIdx: index('tweet_vote_assoc_vote_idx').on(table.voteId),
}));
