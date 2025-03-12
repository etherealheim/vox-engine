/**
 * Fetch Votes Script
 * 
 * This script fetches voting data from the parliament website
 * and saves it to the database.
 */

import { 
  startVoteScraping,
  ScraperConfig
} from '../lib/vote-scraper';

// Parse command line arguments
const args = process.argv.slice(2);
const config: ScraperConfig = {
  startG: parseInt(args[0] || '50000', 10),
  endG: parseInt(args[1] || '100000', 10),
  reverse: args[2] === 'true' || args[2] === '1' || false,
  parallelSessions: parseInt(args[3] || '5', 10),
  dateFilter: args[4] || null,
  skipExisting: args[5] !== 'false' && args[5] !== '0'
};

async function main() {
  try {
    console.log('Starting vote scraping process with configuration:');
    console.log(`- Session range: ${config.startG} to ${config.endG} (${config.reverse ? 'reverse' : 'forward'} order)`);
    console.log(`- Parallel sessions: ${config.parallelSessions}`);
    console.log(`- Date filter: ${config.dateFilter || 'none'}`);
    console.log(`- Skip existing: ${config.skipExisting ? 'yes' : 'no'}`);
    
    // Start the scraping process
    const success = await startVoteScraping(config);
    
    if (success) {
      console.log('\nVote scraping completed successfully');
    } else {
      console.error('\nVote scraping failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the script
main()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 