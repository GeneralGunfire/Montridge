#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Montridge AI Processor - Process articles with Groq API (Dual-Key System)
Handles Unicode properly, manages rate limiting, and enhances critical stories.
"""

import os
import sys
import io
import json
import time
import psycopg2
import requests
from datetime import datetime

# FIX: Force UTF-8 encoding on Windows (prevents Unicode crashes)
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# --- GROQ API SETUP (DUAL KEYS FOR 200K TOKENS/DAY) ---
API_KEYS = [
]
CURRENT_KEY_INDEX = 0
MODEL = "llama-3.3-70b-versatile"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

# --- DATABASE SETUP ---
DB_CONFIG = {
    'dbname': 'montridge_db',
    'user': 'postgres',
    'host': 'localhost',
    'port': 5432
}

# --- PROCESSING CONFIG ---
BATCH_SIZE = 20
SLEEP_SECONDS = 1
ENHANCEMENT_THRESHOLD = 85


def get_current_headers():
    """Get headers with current API key."""
    return {
        "Authorization": f"Bearer {API_KEYS[CURRENT_KEY_INDEX]}",
        "Content-Type": "application/json"
    }


def switch_api_key():
    """Switch to next API key when rate limit hit."""
    global CURRENT_KEY_INDEX
    old_index = CURRENT_KEY_INDEX
    CURRENT_KEY_INDEX = (CURRENT_KEY_INDEX + 1) % len(API_KEYS)
    print(f"   >> Switching from Key {old_index + 1} to Key {CURRENT_KEY_INDEX + 1}")
    return CURRENT_KEY_INDEX


def get_unprocessed_articles():
    """Fetch articles that haven't been processed yet."""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        query = """
            SELECT id, title, summary, published_date 
            FROM articles 
            WHERE processed_at IS NULL 
            ORDER BY fetched_at DESC 
            LIMIT %s
        """
        cursor.execute(query, (BATCH_SIZE,))
        articles = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return articles
    except Exception as e:
        print(f"   [ERROR] Database error: {e}")
        return []


def get_articles_needing_enhancement():
    """Get high-importance articles that need detailed enhancement.
    
    STRICT CRITERIA:
    - Signal score >= 85 (truly critical)
    - Must be conflict, military, or major incident (not just high-scoring)
    - Recent articles only (last 48 hours)
    - Maximum 5 articles per run (expensive operation)
    """
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # STRICT query: Only articles about conflicts, military ops, major incidents
        query = """
            SELECT id, title, summary, why_it_matters, categories, 
                   entities, related_context, signal_score, source
            FROM articles
            WHERE signal_score >= %s
            AND processed_at IS NOT NULL
            AND detailed_summary IS NULL
            AND (
                -- Must contain conflict/military keywords in title or categories
                title ILIKE '%%war%%' OR
                title ILIKE '%%attack%%' OR
                title ILIKE '%%strike%%' OR
                title ILIKE '%%conflict%%' OR
                title ILIKE '%%military%%' OR
                title ILIKE '%%missile%%' OR
                title ILIKE '%%drone%%' OR
                title ILIKE '%%bombing%%' OR
                title ILIKE '%%explosion%%' OR
                title ILIKE '%%casualties%%' OR
                title ILIKE '%%killed%%' OR
                title ILIKE '%%death%%' OR
                title ILIKE '%%assassination%%' OR
                title ILIKE '%%crisis%%' OR
                title ILIKE '%%emergency%%' OR
                'Conflicts' = ANY(categories) OR
                'Disasters' = ANY(categories)
            )
            AND published_date > NOW() - INTERVAL '48 hours'
            ORDER BY signal_score DESC, published_date DESC
            LIMIT 5
        """
        
        cursor.execute(query, (ENHANCEMENT_THRESHOLD,))
        articles = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return articles
    except Exception as e:
        print(f"   [ERROR] Database error: {e}")
        return []


def call_groq_api(article_title, article_summary, retry_count=0):
    """
    Send article to Groq API with automatic key rotation on rate limit.
    """
    
    prompt = f"""Analyze this news article and return a structured JSON response.

Article Title: {article_title}
Article Summary: {article_summary or "No summary available"}

Return ONLY valid JSON with NO markdown formatting, NO code fences, NO explanation text. Just pure JSON.

WRITING RULES — enforce on every text field:
- Wire service style: Reuters or AP. State what happened, who did it, what the direct result is.
- Every sentence must contain at least one concrete fact: a number, a name, a location, a date, a percentage, or a direct consequence.
- Maximum 25 words per sentence.
- No filler phrases: never write "far-reaching consequences", "it is crucial", "significant implications", "it is worth noting", "this highlights", "in the region", "at this time".
- No adjectives without facts: not "significant", "major", "notable", "critical", "important" unless followed by a specific number or name.
- Never editorialize: do not write "concerning", "worrying", "a disaster", "unprecedented" unless a named source said so.

{{
  "summary": "2-3 sentences. State: what happened, who was involved, what the immediate result is. No background, no speculation. Example: 'Iran fired ballistic missiles at three US bases in Iraq on March 15, killing four soldiers. The Pentagon confirmed the attack and said retaliatory strikes were under consideration. Oil prices rose 8% to $112 per barrel within two hours.'",
  "why_it_matters": "2-3 sentences. State the direct, concrete consequence for ordinary people or the world. Answer: who is affected, how, by how much if known. Example: 'Higher oil prices mean petrol costs more within days. Countries that import most of their oil — including India, Japan, and most of Europe — face the biggest immediate impact. A sustained conflict could push prices above $120, triggering broader inflation.'",
  "categories": ["pick 1-3 from: Politics, Tech, Business, Health, Science, Environment, Sports, Entertainment, Conflicts, Disasters, Education, Culture"],
  "entities": {{
    "people": ["Full Name1", "Full Name2"],
    "organizations": ["Org1", "Org2"],
    "places": ["Place1", "Place2"]
  }},
  "key_facts": ["Verifiable fact with number/name/date/location — no interpretive statements", "Fact 2", "Fact 3"],
  "sentiment": "positive OR negative OR neutral",
  "signal_score": 75,
  "importance": "high OR medium OR low",
  "related_context": "1-2 sentences of factual background only. Specific dates and prior events. No opinion.",
  "bias_indicators": {{
    "emotional_language": true,
    "one_sided": false,
    "has_quotes": true,
    "has_data": false
  }}
}}

SIGNAL SCORE RULES:
SCORE 95-100: Wars, nuclear incidents, assassinations, terrorism (50+ deaths), pandemics, coups
SCORE 90-94: Major military escalations, airstrikes, terrorism (10-50 deaths), major political assassinations
SCORE 85-89: Military ops, sanctions, major scandals, infrastructure failures, major diplomatic incidents
SCORE 75-84: National elections, major protests, corporate M&A ($10B+), major policy changes, major tech breakthroughs
SCORE 60-74: Regional politics, business news, moderate protests, weather, major sports/cultural events
SCORE 45-59: Local politics, earnings reports, celebrity news with business angle, routine announcements
SCORE 30-44: Local news, minor celebrity gossip, lifestyle, sports results
SCORE 0-29: Entertainment, gossip, fashion, app reviews, minor local events

BE AGGRESSIVE: War/conflict/attack/military = 85+. Ongoing conflicts (Ukraine, Iran, Israel, Gaza) = 90+.

Return ONLY the JSON object. NO other text."""

    data = {
        "model": MODEL,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 2000
    }
    
    try:
        headers = get_current_headers()
        response = requests.post(GROQ_URL, headers=headers, json=data, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        raw_text = result['choices'][0]['message']['content']
        parsed_json = extract_json(raw_text)
        
        return parsed_json
        
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 429 and retry_count < len(API_KEYS):
            print(f"   [WARNING] Rate limit on Key {CURRENT_KEY_INDEX + 1}")
            switch_api_key()
            print(f"   >> Retrying with Key {CURRENT_KEY_INDEX + 1}...")
            time.sleep(2)
            return call_groq_api(article_title, article_summary, retry_count + 1)
        else:
            print(f"   [ERROR] Groq API error: {e}")
            return None
    except Exception as e:
        print(f"   [ERROR] API call failed: {e}")
        return None


def generate_enhanced_content(article, retry_count=0):
    """Generate detailed summary, enhanced background, and expanded impact for critical stories."""
    article_id, title, summary, why_it_matters, categories, entities, related_context, signal_score, source = article
    
    categories_str = ', '.join(categories) if categories else 'General'
    
    if isinstance(entities, str):
        try:
            entities = json.loads(entities)
        except:
            entities = {}
    
    people = ', '.join(entities.get('people', [])) if entities else 'N/A'
    organizations = ', '.join(entities.get('organizations', [])) if entities else 'N/A'
    places = ', '.join(entities.get('places', [])) if entities else 'N/A'
    
    prompt = f"""Generate deep factual analysis for this critical news story (Signal Score: {signal_score}/100).

ARTICLE INFORMATION:
Title: {title}
Source: {source}
Categories: {categories_str}
Brief Summary: {summary}
Why It Matters: {why_it_matters}
Background Context: {related_context}
Key People: {people}
Key Organizations: {organizations}
Key Places: {places}

WRITING RULES — apply to every sentence in every field:
- Wire service style: Reuters or AP. State what happened, who did it, what the direct result is.
- Every sentence must contain at least one concrete fact: a number, a name, a location, a date, a percentage, or a direct consequence.
- Maximum 25 words per sentence.
- No filler phrases: never write "far-reaching consequences", "it is crucial", "significant implications", "it is worth noting", "this highlights", "in the region", "at this time".
- No adjectives without facts: not "significant", "major", "notable", "critical", "important" unless followed by a specific number or name.
- Never editorialize: do not write "concerning", "worrying", "a disaster", "unprecedented" unless a named source said so.

Generate THREE sections:

1. DETAILED_SUMMARY (5-6 sentences):
   Covers: what happened, who, where, when, immediate consequences, key numbers.
   Each sentence = one fact-dense statement. No background, no speculation.

2. ENHANCED_BACKGROUND (4-5 sentences):
   Timeline of how this situation developed. Specific dates and events only.
   Each sentence = one dated event or measurable development. No opinion.

3. EXPANDED_IMPACT (5-6 sentences):
   Concrete effects across different domains. Each sentence = one domain + one specific consequence.
   Domains to cover: economic, military, diplomatic, humanitarian.
   Use numbers where possible (prices, troop counts, casualty figures, percentage changes).

Return ONLY valid JSON:
{{
  "detailed_summary": "...",
  "enhanced_background": "...",
  "expanded_impact": "..."
}}

No markdown, no code fences."""

    data = {
        "model": MODEL,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 2500
    }
    
    try:
        headers = get_current_headers()
        response = requests.post(GROQ_URL, headers=headers, json=data, timeout=40)
        response.raise_for_status()
        
        result = response.json()
        raw_text = result['choices'][0]['message']['content']
        enhanced_data = extract_json(raw_text)
        
        return {
            'detailed_summary': enhanced_data.get('detailed_summary', ''),
            'enhanced_background': enhanced_data.get('enhanced_background', ''),
            'expanded_impact': enhanced_data.get('expanded_impact', '')
        }
        
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 429 and retry_count < len(API_KEYS):
            print(f"   [WARNING] Rate limit on Key {CURRENT_KEY_INDEX + 1}")
            switch_api_key()
            print(f"   >> Retrying enhancement with Key {CURRENT_KEY_INDEX + 1}...")
            time.sleep(2)
            return generate_enhanced_content(article, retry_count + 1)
        else:
            print(f"   [ERROR] Enhancement failed: {e}")
            return None
    except Exception as e:
        print(f"   [ERROR] Enhancement error: {str(e)}")
        return None


def extract_json(text):
    """Extract and parse JSON from AI response, handling markdown fences."""
    try:
        text = text.strip()
        
        # Remove markdown fences
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        
        text = text.strip()
        
        # Find JSON object boundaries
        start = text.find('{')
        end = text.rfind('}')
        
        if start != -1 and end != -1:
            json_str = text[start:end+1]
            return json.loads(json_str)
        else:
            raise ValueError("No JSON object found")
            
    except Exception as e:
        print(f"   [WARNING] JSON parsing error: {e}")
        # Return safe defaults
        return {
            "summary": "Summary unavailable",
            "why_it_matters": "Impact analysis pending",
            "categories": ["Uncategorized"],
            "entities": {"people": [], "organizations": [], "places": []},
            "key_facts": [],
            "sentiment": "neutral",
            "signal_score": 50,
            "importance": "medium",
            "related_context": "Context unavailable",
            "bias_indicators": {
                "emotional_language": False,
                "one_sided": False,
                "has_quotes": False,
                "has_data": False
            }
        }


def update_article(article_id, ai_data):
    """Write AI-generated fields back to database."""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        update_query = """
            UPDATE articles 
            SET 
                summary = %s,
                why_it_matters = %s,
                categories = %s,
                entities = %s,
                key_facts = %s,
                sentiment = %s,
                signal_score = %s,
                importance = %s,
                related_context = %s,
                bias_indicators = %s,
                processed_at = %s,
                processing_error = NULL
            WHERE id = %s
        """
        
        cursor.execute(update_query, (
            ai_data.get("summary"),
            ai_data.get("why_it_matters"),
            ai_data.get("categories"),
            json.dumps(ai_data.get("entities")),
            json.dumps(ai_data.get("key_facts")),
            ai_data.get("sentiment"),
            ai_data.get("signal_score"),
            ai_data.get("importance"),
            ai_data.get("related_context"),
            json.dumps(ai_data.get("bias_indicators")),
            datetime.now(),
            article_id
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"   [ERROR] Database update failed: {e}")
        return False


def update_article_enhancement(article_id, enhanced_data):
    """Update article with detailed enhancement fields."""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        query = """
        UPDATE articles
        SET detailed_summary = %s,
            enhanced_background = %s,
            expanded_impact = %s
        WHERE id = %s
        """
        
        cursor.execute(query, (
            enhanced_data['detailed_summary'],
            enhanced_data['enhanced_background'],
            enhanced_data['expanded_impact'],
            article_id
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"   [ERROR] Enhancement update failed: {e}")
        return False


def mark_error(article_id, error_message):
    """Mark article as failed processing."""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        cursor.execute(
            "UPDATE articles SET processing_error = %s, processed_at = %s WHERE id = %s",
            (str(error_message)[:500], datetime.now(), article_id)
        )
        
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"   [ERROR] Could not mark error: {e}")


def main():
    """Main processing loop - basic processing + enhancement for critical stories."""
    print("\n" + "="*70)
    print("  MONTRIDGE AI PROCESSOR (GROQ DUAL-KEY SYSTEM)")
    print("="*70)
    print(f">> Start time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f">> Using model: {MODEL}")
    print(f">> API Keys available: {len(API_KEYS)}")
    print(f">> Batch size: {BATCH_SIZE}")
    print(f">> Sleep between calls: {SLEEP_SECONDS}s")
    print(f">> Enhancement threshold: {ENHANCEMENT_THRESHOLD}+ signal score\n")
    
    # ===== PHASE 1: BASIC PROCESSING =====
    print("="*70)
    print("  PHASE 1: BASIC PROCESSING (All Articles)")
    print("="*70 + "\n")
    
    total_processed = 0
    
    while True:
        articles = get_unprocessed_articles()
        
        if not articles:
            print(f"\n[OK] Basic processing complete! Total: {total_processed} articles\n")
            break
        
        print(f">> Found {len(articles)} unprocessed articles\n")
        
        for article_id, title, summary, pub_date in articles:
            # Safely display title (handle Unicode)
            safe_title = title[:60] if title else "Unknown"
            print(f">> Processing Article #{article_id}: {safe_title}...")
            
            try:
                ai_data = call_groq_api(title, summary)
                
                if ai_data:
                    if update_article(article_id, ai_data):
                        score = ai_data.get("signal_score", 0)
                        print(f"   [OK] Signal Score: {score}/100")
                        total_processed += 1
                    else:
                        print(f"   [WARNING] Failed to update database")
                else:
                    mark_error(article_id, "Groq API returned None")
                    print(f"   [WARNING] Failed - API returned no data")
                
            except Exception as e:
                mark_error(article_id, str(e))
                print(f"   [ERROR] Processing error: {e}")
            
            time.sleep(SLEEP_SECONDS)
        
        print(f"\n>> Batch complete. Total processed so far: {total_processed}")
        print(">> Fetching next batch...\n")
    
    # ===== PHASE 2: ENHANCEMENT =====
    print("="*70)
    print(f"  PHASE 2: ENHANCEMENT (Signal Score >= {ENHANCEMENT_THRESHOLD})")
    print("="*70 + "\n")
    
    articles_to_enhance = get_articles_needing_enhancement()
    enhanced_count = 0
    enhancement_errors = 0
    
    if not articles_to_enhance:
        print("[OK] No critical articles need enhancement right now.\n")
    else:
        print(f">> Found {len(articles_to_enhance)} critical articles to enhance\n")
        
        for article in articles_to_enhance:
            article_id, title, *_ = article
            signal_score = article[7]
            
            safe_title = title[:60] if title else "Unknown"
            print(f">> Enhancing Article #{article_id}: {safe_title}...")
            print(f"   >> Signal Score: {signal_score}/100")
            
            try:
                enhanced_data = generate_enhanced_content(article)
                
                if enhanced_data:
                    if update_article_enhancement(article_id, enhanced_data):
                        enhanced_count += 1
                        print(f"   [OK] Enhanced successfully!")
                    else:
                        enhancement_errors += 1
                        print(f"   [ERROR] Failed to update database")
                else:
                    enhancement_errors += 1
                    print(f"   [ERROR] Enhancement failed")
                
            except Exception as e:
                enhancement_errors += 1
                print(f"   [ERROR] Enhancement error: {e}")
            
            print()
            time.sleep(SLEEP_SECONDS)
        
        print("="*70)
        print(f"[OK] Enhancement phase complete!")
        print(f"   Enhanced: {enhanced_count} articles")
        print(f"   Failed: {enhancement_errors} articles")
        print("="*70 + "\n")
    
    # ===== FINAL SUMMARY =====
    print("="*70)
    print("  PIPELINE COMPLETE")
    print("="*70)
    print(f">> Total articles processed: {total_processed}")
    print(f">> Total articles enhanced: {enhanced_count}")
    print(f">> Final API key used: Key {CURRENT_KEY_INDEX + 1}")
    print(f">> End time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*70)
    print("\n[SUCCESS] All done! Ready for next run in 5 hours.\n")


if __name__ == "__main__":
    main()