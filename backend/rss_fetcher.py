import sys
sys.stdout.reconfigure(encoding='utf-8')

import feedparser
import psycopg2
from psycopg2.extras import Json
from datetime import datetime
import time
import logging
import requests
from typing import Dict, List, Tuple

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# -------------------------------
# PostgreSQL connection settings
# -------------------------------
DB_HOST = "localhost"
DB_NAME = "montridge_db"
DB_USER = "postgres"
DB_PORT = 5432

# Feed timeout in seconds
FEED_TIMEOUT = 10
MAX_RETRIES = 2  # Try once, then retry once on failure
RETRY_DELAY = 5  # 5-second delay before retry

# -------------------------------
# RSS feeds organized by category
# -------------------------------
RSS_FEEDS_BY_CATEGORY = {
    "Politics & World News": [
        "http://feeds.bbci.co.uk/news/rss.xml",
        "https://www.aljazeera.com/xml/rss/all.xml",
        "https://www.theguardian.com/world/rss",
        "https://feeds.npr.org/1001/rss.xml",
        "https://www.bbc.com/news/rss.xml",
        "https://www.bbc.com/news/uk/rss.xml",
        "https://www.bbc.com/news/world/rss.xml",
    ],
    "Business & Markets": [
        "https://www.ft.com/?format=rss",
        "https://feeds.bloomberg.com/markets/news.rss",
        "https://feeds.marketwatch.com/marketwatch/topstories/",
        "https://www.bbc.com/news/business/rss.xml",
        "https://techcrunch.com/feed/",
        "https://www.bbc.com/news/technology/rss.xml",
    ],
    "Technology": [
        "https://techcrunch.com/feed/",
        "https://feeds.arstechnica.com/arstechnica/index",
        "https://news.ycombinator.com/rss",
        "https://slashdot.org/slashdot.rss",
        "https://www.engadget.com/rss.xml",
        "https://mashable.com/feeds/rss/all",
    ],
    "Science & Health": [
        "https://feeds.nature.com/nature/rss/current",
        "https://www.sciencealert.com/rss",
        "https://www.bbc.com/news/science_and_environment/rss.xml",
        "https://feeds.arstechnica.com/arstechnica/science",
        "https://www.bbc.com/news/health/rss.xml",
        "https://www.bbc.com/news/magazine/rss.xml",
    ],
}

# Flatten feeds with category tracking
FEEDS_WITH_CATEGORY = []
for category, feeds in RSS_FEEDS_BY_CATEGORY.items():
    for feed_url in feeds:
        FEEDS_WITH_CATEGORY.append((feed_url, category))

# Backward compatibility - flat list for reference
RSS_FEEDS = [feed_url for feed_url, _ in FEEDS_WITH_CATEGORY]

# -------------------------------
# Function to safely parse published date
# -------------------------------
def parse_date(published_str):
    if not published_str:
        return None
    formats = [
        "%a, %d %b %Y %H:%M:%S %Z",  # common RSS format
        "%Y-%m-%dT%H:%M:%SZ",        # ISO format
        "%Y-%m-%d %H:%M:%S",         # Alternative format
    ]
    for fmt in formats:
        try:
            return datetime.strptime(published_str, fmt)
        except ValueError:
            continue
    return None  # fallback if no format matches

# -------------------------------
# Log feed health
# -------------------------------
def log_feed_health(feed_url, category, status, articles_count=0, error_msg=None):
    """Log feed health information to feed_health table"""
    try:
        conn = psycopg2.connect(
            host=DB_HOST, database=DB_NAME, user=DB_USER,
            password=DB_PASS, port=DB_PORT
        )
        cur = conn.cursor()

        # Check if this feed already exists
        cur.execute("SELECT id FROM feed_health WHERE feed_url = %s", (feed_url,))
        existing = cur.fetchone()

        if existing:
            # Update existing record
            if status == "healthy":
                cur.execute(
                    """UPDATE feed_health
                    SET last_success = NOW(),
                        last_checked = NOW(),
                        consecutive_failures = 0,
                        total_successes = total_successes + 1,
                        articles_last_run = %s,
                        status = %s
                    WHERE feed_url = %s""",
                    (articles_count, status, feed_url)
                )
            else:
                cur.execute(
                    """UPDATE feed_health
                    SET last_checked = NOW(),
                        consecutive_failures = consecutive_failures + 1,
                        total_failures = total_failures + 1,
                        status = %s
                    WHERE feed_url = %s""",
                    (status, feed_url)
                )
        else:
            # Insert new record
            last_success = "NOW()" if status == "healthy" else "NULL"
            cur.execute(
                f"""INSERT INTO feed_health
                (feed_url, feed_name, category, status, last_checked, last_success,
                 consecutive_failures, total_successes, total_failures, articles_last_run)
                VALUES (%s, %s, %s, %s, NOW(), {last_success}, %s, %s, %s, %s)""",
                (
                    feed_url, feed_url.split('/')[-1], category, status,
                    0 if status == "healthy" else 1,
                    1 if status == "healthy" else 0,
                    0 if status == "healthy" else 1,
                    articles_count if status == "healthy" else 0
                )
            )

        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        logger.error(f"Error logging feed health for {feed_url}: {e}")

# -------------------------------
# Update source credibility
# -------------------------------
def update_source_credibility(source_name, articles_count):
    """Increment total_articles count for a source"""
    try:
        conn = psycopg2.connect(
            host=DB_HOST, database=DB_NAME, user=DB_USER,
            password=DB_PASS, port=DB_PORT
        )
        cur = conn.cursor()

        cur.execute(
            """UPDATE source_credibility
            SET total_articles = total_articles + %s
            WHERE LOWER(source_name) = LOWER(%s)""",
            (articles_count, source_name)
        )
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        logger.error(f"Error updating source credibility for {source_name}: {e}")

# -------------------------------
# Store articles in PostgreSQL
# -------------------------------
def store_articles():
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASS,
            port=DB_PORT
        )
    except psycopg2.OperationalError as e:
        logger.error(f"Error connecting to PostgreSQL: {e}")
        print(f"Database connection failed: {e}")
        return 0

    cur = conn.cursor()
    new_count = 0
    total_attempted = 0
    failed_feeds = []
    successful_feeds = []

    for feed_url, category in FEEDS_WITH_CATEGORY:
        total_attempted += 1
        feed_success = False
        error_msg = None

        for attempt in range(MAX_RETRIES):
            try:
                logger.info(f"Fetching feed: {feed_url} (Category: {category}) - Attempt {attempt + 1}")
                print(f"Fetching {category}: {feed_url[:50]}... ", end="", flush=True)

                # Parse feed with timeout using requests
                try:
                    response = requests.get(feed_url, timeout=FEED_TIMEOUT)
                    feed = feedparser.parse(response.content)
                except requests.Timeout:
                    error_msg = "Feed timeout (10s exceeded)"
                    logger.warning(f"{feed_url}: {error_msg}")
                    print(f"Timeout", end="")
                    if attempt < MAX_RETRIES - 1:
                        print(f" [Retrying in {RETRY_DELAY}s...]")
                        time.sleep(RETRY_DELAY)
                    continue
                except requests.RequestException as e:
                    error_msg = f"HTTP error: {str(e)}"
                    logger.warning(f"{feed_url}: {error_msg}")
                    print(f"Network error", end="")
                    if attempt < MAX_RETRIES - 1:
                        print(f" [Retrying in {RETRY_DELAY}s...]")
                        time.sleep(RETRY_DELAY)
                    continue

                if feed.bozo and feed.bozo_exception:
                    error_msg = f"Feed parsing error: {feed.bozo_exception}"
                    logger.warning(f"{feed_url}: {error_msg}")
                    print(f"Parse error", end="")
                    if attempt < MAX_RETRIES - 1:
                        print(f" [Retrying in {RETRY_DELAY}s...]")
                        time.sleep(RETRY_DELAY)
                    continue

                if not feed.entries:
                    error_msg = "No entries found"
                    logger.warning(f"{feed_url}: {error_msg}")
                    print(f"No entries", end="")
                    if attempt < MAX_RETRIES - 1:
                        print(f" [Retrying in {RETRY_DELAY}s...]")
                        time.sleep(RETRY_DELAY)
                    continue

                # Feed parsing succeeded
                source_name = feed.feed.get('title', 'Unknown')
                feed_article_count = 0

                for entry in feed.entries[:15]:  # increased from 10 to 15
                    url = entry.get('link', '')
                    if not url:
                        continue

                    title = entry.get('title', 'No title')
                    published_date = parse_date(entry.get('published', None))

                    # Check for duplicates
                    cur.execute("SELECT id FROM articles WHERE url = %s;", (url,))
                    if cur.fetchone():
                        continue  # skip already stored articles

                    # Insert article with category
                    try:
                        cur.execute(
                            """
                            INSERT INTO articles (url, source, title, published_date, category, raw_data)
                            VALUES (%s, %s, %s, %s, %s, %s)
                            """,
                            (
                                url,
                                source_name,
                                title,
                                published_date,
                                category,  # Write category directly to column
                                Json({**entry, "rss_category": category})
                            )
                        )
                        new_count += 1
                        feed_article_count += 1
                    except Exception as e:
                        logger.error(f"Error inserting article from {feed_url}: {e}")
                        continue

                # Commit and track success
                conn.commit()

                # Update source credibility
                if feed_article_count > 0:
                    update_source_credibility(source_name, feed_article_count)

                logger.info(f"Success {feed_url}: Inserted {feed_article_count} articles (Category: {category})")
                print(f"OK ({feed_article_count} articles)")
                successful_feeds.append((feed_url, category, feed_article_count))
                feed_success = True

                # Log to feed_health
                log_feed_health(feed_url, category, "healthy", feed_article_count)
                break  # Success, exit retry loop

            except Exception as e:
                error_msg = str(e)
                logger.error(f"Error processing feed {feed_url}: {error_msg}")
                print(f"Error: {error_msg}", end="")
                if attempt < MAX_RETRIES - 1:
                    print(f" [Retrying in {RETRY_DELAY}s...]")
                    time.sleep(RETRY_DELAY)
                continue

        # Log failure if all retries exhausted
        if not feed_success:
            failed_feeds.append((feed_url, category, error_msg or "Unknown error"))
            log_feed_health(feed_url, category, "failing", 0, error_msg)
            print("")  # Newline after failure

    cur.close()
    conn.close()

    # Print summary
    print("\n" + "="*70)
    print(f"Stored {new_count} new articles from {len(successful_feeds)} successful feeds")
    print(f"{len(failed_feeds)} feeds failed")
    print("="*70)

    if failed_feeds:
        print("\nFAILED FEEDS:")
        for url, category, error in failed_feeds:
            print(f"  [{category}] {url[:60]}")
            print(f"    Error: {error}")

    logger.info(f"RSS fetch complete: {new_count} new articles, {len(successful_feeds)} successful, {len(failed_feeds)} failed")
    return new_count

# -------------------------------
# Main execution
# -------------------------------
def main():
    start_time = time.time()
    store_articles()
    elapsed = round(time.time() - start_time, 2)
    print(f"RSS fetch complete in {elapsed} seconds")
    logger.info(f"RSS fetch complete in {elapsed} seconds")


if __name__ == "__main__":
    main()
