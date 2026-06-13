# 記帳冒險 - Puzzle World

## 專案簡介
Puzzle World 是一個結合「記帳」與「遊戲化收集」的網頁應用程式。使用者可以透過每天記錄收支來獲得點數與拼圖，完成每個月的拼圖挑戰，培養良好的記帳習慣。

## 功能特色
- **遊戲化記帳**：結合拼圖與徽章收集系統。
- **好友排行與社群**：追蹤好友的簽到進度與連續記帳天數。
- **兌換商店**：使用記帳獲得的點數兌換豐富獎勵或補簽拼圖。
- **收支分析**：直觀的圖表呈現每月的財務狀況。

## 系統需求與技術堆疊
- **前端**：HTML, CSS (Vanilla), JavaScript, Chart.js
- **後端**：Python, FastAPI, SQLite
- **伺服器運作**：Uvicorn

## 安裝與執行方式
### 1. 後端環境設定
進入 `backend` 資料夾並安裝套件：
```bash
cd C:\Users\Administrator\Desktop\Puzzle-World-main\backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

### 2. 前端介面啟動
打開另一個終端機，進入 `frontend` 資料夾並啟動本地伺服器：
```bash
cd C:\Users\Administrator\Desktop\Puzzle-World-main\frontend
python -m http.server 8080
```
接著在瀏覽器打開 `http://localhost:8080` 即可使用。
