// ========== ХРАНЕНИЕ ДАННЫХ ==========
// Инициализация хранилища
let currentUser = null;
let topics = [];
let tasks = [];
let userProgress = [];
let completedTasks = [];

// Загрузка данных из localStorage или JSON
async function loadData() {
    try {
        // Загружаем темы из JSON файла
        const topicsResponse = await fetch('topics.json');
        const data = await topicsResponse.json();

        topics = data.topics;
        tasks = data.tasks;

        // Загружаем пользовательские данные из localStorage
        const savedUsers = localStorage.getItem('geometry_users');
        if (savedUsers) {
            const users = JSON.parse(savedUsers);
            // Проверяем текущего пользователя
            const savedCurrentUser = localStorage.getItem('geometry_current_user');
            if (savedCurrentUser) {
                currentUser = JSON.parse(savedCurrentUser);
            }
        } else {
            // Создаём тестовых пользователей при первом запуске
            const defaultUsers = [
                { id: 1, username: 'test', email: 'test@example.com', password: 'test123', coins: 100, isAdmin: false },
                { id: 2, username: 'admin', email: 'admin@example.com', password: 'admin123', coins: 500, isAdmin: true }
            ];
            localStorage.setItem('geometry_users', JSON.stringify(defaultUsers));
        }

        // Загружаем прогресс
        const savedProgress = localStorage.getItem('geometry_progress');
        if (savedProgress) {
            userProgress = JSON.parse(savedProgress);
        } else {
            userProgress = [];
        }

        // Загружаем выполненные задания
        const savedCompleted = localStorage.getItem('geometry_completed');
        if (savedCompleted) {
            completedTasks = JSON.parse(savedCompleted);
        } else {
            completedTasks = [];
        }

        renderPage();
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
}

// Сохранение данных
function saveData() {
    localStorage.setItem('geometry_progress', JSON.stringify(userProgress));
    localStorage.setItem('geometry_completed', JSON.stringify(completedTasks));

    const users = JSON.parse(localStorage.getItem('geometry_users') || '[]');
    if (currentUser) {
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            users[userIndex] = currentUser;
        }
        localStorage.setItem('geometry_users', JSON.stringify(users));
        localStorage.setItem('geometry_current_user', JSON.stringify(currentUser));
    }
}

// ========== ФУНКЦИИ ДЛЯ СТРАНИЦ ==========
function renderPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop();

    if (page === 'index.html' || page === '') {
        renderIndex();
    } else if (page === 'login.html') {
        renderLogin();
    } else if (page === 'register.html') {
        renderRegister();
    } else if (page === 'profile.html') {
        renderProfile();
    } else if (page === 'topics.html' || page === 'topic.html') {
        renderTopic();
    } else if (page === 'tasks.html') {
        renderTasks();
    } else if (page === 'store.html') {
        renderStore();
    } else if (page === 'admin.html') {
        renderAdmin();
    }

    renderNavigation();
}

function renderNavigation() {
    const navLinks = document.getElementById('navLinks');
    if (!navLinks) return;

    if (currentUser) {
        navLinks.innerHTML = `
            <a href="index.html"><i class="fas fa-home"></i> Главная</a>
            <a href="profile.html">
                <i class="fas fa-user"></i> Профиль
                <span class="coin-badge">${currentUser.coins} <i class="fas fa-coins"></i></span>
            </a>
            <a href="store.html"><i class="fas fa-store"></i> Магазин</a>
            ${currentUser.isAdmin ? '<a href="admin.html"><i class="fas fa-cog"></i> Админка</a>' : ''}
            <a href="#" onclick="logout(); return false;"><i class="fas fa-sign-out-alt"></i> Выйти</a>
        `;
    } else {
        navLinks.innerHTML = `
            <a href="login.html"><i class="fas fa-sign-in-alt"></i> Войти</a>
            <a href="register.html"><i class="fas fa-user-plus"></i> Регистрация</a>
        `;
    }
}

function renderIndex() {
    const topicsGrid = document.getElementById('topicsGrid');
    const heroButton = document.getElementById('heroButton');

    if (!topicsGrid) return;

    if (!currentUser) {
        if (heroButton) {
            heroButton.innerHTML = '<a href="register.html" class="btn btn-primary">Начать учиться</a>';
        }
    } else {
        if (heroButton) {
            heroButton.innerHTML = '';
        }
    }

    topicsGrid.innerHTML = topics.map(topic => {
        const progress = userProgress.find(p => p.topicId === topic.id);
        const completedCount = progress ?
            (progress.completedTheory ? 1 : 0) +
            (progress.completedSymbolic ? 1 : 0) +
            (progress.completedDrawing ? 1 : 0) : 0;

        return `
            <div class="topic-card">
                <div class="topic-header">
                    <h3>${topic.title}</h3>
                    ${currentUser && completedCount > 0 ? `
                        <div class="progress-indicator">
                            ${progress.completedTheory ? '<span class="completed"><i class="fas fa-check"></i> Теория</span>' : ''}
                            ${progress.completedSymbolic ? '<span class="completed"><i class="fas fa-check"></i> Запись</span>' : ''}
                            ${progress.completedDrawing ? '<span class="completed"><i class="fas fa-check"></i> Рисунок</span>' : ''}
                        </div>
                    ` : ''}
                </div>
                <p>${topic.theoryContent.substring(0, 100)}...</p>
                ${currentUser ?
                    `<a href="topic.html?id=${topic.id}" class="btn btn-secondary">Изучать тему</a>` :
                    `<a href="login.html" class="btn btn-secondary">Войдите для изучения</a>`
                }
            </div>
        `;
    }).join('');
}

function renderTopic() {
    const urlParams = new URLSearchParams(window.location.search);
    const topicId = parseInt(urlParams.get('id'));
    const topic = topics.find(t => t.id === topicId);

    if (!topic) {
        window.location.href = 'index.html';
        return;
    }

    const container = document.querySelector('.topic-container');
    if (!container) return;

    let progress = userProgress.find(p => p.topicId === topicId);
    if (!progress && currentUser) {
        progress = { topicId, completedTheory: false, completedSymbolic: false, completedDrawing: false, coinsEarned: 0 };
        userProgress.push(progress);
        saveData();
    }

    container.innerHTML = `
        <h1>${topic.title}</h1>

        <div class="topic-navigation">
            <button class="nav-btn active" data-section="theory">Теория</button>
            <button class="nav-btn" data-section="symbolic">Символическая запись</button>
            <button class="nav-btn" data-section="drawing">Рисунок</button>
            <a href="tasks.html?topicId=${topicId}" class="nav-btn">Задания</a>
        </div>

        <section id="theory-section" class="topic-section active">
            <div class="section-header">
                <h2>Теория</h2>
                ${currentUser && !progress.completedTheory ?
                    `<button class="complete-btn" onclick="completeSection(${topicId}, 'theory', 10)">Завершить раздел (+10 <i class="fas fa-coins"></i>)</button>` :
                    progress.completedTheory ? '<span class="completed-badge"><i class="fas fa-check-circle"></i> Пройдено</span>' : ''
                }
            </div>
            <div class="theory-content">${topic.theoryContent.replace(/\n/g, '<br>')}</div>
        </section>

        <section id="symbolic-section" class="topic-section">
            <div class="section-header">
                <h2>Символическая запись</h2>
                ${currentUser && !progress.completedSymbolic ?
                    `<button class="complete-btn" onclick="completeSection(${topicId}, 'symbolic', 15)">Завершить раздел (+15 <i class="fas fa-coins"></i>)</button>` :
                    progress.completedSymbolic ? '<span class="completed-badge"><i class="fas fa-check-circle"></i> Пройдено</span>' : ''
                }
            </div>
            <div class="symbolic-content"><pre>${topic.symbolicContent}</pre></div>
        </section>

        <section id="drawing-section" class="topic-section">
            <div class="section-header">
                <h2>Рисунок</h2>
                ${currentUser && !progress.completedDrawing ?
                    `<button class="complete-btn" onclick="completeSection(${topicId}, 'drawing', 20)">Завершить раздел (+20 <i class="fas fa-coins"></i>)</button>` :
                    progress.completedDrawing ? '<span class="completed-badge"><i class="fas fa-check-circle"></i> Пройдено</span>' : ''
                }
            </div>
            <div class="drawing-content">
                <div class="drawing-placeholder">
                    <i class="fas fa-drafting-compass fa-4x"></i>
                    <p>${topic.drawingDescription}</p>
                </div>
            </div>
        </section>
    `;

    // Навигация по разделам
    document.querySelectorAll('.nav-btn').forEach(btn => {
        if (btn.tagName === 'BUTTON') {
            btn.addEventListener('click', function() {
                const section = this.dataset.section;
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                document.querySelectorAll('.topic-section').forEach(s => s.classList.remove('active'));
                document.getElementById(section + '-section').classList.add('active');
            });
        }
    });
}

function renderTasks() {
    const urlParams = new URLSearchParams(window.location.search);
    const topicId = parseInt(urlParams.get('topicId'));
    const topic = topics.find(t => t.id === topicId);
    const topicTasks = tasks.filter(t => t.topicId === topicId);
    const basicTasks = topicTasks.filter(t => !t.isPremium);
    const premiumTasks = topicTasks.filter(t => t.isPremium);

    const container = document.querySelector('.tasks-container');
    if (!container) return;

    container.innerHTML = `
        <h1>Задания к теме: ${topic.title}</h1>

        <div class="tasks-list">
            <h2>Базовые задания</h2>
            ${basicTasks.map(task => renderTaskCard(task)).join('')}
        </div>

        ${premiumTasks.length > 0 ? `
            <div class="tasks-list">
                <h2>Премиум задания (50 монет)</h2>
                ${premiumTasks.map(task => renderTaskCard(task)).join('')}
            </div>
        ` : ''}

        <div class="navigation-buttons">
            <a href="topic.html?id=${topicId}" class="btn btn-secondary">← Вернуться к теме</a>
            <a href="index.html" class="btn btn-primary">На главную →</a>
        </div>
    `;
}

function renderTaskCard(task) {
    const isCompleted = completedTasks.some(ct => ct.taskId === task.id && ct.userId === currentUser?.id);

    if (isCompleted) {
        return `
            <div class="task-card completed">
                <h3>${task.question.substring(0, 50)}...</h3>
                <div class="task-completed">
                    <i class="fas fa-check-circle"></i> Выполнено
                    <span class="task-reward">+${task.coinsReward} <i class="fas fa-coins"></i></span>
                </div>
            </div>
        `;
    }

    if (task.isPremium && currentUser.coins < 50) {
        return `
            <div class="task-card premium">
                <h3>${task.question}</h3>
                <p class="not-enough">Недостаточно монет. Нужно 50, у вас ${currentUser.coins}</p>
            </div>
        `;
    }

    if (task.answerType === 'choice') {
        const options = task.options.split(';');
        return `
            <div class="task-card">
                <h3>${task.question}</h3>
                <div class="task-options">
                    ${options.map(opt => `
                        <button class="option-btn" onclick="checkAnswer(${task.id}, '${opt}')">${opt}</button>
                    `).join('')}
                </div>
                <div class="task-reward">Награда: ${task.coinsReward} <i class="fas fa-coins"></i></div>
            </div>
        `;
    } else {
        return `
            <div class="task-card">
                <h3>${task.question}</h3>
                <div class="task-input">
                    <input type="text" id="answer-${task.id}" placeholder="Ваш ответ">
                    <button class="submit-btn" onclick="checkAnswer(${task.id}, document.getElementById('answer-${task.id}').value)">Проверить</button>
                </div>
                <div class="task-reward">Награда: ${task.coinsReward} <i class="fas fa-coins"></i></div>
            </div>
        `;
    }
}

function renderLogin() {
    const container = document.querySelector('.auth-container');
    if (!container) return;

    container.innerHTML = `
        <div class="auth-form">
            <h2>Вход в аккаунт</h2>
            <form id="loginForm">
                <div class="form-group">
                    <label><i class="fas fa-user"></i> Имя пользователя</label>
                    <input type="text" id="loginUsername" required>
                </div>
                <div class="form-group">
                    <label><i class="fas fa-lock"></i> Пароль</label>
                    <input type="password" id="loginPassword" required>
                </div>
                <button type="submit" class="btn btn-primary">Войти</button>
            </form>
            <p class="auth-link">Нет аккаунта? <a href="register.html">Зарегистрируйтесь</a></p>
        </div>
    `;

    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        const users = JSON.parse(localStorage.getItem('geometry_users') || '[]');
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            currentUser = { ...user };
            localStorage.setItem('geometry_current_user', JSON.stringify(currentUser));
            window.location.href = 'index.html';
        } else {
            alert('Неверное имя пользователя или пароль');
        }
    });
}

function renderRegister() {
    const container = document.querySelector('.auth-container');
    if (!container) return;

    container.innerHTML = `
        <div class="auth-form">
            <h2>Регистрация</h2>
            <form id="registerForm">
                <div class="form-group">
                    <label><i class="fas fa-user"></i> Имя пользователя</label>
                    <input type="text" id="regUsername" required>
                </div>
                <div class="form-group">
                    <label><i class="fas fa-envelope"></i> Email</label>
                    <input type="email" id="regEmail" required>
                </div>
                <div class="form-group">
                    <label><i class="fas fa-lock"></i> Пароль</label>
                    <input type="password" id="regPassword" required>
                </div>
                <button type="submit" class="btn btn-primary">Зарегистрироваться</button>
            </form>
            <p class="auth-link">Уже есть аккаунт? <a href="login.html">Войдите</a></p>
        </div>
    `;

    document.getElementById('registerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('regUsername').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;

        const users = JSON.parse(localStorage.getItem('geometry_users') || '[]');

        if (users.find(u => u.username === username)) {
            alert('Имя пользователя уже занято');
            return;
        }

        const newUser = {
            id: users.length + 1,
            username,
            email,
            password,
            coins: 100,
            isAdmin: false
        };

        users.push(newUser);
        localStorage.setItem('geometry_users', JSON.stringify(users));
        alert('Регистрация успешна! Теперь вы можете войти.');
        window.location.href = 'login.html';
    });
}

function renderProfile() {
    const container = document.querySelector('.profile-container');
    if (!container) return;

    const completedTopics = userProgress.filter(p =>
        p.completedTheory && p.completedSymbolic && p.completedDrawing
    ).length;

    const totalCoinsEarned = userProgress.reduce((sum, p) => sum + (p.coinsEarned || 0), 0);

    container.innerHTML = `
        <div class="profile-header">
            <div class="avatar">
                <i class="fas fa-user-circle fa-5x"></i>
            </div>
            <div class="profile-info">
                <h1>${currentUser.username}</h1>
                <div class="stats">
                    <div class="stat">
                        <i class="fas fa-coins"></i>
                        <span>${currentUser.coins} монет</span>
                    </div>
                    <div class="stat">
                        <i class="fas fa-check-circle"></i>
                        <span>${completedTopics} тем завершено</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="progress-section">
            <h2>Прогресс изучения</h2>
            ${topics.map(topic => {
                const progress = userProgress.find(p => p.topicId === topic.id);
                const completed = progress ?
                    (progress.completedTheory ? 1 : 0) +
                    (progress.completedSymbolic ? 1 : 0) +
                    (progress.completedDrawing ? 1 : 0) : 0;
                const percent = Math.round((completed / 3) * 100);

                return `
                    <div class="progress-item">
                        <h3>${topic.title}</h3>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${percent}%;"></div>
                        </div>
                        <p>${percent}% завершено</p>
                        <a href="topic.html?id=${topic.id}" class="btn btn-small">Продолжить</a>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderStore() {
    const container = document.querySelector('.store-container');
    if (!container) return;

    container.innerHTML = `
        <h1>Магазин геометрических монет</h1>
        <div class="coins-display">
            <div class="coins-count">
                <i class="fas fa-coins"></i>
                <span>${currentUser.coins}</span>
            </div>
            <p>Ваш баланс</p>
        </div>
        <div class="store-items">
            <div class="store-item">
                <div class="item-icon">
                    <i class="fas fa-star"></i>
                </div>
                <h3>Премиум задания</h3>
                <p>Дополнительные сложные задания к каждой теме</p>
                <div class="item-price">50 монет за задание</div>
            </div>
        </div>
    `;
}

function renderAdmin() {
    if (!currentUser?.isAdmin) {
        window.location.href = 'index.html';
        return;
    }

    const container = document.querySelector('.admin-container');
    if (!container) return;

    const users = JSON.parse(localStorage.getItem('geometry_users') || '[]');

    container.innerHTML = `
        <h1>Панель администратора</h1>
        <div class="admin-stats">
            <div class="stat-card">
                <h3>Пользователи</h3>
                <p class="stat-number">${users.length}</p>
            </div>
            <div class="stat-card">
                <h3>Темы</h3>
                <p class="stat-number">${topics.length}</p>
            </div>
            <div class="stat-card">
                <h3>Задания</h3>
                <p class="stat-number">${tasks.length}</p>
            </div>
        </div>
        <div class="admin-section">
            <h2>Управление системой</h2>
            <button class="btn btn-danger" onclick="resetAllProgress()">Сбросить прогресс всех пользователей</button>
        </div>
    `;
}

// ========== ОСНОВНЫЕ ФУНКЦИИ ==========
function completeSection(topicId, section, reward) {
    let progress = userProgress.find(p => p.topicId === topicId);
    if (!progress) {
        progress = { topicId, completedTheory: false, completedSymbolic: false, completedDrawing: false, coinsEarned: 0 };
        userProgress.push(progress);
    }

    const completed = progress[`completed${section.charAt(0).toUpperCase() + section.slice(1)}`];

    if (!completed) {
        progress[`completed${section.charAt(0).toUpperCase() + section.slice(1)}`] = true;
        progress.coinsEarned = (progress.coinsEarned || 0) + reward;
        currentUser.coins += reward;
        saveData();
        alert(`Раздел завершен! Вы получили ${reward} монет!`);
        renderTopic();
    }
}

function checkAnswer(taskId, answer) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const isCompleted = completedTasks.some(ct => ct.taskId === taskId && ct.userId === currentUser.id);
    if (isCompleted) {
        alert('Это задание уже выполнено!');
        return;
    }

    if (answer.toLowerCase().trim() === task.correctAnswer.toLowerCase().trim()) {
        completedTasks.push({ taskId, userId: currentUser.id, coinsEarned: task.coinsReward });
        currentUser.coins += task.coinsReward;
        saveData();
        alert(`Правильно! Вы получили ${task.coinsReward} монет!`);
        renderTasks();
    } else {
        alert(`Неправильно. Правильный ответ: ${task.correctAnswer}`);
    }
}

function buyPremiumTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (currentUser.coins >= 50) {
        currentUser.coins -= 50;
        task.isPremium = false;
        saveData();
        alert('Задание куплено!');
        renderTasks();
    } else {
        alert('Недостаточно монет!');
    }
}

function resetAllProgress() {
    if (confirm('Вы уверены? Это сбросит прогресс всех пользователей!')) {
        userProgress = [];
        completedTasks = [];
        const users = JSON.parse(localStorage.getItem('geometry_users') || '[]');
        users.forEach(u => { if (!u.isAdmin) u.coins = 100; });
        localStorage.setItem('geometry_users', JSON.stringify(users));
        saveData();
        alert('Прогресс сброшен!');
        window.location.href = 'index.html';
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('geometry_current_user');
    window.location.href = 'index.html';
}

// Запуск приложения
loadData();
