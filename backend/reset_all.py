import os
import psycopg2

conn = psycopg2.connect(
    host=os.environ.get('DB_HOST', 'localhost'),
    database=os.environ.get('DB_NAME', 'montridge_db'),
    user=os.environ.get('DB_USER', 'postgres'),
    password=os.environ.get('DB_PASSWORD', ''),
    port=int(os.environ.get('DB_PORT', '5432'))
)

cur = conn.cursor()

# Reset ALL articles with errors
cur.execute("""
    UPDATE articles 
    SET processed_at = NULL, processing_error = NULL 
    WHERE processing_error IS NOT NULL
""")

affected = cur.rowcount
conn.commit()

# Check total unprocessed
cur.execute("SELECT COUNT(*) FROM articles WHERE processed_at IS NULL")
count = cur.fetchone()[0]

print(f"✓ Reset {affected} failed articles")
print(f"✓ Total unprocessed articles: {count}")

cur.close()
conn.close()