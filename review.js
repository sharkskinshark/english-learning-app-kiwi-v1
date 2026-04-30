// Review mode functionality
const REVIEW_KEY = 'englishAppReview';
const REVIEW_HISTORY_LIMIT = 300;
const REVIEW_EVENT_DEDUP_WINDOW_MS = 1500;

function toSafeNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function normalizeReviewEntry(raw, wordKey) {
    const now = Date.now();
    const entry = (raw && typeof raw === 'object') ? raw : {};

    const history = Array.isArray(entry.history)
        ? entry.history
            .filter(evt => evt && typeof evt === 'object')
            .map((evt) => ({
                ts: toSafeNumber(evt.ts, now),
                correct: !!evt.correct,
                phase: evt.phase === 'review' ? 'review' : 'learn',
                mode: evt.mode === 'meaning' ? 'meaning' : 'spelling',
                selectedAnswer: typeof evt.selectedAnswer === 'string' ? evt.selectedAnswer : '',
                correctAnswer: typeof evt.correctAnswer === 'string' ? evt.correctAnswer : ''
            }))
        : [];

    const learnFromHistory = history.filter(evt => evt.phase === 'learn').length;
    const reviewFromHistory = history.filter(evt => evt.phase === 'review').length;
    const correctFromHistory = history.filter(evt => evt.correct).length;

    const attempts = Math.max(
        toSafeNumber(entry.attempts, 0),
        history.length
    );
    const correct = Math.min(
        attempts,
        Math.max(toSafeNumber(entry.correct, correctFromHistory), correctFromHistory)
    );
    const learnAttempts = Math.max(toSafeNumber(entry.learnAttempts, learnFromHistory), learnFromHistory);
    const reviewAttempts = Math.max(toSafeNumber(entry.reviewAttempts, reviewFromHistory), reviewFromHistory);
    const cycleCompleted = learnAttempts > 0 && reviewAttempts > 0;

    return {
        word: entry.word || wordKey,
        meaning: entry.meaning || '',
        emoji: entry.emoji || '',
        attempts,
        correct,
        lastSeen: toSafeNumber(entry.lastSeen, now),
        firstSeen: toSafeNumber(entry.firstSeen, toSafeNumber(entry.lastSeen, now)),
        needsReview: typeof entry.needsReview === 'boolean'
            ? entry.needsReview
            : !attempts || (correct / attempts) < 0.7,
        learnAttempts,
        reviewAttempts,
        cycleCompleted,
        lastMode: entry.lastMode === 'meaning' ? 'meaning' : 'spelling',
        history: history.slice(-REVIEW_HISTORY_LIMIT),
        lastQuestionKey: typeof entry.lastQuestionKey === 'string' ? entry.lastQuestionKey : ''
    };
}

function normalizeReviewStore(store) {
    if (!store || typeof store !== 'object') return {};

    const normalized = {};
    Object.entries(store).forEach(([word, entry]) => {
        if (!word) return;
        normalized[word] = normalizeReviewEntry(entry, word);
    });
    return normalized;
}

function loadReviewStore() {
    try {
        const raw = localStorage.getItem(REVIEW_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        return normalizeReviewStore(parsed);
    } catch {
        return {};
    }
}

function saveReviewStore(store) {
    try {
        localStorage.setItem(REVIEW_KEY, JSON.stringify(store));
    } catch {
        // Ignore storage failures (private mode / quota), app should still run.
    }
}

function saveForReview(word, correct, meta = {}) {
    if (!word || !word.word) return;

    const reviews = getReviewWords();
    const ts = Date.now();
    const phase = meta.phase === 'review' ? 'review' : 'learn';
    const mode = meta.mode === 'meaning' ? 'meaning' : 'spelling';

    if (!reviews[word.word]) reviews[word.word] = normalizeReviewEntry({}, word.word);

    const entry = normalizeReviewEntry(reviews[word.word], word.word);
    const questionKey = typeof meta.questionKey === 'string' ? meta.questionKey : '';

    // Ignore duplicate saves for the same question (e.g., touch + click double fire).
    if (questionKey && entry.lastQuestionKey === questionKey) return;

    const lastEvt = Array.isArray(entry.history) && entry.history.length > 0
        ? entry.history[entry.history.length - 1]
        : null;
    if (
        !questionKey &&
        lastEvt &&
        lastEvt.phase === phase &&
        lastEvt.mode === mode &&
        lastEvt.correct === !!correct &&
        (ts - toSafeNumber(lastEvt.ts, 0)) <= REVIEW_EVENT_DEDUP_WINDOW_MS
    ) {
        return;
    }

    entry.meaning = word.meaning || entry.meaning;
    entry.emoji = word.emoji || entry.emoji;
    entry.attempts++;
    if (correct) entry.correct++;

    if (phase === 'review') entry.reviewAttempts++;
    else entry.learnAttempts++;

    entry.lastSeen = ts;
    entry.lastMode = mode;
    entry.needsReview = !correct || (entry.correct / entry.attempts) < 0.7;
    entry.cycleCompleted = entry.learnAttempts > 0 && entry.reviewAttempts > 0;

    const historyEvent = { ts, correct: !!correct, phase, mode };
    if (mode === 'meaning') {
        historyEvent.selectedAnswer = typeof meta.selectedAnswer === 'string' ? meta.selectedAnswer : '';
        historyEvent.correctAnswer = typeof meta.correctAnswer === 'string' ? meta.correctAnswer : (word.meaning || '');
    }

    entry.history.push(historyEvent);
    if (entry.history.length > REVIEW_HISTORY_LIMIT) {
        entry.history = entry.history.slice(entry.history.length - REVIEW_HISTORY_LIMIT);
    }

    if (questionKey) entry.lastQuestionKey = questionKey;

    reviews[word.word] = normalizeReviewEntry(entry, word.word);
    saveReviewStore(reviews);
}

function getReviewWords() {
    return loadReviewStore();
}

function getWordsForReview(count = 10) {
    const reviews = getReviewWords();
    const wordsToReview = Object.values(reviews)
        .filter(w => w.needsReview)
        .sort((a, b) => a.lastSeen - b.lastSeen)
        .slice(0, count);
    
    return wordsToReview.map(w => ({
        word: w.word,
        meaning: w.meaning,
        emoji: w.emoji
    }));
}

function getReviewStats() {
    const reviews = getReviewWords();
    const words = Object.values(reviews);
    const totalAttempts = words.reduce((sum, w) => sum + toSafeNumber(w.attempts, 0), 0);
    const totalCorrect = words.reduce((sum, w) => sum + toSafeNumber(w.correct, 0), 0);
    return {
        total: words.length,
        needsReview: words.filter(w => w.needsReview).length,
        mastered: words.filter(w => !w.needsReview).length,
        cycleCompleted: words.filter(w => w.cycleCompleted).length,
        totalAttempts,
        totalCorrect,
        accuracy: totalAttempts ? (totalCorrect / totalAttempts) : 0
    };
}

function getCompletedCycleWords(count = 50) {
    const reviews = getReviewWords();
    return Object.values(reviews)
        .filter(w => w.cycleCompleted)
        .sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0))
        .slice(0, count);
}

function getMonthlyReviewSummary(yearMonth) {
    const now = new Date();
    const fallback = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const target = yearMonth || fallback;

    const reviews = Object.values(getReviewWords());
    let attempts = 0;
    let correct = 0;
    const wordsSet = new Set();
    const completedCycleSet = new Set();

    reviews.forEach((entry) => {
        const history = Array.isArray(entry.history) ? entry.history : [];
        history.forEach((evt) => {
            const month = new Date(evt.ts).toISOString().slice(0, 7);
            if (month !== target) return;
            attempts++;
            if (evt.correct) correct++;
            wordsSet.add(entry.word);
            if (entry.cycleCompleted) completedCycleSet.add(entry.word);
        });
    });

    return {
        month: target,
        attempts,
        correct,
        accuracy: attempts ? (correct / attempts) : 0,
        uniqueWords: wordsSet.size,
        completedCycles: completedCycleSet.size
    };
}

function updateReviewStats() {
    const stats = getReviewStats();
    const reviewBtn = document.getElementById('reviewBtn');
    if (reviewBtn && stats.needsReview > 0) {
        reviewBtn.textContent = `📝 Review (${stats.needsReview})`;
        reviewBtn.style.display = 'inline-block';
    }
}
