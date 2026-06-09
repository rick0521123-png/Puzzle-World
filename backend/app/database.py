import sqlite3
import os
import uuid
import random
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "puzzle_world.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def get_user_record_dates(account_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT DISTINCT date(timestamp) as record_date FROM expense_records WHERE account_id = ?', (account_id,))
    rows = cursor.fetchall()
    conn.close()
    return [row['record_date'] for row in rows]

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 建立記帳資料表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS expense_records (
            id TEXT PRIMARY KEY,
            account_id TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            description TEXT,
            is_sdg INTEGER NOT NULL DEFAULT 0,
            timestamp TEXT NOT NULL,
            record_type TEXT NOT NULL DEFAULT 'expense'
        )
    ''')
    
    # 建立使用者狀態資料表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            account_id TEXT PRIMARY KEY,
            check_in_streak INTEGER DEFAULT 0,
            last_check_in_date TEXT,
            last_record_date TEXT,
            points INTEGER DEFAULT 0,
            completed_months TEXT DEFAULT '',
            monthly_budget INTEGER DEFAULT 0
        )
    ''')
    
    # 建立拼圖資料表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS puzzle_pieces (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id TEXT NOT NULL,
            piece_id INTEGER NOT NULL,
            map_id TEXT NOT NULL,
            category TEXT NOT NULL,
            is_shiny INTEGER NOT NULL DEFAULT 0,
            acquired_at TEXT NOT NULL
        )
    ''')
    
    # 建立好友關係資料表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS friends (
            account_id TEXT NOT NULL,
            friend_id TEXT NOT NULL,
            status TEXT NOT NULL,
            PRIMARY KEY (account_id, friend_id)
        )
    ''')
    
    # 建立商店商品資料表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS store_items (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            cost INTEGER NOT NULL,
            icon TEXT NOT NULL,
            is_piece INTEGER NOT NULL DEFAULT 0,
            max_limit INTEGER NOT NULL DEFAULT 1
        )
    ''')

    # 建立使用者兌換紀錄資料表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_redemptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id TEXT NOT NULL,
            item_id TEXT NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 0,
            redeemed_month TEXT
        )
    ''')
    
    # 向下相容：嘗試新增 redeemed_month 欄位
    try:
        cursor.execute("ALTER TABLE user_redemptions ADD COLUMN redeemed_month TEXT")
    except sqlite3.OperationalError:
        pass
        
    # 向下相容：嘗試新增 monthly_budget 欄位
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN monthly_budget INTEGER DEFAULT 0")
    except sqlite3.OperationalError:
        pass
        
    # 建立使用者帳號認證資料表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS auth_users (
            username TEXT PRIMARY KEY,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            account_id TEXT NOT NULL
        )
    ''')

    # 建立成就與徽章資料表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_badges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id TEXT NOT NULL,
            badge_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            icon TEXT NOT NULL,
            unlocked_at TEXT NOT NULL
        )
    ''')
    
    # 預設帳號初始化
    cursor.execute('SELECT COUNT(*) FROM auth_users')
    if cursor.fetchone()[0] == 0:
        default_users = [
            ("create001", "123456", "developer", "create001"),
            ("user1", "123123", "user", "user_1"),
            ("user_1", "123123", "user", "user_1"),
            ("user2", "321321", "user", "user_2"),
            ("user_2", "321321", "user", "user_2"),
            ("virtual_1", "111111", "user", "virtual_1"),
            ("virtual_2", "222222", "user", "virtual_2"),
            ("virtual_3", "333333", "user", "virtual_3"),
            ("virtual_4", "444444", "user", "virtual_4"),
            ("virtual_5", "555555", "user", "virtual_5")
        ]
        cursor.executemany('INSERT INTO auth_users (username, password, role, account_id) VALUES (?, ?, ?, ?)', default_users)

    
    # 檢查商店商品是否已有資料
    cursor.execute('SELECT COUNT(*) FROM store_items')
    store_count = cursor.fetchone()[0]
    if store_count == 0:
        store_items_data = [
            ('random_piece', '隨機拼圖碎片', 100, '🧩', 1, 0),
            ('711_voucher', '7-11 50元購物金', 300, '🏪', 0, 1),
            ('starbucks', '星巴克中杯拿鐵', 800, '☕', 0, 1),
            ('line_points', 'LINE POINTS 100點', 1000, '🟢', 0, 1),
            ('movie_ticket', '威秀電影票單人券', 2500, '🎫', 0, 1)
        ]
        cursor.executemany('''
            INSERT INTO store_items (id, name, cost, icon, is_piece, max_limit)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', store_items_data)

    
    # 檢查是否已有資料
    cursor.execute('SELECT COUNT(*) FROM expense_records')
    count = cursor.fetchone()[0]
    
    if count == 0:
        seed_data = []
        categories = ['早餐', '中餐', '晚餐', '飲料', '零食', '衣物', '鞋子', '飾品', '日用品', '交通', '書籍', '課程', '學費', '旅遊', '電影', '遊戲', '娛樂休閒', '其他(自填)', '薪水', '獎金', '投資', '其他收入']
        descriptions = {
            '早餐': ['三明治', '蛋餅', '飯糰', '咖啡'],
            '中餐': ['排骨便當', '牛肉麵', '水餃', '健康餐盒'],
            '晚餐': ['火鍋', '義大利麵', '自助餐', '環保餐盒外帶'],
            '飲料': ['珍珠奶茶', '手搖杯', '無糖綠茶'],
            '零食': ['洋芋片', '巧克力', '堅果'],
            '衣物': ['T恤', '外套', '牛仔褲'],
            '鞋子': ['運動鞋', '皮鞋', '拖鞋'],
            '飾品': ['手錶', '項鍊', '耳環'],
            '日用品': ['衛生紙', '洗衣精', '沐浴乳', '環保提袋'],
            '交通': ['捷運', '公車', '計程車', '加油', '高鐵'],
            '書籍': ['小說', '雜誌', '專業書'],
            '課程': ['線上課程', '英文課', '健身房'],
            '學費': ['學分費', '補習費'],
            '旅遊': ['住宿費', '機票', '門票'],
            '電影': ['電影票', '爆米花'],
            '遊戲': ['Steam遊戲', '點數卡'],
            '娛樂休閒': ['KTV', '展覽', '密室逃脫', '訂閱服務'],
            '其他(自填)': ['紅包', '捐款', '罰單'],
            '薪水': ['本月薪資', '兼職薪水'],
            '獎金': ['年終獎金', '績效獎金', '三節獎金'],
            '投資': ['股息', '基金收益'],
            '其他收入': ['二手拍賣', '中獎']
        }
        
        income_categories = ['薪水', '獎金', '投資', '其他收入']
        
        user_profiles = {
            'user_1': {
                'categories': ['早餐', '中餐', '晚餐', '飲料', '交通', '日用品', '電影', '遊戲', '薪水', '獎金'], 
                'amounts': [50, 80, 120, 150, 250, 300, 500, 1000, 5000, 35000],
                'check_in_streak': 6,
                'points': 500
            },
            'user_2': {
                'categories': ['交通', '衣物', '書籍', '中餐', '晚餐', '旅遊', '娛樂休閒', '薪水', '投資'], 
                'amounts': [35, 50, 100, 200, 500, 800, 1200, 1500, 3000, 10000, 40000],
                'check_in_streak': 14,
                'points': 1200
            }
        }
        
        now = datetime.now()
        yesterday_str = (now - timedelta(days=1)).date().isoformat()
        
        for user, profile in user_profiles.items():
            # user_1 生成過去 30 天的資料，user_2 生成過去 12 天的資料，製造進度差異
            days_to_generate = 30 if user == 'user_1' else 12
            
            # Setup user
            cursor.execute('''
                INSERT INTO users (account_id, check_in_streak, last_check_in_date, points)
                VALUES (?, ?, ?, ?)
            ''', (user, profile['check_in_streak'], yesterday_str, profile['points']))
            
            # Generate daily records and daily pieces
            for day_offset in range(days_to_generate):
                date = now - timedelta(days=day_offset)
                date_str = date.date().isoformat()
                
                # user_1 每天 2-3 筆, user_2 每天 1-2 筆
                num_records = random.randint(2, 3) if user == 'user_1' else random.randint(1, 2)
                
                # Add one puzzle piece per day for historical records
                piece_id = random.randint(0, 35)
                cursor.execute('''
                    INSERT INTO puzzle_pieces (account_id, piece_id, map_id, category, is_shiny, acquired_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (user, piece_id, 'season_1', 'expense', 0, date_str + "T12:00:00"))
                
                for _ in range(num_records):
                    category = random.choice(profile['categories'])
                    desc = random.choice(descriptions[category])
                    amount = random.choice(profile['amounts'])
                    is_sdg = 1 if ('環保' in desc or category == '交通') else 0
                    record_type = 'income' if category in income_categories else 'expense'
                    
                    # 隨機時間 (當天的幾點)
                    hour = random.randint(7, 22)
                    minute = random.randint(0, 59)
                    record_time = date.replace(hour=hour, minute=minute, second=0, microsecond=0)
                    
                    seed_data.append((
                        str(uuid.uuid4()),
                        user,
                        amount,
                        category,
                        desc,
                        is_sdg,
                        record_time.isoformat(),
                        record_type
                    ))
                    
            # Add virtual friends to user_1 and user_2
            virtual_friends = ['virtual_1', 'virtual_2', 'virtual_3', 'virtual_4', 'virtual_5']
            for vf in virtual_friends:
                cursor.execute('INSERT INTO friends (account_id, friend_id, status) VALUES (?, ?, ?)', (user, vf, 'accepted'))
                cursor.execute('INSERT INTO friends (account_id, friend_id, status) VALUES (?, ?, ?)', (vf, user, 'accepted'))
        
        # Setup virtual friends states
        virtual_data = {
            "virtual_1": {"check_in_streak": 5, "points": 100, "pieces": 3},
            "virtual_2": {"check_in_streak": 12, "points": 200, "pieces": 8},
            "virtual_3": {"check_in_streak": 2, "points": 50, "pieces": 1},
            "virtual_4": {"check_in_streak": 20, "points": 300, "pieces": 15},
            "virtual_5": {"check_in_streak": 30, "points": 400, "pieces": 25}
        }
        
        vf_profiles = {
            'virtual_1': {'categories': ['早餐', '中餐', '晚餐', '飲料', '交通', '日用品', '薪水'], 'amounts': [40, 70, 100, 50, 200, 150, 30000], 'days': 30},
            'virtual_2': {'categories': ['交通', '衣物', '書籍', '中餐', '晚餐', '薪水', '投資'], 'amounts': [35, 500, 300, 200, 500, 40000, 5000], 'days': 15},
            'virtual_3': {'categories': ['早餐', '中餐', '晚餐', '飲料', '交通', '薪水'], 'amounts': [60, 120, 150, 65, 30, 35000], 'days': 10},
            'virtual_4': {'categories': ['交通', '中餐', '晚餐', '旅遊', '娛樂休閒', '薪水'], 'amounts': [50, 200, 600, 1500, 1200, 45000], 'days': 20},
            'virtual_5': {'categories': ['早餐', '中餐', '晚餐', '交通', '投資', '薪水'], 'amounts': [100, 250, 400, 100, 8000, 60000], 'days': 30},
        }
        
        for vf, data in virtual_data.items():
            cursor.execute('INSERT OR IGNORE INTO users (account_id, check_in_streak, points) VALUES (?, ?, ?)', (vf, data['check_in_streak'], data['points']))
            for _ in range(data['pieces']):
                piece_id = random.randint(0, 35)
                cursor.execute('''
                    INSERT INTO puzzle_pieces (account_id, piece_id, map_id, category, is_shiny, acquired_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (vf, piece_id, 'season_1', 'store', 0, now.isoformat()))
            
            profile = vf_profiles[vf]
            for day_offset in range(profile['days']):
                date = now - timedelta(days=day_offset)
                num_records = random.randint(1, 3)
                for _ in range(num_records):
                    category = random.choice(profile['categories'])
                    desc = random.choice(descriptions[category])
                    amount = random.choice(profile['amounts'])
                    is_sdg = 1 if ('環保' in desc or category == '交通') else 0
                    record_type = 'income' if category in income_categories else 'expense'
                    
                    hour = random.randint(7, 22)
                    minute = random.randint(0, 59)
                    record_time = date.replace(hour=hour, minute=minute, second=0, microsecond=0)
                    
                    seed_data.append((
                        str(uuid.uuid4()),
                        vf,
                        amount,
                        category,
                        desc,
                        is_sdg,
                        record_time.isoformat(),
                        record_type
                    ))
        
        cursor.executemany('''
            INSERT INTO expense_records (id, account_id, amount, category, description, is_sdg, timestamp, record_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', seed_data)
        
        print(f"資料庫已成功初始化並寫入 {len(seed_data)} 筆歷史紀錄與使用者狀態。")
    else:
        print(f"資料庫已有 {count} 筆資料，跳過初始化。")
        
    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()

def get_user_state_from_db(account_id: str):
    from app.models import UserState, PuzzlePiece
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get user basics
    cursor.execute('SELECT * FROM users WHERE account_id = ?', (account_id,))
    user_row = cursor.fetchone()
    if not user_row:
        # Create user on the fly if not exists
        cursor.execute('INSERT INTO users (account_id) VALUES (?)', (account_id,))
        conn.commit()
        cursor.execute('SELECT * FROM users WHERE account_id = ?', (account_id,))
        user_row = cursor.fetchone()
        
    check_in_streak = user_row['check_in_streak']
    last_check_in_date = user_row['last_check_in_date']
    last_record_date = user_row['last_record_date']
    points = user_row['points']
    completed_months_str = user_row['completed_months'] or ''
    completed_months = completed_months_str.split(',') if completed_months_str else []
    
    monthly_budget = user_row['monthly_budget'] if 'monthly_budget' in user_row.keys() else 0
    
    # Get puzzle pieces
    cursor.execute('SELECT * FROM puzzle_pieces WHERE account_id = ?', (account_id,))
    piece_rows = cursor.fetchall()
    
    unlocked_pieces = []
    check_in_pieces = []
    redeemed_pieces = []
    
    for row in piece_rows:
        piece = PuzzlePiece(
            piece_id=row['piece_id'],
            map_id=row['map_id'],
            category=row['category'],
            is_shiny=bool(row['is_shiny']),
            acquired_at=datetime.fromisoformat(row['acquired_at'])
        )
        unlocked_pieces.append(piece)
        if row['category'] == 'check_in':
            check_in_pieces.append(piece)
        elif row['category'] == 'store':
            redeemed_pieces.append(piece)
            
    # Get friends
    cursor.execute('SELECT friend_id, status FROM friends WHERE account_id = ?', (account_id,))
    friend_rows = cursor.fetchall()
    
    friends_list = []
    pending_friend_notifications = []
    for row in friend_rows:
        if row['status'] == 'accepted':
            friends_list.append(row['friend_id'])
            
    # Get pending notifications (others who added this user, where status='pending')
    # Actually our logic for notifications was: if A adds B, we insert (A, B, 'accepted') and (B, A, 'pending')
    # Let's adjust this logic: a friend notification is just checking who added me that I haven't added back.
    # We will query: friends where friend_id = account_id AND status = 'accepted' AND account_id NOT IN (my friends)
    cursor.execute('''
        SELECT account_id FROM friends 
        WHERE friend_id = ? AND status = 'accepted'
        AND account_id NOT IN (SELECT friend_id FROM friends WHERE account_id = ? AND status = 'accepted')
    ''', (account_id, account_id))
    pending_rows = cursor.fetchall()
    pending_friend_notifications = [row['account_id'] for row in pending_rows]
    
    # Get badges
    cursor.execute('SELECT * FROM user_badges WHERE account_id = ?', (account_id,))
    badge_rows = cursor.fetchall()
    
    unlocked_badges = []
    from app.models import Badge
    for row in badge_rows:
        unlocked_badges.append(Badge(
            id=row['badge_id'],
            name=row['name'],
            description=row['description'],
            icon=row['icon'],
            unlocked_at=datetime.fromisoformat(row['unlocked_at'])
        ))
        
    conn.close()
    
    return UserState(
        user_id=account_id,
        last_record_date=last_record_date,
        unlocked_pieces=unlocked_pieces,
        check_in_pieces=check_in_pieces,
        redeemed_pieces=redeemed_pieces,
        completed_months=completed_months,
        unlocked_badges=unlocked_badges,
        check_in_streak=check_in_streak,
        last_check_in_date=last_check_in_date,
        friends=friends_list,
        pending_friend_notifications=pending_friend_notifications,
        points=points,
        monthly_budget=monthly_budget
    )

def save_user_badge_to_db(account_id: str, badge):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO user_badges (account_id, badge_id, name, description, icon, unlocked_at)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (account_id, badge.id, badge.name, badge.description, badge.icon, badge.unlocked_at.isoformat()))
    conn.commit()
    conn.close()

def save_user_state_to_db(user_state):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    completed_months_str = ','.join(user_state.completed_months)
    cursor.execute('''
        UPDATE users 
        SET check_in_streak = ?, last_check_in_date = ?, last_record_date = ?, points = ?, completed_months = ?, monthly_budget = ?
        WHERE account_id = ?
    ''', (user_state.check_in_streak, user_state.last_check_in_date, user_state.last_record_date, user_state.points, completed_months_str, user_state.monthly_budget, user_state.user_id))
    
    conn.commit()
    conn.close()

def save_puzzle_piece_to_db(account_id: str, piece):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO puzzle_pieces (account_id, piece_id, map_id, category, is_shiny, acquired_at)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (account_id, piece.piece_id, piece.map_id, piece.category, int(piece.is_shiny), piece.acquired_at.isoformat()))
    conn.commit()
    conn.close()

def get_store_items():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM store_items')
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_store_item_by_id(item_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM store_items WHERE id = ?', (item_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def add_store_item(item_data: dict):
    conn = get_db_connection()
    cursor = conn.cursor()
    import uuid
    item_id = item_data.get('id') or str(uuid.uuid4())
    cursor.execute('''
        INSERT INTO store_items (id, name, cost, icon, is_piece, max_limit)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (item_id, item_data['name'], item_data['cost'], item_data['icon'], int(item_data['is_piece']), item_data.get('max_limit', 1)))
    conn.commit()
    conn.close()
    return item_id

def update_store_item(item_id: str, item_data: dict):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE store_items
        SET name = ?, cost = ?, icon = ?, is_piece = ?, max_limit = ?
        WHERE id = ?
    ''', (item_data['name'], item_data['cost'], item_data['icon'], int(item_data['is_piece']), item_data.get('max_limit', 1), item_id))
    conn.commit()
    conn.close()

def delete_store_item(item_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM store_items WHERE id = ?', (item_id,))
    conn.commit()
    conn.close()

def get_user_redemption_count(account_id: str, item_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    current_month = datetime.now().strftime("%Y-%m")
    cursor.execute('SELECT SUM(quantity) as total FROM user_redemptions WHERE account_id = ? AND item_id = ? AND redeemed_month = ?', (account_id, item_id, current_month))
    row = cursor.fetchone()
    conn.close()
    return row['total'] if row and row['total'] else 0

def get_all_user_redemptions(account_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    current_month = datetime.now().strftime("%Y-%m")
    cursor.execute('SELECT item_id, SUM(quantity) as total FROM user_redemptions WHERE account_id = ? AND redeemed_month = ? GROUP BY item_id', (account_id, current_month))
    rows = cursor.fetchall()
    conn.close()
    return {row['item_id']: row['total'] for row in rows}

def add_user_redemption(account_id: str, item_id: str, quantity: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    current_month = datetime.now().strftime("%Y-%m")
    cursor.execute('''
        INSERT INTO user_redemptions (account_id, item_id, quantity, redeemed_month)
        VALUES (?, ?, ?, ?)
    ''', (account_id, item_id, quantity, current_month))
    conn.commit()
    conn.close()

def get_auth_user(username: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM auth_users WHERE username = ?', (username,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def create_auth_user(username: str, password: str, role: str, account_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO auth_users (username, password, role, account_id)
        VALUES (?, ?, ?, ?)
    ''', (username, password, role, account_id))
    
    # Initialize user state
    if role == 'user':
        cursor.execute('''
            INSERT OR IGNORE INTO users (account_id, check_in_streak, points)
            VALUES (?, 0, 0)
        ''', (account_id,))
        
    conn.commit()
    conn.close()

def get_all_normal_users():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT username, account_id FROM auth_users WHERE role = "user"')
    rows = cursor.fetchall()
    conn.close()
    return [{"username": row["username"], "account_id": row["account_id"]} for row in rows]
