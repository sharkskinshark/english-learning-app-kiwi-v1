// Leaderboard system
const LEADERBOARD_KEY = 'englishAppLeaderboard';
const USERNAME_KEY = 'englishAppUsername';
const LEADERBOARD_API_BASE = '/api/leaderboard';

// Leaderboard categories
const LEADERBOARD_TYPES = {
    DAILY_STREAK: 'dailyStreak',
    WORDS_LEARNED: 'wordsLearned',
    EVENT_POINTS: 'eventPoints',
    PERFECT_SCORES: 'perfectScores'
};

const LEADERBOARD_TITLES = {
    [LEADERBOARD_TYPES.DAILY_STREAK]: '🔥 Longest Streaks',
    [LEADERBOARD_TYPES.WORDS_LEARNED]: '📚 Most Words Learned',
    [LEADERBOARD_TYPES.EVENT_POINTS]: '🏆 Event Champions',
    [LEADERBOARD_TYPES.PERFECT_SCORES]: '⭐ Perfect Sessions'
};

const leaderboardState = {
    cache: { types: {}, currentUser: null },
    inFlight: null,
    lastFetchedAt: 0,
    refreshTimer: null
};

function getUsername() {
    return localStorage.getItem(USERNAME_KEY) || 'Anonymous';
}

function setUsername(name) {
    localStorage.setItem(USERNAME_KEY, name);
}

function getCurrentLeaderboardUser() {
    const activeKey = localStorage.getItem('englishAppActiveIdentity') || '';
    let profile = null;

    try {
        const store = JSON.parse(localStorage.getItem('englishAppIdentityProfiles') || '{}');
        if (activeKey && store && typeof store === 'object') {
            profile = store[activeKey] || null;
        }
    } catch {
        profile = null;
    }

    const username = profile?.nickname || getUsername();
    const email = (profile?.googleEmail || '').trim().toLowerCase();
    const userKey = email || activeKey || `name:${String(username).trim().toLowerCase() || 'anonymous'}`;

    return { userKey, username, email };
}

function calculateEventPoints(eventProgress) {
    let points = 0;
    if (!eventProgress) return points;

    // Points for words learned
    points += (eventProgress.wordsLearned?.length || 0) * 10;

    // Points for challenges completed
    points += (eventProgress.challengesCompleted?.length || 0) * 50;

    return points;
}

async function fetchLeaderboardSnapshot({ force = false, limit = 20 } = {}) {
    const now = Date.now();
    if (!force && (now - leaderboardState.lastFetchedAt) < 15000 && leaderboardState.cache?.types) {
        return leaderboardState.cache;
    }

    if (leaderboardState.inFlight) {
        return leaderboardState.inFlight;
    }

    const query = `?boardType=all&limit=${Math.min(Math.max(Number(limit) || 20, 1), 100)}`;
    leaderboardState.inFlight = fetch(`${LEADERBOARD_API_BASE}/list${query}`, {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' }
    }).then(async (response) => {
        let data = {};
        try {
            data = await response.json();
        } catch {
            data = {};
        }

        if (!response.ok) {
            throw new Error(data?.error || 'Failed to fetch leaderboard.');
        }

        leaderboardState.cache = {
            types: data?.types || {},
            currentUser: data?.currentUser || null
        };
        leaderboardState.lastFetchedAt = Date.now();
        return leaderboardState.cache;
    }).catch((error) => {
        console.warn('Leaderboard fetch failed:', error?.message || error);
        return null;
    }).finally(() => {
        leaderboardState.inFlight = null;
    });

    return leaderboardState.inFlight;
}

async function submitLeaderboardScore(boardType, score, details = {}) {
    const numericScore = Number(score);
    if (!Number.isFinite(numericScore)) return false;

    try {
        const response = await fetch(`${LEADERBOARD_API_BASE}/submit`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                boardType,
                score: numericScore,
                details
            })
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data?.error || 'Failed to update leaderboard.');
        }

        return true;
    } catch (error) {
        console.warn('Leaderboard submit failed:', error?.message || error);
        return false;
    }
}

function scheduleLeaderboardRefresh(delay = 120) {
    if (leaderboardState.refreshTimer) {
        clearTimeout(leaderboardState.refreshTimer);
    }
    leaderboardState.refreshTimer = setTimeout(() => {
        displayLeaderboards({ force: true });
    }, delay);
}

function formatEntryName(entry) {
    return entry?.username || entry?.email || 'Anonymous';
}

function isCurrentEntry(entry, current) {
    const entryEmail = String(entry?.email || '').trim().toLowerCase();
    const currentEmail = String(current?.email || '').trim().toLowerCase();
    if (entryEmail && currentEmail) return entryEmail === currentEmail;

    const currentUser = getCurrentLeaderboardUser();
    return String(formatEntryName(entry)).trim().toLowerCase() === String(currentUser.username || '').trim().toLowerCase();
}

function generateLeaderboardHTML(type, leaderboard = [], current = null, limit = 10) {
    const rows = (Array.isArray(leaderboard) ? leaderboard : []).slice(0, limit);
    const title = LEADERBOARD_TITLES[type] || 'Leaderboard';

    if (rows.length === 0) {
        return `
            <div class="leaderboard-section">
                <h3>${title}</h3>
                <div class="leaderboard-list">
                    <div class="leaderboard-entry">
                        <span class="rank">-</span>
                        <span class="username">No records yet</span>
                        <span class="score">-</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    return `
        <div class="leaderboard-section">
            <h3>${title}</h3>
            <div class="leaderboard-list">
                ${rows.map((entry, index) => `
                    <div class="leaderboard-entry ${isCurrentEntry(entry, current) ? 'current-user' : ''}">
                        <span class="rank">${entry.rank || index + 1}</span>
                        <span class="username">${formatEntryName(entry)}</span>
                        <span class="score">${formatScore(type, Number(entry.bestScore || 0))}</span>
                        ${entry.details?.eventName ? `<span class="event-name">${entry.details.eventName}</span>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function formatScore(type, score) {
    switch(type) {
        case LEADERBOARD_TYPES.DAILY_STREAK:
            return `${score} days`;
        case LEADERBOARD_TYPES.EVENT_POINTS:
            return `${score} pts`;
        default:
            return score;
    }
}

// Update leaderboards based on actions
function updateLeaderboards(action, data) {
    let boardType = '';
    let score = 0;
    let details = {};

    switch(action) {
        case 'streak':
            boardType = LEADERBOARD_TYPES.DAILY_STREAK;
            score = Number(data?.current || 0);
            break;
        case 'words':
            boardType = LEADERBOARD_TYPES.WORDS_LEARNED;
            score = Number(data?.total || 0);
            break;
        case 'event': {
            boardType = LEADERBOARD_TYPES.EVENT_POINTS;
            score = calculateEventPoints(data?.progress);
            details = { eventName: data?.eventName || '' };
            break;
        }
        case 'perfect':
            boardType = LEADERBOARD_TYPES.PERFECT_SCORES;
            score = Number(data?.count || 0);
            break;
        default:
            return;
    }

    submitLeaderboardScore(boardType, score, details).finally(() => {
        scheduleLeaderboardRefresh();
    });
}

async function displayLeaderboards(options = {}) {
    const container = document.getElementById('leaderboardsContent');
    if (!container) return;

    const force = !!options.force;
    const snapshot = await fetchLeaderboardSnapshot({ force, limit: 20 });
    if (!snapshot) {
        // If backend is unavailable, keep previous content and avoid blanking out UI.
        if (!container.innerHTML.trim()) {
            container.innerHTML = Object.values(LEADERBOARD_TYPES)
                .map(type => generateLeaderboardHTML(type, [], null))
                .join('');
        }
        return;
    }

    const current = snapshot.currentUser || null;
    container.innerHTML = Object.values(LEADERBOARD_TYPES)
        .map(type => generateLeaderboardHTML(type, snapshot.types?.[type] || [], current))
        .join('');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        displayLeaderboards({ force: true });
    });
} else {
    displayLeaderboards({ force: true });
}