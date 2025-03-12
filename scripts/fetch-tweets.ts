/**
 * Fetch Tweets Script
 * 
 * This script fetches tweets from politicians with Twitter handles
 * and saves them to the database.
 */

import { 
  fetchPoliticiansWithTwitter, 
  fetchUserTweets, 
  saveTweetsToDatabase,
  fetchTweetsForAllPoliticians
} from '../lib/twitter-scraper';

async function main() {
  try {
    console.log('Starting Twitter scraping process...');
    
    // Use the new consolidated function to fetch tweets for all politicians
    const results = await fetchTweetsForAllPoliticians(100);
    
    console.log('\n=== FINAL RESULTS ===');
    console.log(`Total politicians processed: ${results.processedPoliticians}/${results.totalPoliticians}`);
    console.log(`Total new tweets added: ${results.totalNewTweets}`);
    console.log(`Total tweets skipped (duplicates): ${results.totalSkippedTweets}`);
    
    if (results.rateLimited) {
      console.warn('\n⚠️ Some requests were rate limited. Not all tweets could be fetched.');
    }
    
    // Log details for each politician
    console.log('\n=== DETAILS ===');
    for (const detail of results.details) {
      if (detail.error) {
        console.error(`❌ ${detail.name}: Error - ${detail.error}`);
      } else {
        console.log(`✅ ${detail.name}: ${detail.newTweets} new, ${detail.skippedTweets} skipped`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the script
main()
  .then(() => {
    console.log('\nTwitter scraping completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 