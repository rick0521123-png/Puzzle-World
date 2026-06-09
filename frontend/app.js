// Constants
const API_BASE = 'http://127.0.0.1:8000/api';
const TOTAL_PIECES = 36;
const ALL_BADGES = [
    { id: "b01", name: "踏出第一步", desc: "記錄了第 1 筆收支", icon: "🏁" },
    { id: "b02", name: "記帳新手", desc: "記錄滿 10 筆收支", icon: "📝" },
    { id: "b03", name: "記帳達人", desc: "記錄滿 50 筆收支", icon: "📓" },
    { id: "b04", name: "記帳大師", desc: "記錄滿 100 筆收支", icon: "👑" },
    { id: "b05", name: "綠色新手", desc: "完成第 1 筆永續消費", icon: "🌱" },
    { id: "b06", name: "永續達人", desc: "完成第 10 筆永續消費", icon: "🌳" },
    { id: "b07", name: "地球守護者", desc: "完成第 30 筆永續消費", icon: "🌍" },
    { id: "b08", name: "早鳥出擊", desc: "在早上 5:00 - 9:00 之間新增記錄", icon: "🌅" },
    { id: "b09", name: "夜貓記帳", desc: "在晚上 22:00 - 02:00 之間新增記錄", icon: "🦉" },
    { id: "b10", name: "精打細算", desc: "單筆消費低於 50 元", icon: "🪙" },
    { id: "b11", name: "大手筆", desc: "單筆消費高於 5000 元", icon: "💎" },
    { id: "b12", name: "週末狂歡", desc: "在週六或週日新增消費", icon: "🎉" },
    { id: "b13", name: "簽到新手", desc: "連續簽到天數達 3 天", icon: "🔥" },
    { id: "b14", name: "簽到達人", desc: "連續簽到天數達 7 天", icon: "⚡" },
    { id: "b15", name: "簽到狂熱", desc: "連續簽到天數達 30 天", icon: "🏆" },
    { id: "b16", name: "拼圖學徒", desc: "解鎖 10 片拼圖", icon: "🧩" },
    { id: "b17", name: "拼圖大師", desc: "解鎖 36 片拼圖", icon: "🖼️" },
    { id: "b18", name: "點數富翁", desc: "總獲得點數超過 500 點", icon: "💰" },
    { id: "b19", name: "財富自由", desc: "總獲得點數超過 2000 點", icon: "🚀" },
    { id: "b20", name: "勤勞記帳", desc: "累積記帳達 15 天", icon: "📅" }
];
let currentCheckInStreak = 0;
let unlockedPieces = [];
let unlockedBadges = [];
let currentBudget = 0;
let expenseChart;
let trendChart;
let editingRecordId = null;
let currentRecords = [];

// New Categories
const expenseCategories = [
    { name: '早餐', icon: '🥪' },
    { name: '中餐', icon: '🍱' },
    { name: '晚餐', icon: '🍲' },
    { name: '飲料', icon: '🧋' },
    { name: '零食', icon: '🍪' },
    { name: '衣物', icon: '👕' },
    { name: '鞋子', icon: '👟' },
    { name: '飾品', icon: '💍' },
    { name: '日用品', icon: '🧻' },
    { name: '交通', icon: '🚌' },
    { name: '書籍', icon: '📚' },
    { name: '課程', icon: '📝' },
    { name: '學費', icon: '🏫' },
    { name: '旅遊', icon: '✈️' },
    { name: '電影', icon: '🍿' },
    { name: '遊戲', icon: '🎮' },
    { name: '娛樂休閒', icon: '🎡' },
    { name: '其他(自填)', icon: '✨' }
];

const incomeCategories = [
    { name: '薪水', icon: '💰' },
    { name: '獎金', icon: '🎁' },
    { name: '投資', icon: '📈' },
    { name: '其他收入', icon: '✨' }
];

function getCategoryName(cat) {
    const legacyMap = { food: '餐飲', transport: '交通', entertainment: '娛樂', shopping: '購物' };
    return legacyMap[cat] || cat;
}

function getCategoryIcon(catName) {
    const legacyIconMap = { food: '🍽️', transport: '🚌', entertainment: '🎡', shopping: '🛍️' };
    if (legacyIconMap[catName]) return legacyIconMap[catName];
    
    const mappedName = getCategoryName(catName);
    let cat = expenseCategories.find(c => c.name === mappedName);
    if (cat) return cat.icon;
    cat = incomeCategories.find(c => c.name === mappedName);
    if (cat) return cat.icon;
    return '✨'; // Default icon for custom
}

// DOM Elements
const puzzleBoard = document.getElementById('puzzle-board');
const streakCount = document.getElementById('streak-count');
const form = document.getElementById('expense-form');
const notification = document.getElementById('notification-area');
const expenseList = document.getElementById('expense-list');
const themeToggleBtn = document.getElementById('theme-toggle');
const puzzleUpload = document.getElementById('puzzle-upload');
const monthFilter = document.getElementById('month-filter');
const puzzlePrevMonthBtn = document.getElementById('puzzle-prev-month');
const puzzleNextMonthBtn = document.getElementById('puzzle-next-month');
const puzzleMonthDisplay = document.getElementById('puzzle-month-display');
const puzzleUploadLabel = document.getElementById('puzzle-upload-label');

// New UI Elements
const btnTypeExpense = document.getElementById('btn-type-expense');
const btnTypeIncome = document.getElementById('btn-type-income');
const recordTypeInput = document.getElementById('record-type');

const btnChartExpense = document.getElementById('btn-chart-expense');
const btnChartIncome = document.getElementById('btn-chart-income');
const analysisPeriodType = document.getElementById('analysis-period-type');
const analysisMonthFilter = document.getElementById('analysis-month-filter');
const analysisWeekFilter = document.getElementById('analysis-week-filter');

const chartDetailModal = document.getElementById('chart-detail-modal');
const btnCloseChartDetail = document.getElementById('btn-close-chart-detail');
const chartDetailTitle = document.getElementById('chart-detail-title');
const chartDetailList = document.getElementById('chart-detail-list');

let currentFormType = 'expense';
let currentChartType = 'expense';

// Budget UI Elements
const btnSetBudget = document.getElementById('btn-set-budget');
const budgetModal = document.getElementById('budget-modal');
const budgetInput = document.getElementById('budget-input');
const btnBudgetCancel = document.getElementById('btn-budget-cancel');
const btnBudgetConfirm = document.getElementById('btn-budget-confirm');
const budgetSpentDisplay = document.getElementById('budget-spent-display');
const budgetTotalDisplay = document.getElementById('budget-total-display');
const budgetProgressBar = document.getElementById('budget-progress-bar');

// Badges UI Elements
const btnViewBadges = document.getElementById('btn-view-badges');
const badgesList = document.getElementById('badges-list');
const badgeCountDisplay = document.getElementById('badge-count-display');

// Splash Screen & Login Elements
const splashScreen = document.getElementById('splash-screen');
const btnStartApp = document.getElementById('btn-start-app');
const loginModal = document.getElementById('login-modal');
const loginRoleSelection = document.getElementById('login-role-selection');
const loginFormArea = document.getElementById('login-form-area');
const btnRoleUser = document.getElementById('btn-role-user');
const btnRoleDev = document.getElementById('btn-role-dev');
const btnBackToRoles = document.getElementById('btn-back-to-roles');
const loginUsernameInput = document.getElementById('login-username');
const loginPasswordInput = document.getElementById('login-password');
const btnDoLogin = document.getElementById('btn-do-login');
const btnLogout = document.getElementById('btn-logout');

const btnTabLogin = document.getElementById('btn-tab-login');
const btnTabRegister = document.getElementById('btn-tab-register');
const formLoginSection = document.getElementById('form-login-section');
const formRegisterSection = document.getElementById('form-register-section');
const registerUsernameInput = document.getElementById('register-username');
const registerPasswordInput = document.getElementById('register-password');
const btnDoRegister = document.getElementById('btn-do-register');

async function populateDeveloperUsers() {
    try {
        const res = await fetch(`${API_BASE}/users`);
        if (res.ok) {
            const users = await res.json();
            accountSwitcher.innerHTML = '<option value="" disabled selected>請選擇使用者...</option>';
            users.forEach(user => {
                const opt = document.createElement('option');
                opt.value = user.account_id;
                opt.textContent = `帳號：${user.username}`;
                accountSwitcher.appendChild(opt);
            });
        }
    } catch(err) {
        console.error("Failed to fetch users for dev", err);
    }
}

let currentRole = 'user'; // 'user' or 'developer'

btnStartApp.addEventListener('click', () => {
    splashScreen.classList.add('hidden');
    loginModal.style.display = 'flex';
});

btnRoleUser.addEventListener('click', () => {
    loginRoleSelection.style.display = 'none';
    loginFormArea.style.display = 'flex';
});

btnRoleDev.addEventListener('click', () => {
    loginRoleSelection.style.display = 'none';
    loginFormArea.style.display = 'flex';
});

btnBackToRoles.addEventListener('click', () => {
    loginFormArea.style.display = 'none';
    loginRoleSelection.style.display = 'flex';
    loginUsernameInput.value = '';
    loginPasswordInput.value = '';
});

loginFormArea.addEventListener('submit', (e) => {
    e.preventDefault();
    if (formRegisterSection.style.display === 'flex') {
        if (btnDoRegister) btnDoRegister.click();
    } else {
        btnDoLogin.click();
    }
});

btnDoLogin.addEventListener('click', async (e) => {
    e.preventDefault();
    const username = loginUsernameInput.value.trim();
    const password = loginPasswordInput.value.trim();
    if (!username || !password) {
        showNotification('請輸入帳號與密碼', 'warning');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        
        if (res.ok && data.status === 'success') {
            currentAccount = data.username;
            currentRole = data.role;
            
            loginModal.style.display = 'none';
            
            // Handle developer UI
            if (currentRole === 'developer') {
                document.querySelectorAll('.user-nav-items').forEach(el => el.style.display = 'none');
                document.querySelectorAll('.dev-nav-items').forEach(el => el.style.display = 'flex');
                document.getElementById('user-points-display').style.display = 'none';
                accountSwitcher.style.display = 'block';
                
                await populateDeveloperUsers();
                accountSwitcher.value = ''; // 登入後強制清空選項，需要重新選擇
                
                // 清空清單
                allRecords = [];
                applyFilters();
                switchView('manage-users-view');
            } else {
                document.querySelectorAll('.user-nav-items').forEach(el => el.style.display = 'flex');
                document.querySelectorAll('.dev-nav-items').forEach(el => el.style.display = 'none');
                document.getElementById('user-points-display').style.display = 'flex';
                accountSwitcher.style.display = 'none';
                switchView('home-view');
            }
            
            btnLogout.style.display = 'block';
            
            showNotification(data.message, 'success');
            
            // Fetch initial state if not developer, or if user is already selected (for normal user)
            if (currentRole !== 'developer') {
                fetchUserState();
                fetchRecords();
                fetchFriends();
                fetchFriendNotifications();
                fetchStoreItems();
            }
        } else {
            showNotification(data.detail || '帳號或密碼錯誤', 'error');
        }
    } catch (err) {
        console.error(err);
        showNotification('登入請求失敗', 'error');
    }
});

btnLogout.addEventListener('click', () => {
    // Reset state
    currentAccount = 'user1'; 
    currentRole = 'user';
    
    // Clear UI inputs if necessary
    loginUsernameInput.value = '';
    loginPasswordInput.value = '';
    if(registerUsernameInput) registerUsernameInput.value = '';
    if(registerPasswordInput) registerPasswordInput.value = '';
    if(btnTabLogin) btnTabLogin.click();
    
    // Switch UI back to splash screen
    splashScreen.classList.remove('hidden');
    loginModal.style.display = 'none';
    btnLogout.style.display = 'none';
    accountSwitcher.style.display = 'none';
    
    // Go to home view as default for next login
    document.querySelectorAll('.user-nav-items').forEach(el => el.style.display = 'flex');
    document.querySelectorAll('.dev-nav-items').forEach(el => el.style.display = 'none');
    document.getElementById('user-points-display').style.display = 'flex';
    switchView('home-view');
    showNotification('已登出', 'info');
});

if (btnTabLogin && btnTabRegister) {
    btnTabLogin.addEventListener('click', () => {
        formLoginSection.style.display = 'flex';
        formRegisterSection.style.display = 'none';
        btnTabLogin.style.background = 'var(--accent-primary)';
        btnTabLogin.style.color = 'white';
        btnTabRegister.style.background = 'var(--bg-card)';
        btnTabRegister.style.color = 'var(--text-primary)';
    });

    btnTabRegister.addEventListener('click', () => {
        formLoginSection.style.display = 'none';
        formRegisterSection.style.display = 'flex';
        btnTabRegister.style.background = 'var(--accent-primary)';
        btnTabRegister.style.color = 'white';
        btnTabLogin.style.background = 'var(--bg-card)';
        btnTabLogin.style.color = 'var(--text-primary)';
    });
}

if (btnDoRegister) {
    btnDoRegister.addEventListener('click', async (e) => {
        e.preventDefault();
        const username = registerUsernameInput.value.trim();
        const password = registerPasswordInput.value.trim();
        if (!username || !password) {
            showNotification('請輸入註冊帳號與密碼', 'warning');
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            
            if (res.ok && data.status === 'success') {
                showNotification(data.message, 'success');
                // Auto switch to login tab and fill username
                btnTabLogin.click();
                loginUsernameInput.value = username;
                loginPasswordInput.value = password; 
            } else {
                showNotification(data.detail || '註冊失敗', 'error');
            }
        } catch (err) {
            showNotification('註冊請求失敗', 'error');
        }
    });
}

// Menu Toggle Logic
const menuToggle = document.getElementById('menu-toggle');
const dropdownNav = document.getElementById('dropdown-nav');

function toggleMenu(e) {
    if (e) e.stopPropagation();
    if (dropdownNav.style.display === 'none') {
        dropdownNav.style.display = 'flex';
        dropdownNav.style.flexDirection = 'column';
    } else {
        dropdownNav.style.display = 'none';
    }
}

if (menuToggle) {
    menuToggle.addEventListener('click', toggleMenu);
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (dropdownNav && dropdownNav.style.display !== 'none' && !menuToggle.contains(e.target) && !dropdownNav.contains(e.target)) {
        dropdownNav.style.display = 'none';
    }
});

// Navigation Logic
const navItems = document.querySelectorAll('.nav-item');
const viewSections = document.querySelectorAll('.view-section');

function switchView(targetId) {
    // Update nav buttons
    navItems.forEach(item => {
        if (item.dataset.target === targetId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Update views
    viewSections.forEach(section => {
        if (section.id === targetId) {
            section.classList.add('active');
            // If switching to analysis view, tell Chart.js to resize to fix canvas size bug
            if (targetId === 'analysis-view' && expenseChart) {
                setTimeout(() => expenseChart.resize(), 10);
            }
            if (targetId === 'friends-view') {
                fetchFriends();
                fetchFriendNotifications();
            }
            if (targetId === 'badges-view') {
                checkAndRenderBadges();
            }
        } else {
            section.classList.remove('active');
        }
    });

    if (dropdownNav && dropdownNav.style.display !== 'none') {
        dropdownNav.style.display = 'none';
    }
}

navItems.forEach(item => {
    item.addEventListener('click', () => {
        switchView(item.dataset.target);
    });
});

// Category Selector Logic
const categorySelector = document.getElementById('category-selector');
const categoryModal = document.getElementById('category-modal');
const btnCloseCategory = document.getElementById('btn-close-category');

const userPointsDisplay = document.getElementById('user-points-display');
if (userPointsDisplay) {
    userPointsDisplay.addEventListener('click', () => {
        switchView('store-view');
        // Close dropdown if open
        if (dropdownNav && dropdownNav.style.display !== 'none') {
            dropdownNav.style.display = 'none';
        }
    });
}
const categoryGrid = document.getElementById('category-grid');
const customCategoryInput = document.getElementById('custom-category-input');
const customCategoryText = document.getElementById('custom-category-text');
const btnConfirmCustomCategory = document.getElementById('btn-confirm-custom-category');
const categoryHiddenInput = document.getElementById('category');
const selectedCategoryIcon = document.getElementById('selected-category-icon');
const selectedCategoryText = document.getElementById('selected-category-text');

function renderCategoryGrid() {
    if (!categoryGrid) return;
    categoryGrid.innerHTML = '';
    const activeCategories = currentFormType === 'income' ? incomeCategories : expenseCategories;
    activeCategories.forEach(cat => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'glass-panel';
        btn.style.cssText = 'display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 12px 8px; border: 1px solid var(--glass-border); border-radius: 12px; cursor: pointer; transition: transform 0.1s, background 0.2s; background: var(--input-bg);';
        
        btn.onmouseover = () => btn.style.background = 'var(--glass-bg-hover)';
        btn.onmouseout = () => btn.style.background = 'var(--input-bg)';
        
        btn.innerHTML = `
            <span style="font-size: 24px;">${cat.icon}</span>
            <span style="font-size: 13px; color: var(--text-primary); text-align: center; line-height: 1.2;">${cat.name}</span>
        `;
        
        btn.onclick = () => {
            if (cat.name === '其他(自填)') {
                customCategoryInput.style.display = 'flex';
                customCategoryText.focus();
            } else {
                selectCategory(cat.name, cat.icon);
            }
        };
        categoryGrid.appendChild(btn);
    });
}

function selectCategory(name, icon) {
    categoryHiddenInput.value = name;
    selectedCategoryText.textContent = name;
    selectedCategoryIcon.textContent = icon;
    closeCategoryModal();
}

function closeCategoryModal() {
    if(categoryModal) categoryModal.style.display = 'none';
    if(customCategoryInput) customCategoryInput.style.display = 'none';
    if(customCategoryText) customCategoryText.value = '';
}

if (categorySelector) {
    categorySelector.addEventListener('click', () => {
        categoryModal.style.display = 'flex';
    });
}

if (btnCloseCategory) {
    btnCloseCategory.addEventListener('click', closeCategoryModal);
}

if (btnConfirmCustomCategory) {
    btnConfirmCustomCategory.addEventListener('click', (e) => {
        e.preventDefault();
        const customName = customCategoryText.value.trim();
        if (customName) {
            selectCategory(customName, '✨');
        } else {
            showNotification('請輸入類別名稱', 'warning');
        }
    });
}

if (btnTypeExpense && btnTypeIncome) {
    btnTypeExpense.addEventListener('click', () => {
        currentFormType = 'expense';
        if(recordTypeInput) recordTypeInput.value = 'expense';
        btnTypeExpense.style.background = 'var(--accent-primary)';
        btnTypeExpense.style.color = 'white';
        btnTypeIncome.style.background = 'transparent';
        btnTypeIncome.style.color = 'var(--text-secondary)';
        renderCategoryGrid();
        const firstCat = expenseCategories[0];
        selectCategory(firstCat.name, firstCat.icon);
    });

    btnTypeIncome.addEventListener('click', () => {
        currentFormType = 'income';
        if(recordTypeInput) recordTypeInput.value = 'income';
        btnTypeIncome.style.background = 'var(--success)';
        btnTypeIncome.style.color = 'white';
        btnTypeExpense.style.background = 'transparent';
        btnTypeExpense.style.color = 'var(--text-secondary)';
        renderCategoryGrid();
        const firstCat = incomeCategories[0];
        selectCategory(firstCat.name, firstCat.icon);
    });
}

renderCategoryGrid();

// Check-In Elements
const checkInModal = document.getElementById('check-in-modal');
const btnCheckIn = document.getElementById('btn-check-in');
const btnCloseCheckIn = document.getElementById('btn-close-check-in');
const checkInStreakDisplay = document.getElementById('check-in-streak-display');
const ms7 = document.getElementById('ms-7');
const ms15 = document.getElementById('ms-15');
const ms25 = document.getElementById('ms-25');

let allRecords = []; // Store all fetched records

// Set default month filter to current month
const actualCurrentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
const currentMonthStr = actualCurrentMonthStr;
monthFilter.value = currentMonthStr;

let currentPuzzleMonthStr = actualCurrentMonthStr;

monthFilter.addEventListener('change', () => {
    applyFilters();
});

function changePuzzleMonth(offset) {
    const [year, month] = currentPuzzleMonthStr.split('-');
    let date = new Date(parseInt(year), parseInt(month) - 1 + offset, 1);
    currentPuzzleMonthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    updatePuzzleMonthUI();
}

puzzlePrevMonthBtn.addEventListener('click', () => changePuzzleMonth(-1));
puzzleNextMonthBtn.addEventListener('click', () => changePuzzleMonth(1));

function updatePuzzleMonthUI() {
    puzzleMonthDisplay.textContent = currentPuzzleMonthStr;
    if (currentPuzzleMonthStr >= actualCurrentMonthStr) {
        puzzleNextMonthBtn.disabled = true;
        puzzleNextMonthBtn.style.opacity = '0.5';
    } else {
        puzzleNextMonthBtn.disabled = false;
        puzzleNextMonthBtn.style.opacity = '1';
    }

    if (currentPuzzleMonthStr < actualCurrentMonthStr) {
        puzzleUploadLabel.style.display = 'none';
    } else {
        puzzleUploadLabel.style.display = 'inline-block';
    }

    initPuzzleBoard();
    updateUI();
}

const accountSwitcher = document.getElementById('account-switcher');
let currentAccount = 'user_1'; // Default, will be overridden by login

accountSwitcher.addEventListener('change', (e) => {
    if (e.target.value) {
        currentAccount = e.target.value;
        // 如果是開發者或切換帳號，則更新用戶狀態（拼圖、簽到等）
        fetchUserState(false);
        fetchRecords();
        fetchStoreItems();
        if (currentRole !== 'developer') {
            fetchFriends();
            fetchFriendNotifications();
        }
    }
});

// Theme Management
let currentTheme = localStorage.getItem('theme') || 'dark';

function applyTheme(theme) {
    if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        themeToggleBtn.textContent = '🌙';
    } else {
        document.documentElement.removeAttribute('data-theme');
        themeToggleBtn.textContent = '☀️';
    }

    // Update Chart Text Color if it exists
    if (expenseChart) {
        const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#f8fafc';
        expenseChart.options.plugins.legend.labels.color = textColor;
        expenseChart.update();
    }
}

themeToggleBtn.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', currentTheme);
    applyTheme(currentTheme);
});

// Initialize Puzzle Board
function renderBoardToContainer(containerEl, backgroundImage) {
    if (!containerEl) return;
    containerEl.innerHTML = '';
    for (let i = 0; i < TOTAL_PIECES; i++) {
        const piece = document.createElement('div');
        piece.className = 'puzzle-piece';
        piece.dataset.pieceId = i;

        // Calculate grid position (6x6)
        const row = Math.floor(i / 6);
        const col = i % 6;

        // Background percentage positioning for a 6x6 grid (5 segments)
        const xPos = (col / 5) * 100;
        const yPos = (row / 5) * 100;
        piece.style.backgroundPosition = `${xPos}% ${yPos}%`;
        piece.style.backgroundImage = backgroundImage;

        containerEl.appendChild(piece);
    }
}

function initPuzzleBoard() {
    // 1. Main Puzzle Board
    const customImage = localStorage.getItem(`puzzle_image_${currentAccount}_${currentPuzzleMonthStr}`);
    let backgroundImage = `url('puzzle_bg.png')`;

    if (customImage) {
        backgroundImage = `url(${customImage})`;
    } else if (currentPuzzleMonthStr < actualCurrentMonthStr) {
        let hash = 0;
        for (let i = 0; i < currentPuzzleMonthStr.length; i++) {
            hash = currentPuzzleMonthStr.charCodeAt(i) + ((hash << 5) - hash);
        }
        const seed = Math.abs(hash);
        backgroundImage = `url('https://picsum.photos/seed/${seed}/600/600')`;
    }

    renderBoardToContainer(document.getElementById('puzzle-board'), backgroundImage);

    // 2. Home Puzzle Board (Always shows actual current month)
    const homeCustomImage = localStorage.getItem(`puzzle_image_${currentAccount}_${actualCurrentMonthStr}`);
    let homeBackgroundImage = `url('puzzle_bg.png')`;
    if (homeCustomImage) {
        homeBackgroundImage = `url(${homeCustomImage})`;
    }
    renderBoardToContainer(document.getElementById('home-puzzle-board'), homeBackgroundImage);
}

// --- Image Crop Variables ---
const cropModal = document.getElementById('crop-modal');
const cropCanvas = document.getElementById('crop-canvas');
const zoomSlider = document.getElementById('zoom-slider');
const btnCropCancel = document.getElementById('btn-crop-cancel');
const btnCropApply = document.getElementById('btn-crop-apply');
const ctxCrop = cropCanvas.getContext('2d');

let cropImage = new Image();
let imgScale = 1;
let imgX = 0;
let imgY = 0;
let isDragging = false;
let startX, startY;

// Handle Custom Puzzle Upload - Open Modal
puzzleUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            cropImage.onload = () => {
                // Initialize scale to cover canvas (min scale)
                const scaleX = cropCanvas.width / cropImage.width;
                const scaleY = cropCanvas.height / cropImage.height;
                imgScale = Math.max(scaleX, scaleY);
                zoomSlider.min = imgScale;
                zoomSlider.max = imgScale * 3;
                zoomSlider.value = imgScale;

                // Center image
                imgX = (cropCanvas.width - cropImage.width * imgScale) / 2;
                imgY = (cropCanvas.height - cropImage.height * imgScale) / 2;

                drawCropCanvas();
                cropModal.style.display = 'flex';
            };
            cropImage.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

function drawCropCanvas() {
    ctxCrop.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
    ctxCrop.drawImage(cropImage, imgX, imgY, cropImage.width * imgScale, cropImage.height * imgScale);
}

// Zoom control
zoomSlider.addEventListener('input', (e) => {
    const newScale = parseFloat(e.target.value);

    // Adjust imgX/imgY to zoom around center of canvas
    const cx = cropCanvas.width / 2;
    const cy = cropCanvas.height / 2;

    imgX = cx - (cx - imgX) * (newScale / imgScale);
    imgY = cy - (cy - imgY) * (newScale / imgScale);
    imgScale = newScale;

    drawCropCanvas();
});

// Dragging controls
cropCanvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.offsetX - imgX;
    startY = e.offsetY - imgY;
});
cropCanvas.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    imgX = e.offsetX - startX;
    imgY = e.offsetY - startY;
    drawCropCanvas();
});
cropCanvas.addEventListener('mouseup', () => isDragging = false);
cropCanvas.addEventListener('mouseleave', () => isDragging = false);

// Touch support for dragging
cropCanvas.addEventListener('touchstart', (e) => {
    isDragging = true;
    const rect = cropCanvas.getBoundingClientRect();
    const touch = e.touches[0];
    startX = (touch.clientX - rect.left) - imgX;
    startY = (touch.clientY - rect.top) - imgY;
});
cropCanvas.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    e.preventDefault(); // Prevent scrolling
    const rect = cropCanvas.getBoundingClientRect();
    const touch = e.touches[0];
    imgX = (touch.clientX - rect.left) - startX;
    imgY = (touch.clientY - rect.top) - startY;
    drawCropCanvas();
});
cropCanvas.addEventListener('touchend', () => isDragging = false);

// Cancel Crop
btnCropCancel.addEventListener('click', () => {
    cropModal.style.display = 'none';
    puzzleUpload.value = ''; // clear selection
});

// Apply Crop
btnCropApply.addEventListener('click', () => {
    const dataUrl = cropCanvas.toDataURL('image/jpeg', 0.9);
    localStorage.setItem(`puzzle_image_${currentAccount}_${currentPuzzleMonthStr}`, dataUrl);

    initPuzzleBoard();
    updateUI();

    cropModal.style.display = 'none';
    puzzleUpload.value = '';
    showNotification("自訂拼圖上傳並裁切成功！", "success");
});

// Initialize Chart
function initChart() {
    const ctx = document.getElementById('expenseChart').getContext('2d');

    // Gradient for chart
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

    expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['餐飲', '交通', '娛樂', '購物'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: [
                    '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'
                ],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            onClick: (e, elements) => {
                if (elements.length > 0) {
                    const idx = elements[0].index;
                    const label = expenseChart.data.labels[idx];
                    openChartDetail(label);
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#f8fafc', font: { family: 'Inter' } }
                }
            },
            cutout: '70%'
        }
    });

    const ctxTrend = document.getElementById('trendChart').getContext('2d');
    trendChart = new Chart(ctxTrend, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '每日總計',
                data: [],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderWidth: 2,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: 'rgba(255,255,255,0.7)' } },
                x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.7)' } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function openChartDetail(categoryName) {
    if (!chartDetailTitle || !chartDetailList || !chartDetailModal) return;
    chartDetailTitle.textContent = `${categoryName} 詳細紀錄`;
    const filtered = lastFilteredChartRecords.filter(r => getCategoryName(r.category) === categoryName);
    
    chartDetailList.innerHTML = '';
    if (filtered.length === 0) {
        chartDetailList.innerHTML = '<div class="expense-item empty-state">尚未有紀錄</div>';
    } else {
        filtered.forEach(record => {
            const item = document.createElement('div');
            item.className = `expense-item ${record.is_sdg ? 'sdg' : ''}`;

            const dateStr = record.timestamp ? record.timestamp.split('T')[0] : '';
            const catName = getCategoryName(record.category);
            const icon = getCategoryIcon(record.category);

            const isIncome = record.record_type === 'income';
            const amountDisplay = isIncome ? `+ NT$ ${record.amount.toLocaleString()}` : `- NT$ ${record.amount.toLocaleString()}`;
            const amountColor = isIncome ? 'var(--success)' : 'var(--text-primary)';

            item.innerHTML = `
                <div class="expense-info" style="flex: 1; padding-right: 12px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                        <span class="expense-category">${icon} ${catName} ${record.is_sdg ? '🌿' : ''}</span>
                        <span style="font-size: 12px; color: var(--text-secondary);">${dateStr}</span>
                    </div>
                    <span class="expense-desc">${record.description || '無說明'}</span>
                </div>
                <div class="expense-actions">
                    <span class="expense-amount" style="color: ${amountColor}; font-weight: bold;">${amountDisplay}</span>
                </div>
            `;
            chartDetailList.appendChild(item);
        });
    }
    
    chartDetailModal.style.display = 'flex';
}

if (btnCloseChartDetail) {
    btnCloseChartDetail.addEventListener('click', () => {
        chartDetailModal.style.display = 'none';
    });
}

// Fetch Initial State
async function fetchUserState(skipCheckInModal = false) {
    try {
        const res = await fetch(`${API_BASE}/user/state?account_id=${currentAccount}`);
        if (res.ok) {
            const data = await res.json();
            currentCheckInStreak = data.check_in_streak || 0;
            unlockedPieces = data.unlocked_pieces;
            unlockedBadges = data.unlocked_badges || [];
            currentBudget = data.monthly_budget || 0;
            
            const pointsAmt = data.points || 0;
            const topPoints = document.getElementById('user-points-amount');
            const storePoints = document.getElementById('store-points-amount');
            if(topPoints) topPoints.textContent = pointsAmt;
            if(storePoints) storePoints.textContent = pointsAmt;
            
            initPuzzleBoard(); // Re-init board for account-specific custom images
            updateUI();

            // Check-in Logic
            if (!skipCheckInModal && currentRole !== 'developer') {
                if (sessionStorage.getItem('just_checked_in') === 'true') {
                    sessionStorage.removeItem('just_checked_in');
                } else {
                    checkAndShowCheckInModal(data.last_check_in_date, currentCheckInStreak);
                }
            }
        }
    } catch (error) {
        console.error("Backend not reachable. Using local state.");
        updateUI(); // fallback
    }
}

// Check-in Modal Logic
function checkAndShowCheckInModal(lastCheckInDate, currentCheckInStreak) {
    if (currentRole === 'developer') return; // 絕對確保開發者不顯示

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    // 如果今天還沒簽到，顯示視窗
    if (lastCheckInDate !== todayStr) {
        document.getElementById('check-in-view').style.display = 'block';
        document.getElementById('reward-view').style.display = 'none';
        
        checkInStreakDisplay.textContent = `${currentCheckInStreak} 天`;

        // Update milestone opacity
        ms7.style.opacity = currentCheckInStreak >= 7 ? '1' : '0.4';
        ms15.style.opacity = currentCheckInStreak >= 15 ? '1' : '0.4';
        ms25.style.opacity = currentCheckInStreak >= 25 ? '1' : '0.4';

        // 高亮下一個達成的里程碑
        if (currentCheckInStreak === 6) ms7.style.color = 'var(--accent-primary)';
        if (currentCheckInStreak === 14) ms15.style.color = 'var(--accent-primary)';
        if (currentCheckInStreak === 24) ms25.style.color = 'var(--accent-primary)';

        checkInModal.style.display = 'flex';
    }
}

btnCloseCheckIn.addEventListener('click', () => {
    checkInModal.style.display = 'none';
});

btnCheckIn.addEventListener('click', async () => {
    try {
        const res = await fetch(`${API_BASE}/check_in?account_id=${currentAccount}`, { method: 'POST' });
        const data = await res.json();

        if (data.status === 'success') {
            checkInStreakDisplay.textContent = `${data.check_in_streak} 天`;
            currentCheckInStreak = data.check_in_streak;

            // Handle Rewards
            if (data.reward_pieces && data.reward_pieces.length > 0) {
                // 這裡可以直接把獲得的碎片加進去
                unlockedPieces.push(...data.reward_pieces);
                updateUI();
                
                // 動態改變 Modal 畫面顯示禮包
                document.getElementById('check-in-view').style.display = 'none';
                document.getElementById('reward-pieces-count').textContent = data.reward_pieces.length;
                document.getElementById('reward-view').style.display = 'block';
                
                document.getElementById('btn-return-main').onclick = () => {
                    checkInModal.style.display = 'none';
                    // 不自動 reload，讓使用者留在原頁面觀賞獲得的拼圖
                };
                let msg = data.message;
                if (data.points_earned) {
                    msg += `\n獲得 ${data.points_earned} 點！`;
                }
                if (data.total_points !== undefined) {
                    const topPoints = document.getElementById('user-points-amount');
                    const storePoints = document.getElementById('store-points-amount');
                    if(topPoints) topPoints.textContent = data.total_points;
                    if(storePoints) storePoints.textContent = data.total_points;
                }
                showNotification(msg, 'success');
                updateUI();
                if (typeof renderFriends === 'function' && typeof currentFriendsData !== 'undefined') {
                    renderFriends(currentFriendsData);
                }
                setTimeout(() => {
                    checkInModal.style.display = 'none';
                }, 1500);
            } else {
                // Normal Check-in (no reward pieces)
                let msg = data.message || "簽到成功！";
                if (data.points_earned) {
                    msg += `\n獲得 ${data.points_earned} 點！`;
                }
                if (data.total_points !== undefined) {
                    const topPoints = document.getElementById('user-points-amount');
                    const storePoints = document.getElementById('store-points-amount');
                    if(topPoints) topPoints.textContent = data.total_points;
                    if(storePoints) storePoints.textContent = data.total_points;
                }
                showNotification(msg, 'success');
                updateUI();
                if (typeof renderFriends === 'function' && typeof currentFriendsData !== 'undefined') {
                    renderFriends(currentFriendsData);
                }
                setTimeout(() => {
                    checkInModal.style.display = 'none';
                }, 1500);
            }
        } else {
            showNotification(data.message, 'info');
            checkInModal.style.display = 'none';
        }
    } catch (err) {
        console.error(err);
        showNotification("簽到失敗，請稍後再試", 'error');
    }
});

// Update UI
function updateUI() {
    // Update Check-in & Puzzle Stats in Sidebar
    const checkInDashboardCount = document.getElementById('check-in-dashboard-count');
    const puzzleProgressCount = document.getElementById('puzzle-progress-count');
    if (checkInDashboardCount) checkInDashboardCount.textContent = `${currentCheckInStreak} 天`;

    // Clear all pieces first
    document.querySelectorAll('.puzzle-piece').forEach(el => {
        el.classList.remove('collected', 'shiny', 'fly-in-anim');
    });

    // Render Unlocked Pieces for selected puzzle month
    const uniqueMonthPieces = new Set();
    unlockedPieces.forEach(p => {
        // Update main board
        if (p.acquired_at && p.acquired_at.startsWith(currentPuzzleMonthStr)) {
            uniqueMonthPieces.add(p.piece_id);
            const mainPieceEls = document.getElementById('puzzle-board')?.querySelectorAll(`[data-piece-id="${p.piece_id}"]`);
            if (mainPieceEls) {
                mainPieceEls.forEach(pieceEl => {
                    pieceEl.classList.add('collected');
                    if (p.is_shiny) pieceEl.classList.add('shiny');
                });
            }
        }
        
        // Update home board
        if (p.acquired_at && p.acquired_at.startsWith(actualCurrentMonthStr)) {
            const homePieceEls = document.getElementById('home-puzzle-board')?.querySelectorAll(`[data-piece-id="${p.piece_id}"]`);
            if (homePieceEls) {
                homePieceEls.forEach(pieceEl => {
                    pieceEl.classList.add('collected');
                    if (p.is_shiny) pieceEl.classList.add('shiny');
                });
            }
        }
    });

    if (puzzleProgressCount) puzzleProgressCount.textContent = `${uniqueMonthPieces.size} / 36`;
    if (badgeCountDisplay) badgeCountDisplay.textContent = `${unlockedBadges.length} 個`;
    
    updateBudgetUI();
}

function updateBudgetUI() {
    if (!budgetSpentDisplay || !budgetTotalDisplay || !budgetProgressBar) return;
    
    const actualCurrentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    let spent = 0;
    
    allRecords.forEach(r => {
        if (r.timestamp && r.timestamp.startsWith(actualCurrentMonthStr) && (r.record_type || 'expense') === 'expense') {
            spent += r.amount;
        }
    });
    
    budgetSpentDisplay.textContent = `$${spent.toLocaleString()}`;
    
    if (currentBudget > 0) {
        budgetTotalDisplay.textContent = `$${currentBudget.toLocaleString()}`;
        let percent = (spent / currentBudget) * 100;
        let displayPercent = percent > 100 ? 100 : percent;
        
        budgetProgressBar.style.width = `${displayPercent}%`;
        
        if (percent >= 100) {
            budgetProgressBar.style.background = 'var(--text-primary)'; // Or red, we use text primary as a fallback if --error is not defined, let's use #ef4444
            budgetProgressBar.style.background = '#ef4444';
        } else if (percent >= 80) {
            budgetProgressBar.style.background = '#f59e0b';
        } else {
            budgetProgressBar.style.background = 'var(--accent-primary)';
        }
    } else {
        budgetTotalDisplay.textContent = '未設定';
        budgetProgressBar.style.width = '0%';
    }
}

// Show Notification
function showNotification(msg, type) {
    notification.textContent = msg;
    notification.className = `notification show ${type}`;
    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
}

// Fetch and Render Records
async function fetchRecords() {
    if (!currentAccount) return;
    try {
        let url = `${API_BASE}/records?account_id=${currentAccount}`;
        const res = await fetch(url);
        if (res.ok) {
            allRecords = await res.json();
            applyFilters();
        }
    } catch (error) {
        console.error("Failed to fetch records.");
    }
}

let currentAnalysisPeriod = 'month';

if (analysisMonthFilter) {
    analysisMonthFilter.value = currentMonthStr; // initialize
    analysisMonthFilter.addEventListener('change', updateAnalysisChart);
}
if (analysisPeriodType) {
    analysisPeriodType.addEventListener('change', (e) => {
        currentAnalysisPeriod = e.target.value;
        if (currentAnalysisPeriod === 'month') {
            if(analysisMonthFilter) analysisMonthFilter.style.display = 'inline-block';
            if(analysisWeekFilter) analysisWeekFilter.style.display = 'none';
        } else {
            if(analysisMonthFilter) analysisMonthFilter.style.display = 'none';
            if(analysisWeekFilter) analysisWeekFilter.style.display = 'inline-block';
        }
        updateAnalysisChart();
    });
}
if (analysisWeekFilter) {
    // initialize to current week
    const now = new Date();
    const year = now.getFullYear();
    const firstJan = new Date(year, 0, 1);
    const days = Math.floor((now - firstJan) / (24 * 60 * 60 * 1000));
    const weekNum = Math.ceil((days + firstJan.getDay() + 1) / 7);
    analysisWeekFilter.value = `${year}-W${String(weekNum).padStart(2, '0')}`;
    analysisWeekFilter.addEventListener('change', updateAnalysisChart);
}

if (btnChartExpense && btnChartIncome) {
    btnChartExpense.addEventListener('click', () => {
        currentChartType = 'expense';
        btnChartExpense.style.background = 'var(--accent-primary)';
        btnChartExpense.style.color = 'white';
        btnChartIncome.style.background = 'transparent';
        btnChartIncome.style.color = 'var(--text-secondary)';
        updateAnalysisChart();
    });
    btnChartIncome.addEventListener('click', () => {
        currentChartType = 'income';
        btnChartIncome.style.background = 'var(--success)';
        btnChartIncome.style.color = 'white';
        btnChartExpense.style.background = 'transparent';
        btnChartExpense.style.color = 'var(--text-secondary)';
        updateAnalysisChart();
    });
}

const btnToggleSearch = document.getElementById('btn-toggle-search');
const searchPanel = document.getElementById('search-panel');
const searchDate = document.getElementById('search-date');
const searchCategory = document.getElementById('search-category');
const btnClearSearch = document.getElementById('btn-clear-search');

function populateSearchCategories() {
    if (!searchCategory) return;
    const allCats = [...expenseCategories, ...incomeCategories];
    allCats.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.name;
        opt.textContent = `${cat.icon} ${cat.name}`;
        searchCategory.appendChild(opt);
    });
}
if (searchCategory && searchCategory.options.length <= 1) {
    populateSearchCategories();
}

if (btnToggleSearch) {
    btnToggleSearch.addEventListener('click', () => {
        searchPanel.style.display = searchPanel.style.display === 'none' ? 'flex' : 'none';
    });
}
if (searchDate) searchDate.addEventListener('change', applyFilters);
if (searchCategory) searchCategory.addEventListener('change', applyFilters);
if (btnClearSearch) {
    btnClearSearch.addEventListener('click', () => {
        if(searchDate) searchDate.value = '';
        if(searchCategory) searchCategory.value = '';
        applyFilters();
    });
}

const adminMonthFilter = document.getElementById('admin-month-filter');
const adminSearchDate = document.getElementById('admin-search-date');
const btnAdminClearSearch = document.getElementById('btn-admin-clear-search');

if (adminMonthFilter) adminMonthFilter.addEventListener('change', applyFilters);
if (adminSearchDate) adminSearchDate.addEventListener('change', applyFilters);
if (btnAdminClearSearch) {
    btnAdminClearSearch.addEventListener('click', () => {
        if(adminMonthFilter) adminMonthFilter.value = '';
        if(adminSearchDate) adminSearchDate.value = '';
        applyFilters();
    });
}

function applyFilters() {
    let selectedMonth, sDate, sCat;
    if (currentRole === 'developer') {
        selectedMonth = adminMonthFilter ? adminMonthFilter.value : '';
        sDate = adminSearchDate ? adminSearchDate.value : '';
        sCat = '';
    } else {
        selectedMonth = monthFilter.value;
        sDate = searchDate ? searchDate.value : '';
        sCat = searchCategory ? searchCategory.value : '';
    }

    currentRecords = [...allRecords];

    if (selectedMonth) {
        currentRecords = currentRecords.filter(r => r.timestamp && r.timestamp.startsWith(selectedMonth));
    }
    if (sDate) {
        currentRecords = currentRecords.filter(r => r.timestamp && r.timestamp.startsWith(sDate));
    }
    if (sCat) {
        currentRecords = currentRecords.filter(r => getCategoryName(r.category) === sCat);
    }

    renderRecords(currentRecords);
    updateAnalysisChart();
    updateUI();
}

let lastFilteredChartRecords = [];

function updateAnalysisChart() {
    let filteredRecords = [];
    if (currentAnalysisPeriod === 'month') {
        const mFilter = analysisMonthFilter ? analysisMonthFilter.value : '';
        if (mFilter) {
            filteredRecords = allRecords.filter(r => r.timestamp && r.timestamp.startsWith(mFilter));
        } else {
            filteredRecords = [...allRecords];
        }
    } else {
        const wFilter = analysisWeekFilter ? analysisWeekFilter.value : '';
        if (wFilter) {
            const [year, week] = wFilter.split('-W');
            const simple = new Date(year, 0, 1 + (week - 1) * 7);
            const dow = simple.getDay();
            const ISOweekStart = simple;
            if (dow <= 4)
                ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
            else
                ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
            
            const startStr = ISOweekStart.toISOString().split('T')[0];
            const ISOweekEnd = new Date(ISOweekStart);
            ISOweekEnd.setDate(ISOweekStart.getDate() + 6);
            const endStr = ISOweekEnd.toISOString().split('T')[0];

            filteredRecords = allRecords.filter(r => {
                if (!r.timestamp) return false;
                const dStr = r.timestamp.split('T')[0];
                return dStr >= startStr && dStr <= endStr;
            });
        } else {
            filteredRecords = [...allRecords];
        }
    }
    
    // Filter by type
    filteredRecords = filteredRecords.filter(r => (r.record_type || 'expense') === currentChartType);
    lastFilteredChartRecords = filteredRecords;
    updateChartFromRecords(filteredRecords);
}

function updateChartFromRecords(records) {
    const categoryTotals = {};
    const dailyTotals = {};

    records.forEach(record => {
        // Doughnut Data
        const catName = getCategoryName(record.category);
        if (!categoryTotals[catName]) categoryTotals[catName] = 0;
        categoryTotals[catName] += record.amount;

        // Trend Data
        const dateStr = record.timestamp ? record.timestamp.split('T')[0] : '未知日期';
        if (!dailyTotals[dateStr]) dailyTotals[dateStr] = 0;
        dailyTotals[dateStr] += record.amount;
    });

    const labels = Object.keys(categoryTotals);
    const data = labels.map(label => categoryTotals[label]);
    
    // Dynamic Colors
    const colors = [
        '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', 
        '#ec4899', '#06b6d4', '#84cc16', '#6366f1', '#f43f5e',
        '#14b8a6', '#f97316'
    ];
    const bgColors = labels.map((_, i) => colors[i % colors.length]);

    expenseChart.data.labels = labels;
    expenseChart.data.datasets[0].data = data;
    expenseChart.data.datasets[0].backgroundColor = bgColors;
    expenseChart.update();

    // Update Trend Chart
    const trendLabels = Object.keys(dailyTotals).sort();
    const trendData = trendLabels.map(date => dailyTotals[date]);
    
    trendChart.data.labels = trendLabels.map(d => d.substring(5)); // Show MM-DD
    trendChart.data.datasets[0].data = trendData;
    
    if (currentChartType === 'income') {
        trendChart.data.datasets[0].borderColor = '#10b981';
        trendChart.data.datasets[0].backgroundColor = 'rgba(16, 185, 129, 0.2)';
        trendChart.data.datasets[0].pointBackgroundColor = '#10b981';
    } else {
        trendChart.data.datasets[0].borderColor = '#3b82f6';
        trendChart.data.datasets[0].backgroundColor = 'rgba(59, 130, 246, 0.2)';
        trendChart.data.datasets[0].pointBackgroundColor = '#3b82f6';
    }
    
    trendChart.update();
}

function renderRecords(records) {
    const targetList = currentRole === 'developer' ? document.getElementById('admin-expense-list') : document.getElementById('expense-list');
    
    if (!targetList) return;

    if (records.length === 0) {
        targetList.innerHTML = '<div class="expense-item empty-state">尚未有支出紀錄</div>';
        return;
    }

    targetList.innerHTML = '';

    records.forEach(record => {
        const item = document.createElement('div');
        item.className = `expense-item ${record.is_sdg ? 'sdg' : ''}`;

        const dateStr = record.timestamp ? record.timestamp.split('T')[0] : '';
        const catName = getCategoryName(record.category);
        const icon = getCategoryIcon(record.category);

        const isIncome = record.record_type === 'income';
        const amountDisplay = isIncome ? `+ NT$ ${record.amount.toLocaleString()}` : `- NT$ ${record.amount.toLocaleString()}`;
        const amountColor = isIncome ? 'var(--success)' : 'var(--text-primary)';

        // 如果是開發者介面，編輯與刪除按鈕可以考慮隱藏或保留，根據需求。這裡先保留供管理員操作
        item.innerHTML = `
            <div class="expense-info" style="flex: 1; padding-right: 12px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                    <span class="expense-category">${icon} ${catName} ${record.is_sdg ? '🌿' : ''}</span>
                    <span style="font-size: 12px; color: var(--text-secondary);">${dateStr}</span>
                </div>
                <span class="expense-desc">${record.description || '無說明'}</span>
            </div>
            <div class="expense-actions">
                <span class="expense-amount" style="color: ${amountColor}; font-weight: bold;">${amountDisplay}</span>
                <button class="edit-btn" onclick="startEdit('${record.id}')" title="修改">✏️</button>
                <button class="delete-btn" onclick="deleteRecord('${record.id}')" title="刪除" style="background:none; border:none; cursor:pointer; font-size:16px; margin-left:4px;">🗑️</button>
            </div>
        `;
        targetList.appendChild(item);
    });
}

// Password Prompt Logic
const passwordPromptModal = document.getElementById('password-prompt-modal');
const promptPasswordInput = document.getElementById('prompt-password-input');
const btnPromptCancel = document.getElementById('btn-prompt-cancel');
const btnPromptConfirm = document.getElementById('btn-prompt-confirm');

let pendingAction = null;
let pendingActionId = null;

function requestPasswordForAction(actionType, id) {
    if (currentRole === 'developer') {
        pendingAction = actionType;
        pendingActionId = id;
        promptPasswordInput.value = '';
        passwordPromptModal.style.display = 'flex';
    } else {
        if (actionType === 'edit') executeEdit(id);
        else if (actionType === 'delete') executeDelete(id);
    }
}

if (btnPromptCancel) {
    btnPromptCancel.addEventListener('click', () => {
        passwordPromptModal.style.display = 'none';
        pendingAction = null;
        pendingActionId = null;
    });
}

if (btnPromptConfirm) {
    btnPromptConfirm.addEventListener('click', async () => {
        const password = promptPasswordInput.value.trim();
        if (!password) {
            showNotification('請輸入密碼', 'warning');
            return;
        }
        
        try {
            const res = await fetch(`${API_BASE}/verify_password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target_account_id: currentAccount, password })
            });
            const data = await res.json();
            
            if (res.ok && data.status === 'success') {
                passwordPromptModal.style.display = 'none';
                if (pendingAction === 'edit') executeEdit(pendingActionId);
                else if (pendingAction === 'delete') executeDelete(pendingActionId);
            } else {
                showNotification(data.detail || '密碼驗證失敗', 'error');
            }
        } catch (err) {
            showNotification('伺服器連線失敗', 'error');
        }
    });
}

// Edit Handlers
window.startEdit = function (id) {
    requestPasswordForAction('edit', id);
};

function executeEdit(id) {
    const rec = currentRecords.find(r => r.id === id);
    if (!rec) return;

    editingRecordId = id;
    document.getElementById('amount').value = rec.amount;
    
    // Switch to correct type view
    if (rec.record_type === 'income') {
        if (btnTypeIncome) btnTypeIncome.click();
    } else {
        if (btnTypeExpense) btnTypeExpense.click();
    }
    
    // Set category
    const mappedCatName = getCategoryName(rec.category);
    document.getElementById('category').value = mappedCatName;
    document.getElementById('selected-category-text').textContent = mappedCatName;
    document.getElementById('selected-category-icon').textContent = getCategoryIcon(rec.category);

    document.getElementById('description').value = rec.description;
    document.getElementById('is_sdg').checked = rec.is_sdg;

    if (rec.timestamp) {
        document.getElementById('record-date').value = rec.timestamp.split('T')[0];
    }

    document.getElementById('btn-submit').textContent = '儲存修改 💾';
    document.getElementById('btn-cancel').style.display = 'block';
    
    switchView('add-expense-view');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.cancelEdit = function () {
    editingRecordId = null;
    form.reset();
    setDefaultDate();
    
    // Reset category UI
    if (btnTypeExpense) btnTypeExpense.click();

    document.getElementById('btn-submit').textContent = '記上一筆 ✍️';
    document.getElementById('btn-cancel').style.display = 'none';
    
    switchView(currentRole === 'developer' ? 'manage-users-view' : 'my-expenses-view');
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteRecord = function (id) {
    if (!confirm('確定要刪除這筆紀錄嗎？')) return;
    requestPasswordForAction('delete', id);
};

async function executeDelete(id) {
    try {
        const res = await fetch(`${API_BASE}/records/${id}?account_id=${currentAccount}`, {
            method: 'DELETE'
        });
        
        if (res.ok) {
            showNotification("刪除成功！", "success");
            // Reset back to list view
            switchView(currentRole === 'developer' ? 'manage-users-view' : 'my-expenses-view');
            fetchUserState(true);
            fetchRecords();
        } else {
            showNotification('儲存失敗', 'error');
        }
    } catch (err) {
        console.error(err);
        showNotification("伺服器連線失敗", "warning");
    }
}

document.getElementById('btn-cancel').addEventListener('click', cancelEdit);

// Create Particles for SDG reward
function createParticles(x, y) {
    const container = document.getElementById('particle-container');
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.width = `${Math.random() * 8 + 4}px`;
        particle.style.height = particle.style.width;

        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 100 + 50;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;

        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);

        container.appendChild(particle);

        setTimeout(() => particle.remove(), 1000);
    }
}

// Handle Form Submit
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const description = document.getElementById('description').value;
    const is_sdg = document.getElementById('is_sdg').checked;
    const dateVal = document.getElementById('record-date').value;
    const record_type = document.getElementById('record-type') ? document.getElementById('record-type').value : 'expense';
    const timestamp = dateVal ? `${dateVal}T12:00:00` : null;

    const payload = { amount, category, description, is_sdg, timestamp, record_type };

    try {
        if (editingRecordId) {
            const res = await fetch(`${API_BASE}/records/${editingRecordId}?account_id=${currentAccount}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                showNotification("修改成功！", "success");
                cancelEdit();
                fetchRecords();
            } else {
                showNotification("修改失敗", "warning");
            }
        } else {
            const res = await fetch(`${API_BASE}/records?account_id=${currentAccount}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();

                // Handle Streak
                if (data.streak_reset) {
                    showNotification("中斷記帳，連續天數已重置。重新開始你的旅程吧！", "warning");
                } else {
                    showNotification("記帳成功！", "success");
                }

                currentStreak = data.streak;
                if (streakCount) {
                    streakCount.textContent = `${currentStreak} 天`;
                }

                // Handle Gamification Piece
                if (data.new_piece) {
                    const p = data.new_piece;
                    const pieceEls = document.querySelectorAll(`[data-piece-id="${p.piece_id}"]`);
                    pieceEls.forEach(pieceEl => {
                        pieceEl.classList.add('collected', 'fly-in-anim');
                        if (p.is_shiny) {
                            pieceEl.classList.add('shiny');

                            // Wait for animation to finish then explode particles
                            if (pieceEl.closest('.view-section.active')) {
                                setTimeout(() => {
                                    const rect = pieceEl.getBoundingClientRect();
                                    const x = rect.left + rect.width / 2;
                                    const y = rect.top + rect.height / 2;
                                    createParticles(x, y);
                                }, 800);
                            }
                        }
                    });
                    
                    if (p.is_shiny) {
                        setTimeout(() => {
                            showNotification("🌿 解鎖閃耀碎片！感謝您的永續消費", "success");
                        }, 800);
                    }
                    
                    // Add to local state
                    unlockedPieces.push(p);
                }

                if (data.new_badges && data.new_badges.length > 0) {
                    data.new_badges.forEach(b => {
                        unlockedBadges.push(b);
                        setTimeout(() => {
                            showNotification(`🎉 解鎖新徽章：${b.name}`, "success");
                        }, 1500);
                    });
                }

                // Reset form
                form.reset();
                setDefaultDate();

                // Refresh records
                fetchRecords();
            }
        }
    } catch (err) {
        console.error(err);
        showNotification("伺服器連線失敗", "warning");
    }
});

function setDefaultDate() {
    const today = new Date();
    // Format YYYY-MM-DD
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    document.getElementById('record-date').value = `${yyyy}-${mm}-${dd}`;
}

// Friends Logic
const btnAddFriend = document.getElementById('btn-add-friend');
const friendIdInput = document.getElementById('friend-id-input');
const friendsList = document.getElementById('friends-list');

async function fetchFriends() {
    try {
        const res = await fetch(`${API_BASE}/friends?account_id=${currentAccount}`);
        if (res.ok) {
            const friends = await res.json();
            renderFriends(friends);
        }
    } catch (err) {
        console.error("Failed to fetch friends:", err);
    }
}

const btnRankStreak = document.getElementById('btn-rank-streak');
const btnRankPuzzle = document.getElementById('btn-rank-puzzle');
let currentRankingMode = 'streak';
let currentFriendsData = [];

if (btnRankStreak && btnRankPuzzle) {
    btnRankStreak.addEventListener('click', () => {
        currentRankingMode = 'streak';
        btnRankStreak.style.background = 'var(--accent-primary)';
        btnRankStreak.style.color = 'white';
        btnRankPuzzle.style.background = 'transparent';
        btnRankPuzzle.style.color = 'var(--text-secondary)';
        renderFriends(currentFriendsData);
    });
    btnRankPuzzle.addEventListener('click', () => {
        currentRankingMode = 'puzzle';
        btnRankPuzzle.style.background = 'var(--accent-primary)';
        btnRankPuzzle.style.color = 'white';
        btnRankStreak.style.background = 'transparent';
        btnRankStreak.style.color = 'var(--text-secondary)';
        renderFriends(currentFriendsData);
    });
}

function renderFriends(friends) {
    currentFriendsData = friends;
    const friendsList = document.getElementById('friends-list');
    const homeFriendsList = document.getElementById('home-friends-list');
    
    const actualCurrentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const myMonthlyPieces = new Set(unlockedPieces.filter(p => p.acquired_at && p.acquired_at.startsWith(actualCurrentMonthStr)).map(p => p.piece_id)).size;
    
    // --- Render Home Friends Ranking ---
    if (homeFriendsList) {
        const rankingUsers = [...friends, {
            friend_id: currentAccount,
            is_me: true,
            check_in_streak: currentCheckInStreak,
            monthly_pieces_count: myMonthlyPieces
        }];
        
        if (currentRankingMode === 'streak') {
            rankingUsers.sort((a, b) => b.check_in_streak - a.check_in_streak);
        } else {
            rankingUsers.sort((a, b) => b.monthly_pieces_count - a.monthly_pieces_count);
        }
        
        if (rankingUsers.length === 0) {
            homeFriendsList.innerHTML = '<div class="expense-item empty-state" style="justify-content: center;">尚未加入任何好友</div>';
        } else {
            homeFriendsList.innerHTML = '';
            rankingUsers.forEach((friend, index) => {
                const isMe = friend.is_me;
                const displayName = isMe ? `${friend.friend_id} (自己)` : friend.friend_id;
                const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${friend.friend_id}`;
                
                const homeCard = document.createElement('div');
                homeCard.className = 'expense-item';
                homeCard.style.padding = '12px';
                if (isMe) {
                    homeCard.style.border = '1px solid var(--accent-primary)';
                    homeCard.style.background = 'rgba(59, 130, 246, 0.1)';
                }
                
                const scoreDisplay = currentRankingMode === 'streak' ? `${friend.check_in_streak} 天` : `${friend.monthly_pieces_count} 片`;
                const scoreColor = currentRankingMode === 'streak' ? 'var(--accent-primary)' : '#34d399';
                
                homeCard.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                        <span style="font-size: 14px; font-weight: bold; color: var(--text-secondary); width: 24px;">#${index + 1}</span>
                        <img src="${avatarUrl}" alt="Avatar" style="width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.1);">
                        <span style="font-size: 15px; font-weight: bold; color: ${isMe ? 'var(--accent-primary)' : 'var(--text-primary)'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100px;">${displayName}</span>
                    </div>
                    <div style="font-weight: bold; color: ${scoreColor}; font-size: 14px;">
                        ${scoreDisplay}
                    </div>
                `;
                homeFriendsList.appendChild(homeCard);
            });
        }
    }
    
    // --- Render Manage Friends List ---
    if (friendsList) {
        if (friends.length === 0) {
            friendsList.innerHTML = '<div class="expense-item empty-state" style="justify-content: center;">尚未加入任何好友</div>';
        } else {
            friendsList.innerHTML = '';
            friends.forEach((friend) => {
                const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${friend.friend_id}`;
                
                const card = document.createElement('div');
                card.className = 'glass-panel friend-card';
                card.style.padding = '16px';
                card.style.display = 'flex';
                card.style.flexDirection = 'column';
                card.style.gap = '12px';
                card.style.transition = 'transform 0.2s, box-shadow 0.2s';
                
                card.onmouseover = () => card.style.transform = 'translateY(-2px)';
                card.onmouseout = () => card.style.transform = 'none';
                
                const deleteBtnHtml = `<button class="delete-btn" onclick="removeFriend('${friend.friend_id}')" title="刪除好友" style="background:none; border:none; cursor:pointer; font-size:16px; opacity:0.7;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.7">🗑️</button>`;
                
                const cardHtml = `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <img src="${avatarUrl}" alt="Avatar" style="width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.1);">
                            <h4 style="margin: 0; font-size: 18px; color: var(--text-primary);">${friend.friend_id}</h4>
                        </div>
                        ${deleteBtnHtml}
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 14px; margin-top: 4px;">
                        <span style="color: var(--text-secondary);">📅 連續簽到</span>
                        <span style="font-weight: bold; color: var(--text-primary);">${friend.check_in_streak} 天</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 14px;">
                        <span style="color: var(--text-secondary);">🧩 本月拼圖</span>
                        <span style="font-weight: bold; color: var(--text-primary);">${friend.monthly_pieces_count} 片</span>
                    </div>
                `;
                card.innerHTML = cardHtml;
                friendsList.appendChild(card);
            });
        }
    }
}

async function fetchFriendNotifications() {
    try {
        const res = await fetch(`${API_BASE}/friends/notifications?account_id=${currentAccount}`);
        if (res.ok) {
            const notifications = await res.json();
            renderFriendNotifications(notifications);
        }
    } catch (err) {
        console.error("Failed to fetch friend notifications:", err);
    }
}

function renderFriendNotifications(notifications) {
    const container = document.getElementById('friend-notifications-container');
    if (!container) return;
    
    if (notifications.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = '';
    notifications.forEach(friendId => {
        const div = document.createElement('div');
        div.className = 'glass-panel';
        div.style.padding = '16px';
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.alignItems = 'center';
        div.style.borderLeft = '4px solid #3b82f6';
        div.style.background = 'rgba(59, 130, 246, 0.1)';
        
        div.innerHTML = `
            <div>
                <span style="font-weight: bold; color: var(--text-primary);">👤 ${friendId}</span> 
                <span style="color: var(--text-secondary);">將您加入了好友！</span>
            </div>
            <div style="display: flex; gap: 8px;">
                <button onclick="addFriendBack('${friendId}')" class="btn-submit" style="padding: 6px 12px; font-size: 14px;">回加好友</button>
                <button onclick="dismissNotification('${friendId}')" style="padding: 6px 12px; font-size: 14px; background: transparent; color: var(--text-secondary); border: 1px solid var(--glass-border); border-radius: 8px; cursor: pointer;">忽略</button>
            </div>
        `;
        container.appendChild(div);
    });
}

window.addFriendBack = async function(friendId) {
    try {
        const res = await fetch(`${API_BASE}/friends/add?account_id=${currentAccount}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ friend_id: friendId })
        });
        const data = await res.json();
        if (res.ok) {
            showNotification(`已回加 ${friendId} 為好友`, "success");
            fetchFriendNotifications();
            fetchFriends();
        } else {
            showNotification(data.detail || "新增失敗", "warning");
        }
    } catch (err) {
        showNotification("伺服器連線失敗", "warning");
    }
};

window.dismissNotification = async function(friendId) {
    try {
        const res = await fetch(`${API_BASE}/friends/dismiss_notification?account_id=${currentAccount}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ friend_id: friendId })
        });
        if (res.ok) {
            showNotification(`已忽略通知`, "info");
            fetchFriendNotifications();
        } else {
            showNotification("忽略失敗", "warning");
        }
    } catch (err) {
        showNotification("伺服器連線失敗", "warning");
    }
};

window.removeFriend = async function(friendId) {
    if (!confirm(`確定要刪除好友 ${friendId} 嗎？`)) return;
    
    try {
        const res = await fetch(`${API_BASE}/friends/${friendId}?account_id=${currentAccount}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            showNotification(`已刪除好友 ${friendId}`, "success");
            fetchFriends();
        } else {
            const data = await res.json();
            showNotification(data.detail || "刪除失敗", "warning");
        }
    } catch (err) {
        showNotification("伺服器連線失敗", "warning");
    }
};

if (btnAddFriend) {
    btnAddFriend.addEventListener('click', async () => {
        const friendId = friendIdInput.value.trim();
        if (!friendId) {
            showNotification("請輸入好友帳號", "warning");
            return;
        }
        
        try {
            const res = await fetch(`${API_BASE}/friends/add?account_id=${currentAccount}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ friend_id: friendId })
            });
            const data = await res.json();
            
            if (res.ok) {
                if (data.status === 'success') {
                    let msg = data.message;
            if (data.points_earned) {
                msg += ` 獲得 ${data.points_earned} 點！`;
            }
            showNotification(msg, "success");
            
            if (data.total_points !== undefined) {
                const topPoints = document.getElementById('user-points-amount');
                const storePoints = document.getElementById('store-points-amount');
                if(topPoints) topPoints.textContent = data.total_points;
                if(storePoints) storePoints.textContent = data.total_points;
            }
                    friendIdInput.value = '';
                    fetchFriends();
                } else {
                    showNotification(data.message, "info");
                }
            } else {
                showNotification(data.detail || "新增失敗", "warning");
            }
        } catch (err) {
            showNotification("伺服器連線失敗", "warning");
        }
    });
}

// Store Logic
let storeItems = [];

async function fetchStoreItems() {
    try {
        const res = await fetch(`${API_BASE}/store/items?account_id=${currentAccount}`);
        if (res.ok) {
            storeItems = await res.json();
            renderAdminStoreList();
            renderStoreGrid();
        }
    } catch (err) {
        console.error("Failed to fetch store items:", err);
    }
}

// Budget Modal Events
if (btnSetBudget) {
    btnSetBudget.addEventListener('click', () => {
        budgetInput.value = currentBudget || '';
        budgetModal.style.display = 'flex';
    });
}

if (btnBudgetCancel) {
    btnBudgetCancel.addEventListener('click', () => {
        budgetModal.style.display = 'none';
    });
}

if (btnBudgetConfirm) {
    btnBudgetConfirm.addEventListener('click', async () => {
        const newBudget = parseInt(budgetInput.value);
        if (isNaN(newBudget) || newBudget < 0) {
            showNotification('請輸入有效的預算金額', 'warning');
            return;
        }
        try {
            const res = await fetch(`${API_BASE}/user/budget?account_id=${currentAccount}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ monthly_budget: newBudget })
            });
            if (res.ok) {
                currentBudget = newBudget;
                budgetModal.style.display = 'none';
                showNotification('預算設定成功', 'success');
                updateBudgetUI();
            } else {
                showNotification('設定預算失敗', 'error');
            }
        } catch(err) {
            console.error(err);
            showNotification('設定預算失敗', 'error');
        }
    });
}

// Check and Render Badges
async function checkAndRenderBadges() {
    try {
        const res = await fetch(`${API_BASE}/badges/check`, {
            method: 'POST',
            headers: {
                'Authorization': currentAccount
            }
        });
        if (res.ok) {
            const data = await res.json();
            unlockedBadges = data.unlocked_badges || [];
            if (badgeCountDisplay) {
                badgeCountDisplay.textContent = `${unlockedBadges.length} 個`;
            }
            if (data.new_badges && data.new_badges.length > 0) {
                data.new_badges.forEach(b => {
                    showNotification(`🎉 解鎖新徽章：${b.name}`, "success");
                });
            }
        }
    } catch(err) {
        console.error("Failed to check badges", err);
    }
    
    renderBadgesList();
}

// Badges Modal Events
if (btnViewBadges) {
    btnViewBadges.addEventListener('click', () => {
        switchView('badges-view');
    });
}

function renderBadgesList() {
    if (!badgesList) return;
    badgesList.innerHTML = '';
    
    const unlockedIds = new Set(unlockedBadges.map(b => b.id));
    
    ALL_BADGES.forEach(badgeDef => {
        const isUnlocked = unlockedIds.has(badgeDef.id);
        const item = document.createElement('div');
        
        item.style.display = 'flex';
        item.style.flexDirection = 'column';
        item.style.alignItems = 'center';
        item.style.justifyContent = 'center';
        item.style.padding = '12px';
        item.style.cursor = 'help';
        item.style.position = 'relative';
        
        if (isUnlocked) {
            item.innerHTML = `
                <div style="font-size: 52px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.6)); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">${badgeDef.icon}</div>
                <div style="color: #fff; font-weight: bold; margin-top: 8px; text-shadow: 0 2px 4px rgba(0,0,0,0.9); text-align: center; font-size: 14px;">${badgeDef.name}</div>
            `;
            item.title = `解鎖條件：${badgeDef.desc}`;
        } else {
            item.innerHTML = `
                <div style="font-size: 52px; filter: grayscale(100%) opacity(0.2) drop-shadow(0 4px 8px rgba(0,0,0,0.5)); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">❓</div>
                <div style="color: rgba(255,255,255,0.4); font-weight: bold; margin-top: 8px; text-shadow: 0 2px 4px rgba(0,0,0,0.9); text-align: center; font-size: 14px;">未解鎖</div>
            `;
            item.title = `未知的徽章\n解鎖條件：${badgeDef.desc}`;
        }
        
        badgesList.appendChild(item);
    });
}

function renderStoreGrid() {
    const storeGrid = document.getElementById('store-grid');
    if (!storeGrid) return;
    storeGrid.innerHTML = '';
    
    if (storeItems.length === 0) {
        storeGrid.innerHTML = '<div class="expense-item empty-state" style="grid-column: 1 / -1; justify-content: center;">商店尚未上架任何商品，敬請期待</div>';
        return;
    }
    
    storeItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'glass-panel';
        card.style.padding = '12px';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.alignItems = 'center';
        card.style.justifyContent = 'center';
        card.style.gap = '8px';
        card.style.textAlign = 'center';
        card.style.aspectRatio = '1 / 1';
        
        let isSoldOut = false;
        let remainingText = '';
        if (item.max_limit > 0) {
            const remaining = item.max_limit - item.user_redeemed_qty;
            if (remaining <= 0) {
                isSoldOut = true;
                remainingText = `<div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">已達上限</div>`;
            } else {
                remainingText = `<div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">剩餘 ${remaining} 個</div>`;
            }
        } else {
            remainingText = `<div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">無上限</div>`;
        }

        if (isSoldOut) {
            card.style.opacity = '0.5';
            card.style.filter = 'grayscale(100%)';
        }

        const iconHtml = (item.icon.startsWith('data:image') || item.icon.startsWith('http')) 
            ? `<img src="${item.icon}" style="width: 48px; height: 48px; object-fit: contain; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.2));">`
            : `<div style="font-size: 36px; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.2));">${item.icon}</div>`;

        card.innerHTML = `
            ${iconHtml}
            <h4 style="margin: 0; font-size: 14px; color: var(--text-primary); font-weight: bold; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${item.name}</h4>
            <div style="color: var(--accent-primary); font-weight: bold; font-size: 13px; background: rgba(59, 130, 246, 0.1); padding: 4px 8px; border-radius: 20px;">
                ⭐ ${item.cost} 點
            </div>
            ${remainingText}
            <button class="btn-submit" onclick="openRedeemModal('${item.id}')" style="margin-top: auto; width: 100%; font-weight: bold; font-size: 13px; padding: 6px;" ${isSoldOut ? 'disabled' : ''}>${isSoldOut ? '已售完' : '兌換'}</button>
        `;
        
        storeGrid.appendChild(card);
    });
}

let currentRedeemItem = null;

window.openRedeemModal = function(itemId) {
    const item = storeItems.find(i => i.id === itemId);
    if (!item) return;
    
    currentRedeemItem = item;
    
    const iconHtml = (item.icon.startsWith('data:image') || item.icon.startsWith('http')) 
        ? `<img src="${item.icon}" style="width: 48px; height: 48px; object-fit: contain;">`
        : item.icon;
        
    document.getElementById('redeem-item-icon').innerHTML = iconHtml;
    document.getElementById('redeem-item-name').textContent = item.name;
    document.getElementById('redeem-item-cost').textContent = item.cost;
    
    const slider = document.getElementById('redeem-quantity-slider');
    const display = document.getElementById('redeem-quantity-display');
    const totalCostDisplay = document.getElementById('redeem-total-cost');
    
    // Calculate max quantity based on points
    const currentPoints = parseInt(document.getElementById('store-points-amount').textContent || '0');
    let maxQty = Math.floor(currentPoints / item.cost);
    
    // If it's a puzzle piece, also restrict by missing pieces
    if (item.is_piece) {
        // currentPuzzleMonthStr is for view, but logic always targets actual current month
        const actualCurrentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
        const acquiredCount = new Set(unlockedPieces.filter(p => p.acquired_at && p.acquired_at.startsWith(actualCurrentMonthStr)).map(p => p.piece_id)).size;
        const missingCount = Math.max(0, 36 - acquiredCount);
        maxQty = Math.min(maxQty, missingCount);
    }
    
    if (item.max_limit > 0) {
        const remainingQty = item.max_limit - item.user_redeemed_qty;
        maxQty = Math.min(maxQty, remainingQty);
    }
    
    if (maxQty < 1) {
        showNotification(item.is_piece && maxQty === 0 && Math.floor(currentPoints/item.cost) > 0 ? "本月拼圖已經全數集滿囉！" : "數量不足以兌換此商品", 'warning');
        return;
    }
    
    // Hard cap at 100 for sanity
    maxQty = Math.min(maxQty, 100);
    
    slider.min = 1;
    slider.max = maxQty;
    slider.value = 1;
    
    function updateDisplay() {
        display.textContent = slider.value;
        totalCostDisplay.textContent = slider.value * item.cost;
    }
    
    slider.oninput = updateDisplay;
    updateDisplay();
    
    document.getElementById('redeem-modal').style.display = 'flex';
};

document.getElementById('btn-redeem-cancel').addEventListener('click', () => {
    document.getElementById('redeem-modal').style.display = 'none';
});

document.getElementById('btn-redeem-confirm').addEventListener('click', async () => {
    if (!currentRedeemItem) return;
    
    const quantity = parseInt(document.getElementById('redeem-quantity-slider').value);
    const item = currentRedeemItem;
    const cost = item.cost;
    const isPiece = item.is_piece;
    
    document.getElementById('redeem-modal').style.display = 'none';
    
    try {
        const res = await fetch(`${API_BASE}/store/redeem?account_id=${currentAccount}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ item_id: item.id, item_cost: cost, is_puzzle_piece: isPiece, quantity: quantity })
        });
        const data = await res.json();
        
        if (res.ok) {
            showNotification(data.message, 'success');
            
            // Update points
            if (data.remaining_points !== undefined) {
                const topPoints = document.getElementById('user-points-amount');
                const storePoints = document.getElementById('store-points-amount');
                if(topPoints) topPoints.textContent = data.remaining_points;
                if(storePoints) storePoints.textContent = data.remaining_points;
            }
            
            // If pieces were obtained
            if (data.new_pieces && data.new_pieces.length > 0) {
                unlockedPieces.push(...data.new_pieces);
                updateUI();
                
                // Show particle effect around the store grid
                const rect = document.getElementById('store-grid').getBoundingClientRect();
                createParticles(rect.left + rect.width / 2, rect.top + rect.height / 2);
            }
            
            // Fetch updated store items to reflect new redeemed quantities
            fetchStoreItems();
        } else {
            showNotification(data.detail || "兌換失敗", 'warning');
        }
    } catch (err) {
        showNotification("伺服器連線失敗", 'warning');
    }
});

// Admin Store Management Logic
const btnAddStoreItem = document.getElementById('btn-add-store-item');
const adminStoreFormPanel = document.getElementById('admin-store-form-panel');
const adminStoreForm = document.getElementById('admin-store-form');
const btnAdminStoreCancel = document.getElementById('btn-admin-store-cancel');

if (btnAddStoreItem) {
    btnAddStoreItem.addEventListener('click', () => {
        adminStoreForm.reset();
        document.getElementById('admin-store-id').value = '';
        document.getElementById('admin-store-icon').value = '';
        document.getElementById('admin-store-image-preview').innerHTML = '<span style="color: var(--text-secondary); font-size: 12px;">無圖片</span>';
        document.getElementById('admin-store-form-title').textContent = '新增商品';
        adminStoreFormPanel.style.display = 'block';
    });
}

const fileInputStore = document.getElementById('admin-store-image');
if (fileInputStore) {
    fileInputStore.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 500 * 1024) { // limit 500kb
                showNotification("圖片檔案太大，請選擇小於 500KB 的圖片", "warning");
                fileInputStore.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onload = function(evt) {
                document.getElementById('admin-store-icon').value = evt.target.result;
                document.getElementById('admin-store-image-preview').innerHTML = `<img src="${evt.target.result}" style="width: 100%; height: 100%; object-fit: cover;">`;
            };
            reader.readAsDataURL(file);
        }
    });
}

if (btnAdminStoreCancel) {
    btnAdminStoreCancel.addEventListener('click', () => {
        adminStoreFormPanel.style.display = 'none';
        adminStoreForm.reset();
        document.getElementById('admin-store-image-preview').innerHTML = '<span style="color: var(--text-secondary); font-size: 12px;">無圖片</span>';
    });
}

if (adminStoreForm) {
    adminStoreForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('admin-store-id').value;
        const name = document.getElementById('admin-store-name').value;
        const cost = parseInt(document.getElementById('admin-store-cost').value);
        let icon = document.getElementById('admin-store-icon').value;
        const max_limit = parseInt(document.getElementById('admin-store-max-limit').value);
        const is_piece = document.getElementById('admin-store-is-piece').checked;
        
        if (!icon) {
            showNotification("請上傳圖片", "warning");
            return;
        }

        const payload = { name, cost, icon, max_limit, is_piece };
        if (id) payload.id = id;
        
        try {
            const url = id ? `${API_BASE}/store/items/${id}` : `${API_BASE}/store/items`;
            const method = id ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (res.ok) {
                showNotification(id ? "修改成功！" : "新增成功！", "success");
                adminStoreFormPanel.style.display = 'none';
                fetchStoreItems(); // Reload items
            } else {
                showNotification("儲存失敗", "warning");
            }
        } catch (err) {
            showNotification("伺服器連線失敗", "warning");
        }
    });
}

function renderAdminStoreList() {
    const list = document.getElementById('admin-store-list');
    if (!list) return;
    
    if (storeItems.length === 0) {
        list.innerHTML = '<div class="expense-item empty-state">尚未設定任何商品</div>';
        return;
    }
    
    list.innerHTML = '';
    storeItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'expense-item';
        
        const iconHtml = (item.icon.startsWith('data:image') || item.icon.startsWith('http')) 
            ? `<img src="${item.icon}" style="width: 32px; height: 32px; object-fit: contain;">`
            : `<div style="font-size: 32px;">${item.icon}</div>`;

        div.innerHTML = `
            <div class="expense-info" style="flex: 1; padding-right: 12px; flex-direction: row; align-items: center; gap: 16px;">
                ${iconHtml}
                <div>
                    <div style="font-weight: bold; font-size: 16px;">${item.name}</div>
                    <div style="font-size: 14px; color: var(--text-secondary); margin-top: 4px;">
                        花費: ⭐ ${item.cost} | 上限: ${item.max_limit === 0 ? '無上限' : item.max_limit} | 類型: ${item.is_piece ? '拼圖碎片' : '一般商品'}
                    </div>
                </div>
            </div>
            <div class="expense-actions">
                <button class="edit-btn" onclick="editStoreItem('${item.id}')" title="修改">✏️</button>
                <button class="delete-btn" onclick="deleteStoreItem('${item.id}')" title="刪除" style="background:none; border:none; cursor:pointer; font-size:16px; margin-left:4px;">🗑️</button>
            </div>
        `;
        list.appendChild(div);
    });
}

window.editStoreItem = function(id) {
    const item = storeItems.find(i => i.id === id);
    if (!item) return;
    
    document.getElementById('admin-store-id').value = item.id;
    document.getElementById('admin-store-name').value = item.name;
    document.getElementById('admin-store-cost').value = item.cost;
    document.getElementById('admin-store-icon').value = item.icon;
    document.getElementById('admin-store-max-limit').value = item.max_limit;
    document.getElementById('admin-store-is-piece').checked = item.is_piece;
    
    const preview = document.getElementById('admin-store-image-preview');
    if (item.icon.startsWith('data:image') || item.icon.startsWith('http')) {
        preview.innerHTML = `<img src="${item.icon}" style="width: 100%; height: 100%; object-fit: cover;">`;
    } else {
        preview.innerHTML = `<div style="font-size: 24px;">${item.icon}</div>`;
    }
    
    document.getElementById('admin-store-form-title').textContent = '修改商品';
    adminStoreFormPanel.style.display = 'block';
    
    adminStoreFormPanel.scrollIntoView({ behavior: 'smooth' });
};

window.deleteStoreItem = async function(id) {
    if (!confirm('確定要刪除這個商品嗎？')) return;
    try {
        const res = await fetch(`${API_BASE}/store/items/${id}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            showNotification("刪除成功！", "success");
            fetchStoreItems();
        } else {
            showNotification("刪除失敗", "warning");
        }
    } catch (err) {
        showNotification("伺服器連線失敗", "warning");
    }
};

// Init (Refresh Application State)
applyTheme(currentTheme);
updatePuzzleMonthUI();
fetchFriends();
fetchFriendNotifications();
initChart();
// Apply theme again after chart init to ensure correct colors
applyTheme(currentTheme);
setDefaultDate();
fetchUserState();
fetchRecords();
fetchStoreItems();
