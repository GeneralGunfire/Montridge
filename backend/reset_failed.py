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

# Reset failed articles
cur.execute("""
    UPDATE articles 
    SET processed_at = NULL, processing_error = NULL 
    WHERE processing_error LIKE '%API key expired%'
""")

affected = cur.rowcount
conn.commit()

print(f"✓ Reset {affected} failed articles")

cur.close()
conn.close()