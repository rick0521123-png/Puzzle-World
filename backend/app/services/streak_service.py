from datetime import datetime, date, timedelta

def calculate_streak(user_state, record_date: date) -> bool:
    '''
    Updates the streak based on the new record_date.
    Returns True if the streak was reset (broken), False otherwise.
    '''
    streak_reset = False
    
    if not user_state.last_record_date:
        # First time recording
        user_state.current_streak = 1
        user_state.last_record_date = record_date.isoformat()
        return streak_reset
        
    last_date = date.fromisoformat(user_state.last_record_date)
    
    # If it's the same day or a past date (backfill), do not increment or break streak
    if record_date <= last_date:
        return streak_reset
        
    # Check if the record is exactly the next day
    if record_date == last_date + timedelta(days=1):
        user_state.current_streak += 1
    else:
        # Streak broken - Trigger psychological cost mechanism
        user_state.current_streak = 1
        streak_reset = True
        
    user_state.last_record_date = record_date.isoformat()
    return streak_reset
