// Practice calendar functionality
const CALENDAR_KEY = 'englishAppCalendar';
const CALENDAR_VERSION = 2;
let currentCalendarView = null;

function readCalendarStore() {
    try {
        const saved = localStorage.getItem(CALENDAR_KEY);
        if (!saved) {
            return { version: CALENDAR_VERSION, users: {} };
        }

        const parsed = JSON.parse(saved);
        if (parsed && parsed.version === CALENDAR_VERSION && parsed.users && typeof parsed.users === 'object') {
            return parsed;
        }

        // Legacy migration: old schema was direct date map for one local user.
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return {
                version: CALENDAR_VERSION,
                users: {
                    local_default: {
                        profile: { username: localStorage.getItem('englishAppUsername') || 'Anonymous', email: '' },
                        dates: parsed
                    }
                }
            };
        }
    } catch {
        // Ignore malformed storage and reset below.
    }

    return { version: CALENDAR_VERSION, users: {} };
}

function saveCalendarStore(store) {
    localStorage.setItem(CALENDAR_KEY, JSON.stringify(store));
}

function getCalendarUserContext() {
    const activeKey = localStorage.getItem('englishAppActiveIdentity') || '';
    let profile = null;

    try {
        const identityStore = JSON.parse(localStorage.getItem('englishAppIdentityProfiles') || '{}');
        if (activeKey && identityStore && typeof identityStore === 'object') {
            profile = identityStore[activeKey] || null;
        }
    } catch {
        profile = null;
    }

    const username = profile?.nickname || localStorage.getItem('englishAppUsername') || 'Anonymous';
    const email = (profile?.googleEmail || '').trim().toLowerCase();
    const key = email || activeKey || `name:${String(username).trim().toLowerCase() || 'anonymous'}`;

    return { key, username, email };
}

function getCalendarData() {
    const store = readCalendarStore();
    const user = getCalendarUserContext();

    if (!store.users[user.key]) {
        store.users[user.key] = {
            profile: { username: user.username, email: user.email },
            dates: {}
        };
        saveCalendarStore(store);
    } else {
        store.users[user.key].profile = { username: user.username, email: user.email };
    }

    return store.users[user.key].dates || {};
}

function writeCurrentUserCalendarData(dates) {
    const store = readCalendarStore();
    const user = getCalendarUserContext();

    if (!store.users[user.key]) {
        store.users[user.key] = {
            profile: { username: user.username, email: user.email },
            dates: {}
        };
    }

    store.users[user.key].profile = { username: user.username, email: user.email };
    store.users[user.key].dates = dates;
    saveCalendarStore(store);
}

function updateCalendarData(date = new Date(), changes = {}) {
    const dateStr = date.toISOString().split('T')[0];
    const calendarData = getCalendarData();

    if (!calendarData[dateStr]) {
        calendarData[dateStr] = {
            wordsLearned: 0,
            reviewsDone: 0,
            score: 0,
            dailyCompleted: false,
            used: false,
            loginMarked: false,
            loginCount: 0
        };
    }

    const day = calendarData[dateStr];
    if (changes.wordsLearnedIncrement) day.wordsLearned += Number(changes.wordsLearnedIncrement) || 0;
    if (changes.reviewsDoneIncrement) day.reviewsDone += Number(changes.reviewsDoneIncrement) || 0;
    if (changes.scoreIncrement) day.score += Number(changes.scoreIncrement) || 0;
    if (changes.dailyCompleted === true) day.dailyCompleted = true;
    if (changes.used === true) day.used = true;
    if (changes.loginMarked === true && !day.loginMarked) {
        day.loginMarked = true;
        day.loginCount = (day.loginCount || 0) + 1;
    }

    writeCurrentUserCalendarData(calendarData);
    return calendarData[dateStr];
}

function markCalendarLoginUsage(date = new Date()) {
    return updateCalendarData(date, {
        used: true,
        loginMarked: true
    });
}

function generateCalendarHTML(year, month) {
    const date = new Date(year, month);
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const calendarData = getCalendarData();
    const currentDate = new Date();
    
    let html = `
        <div class="calendar-header">
            <button id="prevMonth">◀</button>
            <h3>${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}</h3>
            <button id="nextMonth">▶</button>
        </div>
        <div class="calendar-grid">
            <div class="calendar-day-header">Sun</div>
            <div class="calendar-day-header">Mon</div>
            <div class="calendar-day-header">Tue</div>
            <div class="calendar-day-header">Wed</div>
            <div class="calendar-day-header">Thu</div>
            <div class="calendar-day-header">Fri</div>
            <div class="calendar-day-header">Sat</div>
    `;
    
    // Add empty cells for days before start of month
    for (let i = 0; i < startDay; i++) {
        html += '<div class="calendar-day empty"></div>';
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayData = calendarData[dateStr];
        
        const isToday = currentDate.toISOString().split('T')[0] === dateStr;
        const hasActivity = dayData && (dayData.used || dayData.wordsLearned > 0 || dayData.reviewsDone > 0 || (dayData.loginCount || 0) > 0);
        const isComplete = dayData?.dailyCompleted;
        
        html += `
            <div class="calendar-day ${isToday ? 'today' : ''} ${hasActivity ? 'has-activity' : ''} ${isComplete ? 'complete' : ''}">
                <span class="day-number">${day}</span>
                ${hasActivity ? `
                    <div class="day-stats">
                        ${(dayData.loginCount || 0) > 0 ? `<span title="Logged In">👤 ${dayData.loginCount}</span>` : ''}
                        ${dayData.wordsLearned > 0 ? `<span title="Words Learned">📚 ${dayData.wordsLearned}</span>` : ''}
                        ${dayData.reviewsDone > 0 ? `<span title="Reviews Done">🔄 ${dayData.reviewsDone}</span>` : ''}
                    </div>
                ` : ''}
                ${isComplete ? '<span class="complete-mark">✅</span>' : ''}
            </div>
        `;
    }
    
    html += '</div>';
    return html;
}

// Helper function to update calendar display
function updateCalendarDisplay(year, month) {
    const calendarView = document.getElementById('calendarView');
    if (!calendarView) return;

    if (!currentCalendarView || typeof year !== 'number' || typeof month !== 'number') {
        const today = new Date();
        currentCalendarView = { year: today.getFullYear(), month: today.getMonth() };
    } else {
        currentCalendarView = { year, month };
    }

    calendarView.innerHTML = generateCalendarHTML(currentCalendarView.year, currentCalendarView.month);

    // Add event listeners for month navigation
    document.getElementById('prevMonth').addEventListener('click', () => {
        const newDate = new Date(currentCalendarView.year, currentCalendarView.month - 1);
        updateCalendarDisplay(newDate.getFullYear(), newDate.getMonth());
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        const newDate = new Date(currentCalendarView.year, currentCalendarView.month + 1);
        updateCalendarDisplay(newDate.getFullYear(), newDate.getMonth());
    });
}

function getCurrentCalendarDate() {
    const headerText = document.querySelector('.calendar-header h3').textContent;
    const [month, year] = headerText.split(' ');
    const monthIndex = new Date(Date.parse(`${month} 1, ${year}`)).getMonth();
    return [parseInt(year), monthIndex];
}