# API Routes

This directory contains the API routes for the Vox Engine application.

## Structure

- `/api/scrapers`: Unified API for all scraper operations (Twitter and Vote)
- `/api/database`: Database management operations
- `/api/services`: Service status checking

## Endpoints

### Scrapers API

The scrapers API provides a unified interface for both Twitter and Vote scrapers.

#### GET /api/scrapers

Query parameters:
- `service`: Required. One of `twitter`, `vote`, or `cache`
- `action`: The specific action to perform (defaults to `stats`)

Twitter actions:
- `stats`: Get Twitter scraper statistics
- `politicians`: Get politicians with Twitter accounts
- `status`: Get Twitter scraper status
- `recent-tweets`: Get recent tweets

Vote actions:
- `stats`: Get Vote scraper statistics
- `sessions`: Get voting sessions
- `status`: Get Vote scraper status
- `config`: Get Vote scraper configuration

Cache actions:
- `stats`: Get cache statistics

#### POST /api/scrapers

Query parameters:
- `service`: Required. One of `twitter`, `vote`, or `cache`
- `action`: Required. The specific action to perform

Twitter actions:
- `fetch`: Fetch new tweets

Vote actions:
- `scrape`: Start vote scraping
- `stop`: Stop vote scraping
- `config`: Update vote scraper configuration
- `politician`: Get politician voting data

Cache actions:
- `clear`: Clear the cache

### Database API

#### POST /api/database

Query parameters:
- `action`: Required. The specific action to perform

Actions:
- `erase`: Erase all data from the database

### Services API

#### GET /api/services

Returns the status of all services required by the application. 