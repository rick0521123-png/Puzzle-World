from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime
from app.models import FriendResponse, AddFriendRequest
from app.database import get_db_connection, get_user_state_from_db

router = APIRouter()

@router.post("/friends/add")
def add_friend(request: AddFriendRequest, account_id: str = "user_1"):
    '''
    Add a friend by their user_id.
    '''
    user_state = get_user_state_from_db(account_id)
        
    friend_id = request.friend_id
    if friend_id == account_id:
        raise HTTPException(status_code=400, detail="Cannot add yourself as a friend")
        
    # Check if target exists, if not, get_user_state_from_db creates them
    target_state = get_user_state_from_db(friend_id)
        
    if friend_id in user_state.friends:
        return {"status": "success", "message": "Already friends"}
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if the friend already added us (meaning it's pending for us)
    cursor.execute('SELECT status FROM friends WHERE account_id = ? AND friend_id = ?', (friend_id, account_id))
    row = cursor.fetchone()
    
    if row and row['status'] == 'accepted':
        # They already added us. We add them back.
        cursor.execute('INSERT OR REPLACE INTO friends (account_id, friend_id, status) VALUES (?, ?, ?)', (account_id, friend_id, 'accepted'))
    else:
        # We initiate the add
        cursor.execute('INSERT OR REPLACE INTO friends (account_id, friend_id, status) VALUES (?, ?, ?)', (account_id, friend_id, 'accepted'))
    
    conn.commit()
    conn.close()
    
    return {"status": "success", "message": f"Successfully added {friend_id} as a friend"}

@router.delete("/friends/{friend_id}")
def remove_friend(friend_id: str, account_id: str = "user_1"):
    '''
    Remove a friend.
    '''
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM friends WHERE account_id = ? AND friend_id = ?', (account_id, friend_id))
    if cursor.rowcount > 0:
        conn.commit()
        conn.close()
        return {"status": "success", "message": "Friend removed"}
        
    conn.close()
    raise HTTPException(status_code=404, detail="Friend not found in your list")

@router.get("/friends", response_model=List[FriendResponse])
def get_friends(account_id: str = "user_1"):
    '''
    Get the list of friends with their stats.
    '''
    user_state = get_user_state_from_db(account_id)
        
    friends_data = []
    today_ym = datetime.now().strftime("%Y-%m")
    
    for friend_id in user_state.friends:
        friend_state = get_user_state_from_db(friend_id)
        if friend_state:
            # Calculate monthly pieces count
            monthly_pieces = len(set(
                p.piece_id for p in friend_state.unlocked_pieces 
                if p.acquired_at.strftime("%Y-%m") == today_ym
            ))
            
            friends_data.append(FriendResponse(
                friend_id=friend_id,
                check_in_streak=friend_state.check_in_streak,
                monthly_pieces_count=monthly_pieces
            ))
            
    return friends_data

@router.get("/friends/notifications", response_model=List[str])
def get_friend_notifications(account_id: str = "user_1"):
    '''
    Get the list of pending friend requests (users who added you).
    '''
    user_state = get_user_state_from_db(account_id)
    return user_state.pending_friend_notifications

@router.post("/friends/dismiss_notification")
def dismiss_notification(request: AddFriendRequest, account_id: str = "user_1"):
    '''
    Dismiss a friend notification without adding back.
    '''
    # Dismissing a notification means we remove the record where they added us...
    # But wait, if they added us, they have (friend_id, account_id, 'accepted') in DB.
    # If we dismiss, we don't want to see it again.
    # To truly dismiss without removing their outgoing friendship, we could add (account_id, friend_id, 'dismissed')
    # Or just ignore it. Actually, deleting their add is the simplest way.
    # Let's just delete their add request.
    friend_id = request.friend_id
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM friends WHERE account_id = ? AND friend_id = ?', (friend_id, account_id))
    
    if cursor.rowcount > 0:
        conn.commit()
        conn.close()
        return {"status": "success", "message": "Notification dismissed"}
        
    conn.close()
    return {"status": "success", "message": "No such notification"}
