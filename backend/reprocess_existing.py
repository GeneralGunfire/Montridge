#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
reprocess_existing.py — Rewrite summary, why_it_matters, key_facts, related_context
for existing articles using the new Reuters-style prompts.

Only updates those four text fields. Does NOT touch signal_score, categories,
entities, sentiment, bias_indicators, or any other field.

Usage:
    python reprocess_existing.py
    python reprocess_existing.py --min-score 80   # override minimum signal score
    python reprocess_existing.py --limit 50        # cap total articles processed
"""

import sys
import os
import io
import json
import time
import argparse
import psycopg2
import psycopg2.extras
import requests
from datetime import datetime

# Force UTF-8 on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# --- GROQ DUAL-KEY SETUP ---
API_KEYS = [
    os.environ.get('GROQ_API_KEY', ''),
    os.environ.get('GROQ_API_KEY_2', '')
]
CURRENT_KEY_INDEX = 0
MODEL = "llama-3.3-70b-versatile"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

DB_CONFIG = {
    'dbname': os.environ.get('DB_NAME', 'montridge_db'),
    'user': os.environ.get('DB_USER', 'postgres'),
    'password': os.environ.get('DB_PASSWORD', ''),
    'host': os.environ.get('DB_HOST', 'localhost'),
    'port': int(os.environ.get('DB_PORT', '5432'))
}

BATCH_SIZE = 20
SLEEP_SECONDS = 1


def get_headers():
    return {
        "Authorization": f"Bearer {API_KEYS[CURRENT_KEY_INDEX]}",
        "Content-Type": "application/json"
    }


def switch_key():
    global CURRENT_KEY_INDEX
    old = CURRENT_KEY_INDEX
    CURRENT_KEY_INDEX = (CURRENT_KEY_INDEX + 1) % len(API_KEYS)
    print(f"   >> Switching Key {old + 1} → Key {CURRENT_KEY_INDEX + 1}")


def fetch_articles(min_score, limit, offset):
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT id, title, summary
        FROM articles
        WHERE processed_at IS NOT NULL
          AND signal_score >= %s
        ORDER BY signal_score DESC, published_date DESC
        LIMIT %s OFFSET %s
    """, (min_score, limit, offset))
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows


def count_articles(min_score):
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    cur.execute(
        "SELECT COUNT(*) FROM articles WHERE processed_at IS NOT NULL AND signal_score >= %s",
        (min_score,)
    )
    n = cur.fetchone()[0]
    cur.close()
    conn.close()
    return n


def call_groq(title, summary, retry_count=0):
    prompt = f"""Analyze this news article and return a structured JSON response.

Article Title: {title}
Article Summary: {summary or "No summary available"}

Return ONLY valid JSON with NO markdown formatting, NO code fences, NO explanation text. Just pure JSON.

WRITING RULES — enforce on every text field:
- Wire service style: Reuters or AP. State what happened, who did it, what the direct result is.
- Every sentence must contain at least one concrete fact: a number, a name, a location, a date, a percentage, or a direct consequence.
- Maximum 25 words per sentence.
- No filler phrases: never write "far-reaching consequences", "it is crucial", "significant implications", "it is worth noting", "this highlights", "in the region", "at this time".
- No adjectives without facts: not "significant", "major", "notable", "critical", "important" unless followed by a specific number or name.
- Never editorialize: do not write "concerning", "worrying", "a disaster", "unprecedented" unless a named source said so.

{{
  "summary": "2-3 sentences. What happened, who was involved, what the immediate result is. No background, no speculation.",
  "why_it_matters": "2-3 sentences. Direct, concrete consequence for ordinary people or the world. Answer: who is affected, how, by how much if known.",
  "key_facts": ["Verifiable fact with number/name/date/location — no interpretive statements", "Fact 2", "Fact 3"],
  "related_context": "1-2 sentences of factual background only. Specific dates and prior events. No opinion."
}}

Return ONLY the JSON object. NO other text."""

    data = {
        "model": MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3,
        "max_tokens": 800
    }

    try:
        resp = requests.post(GROQ_URL, headers=get_headers(), json=data, timeout=30)
        resp.raise_for_status()
        raw = resp.json()['choices'][0]['message']['content'].strip()

        # Strip markdown fences if present
        if raw.startswith("```json"):
            raw = raw[7:]
        if raw.startswith("```"):
            raw = raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3]
        raw = raw.strip()

        start, end = raw.find('{'), raw.rfind('}')
        if start == -1 or end == -1:
            raise ValueError("No JSON object found")
        return json.loads(raw[start:end + 1])

    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 429 and retry_count < len(API_KEYS):
            print(f"   [RATE LIMIT] Key {CURRENT_KEY_INDEX + 1}")
            switch_key()
            time.sleep(2)
            return call_groq(title, summary, retry_count + 1)
        print(f"   [ERROR] HTTP {e.response.status_code}: {e}")
        return None
    except Exception as e:
        print(f"   [ERROR] {e}")
        return None


def update_article(article_id, data):
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    cur.execute("""
        UPDATE articles
        SET summary        = %s,
            why_it_matters = %s,
            key_facts      = %s,
            related_context = %s
        WHERE id = %s
    """, (
        data.get("summary"),
        data.get("why_it_matters"),
        json.dumps(data.get("key_facts", [])),
        data.get("related_context"),
        article_id
    ))
    conn.commit()
    cur.close()
    conn.close()


def main():
    parser = argparse.ArgumentParser(description="Reprocess existing articles with new Reuters-style prompts")
    parser.add_argument("--min-score", type=int, default=70, help="Minimum signal_score to reprocess (default: 70)")
    parser.add_argument("--limit", type=int, default=0, help="Max articles to process (0 = no limit)")
    args = parser.parse_args()

    print("\n" + "=" * 70)
    print("  MONTRIDGE REPROCESSOR — Reuters-style prompt rewrite")
    print("=" * 70)
    print(f"  Min signal score : {args.min_score}")
    print(f"  Article cap      : {'none' if args.limit == 0 else args.limit}")
    print(f"  Model            : {MODEL}")
    print(f"  Start time       : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70 + "\n")

    total_eligible = count_articles(args.min_score)
    total_target = min(total_eligible, args.limit) if args.limit > 0 else total_eligible
    print(f">> {total_eligible} eligible articles (signal_score >= {args.min_score})")
    print(f">> Will process: {total_target}\n")

    processed = 0
    failed = 0
    offset = 0

    while True:
        batch = fetch_articles(args.min_score, BATCH_SIZE, offset)
        if not batch:
            break
        if args.limit > 0 and processed >= args.limit:
            break

        print(f"── Batch offset {offset} ({len(batch)} articles) ──")

        for row in batch:
            if args.limit > 0 and processed >= args.limit:
                break

            article_id = row['id']
            title = row['title'] or ''
            summary = row['summary'] or ''
            safe_title = title[:65] + '…' if len(title) > 65 else title

            pct = f"{(processed / total_target * 100):.1f}%" if total_target else '?'
            print(f"  [{processed + 1}/{total_target}] ({pct}) #{article_id}: {safe_title}")

            result = call_groq(title, summary)
            if result:
                try:
                    update_article(article_id, result)
                    processed += 1
                    print(f"    [OK]")
                except Exception as e:
                    failed += 1
                    print(f"    [DB ERROR] {e}")
            else:
                failed += 1
                print(f"    [SKIP] API returned nothing")

            time.sleep(SLEEP_SECONDS)

        offset += BATCH_SIZE
        if len(batch) < BATCH_SIZE:
            break

    print("\n" + "=" * 70)
    print("  REPROCESS COMPLETE")
    print("=" * 70)
    print(f"  Processed : {processed}")
    print(f"  Failed    : {failed}")
    print(f"  End time  : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    main()
