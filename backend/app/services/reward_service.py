import random
from datetime import datetime
from typing import Optional, List
from app.models import PuzzlePiece, Badge
from app.database import get_db_connection, save_user_badge_to_db

def get_current_season_map() -> str:
    '''
    Determine the map ID based on the current month.
    '''
    month = datetime.now().month
    if 1 <= month <= 3:
        return "taiwan_old_street"
    elif 4 <= month <= 6:
        return "cyberpunk_city"
    elif 7 <= month <= 9:
        return "ocean_world"
    else:
        return "space_station"

def generate_reward(user_state, category: str, is_sdg: bool) -> Optional[PuzzlePiece]:
    '''
    Generate a puzzle piece based on category and SDG attribute.
    一日只能獲取一片拼圖。
    '''
    today = datetime.now().date()
    
    # 檢查今日是否已經獲取過記帳拼圖 (排除簽到禮包)
    expense_pieces = [p for p in user_state.unlocked_pieces if p.category != "check_in"]
    if expense_pieces:
        latest_piece = max(expense_pieces, key=lambda p: p.acquired_at)
        if latest_piece.acquired_at.date() == today:
            return None

    # Assign a random piece_id for the grid (e.g. 0 to 35 for a 6x6 puzzle)
    piece_id = random.randint(0, 35)
    
    # Check if the user already has this piece, for simplicity we just grant it anyway,
    # or we can find an unacquired piece.
    today_ym = today.strftime("%Y-%m")
    acquired_ids = [p.piece_id for p in user_state.unlocked_pieces if p.acquired_at.strftime("%Y-%m") == today_ym]
    available_ids = [i for i in range(36) if i not in acquired_ids]
    
    if available_ids:
        piece_id = random.choice(available_ids)
    
    map_id = get_current_season_map()
    
    new_piece = PuzzlePiece(
        piece_id=piece_id,
        map_id=map_id,
        category=category,
        is_shiny=is_sdg, # SDG consumption gets shiny particles
        acquired_at=datetime.now()
    )
    
    user_state.unlocked_pieces.append(new_piece)
    return new_piece

def check_badges(account_id: str, user_state, new_record) -> List[Badge]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM expense_records WHERE account_id = ?', (account_id,))
    total_records = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(*) FROM expense_records WHERE account_id = ? AND is_sdg = 1', (account_id,))
    sdg_records = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(DISTINCT date(timestamp)) FROM expense_records WHERE account_id = ?', (account_id,))
    distinct_days = cursor.fetchone()[0]
    conn.close()
    
    unlocked_badge_ids = [b.id for b in user_state.unlocked_badges]
    new_badges = []
    
    points = user_state.points
    streak = user_state.check_in_streak
    puzzles = len(user_state.unlocked_pieces)
    
    now = datetime.now()
    hour = now.hour
    weekday = now.weekday()
    amount = new_record.amount if new_record and hasattr(new_record, 'amount') else 0
    
    badges_to_check = [
        {"id": "b01", "name": "踏出第一步", "desc": "記錄了第 1 筆收支", "icon": "🏁", "condition": total_records >= 1},
        {"id": "b02", "name": "記帳新手", "desc": "記錄滿 10 筆收支", "icon": "📝", "condition": total_records >= 10},
        {"id": "b03", "name": "記帳達人", "desc": "記錄滿 50 筆收支", "icon": "📓", "condition": total_records >= 50},
        {"id": "b04", "name": "記帳大師", "desc": "記錄滿 100 筆收支", "icon": "👑", "condition": total_records >= 100},
        {"id": "b05", "name": "綠色新手", "desc": "完成第 1 筆永續消費", "icon": "🌱", "condition": sdg_records >= 1},
        {"id": "b06", "name": "永續達人", "desc": "完成第 10 筆永續消費", "icon": "🌳", "condition": sdg_records >= 10},
        {"id": "b07", "name": "地球守護者", "desc": "完成第 30 筆永續消費", "icon": "🌍", "condition": sdg_records >= 30},
        {"id": "b08", "name": "早鳥出擊", "desc": "在早上 5:00 - 9:00 之間新增記錄", "icon": "🌅", "condition": 5 <= hour <= 9 and amount > 0},
        {"id": "b09", "name": "夜貓記帳", "desc": "在晚上 22:00 - 02:00 之間新增記錄", "icon": "🦉", "condition": (hour >= 22 or hour <= 2) and amount > 0},
        {"id": "b10", "name": "精打細算", "desc": "單筆消費低於 50 元", "icon": "🪙", "condition": 0 < amount < 50},
        {"id": "b11", "name": "大手筆", "desc": "單筆消費高於 5000 元", "icon": "💎", "condition": amount >= 5000},
        {"id": "b12", "name": "週末狂歡", "desc": "在週六或週日新增消費", "icon": "🎉", "condition": weekday >= 5 and amount > 0},
        {"id": "b13", "name": "簽到新手", "desc": "連續簽到天數達 3 天", "icon": "🔥", "condition": streak >= 3},
        {"id": "b14", "name": "簽到達人", "desc": "連續簽到天數達 7 天", "icon": "⚡", "condition": streak >= 7},
        {"id": "b15", "name": "簽到狂熱", "desc": "連續簽到天數達 30 天", "icon": "🏆", "condition": streak >= 30},
        {"id": "b16", "name": "拼圖學徒", "desc": "解鎖 10 片拼圖", "icon": "🧩", "condition": puzzles >= 10},
        {"id": "b17", "name": "拼圖大師", "desc": "解鎖 36 片拼圖", "icon": "🖼️", "condition": puzzles >= 36},
        {"id": "b18", "name": "點數富翁", "desc": "總獲得點數超過 500 點", "icon": "💰", "condition": points >= 500},
        {"id": "b19", "name": "財富自由", "desc": "總獲得點數超過 2000 點", "icon": "🚀", "condition": points >= 2000},
        {"id": "b20", "name": "勤勞記帳", "desc": "累積記帳達 15 天", "icon": "📅", "condition": distinct_days >= 15},
    ]
    
    for b in badges_to_check:
        if b['condition'] and b['id'] not in unlocked_badge_ids:
            badge = Badge(id=b['id'], name=b['name'], description=b['desc'], icon=b['icon'], unlocked_at=datetime.now())
            new_badges.append(badge)
            user_state.unlocked_badges.append(badge)
            save_user_badge_to_db(account_id, badge)
            
    return new_badges
