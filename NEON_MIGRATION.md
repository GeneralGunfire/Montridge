# Neon PostgreSQL Migration

## Overview
Successfully migrated Montridge database from local Windows PostgreSQL to Neon cloud database.

## Database Configuration

### Environment Variables
The Flask app now uses the `DATABASE_URL` environment variable to connect to Neon:

```bash
DATABASE_URL=postgresql://neondb_owner:npg_j19OHrdYEDQk@ep-young-cherry-alzxb96l-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### Connection Logic (montridge_flask/db.py)
The `get_connection()` function:
1. **First checks**: `DATABASE_URL` environment variable (for Neon)
2. **Fallback**: Local database credentials via environment variables:
   - `DB_NAME` (default: montridge_db)
   - `DB_USER` (default: postgres)
   - `DB_PASSWORD` (default: empty)
   - `DB_HOST` (default: localhost)
   - `DB_PORT` (default: 5432)

## Database Schema
All tables have been created in Neon with the following structure:

### Tables
- **users** - User accounts with email/password
- **articles** - News articles with metadata (sentiment, signal_score, etc)
- **bookmarks** - User article bookmarks
- **user_preferences** - User topic preferences
- **feed_health** - RSS feed status tracking
- **source_credibility** - Source credibility scores

### Indexes
Optimized indexes created for:
- Article queries (date, score, category, source, sentiment)
- User lookups (email)
- Feed health tracking
- Source credibility lookups

## Testing
Connection verified successfully:
```
✓ Database connection to Neon working
✓ Articles table readable (count: 0)
✓ fetch_articles() function working
```

## Deployment Notes
- **For local development**: Set `DATABASE_URL` in `.env` or use local PostgreSQL with default credentials
- **For production**: Set `DATABASE_URL` environment variable on your hosting platform
- **No hardcoded credentials** in source code - all credentials via environment variables
- **SSL/TLS enabled** - Neon requires `sslmode=require`

## Migration Steps Completed
1. ✓ Created complete database schema (montridge_schema.sql)
2. ✓ Applied schema to Neon
3. ✓ Verified Flask backend connection
4. ✓ Confirmed all queries work with Neon
5. ✓ Updated db.py to use environment variables

## Next Steps
1. Load data from local database to Neon (if needed)
2. Update deployment environment to include DATABASE_URL
3. Test Flask API endpoints against Neon
4. Update monitoring/alerts if using production Neon
