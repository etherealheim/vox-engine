# Vox Engine

A data collection and analysis engine for political data, including Twitter content and voting records.

## Features

- **Data Scraping**:
  - Unified scraper service for both Twitter and voting data
  - Fetch politicians with Twitter handles from the database
  - Scrape tweets from politicians' Twitter accounts
  - Scrape voting data from the Czech Parliament
  - Uses parallel approach for faster scraping
  - Real-time progress tracking with UI
  - Minimalist data collection: only stores essential information
  - Privacy-focused: does not collect unnecessary engagement metrics

- **Modern UI**:
  - Built with Next.js, Tailwind CSS, and shadcn/ui components
  - Real-time progress tracking for scraping operations
  - Dashboard with database statistics
  - Responsive design for all devices
  - Dark mode by default with clean, minimalist interface

- **Database Utilities**:
  - Centralized database operations through a unified utility module
  - Connection pooling for improved performance
  - Standardized query functions for common operations
  - Type-safe database interactions with TypeScript
  - Fallback mechanisms for backward compatibility


## Tech stack
   - Next.js - React framework for the frontend
   - Tailwind CSS - Utility-first CSS framework
   - shadcn/ui - Accessible UI components
   - Twitter API - For fetching tweet data
   - Node.js - JavaScript runtime
   - Drizzle ORM - TypeScript ORM for SQL databases
   - PostgreSQL - Relational database
   - Neon DB - Serverless Postgres

## Development Setup

### Prerequisites

- Node.js 18.19.0 or higher
- PostgreSQL database
- Twitter API key (for tweet collection)

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/vox_engine
POSTGRES_USER=username
POSTGRES_PASSWORD=password
POSTGRES_HOST=localhost
POSTGRES_DATABASE=vox_engine
PGPORT=5432

# Twitter API
TWITTER_API_KEY=your_twitter_api_key

# Service Ports
SCRAPER_SERVICE_PORT=3003
```

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/vox-engine.git
   cd vox-engine
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Initialize the database:
   ```
   npm run db:init
   ```

4. Start the development server:
   ```
   npm run dev
   ```

This will start:
- Next.js development server
- Unified scraper service
- Drizzle Studio (database admin interface)

Visit [http://localhost:3000](http://localhost:3000) to see the application.
The Drizzle Studio will be available at [https://local.drizzle.studio](https://local.drizzle.studio).

## Available Scripts

- `npm run dev` - Start all development services
- `npm run next-dev` - Start only the Next.js development server
- `npm run dev:services` - Start only the background services
- `npm run dev:scraper` - Start only the unified scraper service
- `npm run dev:db` - Start only the database services
- `npm run build` - Build the application
- `npm run start` - Start the production server
- `npm run lint` - Run linting
- `npm run analyze` - Analyze the bundle size
- `npm run db:studio` - Run Drizzle Studio (database management)
- `npm run db:migrate` - Run database migrations
- `npm run fetch-tweets` - Manually fetch tweets
- `npm run scrape-votes` - Manually scrape voting data

## Production Deployment

1. Build the application:
   ```
   npm run build
   ```

2. Start the server:
   ```
   npm run start
   ```

## License

[MIT](LICENSE)

## Database Schema

- `politicians`: Information about politicians (name, party)
- `voting_sessions`: Voting sessions in the Parliament (session ID, title, date, description)
- `votes`: Individual votes by politicians (session ID, politician ID, vote value)
- `tweets`: Tweets from politicians (politician ID, text content, date, tweet URL)

## Architecture

The application consists of:

1. **Next.js Frontend**: Modern UI built with React, Next.js, and Tailwind CSS
2. **Unified Scraper Service**: Express server that manages both Twitter and vote data scraping
3. **PostgreSQL Database**: Stores all collected data
4. **Database Utility Module**: Centralized database operations for improved code organization

### Database Utility Module

The database utility module (`src/db/utils.ts`) provides a centralized interface for all database operations:

- Connection pooling for efficient database access
- Standardized query functions for common operations
- Type-safe database interactions with TypeScript
- Error handling and logging for database operations
- Fallback mechanisms for backward compatibility

## Development Guidelines

- Keep the code as lean as possible
- Minimize the number of files and dependencies
- Follow the principle of progressive enhancement
- Prioritize performance and accessibility
- Use the database utility module for all database operations
- Maintain consistent error handling across the application

## Scraper Interface

The scraper interface can be accessed in two ways:

1. **Standalone Express Server**: 
   - Run `node src/scraper-ui.js` to start the Express server
   - Access the interface at `http://localhost:3003/`
   - This provides direct access to the scraper without needing the full Next.js application

2. **Next.js Application**:
   - Run the Next.js application with `npm run dev`
   - Access the interface at `/twitter-scraper` or `/vote-scraper` in the main application
   - This integrates the scraper with the rest of the application

### Implementation Note

The scraper interfaces are implemented as React components in the Next.js application, which connect to the same backend API endpoints provided by the Express server. The unified scraper service uses the database utility module for all database operations, ensuring consistent data access patterns throughout the application.
