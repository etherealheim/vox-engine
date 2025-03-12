# Twitter Scraper Documentation

## Overview

The Twitter Scraper is a module that fetches tweets from politicians who have Twitter handles in the database. It provides functionality for retrieving tweets, managing Twitter handles, and tracking scraping progress.

## Core Functionality

The Twitter Scraper provides the following core functionality:

1. **Fetch Tweets**: Retrieves tweets from politicians' Twitter accounts and stores them in the database.
2. **Manage Twitter Handles**: Validates, cleans, and updates Twitter handles for politicians.
3. **Track Statistics**: Monitors and reports on the number of tweets collected, politicians with tweets, etc.

## Technical Implementation

The Twitter scraper is implemented in `lib/twitter-scraper.ts` and provides the following key functions:

### Data Interfaces

```typescript
// Politician with Twitter handle
interface Politician {
  id: number;
  name: string;
  twitter: string;
}

// Tweet data structure
interface Tweet {
  id: string;
  tweet_id?: string;
  politician_id: number;
  politician_name?: string;
  content: string;
  url?: string;
  posted_at?: string;
  created_at: string;
}

// Results from a fetch operation
interface FetchResults {
  totalPoliticians: number;
  processedPoliticians: number;
  totalNewTweets: number;
  totalSkippedTweets: number;
  details: {
    politicianId: number;
    name: string;
    twitterHandle: string;
    newTweets: number;
    skippedTweets: number;
    totalTweets: number;
    error?: string;
  }[];
  rateLimited: boolean;
}
```

### Key Functions

#### Fetching Data

- `fetchPoliticiansWithTwitter()`: Retrieves all politicians who have Twitter handles.
- `fetchRecentTweets(limit)`: Gets the most recent tweets from the database.
- `fetchTwitterStats()`: Retrieves statistics about the Twitter data collection.

#### Twitter Operations

- `fetchTweetsForAllPoliticians(maxTweetsPerPolitician)`: Fetches tweets for all politicians with Twitter handles.
- `fetchUserTweets(twitterHandle, maxTweets)`: Retrieves tweets for a specific Twitter handle.
- `saveTweetsToDatabase(tweets, politicianId)`: Saves tweets to the database.

#### Handle Management

- `checkAndFixTwitterHandles()`: Validates and cleans Twitter handles in the database.
- `updateTwitterHandle(politicianId, twitterHandle)`: Updates a politician's Twitter handle.

## Usage in the Application

The Twitter scraper is used in the Twitter Scraper page (`/twitter-scraper`) to provide the following features:

1. **Scraper Status**: Shows the current status of the Twitter scraping process.
2. **Twitter Statistics**: Displays statistics about the collected Twitter data.
3. **Manual Scraping**: Allows users to manually trigger the scraping process.
4. **Recent Tweets**: Shows a sample of recently collected tweets.

## API Endpoints

The Twitter scraper is accessed through the following API endpoints:

- `GET /api/scrapers?service=twitter&action=stats`: Retrieves Twitter statistics.
- `GET /api/scrapers?service=twitter&action=status`: Gets the current status of the Twitter scraper.
- `GET /api/scrapers?service=twitter&action=recent-tweets`: Fetches recent tweets.
- `POST /api/scrapers?service=twitter&action=fetch`: Starts the Twitter scraping process.

## Error Handling

The Twitter scraper includes robust error handling for:

1. **Rate Limiting**: Detects when the Twitter API rate limit is reached and reports it.
2. **Invalid Handles**: Identifies and reports invalid Twitter handles.
3. **Connection Issues**: Handles connection problems with the Twitter API.

## Future Improvements

Potential improvements for the Twitter scraper include:

1. **Scheduled Scraping**: Implementing automatic scheduled scraping at regular intervals.
2. **Advanced Filtering**: Adding options to filter tweets by date, content, etc.
3. **Sentiment Analysis**: Integrating sentiment analysis for tweets.
4. **Media Handling**: Improving handling of media attachments in tweets.
5. **Thread Tracking**: Better tracking of tweet threads and conversations. 