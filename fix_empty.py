#!/usr/bin/env python3
"""
Fix articles with empty summary or why_it_matters
Uses exact same AI logic as ai_processor.py
"""

import os
import time
import json
import psycopg2
from psycopg2.extras import Json
from datetime import datetime
from dotenv import load_dotenv
from openai import OpenAI

# Load environment
load_dotenv()
API_KEY = os.getenv("OPENROUTER_API_KEY")
if not API_KEY:
    print("ERROR: OPENROUTER_API_KEY not set")
    exit(1)

# DB config
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
BATCH_SIZE = 10
SLEEP_SECONDS = 2

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

def fix_empty_articles():
    """Reprocess articles with empty summary or why_it_matters"""

    print(f"\n{'='*70}")
    print(f"FIXING EMPTY ARTICLE FIELDS")
    print(f"{'='*70}\n")

    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    # Find articles with empty fields
    cur.execute("""
        SELECT id, title, summary
        FROM articles
        WHERE (summary IS NULL OR summary = '')
           OR (why_it_matters IS NULL OR why_it_matters = '')
        ORDER BY fetched_at DESC
    """)

    articles_to_fix = cur.fetchall()
    total_found = len(articles_to_fix)
    print(f"Found {total_found} articles with empty fields\n")

    if total_found == 0:
        cur.close()
        conn.close()
        return 0, 0

    fixed_count = 0
    failed_count = 0

    for idx, (article_id, title, summary) in enumerate(articles_to_fix, 1):
        print(f"Processing article ID {article_id}: {title[:60]}...")

        try:
            summary_text = summary if summary else "No summary available."

            # EXACT SAME PROMPT AS ai_processor.py
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

            # Call AI API (EXACT same format as ai_processor.py)
            response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[{"role": "user", "content": prompt}],
                temperature=0
            )

            raw_text = response.choices[0].message.content
            data = extract_json(raw_text)

            # Extract all fields (EXACT SAME as ai_processor.py)
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

            # Update DB (EXACT SAME as ai_processor.py)
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
                summary_val,
                why_val,
                categories_val,
                Json(entities_val),
                Json(key_facts_val),
                sentiment_val,
                signal_score_val,
                importance_val,
                related_val,
                Json(bias_val),
                article_id
            ))
            conn.commit()

            print(f"  Fixed ID {article_id}\n")
            fixed_count += 1

        except Exception as e:
            print(f"  Failed ID {article_id}: {str(e)[:50]}\n")
            failed_count += 1
            continue

        # Rate limiting - sleep between batches
        if idx % BATCH_SIZE == 0:
            time.sleep(SLEEP_SECONDS)

    cur.close()
    conn.close()

    # Print summary
    print(f"\n{'='*70}")
    print(f"SUMMARY")
    print(f"{'='*70}")
    print(f"Total found:   {total_found}")
    print(f"Total fixed:   {fixed_count}")
    print(f"Total failed:  {failed_count}")
    print(f"{'='*70}\n")

    return fixed_count, failed_count

if __name__ == "__main__":
    fix_empty_articles()
