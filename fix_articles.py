#!/usr/bin/env python3
"""
FIX 1 & 2: Re-score articles with new signal score + Reprocess incomplete articles
"""

import os
import sys
import time
import json
import psycopg2
from psycopg2.extras import Json
from datetime import datetime
from openai import OpenAI

sys.stdout.reconfigure(encoding='utf-8')

# Load API key from .env file (same as ai_processor.py)
env_file = os.path.join(os.path.dirname(__file__), 'backend', '.env')
if os.path.exists(env_file):
    with open(env_file, 'r') as f:
        for line in f:
            if line.startswith('OPENROUTER_API_KEY='):
                API_KEY = line.split('=')[1].strip()
                break
else:
    API_KEY = os.getenv("OPENROUTER_API_KEY")

if not API_KEY:
    print("ERROR: OPENROUTER_API_KEY not set in .env or environment variables")
    print(f"Looked for: {env_file}")
    sys.exit(1)

# PostgreSQL connection settings
DB_CONFIG = {
    "host": "localhost",
    "database": "montridge_db",
    "user": "postgres",
    "password": "SQL!$N0TN0RM@LL_1t$_$0_W13rd2026",
    "port": 5432
}

# OpenRouter client
client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=API_KEY)

MODEL_NAME = "openrouter/free"
BATCH_SIZE = 20
SLEEP_SECONDS = 3

def timestamp():
    return datetime.now().strftime("[%H:%M:%S]")

def extract_json(text):
    """Extract JSON from AI response"""
    try:
        text = text.replace("json", "").replace("```", "").strip()
        start = text.find('{')
        end = text.rfind('}')
        if start == -1 or end == -1:
            return {}
        return json.loads(text[start:end+1])
    except:
        return {}

def get_signal_score_prompt(title, summary):
    """Generate prompt for signal score evaluation only"""
    summary_text = summary if summary else "No summary available."
    prompt = f"""You are an expert global news analyst. Analyze this article and respond ONLY with valid JSON.

Article Title: {title}
Article Summary: {summary_text}

CRITICAL: Return ONLY a JSON object. No markdown, no code blocks, no extra text.

Evaluate GLOBAL IMPORTANCE (signal_score) from 0-100 using these FIVE TIERS:

TIER 1: GLOBAL EMERGENCIES (85-100)
- Major wars, military conflicts, invasions (e.g., Russia-Ukraine conflict)
- Nuclear incidents, industrial catastrophes (e.g., Fukushima)
- Pandemics in rapid spread phase (COVID-19 early 2020)
- Coups d'etat in major countries
- Terrorism attacks causing mass casualties
- Major natural disasters (earthquakes >7.5, tsunamis, hurricanes)
Examples: 95 for "Major military escalation"; 90 for "New pandemic strain detected"

TIER 2: MAJOR INTERNATIONAL EVENTS (65-84)
- Significant political elections in G20 countries
- Major economic crises affecting multiple markets
- Large trade wars, sanctions regimes
- Significant geopolitical shifts or alliances
- Major corporate scandals (e.g., Enron, FTX)
- Significant tech breakthroughs with market impact
- Major policy changes affecting global trade/environment
Examples: 80 for "US election results"; 75 for "EU passes major climate law"; 70 for "Tech breakthrough: new AI model"

TIER 3: IMPORTANT REGIONAL/INDUSTRY NEWS (45-64)
- Regional political events, elections (non-G20)
- Industry-specific major announcements
- Significant but contained economic developments
- Important scientific discoveries (not immediately impactful)
- Regional natural disasters with notable impact
- Major corporate earnings/restructuring
Examples: 60 for "Brazil election"; 55 for "Apple announces new product"; 50 for "New scientific discovery in medicine"

TIER 4: NOTEWORTHY SPECIALIZED NEWS (25-44)
- Local/regional news with limited global scope
- Niche industry developments
- Minor political developments
- Entertainment industry major announcements
- Sports events (non-global championship)
- Lower-level technology announcements
Examples: 40 for "City council passes new law"; 35 for "Celebrity announces new project"; 30 for "Local tech startup funding round"

TIER 5: LOW IMPACT CONTENT (5-24)
- Celebrity gossip, entertainment news
- Minor local news
- Opinion pieces on non-critical topics
- Routine business announcements
- Entertainment/sports entertainment
- Lifestyle features
Examples: 20 for "Celebrity dating news"; 15 for "Entertainment award ceremony"; 10 for "Lifestyle trend piece"

CALIBRATION RULES:
- Higher score for: global reach, economic/market impact, human safety, political significance, geopolitical implications
- Lower score: local scope, entertainment focus, low real-world impact
- Consider: how many countries/markets affected, urgency, novelty

Return ONLY this JSON structure with signal_score only:
{{
  "signal_score": <0-100, strictly use tiers above>
}}"""
    return prompt

def get_full_ai_prompt(title, summary):
    """Generate prompt for full AI processing"""
    summary_text = summary if summary else "No summary available."
    prompt = f"""You are an expert global news analyst. Analyze this article and respond ONLY with valid JSON.

Article Title: {title}
Article Summary: {summary_text}

CRITICAL: Return ONLY a JSON object. No markdown, no code blocks, no extra text.

Evaluate GLOBAL IMPORTANCE (signal_score) from 0-100 using these FIVE TIERS with specific examples:

TIER 1: GLOBAL EMERGENCIES (85-100)
- Major wars, military conflicts, invasions (e.g., Russia-Ukraine conflict)
- Nuclear incidents, industrial catastrophes (e.g., Fukushima)
- Pandemics in rapid spread phase (COVID-19 early 2020)
- Coups d'etat in major countries
- Terrorism attacks causing mass casualties
- Major natural disasters (earthquakes >7.5, tsunamis, hurricanes)
Examples: 95 for "Major military escalation"; 90 for "New pandemic strain detected"

TIER 2: MAJOR INTERNATIONAL EVENTS (65-84)
- Significant political elections in G20 countries
- Major economic crises affecting multiple markets
- Large trade wars, sanctions regimes
- Significant geopolitical shifts or alliances
- Major corporate scandals (e.g., Enron, FTX)
- Significant tech breakthroughs with market impact
- Major policy changes affecting global trade/environment
Examples: 80 for "US election results"; 75 for "EU passes major climate law"; 70 for "Tech breakthrough: new AI model"

TIER 3: IMPORTANT REGIONAL/INDUSTRY NEWS (45-64)
- Regional political events, elections (non-G20)
- Industry-specific major announcements
- Significant but contained economic developments
- Important scientific discoveries (not immediately impactful)
- Regional natural disasters with notable impact
- Major corporate earnings/restructuring
Examples: 60 for "Brazil election"; 55 for "Apple announces new product"; 50 for "New scientific discovery in medicine"

TIER 4: NOTEWORTHY SPECIALIZED NEWS (25-44)
- Local/regional news with limited global scope
- Niche industry developments
- Minor political developments
- Entertainment industry major announcements
- Sports events (non-global championship)
- Lower-level technology announcements
Examples: 40 for "City council passes new law"; 35 for "Celebrity announces new project"; 30 for "Local tech startup funding round"

TIER 5: LOW IMPACT CONTENT (5-24)
- Celebrity gossip, entertainment news
- Minor local news
- Opinion pieces on non-critical topics
- Routine business announcements
- Entertainment/sports entertainment
- Lifestyle features
Examples: 20 for "Celebrity dating news"; 15 for "Entertainment award ceremony"; 10 for "Lifestyle trend piece"

CALIBRATION RULES:
- Higher score for: global reach, economic/market impact, human safety, political significance, geopolitical implications
- Lower score for: local scope, entertainment focus, low real-world impact
- Consider: how many countries/markets affected, immediate vs. long-term relevance, urgency, novelty
- Be slightly generous to established/authorized news about major crises
- Significantly discount pure entertainment or opinion content

{{
  "summary": "concise 1-2 sentence summary",
  "why_it_matters": "why this matters globally",
  "categories": ["category1", "category2"],
  "entities": {{"people": [], "organizations": [], "places": []}},
  "key_facts": ["fact1", "fact2", "fact3"],
  "sentiment": "positive|negative|neutral",
  "signal_score": <0-100, strictly use tiers above>,
  "importance": "critical|high|medium|low",
  "related_context": "relevant background",
  "bias_indicators": {{"emotional_language": true|false, "one_sided": true|false, "has_quotes": true|false, "has_data": true|false}}
}}"""
    return prompt

# =============================================================================
# FIX 1: RE-SCORE ALL ARTICLES WITH NEW SIGNAL SCORE
# =============================================================================

def rescore_all_articles():
    """Re-score every article with the new 5-tier signal score prompt"""
    print(f"\n{timestamp()} FIX 1: RE-SCORING ALL ARTICLES WITH NEW SIGNAL SCORE PROMPT")
    print("="*80)

    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    # Get all articles that have signal_score (already processed once)
    cur.execute("""
        SELECT id, title, summary
        FROM articles
        WHERE signal_score IS NOT NULL
        ORDER BY fetched_at DESC
    """)
    articles = cur.fetchall()
    total = len(articles)
    print(f"Found {total} articles to re-score")

    rescored_count = 0
    error_count = 0
    old_scores = {}
    new_scores = {}

    for idx, (article_id, title, summary) in enumerate(articles, 1):
        # Show progress every 10 articles
        if idx % 10 == 0:
            print(f"  Progress: {idx}/{total} articles...")

        try:
            # Get current score for comparison
            cur.execute("SELECT signal_score FROM articles WHERE id = %s", (article_id,))
            old_score = cur.fetchone()[0]
            old_scores[article_id] = old_score

            # Call AI with signal-score-only prompt
            prompt = get_signal_score_prompt(title, summary)
            response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[{"role": "user", "content": prompt}],
                temperature=0
            )

            raw_text = response.choices[0].message.content
            data = extract_json(raw_text)
            new_score = max(0, min(100, int(data.get("signal_score", old_score))))
            new_scores[article_id] = new_score

            # Update database
            cur.execute(
                "UPDATE articles SET signal_score = %s WHERE id = %s",
                (new_score, article_id)
            )
            conn.commit()
            rescored_count += 1

        except Exception as e:
            error_count += 1
            print(f"    Error on article {article_id}: {e}")
            continue

        # Rate limiting
        if idx % BATCH_SIZE == 0:
            time.sleep(SLEEP_SECONDS)

    cur.close()
    conn.close()

    print(f"\n{timestamp()} FIX 1 COMPLETE")
    print(f"  Re-scored: {rescored_count} articles")
    print(f"  Errors: {error_count} articles")

    # Show some examples of score changes
    if rescored_count > 0:
        print(f"\n  Score changes (sample):")
        sample_count = 0
        for article_id in list(new_scores.keys())[:5]:
            old = old_scores.get(article_id, 0)
            new = new_scores.get(article_id, 0)
            if old != new:
                print(f"    Article {article_id}: {old} -> {new}")
                sample_count += 1

    return rescored_count, error_count

# =============================================================================
# FIX 2: REPROCESS ARTICLES WITH EMPTY/MISSING FIELDS
# =============================================================================

def reprocess_incomplete_articles():
    """Reprocess articles with empty summary or why_it_matters"""
    print(f"\n{timestamp()} FIX 2: REPROCESSING INCOMPLETE ARTICLES")
    print("="*80)

    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    # Find articles with empty/missing required fields
    cur.execute("""
        SELECT id, title, summary
        FROM articles
        WHERE (summary IS NULL OR summary = '')
           OR (why_it_matters IS NULL OR why_it_matters = '')
        ORDER BY fetched_at DESC
    """)
    articles = cur.fetchall()
    total = len(articles)
    print(f"Found {total} articles with missing fields to reprocess")

    if total == 0:
        print("  No articles need reprocessing!")
        return 0, 0

    reprocessed_count = 0
    error_count = 0

    for idx, (article_id, title, summary) in enumerate(articles, 1):
        # Show progress every 5 articles
        if idx % 5 == 0:
            print(f"  Progress: {idx}/{total} articles...")

        try:
            summary_text = summary if summary else "No summary available."

            # Call AI with FULL prompt
            prompt = get_full_ai_prompt(title, summary_text)
            response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[{"role": "user", "content": prompt}],
                temperature=0
            )

            raw_text = response.choices[0].message.content
            data = extract_json(raw_text)

            # Extract all fields
            summary_val = data.get("summary", "")
            why_val = data.get("why_it_matters", "")
            categories_val = data.get("categories", [])
            entities_val = data.get("entities", {"people": [], "organizations": [], "places": []})
            key_facts_val = data.get("key_facts", [])
            sentiment_val = data.get("sentiment", "neutral")
            signal_score_val = max(0, min(100, int(data.get("signal_score", 50))))
            importance_val = data.get("importance", "medium")
            related_val = data.get("related_context", "")
            bias_val = data.get("bias_indicators", {})

            # Update DB with all fields
            cur.execute("""
                UPDATE articles
                SET summary=%s,
                    why_it_matters=%s,
                    categories=%s,
                    entities=%s,
                    key_facts=%s,
                    sentiment=%s,
                    signal_score=%s,
                    importance=%s,
                    related_context=%s,
                    bias_indicators=%s,
                    processed_at=NOW(),
                    processing_error=NULL
                WHERE id=%s
            """, (
                summary_val or "",
                why_val or "",
                categories_val,
                Json(entities_val),
                Json(key_facts_val),
                sentiment_val,
                signal_score_val,
                importance_val,
                related_val or "",
                Json(bias_val),
                article_id
            ))
            conn.commit()
            reprocessed_count += 1

        except Exception as e:
            error_count += 1
            print(f"    Error on article {article_id}: {e}")
            continue

        # Rate limiting
        if idx % BATCH_SIZE == 0:
            time.sleep(SLEEP_SECONDS)

    cur.close()
    conn.close()

    print(f"\n{timestamp()} FIX 2 COMPLETE")
    print(f"  Reprocessed: {reprocessed_count} articles")
    print(f"  Errors: {error_count} articles")

    return reprocessed_count, error_count

# =============================================================================
# VERIFICATION QUERIES
# =============================================================================

def verify_signal_score_distribution():
    """Show final signal score distribution"""
    print(f"\n{timestamp()} SIGNAL SCORE DISTRIBUTION (AFTER FIXES)")
    print("="*80)

    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    cur.execute("""
        SELECT
          CASE
            WHEN signal_score >= 85 THEN 'Tier 1: Global Emergency (85-100)'
            WHEN signal_score >= 65 THEN 'Tier 2: Major Event (65-84)'
            WHEN signal_score >= 45 THEN 'Tier 3: Significant (45-64)'
            WHEN signal_score >= 25 THEN 'Tier 4: Industry/Regional (25-44)'
            ELSE 'Tier 5: Minor (0-24)'
          END as tier,
          COUNT(*) as count
        FROM articles
        WHERE signal_score IS NOT NULL
        GROUP BY tier
        ORDER BY MIN(signal_score) DESC
    """)

    results = cur.fetchall()
    for tier, count in results:
        percentage = (count / sum(r[1] for r in results)) * 100
        print(f"  {tier}: {count:4d} articles ({percentage:5.1f}%)")

    cur.close()
    conn.close()

def verify_completeness():
    """Verify no articles have empty summaries"""
    print(f"\n{timestamp()} DATA COMPLETENESS CHECK")
    print("="*80)

    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    # Check empty summaries
    cur.execute("""
        SELECT COUNT(*)
        FROM articles
        WHERE processed_at IS NOT NULL
          AND (summary IS NULL OR summary = '')
    """)
    empty_summaries = cur.fetchone()[0]
    print(f"  Articles with empty summary: {empty_summaries}")

    # Check empty why_it_matters
    cur.execute("""
        SELECT COUNT(*)
        FROM articles
        WHERE processed_at IS NOT NULL
          AND (why_it_matters IS NULL OR why_it_matters = '')
    """)
    empty_why = cur.fetchone()[0]
    print(f"  Articles with empty why_it_matters: {empty_why}")

    # Total processed articles
    cur.execute("SELECT COUNT(*) FROM articles WHERE processed_at IS NOT NULL")
    total_processed = cur.fetchone()[0]
    print(f"  Total processed articles: {total_processed}")

    cur.close()
    conn.close()

def show_top_articles():
    """Show top 5 high-importance articles"""
    print(f"\n{timestamp()} TOP 5 HIGH-IMPORTANCE ARTICLES")
    print("="*80)

    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    cur.execute("""
        SELECT id, title, signal_score, sentiment, source
        FROM articles
        WHERE signal_score >= 75
          AND processed_at IS NOT NULL
        ORDER BY signal_score DESC, published_date DESC
        LIMIT 5
    """)

    results = cur.fetchall()
    for idx, (article_id, title, score, sentiment, source) in enumerate(results, 1):
        print(f"\n  {idx}. Score: {score} | Sentiment: {sentiment} | Source: {source}")
        print(f"     Title: {title[:80]}...")

    cur.close()
    conn.close()

# =============================================================================
# MAIN EXECUTION
# =============================================================================

def main():
    print("\n" + "="*80)
    print("MONTRIDGE BACKEND FIXES: Re-score + Reprocess Incomplete Articles")
    print("="*80)

    # FIX 1: Re-score all articles
    rescore_count, rescore_errors = rescore_all_articles()

    # FIX 2: Reprocess incomplete articles
    reprocess_count, reprocess_errors = reprocess_incomplete_articles()

    # VERIFICATION
    print(f"\n{timestamp()} VERIFICATION AFTER FIXES")
    print("="*80)

    verify_signal_score_distribution()
    verify_completeness()
    show_top_articles()

    # FINAL SUMMARY
    print(f"\n{timestamp()} FINAL SUMMARY")
    print("="*80)
    print(f"  FIX 1 - Re-scored articles: {rescore_count} (Errors: {rescore_errors})")
    print(f"  FIX 2 - Reprocessed incomplete: {reprocess_count} (Errors: {reprocess_errors})")
    print(f"  Total articles fixed: {rescore_count + reprocess_count}")
    print("\nAll fixes complete!")

if __name__ == "__main__":
    main()
