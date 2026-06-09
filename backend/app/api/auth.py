from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from app.database import get_auth_user, create_auth_user, get_all_normal_users

router = APIRouter()

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    status: str
    message: str
    role: str
    username: str

class RegisterRequest(BaseModel):
    username: str
    password: str

class VerifyPasswordRequest(BaseModel):
    target_account_id: str
    password: str

@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest):
    user = get_auth_user(req.username)
    
    if not user or user["password"] != req.password:
        raise HTTPException(status_code=401, detail="帳號或密碼錯誤")
    
    return LoginResponse(
        status="success",
        message="登入成功",
        role=user["role"],
        username=user["account_id"]
    )

@router.post("/register")
def register(req: RegisterRequest):
    if not req.username or not req.password:
        raise HTTPException(status_code=400, detail="請提供帳號與密碼")
        
    existing_user = get_auth_user(req.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="此帳號已被註冊")
        
    create_auth_user(req.username, req.password, "user", req.username)
    return {"status": "success", "message": "註冊成功"}

@router.post("/verify_password")
def verify_password(req: VerifyPasswordRequest):
    # For now, get_auth_user_by_account_id is not implemented but since account_id == username for new users,
    # and default users are seeded with both user1 and user_1 usernames pointing to the same account_id,
    # we can try fetching by account_id from DB using a custom query
    from app.database import get_db_connection
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT password FROM auth_users WHERE account_id = ? LIMIT 1', (req.target_account_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row or row["password"] != req.password:
        raise HTTPException(status_code=401, detail="密碼錯誤")
        
    return {"status": "success", "message": "密碼驗證成功"}

@router.get("/users")
def get_users():
    return get_all_normal_users()
