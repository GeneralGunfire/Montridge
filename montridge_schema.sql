-- Montridge Database Schema
-- This schema is used for both local PostgreSQL and Neon cloud database

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create articles table
CREATE TABLE IF NOT EXISTS articles (
    id SERIAL PRIMARY KEY,
    url VARCHAR(2048) UNIQUE,
    title VARCHAR(500),
    summary TEXT,
    content TEXT,
    published_date TIMESTAMP,
    fetched_date TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP,
    source VARCHAR(255),
    category VARCHAR(100),
    categories TEXT[] DEFAULT '{}',
    sentiment VARCHAR(50),
    signal_score FLOAT DEFAULT 0,
    bias_rating FLOAT,
    credibility_score FLOAT,
    entities JSONB DEFAULT '{}',
    key_facts TEXT[] DEFAULT '{}',
    UNIQUE(url)
);

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, article_id)
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    topics TEXT[] DEFAULT '{}',
    expertise_level VARCHAR(50) DEFAULT 'Standard',
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create feed_health table
CREATE TABLE IF NOT EXISTS feed_health (
    id SERIAL PRIMARY KEY,
    feed_name VARCHAR(255) NOT NULL,
    last_success TIMESTAMP,
    last_checked TIMESTAMP,
    consecutive_failures INTEGER DEFAULT 0
);

-- Create source_credibility table
CREATE TABLE IF NOT EXISTS source_credibility (
    id SERIAL PRIMARY KEY,
    source VARCHAR(255) UNIQUE NOT NULL,
    credibility_score FLOAT DEFAULT 0.5,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_articles_processed_at ON articles(processed_at);
CREATE INDEX IF NOT EXISTS idx_articles_published_date ON articles(published_date DESC);
CREATE INDEX IF NOT EXISTS idx_articles_signal_score ON articles(signal_score DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(LOWER(category));
CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(LOWER(source));
CREATE INDEX IF NOT EXISTS idx_articles_sentiment ON articles(LOWER(sentiment));
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_article_id ON bookmarks(article_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_feed_health_feed_name ON feed_health(feed_name);
CREATE INDEX IF NOT EXISTS idx_source_credibility_source ON source_credibility(source);
