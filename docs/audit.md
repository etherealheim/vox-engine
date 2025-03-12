# Vox Engine Repository Audit

This document provides a comprehensive overview of all files in the Vox Engine repository, explaining their purpose and functionality.

## Project Overview

Vox Engine is a data collection and analysis engine for political data, including Twitter content and voting records. The application is built with Next.js, uses Drizzle ORM with PostgreSQL for data storage, and includes services for scraping Twitter content and voting records.

## Directory Structure

### Root Directory

- **package.json**: Defines project dependencies, scripts, and configuration.
- **package-lock.json**: Auto-generated file for npm dependency versioning.
- **README.md**: Project documentation with features, setup instructions, and architecture overview.
- **README-DB-MIGRATION.md**: Documentation for database migration procedures.
- **.env**: Environment variables for development.
- **.env.local**: Local environment variables (contains sensitive information like API keys).
- **tsconfig.json**: TypeScript configuration for the Next.js application.
- **tsconfig.node.json**: TypeScript configuration for Node.js scripts.
- **next.config.mjs**: Next.js framework configuration.
- **tailwind.config.js**: Tailwind CSS configuration.
- **postcss.config.mjs**: PostCSS configuration for processing CSS.
- **drizzle.config.ts**: Configuration for Drizzle ORM, defining database connection details.
- **.eslintrc.json**: ESLint configuration for code linting.
- **.gitignore**: Specifies files to be ignored by Git.
- **next-env.d.ts**: TypeScript declarations for Next.js.
- **import-votes.log**: Log file for vote import operations.

### /app Directory (Next.js Application)

- **page.tsx**: Main application page component with dashboard, statistics, and service monitoring.
- **layout.tsx**: Root layout component for the Next.js application.
- **globals.css**: Global CSS styles.
- **favicon.ico**: Website favicon.
- **/app/components/**: UI components for the application.
  - **/app/components/ui/**: Core UI components (button, card, progress, tabs, badge, separator, theme-toggle).
  - **/app/components/layout/**: Layout components for page structure.
  - **/app/components/twitter/**: Twitter data visualization components.
  - **/app/components/vote/**: Voting data visualization components.
  - **/app/components/shared/**: Shared components used across different features.
    - **scraper-status.tsx**: Reusable component for displaying scraper status.
    - **data-stats.tsx**: Reusable component for displaying data statistics.
  - **theme-provider.tsx**: Provider component for the application's theme context.
- **/app/twitter/**: Twitter data visualization pages.
- **/app/twitter-scraper/**: Twitter scraping interface pages.
- **/app/vote-scraper/**: Vote scraping interface pages.
- **/app/fonts/**: Font files for the application.
- **/app/api/**: API routes for the Next.js application.
  - **/app/api/database/**: Database operations API.
  - **/app/api/services/**: Service management API.
  - **/app/api/scrapers/**: Unified API for scrapers.
    - **/app/api/scrapers/twitter/**: Twitter scraper API routes.
    - **/app/api/scrapers/vote/**: Vote scraper API routes.

### /src Directory (Core Application Logic)

- **/src/db/**: Database-related code.
  - **schema.ts**: Defines the database schema using Drizzle ORM.
  - **config.ts**: Database connection configuration and utility functions.
- **/src/ts/**: TypeScript utility files (empty directory, reserved for future use).
- **scraper-ui.js**: Unified Express server for both Twitter and vote scraper UIs.
- **fetch-votes.js**: Script for scraping voting data using Puppeteer.
- **test-db.js**: Script for testing database connections.
- **index.ts**: Main entry point for the application.
- **delete.ts**: Utilities for deleting data.
- **test.ts**: Test utilities.
- **index-template.ts**: Template file for index.ts.

### /lib Directory (Shared Utilities)

- **twitter-api.ts**: Twitter API integration code for fetching and processing tweets.
- **utils.ts**: General utility functions.

### /drizzle Directory (Database Migrations)

- **0000_productive_blue_shield.sql**: Initial database migration.
- **/meta/**: Metadata for Drizzle ORM migrations.
  - **0000_snapshot.json**: Database schema snapshot.
  - **_journal.json**: Migration journal tracking applied migrations.

### /scripts Directory (Utility Scripts)

#### Database Management Scripts
- **init-db.ts**: Initializes the database with basic data.
- **migrate.ts**: Runs database migrations using Drizzle ORM.
- **reset-database.js**: Unified database reset script with multiple methods.
- **clear-sample-data.js**: Clears sample data while preserving the schema.

#### Data Seeding Scripts
- **seed-initial-data.js**: Seeds the database with initial data.
- **seed-votes.js**: Seeds the database with sample voting data.
- **seed-tweets.js**: Seeds the database with sample tweet data.

#### System Operation Scripts
- **check-services.js**: Checks if necessary services are configured and running.
- **start-services.js**: Starts the required services for the application.
- **check-db-counts.js**: Checks the number of records in each database table.
- **check-system-logs.js**: Checks and displays system logs from the database.
- **fetch-tweets.ts**: Script for fetching tweets from Twitter.

### /public Directory (Static Assets)

- **vote-scraper.html**: Standalone HTML interface for the vote scraper.
- **index.html**: Static HTML file for the application's landing page.

### /data Directory (Data Files)

- **scraper-state.json**: Stores the state of the vote scraper.

### /docs Directory (Documentation)

- **database-guide.md**: Guide to the database schema and operations.
- **database-migration-plan.md**: Documentation for database migration procedures.

### /.next Directory (Next.js Build Output)

Contains the compiled and optimized output of the Next.js build process. This directory is generated automatically and should not be modified directly.

## Database Schema

### Tables

1. **parties**: Political parties information.
   - Fields: id, name, shortName, logoUrl, website, createdAt, updatedAt

2. **politicians**: Politicians information with party affiliations and Twitter handles.
   - Fields: id, name, partyId, twitterHandle, officialTitle, biography, profileImageUrl, isVerified, lastTwitterSync, createdAt, updatedAt

3. **votingSessions**: Voting sessions in the Parliament.
   - Fields: id, externalId, title, description, date, category, resultSummary, sourceUrl, createdAt, updatedAt

4. **votes**: Individual votes by politicians for each voting session.
   - Fields: id, sessionId, politicianId, vote, comment, metadata, createdAt, updatedAt

5. **tweets**: Tweets from politicians.
   - Fields: id, externalId, politicianId, content, url, postedAt, mediaUrls, metrics, relatedSessionId, sentimentScore, createdAt, updatedAt

6. **systemLogs**: System operations and errors logs.
   - Fields: id, type, status, message, details, createdAt

7. **tweetVoteAssociations**: Links between tweets and related votes.
   - Fields: tweetId, voteId, confidenceScore, associationType, createdAt 