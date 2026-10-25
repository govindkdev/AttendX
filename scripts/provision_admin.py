#!/usr/bin/env python3
import sys
import os
import argparse
import asyncio
import getpass

# Add backend directory to path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
sys.path.insert(0, backend_dir)

from app.core.provision import init_database_tables, provision_initial_settings, provision_administrator
from app.db.session import AsyncSessionLocal

async def main():
    parser = argparse.ArgumentParser(description="Provision AttendX Initial Administrator")
    parser.add_argument("--admin-id", default="ADM-001", help="Administrator ID (default: ADM-001)")
    parser.add_argument("--name", default="Govind Kushwaha", help="Administrator Full Name")
    parser.add_argument("--email", default="admin@gcrg.edu.in", help="Administrator Email")
    parser.add_argument("--password", help="Administrator Initial Password (will prompt securely if not given)")

    args = parser.parse_args()

    password = args.password
    if not password:
        env_pwd = os.environ.get("INITIAL_ADMIN_PASSWORD")
        if env_pwd:
            password = env_pwd
        else:
            password = getpass.getpass("Enter Initial Administrator Password: ")

    if not password or len(password) < 8:
        print("Error: Password must be at least 8 characters long.")
        sys.exit(1)

    print("Initializing database tables...")
    await init_database_tables()

    async with AsyncSessionLocal() as session:
        print("Ensuring institute settings and geofence configuration...")
        await provision_initial_settings(session)

        print(f"Provisioning administrator '{args.admin_id}' ({args.name})...")
        success, message, admin = await provision_administrator(
            admin_id=args.admin_id,
            admin_name=args.name,
            admin_email=args.email,
            password=password,
            session=session
        )

        if success:
            print(f"[SUCCESS] {message}")
            print("Note: First-time login will require a password change before accessing admin capabilities.")
        else:
            print(f"[INFO/ERROR] {message}")

if __name__ == "__main__":
    asyncio.run(main())
