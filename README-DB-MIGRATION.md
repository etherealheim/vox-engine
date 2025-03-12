# Database Migration Guide

## Overview

This guide provides step-by-step instructions for migrating your database to the new schema. The new structure improves data organization and relationships between politicians, votes, and tweets.

## 🚨 Important Warning

**The migration process will DELETE ALL DATA in your database!** 

Please make sure you:
1. Back up any important data before proceeding
2. Understand that all current data will be lost
3. Are prepared to repopulate the database after migration

## Migration Steps

### Prerequisites

- Make sure your environment variables for database connection are properly set:
  - `DATABASE_URL` or `POSTGRES_URL` should contain your database connection string
  - You must have permissions to drop and create tables in this database

### Step 1: Update Your Code

First, make sure you have pulled the latest changes which include:
- New database schema in `src/db/schema.ts`
- Updated API code in `lib/twitter-api.ts` and `src/vote-ui.js`
- Migration scripts in the `scripts` directory

```bash
git pull origin main
npm install
```

### Step 2: Run the Database Reset Script

The reset script will:
1. Drop all existing tables in your database
2. Generate migrations based on the new schema
3. Apply the migrations to create the new tables

```bash
# Make sure the script is executable
chmod +x scripts/reset-database.js

# Run the reset script
npm run db:reset
```

You will be prompted to confirm the operation by typing 'YES'. This is a safety measure to prevent accidental data loss.

### Alternative Reset Method (For Limited Permissions)

If you encounter a permissions error such as `permission denied to set parameter "session_replication_role"`, you're likely using a managed database service (like Vercel Postgres or Neon) where your user doesn't have superuser privileges.

In this case, use the alternative reset script:

```bash
# Make sure the script is executable
chmod +x scripts/reset-database-alt.js

# Run the alternative reset script
npm run db:reset-alt
```

This alternative script uses Drizzle Kit's built-in functionality to drop and recreate tables, which may work better with limited permissions.

### Step 3: Start the Application

After the migration completes successfully, start the application:

```bash
npm run dev
```

### Step 4: Populate the Database

Begin re-populating your database by:
1. Adding political parties via the UI
2. Adding politicians and their Twitter handles
3. Running the tweet and vote scrapers

## Troubleshooting

### Permission Issues

If you encounter permission errors like:
```
Error during database reset: permission denied to set parameter "session_replication_role"
```

This means your database user doesn't have sufficient privileges. Try these solutions:

1. Use the alternative reset script: `npm run db:reset-alt`
2. If this still fails, you might need to:
   - Contact your database provider to request additional permissions
   - For Neon or Vercel Postgres, consider creating a new project with a fresh database
   - For local development, create a new PostgreSQL user with appropriate permissions

### Database Connection Issues

If you encounter database connection issues:

1. Verify your environment variables:
   ```bash
   echo $DATABASE_URL
   # or
   echo $POSTGRES_URL
   ```

2. Check that your database is running and accessible:
   ```bash
   pg_isready -d your_database_name
   ```

3. Ensure you have the correct permissions to modify the database schema.

### Migration Script Errors

If the migration script fails:

1. Check the error message for specific issues
2. Verify that Drizzle Kit is properly installed: `npx drizzle-kit --version`
3. Try running each step manually:
   ```bash
   npx drizzle-kit generate:pg
   npx ts-node --project tsconfig.node.json scripts/migrate.ts
   ```

## Manual Reset (Last Resort)

If both reset scripts fail, you can try manually dropping tables with SQL:

1. Connect to your database (replace `your_db_url` with your connection string):
   ```bash
   psql your_db_url
   ```

2. List all tables:
   ```sql
   SELECT tablename FROM pg_tables WHERE schemaname = 'public';
   ```

3. Drop tables manually (replace with your actual table names):
   ```sql
   DROP TABLE IF EXISTS tweets, tweet_vote_associations CASCADE;
   DROP TABLE IF EXISTS votes CASCADE;
   DROP TABLE IF EXISTS politicians CASCADE;
   DROP TABLE IF EXISTS voting_sessions CASCADE;
   DROP TABLE IF EXISTS parties CASCADE;
   DROP TABLE IF EXISTS system_logs CASCADE;
   ```

4. Then apply migrations:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

## Support

If you encounter any issues during the migration process, please:
1. Consult the detailed migration plan in `docs/database-migration-plan.md`
2. Check the issue tracker for known problems
3. Open a new issue with detailed information about your problem

## Reverting (Emergency Only)

In case of critical issues, if you have a database backup, restore it using:

```bash
pg_restore -d your_database_name your_backup_file
```

Then revert to the previous code version. 