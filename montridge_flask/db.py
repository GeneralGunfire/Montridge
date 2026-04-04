import psycopg2
import psycopg2.extras
from datetime import datetime, timedelta
import json
from difflib import SequenceMatcher


def _interleave_by_topic(rows, max_per_topic=3, limit=20):
    """Interleave articles so no single category dominates. Round-robin across categories."""
    by_cat = {}
    for row in rows:
        cat = row.get('category') or 'General'
        if cat not in by_cat:
            by_cat[cat] = []
        if len(by_cat[cat]) < max_per_topic:
            by_cat[cat].append(row)
    result = []
    cats = list(by_cat.keys())
    while len(result) < limit and any(by_cat[c] for c in cats):
        for cat in cats:
            if by_cat[cat] and len(result) < limit:
                result.append(by_cat[cat].pop(0))
    return result

def get_connection():
    import os
    return psycopg2.connect(
        dbname=os.environ.get('DB_NAME', 'montridge_db'),
        user=os.environ.get('DB_USER', 'postgres'),
        password=os.environ.get('DB_PASSWORD', ''),
        host=os.environ.get('DB_HOST', 'localhost'),
        port=int(os.environ.get('DB_PORT', '5432'))
    )

def fetch_articles(category=None, search=None, importance=None, sentiment=None, limit=20, offset=0, days=7, source=None, min_score=None):
    """Fetch articles with flexible filtering and topic deduplication."""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    query = """
        SELECT *
        FROM articles
        WHERE processed_at IS NOT NULL
          AND published_date >= NOW() - INTERVAL '%d days'
    """ % days

    params = []
    conditions = []

    # Category filter
    if category:
        conditions.append("LOWER(category) = LOWER(%s)")
        params.append(category)

    # Search
    if search:
        conditions.append("(title ILIKE %s OR summary ILIKE %s)")
        params.extend([f"%{search}%", f"%{search}%"])

    # Importance based on signal_score
    if importance:
        if importance.lower() == 'high':
            conditions.append("signal_score >= 75")
        elif importance.lower() == 'medium':
            conditions.append("signal_score BETWEEN 45 AND 74")
        elif importance.lower() == 'low':
            conditions.append("signal_score < 45")

    # Minimum signal score (e.g. for breaking news)
    if min_score is not None:
        conditions.append("signal_score >= %s")
        params.append(min_score)

    # Sentiment filter
    if sentiment:
        conditions.append("LOWER(sentiment) = LOWER(%s)")
        params.append(sentiment)

    # Source filter
    if source:
        conditions.append("source ILIKE %s")
        params.append(f"%{source}%")

    if conditions:
        query += " AND " + " AND ".join(conditions)

    query += """
        ORDER BY signal_score DESC NULLS LAST,
                 published_date DESC
        LIMIT %s OFFSET %s
    """
    # Fetch extra rows for topic dedup when no specific category filter is applied
    fetch_limit = (limit * 4) if not category else limit
    fetch_limit = min(fetch_limit, 400)
    params.extend([fetch_limit, offset if offset else 0])

    cur.execute(query, params)
    rows = cur.fetchall()

    # Sanitize each row
    for row in rows:
        row["signal_score"] = row["signal_score"] if row["signal_score"] is not None else 0
        row["categories"] = row["categories"] or []
        row["key_facts"] = row["key_facts"] or []
        row["entities"] = row["entities"] or {}

    # Apply topic deduplication when not filtering by a specific category
    if not category and len(rows) > limit:
        rows = _interleave_by_topic(rows, max_per_topic=3, limit=limit)

    cur.close()
    conn.close()

    return rows

def fetch_article_by_id(article_id):
    """Fetch single article by ID"""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cur.execute(
        """
        SELECT *
        FROM articles
        WHERE id = %s
          AND processed_at IS NOT NULL
        """,
        (article_id,)
    )

    row = cur.fetchone()

    if row:
        # Sanitize nullable fields
        row["signal_score"] = row["signal_score"] if row["signal_score"] is not None else 0
        row["categories"] = row["categories"] or []
        row["key_facts"] = row["key_facts"] or []
        row["entities"] = row["entities"] or {}

    cur.close()
    conn.close()

    return row

def fetch_trending_topics(hours=24):
    """Extract trending topics/keywords from recent articles (last 24 hours)."""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cur.execute("""
        SELECT categories, entities
        FROM articles
        WHERE processed_at IS NOT NULL
          AND published_date >= NOW() - INTERVAL '%d hours'
    """ % hours)

    rows = cur.fetchall()
    cur.close()
    conn.close()

    # Noise words to exclude as standalone topics (case-insensitive)
    NOISE_WORDS = {"us", "uk", "un", "eu", "gp", "f1", "ai"}

    # Friendly capitalization overrides
    CAPITALIZATION_MAP = {
        "tech": "Technology",
        "politics": "Politics",
        "business": "Business",
        "science": "Science",
        "health": "Health",
        "military": "Military",
        "international": "International",
        "conflicts": "Conflicts",
        "us politics": "US Politics",
        "uk politics": "UK Politics",
        "middle east": "Middle East",
        "north korea": "North Korea",
        "south korea": "South Korea",
        "north america": "North America",
        "south america": "South America",
        "southeast asia": "Southeast Asia",
        "artificial intelligence": "Artificial Intelligence",
        "climate change": "Climate Change",
    }

    def normalize_topic(raw: str) -> str | None:
        stripped = str(raw).strip()
        if len(stripped) <= 2:
            return None
        lower = stripped.lower()
        if lower in NOISE_WORDS:
            return None
        if lower in CAPITALIZATION_MAP:
            return CAPITALIZATION_MAP[lower]
        return stripped.title()

    topic_counts = {}

    # Extract from categories
    for row in rows:
        categories = row["categories"] or []
        for cat in categories:
            norm = normalize_topic(cat)
            if norm:
                topic_counts[norm] = topic_counts.get(norm, 0) + 1

    # Extract from entities
    for row in rows:
        entities = row["entities"] or {}
        for entity_type in ['people', 'organizations', 'places']:
            for entity in entities.get(entity_type, []):
                norm = normalize_topic(entity)
                if norm:
                    topic_counts[norm] = topic_counts.get(norm, 0) + 1

    # Minimum 3 articles to qualify; sort descending and return top 10
    qualified = {name: count for name, count in topic_counts.items() if count >= 3}
    sorted_topics = sorted(qualified.items(), key=lambda x: x[1], reverse=True)[:10]

    topics = [
        {
            "name": name,
            "count": count,
            "trending": True
        }
        for name, count in sorted_topics
    ]

    return topics

def fetch_daily_briefs():
    """Query top articles (signal_score >= 60) by category. Falls back to yesterday if today has none.
    Returns (briefs_list, is_yesterday)."""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    categories = ['Politics', 'Business', 'Technology', 'Science']

    def _query_briefs(date_condition):
        result = []
        for cat in categories:
            cur.execute(f"""
                SELECT id, title, source, summary, why_it_matters, signal_score, published_date
                FROM articles
                WHERE processed_at IS NOT NULL
                  AND {date_condition}
                  AND signal_score >= 60
                  AND (LOWER(category) = LOWER(%s) OR %s = ANY(categories))
                ORDER BY signal_score DESC NULLS LAST
                LIMIT 3
            """, (cat, cat))
            articles = cur.fetchall()
            if articles:
                result.append({
                    "category": cat,
                    "title": f"Today in {cat}",
                    "summary": (articles[0].get("why_it_matters") or articles[0].get("summary") or articles[0].get("title") or "Latest updates"),
                    "why_it_matters": (articles[0].get("why_it_matters") or articles[0].get("summary") or articles[0].get("title") or ""),
                    "article_count": len(articles),
                    "top_articles": [
                        {
                            "id": a["id"],
                            "title": a["title"],
                            "source": a["source"],
                            "signal_score": a["signal_score"] if a["signal_score"] else 0
                        }
                        for a in articles
                    ]
                })
        return result

    # Try today first
    briefs = _query_briefs("published_date >= NOW()::date")
    is_yesterday = False

    # If nothing for today, fall back to yesterday
    if not briefs:
        is_yesterday = True
        briefs = _query_briefs(
            "published_date >= NOW()::date - INTERVAL '1 day' AND published_date < NOW()::date"
        )

    cur.close()
    conn.close()

    return briefs, is_yesterday

def fetch_breaking_news():
    """Query articles with high signal score"""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cur.execute("""
        SELECT id, title, summary, source, signal_score, published_date, category
        FROM articles
        WHERE processed_at IS NOT NULL
          AND signal_score >= 75
        ORDER BY signal_score DESC, published_date DESC
        LIMIT 3
    """)

    rows = cur.fetchall()
    cur.close()
    conn.close()

    breaking = []
    for row in rows:
        breaking.append({
            "id": row["id"],
            "title": row["title"],
            "summary": row["summary"] or "",
            "source": row["source"] or "Unknown",
            "signal_score": row["signal_score"] if row["signal_score"] is not None else 0,
            "category": row["category"] or "General",
            "published_at": row["published_date"].isoformat() if row["published_date"] else None
        })

    return breaking

def fetch_stats():
    """Get comprehensive statistics about articles"""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # Total articles
    cur.execute("SELECT COUNT(*) as count FROM articles WHERE processed_at IS NOT NULL;")
    total = cur.fetchone()["count"]

    # Today's articles
    cur.execute("""
        SELECT COUNT(*) as count FROM articles
        WHERE processed_at IS NOT NULL AND published_date >= NOW()::date;
    """)
    today = cur.fetchone()["count"]

    # Last 7 days
    cur.execute("""
        SELECT COUNT(*) as count FROM articles
        WHERE processed_at IS NOT NULL AND published_date >= NOW() - INTERVAL '7 days';
    """)
    week = cur.fetchone()["count"]

    # By category
    cur.execute("""
        SELECT category, COUNT(*) as count FROM articles
        WHERE processed_at IS NOT NULL GROUP BY category ORDER BY count DESC;
    """)
    by_category = {row["category"]: row["count"] for row in cur.fetchall()}

    # By sentiment
    cur.execute("""
        SELECT sentiment, COUNT(*) as count FROM articles
        WHERE processed_at IS NOT NULL GROUP BY sentiment;
    """)
    by_sentiment = {row["sentiment"] or "unknown": row["count"] for row in cur.fetchall()}

    # Average signal score
    cur.execute("""
        SELECT AVG(signal_score) as avg_score FROM articles
        WHERE processed_at IS NOT NULL AND signal_score IS NOT NULL;
    """)
    avg_signal = cur.fetchone()["avg_score"] or 0

    # High importance today
    cur.execute("""
        SELECT COUNT(*) as count FROM articles
        WHERE processed_at IS NOT NULL AND published_date >= NOW()::date AND signal_score >= 75;
    """)
    high_today = cur.fetchone()["count"]

    # Top sources
    cur.execute("""
        SELECT source, COUNT(*) as count, AVG(signal_score) as avg_signal
        FROM articles WHERE processed_at IS NOT NULL
        GROUP BY source ORDER BY count DESC LIMIT 10;
    """)
    top_sources = [
        {
            "name": row["source"],
            "article_count": row["count"],
            "avg_signal_score": float(row["avg_signal"]) if row["avg_signal"] else 0
        }
        for row in cur.fetchall()
    ]

    cur.close()
    conn.close()

    return {
        "articles": {
            "total": total,
            "today": today,
            "last_7_days": week,
            "by_category": by_category,
            "by_sentiment": by_sentiment,
            "avg_signal_score": float(avg_signal),
            "high_importance_today": high_today
        },
        "sources": {
            "total_active": len(top_sources),
            "top_sources": top_sources
        }
    }

def fetch_feed_health():
    """Get feed health status for all 25 sources"""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cur.execute("""
        SELECT
            feed_name, category, status, last_success, last_checked,
            consecutive_failures, total_successes, total_failures, articles_last_run
        FROM feed_health
        ORDER BY feed_name;
    """)

    feeds = []
    for row in cur.fetchall():
        feeds.append({
            "name": row["feed_name"],
            "category": row["category"],
            "status": row["status"] or "unknown",
            "last_success": row["last_success"].isoformat() if row["last_success"] else None,
            "last_checked": row["last_checked"].isoformat() if row["last_checked"] else None,
            "consecutive_failures": row["consecutive_failures"] or 0,
            "articles_last_run": row["articles_last_run"] or 0,
            "total_successes": row["total_successes"] or 0,
            "total_failures": row["total_failures"] or 0
        })

    # Summary stats
    cur.execute("""
        SELECT
            COALESCE(status, 'unknown') as status,
            COUNT(*) as count
        FROM feed_health
        GROUP BY status;
    """)

    summary = {"healthy": 0, "warning": 0, "failing": 0, "unknown": 0, "total": len(feeds)}
    for row in cur.fetchall():
        if row["status"] in summary:
            summary[row["status"]] = row["count"]

    cur.close()
    conn.close()

    return {
        "feeds": feeds,
        "summary": summary
    }

def fetch_source_credibility():
    """Get source credibility scores"""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cur.execute("""
        SELECT source_name, credibility_score, bias_rating, category, total_articles, avg_signal_score
        FROM source_credibility
        ORDER BY credibility_score DESC;
    """)

    sources = []
    for row in cur.fetchall():
        sources.append({
            "name": row["source_name"],
            "credibility_score": row["credibility_score"],
            "bias_rating": row["bias_rating"],
            "category": row["category"],
            "total_articles": row["total_articles"],
            "avg_signal_score": float(row["avg_signal_score"]) if row["avg_signal_score"] else 0
        })

    cur.close()
    conn.close()

    return sources

def clean_old_articles():
    """Delete old articles based on age and signal score"""
    conn = get_connection()
    cur = conn.cursor()

    # Delete low-signal articles older than 30 days
    cur.execute("""
        DELETE FROM articles
        WHERE published_date < NOW() - INTERVAL '30 days'
          AND signal_score < 40;
    """)
    deleted_old = cur.rowcount

    # Delete any articles older than 90 days
    cur.execute("""
        DELETE FROM articles
        WHERE published_date < NOW() - INTERVAL '90 days';
    """)
    deleted_very_old = cur.rowcount

    total_deleted = deleted_old + deleted_very_old
    conn.commit()
    cur.close()
    conn.close()

    return total_deleted

def get_story_perspectives(article_id):
    """Get multiple perspectives on the same story from different sources"""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # Fetch target article
    cur.execute("""
        SELECT id, title, summary, source, url, signal_score, published_date,
               category, why_it_matters, source_bias
        FROM articles WHERE id = %s AND processed_at IS NOT NULL
    """, (article_id,))

    target = cur.fetchone()

    if not target:
        cur.close()
        conn.close()
        return {"has_perspectives": False, "reason": "Article not found"}

    if target["signal_score"] is None or target["signal_score"] < 40:
        cur.close()
        conn.close()
        return {"has_perspectives": False, "reason": "Signal score too low"}

    # Determine perspective type
    category_lower = (target["category"] or "").lower()
    geopolitical_keywords = ["international", "geopolit", "military", "conflict",
                            "middle east", "security", "iran", "war", "ukraine"]
    is_geopolitical = any(kw in category_lower for kw in geopolitical_keywords)
    perspective_type = "geopolitical" if is_geopolitical else "political"

    # Fetch candidate articles (different source, within 36 hours, signal_score >= 40)
    cur.execute("""
        SELECT id, title, summary, source, url, signal_score, published_date, why_it_matters, source_bias
        FROM articles
        WHERE published_date BETWEEN %s AND %s
          AND signal_score >= 40
          AND source != %s
          AND processed_at IS NOT NULL
        ORDER BY signal_score DESC
    """, (
        target["published_date"] - timedelta(hours=36),
        target["published_date"] + timedelta(hours=36),
        target["source"]
    ))

    candidates = cur.fetchall()

    # Title similarity matching
    matching_articles = [target]  # Include the target itself
    title_ratio_threshold = 0.65

    for candidate in candidates:
        ratio = SequenceMatcher(None, target["title"].lower(),
                               candidate["title"].lower()).ratio()
        if ratio >= title_ratio_threshold:
            matching_articles.append(candidate)

    if len(matching_articles) < 2:
        cur.close()
        conn.close()
        return {"has_perspectives": False, "reason": "No matching articles from other sources"}

    # Map bias to perspective group
    def map_bias_to_perspective(bias, is_geopolitical):
        if is_geopolitical:
            mapping = {
                "center": "western",
                "center-left": "western",
                "center-right": "economic",
                "international": "international",
                "scientific": "analytical",
                "left": "western",
                "right": "economic"
            }
        else:
            mapping = {
                "center": "center",
                "center-left": "left",
                "center-right": "right",
                "international": "international",
                "scientific": "analytical",
                "left": "left",
                "right": "right"
            }
        return mapping.get(bias or "center", "center")

    # Group by perspective, keeping highest signal_score per group
    perspectives = {}
    for article in matching_articles:
        bias = article["source_bias"] or "center"
        perspective = map_bias_to_perspective(bias, is_geopolitical)

        if perspective not in perspectives or \
           article["signal_score"] > perspectives[perspective]["signal_score"]:
            perspectives[perspective] = {
                "id": article["id"],
                "title": article["title"],
                "summary": article["summary"] or "",
                "source": article["source"],
                "url": article["url"],
                "signal_score": article["signal_score"] if article["signal_score"] else 0,
                "why_it_matters": article["why_it_matters"] or article["summary"] or article["title"] or "",
                "bias": bias
            }

    cur.close()
    conn.close()

    if len(perspectives) < 2:
        return {"has_perspectives": False, "reason": "Only one perspective available"}

    return {
        "has_perspectives": True,
        "story_count": len(matching_articles),
        "article_id": article_id,
        "perspective_type": perspective_type,
        "perspectives": perspectives,
        "common_ground": f"Covered by {len(matching_articles)} sources including {', '.join(set(a['source'] for a in matching_articles[:3]))}",
        "key_disagreements": "Sources broadly agree on facts but may differ in framing and emphasis"
    }

def get_active_conflicts():
    """Return one entry per conflict cluster (deduplicated by keyword matching)."""

    CLUSTERS = [
        {"name": "Iran-US War",           "keywords": ["iran", "hormuz", "hegseth", "natanz", "tehran", "persian gulf"]},
        {"name": "Russia-Ukraine War",    "keywords": ["ukraine", "russia", "kyiv", "kharkiv", "zelensky", "kremlin", "moscow"]},
        {"name": "Israel-Gaza",           "keywords": ["gaza", "hamas", "west bank", "netanyahu", "idf", "palestin"]},
        {"name": "China-Taiwan",          "keywords": ["taiwan", "strait", "beijing", "pla", "taipei"]},
        {"name": "Pakistan-Afghanistan",  "keywords": ["pakistan", "afghanistan", "kabul", "islamabad"]},
    ]

    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # No category filter here — keyword matching below is the actual classifier.
    # Fetch a broad pool of recent articles so the cluster keywords can find matches.
    cur.execute("""
        SELECT id, title, why_it_matters, summary, signal_score, published_date
        FROM articles
        WHERE processed_at IS NOT NULL
          AND signal_score >= 40
          AND published_date >= NOW() - INTERVAL '7 days'
        ORDER BY signal_score DESC
        LIMIT 500
    """)

    rows = cur.fetchall()
    cur.close()
    conn.close()

    def _matches(row, keywords):
        text = (row['title'] or '').lower()
        for kw in keywords:
            if kw in text:
                return True
        return False

    now = datetime.utcnow()
    results = []

    for cluster in CLUSTERS:
        matched = [r for r in rows if _matches(r, cluster['keywords'])]
        if len(matched) < 2:
            continue

        # Best article = highest signal_score (rows already sorted DESC)
        best = matched[0]
        # Most recent article
        latest = max(matched, key=lambda r: r['published_date'] or datetime.min)

        pub = latest['published_date']
        if pub:
            diff = now - pub.replace(tzinfo=None)
            hours = diff.total_seconds() / 3600
            if hours < 1:
                last_updated = f"{int(diff.total_seconds() / 60)}m ago"
            elif hours < 24:
                h = int(hours)
                last_updated = f"{h}h ago"
            else:
                d = int(hours / 24)
                last_updated = f"{d}d ago"
        else:
            last_updated = "Unknown"

        results.append({
            "cluster_name": cluster['name'],
            "article_count": len(matched),
            "latest_article_id": latest['id'],
            "status_summary": best['why_it_matters'] or best['summary'] or best['title'] or "",
            "last_updated": last_updated,
            "signal_score": best['signal_score'] or 0,
        })

    # Sort by signal_score DESC, cap at 5
    results.sort(key=lambda x: x['signal_score'], reverse=True)
    return results[:5]


def get_perspectives_available():
    """Get list of article IDs that have multiple perspectives available"""
    conn = get_connection()
    cur = conn.cursor()

    # Fetch recent high-signal articles
    cur.execute("""
        SELECT id, title, source, signal_score, published_date
        FROM articles
        WHERE published_date >= NOW() - INTERVAL '7 days'
          AND signal_score >= 40
          AND summary IS NOT NULL
          AND summary != ''
          AND processed_at IS NOT NULL
        ORDER BY signal_score DESC
        LIMIT 200
    """)

    articles = cur.fetchall()
    cur.close()
    conn.close()

    perspectives_available = []
    checked_pairs = set()

    for i, (id1, title1, source1, score1, date1) in enumerate(articles):
        for id2, title2, source2, score2, date2 in articles[i+1:]:
            # Skip if same source or already checked
            if source1 == source2:
                continue

            pair_key = tuple(sorted([id1, id2]))
            if pair_key in checked_pairs:
                continue
            checked_pairs.add(pair_key)

            # Check if published within 36 hours
            time_diff = abs((date2 - date1).total_seconds() / 3600)
            if time_diff > 36:
                continue

            # Check title similarity
            ratio = SequenceMatcher(None, title1.lower(), title2.lower()).ratio()
            if ratio >= 0.65:
                if id1 not in perspectives_available:
                    perspectives_available.append(id1)
                if id2 not in perspectives_available:
                    perspectives_available.append(id2)

    return {
        "article_ids_with_perspectives": sorted(perspectives_available),
        "total": len(perspectives_available)
    }


def fetch_last_pipeline_run():
    """Return ISO timestamp of the most recent successful feed pipeline run."""
    try:
        conn = get_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT MAX(last_success) AS last_fetched_at
            FROM feed_health
            WHERE last_success IS NOT NULL
        """)
        row = cur.fetchone()
        cur.close()
        conn.close()
        if row and row['last_fetched_at']:
            return row['last_fetched_at'].isoformat()
        return None
    except Exception:
        return None


def create_bookmarks_table():
    """Create bookmarks table if it doesn't exist."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS bookmarks (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            article_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(user_id, article_id)
        )
    """)
    conn.commit()
    cur.close()
    conn.close()


def add_bookmark(user_id, article_id):
    """Add a bookmark. Returns True if saved, None if already exists."""
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO bookmarks (user_id, article_id) VALUES (%s, %s)",
            (user_id, article_id)
        )
        conn.commit()
        cur.close()
        conn.close()
        return True
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        cur.close()
        conn.close()
        return None


def remove_bookmark(user_id, article_id):
    """Remove a bookmark. Returns True if deleted, False if not found."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "DELETE FROM bookmarks WHERE user_id = %s AND article_id = %s",
        (user_id, article_id)
    )
    deleted = cur.rowcount
    conn.commit()
    cur.close()
    conn.close()
    return deleted > 0


def add_display_name_column():
    """Add display_name column to users table if it doesn't exist."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT DEFAULT ''
    """)
    conn.commit()
    cur.close()
    conn.close()


def create_user_preferences_table():
    """Create user_preferences table if it doesn't exist."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS user_preferences (
            user_id INTEGER PRIMARY KEY,
            topics TEXT[] DEFAULT '{}',
            expertise_level TEXT DEFAULT 'Standard',
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)
    conn.commit()
    cur.close()
    conn.close()


def get_user_profile(user_id):
    """Return (email, display_name) for a user."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT email, display_name FROM users WHERE id = %s",
        (user_id,)
    )
    row = cur.fetchone()
    cur.close()
    conn.close()
    return row


def get_user_preferences(user_id):
    """Return (topics, expertise_level) for a user, or ([], 'Standard') if none."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT topics, expertise_level FROM user_preferences WHERE user_id = %s",
        (user_id,)
    )
    row = cur.fetchone()
    cur.close()
    conn.close()
    if row:
        return (row[0] or [], row[1] or 'Standard')
    return ([], 'Standard')


def upsert_user_preferences(user_id, topics, expertise_level):
    """Insert or update user preferences."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO user_preferences (user_id, topics, expertise_level, updated_at)
        VALUES (%s, %s, %s, NOW())
        ON CONFLICT (user_id) DO UPDATE
            SET topics = EXCLUDED.topics,
                expertise_level = EXCLUDED.expertise_level,
                updated_at = NOW()
        """,
        (user_id, topics, expertise_level)
    )
    conn.commit()
    cur.close()
    conn.close()


def delete_user_data(user_id):
    """Delete all data for a user (preferences, bookmarks, then user row)."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM bookmarks WHERE user_id = %s", (user_id,))
    cur.execute("DELETE FROM user_preferences WHERE user_id = %s", (user_id,))
    cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
    conn.commit()
    cur.close()
    conn.close()


LOCATION_COORDINATES = {
    "Iran": (32.4279, 53.6880),
    "Tehran": (35.6892, 51.3890),
    "Iraq": (33.2232, 43.6793),
    "Baghdad": (33.3152, 44.3661),
    "Israel": (31.0461, 34.8516),
    "Gaza": (31.3547, 34.3088),
    "Tel Aviv": (32.0853, 34.7818),
    "West Bank": (31.9522, 35.2332),
    "Ukraine": (48.3794, 31.1656),
    "Kyiv": (50.4501, 30.5234),
    "Kharkiv": (49.9935, 36.2304),
    "Zaporizhzhia": (47.8388, 35.1396),
    "Odessa": (46.4825, 30.7233),
    "Russia": (61.5240, 105.3188),
    "Moscow": (55.7558, 37.6173),
    "St. Petersburg": (59.9343, 30.3351),
    "China": (35.8617, 104.1954),
    "Beijing": (39.9042, 116.4074),
    "Shanghai": (31.2304, 121.4737),
    "Taiwan": (23.6978, 120.9605),
    "Taipei": (25.0330, 121.5654),
    "United States": (37.0902, -95.7129),
    "Washington": (38.9072, -77.0369),
    "New York": (40.7128, -74.0060),
    "Los Angeles": (34.0522, -118.2437),
    "United Kingdom": (55.3781, -3.4360),
    "London": (51.5074, -0.1278),
    "Germany": (51.1657, 10.4515),
    "Berlin": (52.5200, 13.4050),
    "France": (46.2276, 2.2137),
    "Paris": (48.8566, 2.3522),
    "Pakistan": (30.3753, 69.3451),
    "Islamabad": (33.6844, 73.0479),
    "Karachi": (24.8607, 67.0011),
    "Afghanistan": (33.9391, 67.7100),
    "Kabul": (34.5553, 69.2075),
    "Syria": (34.8021, 38.9968),
    "Damascus": (33.5138, 36.2765),
    "Aleppo": (36.2021, 37.1343),
    "Lebanon": (33.8547, 35.8623),
    "Beirut": (33.8938, 35.5018),
    "Yemen": (15.5527, 48.5164),
    "Sanaa": (15.3694, 44.1910),
    "Saudi Arabia": (23.8859, 45.0792),
    "Riyadh": (24.7136, 46.6753),
    "Turkey": (38.9637, 35.2433),
    "Ankara": (39.9334, 32.8597),
    "Istanbul": (41.0082, 28.9784),
    "India": (20.5937, 78.9629),
    "New Delhi": (28.6139, 77.2090),
    "Mumbai": (19.0760, 72.8777),
    "North Korea": (40.3399, 127.5101),
    "Pyongyang": (39.0392, 125.7625),
    "South Korea": (35.9078, 127.7669),
    "Seoul": (37.5665, 126.9780),
    "Japan": (36.2048, 138.2529),
    "Tokyo": (35.6762, 139.6503),
    "Australia": (25.2744, 133.7751),
    "Canberra": (35.2809, 149.1300),
    "Brazil": (-14.2350, -51.9253),
    "Brasilia": (-15.8267, -47.9218),
    "Mexico": (23.6345, -102.5528),
    "Mexico City": (19.4326, -99.1332),
    "South Africa": (-30.5595, 22.9375),
    "Johannesburg": (-26.2041, 28.0473),
    "Nigeria": (9.0820, 8.6753),
    "Abuja": (9.0765, 7.3986),
    "Ethiopia": (9.1450, 40.4897),
    "Addis Ababa": (9.0300, 38.7400),
    "Sudan": (12.8628, 30.2176),
    "Khartoum": (15.5007, 32.5599),
    "Libya": (26.3351, 17.2283),
    "Tripoli": (32.8872, 13.1913),
    "Egypt": (26.8206, 30.8025),
    "Cairo": (30.0444, 31.2357),
    "Venezuela": (6.4238, -66.5897),
    "Caracas": (10.4806, -66.9036),
    "Cuba": (21.5218, -77.7812),
    "Havana": (23.1136, -82.3666),
    "Myanmar": (21.9162, 95.9560),
    "Naypyidaw": (19.7633, 96.0785),
    "Indonesia": (-0.7893, 113.9213),
    "Jakarta": (-6.2088, 106.8456),
    "Philippines": (12.8797, 121.7740),
    "Manila": (14.5995, 120.9842),
    "Strait of Hormuz": (26.5667, 56.2500),
    "Persian Gulf": (26.0000, 54.0000),
    "Red Sea": (20.0000, 38.0000),
    "Black Sea": (43.0000, 34.0000),
    "Taiwan Strait": (24.5000, 119.5000),
    "South China Sea": (15.0000, 115.0000),
    "Arctic": (90.0000, 0.0000),
    "Kosovo": (42.6026, 20.9030),
    "Serbia": (44.0165, 21.0059),
    "Hungary": (47.1625, 19.5034),
    "Poland": (51.9194, 19.1451),
    "Finland": (61.9241, 25.7482),
    "Sweden": (60.1282, 18.6435),
    "Israel-Gaza": (31.3547, 34.3088),
    "Congo": (-4.0383, 21.7587),
    "Somalia": (5.1521, 46.1996),
    "Mali": (17.5707, -3.9962),
    "Haiti": (18.9712, -72.2852),
}


def get_map_events():
    """Return geographic intelligence events for the map view."""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cur.execute("""
        SELECT id, title, source, signal_score, published_date,
               summary, why_it_matters, entities, categories
        FROM articles
        WHERE signal_score >= 50
          AND processed_at IS NOT NULL
          AND published_date >= NOW() - INTERVAL '7 days'
        ORDER BY signal_score DESC NULLS LAST
    """)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    # Group articles by place name
    location_map = {}
    for row in rows:
        entities = row.get('entities') or {}
        if isinstance(entities, str):
            try:
                import json as _json
                entities = _json.loads(entities)
            except Exception:
                entities = {}
        places = entities.get('places', [])
        if not places:
            continue
        for place in places:
            if isinstance(place, dict):
                place_name = place.get('name', '') or place.get('text', '')
            else:
                place_name = str(place)
            place_name = place_name.strip()
            if not place_name or place_name not in LOCATION_COORDINATES:
                continue
            if place_name not in location_map:
                location_map[place_name] = []
            location_map[place_name].append(row)

    now = datetime.utcnow()
    events = []

    for location_name, articles in location_map.items():
        if len(articles) < 2:
            continue

        lat, lng = LOCATION_COORDINATES[location_name]
        top = sorted(articles, key=lambda x: x['signal_score'] or 0, reverse=True)
        best = top[0]

        is_conflict = any(
            cat in (r.get('categories') or [])
            for r in articles
            for cat in ['Conflicts', 'Military', 'conflicts', 'military']
        )

        summary = (
            best.get('why_it_matters') or
            best.get('summary') or
            best.get('title') or ''
        )

        top5 = []
        for a in top[:5]:
            pub = a.get('published_date')
            if pub:
                delta = now - pub.replace(tzinfo=None)
                h = int(delta.total_seconds() // 3600)
                if h < 1:
                    time_ago = f"{max(1, int(delta.total_seconds() // 60))}m ago"
                elif h < 24:
                    time_ago = f"{h}h ago"
                else:
                    time_ago = f"{h // 24}d ago"
            else:
                time_ago = "recently"
            top5.append({
                "id": a['id'],
                "title": a['title'] or '',
                "source": a['source'] or 'Unknown',
                "time_ago": time_ago,
                "signal_score": a['signal_score'] or 0,
            })

        events.append({
            "location_name": location_name,
            "lat": lat,
            "lng": lng,
            "article_count": len(articles),
            "signal_score": best['signal_score'] or 0,
            "is_conflict": is_conflict,
            "summary": summary,
            "articles": top5,
        })

    events.sort(key=lambda x: x['signal_score'], reverse=True)
    return events[:50]


def get_bookmarks_for_user(user_id):
    """Return full article objects for all bookmarked articles, sorted by bookmark time."""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT a.*
        FROM articles a
        JOIN bookmarks b ON a.id = b.article_id
        WHERE b.user_id = %s
          AND a.processed_at IS NOT NULL
        ORDER BY b.created_at DESC
    """, (user_id,))
    rows = cur.fetchall()
    for row in rows:
        row["signal_score"] = row["signal_score"] if row["signal_score"] is not None else 0
        row["categories"] = row["categories"] or []
        row["key_facts"] = row["key_facts"] or []
        row["entities"] = row["entities"] or {}
    cur.close()
    conn.close()
    return rows
