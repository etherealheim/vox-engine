# Database Migration Plan

## Overview

This document outlines the plan for migrating the database to the new schema and updating associated API code. The new schema provides a more normalized structure for storing politicians, voting sessions, votes, and tweets data.

## Schema Changes Summary

1. **Parties Table**: Added as a new table to normalize party information.
2. **Politicians Table**: Updated to reference parties via foreign key.
3. **Voting Sessions Table**: Expanded with more metadata fields.
4. **Votes Table**: Restructured with clearer relationships.
5. **Tweets Table**: Updated with better metadata support and potential vote associations.
6. **System Logs Table**: Added for system-wide logging.
7. **Tweet-Vote Association Table**: Optional table to track relationships between tweets and votes.

## Implementation Steps

### 1. Reset Database

Use the new reset script to wipe the current database and recreate with the new schema:

```bash
npm run db:reset
```

This script will:
- Drop all existing tables
- Generate migrations based on the new schema
- Apply the migrations to recreate the database

### 2. API Code Updates Required

#### Twitter API (lib/twitter-api.ts)

- Update column references:
  - Change `tweet_id` to `externalId`
  - Change `text` to `content`
  - Change `created_at` to `postedAt`
  - Add handling for `mediaUrls` and `metrics`
  - Update foreign key references to `politicianId`

- Query updates needed:
  - Update `getRecentTweets` function to use new column names
  - Update `getTweetStats` to use correct table joins
  - Update any save/update functions to match new schema

#### Vote API (src/vote-ui.js)

- Update column references:
  - Change `session_id` to `externalId`
  - Update joins between `voting_sessions` and `votes` tables
  - Add support for the new party relationship

- Query updates needed:
  - Update `recent-sessions` endpoint
  - Update `detailed-stats` endpoint
  - Update any scraping logic to store data in the new format

### 3. Data Import Considerations

- If preserving existing data is required, additional migration scripts should:
  - Extract data from old structure before reset
  - Transform to match new schema
  - Import after schema recreation

## Code Update Plan

1. Update Twitter API implementation
2. Update Vote API implementation
3. Update Frontend code to work with new data structure
4. Test all endpoints and functionality

## Rollback Plan

In case of issues, the rollback procedure is:

1. Restore database from backup (if available)
2. Revert code changes to API implementations
3. Reset connections to ensure cache is cleared

## Timeline

- Database Reset: Immediate
- Code Updates: Within 24 hours
- Testing: 1-2 days
- Production Deployment: After successful testing 