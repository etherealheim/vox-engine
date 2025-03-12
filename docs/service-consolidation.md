# Service Consolidation Documentation

## Overview

This document outlines the consolidation of the Twitter and Vote scraper services into a unified Scraper Service in the Vox Engine application. The consolidation was performed to simplify the architecture, reduce code duplication, and improve maintainability.

## Changes Made

### 1. Unified Scraper Service

The previously separate Twitter and Vote scraper services have been consolidated into a single Unified Scraper Service:

- **Previous Structure**:
  - `src/twitter-ui.js`: Express server for Twitter scraper UI
  - `src/vote-ui.js`: Express server for Vote scraper UI
  - Each service ran on a different port (3003 for Twitter, 3002 for Vote)

- **New Structure**:
  - `src/scraper-ui.js`: Unified Express server for both Twitter and Vote scraper UIs
  - Single service running on port 3003
  - Endpoints organized by service type (`/twitter/*` and `/vote/*`)

### 2. API Routes

The API routes have been updated to reflect the consolidated service:

- **Previous Structure**:
  - `/app/api/twitter/route.ts`: API route for Twitter data
  - `/app/api/twitter-scraper/route.ts`: API route for Twitter scraper
  - `/app/api/vote-scraper/route.ts`: API route for Vote scraper

- **New Structure**:
  - `/app/api/scrapers/route.ts`: Unified API route for all scraper operations
  - `/app/api/scrapers/twitter/route.ts`: Twitter-specific API route (forwards to unified service)
  - `/app/api/scrapers/vote/route.ts`: Vote-specific API route (forwards to unified service)

### 3. Package.json Scripts

The npm scripts have been updated to reflect the consolidated service:

- **Previous Scripts**:
  ```json
  "dev:services": "npx concurrently \"npm run dev:twitter\" \"npm run dev:votes\" \"npm run dev:db\"",
  "dev:twitter": "node src/twitter-ui.js",
  "dev:votes": "node src/vote-ui.js",
  ```

- **New Scripts**:
  ```json
  "dev:services": "npx concurrently \"npm run dev:scraper\" \"npm run dev:db\"",
  "dev:scraper": "node src/scraper-ui.js",
  ```

### 4. Service Launcher

The service launcher script has been updated to start the unified service:

- **Previous Structure**:
  ```javascript
  const services = [
    {
      name: "Twitter Scraper Service",
      command: "node",
      args: ["src/twitter-ui.js"],
      color: colors.blue,
      port: 3003,
    },
    {
      name: "Vote Scraper Service",
      command: "node",
      args: ["src/vote-ui.js"],
      color: colors.green,
      port: 3002,
    },
    // ...
  ];
  ```

- **New Structure**:
  ```javascript
  const services = [
    {
      name: "Unified Scraper Service",
      command: "node",
      args: ["src/scraper-ui.js"],
      color: colors.blue,
      port: 3003,
    },
    // ...
  ];
  ```

### 5. UI Components

Shared UI components have been created to reduce duplication:

- **New Components**:
  - `/app/components/shared/scraper-status.tsx`: Reusable component for displaying scraper status
  - `/app/components/shared/data-stats.tsx`: Reusable component for displaying data statistics

## Benefits

1. **Simplified Architecture**: Reduced the number of services from 3 to 2 (Next.js and Unified Scraper)
2. **Reduced Code Duplication**: Consolidated similar code in both scrapers
3. **Improved Maintainability**: Changes to scraper functionality only need to be made in one place
4. **Consistent API**: Unified API structure for all scraper operations
5. **Resource Efficiency**: Fewer processes running, reducing memory usage

## Migration Guide

If you were using the previous separate services, here's how to migrate to the unified service:

### API Endpoints

- Replace `/api/twitter?action=stats` with `/api/scrapers?service=twitter&action=stats`
- Replace `/api/vote-scraper?endpoint=/stats` with `/api/scrapers?service=vote&action=stats`

### Starting Services

- Replace `node src/twitter-ui.js` with `node src/scraper-ui.js`
- Replace `node src/vote-ui.js` with `node src/scraper-ui.js`

### URLs

- Twitter scraper UI is still available at `/twitter-scraper` in the Next.js app
- Vote scraper UI is still available at `/vote-scraper` in the Next.js app
- Standalone Twitter scraper is now at `http://localhost:3003/twitter`
- Standalone Vote scraper is now at `http://localhost:3003/vote` 