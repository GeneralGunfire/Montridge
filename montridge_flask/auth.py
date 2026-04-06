import bcrypt
import jwt
import os
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify

SECRET_KEY = os.getenv('JWT_SECRET', 'montridge-secret-key-2026')
JWT_EXPIRY_DAYS = 1  # 24 hours

def hash_password(password):
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password, password_hash):
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))

def create_jwt_token(user_id, email):
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.utcnow() + timedelta(days=JWT_EXPIRY_DAYS),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def decode_jwt_token(token):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
    except:
        return None

def extract_token_from_header(headers):
    auth_header = headers.get('Authorization')
    if not auth_header:
        return None
    parts = auth_header.split(' ')
    if len(parts) != 2 or parts[0] != 'Bearer':
        return None
    return parts[1]

def require_auth(f):
    """Middleware decorator to require JWT authentication on a route"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = extract_token_from_header(request.headers)
        if not token:
            return jsonify({"error": "Authorization required"}), 401

        payload = decode_jwt_token(token)
        if not payload:
            return jsonify({"error": "Invalid or expired token"}), 401

        # Store user info in request context for use in the route
        request.user_id = payload.get('user_id')
        request.user_email = payload.get('email')

        return f(*args, **kwargs)

    return decorated_function