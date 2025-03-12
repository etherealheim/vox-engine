/**
 * Database Migration Script
 * This script applies the database schema migrations using Drizzle ORM
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as schema from '../src/db/schema';

// Parse database URL from environment variables
const POSTGRES_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!POSTGRES_URL) {
  console.error('❌ POSTGRES_URL or DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function main() {
  console.log('Starting database migration...');
  
  // Create a PostgreSQL connection pool
  const pool = new Pool({
    connectionString: POSTGRES_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  });

  try {
    // Create a Drizzle instance
    const db = drizzle(pool, { schema });

    // Apply migrations
    await migrate(db, { migrationsFolder: './drizzle' });

    console.log('✅ Migrations applied successfully');

    // Seed basic data if needed (uncomment and modify as needed)
    // console.log('Seeding basic data...');
    // await seedBasicData(db);
    // console.log('✅ Basic data seeded successfully');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Close the pool
    await pool.end();
    console.log('Database connection closed');
  }
}

// Optional: Seed function for basic data
// async function seedBasicData(db: any) {
//   // Example: Insert some political parties
//   await db.insert(schema.parties).values([
//     { name: 'Democratic Party', shortName: 'Dem' },
//     { name: 'Republican Party', shortName: 'GOP' },
//     // Add more as needed
//   ]).onConflictDoNothing();
// }

// Run the migration
main()
  .then(() => {
    console.log('Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  }); 