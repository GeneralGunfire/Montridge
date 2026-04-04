#!/usr/bin/env python3
"""
FIX 2: Reprocess articles with empty/missing fields
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

# Load API key from .env file
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
    print("ERROR: OPENROUTER_API_KEY not set")
    sys.exit(1)

DB_CONFIG = {
    "host": "localhost",
    "database": "montridge_db",
    "user": "postgres",
    "password": "SQL!$N0TN0RM@LL_1t$_$0_W13rd2026",
    "port": 5432
}

client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=API_KEY)
BATCH_SIZE = 20
SLEEP_SECONDS = 3

def timestamp():
    return datetime.now().strftime("[%H:%M:%S]")

def extract_json(text):
    try:
        text = text.replace("json", "").replace("```", "").strip()
        start = text.find('{')
        end = text.rfind('}')
        if start == -1 or end == -1:
            return {}
        return json.loads(text[start:end+1])
    except:
        return {}

def get_full_ai_prompt(title, summary):
    """Generate full AI processing prompt"""
    summary_text = summary if summary else "No summary available."
    prompt = f"""You are an expert global news analyst. Analyze this article and respond ONLY with valid JSON.

Article Title: {title}
Article Summary: {summary_text}

CRITICAL: Return ONLY a JSON object. No markdown, no code blocks, no extra text.

Evaluate GLOBAL IMPORTANCE (signal_score) from 0-100 using these FIVE TIERS:

TIER 1: GLOBAL EMERGENCIES (85-100)
Examples: 95 for major military escalation; 90 for new pandemic strain

TIER 2: MAJOR INTERNATIONAL EVENTS (65-84)
Examples: 80 for major election; 75 for significant policy change

TIER 3: IMPORTANT REGIONAL/INDUSTRY NEWS (45-64)
Examples: 60 for regional election; 55 for corporate announcement

TIER 4: NOTEWORTHY SPECIALIZED NEWS (25-44)
Examples: 40 for local news; 35 for niche development

TIER 5: LOW IMPACT CONTENT (5-24)
Examples: 20 for entertainment news; 10 for lifestyle

{{
  "summary": "concise 1-2 sentence summary",
  "why_it_matters": "why this matters globally",
  "categories": ["category1", "category2"],
  "entities": {{"people": [], "organizations": [], "places": []}},
  "key_facts": ["fact1", "fact2", "fact3"],
  "sentiment": "positive|negative|neutral",
  "signal_score": <0-100>,
  "importance": "critical|high|medium|low",
  "related_context": "relevant background",
  "bias_indicators": {{"emotional_language": true|false, "one_sided": true|false, "has_quotes": true|false, "has_data": true|false}}
}}"""
    return prompt

def reprocess_incomplete():
    """Reprocess articles with missing summary or why_it_matters"""
    print(f"\n{timestamp()} FIX 2: REPROCESSING INCOMPLETE ARTICLES")
    print("="*80)

    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    # Find articles with empty/missing fields
    cur.execute("""
        SELECT id, title, summary
        FROM articles
        WHERE (summary IS NULL OR summary = '')
           OR (why_it_matters IS NULL OR why_it_matters = '')
        ORDER BY fetched_at DESC
    """)
    articles = cur.fetchall()
    total = len(articles)
    print(f"Found {total} articles with missing fields")

    if total == 0:
        print("  No articles need reprocessing!")
        return 0, 0

    reprocessed_count = 0
    error_count = 0

    for idx, (article_id, title, summary) in enumerate(articles, 1):
        if idx % 5 == 0:
            print(f"  Progress: {idx}/{total}...")

        try:
            summary_text = summary if summary else "No summary available."
            prompt = get_full_ai_prompt(title, summary_text)

            response = client.chat.completions.create(
                model="openrouter/free",
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

            # Update database
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
            print(f"    Error on article {article_id}: {str(e)[:50]}")
            continue

        if idx % BATCH_SIZE == 0:
            time.sleep(SLEEP_SECONDS)

    cur.close()
    conn.close()

    print(f"\n{timestamp()} FIX 2 COMPLETE")
    print(f"  Reprocessed: {reprocessed_count} articles")
    print(f"  Errors: {error_count} articles")

    return reprocessed_count, error_count

if __name__ == "__main__":
    reprocess_incomplete()
