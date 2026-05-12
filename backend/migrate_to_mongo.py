"""
migrate_to_mongo.py
-------------------
One-time script to migrate existing users.json and admins.json
into the MongoDB wastebuddy database.

Run once:  python migrate_to_mongo.py
"""

import json, os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB  = os.environ.get("MONGO_DB",  "wastebuddy")

client     = MongoClient(MONGO_URI)
db         = client[MONGO_DB]
users_col  = db["users"]
admins_col = db["admins"]

# ── Migrate users.json ──────────────────────────────────
if os.path.exists("users.json"):
    with open("users.json") as f:
        users = json.load(f)
    inserted = 0
    for email, info in users.items():
        if not users_col.find_one({"email": email}):
            info["email"] = email
            users_col.insert_one(info)
            inserted += 1
    print(f"[OK] Users migrated: {inserted} new, {len(users)-inserted} already existed.")
else:
    print("[SKIP] users.json not found -- skipping.")

# -- Migrate admins.json -------------------------------------------------
if os.path.exists("admins.json"):
    with open("admins.json") as f:
        admins = json.load(f)
    inserted = 0
    for login_id, info in admins.items():
        if not admins_col.find_one({"login_id": login_id}):
            info["login_id"] = login_id
            admins_col.insert_one(info)
            inserted += 1
    print(f"[OK] Admins migrated: {inserted} new, {len(admins)-inserted} already existed.")
else:
    print("[SKIP] admins.json not found -- skipping.")

print("\n[DONE] Migration complete! You can now start app.py.")
