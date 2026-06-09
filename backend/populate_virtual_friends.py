import sqlite3
import os
import uuid
import random
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), "puzzle_world.db")

def populate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    virtual_friends = ['virtual_1', 'virtual_2', 'virtual_3', 'virtual_4', 'virtual_5']
    
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
    
    vf_profiles = {
        'virtual_1': {'categories': ['早餐', '中餐', '晚餐', '飲料', '交通', '日用品', '薪水'], 'amounts': [40, 70, 100, 50, 200, 150, 30000], 'days': 30},
        'virtual_2': {'categories': ['交通', '衣物', '書籍', '中餐', '晚餐', '薪水', '投資'], 'amounts': [35, 500, 300, 200, 500, 40000, 5000], 'days': 15},
        'virtual_3': {'categories': ['早餐', '中餐', '晚餐', '飲料', '交通', '薪水'], 'amounts': [60, 120, 150, 65, 30, 35000], 'days': 10},
        'virtual_4': {'categories': ['交通', '中餐', '晚餐', '旅遊', '娛樂休閒', '薪水'], 'amounts': [50, 200, 600, 1500, 1200, 45000], 'days': 20},
        'virtual_5': {'categories': ['早餐', '中餐', '晚餐', '交通', '投資', '薪水'], 'amounts': [100, 250, 400, 100, 8000, 60000], 'days': 30},
    }
    
    seed_data = []
    now = datetime.now()
    
    # 檢查是否已經有資料，避免重複寫入
    cursor.execute("SELECT COUNT(*) FROM expense_records WHERE account_id LIKE 'virtual_%'")
    if cursor.fetchone()[0] > 0:
        # 如果已經有了就刪除重新建立
        cursor.execute("DELETE FROM expense_records WHERE account_id LIKE 'virtual_%'")
        print("刪除已存在的虛擬好友資料，重新建立...")

    for vf in virtual_friends:
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
    
    conn.commit()
    conn.close()
    print(f"成功為虛擬好友寫入 {len(seed_data)} 筆資料。")

if __name__ == '__main__':
    populate()
