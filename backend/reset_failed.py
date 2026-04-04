import psycopg2

conn = psycopg2.connect(
    host="localhost",
    database="montridge_db",
    user="postgres",
    port=5432
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