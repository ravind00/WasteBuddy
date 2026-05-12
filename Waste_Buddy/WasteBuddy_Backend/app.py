from flask import Flask, request, jsonify
from flask_cors import CORS
from ai_helper import get_ai_prediction
from datetime import datetime
import os
import json
import random

app = Flask(__name__)
CORS(app)

# --- DATABASE LOGIC ---
DB_FILE = "users.json"

def load_users():
    if not os.path.exists(DB_FILE):
        return {}
    with open(DB_FILE, "r") as f:
        return json.load(f)

def save_users(users):
    with open(DB_FILE, "w") as f:
        json.dump(users, f, indent=2)

def find_user(users, login_id):
    """Find user by email or mobile. Returns (email_key, user_info) or (None, None)."""
    if login_id in users:
        return login_id, users[login_id]
    for email, info in users.items():
        if info.get('mobile') == login_id:
            return email, info
    return None, None

# ==================================================
#  AUTH ENDPOINTS
# ==================================================

@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    mobile = data.get('mobile')

    users = load_users()
    if email in users:
        return jsonify({"success": False, "message": "Email already exists!"}), 400

    users[email] = {
        "name": name,
        "password": password,
        "mobile": mobile,
        "points": 0,
        "total_scans": 0,
        "verified_count": 0,
        "join_date": datetime.now().strftime("%d %b %Y"),
        "history": [],
        "transactions": []
    }

    save_users(users)
    return jsonify({"success": True, "message": "Account created successfully!"})


@app.route('/login', methods=['POST'])
def login():
    data = request.json
    login_id = data.get('email')
    password = data.get('password')
    users = load_users()

    email_key, user_info = find_user(users, login_id)

    if email_key and user_info['password'] == password:
        return jsonify({
            "success": True,
            "user_name": user_info['name'],
            "email": email_key,
            "points": user_info.get('points', 0),
            "total_scans": user_info.get('total_scans', 0),
            "verified_count": user_info.get('verified_count', 0),
            "message": "Login successful!"
        })

    return jsonify({"success": False, "message": "Invalid credentials!"}), 401


# ==================================================
#  WASTE SCANNING & AI
# ==================================================

@app.route('/analyze-waste', methods=['POST'])
def analyze_waste_route():
    file = request.files.get('file') or request.files.get('image')

    if not file:
        return jsonify({"error": "No image received", "target_bin": "Unknown", "waste_type": "None"})

    filepath = "temp_drop.jpg"
    file.save(filepath)

    try:
        ai_result = get_ai_prediction(filepath)
        waste_type = str(ai_result.get('waste_type', 'Unknown')).strip()
        waste_lower = waste_type.lower()
        target_bin = "Unknown"
        bin_color = "#6b7280"
        bin_label = "Unknown"

        tips_db = {
            "Red": [
                "Hand over to certified E-Waste recyclers.",
                "Never throw batteries in regular trash; they leak toxins.",
                "Donate old working electronics to NGOs or schools.",
                "E-waste recycling recovers precious metals like gold and silver!"
            ],
            "Green": [
                "Can be used for composting and agriculture.",
                "Wet waste can be converted into nutrient-rich biogas.",
                "Keep wet waste separate to prevent ruining dry recyclables.",
                "Try home composting for your kitchen scraps!"
            ],
            "Blue": [
                "Send to recycling facilities to reuse materials.",
                "Rinse plastic food containers before throwing them here.",
                "Recycling 1 ton of paper saves 17 mature trees!",
                "Flatten cardboard boxes to save space in the bin."
            ],
            "Unknown": [
                "Please dispose of carefully.",
                "When in doubt, check local recycling guidelines."
            ]
        }

        if "e-waste" in waste_lower or "ewaste" in waste_lower or "red" in waste_lower or "electronic" in waste_lower:
            target_bin = "Red"
            bin_color = "#dc2626"
            bin_label = "Red Bin (E-Waste)"
            recycle_method = random.choice(tips_db["Red"])
        elif "wet" in waste_lower or "green" in waste_lower or "food" in waste_lower:
            target_bin = "Green"
            bin_color = "#16a34a"
            bin_label = "Green Bin (Wet Waste)"
            recycle_method = random.choice(tips_db["Green"])
        elif "dry" in waste_lower or "blue" in waste_lower or "plastic" in waste_lower or "paper" in waste_lower:
            target_bin = "Blue"
            bin_color = "#2563eb"
            bin_label = "Blue Bin (Dry Waste)"
            recycle_method = random.choice(tips_db["Blue"])
        else:
            target_bin = waste_type
            bin_label = "Unknown Bin"
            recycle_method = random.choice(tips_db["Unknown"])

        # Increment total_scans for the user
        login_id = request.form.get('user_id') or request.form.get('login_id')
        if login_id:
            users = load_users()
            email_key, user_info = find_user(users, login_id)
            if email_key:
                users[email_key]['total_scans'] = user_info.get('total_scans', 0) + 1
                save_users(users)

        return jsonify({
            "waste_type": waste_type,
            "target_bin": target_bin,
            "bin_color": bin_color,
            "bin_label": bin_label,
            "recycle_method": recycle_method,
            "confidence": ai_result.get('confidence', 0)
        })

    except Exception as e:
        return jsonify({"error": str(e), "target_bin": "Unknown", "waste_type": "Error"})


# ==================================================
#  POINTS & VERIFICATION
# ==================================================

pending_drop = {}

@app.route('/set_pending_drop', methods=['POST'])
def set_pending_drop():
    """User's phone sets what they scanned. Creates a pending history entry."""
    global pending_drop
    data = request.json
    login_id = data.get('login_id')
    expected_bin = data.get('expected_bin')
    waste_type = data.get('waste_type', 'Unknown')

    pending_drop['login_id'] = login_id
    pending_drop['expected_bin'] = expected_bin
    pending_drop['waste_type'] = waste_type
    pending_drop['status'] = 'pending'
    pending_drop['timestamp'] = datetime.now().strftime("%d %b %Y, %I:%M %p")

    # Add pending history entry for this user
    if login_id:
        users = load_users()
        email_key, user_info = find_user(users, login_id)
        if email_key:
            if "history" not in users[email_key]:
                users[email_key]["history"] = []
            users[email_key]["history"].insert(0, {
                "date": pending_drop['timestamp'],
                "waste_type": waste_type,
                "expected": expected_bin,
                "actual": "",
                "points": "",
                "status": "pending"
            })
            save_users(users)

    return jsonify({"success": True, "message": "Pending drop registered. Waiting for bin camera."})


@app.route('/check_verification', methods=['GET'])
def check_verification():
    """User's phone polls this to check if bin camera has verified."""
    login_id = request.args.get('login_id')
    global pending_drop

    # If pending drop matches this user and has been resolved
    if pending_drop.get('login_id') == login_id:
        status = pending_drop.get('status', 'pending')
        if status in ('match', 'mismatch'):
            result = {
                "success": True,
                "status": status,
                "message": pending_drop.get('message', ''),
                "points_earned": pending_drop.get('points_earned', 0),
                "new_points": pending_drop.get('new_points', 0),
                "actual_bin": pending_drop.get('actual_bin', '')
            }
            pending_drop = {}  # Clear after user reads result
            return jsonify(result)
        else:
            return jsonify({"success": True, "status": "pending", "message": "Waiting for bin camera verification..."})

    return jsonify({"success": True, "status": "pending", "message": "No pending drop found."})


@app.route('/get_pending_info', methods=['GET'])
def get_pending_info():
    """Bin camera device calls this to see what user is expected to drop."""
    global pending_drop
    if pending_drop.get('login_id') and pending_drop.get('status') == 'pending':
        return jsonify({
            "success": True,
            "has_pending": True,
            "user_name": "",
            "expected_bin": pending_drop.get('expected_bin', ''),
            "waste_type": pending_drop.get('waste_type', ''),
            "timestamp": pending_drop.get('timestamp', '')
        })
    return jsonify({"success": True, "has_pending": False})


@app.route('/finalize_drop', methods=['POST'])
def finalize_drop():
    """Bin camera sends what AI detected. Compares with user's expected bin."""
    global pending_drop

    if not pending_drop.get('login_id'):
        return jsonify({"success": False, "message": "No pending drop. User must scan waste first!"})

    data = request.json
    actual_bin = data.get('actual_bin')

    login_id = pending_drop['login_id']
    expected_bin = pending_drop['expected_bin']
    waste_type = pending_drop.get('waste_type', 'Unknown')

    users = load_users()
    email_key, user_info = find_user(users, login_id)

    if not email_key:
        return jsonify({"success": False, "message": "User not found"})

    current_points = user_info.get('points', 0)
    expected_clean = str(expected_bin).strip().lower()
    actual_clean = str(actual_bin).strip().lower()

    if actual_clean == "none" or actual_clean == "unknown" or actual_clean == "":
        msg = "AI can't identify the trash. Please show it clearly to the bin camera!"
        return jsonify({"success": True, "status": "retry", "message": msg})

    timestamp = datetime.now().strftime("%d %b %Y, %I:%M %p")
    if "history" not in users[email_key]:
        users[email_key]["history"] = []
    if "transactions" not in users[email_key]:
        users[email_key]["transactions"] = []

    # Update the pending history entry (first one with pending status)
    for h in users[email_key]["history"]:
        if h.get('status') == 'pending' and h.get('expected') == expected_bin:
            h['actual'] = actual_bin
            h['date'] = timestamp
            break

    if (expected_clean in actual_clean) or (actual_clean in expected_clean):
        # MATCH - correct bin used
        users[email_key]['points'] = current_points + 10
        users[email_key]['verified_count'] = user_info.get('verified_count', 0) + 1
        msg = f"Match! {actual_bin} bin used correctly. +10 Points!"
        status = "match"

        # Update pending history to verified
        for h in users[email_key]["history"]:
            if h.get('status') == 'pending' and h.get('expected') == expected_bin:
                h['status'] = 'verified'
                h['points'] = '+10'
                break

        users[email_key]["transactions"].insert(0, {
            "date": timestamp, "description": f"{waste_type} (Verified by Bin)",
            "points": "+10", "type": "earned"
        })

        # Store result for user polling
        pending_drop['status'] = 'match'
        pending_drop['message'] = msg
        pending_drop['points_earned'] = 10
        pending_drop['new_points'] = users[email_key]['points']
        pending_drop['actual_bin'] = actual_bin

        save_users(users)
        return jsonify({"success": True, "status": "match", "message": msg})

    else:
        # MISMATCH - wrong bin
        users[email_key]['points'] = max(0, current_points - 5)
        msg = f"Wrong Bin! Expected {expected_bin} but detected {actual_bin}. -5 Points penalty!"
        status = "mismatch"

        # Update pending history to mismatch
        for h in users[email_key]["history"]:
            if h.get('status') == 'pending' and h.get('expected') == expected_bin:
                h['status'] = 'mismatch'
                h['points'] = '-5'
                break

        users[email_key]["transactions"].insert(0, {
            "date": timestamp, "description": f"{waste_type} (Wrong Bin)",
            "points": "-5", "type": "penalty"
        })

        # Store result for user polling
        pending_drop['status'] = 'mismatch'
        pending_drop['message'] = msg
        pending_drop['points_earned'] = -5
        pending_drop['new_points'] = users[email_key]['points']
        pending_drop['actual_bin'] = actual_bin

        save_users(users)
        return jsonify({"success": True, "status": "mismatch", "message": msg})


@app.route('/add_points', methods=['POST'])
def add_points():
    data = request.json
    login_id = data.get('login_id')

    users = load_users()
    email_key, user_info = find_user(users, login_id)

    if email_key:
        users[email_key]['points'] = user_info.get('points', 0) + 10
        save_users(users)
        return jsonify({"success": True, "new_points": users[email_key]['points']})

    return jsonify({"success": False})


# ==================================================
#  USER DATA & PROFILE
# ==================================================

@app.route('/get_user_info', methods=['POST'])
def get_user_info():
    data = request.json
    login_id = data.get('login_id')

    users = load_users()
    email_key, user_info = find_user(users, login_id)

    if email_key:
        return jsonify({
            "success": True,
            "points": user_info.get('points', 0),
            "name": user_info.get('name')
        })
    return jsonify({"success": False, "message": "User not found"})


@app.route('/get_user_data', methods=['GET'])
def get_user_data():
    login_id = request.args.get('login_id')
    users = load_users()
    email_key, user_info = find_user(users, login_id)

    if email_key:
        return jsonify({
            "success": True,
            "points": user_info.get('points', 0),
            "total_scans": user_info.get('total_scans', 0),
            "verified_count": user_info.get('verified_count', 0)
        })

    return jsonify({"success": False, "message": "User not found"})


@app.route('/get_profile', methods=['GET'])
def get_profile():
    login_id = request.args.get('login_id')
    users = load_users()
    email_key, user_info = find_user(users, login_id)

    if email_key:
        return jsonify({
            "success": True,
            "name": user_info.get('name', 'User'),
            "email": email_key,
            "mobile": user_info.get('mobile', ''),
            "points": user_info.get('points', 0),
            "total_scans": user_info.get('total_scans', 0),
            "verified_count": user_info.get('verified_count', 0),
            "join_date": user_info.get('join_date', 'N/A')
        })
    return jsonify({"success": False, "message": "User not found"})


@app.route('/update_profile', methods=['POST'])
def update_profile():
    data = request.json
    login_id = data.get('login_id')
    new_name = data.get('name')
    new_mobile = data.get('mobile')

    users = load_users()
    email_key, user_info = find_user(users, login_id)

    if email_key:
        if new_name:
            users[email_key]['name'] = new_name
        if new_mobile:
            users[email_key]['mobile'] = new_mobile
        save_users(users)
        return jsonify({"success": True, "message": "Profile updated successfully!"})

    return jsonify({"success": False, "message": "User not found"})


# ==================================================
#  HISTORY & REWARDS
# ==================================================

@app.route('/get_history', methods=['GET'])
def get_history():
    login_id = request.args.get('login_id')
    filter_type = request.args.get('filter', 'all')  # all, verified, pending

    users = load_users()
    email_key, user_info = find_user(users, login_id)

    if email_key:
        history = user_info.get('history', [])

        if filter_type == 'verified':
            history = [h for h in history if h.get('status') == 'verified' or h.get('status') == 'match']
        elif filter_type == 'pending':
            history = [h for h in history if h.get('status') == 'pending']
        elif filter_type == 'not_verified':
            history = [h for h in history if h.get('status') == 'mismatch']

        return jsonify({"success": True, "history": history})

    return jsonify({"success": False, "message": "User not found"})


@app.route('/get_rewards', methods=['GET'])
def get_rewards():
    login_id = request.args.get('login_id')
    users = load_users()
    email_key, user_info = find_user(users, login_id)

    if email_key:
        return jsonify({
            "success": True,
            "points": user_info.get('points', 0),
            "transactions": user_info.get('transactions', [])
        })
    return jsonify({"success": False, "message": "User not found"})


@app.route('/redeem_points', methods=['POST'])
def redeem_points():
    data = request.json
    login_id = data.get('login_id')
    amount = data.get('amount', 0)
    reward_name = data.get('reward_name', 'Reward Redemption')

    users = load_users()
    email_key, user_info = find_user(users, login_id)

    if not email_key:
        return jsonify({"success": False, "message": "User not found"})

    current_points = user_info.get('points', 0)
    if current_points < amount:
        return jsonify({"success": False, "message": "Insufficient points!"})

    users[email_key]['points'] = current_points - amount

    timestamp = datetime.now().strftime("%d %b %Y, %I:%M %p")
    if "transactions" not in users[email_key]:
        users[email_key]["transactions"] = []

    users[email_key]["transactions"].insert(0, {
        "date": timestamp,
        "description": reward_name,
        "points": f"-{amount}",
        "type": "redeemed"
    })

    save_users(users)
    return jsonify({
        "success": True,
        "new_points": users[email_key]['points'],
        "message": f"Successfully redeemed {amount} points for {reward_name}!"
    })


# ==================================================
#  START SERVER
# ==================================================

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', debug=True, port=port)
