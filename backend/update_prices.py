import sqlite3

def update_db():
    conn = sqlite3.connect('puzzle_world.db')
    cursor = conn.cursor()
    cursor.execute('SELECT id, category, description, amount FROM expense_records')
    records = cursor.fetchall()

    for r in records:
        r_id, cat, desc, amount = r
        desc = desc or ""
        new_amount = amount

        # 根據描述或類別給予合理價格
        if "咖啡" in desc or "拿鐵" in desc:
            new_amount = 120
        elif "早餐" in cat or "三明治" in desc or "蛋餅" in desc:
            new_amount = 65
        elif "午餐" in cat or "便當" in desc or "自助餐" in desc:
            new_amount = 120
        elif "晚餐" in cat or "火鍋" in desc or "牛排" in desc:
            new_amount = 350
        elif "交通" in cat or "捷運" in desc or "公車" in desc:
            new_amount = 30
        elif "計程車" in desc or "Uber" in desc:
            new_amount = 250
        elif "飲料" in desc or "手搖" in desc:
            new_amount = 60
        elif "電影" in desc:
            new_amount = 320
        elif "網購" in desc or "衣服" in desc:
            new_amount = 800
        elif "房租" in desc:
            new_amount = 8000
        elif "水電" in desc:
            new_amount = 1500
        elif "加油" in desc:
            new_amount = 1000
        elif "書" in desc or "文具" in desc:
            new_amount = 350
        elif "薪水" in desc:
            new_amount = 50000
        elif "獎金" in desc:
            new_amount = 5000
        elif "發票" in desc:
            new_amount = 200
        else:
            # Fallback based on category
            if cat == "早餐": new_amount = 80
            elif cat == "午餐": new_amount = 150
            elif cat == "晚餐": new_amount = 200
            elif cat == "交通": new_amount = 50
            elif cat == "娛樂": new_amount = 500
            elif cat == "購物": new_amount = 1000
            elif cat == "薪水": new_amount = 45000

        if new_amount != amount:
            print(f"Updating {r_id}: {cat} - {desc} from {amount} to {new_amount}")
            cursor.execute('UPDATE expense_records SET amount = ? WHERE id = ?', (new_amount, r_id))

    conn.commit()
    conn.close()

if __name__ == '__main__':
    update_db()
