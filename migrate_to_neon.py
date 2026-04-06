#!/usr/bin/env python3
"""
Database migration script: Local PostgreSQL → Neon
This script exports your local montridge_db and imports it into Neon.
"""

import subprocess
import os
import sys
from dotenv import load_dotenv

load_dotenv()

# Configuration
LOCAL_DB = {
    'dbname': os.environ.get('DB_NAME', 'montridge_db'),
    'user': os.environ.get('DB_USER', 'postgres'),
    'password': os.environ.get('DB_PASSWORD', ''),
    'host': os.environ.get('DB_HOST', 'localhost'),
    'port': os.environ.get('DB_PORT', '5432'),
}

NEON_URL = os.environ.get('DATABASE_URL')
BACKUP_FILE = 'montridge_backup.sql'

def run_command(cmd, description):
    """Run a command and report status"""
    print(f"\n📌 {description}")
    print(f"   Command: {cmd[:100]}...")
    try:
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
        print(f"   ✅ Success")
        if result.stdout:
            print(f"   Output: {result.stdout[:200]}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"   ❌ Failed: {e.stderr}")
        return False

def export_local_database():
    """Export local database to SQL file"""
    password_arg = f"PGPASSWORD='{LOCAL_DB['password']}'" if LOCAL_DB['password'] else "PGPASSWORD=''"
    cmd = (
        f"{password_arg} pg_dump "
        f"-U {LOCAL_DB['user']} "
        f"-h {LOCAL_DB['host']} "
        f"-p {LOCAL_DB['port']} "
        f"{LOCAL_DB['dbname']} > {BACKUP_FILE}"
    )
    return run_command(cmd, f"Exporting local database '{LOCAL_DB['dbname']}'")

def import_to_neon():
    """Import SQL file to Neon"""
    if not os.path.exists(BACKUP_FILE):
        print(f"❌ Backup file not found: {BACKUP_FILE}")
        return False

    file_size = os.path.getsize(BACKUP_FILE)
    print(f"   Backup file size: {file_size:,} bytes")

    if file_size == 0:
        print("   ⚠️  Warning: Backup file is empty!")
        return False

    cmd = f"psql '{NEON_URL}' < {BACKUP_FILE}"
    return run_command(cmd, f"Importing to Neon database")

def verify_neon():
    """Verify data in Neon"""
    cmd = f"psql '{NEON_URL}' -c 'SELECT COUNT(*) as article_count FROM articles;'"
    return run_command(cmd, "Verifying Neon import")

def main():
    print("🚀 Montridge Database Migration to Neon")
    print("=" * 50)

    if not NEON_URL:
        print("❌ ERROR: DATABASE_URL not set in .env file")
        print("   Add your Neon connection string to .env:")
        print("   DATABASE_URL=postgresql://user:password@host/db")
        sys.exit(1)

    print(f"\n📊 Configuration:")
    print(f"   Local: {LOCAL_DB['user']}@{LOCAL_DB['host']}:{LOCAL_DB['port']}/{LOCAL_DB['dbname']}")
    print(f"   Neon: {NEON_URL.split('@')[1].split('/')[0]}")

    print("\n⚙️  Migration Steps:")

    # Step 1: Export
    if not export_local_database():
        print("\n❌ Migration failed at export step")
        sys.exit(1)

    # Step 2: Import
    if not import_to_neon():
        print("\n❌ Migration failed at import step")
        sys.exit(1)

    # Step 3: Verify
    verify_neon()

    print("\n✅ Migration complete!")
    print(f"\n💾 Your local database has been exported to: {BACKUP_FILE}")
    print(f"   (Keep this file as a backup)")
    print(f"\n🔄 The Flask app will use DATABASE_URL from .env")
    print(f"   To test locally: python montridge_flask/app.py")

if __name__ == '__main__':
    main()
