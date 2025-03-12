# Vote Scraper Documentation

## Overview

The Vote Scraper is a module that collects voting data from the parliament website. It scrapes voting sessions, processes votes, and stores them in the database for analysis and display.

## Core Functionality

The Vote Scraper provides the following core functionality:

1. **Fetch Voting Sessions**: Retrieves voting session data from the parliament website.
2. **Process Votes**: Extracts and processes individual votes from each session.
3. **Store Data**: Saves voting sessions and votes to the database.
4. **Track Statistics**: Monitors and reports on the number of sessions, votes, etc.

## Technical Implementation

The Vote scraper is implemented in `lib/vote-scraper.ts` and provides the following key functions:

### Data Interfaces

```typescript
// Vote data structure
interface Vote {
  id: string;
  session_id: number;
  politician_id: number;
  politician_name?: string;
  party?: string;
  vote: string;
  created_at: string;
}

// Voting session data structure
interface VotingSession {
  id: number;
  session_id: string;
  title: string;
  date: string;
  vote_count: number;
  created_at: string;
}

// Scraper configuration
interface ScraperConfig {
  startG: number;
  endG: number;
  reverse: boolean;
  parallelSessions: number;
  dateFilter: string | null;
  skipExisting: boolean;
}
```

### Key Functions

#### Fetching Data

- `fetchRecentSessions(limit)`: Retrieves the most recent voting sessions from the database.
- `fetchVoteStats()`: Gets statistics about the voting data collection.
- `fetchPoliticianVotingData(politicianId)`: Retrieves voting data for a specific politician.

#### Database Operations

- `sessionExists(sessionId)`: Checks if a voting session exists in the database.
- `saveVotingSession(sessionId, title, date)`: Saves a voting session to the database.
- `saveVote(sessionId, politicianName, party, vote)`: Saves a vote to the database.

#### Scraping Operations

- `startVoteScraping(config)`: Starts the vote scraping process with the specified configuration.

## Scraping Process

The vote scraping process follows these steps:

1. **Configuration**: Set up the scraping parameters (session range, parallelism, etc.).
2. **Browser Initialization**: Launch a headless browser for scraping.
3. **Session Processing**: For each session ID in the specified range:
   - Check if the session already exists in the database (if skipExisting is true).
   - Navigate to the session page on the parliament website.
   - Extract session information (title, date).
   - Extract votes from the page.
   - Save the session and votes to the database.
4. **Error Handling**: Handle and log any errors that occur during scraping.
5. **Statistics Tracking**: Track and report on the scraping progress and results.

## Usage in the Application

The Vote scraper is used in the Vote Scraper page (`/vote-scraper`) to provide the following features:

1. **Scraper Status**: Shows the current status of the vote scraping process.
2. **Vote Statistics**: Displays statistics about the collected voting data.
3. **Manual Scraping**: Allows users to manually trigger the scraping process with custom parameters.
4. **Recent Sessions**: Shows a list of recently collected voting sessions.
5. **Politician Lookup**: Enables looking up voting records for specific politicians.

## API Endpoints

The Vote scraper is accessed through the following API endpoints:

- `GET /api/scrapers?service=vote&action=stats`: Retrieves vote statistics.
- `GET /api/scrapers?service=vote&action=status`: Gets the current status of the vote scraper.
- `GET /api/scrapers?service=vote&action=recent-sessions`: Fetches recent voting sessions.
- `GET /api/scrapers?service=vote&action=politician-data`: Gets voting data for a specific politician.
- `POST /api/scrapers?service=vote&action=scrape`: Starts the vote scraping process.

## Error Handling

The Vote scraper includes robust error handling for:

1. **Network Issues**: Handles connection problems with the parliament website.
2. **Page Structure Changes**: Detects and reports changes in the website structure.
3. **Detached Frames**: Handles browser issues with detached frames.
4. **Data Validation**: Validates scraped data before saving to the database.

## Future Improvements

Potential improvements for the Vote scraper include:

1. **Scheduled Scraping**: Implementing automatic scheduled scraping at regular intervals.
2. **Advanced Filtering**: Adding more options to filter voting sessions by date, topic, etc.
3. **Voting Pattern Analysis**: Implementing analysis of voting patterns across parties.
4. **Text Analysis**: Adding analysis of session titles and descriptions.
5. **Historical Data Import**: Importing historical voting data from archives. 