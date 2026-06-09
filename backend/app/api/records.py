from fastapi import APIRouter, HTTPException, Header
from datetime import datetime
from typing import List
import uuid
from app.models import (
    ExpenseRecordCreate,
    ExpenseRecord,
    ExpenseResponse,
    UserState,
    CheckInResponse,
    PuzzlePiece
)
from pydantic import BaseModel
from app.database import get_db_connection, get_user_state_from_db, save_user_state_to_db, save_puzzle_piece_to_db
from app.services.reward_service import generate_reward, check_badges

class BudgetRequest(BaseModel):
    monthly_budget: int

router = APIRouter()

@router.post("/records", response_model=ExpenseResponse)
def create_record(record: ExpenseRecordCreate, account_id: str = "user_1"):
    '''
    Endpoint to record a new expense and process gamification logic.
    '''
    # Set timestamp if not provided
    record_time = record.timestamp or datetime.now()
    record_id = str(uuid.uuid4())
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO expense_records (id, account_id, amount, category, description, is_sdg, timestamp, record_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (record_id, account_id, record.amount, record.category, record.description, int(record.is_sdg), record_time.isoformat(), record.record_type))
    conn.commit()
    conn.close()
    
    user_state = get_user_state_from_db(account_id)
    
    # 1. Update user state (last record date)
    user_state.last_record_date = record_time.isoformat()
    
    # 2. Gamification / Dynamic Puzzle Reward
    new_piece = generate_reward(user_state, record.category, record.is_sdg)
    if new_piece:
        save_puzzle_piece_to_db(account_id, new_piece)
        
    # Check Badges
    new_badges = check_badges(account_id, user_state, record)
    
    # 3. Points System
    points_earned = 5
    if record.is_sdg:
        points_earned += 10
        
    for b in new_badges:
        points_earned += 50 # 獲得徽章的額外點數
        
    user_state.points += points_earned
    save_user_state_to_db(user_state)
    
    return ExpenseResponse(
        status="success",
        new_piece=new_piece,
        points_earned=points_earned,
        total_points=user_state.points,
        new_badges=new_badges
    )

@router.post("/check_in", response_model=CheckInResponse)
def check_in(account_id: str = "user_1"):
    user_state = get_user_state_from_db(account_id)
        
    from datetime import date, timedelta
    today = datetime.now().date()
    
    if not user_state.last_check_in_date:
        user_state.check_in_streak = 1
    else:
        last_date = date.fromisoformat(user_state.last_check_in_date)
        if today == last_date:
            return CheckInResponse(status="already_checked_in", check_in_streak=user_state.check_in_streak, reward_pieces=[], message="今天已經簽到過了！", points_earned=0, total_points=user_state.points)
        elif today == last_date + timedelta(days=1):
            user_state.check_in_streak += 1
        else:
            user_state.check_in_streak = 1
            
    user_state.last_check_in_date = today.isoformat()
    
    milestones = [7, 15, 25]
    reward_pieces = []
    message = f"簽到成功！連續簽到 {user_state.check_in_streak} 天。"
    
    points_earned = 10
    
    if user_state.check_in_streak in milestones:
        import random
        num_pieces = random.randint(2, 4)
        
        if user_state.check_in_streak == 7:
            points_earned += 50
        elif user_state.check_in_streak == 15:
            points_earned += 100
        elif user_state.check_in_streak == 25:
            points_earned += 200
        
        # 只看當月的已獲得拼圖，避免跨月 ID 衝突
        today_ym = datetime.now().strftime("%Y-%m")
        acquired_ids = [p.piece_id for p in user_state.unlocked_pieces if p.acquired_at.strftime("%Y-%m") == today_ym]
        available_ids = [i for i in range(36) if i not in acquired_ids]
        
        for _ in range(num_pieces):
            if available_ids:
                piece_id = random.choice(available_ids)
                available_ids.remove(piece_id)
                new_piece = PuzzlePiece(
                    piece_id=piece_id,
                    map_id="season_1",
                    category="check_in",
                    is_shiny=True,
                    acquired_at=datetime.now()
                )
                user_state.check_in_pieces.append(new_piece)
                user_state.unlocked_pieces.append(new_piece)
                reward_pieces.append(new_piece)
                save_puzzle_piece_to_db(account_id, new_piece)
                
        message = f"🎉 恭喜達成 {user_state.check_in_streak} 天連續簽到！獲得禮包： {len(reward_pieces)} 片驚喜拼圖！"
        
    user_state.points += points_earned
    save_user_state_to_db(user_state)
        
    return CheckInResponse(status="success", check_in_streak=user_state.check_in_streak, reward_pieces=reward_pieces, message=message, points_earned=points_earned, total_points=user_state.points)

@router.get("/user/state")
def get_user_state(account_id: str = "user_1"):
    '''
    Retrieve current user state including unlocked pieces.
    '''
    user_state = get_user_state_from_db(account_id)
    
    # Check for completion of current month
    today_ym = datetime.now().strftime("%Y-%m")
    current_month_unique_pieces = set(p.piece_id for p in user_state.unlocked_pieces if p.acquired_at.strftime("%Y-%m") == today_ym)
    
    if len(current_month_unique_pieces) >= 36 and today_ym not in user_state.completed_months:
        user_state.completed_months.append(today_ym)
        user_state.points += 1000
        save_user_state_to_db(user_state)
        
    return user_state

@router.put("/user/budget")
def update_budget(req: BudgetRequest, account_id: str = "user_1"):
    '''
    Update user's monthly budget.
    '''
    user_state = get_user_state_from_db(account_id)
    user_state.monthly_budget = req.monthly_budget
    save_user_state_to_db(user_state)
    return {"status": "success", "monthly_budget": user_state.monthly_budget}

@router.get("/records", response_model=List[ExpenseRecord])
def get_records(account_id: str = "user1", fetch_all: bool = False):
    '''
    Retrieve all recorded expenses for a specific account, or all accounts if fetch_all is True.
    '''
    conn = get_db_connection()
    cursor = conn.cursor()
    if fetch_all:
        cursor.execute('SELECT * FROM expense_records ORDER BY timestamp DESC')
    else:
        cursor.execute('SELECT * FROM expense_records WHERE account_id = ? ORDER BY timestamp DESC', (account_id,))
    rows = cursor.fetchall()
    conn.close()
    
    records_list = []
    for row in rows:
        records_list.append(ExpenseRecord(
            id=row['id'],
            account_id=row['account_id'],
            amount=row['amount'],
            category=row['category'],
            description=row['description'],
            is_sdg=bool(row['is_sdg']),
            timestamp=datetime.fromisoformat(row['timestamp']),
            record_type=row['record_type'] if 'record_type' in row.keys() else 'expense'
        ))
    return records_list

@router.put("/records/{record_id}", response_model=ExpenseRecord)
def update_record(record_id: str, record_update: ExpenseRecordCreate, account_id: str = "user_1"):
    '''
    Update an existing expense record.
    '''
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM expense_records WHERE id = ? AND account_id = ?', (record_id, account_id))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Record not found")
        
    cursor.execute('''
        UPDATE expense_records 
        SET amount = ?, category = ?, description = ?, is_sdg = ?, record_type = ?
        WHERE id = ? AND account_id = ?
    ''', (record_update.amount, record_update.category, record_update.description, int(record_update.is_sdg), record_update.record_type, record_id, account_id))
    conn.commit()
    
    cursor.execute('SELECT * FROM expense_records WHERE id = ?', (record_id,))
    updated_row = cursor.fetchone()
    conn.close()
    
    return ExpenseRecord(
        id=updated_row['id'],
        account_id=updated_row['account_id'],
        amount=updated_row['amount'],
        category=updated_row['category'],
        description=updated_row['description'],
        is_sdg=bool(updated_row['is_sdg']),
        timestamp=datetime.fromisoformat(updated_row['timestamp']),
        record_type=updated_row['record_type'] if 'record_type' in updated_row.keys() else 'expense'
    )

@router.delete("/records/{record_id}")
def delete_record(record_id: str, account_id: str = "user_1"):
    '''
    Delete an existing expense record.
    '''
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM expense_records WHERE id = ? AND account_id = ?', (record_id, account_id))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Record not found")
        
    cursor.execute('DELETE FROM expense_records WHERE id = ? AND account_id = ?', (record_id, account_id))
    conn.commit()
    conn.close()
    
    return {"status": "success", "message": "Record deleted successfully"}

@router.post("/badges/check")
def force_check_badges(account_id: str = Header(..., alias="Authorization")):
    user_state = get_user_state_from_db(account_id)
    if not user_state:
        raise HTTPException(status_code=404, detail="User not found")
        
    new_badges = check_badges(account_id, user_state, None)
    
    if new_badges:
        for b in new_badges:
            user_state.points += 50
        save_user_state_to_db(user_state)
        
    return {
        "status": "success",
        "new_badges": new_badges,
        "unlocked_badges": user_state.unlocked_badges
    }
