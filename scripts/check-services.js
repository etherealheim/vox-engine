#!/usr/bin/env node
/**
 * Service checker script
 * 
 * This script checks if the necessary services are configured properly
 * and provides helpful error messages if they are not.
 */

require('dotenv').config({ path: '.env.local' });
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check for required environment variables
const requiredEnvVars = [
  { name: 'DATABASE_URL', description: 'PostgreSQL database connection string' },
  { name: 'TWITTER_API_KEY', description: 'Twitter API key for fetching tweets' }
];

console.log('🔍 Checking service configuration...');

let missingVars = [];

// Check each required environment variable
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar.name]) {
    missingVars.push(envVar);
  }
});

// If there are missing variables, print helpful messages
if (missingVars.length > 0) {
  console.error('\n❌ Missing environment variables:');
  
  missingVars.forEach(envVar => {
    console.error(`   - ${envVar.name}: ${envVar.description}`);
  });
  
  console.error('\n⚠️  Please add these variables to your .env.local file or environment');
  console.error('   You can also continue without them, but some features may not work.\n');
} else {
  console.log('✅ All required environment variables are set');
}

// Check database connection
if (process.env.DATABASE_URL) {
  console.log('🔍 Checking database connection...');
  
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 5000, // 5 seconds timeout
  });
  
  pool.query('SELECT NOW()')
    .then(() => {
      console.log('✅ Database connection successful');
      pool.end();
    })
    .catch(err => {
      console.error('❌ Database connection failed:', err.message);
      console.error('⚠️  Please check your DATABASE_URL environment variable');
      pool.end();
    });
}

// Check Twitter API key if available
if (process.env.TWITTER_API_KEY) {
  console.log('✅ Twitter API key is configured');
  
  if (process.env.TWITTER_API_KEY.length < 25) {
    console.warn('⚠️  Twitter API key appears to be too short. Please verify it is correct.');
  }
}

// Function to check if the scraper service SQL queries have the correct column names
function checkAndFixScraperService() {
  const scraperUiPath = path.join(__dirname, '../src/scraper-ui.js');
  
  try {
    // Only proceed if the file exists
    if (fs.existsSync(scraperUiPath)) {
      const content = fs.readFileSync(scraperUiPath, 'utf8');
      
      // Check if we need to fix any session_id references
      if (content.includes('v.session_id = vs.id') || 
          content.includes('vs.id = v.session_id')) {
        
        console.log('🔧 Fixing scraper-ui.js SQL query column names...');
        
        // Fix the column references
        const fixed = content
          .replace(/v\.session_id\s*=\s*vs\.id/g, 'v.voting_session_id = vs.id')
          .replace(/vs\.id\s*=\s*v\.session_id/g, 'vs.id = v.voting_session_id');
        
        // Write the fixed content back
        fs.writeFileSync(scraperUiPath, fixed, 'utf8');
        console.log('✅ Fixed scraper-ui.js SQL queries!');
        
        // Restart the scraper service if it's running
        try {
          execSync('pkill -f "node src/scraper-ui.js" || true');
          console.log('✅ Restarted scraper-ui.js service');
        } catch (err) {
          // Just log, don't fail
          console.log('⚠️ Could not restart scraper-ui.js service');
        }
      } else {
        console.log('✅ scraper-ui.js SQL queries look good');
      }
    }
  } catch (error) {
    console.error('⚠️ Error checking scraper-ui.js:', error.message);
  }
}

// Kill any running Drizzle Studio instances
try {
  console.log('Checking for existing Drizzle Studio instances...');
  execSync('pkill -f "drizzle-kit studio" || true');
  console.log('Cleared any existing Drizzle Studio instances');
} catch (error) {
  // Ignore errors, as this is just a precaution
}

// Check and fix scraper service if needed
checkAndFixScraperService();

console.log('🚀 Starting development services...'); 