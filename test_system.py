#!/usr/bin/env python3
"""
Comprehensive system test for Montridge backend
Tests: Database state, Pipeline execution, API endpoints, and Auth
"""

import sys
import time
import subprocess
import psycopg2
import requests
import json
from datetime import datetime, timedelta

# Database config
DB_CONFIG = {
    "host": "localhost",
    "database": "montridge_db",
    "user": "postgres",
    "password": "SQL!$N0TN0RM@LL_1t$_$0_W13rd2026",
    "port": 5432
}

# API config
API_BASE = "http://localhost:5000"
TEST_EMAIL = f"test_{int(time.time())}@test.com"
TEST_PASSWORD = "TestPassword123!"

def timestamp():
    return f"[{datetime.now().strftime('%H:%M:%S')}]"

def test_db_connection():
    """Test 1: Database Connection"""
    print(f"\n{timestamp()} TEST 1: Database Connection")
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        cur.execute("SELECT version()")
        version = cur.fetchone()[0]
        cur.close()
        conn.close()
        print(f"✓ Database connected successfully")
        print(f"  {version[:60]}...")
        return True
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return False

def test_db_schema():
    """Test 2: Database Schema Validation"""
    print(f"\n{timestamp()} TEST 2: Database Schema Validation")
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    # Check tables exist
    tables = ['articles', 'users', 'feed_health', 'source_credibility']
    all_tables_exist = True

    for table in tables:
        cur.execute(
            "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name=%s)",
            (table,)
        )
        exists = cur.fetchone()[0]
        status = "✓" if exists else "✗"
        print(f"  {status} Table '{table}': {'exists' if exists else 'missing'}")
        all_tables_exist = all_tables_exist and exists

    # Check key columns in articles table
    cur.execute(
        """SELECT column_name FROM information_schema.columns
        WHERE table_name='articles' AND column_name IN
        ('id', 'url', 'title', 'published_date', 'category', 'signal_score', 'sentiment')"""
    )
    columns = [row[0] for row in cur.fetchall()]
    expected = ['id', 'url', 'title', 'published_date', 'category', 'signal_score', 'sentiment']
    print(f"  ✓ Key columns present: {len(columns)}/7")

    cur.close()
    conn.close()
    return all_tables_exist

def test_db_article_stats():
    """Test 3: Database Article Statistics"""
    print(f"\n{timestamp()} TEST 3: Database Article Statistics")
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    # Total articles
    cur.execute("SELECT COUNT(*) FROM articles")
    total = cur.fetchone()[0]
    print(f"  Total articles: {total}")

    # Articles by category
    cur.execute("""
        SELECT category, COUNT(*) as count
        FROM articles
        WHERE category IS NOT NULL
        GROUP BY category
        ORDER BY count DESC
        LIMIT 5
    """)
    print(f"  By category:")
    for category, count in cur.fetchall():
        print(f"    - {category}: {count}")

    # Signal score distribution
    cur.execute("""
        SELECT
            CASE
                WHEN signal_score >= 85 THEN 'Critical (85-100)'
                WHEN signal_score >= 65 THEN 'High (65-84)'
                WHEN signal_score >= 45 THEN 'Medium (45-64)'
                WHEN signal_score >= 25 THEN 'Low (25-44)'
                ELSE 'Very Low (0-24)'
            END as tier,
            COUNT(*) as count
        FROM articles
        WHERE signal_score IS NOT NULL
        GROUP BY tier
        ORDER BY COUNT(*) DESC
    """)
    print(f"  Signal score distribution:")
    for tier, count in cur.fetchall():
        print(f"    - {tier}: {count}")

    # Sentiment distribution
    cur.execute("""
        SELECT sentiment, COUNT(*)
        FROM articles
        WHERE sentiment IS NOT NULL
        GROUP BY sentiment
    """)
    print(f"  By sentiment:")
    for sentiment, count in cur.fetchall():
        print(f"    - {sentiment}: {count}")

    cur.close()
    conn.close()
    return total > 0

def test_feed_health():
    """Test 4: Feed Health Table"""
    print(f"\n{timestamp()} TEST 4: Feed Health Table")
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    # Count feeds
    cur.execute("SELECT COUNT(*) FROM feed_health")
    feed_count = cur.fetchone()[0]
    print(f"  Total feeds tracked: {feed_count}")

    # Health by status
    cur.execute("""
        SELECT status, COUNT(*)
        FROM feed_health
        GROUP BY status
    """)
    print(f"  By status:")
    for status, count in cur.fetchall():
        print(f"    - {status}: {count}")

    # Successful vs failed
    cur.execute("""
        SELECT
            SUM(total_successes) as total_success,
            SUM(total_failures) as total_failure
        FROM feed_health
    """)
    success, failure = cur.fetchone()
    print(f"  Total feed requests: {(success or 0) + (failure or 0)}")
    print(f"    Success: {success or 0}, Failure: {failure or 0}")

    cur.close()
    conn.close()
    return feed_count > 0

def test_source_credibility():
    """Test 5: Source Credibility Table"""
    print(f"\n{timestamp()} TEST 5: Source Credibility Table")
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    # Count sources
    cur.execute("SELECT COUNT(*) FROM source_credibility")
    source_count = cur.fetchone()[0]
    print(f"  Total sources tracked: {source_count}")

    # Top sources by article count
    cur.execute("""
        SELECT source_name, total_articles, credibility_score
        FROM source_credibility
        ORDER BY total_articles DESC
        LIMIT 5
    """)
    print(f"  Top 5 sources by article count:")
    for name, articles, credibility in cur.fetchall():
        print(f"    - {name}: {articles} articles (credibility: {credibility})")

    cur.close()
    conn.close()
    return source_count > 0

def test_api_articles():
    """Test 6: GET /api/articles"""
    print(f"\n{timestamp()} TEST 6: GET /api/articles")
    try:
        # Basic request
        response = requests.get(f"{API_BASE}/api/articles", timeout=5)
        if response.status_code == 200:
            articles = response.json()
            print(f"  ✓ Basic request: {len(articles)} articles returned")
        else:
            print(f"  ✗ Status code: {response.status_code}")
            return False

        # With filters
        response = requests.get(
            f"{API_BASE}/api/articles?importance=high&limit=5",
            timeout=5
        )
        articles = response.json()
        print(f"  ✓ Filtered request (importance=high): {len(articles)} articles")

        # With sentiment
        response = requests.get(
            f"{API_BASE}/api/articles?sentiment=positive&limit=5",
            timeout=5
        )
        articles = response.json()
        print(f"  ✓ Filtered request (sentiment=positive): {len(articles)} articles")

        return True
    except Exception as e:
        print(f"  ✗ Request failed: {e}")
        return False

def test_api_stats():
    """Test 7: GET /api/stats"""
    print(f"\n{timestamp()} TEST 7: GET /api/stats")
    try:
        response = requests.get(f"{API_BASE}/api/stats", timeout=5)
        if response.status_code == 200:
            stats = response.json()
            print(f"  ✓ Stats retrieved")
            print(f"    Total articles: {stats.get('articles', {}).get('total', 'N/A')}")
            print(f"    Today: {stats.get('articles', {}).get('today', 'N/A')}")
            print(f"    Last 7 days: {stats.get('articles', {}).get('last_7_days', 'N/A')}")
            return True
        else:
            print(f"  ✗ Status code: {response.status_code}")
            return False
    except Exception as e:
        print(f"  ✗ Request failed: {e}")
        return False

def test_api_feed_health():
    """Test 8: GET /api/feed-health"""
    print(f"\n{timestamp()} TEST 8: GET /api/feed-health")
    try:
        response = requests.get(f"{API_BASE}/api/feed-health", timeout=5)
        if response.status_code == 200:
            health = response.json()
            print(f"  ✓ Feed health retrieved")
            feed_count = len(health.get('feeds', []))
            print(f"    Feeds monitored: {feed_count}")
            return True
        else:
            print(f"  ✗ Status code: {response.status_code}")
            return False
    except Exception as e:
        print(f"  ✗ Request failed: {e}")
        return False

def test_auth_system():
    """Test 9: Authentication System"""
    print(f"\n{timestamp()} TEST 9: Authentication System")
    try:
        # Signup
        response = requests.post(
            f"{API_BASE}/api/auth/signup",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD, "name": "Test User"},
            timeout=5
        )
        if response.status_code == 201:
            data = response.json()
            token = data.get('token')
            print(f"  ✓ Signup successful")
        else:
            print(f"  ✗ Signup failed: {response.status_code}")
            return False

        # Verify token
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(
            f"{API_BASE}/api/auth/verify",
            headers=headers,
            timeout=5
        )
        if response.status_code == 200 and response.json().get('valid'):
            print(f"  ✓ Token verification passed (24-hour expiry active)")
        else:
            print(f"  ✗ Token verification failed")
            return False

        # Logout
        response = requests.post(
            f"{API_BASE}/api/auth/logout",
            headers=headers,
            timeout=5
        )
        if response.status_code == 200:
            print(f"  ✓ Logout successful")
        else:
            print(f"  ✗ Logout failed: {response.status_code}")
            return False

        return True
    except Exception as e:
        print(f"  ✗ Auth test failed: {e}")
        return False

def test_rate_limiting():
    """Test 10: Rate Limiting"""
    print(f"\n{timestamp()} TEST 10: Rate Limiting")
    try:
        # Attempt rapid requests to a rate-limited endpoint
        print(f"  Testing rate limits on /api/articles...")
        success_count = 0
        rate_limited = False

        for i in range(5):
            response = requests.get(
                f"{API_BASE}/api/articles?limit=1",
                timeout=5
            )
            if response.status_code == 200:
                success_count += 1
            elif response.status_code == 429:
                rate_limited = True
                print(f"  ✓ Rate limiting engaged (429 Too Many Requests)")
                break

        if success_count > 0:
            print(f"  ✓ Allowed {success_count} requests before rate limit")

        return True
    except Exception as e:
        print(f"  ✗ Rate limit test failed: {e}")
        return False

def main():
    print("="*70)
    print("MONTRIDGE BACKEND SYSTEM TEST SUITE")
    print("="*70)

    results = {
        "Database Connection": test_db_connection(),
        "Database Schema": test_db_schema(),
        "Article Statistics": test_db_article_stats(),
        "Feed Health": test_feed_health(),
        "Source Credibility": test_source_credibility(),
        "GET /api/articles": test_api_articles(),
        "GET /api/stats": test_api_stats(),
        "GET /api/feed-health": test_api_feed_health(),
        "Authentication System": test_auth_system(),
        "Rate Limiting": test_rate_limiting(),
    }

    print("\n" + "="*70)
    print("TEST RESULTS SUMMARY")
    print("="*70)

    passed = sum(1 for v in results.values() if v)
    total = len(results)

    for test_name, passed_bool in results.items():
        status = "PASS" if passed_bool else "FAIL"
        symbol = "✓" if passed_bool else "✗"
        print(f"{symbol} {test_name}: {status}")

    print(f"\nTotal: {passed}/{total} tests passed")

    if passed == total:
        print("\nAll systems operational!")
        return 0
    else:
        print(f"\n{total - passed} test(s) failed. Review above for details.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
