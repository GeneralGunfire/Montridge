import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from montridge_flask.auth import hash_password, verify_password, create_jwt_token, decode_jwt_token, extract_token_from_header, require_auth
from montridge_flask.db import (
    fetch_articles, fetch_article_by_id, get_connection, fetch_trending_topics,
    fetch_daily_briefs, fetch_breaking_news, fetch_stats, fetch_feed_health,
    fetch_source_credibility, clean_old_articles, get_story_perspectives, get_perspectives_available,
    get_active_conflicts, fetch_last_pipeline_run, get_map_events,
    create_bookmarks_table, add_bookmark, remove_bookmark, get_bookmarks_for_user,
    add_display_name_column, create_user_preferences_table,
    get_user_profile, get_user_preferences, upsert_user_preferences, delete_user_data
)
from subprocess import run as subprocess_run
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get the absolute path to the montridge_flask directory for serving static files
MONTRIDGE_FLASK_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__, static_folder='newlandingpage/dist', static_url_path='')

# Configure CORS for React frontend
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:3000",      # Local development
            "http://localhost:5173",      # Vite dev server
            "http://127.0.0.1:3000",     # Localhost alternative
            "http://127.0.0.1:5173",     # Localhost Vite
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True,
        "max_age": 3600
    }
})

# Configure rate limiter
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

# === SERVE LANDING PAGE ===
@app.route("/")
def index():
    return send_from_directory(os.path.join(MONTRIDGE_FLASK_DIR, 'newlandingpage/dist'), 'index.html')

# === SERVE LOGIN APP ===
@app.route('/login')
@app.route('/login/')
def login_page():
    return send_from_directory(os.path.join(MONTRIDGE_FLASK_DIR, 'login-app/dist'), 'index.html')

@app.route('/login/<path:filename>')
def serve_login_assets(filename):
    return send_from_directory(os.path.join(MONTRIDGE_FLASK_DIR, 'login-app/dist'), filename)

# === SERVE DASHBOARD APP ===
@app.route('/dashboard')
@app.route('/dashboard/')
def dashboard_page():
    return send_from_directory(os.path.join(MONTRIDGE_FLASK_DIR, 'newdashboard/dist'), 'index.html')

# === SERVE ARTICLE DETAIL PAGE (same React app, different URL) ===
@app.route('/article/<int:article_id>')
def article_detail_page(article_id):
    return send_from_directory(os.path.join(MONTRIDGE_FLASK_DIR, 'newdashboard/dist'), 'index.html')

@app.route('/dashboard/<path:filename>')
def serve_dashboard_assets(filename):
    return send_from_directory(os.path.join(MONTRIDGE_FLASK_DIR, 'newdashboard/dist'), filename)

# === SERVE ONBOARDING APP ===
@app.route('/onboarding')
@app.route('/onboarding/')
def onboarding():
    return send_from_directory(os.path.join(MONTRIDGE_FLASK_DIR, 'onboarding/dist'), 'index.html')

@app.route('/onboarding/<path:filename>')
def onboarding_static(filename):
    return send_from_directory(os.path.join(MONTRIDGE_FLASK_DIR, 'onboarding/dist'), filename)

# === SERVE SETTINGS APP ===
@app.route('/settings')
@app.route('/settings/')
def settings():
    return send_from_directory(os.path.join(MONTRIDGE_FLASK_DIR, 'settings/dist'), 'index.html')

@app.route('/settings/<path:filename>')
def settings_static(filename):
    return send_from_directory(os.path.join(MONTRIDGE_FLASK_DIR, 'settings/dist'), filename)

# === SERVE INTELLIGENCE (ARTICLE DETAIL) APP ===
@app.route('/intelligence/<int:article_id>')
def intelligence(article_id):
    return send_from_directory(os.path.join(MONTRIDGE_FLASK_DIR, 'intelligence/dist'), 'index.html')

@app.route('/intelligence/<path:filename>')
def intelligence_static(filename):
    return send_from_directory(os.path.join(MONTRIDGE_FLASK_DIR, 'intelligence/dist'), filename)

# === SERVE MAP PAGE ===
@app.route('/map')
@app.route('/map/')
def map_page():
    return send_from_directory(os.path.join(MONTRIDGE_FLASK_DIR, 'map'), 'index.html')

@app.route('/map/<path:filename>')
def map_static(filename):
    return send_from_directory(os.path.join(MONTRIDGE_FLASK_DIR, 'map'), filename)

# === SERVE PAGENOTFOUND STATIC ASSETS ===
@app.route('/pagenotfound/<path:filename>')
def pagenotfound_static(filename):
    return send_from_directory(os.path.join(MONTRIDGE_FLASK_DIR, 'pagenotfound/dist'), filename)

# === 404 ERROR HANDLER ===
@app.errorhandler(404)
def not_found(e):
    return send_from_directory(os.path.join(MONTRIDGE_FLASK_DIR, 'pagenotfound/dist'), 'index.html'), 404

# === ARTICLES API ===
@app.route("/api/articles")
@limiter.limit("30 per minute")
def get_articles():
    try:
        category = request.args.get('category')
        search = request.args.get('search')
        importance = request.args.get('importance')
        sentiment = request.args.get('sentiment')
        source = request.args.get('source')
        days = int(request.args.get('days', 7))
        limit = int(request.args.get('limit', 20))
        offset = int(request.args.get('offset', 0))

        min_score = request.args.get('min_score', type=int)
        articles = fetch_articles(
            category=category, search=search, importance=importance,
            sentiment=sentiment, source=source, days=days, limit=limit, offset=offset,
            min_score=min_score
        )
        articles_list = [dict(article) for article in articles] if articles else []
        return jsonify(articles_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/article/<int:article_id>")
@limiter.limit("30 per minute")
def get_article(article_id):
    try:
        article = fetch_article_by_id(article_id)
        if article:
            return jsonify(dict(article))
        return jsonify({"error": "Not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/article/<int:article_id>/perspectives")
@limiter.limit("20 per minute")
def get_article_perspectives(article_id):
    try:
        perspectives = get_story_perspectives(article_id)
        return jsonify(perspectives)
    except Exception as e:
        return jsonify({"error": str(e), "has_perspectives": False}), 500

@app.route("/api/perspectives-available")
@limiter.limit("10 per minute")
def perspectives_available():
    try:
        result = get_perspectives_available()
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e), "article_ids_with_perspectives": [], "total": 0}), 500

# === DASHBOARD ENDPOINTS ===

@app.route("/api/status")
@limiter.limit("60 per minute")
def get_status():
    try:
        last_fetched_at = fetch_last_pipeline_run()
        return jsonify({"last_fetched_at": last_fetched_at})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/trending-topics")
@limiter.limit("20 per minute")
def get_trending_topics():
    try:
        topics = fetch_trending_topics()
        return jsonify({"topics": topics})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/daily-brief")
@limiter.limit("20 per minute")
def get_daily_brief():
    try:
        briefs, is_yesterday = fetch_daily_briefs()
        return jsonify({"briefs": briefs, "is_yesterday": is_yesterday})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/market-data")
@limiter.limit("20 per minute")
def get_market_data():
    try:
        # TODO: replace with real financial API (Alpha Vantage free tier or Yahoo Finance) once ready
        market_data = {
            "markets": [
                {
                    "name": "S&P 500",
                    "symbol": "SPX",
                    "current": 5832.14,
                    "change_percent": 1.24,
                    "direction": "up",
                    "sparkline": [5701, 5723, 5698, 5745, 5780, 5801, 5832]
                },
                {
                    "name": "WTI Crude Oil",
                    "symbol": "WTI",
                    "current": 103.40,
                    "change_percent": -0.87,
                    "direction": "down",
                    "sparkline": [108, 106, 105, 104, 105, 103, 103]
                },
                {
                    "name": "USD Index",
                    "symbol": "DXY",
                    "current": 104.22,
                    "change_percent": 0.31,
                    "direction": "up",
                    "sparkline": [103, 103, 104, 103, 104, 104, 104]
                }
            ],
            "last_updated": "mock data",
            "note": "Live market data coming soon"
        }
        return jsonify(market_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/search")
@limiter.limit("30 per minute")
def search_articles():
    try:
        q = request.args.get('q', '').strip()
        limit = int(request.args.get('limit', 20))
        if not q:
            return jsonify([])
        articles = fetch_articles(search=q, limit=limit)
        articles_list = [dict(a) for a in articles] if articles else []
        return jsonify(articles_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/map-events")
@limiter.limit("30 per minute")
def api_map_events():
    try:
        events = get_map_events()
        return jsonify({"events": events})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/conflicts")
@limiter.limit("20 per minute")
def get_conflicts():
    try:
        conflicts = get_active_conflicts()
        return jsonify({"conflicts": conflicts})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/breaking-news")
@limiter.limit("20 per minute")
def get_breaking_news():
    try:
        breaking = fetch_breaking_news()
        return jsonify({"breaking": breaking})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/stats")
@limiter.limit("20 per minute")
def get_stats():
    try:
        stats = fetch_stats()
        return jsonify(stats)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/feed-health")
@limiter.limit("10 per minute")
def get_feed_health():
    try:
        health = fetch_feed_health()
        return jsonify(health)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/source-credibility")
@limiter.limit("10 per minute")
def get_source_credibility():
    try:
        sources = fetch_source_credibility()
        return jsonify({"sources": sources})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/pipeline/trigger", methods=["POST"])
@limiter.limit("1 per minute")
def trigger_pipeline():
    try:
        try:
            result = subprocess_run(
                ["python", "backend/run_pipeline.py"],
                capture_output=True,
                text=True,
                timeout=300
            )

            output = result.stdout + result.stderr if result.stderr else result.stdout

            return jsonify({
                "status": "completed",
                "return_code": result.returncode,
                "output": output
            }), 200
        except subprocess_run.TimeoutExpired:
            return jsonify({"error": "Pipeline execution timed out"}), 504
        except Exception as e:
            return jsonify({"error": f"Pipeline execution failed: {str(e)}"}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# === AUTH: SIGNUP ===
@app.route("/api/auth/signup", methods=["POST"])
@limiter.limit("5 per minute")
def signup():
    try:
        data = request.json
        email = data.get("email", "").strip()
        password = data.get("password", "")
        name = data.get("name", "User")

        if not email or not password:
            return jsonify({"error": "Email and password required"}), 400
        if len(password) < 6:
            return jsonify({"error": "Password must be at least 6 characters"}), 400
        if '@' not in email:
            return jsonify({"error": "Invalid email format"}), 400

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"error": "Email already registered"}), 409

        password_hash = hash_password(password)
        cursor.execute(
            "INSERT INTO users (email, password_hash, name) VALUES (%s, %s, %s) RETURNING id",
            (email, password_hash, name)
        )
        user_id = cursor.fetchone()[0]
        conn.commit()
        cursor.close()
        conn.close()

        token = create_jwt_token(user_id, email)
        return jsonify({"token": token, "user_id": user_id, "email": email}), 201
    except Exception as e:
        print(f"Signup error: {e}")
        return jsonify({"error": "Signup failed"}), 500

# === AUTH: LOGIN ===
@app.route("/api/auth/login", methods=["POST"])
@limiter.limit("5 per minute")
def login():
    try:
        data = request.json
        email = data.get("email", "").strip()
        password = data.get("password", "")

        if not email or not password:
            return jsonify({"error": "Email and password required"}), 400

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, password_hash, name FROM users WHERE email = %s",
            (email,)
        )
        user = cursor.fetchone()
        cursor.close()
        conn.close()

        if not user:
            return jsonify({"error": "Invalid email or password"}), 401

        user_id, password_hash, name = user
        if not verify_password(password, password_hash):
            return jsonify({"error": "Invalid email or password"}), 401

        token = create_jwt_token(user_id, email)
        return jsonify({"token": token, "user_id": user_id, "email": email, "name": name}), 200
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({"error": "Login failed"}), 500

# === AUTH: VERIFY TOKEN ===
@app.route("/api/auth/verify", methods=["POST"])
@limiter.limit("10 per minute")
def verify_token():
    try:
        token = extract_token_from_header(request.headers)
        if not token:
            return jsonify({"valid": False}), 401
        payload = decode_jwt_token(token)
        if not payload:
            return jsonify({"valid": False}), 401
        return jsonify({"valid": True, "user_id": payload['user_id'], "email": payload['email']}), 200
    except Exception as e:
        return jsonify({"valid": False}), 500
    
# === AUTH: LOGOUT ===
@app.route("/api/auth/logout", methods=["POST"])
@limiter.limit("10 per minute")
@require_auth
def logout():
    try:
        return jsonify({"status": "logged out successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# === BOOKMARKS API ===

# Ensure tables exist at startup
try:
    create_bookmarks_table()
except Exception as _e:
    print(f"[WARNING] Could not create bookmarks table: {_e}")

try:
    create_user_preferences_table()
except Exception as _e:
    print(f"[WARNING] Could not create user_preferences table: {_e}")

try:
    add_display_name_column()
except Exception as _e:
    print(f"[WARNING] Could not add display_name column: {_e}")

@app.route("/api/bookmarks", methods=["POST"])
@limiter.limit("30 per minute")
@require_auth
def post_bookmark():
    try:
        data = request.json
        article_id = data.get("article_id") if data else None
        if not article_id:
            return jsonify({"error": "article_id required"}), 400
        result = add_bookmark(request.user_id, int(article_id))
        if result is None:
            return jsonify({"status": "already bookmarked"}), 409
        return jsonify({"status": "bookmarked"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/bookmarks/<int:article_id>", methods=["DELETE"])
@limiter.limit("30 per minute")
@require_auth
def delete_bookmark(article_id):
    try:
        remove_bookmark(request.user_id, article_id)
        return jsonify({"status": "removed"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/bookmarks", methods=["GET"])
@limiter.limit("30 per minute")
@require_auth
def get_bookmarks():
    try:
        bookmarks = get_bookmarks_for_user(request.user_id)
        return jsonify([dict(b) for b in bookmarks])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# === PROFILE API ===
@app.route("/api/profile", methods=["GET"])
@limiter.limit("30 per minute")
@require_auth
def get_profile():
    try:
        row = get_user_profile(request.user_id)
        if not row:
            return jsonify({"error": "User not found"}), 404
        email, display_name = row
        topics, expertise_level = get_user_preferences(request.user_id)
        return jsonify({
            "user_id": request.user_id,
            "email": email,
            "display_name": display_name or '',
            "displayName": display_name or '',
            "topics": topics,
            "expertise_level": expertise_level
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# === PREFERENCES API ===
@app.route("/api/preferences", methods=["GET"])
@limiter.limit("30 per minute")
@require_auth
def get_preferences():
    try:
        topics, expertise_level = get_user_preferences(request.user_id)
        return jsonify({"topics": topics, "expertise_level": expertise_level}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/preferences", methods=["POST"])
@limiter.limit("30 per minute")
@require_auth
def post_preferences():
    try:
        data = request.json or {}
        topics = data.get("topics", [])
        expertise_level = data.get("expertise_level", "Standard")
        if not isinstance(topics, list):
            topics = []
        upsert_user_preferences(request.user_id, topics, expertise_level)
        return jsonify({"status": "saved"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# === AUTH: CHANGE PASSWORD ===
@app.route("/api/auth/change-password", methods=["POST"])
@limiter.limit("5 per minute")
@require_auth
def change_password():
    try:
        data = request.json or {}
        # Accept 'password' (from settings UI) or 'new_password'
        new_password = data.get("password") or data.get("new_password", "")
        if not new_password or len(new_password) < 6:
            return jsonify({"error": "Password must be at least 6 characters"}), 400
        new_hash = hash_password(new_password)
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE users SET password_hash = %s WHERE id = %s",
            (new_hash, request.user_id)
        )
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"status": "password updated"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# === AUTH: DELETE ACCOUNT ===
@app.route("/api/auth/account", methods=["DELETE"])
@limiter.limit("3 per minute")
@require_auth
def delete_account():
    try:
        delete_user_data(request.user_id)
        return jsonify({"status": "account deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# === START SERVER ===
if __name__ == "__main__":
    app.run(debug=True)