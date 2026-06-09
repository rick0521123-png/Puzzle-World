from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from datetime import timedelta

# --- Pydantic Models ---

class ExpenseRecordBase(BaseModel):
    amount: float
    category: str
    description: Optional[str] = None
    is_sdg: bool
    timestamp: Optional[datetime] = None
    record_type: str = "expense"

class ExpenseRecordCreate(ExpenseRecordBase):
    pass

class ExpenseRecord(ExpenseRecordBase):
    id: str
    account_id: str

class PuzzlePiece(BaseModel):
    piece_id: int
    map_id: str
    category: str
    is_shiny: bool
    acquired_at: datetime

class Badge(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    unlocked_at: datetime

class UserState(BaseModel):
    user_id: str
    last_record_date: Optional[str] = None
    unlocked_pieces: List[PuzzlePiece] = []
    check_in_pieces: List[PuzzlePiece] = []
    redeemed_pieces: List[PuzzlePiece] = []
    completed_months: List[str] = []
    unlocked_badges: List[Badge] = []
    
    # Check-in System
    check_in_streak: int = 0
    last_check_in_date: Optional[str] = None

    # Friends System
    friends: List[str] = []
    pending_friend_notifications: List[str] = []
    
    # Points System
    points: int = 0
    
    # Budget System
    monthly_budget: int = 0

class ExpenseResponse(BaseModel):
    status: str
    new_piece: Optional[PuzzlePiece]
    points_earned: int = 0
    total_points: int = 0
    completed_puzzle: bool = False
    new_badges: List[Badge] = []

class CheckInResponse(BaseModel):
    status: str
    check_in_streak: int
    reward_pieces: List[PuzzlePiece]
    message: str
    points_earned: int = 0
    total_points: int = 0

class RedeemRequest(BaseModel):
    item_id: str
    item_cost: int
    is_puzzle_piece: bool = False
    quantity: int = 1

class RedeemResponse(BaseModel):
    status: str
    message: str
    remaining_points: int
    new_pieces: List[PuzzlePiece] = []

class FriendResponse(BaseModel):
    friend_id: str
    check_in_streak: int
    monthly_pieces_count: int

class AddFriendRequest(BaseModel):
    friend_id: str

class StoreItemBase(BaseModel):
    name: str
    cost: int
    icon: str
    is_piece: bool = False
    max_limit: int = 1

class StoreItemCreate(StoreItemBase):
    id: Optional[str] = None

class StoreItemUpdate(StoreItemBase):
    pass

class StoreItemResponse(StoreItemBase):
    id: str
    user_redeemed_qty: int = 0

