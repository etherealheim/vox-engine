# Changelog

## [0.2.0] - 2023-07-15

### Added
- Unified Scraper Service that combines Twitter and Vote scraper functionality
- New shared UI components for displaying scraper status and data statistics
- Comprehensive documentation for service consolidation in `docs/service-consolidation.md`

### Changed
- Consolidated Twitter and Vote scraper services into a single service
- Updated API routes to use the unified scraper service
- Simplified package.json scripts for better developer experience
- Updated service launcher to start the unified service
- Improved main dashboard UI with cleaner layout and better organization
- Updated README.md to reflect the consolidated services

### Removed
- Separate Twitter and Vote scraper services
- Redundant API routes for individual scrapers
- Duplicate code across scraper services

## [0.1.0] - 2023-06-30

### Added
- Initial release of Vox Engine
- Twitter scraping functionality
- Vote scraping functionality
- Next.js frontend with dashboard
- Database integration with Drizzle ORM
- Basic documentation 