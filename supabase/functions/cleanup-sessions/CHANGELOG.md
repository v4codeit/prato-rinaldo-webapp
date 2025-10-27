# Changelog

All notable changes to the cleanup-sessions Edge Function will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-26

### Added
- Initial implementation of cleanup-sessions Edge Function
- Auth sessions cleanup (log inactive users for manual review)
- Temporary files cleanup across storage buckets
- Event RSVPs cleanup for expired events
- Moderation queue cleanup for old rejected items
- Dry run mode for safe testing
- Force flag for production execution
- Batch processing to prevent timeouts
- Comprehensive error handling and logging
- Safety checks to prevent accidental mass deletion
- Detailed statistics in response
- CORS support for web requests
- Configuration via environment variables
- Cron scheduling support (daily at 2 AM UTC)

### Documentation
- README.md with comprehensive usage guide
- ARCHITECTURE.md with technical details
- QUICK_REFERENCE.md for quick lookups
- EXAMPLES.md with API response examples
- .env.example for environment setup
- deploy.sh script for easy deployment
- test.ts for local testing
- .github-workflow-example.yml for CI/CD

### Configuration
- Default retention periods:
  - Auth sessions: 30 days of inactivity
  - Temp files: 7 days
  - Event RSVPs: 30 days after event
  - Moderation queue: 90 days (rejected items only)
- Batch size: 100 items per operation
- Default schedule: Daily at 2 AM UTC

### Security
- Service role authentication
- No JWT verification (system task)
- Safety parameters (dry_run, force)
- Error isolation (continue on failure)

## [Unreleased]

### Planned Features
- Configurable retention periods via database
- Per-tenant customization
- Email reports to admins
- Selective cleanup (run specific operations only)
- Soft delete with archive before removal
- Metrics export to analytics platform
- Dashboard integration
- Automated alerts on failures

### Ideas
- Cleanup preview endpoint
- Scheduling via admin dashboard
- Manual trigger from UI
- Historical cleanup statistics
- Recovery mechanism for accidentally deleted data
- Compression of old data instead of deletion
- Integration with backup system
