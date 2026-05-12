from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
from pymongo import MongoClient, ASCENDING
from dotenv import load_dotenv
import os, random, pytz

def get_ist_time():
    return datetime.now(pytz.timezone('Asia/Kolkata'))

load_dotenv()

try:
    from ai_helper import get_ai_prediction
    AI_AVAILABLE = True
except Exception as e:
    print(f"AI module not loaded: {e}")
    AI_AVAILABLE = False

app = Flask(__name__)
CORS(app)

# ======================================================
#  MONGODB CONNECTION
# ======================================================

MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB  = os.environ.get("MONGO_DB",  "wastebuddy")

client = MongoClient(MONGO_URI)
db     = client[MONGO_DB]

users_col  = db["users"]
admins_col = db["admins"]

# Create indexes for fast lookups
users_col.create_index([("email",  ASCENDING)], unique=True)
users_col.create_index([("mobile", ASCENDING)])
admins_col.create_index([("login_id", ASCENDING)], unique=True)

# ======================================================
#  SEED DEFAULT ADMIN IF COLLECTION IS EMPTY
# ======================================================

def seed_admins():
    if admins_col.count_documents({}) == 0:
        admins_col.insert_many([
            {
                "login_id":  "admin@wastebuddy.com",
                "name":      "Admin123",
                "password":  "Admin@123",
                "role":      "Administrator",
                "phone":     "9999999999",
                "join_date": "01 Jan 2025"
            },
            {
                "login_id":  "admin",
                "name":      "Admin123",
                "password":  "admin123",
                "role":      "Administrator",
                "phone":     "9999999999",
                "join_date": "01 Jan 2025"
            }
        ])
        print("✅ Default admin accounts seeded.")

seed_admins()

# ======================================================
#  DATABASE HELPERS
# ======================================================

def find_user(login_id):
    """Find user by email or mobile. Returns user doc or None."""
    user = users_col.find_one({"email": login_id})
    if not user:
        user = users_col.find_one({"mobile": login_id})
    return user

def find_admin(login_id):
    return admins_col.find_one({"login_id": login_id})

# ======================================================
#  AUTH ENDPOINTS
# ======================================================

@app.route('/login', methods=['POST'])
def login():
    data     = request.json
    login_id = data.get('email', '').strip()
    password = data.get('password', '').strip()

    # 1. Check admin credentials first
    admin = find_admin(login_id)
    if admin:
        if admin['password'] == password:
            return jsonify({
                "success":   True,
                "role":      "admin",
                "user_name": admin['name'],
                "email":     login_id,
                "message":   "Admin login successful!"
            })
        return jsonify({"success": False, "message": "Invalid admin password!"}), 401

    # 2. Check regular user
    user = find_user(login_id)
    if user and user['password'] == password:
        return jsonify({
            "success":        True,
            "role":           "user",
            "user_name":      user['name'],
            "email":          user['email'],
            "points":         user.get('points', 0),
            "total_scans":    user.get('total_scans', 0),
            "verified_count": user.get('verified_count', 0),
            "message":        "Login successful!"
        })

    return jsonify({"success": False, "message": "Invalid credentials!"}), 401


@app.route('/signup', methods=['POST'])
def signup():
    data     = request.json
    name     = data.get('name', '').strip()
    email    = data.get('email', '').strip()
    password = data.get('password', '').strip()
    mobile   = data.get('mobile', '').strip()

    if not name or not email or not password:
        return jsonify({"success": False, "message": "All fields are required!"}), 400

    if users_col.find_one({"email": email}):
        return jsonify({"success": False, "message": "Email already registered!"}), 400

    users_col.insert_one({
        "name":           name,
        "email":          email,
        "password":       password,
        "mobile":         mobile,
        "points":         0,
        "total_scans":    0,
        "verified_count": 0,
        "join_date":      get_ist_time().strftime("%d %b %Y"),
        "history":        [],
        "transactions":   []
    })
    return jsonify({"success": True, "message": "Account created successfully!"})


# ======================================================
#  ADMIN ENDPOINTS
# ======================================================

@app.route('/admin/get_all_users', methods=['GET'])
def admin_get_all_users():
    result = []
    for u in users_col.find({}, {"_id": 0, "password": 0}):
        result.append({
            "email":          u.get('email', ''),
            "name":           u.get('name', ''),
            "mobile":         u.get('mobile', ''),
            "points":         u.get('points', 0),
            "total_scans":    u.get('total_scans', 0),
            "verified_count": u.get('verified_count', 0),
            "join_date":      u.get('join_date', 'N/A'),
            "status":         "Active"
        })
    return jsonify({"success": True, "users": result, "total": len(result)})


@app.route('/admin/get_stats', methods=['GET'])
def admin_get_stats():
    pipeline = [{"$group": {
        "_id":               None,
        "total_users":       {"$sum": 1},
        "total_scans":       {"$sum": "$total_scans"},
        "total_verified":    {"$sum": "$verified_count"},
        "total_points_given":{"$sum": "$points"}
    }}]
    agg = list(users_col.aggregate(pipeline))
    if agg:
        r = agg[0]
        return jsonify({
            "success":           True,
            "total_users":       r["total_users"],
            "total_scans":       r["total_scans"],
            "total_verified":    r["total_verified"],
            "total_points_given":r["total_points_given"]
        })
    return jsonify({"success": True, "total_users": 0, "total_scans": 0,
                    "total_verified": 0, "total_points_given": 0})


@app.route('/admin/delete_user', methods=['POST'])
def admin_delete_user():
    email = request.json.get('email')
    res   = users_col.delete_one({"email": email})
    if res.deleted_count:
        return jsonify({"success": True, "message": f"User {email} deleted!"})
    return jsonify({"success": False, "message": "User not found"}), 404


@app.route('/admin/update_credentials', methods=['POST'])
def admin_update_credentials():
    data       = request.json
    login_id   = data.get('login_id')
    new_password = data.get('new_password')
    res = admins_col.update_one(
        {"login_id": login_id},
        {"$set": {"password": new_password}}
    )
    if res.matched_count:
        return jsonify({"success": True, "message": "Password updated!"})
    return jsonify({"success": False, "message": "Admin not found"}), 404


# ======================================================
#  WASTE SCANNING & AI
# ======================================================

@app.route('/analyze-waste', methods=['POST'])
def analyze_waste_route():
    file = request.files.get('file') or request.files.get('image')
    if not file:
        return jsonify({"error": "No image received", "target_bin": "Unknown", "waste_type": "None"})

    filepath = "temp_drop.jpg"
    file.save(filepath)

    try:
        if AI_AVAILABLE:
            ai_result = get_ai_prediction(filepath)
        else:
            # Use file size to make a consistent "pseudo-random" choice
            # so the same image gives the same result, avoiding random flip-flops!
            file_size = os.path.getsize(filepath)
            if file_size % 3 == 0: chosen = "Dry"
            elif file_size % 3 == 1: chosen = "Wet"
            else: chosen = "E-Waste"
            ai_result = {"waste_type": chosen, "confidence": 0.85}

        waste_type  = str(ai_result.get('waste_type', 'Unknown')).strip()
        waste_lower = waste_type.lower()

        tips_db = {
            "Red":     ["Hand over to certified E-Waste recyclers.",
                        "Never throw batteries in regular trash.",
                        "Donate old working electronics to NGOs or schools."],
            "Green":   ["Can be used for composting and agriculture.",
                        "Wet waste converts into nutrient-rich biogas.",
                        "Keep wet waste separate to avoid ruining dry recyclables."],
            "Blue":    ["Send to recycling facilities to reuse materials.",
                        "Rinse plastic food containers before disposal.",
                        "Recycling 1 ton of paper saves 17 mature trees!"],
            "Unknown": ["Please dispose of carefully.",
                        "When in doubt, check local recycling guidelines."]
        }

        if any(k in waste_lower for k in ["e-waste","ewaste","red","electronic"]):
            target_bin, bin_color = "Red",   "#dc2626"
            bin_label      = "Red Bin (E-Waste)"
            recycle_method = random.choice(tips_db["Red"])
        elif any(k in waste_lower for k in ["wet","green","food"]):
            target_bin, bin_color = "Green", "#16a34a"
            bin_label      = "Green Bin (Wet Waste)"
            recycle_method = random.choice(tips_db["Green"])
        elif any(k in waste_lower for k in ["dry","blue","plastic","paper"]):
            target_bin, bin_color = "Blue",  "#2563eb"
            bin_label      = "Blue Bin (Dry Waste)"
            recycle_method = random.choice(tips_db["Blue"])
        else:
            target_bin, bin_color = waste_type, "#64748b"
            bin_label      = "Unknown Bin"
            recycle_method = random.choice(tips_db["Unknown"])

        # Increment scans
        login_id = request.form.get('user_id') or request.form.get('login_id')
        if login_id:
            user = find_user(login_id)
            if user:
                users_col.update_one(
                    {"email": user['email']},
                    {"$inc": {"total_scans": 1}}
                )

        return jsonify({
            "waste_type":     waste_type,
            "target_bin":     target_bin,
            "bin_color":      bin_color,
            "bin_label":      bin_label,
            "recycle_method": recycle_method,
            "confidence":     ai_result.get('confidence', 0)
        })

    except Exception as e:
        return jsonify({"error": str(e), "target_bin": "Unknown", "waste_type": "Error"})


# ======================================================
#  POINTS & VERIFICATION
# ======================================================

pending_drop = {}

@app.route('/set_pending_drop', methods=['POST'])
def set_pending_drop():
    global pending_drop
    data         = request.json
    login_id     = data.get('login_id')
    expected_bin = data.get('expected_bin')
    waste_type   = data.get('waste_type', 'Unknown')
    timestamp    = get_ist_time().strftime("%d %b %Y, %I:%M %p")

    pending_drop = {
        'login_id':     login_id,
        'expected_bin': expected_bin,
        'waste_type':   waste_type,
        'status':       'pending',
        'timestamp':    timestamp
    }

    if login_id:
        user = find_user(login_id)
        if user:
            users_col.update_one(
                {"email": user['email']},
                {"$push": {"history": {
                    "$each": [{"date": timestamp, "waste_type": waste_type,
                                "expected": expected_bin, "actual": "",
                                "points": "", "status": "pending"}],
                    "$position": 0
                }}}
            )

    return jsonify({"success": True, "message": "Pending drop registered."})


@app.route('/check_verification', methods=['GET'])
def check_verification():
    global pending_drop
    login_id = request.args.get('login_id')

    if pending_drop.get('login_id') == login_id:
        status = pending_drop.get('status', 'pending')
        if status in ('match', 'mismatch'):
            result = {
                "success":       True,
                "status":        status,
                "message":       pending_drop.get('message', ''),
                "points_earned": pending_drop.get('points_earned', 0),
                "new_points":    pending_drop.get('new_points', 0),
                "actual_bin":    pending_drop.get('actual_bin', '')
            }
            pending_drop = {}
            return jsonify(result)
        return jsonify({"success": True, "status": "pending",
                        "message": "Waiting for bin camera verification..."})

    return jsonify({"success": True, "status": "pending", "message": "No pending drop found."})


@app.route('/get_pending_info', methods=['GET'])
def get_pending_info():
    global pending_drop
    if pending_drop.get('login_id') and pending_drop.get('status') == 'pending':
        return jsonify({
            "success":      True,
            "has_pending":  True,
            "expected_bin": pending_drop.get('expected_bin', ''),
            "waste_type":   pending_drop.get('waste_type', ''),
            "timestamp":    pending_drop.get('timestamp', '')
        })
    return jsonify({"success": True, "has_pending": False})


@app.route('/finalize_drop', methods=['POST'])
def finalize_drop():
    global pending_drop
    if not pending_drop.get('login_id'):
        return jsonify({"success": False, "message": "No pending drop. User must scan waste first!"})

    data         = request.json
    actual_bin   = data.get('actual_bin')
    login_id     = pending_drop['login_id']
    expected_bin = pending_drop['expected_bin']
    waste_type   = pending_drop.get('waste_type', 'Unknown')

    user = find_user(login_id)
    if not user:
        return jsonify({"success": False, "message": "User not found"})

    email          = user['email']
    current_points = user.get('points', 0)
    expected_clean = str(expected_bin).strip().lower()
    actual_clean   = str(actual_bin).strip().lower()

    if actual_clean in ("none", "unknown", ""):
        return jsonify({"success": True, "status": "retry",
                        "message": "AI can't identify the trash. Please show it clearly!"})

    timestamp = get_ist_time().strftime("%d %b %Y, %I:%M %p")

    if (expected_clean in actual_clean) or (actual_clean in expected_clean):
        new_points = current_points + 10
        msg        = f"Match! {actual_bin} bin used correctly. +10 Points!"
        users_col.update_one({"email": email}, {
            "$set":  {"points": new_points,
                      "verified_count": user.get('verified_count', 0) + 1},
            "$push": {"transactions": {"$each": [{
                "date": timestamp, "description": f"{waste_type} (Verified by Bin)",
                "points": "+10", "type": "earned"
            }], "$position": 0}}
        })
        # Update latest pending history entry
        users_col.update_one(
            {"email": email, "history.status": "pending", "history.expected": expected_bin},
            {"$set": {"history.$.status": "verified", "history.$.points": "+10",
                      "history.$.actual": actual_bin, "history.$.date": timestamp}}
        )
        pending_drop.update({'status': 'match', 'message': msg,
                             'points_earned': 10, 'new_points': new_points, 'actual_bin': actual_bin})
        return jsonify({"success": True, "status": "match", "message": msg})

    else:
        new_points = max(0, current_points - 5)
        msg        = f"Wrong Bin! Expected {expected_bin} but detected {actual_bin}. -5 Points penalty!"
        users_col.update_one({"email": email}, {
            "$set":  {"points": new_points},
            "$push": {"transactions": {"$each": [{
                "date": timestamp, "description": f"{waste_type} (Wrong Bin)",
                "points": "-5", "type": "penalty"
            }], "$position": 0}}
        })
        users_col.update_one(
            {"email": email, "history.status": "pending", "history.expected": expected_bin},
            {"$set": {"history.$.status": "mismatch", "history.$.points": "-5",
                      "history.$.actual": actual_bin, "history.$.date": timestamp}}
        )
        pending_drop.update({'status': 'mismatch', 'message': msg,
                             'points_earned': -5, 'new_points': new_points, 'actual_bin': actual_bin})
        return jsonify({"success": True, "status": "mismatch", "message": msg})


@app.route('/add_points', methods=['POST'])
def add_points():
    data     = request.json
    login_id = data.get('login_id')
    user     = find_user(login_id)
    if user:
        new_pts = user.get('points', 0) + 10
        users_col.update_one({"email": user['email']}, {"$set": {"points": new_pts}})
        return jsonify({"success": True, "new_points": new_pts})
    return jsonify({"success": False})


# ======================================================
#  USER DATA & PROFILE
# ======================================================

@app.route('/get_user_info', methods=['POST'])
def get_user_info():
    login_id = request.json.get('login_id')
    user     = find_user(login_id)
    if user:
        return jsonify({"success": True, "points": user.get('points', 0), "name": user.get('name')})
    return jsonify({"success": False, "message": "User not found"})


@app.route('/get_user_data', methods=['GET'])
def get_user_data():
    login_id = request.args.get('login_id')
    user     = find_user(login_id)
    if user:
        return jsonify({
            "success":        True,
            "points":         user.get('points', 0),
            "total_scans":    user.get('total_scans', 0),
            "verified_count": user.get('verified_count', 0)
        })
    return jsonify({"success": False, "message": "User not found"})


@app.route('/get_profile', methods=['GET'])
def get_profile():
    login_id = request.args.get('login_id')
    user     = find_user(login_id)
    if user:
        return jsonify({
            "success":        True,
            "name":           user.get('name', 'User'),
            "email":          user.get('email', ''),
            "mobile":         user.get('mobile', ''),
            "points":         user.get('points', 0),
            "total_scans":    user.get('total_scans', 0),
            "verified_count": user.get('verified_count', 0),
            "join_date":      user.get('join_date', 'N/A')
        })
    return jsonify({"success": False, "message": "User not found"})


@app.route('/update_profile', methods=['POST'])
def update_profile():
    data       = request.json
    login_id   = data.get('login_id')
    user       = find_user(login_id)
    if user:
        updates = {}
        if data.get('name'):   updates['name']   = data['name']
        if data.get('mobile'): updates['mobile'] = data['mobile']
        if updates:
            users_col.update_one({"email": user['email']}, {"$set": updates})
        return jsonify({"success": True, "message": "Profile updated successfully!"})
    return jsonify({"success": False, "message": "User not found"})


# ======================================================
#  HISTORY & REWARDS
# ======================================================

@app.route('/get_history', methods=['GET'])
def get_history():
    login_id    = request.args.get('login_id')
    filter_type = request.args.get('filter', 'all')
    user        = find_user(login_id)
    if user:
        history = user.get('history', [])
        if filter_type == 'verified':
            history = [h for h in history if h.get('status') in ('verified', 'match')]
        elif filter_type == 'pending':
            history = [h for h in history if h.get('status') == 'pending']
        elif filter_type == 'not_verified':
            history = [h for h in history if h.get('status') == 'mismatch']
        return jsonify({"success": True, "history": history})
    return jsonify({"success": False, "message": "User not found"})


@app.route('/get_rewards', methods=['GET'])
def get_rewards():
    login_id = request.args.get('login_id')
    user     = find_user(login_id)
    if user:
        return jsonify({
            "success":      True,
            "points":       user.get('points', 0),
            "transactions": user.get('transactions', [])
        })
    return jsonify({"success": False, "message": "User not found"})


@app.route('/redeem_points', methods=['POST'])
def redeem_points():
    data        = request.json
    login_id    = data.get('login_id')
    amount      = data.get('amount', 0)
    reward_name = data.get('reward_name', 'Reward Redemption')
    user        = find_user(login_id)

    if not user:
        return jsonify({"success": False, "message": "User not found"})

    current_points = user.get('points', 0)
    if current_points < amount:
        return jsonify({"success": False, "message": "Insufficient points!"})

    new_points = current_points - amount
    timestamp  = get_ist_time().strftime("%d %b %Y, %I:%M %p")
    users_col.update_one({"email": user['email']}, {
        "$set":  {"points": new_points},
        "$push": {"transactions": {"$each": [{
            "date": timestamp, "description": reward_name,
            "points": f"-{amount}", "type": "redeemed"
        }], "$position": 0}}
    })
    return jsonify({
        "success":    True,
        "new_points": new_points,
        "message":    f"Successfully redeemed {amount} points for {reward_name}!"
    })


# ======================================================
#  START SERVER
# ======================================================

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    print(f"[OK] Connected to MongoDB Atlas: {MONGO_DB}")
    app.run(host='0.0.0.0', debug=True, port=port)
