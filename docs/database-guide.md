# Database Guide

## Overview

This document provides information about the database structure and how to manage it in the Vox Engine application.

## Database Schema

The database uses a normalized structure with the following tables:

### Parties Table
Stores information about political parties.
- `id`: Auto-incremented unique identifier
- `name`: Party name
- `short_name`: Abbreviation or short name
- `logo_url`: URL to party logo
- `website`: Party website
- `created_at`: Timestamp when the record was created
- `updated_at`: Timestamp when the record was last updated

### Politicians Table
Stores information about politicians.
- `id`: Auto-incremented unique identifier
- `name`: Politician's full name
- `party_id`: Foreign key reference to parties
- `twitter_handle`: Politician's Twitter handle (without @)
- `official_title`: Official title or position
- `biography`: Short biography
- `profile_image_url`: URL to profile image
- `is_verified`: Whether the politician is verified
- `last_twitter_sync`: Last time Twitter data was synced
- `created_at`: Timestamp when the record was created
- `updated_at`: Timestamp when the record was last updated

### Voting Sessions Table
Stores information about voting sessions.
- `id`: Auto-incremented unique identifier
- `external_id`: External ID from the source system (e.g., "G12345")
- `title`: Title of the voting session
- `description`: Description of the voting session
- `date`: Date of the voting session
- `category`: Category or type of vote
- `result_summary`: Summary of voting results as JSON (counts, percentages)
- `source_url`: URL to the source of the data
- `created_at`: Timestamp when the record was created
- `updated_at`: Timestamp when the record was last updated

### Votes Table
Links politicians to voting sessions with their vote.
- `id`: Auto-incremented unique identifier
- `session_id`: Foreign key reference to voting sessions
- `politician_id`: Foreign key reference to politicians
- `vote`: The actual vote (yes, no, abstain, absent, not_voting)
- `comment`: Optional comment or explanation for the vote
- `metadata`: Additional metadata as JSON
- `created_at`: Timestamp when the record was created
- `updated_at`: Timestamp when the record was last updated

### Tweets Table
Stores tweets from politicians.
- `id`: Auto-incremented unique identifier
- `external_id`: Unique tweet ID from Twitter
- `politician_id`: Foreign key reference to politicians
- `content`: Tweet content/text
- `url`: URL to the original tweet
- `posted_at`: Timestamp when the tweet was posted
- `media_urls`: Array of media URLs as JSON
- `metrics`: Engagement metrics as JSON (likes, retweets, etc.)
- `related_session_id`: Optional reference to a related voting session
- `sentiment_score`: Optional sentiment analysis score
- `created_at`: Timestamp when the record was created
- `updated_at`: Timestamp when the record was last updated

### System Logs Table
Stores logs of system operations.
- `id`: Auto-incremented unique identifier
- `type`: Type of log (e.g., 'twitter_scrape', 'vote_scrape', 'error')
- `status`: Status (e.g., 'success', 'error', 'in_progress')
- `message`: Log message
- `details`: Additional details as JSON
- `created_at`: Timestamp when the log was created

### Tweet-Vote Association Table
Optional table linking tweets to potentially related votes for analysis.
- `tweet_id`: Foreign key reference to tweets
- `vote_id`: Foreign key reference to votes
- `confidence_score`: How confident we are in the association (0-100)
- `association_type`: Type of association (e.g., 'direct_reference', 'temporal', 'keyword')
- `created_at`: Timestamp when the association was created

## Database Management

### Environment Setup

Make sure your environment variables for database connection are properly set:
- `DATABASE_URL` or `POSTGRES_URL` should contain your database connection string

### Database Commands

The following npm scripts are available for database management:

#### Schema Management
- `npm run db:generate`: Generate migrations based on the schema
- `npm run db:migrate`: Apply migrations to the database
- `npm run db:push`: Push schema changes directly to the database
- `npm run db:studio`: Open Drizzle Studio to view and manage the database

#### Database Reset
- `npm run db:reset`: Reset the database (drops all tables and recreates the schema)
- `npm run db:reset-alt`: Alternative reset method for limited permissions
- `npm run db:clear`: Clear all data from the database while preserving the schema

#### Data Seeding
- `npm run db:seed`: Seed the database with initial data (parties, politicians, voting sessions)
- `npm run db:seed-votes`: Add sample votes to the database
- `npm run db:seed-tweets`: Add sample tweets to the database
- `npm run db:seed-all`: Run all seeding scripts in sequence

#### Data Import
- `npm run import-votes [startId] [endId]`: Import real voting data from the Czech Parliament website
  - Example: `npm run import-votes -- 85000 85010` to import sessions 85000 to 85010

#### Monitoring
- `npm run db:check`: Check the number of records in each table
- `npm run db:logs`: View the latest system logs

### Importing Real Data

To populate the database with real voting data:

1. Clear any existing sample data:
   ```bash
   npm run db:clear
   ```

2. Import voting data from the Czech Parliament website:
   ```bash
   npm run import-votes -- [startId] [endId]
   ```
   
   This will:
   - Scrape voting sessions from the specified range
   - Create political parties as they are encountered
   - Create politicians and associate them with their parties
   - Record votes for each politician on each voting session
   - Log each successful import to the system_logs table
   - Commit the transaction after each session is processed

3. Monitor the import process:
   ```bash
   npm run db:check  # Check record counts
   npm run db:logs   # View system logs
   ```

4. View the imported data:
   ```bash
   npm run db:studio
   ```

### Resetting the Database

If you need to reset the database and start fresh:

1. Run the reset script:
   ```bash
   npm run db:reset
   ```
   
   If you encounter permission issues, try the alternative reset script:
   ```bash
   npm run db:reset-alt
   ```

2. Apply migrations:
   ```bash
   npm run db:migrate
   ```

3. Seed the database:
   ```bash
   npm run db:seed-all
   ```

### Viewing the Database

You can use Drizzle Studio to view and manage the database:

```bash
npm run db:studio
```

This will open a web interface at https://local.drizzle.studio where you can browse and edit the data.

## Relationships

The database schema includes the following relationships:

- A politician belongs to a party (many-to-one)
- A politician can have many votes (one-to-many)
- A politician can have many tweets (one-to-many)
- A voting session can have many votes (one-to-many)
- A tweet can be related to a voting session (many-to-one)
- A tweet can be associated with multiple votes through the tweet-vote association table (many-to-many)

## Data Flow

1. Politicians and parties are added to the database
2. Voting sessions are scraped and added to the database
3. Votes are linked to politicians and voting sessions
4. Tweets are scraped from politicians' Twitter accounts
5. Tweets may be associated with relevant voting sessions
6. The application displays relationships between politicians, their votes, and their tweets 