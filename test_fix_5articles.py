#!/usr/bin/env python3
"""
Test Fix 1: Re-score 5 articles with new signal score prompt
"""

import os
import sys
import time
import json
import psycopg2
from datetime import datetime
from openai import OpenAI

sys.stdout.reconfigure(encoding='utf-8')

API_KEY = os.getenv("OPENROUTER_API_KEY")
if not API_KEY:
    print("ERROR: OPENROUTER_API_KEY not set")
    print("Set it with: export OPENROUTER_API_KEY='your-key'")
    sys.exit(1)

DB_CONFIG = {
    "host": "localhost",
    "database": "montridge_db",
    "user": "postgres",
    "password": "SQL!$N0TN0RM@LL_1t$_$0_W13rd2026",
    "port": 5432
}

client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=API_KEY)

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

Return ONLY this JSON structure:
{{
  "signal_score": <0-100>
}}"""
    return prompt

print(f"\n{timestamp()} TEST: Re-scoring 5 articles")
print("="*80)

try:
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    # Get 5 test articles
    cur.execute("""
        SELECT id, title, summary, signal_score
        FROM articles
        WHERE signal_score IS NOT NULL
        LIMIT 5
    """)
    articles = cur.fetchall()
    print(f"Found {len(articles)} test articles")

    for article_id, title, summary, old_score in articles:
        print(f"\nProcessing article {article_id}...")
        print(f"  Old score: {old_score}")
        print(f"  Title: {title[:60]}...")

        prompt = get_signal_score_prompt(title, summary)

        try:
            response = client.chat.completions.create(
                model="openrouter/free",
                messages=[{"role": "user", "content": prompt}],
                temperature=0
            )

            raw_text = response.choices[0].message.content
            data = extract_json(raw_text)
            new_score = max(0, min(100, int(data.get("signal_score", old_score))))

            print(f"  New score: {new_score}")

            # Update database
            cur.execute(
                "UPDATE articles SET signal_score = %s WHERE id = %s",
                (new_score, article_id)
            )
            conn.commit()
            print(f"  Updated successfully")

        except Exception as e:
            print(f"  ERROR: {e}")
            continue

        time.sleep(2)  # Rate limiting

    cur.close()
    conn.close()

    print(f"\n{timestamp()} TEST COMPLETE - No errors!")

except Exception as e:
    print(f"FATAL ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
