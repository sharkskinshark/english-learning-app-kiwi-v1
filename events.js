// Seasonal events and special challenges
const EVENTS = {
    easter: {
        id: 'easter',
        name: 'Easter Celebration 🐰',
        period: { start: '04-01', end: '04-15' },
        words: [
            { word: "egg", meaning: "decorated Easter egg", emoji: "🥚" },
            { word: "bunny", meaning: "Easter rabbit that brings eggs", emoji: "🐰" },
            { word: "basket", meaning: "container for Easter eggs", emoji: "🧺" },
            { word: "chick", meaning: "baby bird that hatches", emoji: "🐥" },
            { word: "flower", meaning: "spring plant that blooms", emoji: "🌷" },
            { word: "chocolate", meaning: "sweet Easter treat", emoji: "🍫" }
        ],
        challenges: [
            {
                id: 'egg_hunter',
                title: 'Egg Hunter',
                description: 'Find and learn all Easter words',
                reward: '🥚',
                requirement: 6
            },
            {
                id: 'easter_streak',
                title: 'Easter Joy',
                description: 'Practice Easter words 3 days in a row',
                reward: '🐰',
                requirement: 3
            }
        ]
    },
    summer: {
        id: 'summer',
        name: 'Summer Fun ☀️',
        period: { start: '06-15', end: '07-15' },
        words: [
            { word: "beach", meaning: "sandy place by the ocean", emoji: "🏖️" },
            { word: "swim", meaning: "move through water", emoji: "🏊" },
            { word: "ice cream", meaning: "cold sweet summer treat", emoji: "🍦" },
            { word: "sunscreen", meaning: "cream that protects from sun", emoji: "🧴" },
            { word: "sandcastle", meaning: "building made from sand", emoji: "🏰" },
            { word: "sunglasses", meaning: "protect eyes from sun", emoji: "🕶️" }
        ],
        challenges: [
            {
                id: 'summer_fun',
                title: 'Summer Expert',
                description: 'Master all summer words',
                reward: '☀️',
                requirement: 6
            },
            {
                id: 'beach_day',
                title: 'Beach Day',
                description: 'Practice summer words 5 times',
                reward: '🏖️',
                requirement: 5
            }
        ]
    },
    backToSchool: {
        id: 'backToSchool',
        name: 'Back to School 📚',
        period: { start: '08-15', end: '09-09' },
        words: [
            { word: "backpack", meaning: "bag for carrying school things", emoji: "🎒" },
            { word: "pencil", meaning: "tool for writing and drawing", emoji: "✏️" },
            { word: "notebook", meaning: "book for writing notes", emoji: "📓" },
            { word: "teacher", meaning: "person who helps you learn", emoji: "👩‍🏫" },
            { word: "classroom", meaning: "room where students learn", emoji: "🏫" },
            { word: "student", meaning: "person who learns at school", emoji: "👨‍🎓" }
        ],
        challenges: [
            {
                id: 'school_ready',
                title: 'School Ready',
                description: 'Learn all school preparation words',
                reward: '📚',
                requirement: 6
            },
            {
                id: 'eager_student',
                title: 'Eager Student',
                description: 'Practice school words for 4 days',
                reward: '🎓',
                requirement: 4
            }
        ]
    },
    halloween: {
        id: 'halloween',
        name: 'Halloween Special 🎃',
        period: { start: '10-25', end: '10-31' },
        words: [
            { word: "pumpkin", meaning: "orange vegetable used for Halloween", emoji: "🎃" },
            { word: "ghost", meaning: "spooky floating spirit", emoji: "👻" },
            { word: "witch", meaning: "person who does magic", emoji: "🧙‍♀️" },
            { word: "candy", meaning: "sweet treats for trick-or-treat", emoji: "🍬" },
            { word: "costume", meaning: "special clothes for Halloween", emoji: "👻" }
        ],
        challenges: [
            {
                id: 'halloween_master',
                title: 'Halloween Master',
                description: 'Learn all Halloween words',
                reward: '🎃',
                requirement: 5
            },
            {
                id: 'trick_or_treat',
                title: 'Trick or Treat',
                description: 'Complete 3 Halloween word reviews',
                reward: '🍬',
                requirement: 3
            }
        ]
    },
    christmas: {
        id: 'christmas',
        name: 'Christmas Joy 🎄',
        period: { start: '12-15', end: '12-25' },
        words: [
            { word: "snow", meaning: "white cold flakes from sky", emoji: "❄️" },
            { word: "santa", meaning: "brings presents at Christmas", emoji: "🎅" },
            { word: "gift", meaning: "present wrapped for Christmas", emoji: "🎁" },
            { word: "tree", meaning: "decorated Christmas tree", emoji: "🎄" },
            { word: "star", meaning: "bright shape on top of tree", emoji: "⭐" },
            { word: "reindeer", meaning: "animal that pulls Santa's sleigh", emoji: "🦌" },
            { word: "sleigh", meaning: "Santa's vehicle for delivering gifts", emoji: "🛷" },
            { word: "cookie", meaning: "sweet treat left for Santa", emoji: "🍪" },
            { word: "stocking", meaning: "long sock hung for gifts", emoji: "🧦" },
            { word: "bell", meaning: "makes ringing sound on Christmas", emoji: "🔔" },
            { word: "wreath", meaning: "circular Christmas decoration", emoji: "🎀" },
            { word: "mistletoe", meaning: "plant hung for Christmas kisses", emoji: "🌿" },
            { word: "ornament", meaning: "decoration for Christmas tree", emoji: "🎗️" },
            { word: "chimney", meaning: "where Santa enters houses", emoji: "🏠" },
            { word: "carols", meaning: "Christmas songs sung door to door", emoji: "🎵" }
        ],
        challenges: [
            {
                id: 'santa_helper',
                title: 'Santa\'s Helper',
                description: 'Learn all 15 Christmas words',
                reward: '🎄',
                requirement: 15
            },
            {
                id: 'christmas_spirit',
                title: 'Christmas Spirit',
                description: 'Practice Christmas words for 5 days',
                reward: '🎅',
                requirement: 5
            },
            {
                id: 'christmas_eve_master',
                title: 'Christmas Eve Master',
                description: 'Complete 10 Christmas word reviews',
                reward: '🎁',
                requirement: 10
            }
        ]
    },
    spring: {
        id: 'spring',
        name: 'Spring Bloom 🌸',
        period: { start: '03-20', end: '03-31' },
        words: [
            { word: "flower", meaning: "colorful plant that blooms", emoji: "🌸" },
            { word: "butterfly", meaning: "pretty flying insect", emoji: "🦋" },
            { word: "rain", meaning: "water falling from clouds", emoji: "🌧️" },
            { word: "garden", meaning: "place where plants grow", emoji: "🌺" },
            { word: "rainbow", meaning: "colorful arch in the sky", emoji: "🌈" }
        ],
        challenges: [
            {
                id: 'spring_bloom',
                title: 'Spring Bloom',
                description: 'Learn all spring words',
                reward: '🌸',
                requirement: 5
            },
            {
                id: 'nature_friend',
                title: 'Nature Friend',
                description: 'Practice spring words 3 days in a row',
                reward: '🌺',
                requirement: 3
            }
        ]
    },
    thanksgiving: {
        id: 'thanksgiving',
        name: 'Thanksgiving Feast 🦃',
        period: { start: '11-20', end: '11-30' },
        words: [
            { word: "turkey", meaning: "big bird eaten at Thanksgiving", emoji: "🦃" },
            { word: "pie", meaning: "sweet baked dessert", emoji: "🥧" },
            { word: "family", meaning: "people related by blood", emoji: "👨‍👩‍👧‍👦" },
            { word: "grateful", meaning: "feeling thankful", emoji: "🙏" },
            { word: "feast", meaning: "big meal with lots of food", emoji: "🍽️" }
        ],
        challenges: [
            {
                id: 'thanksgiving_master',
                title: 'Thanksgiving Master',
                description: 'Learn all Thanksgiving words',
                reward: '🦃',
                requirement: 5
            },
            {
                id: 'grateful_learner',
                title: 'Grateful Learner',
                description: 'Complete 3 Thanksgiving word reviews',
                reward: '🥧',
                requirement: 3
            }
        ]
    },
    newyear: {
        id: 'newyear',
        name: 'New Year Celebration 🎉',
        period: { start: '12-26', end: '01-05' },
        words: [
            { word: "firework", meaning: "explosive colorful display", emoji: "🎆" },
            { word: "resolution", meaning: "promise to do better", emoji: "📅" },
            { word: "champagne", meaning: "sparkling drink for celebrations", emoji: "🍾" },
            { word: "midnight", meaning: "12 o'clock at night", emoji: "🕛" },
            { word: "toast", meaning: "drink to celebrate", emoji: "🥂" },
            { word: "countdown", meaning: "counting backwards to zero", emoji: "⏰" },
            { word: "celebration", meaning: "happy party or festival", emoji: "🎊" },
            { word: "confetti", meaning: "small colorful paper pieces", emoji: "🎊" },
            { word: "party", meaning: "fun gathering with friends", emoji: "🎉" },
            { word: "calendar", meaning: "shows dates and months", emoji: "📆" },
            { word: "wish", meaning: "hope for something good", emoji: "🌟" },
            { word: "goal", meaning: "something you want to achieve", emoji: "🎯" },
            { word: "fresh", meaning: "new and clean start", emoji: "✨" },
            { word: "beginning", meaning: "the start of something new", emoji: "🌅" },
            { word: "sparkler", meaning: "small handheld firework", emoji: "🎇" }
        ],
        challenges: [
            {
                id: 'new_year_master',
                title: 'New Year Master',
                description: 'Learn all 15 New Year words',
                reward: '🎆',
                requirement: 15
            },
            {
                id: 'resolution_keeper',
                title: 'Resolution Keeper',
                description: 'Practice New Year words for 5 days',
                reward: '🥂',
                requirement: 5
            },
            {
                id: 'midnight_champion',
                title: 'Midnight Champion',
                description: 'Complete 12 New Year word reviews',
                reward: '🕛',
                requirement: 12
            }
        ]
    },
    chinesenewyear: {
        id: 'chinesenewyear',
        name: 'Chinese New Year 🧧',
        period: { start: '01-15', end: '02-15' },
        words: [
            { word: "lantern", meaning: "colorful hanging light decoration", emoji: "🏮" },
            { word: "dragon", meaning: "mythical creature for parade dance", emoji: "🐉" },
            { word: "dumpling", meaning: "traditional food for good fortune", emoji: "🥟" },
            { word: "red envelope", meaning: "money gift in red packet", emoji: "🧧" },
            { word: "lucky", meaning: "having good fortune", emoji: "🍀" },
            { word: "zodiac", meaning: "12 animal year cycle", emoji: "🐯" },
            { word: "firecracker", meaning: "loud explosive for celebration", emoji: "🧨" },
            { word: "reunion", meaning: "family gathering together", emoji: "👨‍👩‍👧‍👦" },
            { word: "prosperity", meaning: "wealth and success", emoji: "💰" },
            { word: "fortune", meaning: "good luck and wealth", emoji: "🎰" },
            { word: "ancestor", meaning: "family members from past", emoji: "👴" },
            { word: "temple", meaning: "place for prayer and worship", emoji: "⛩️" },
            { word: "blessing", meaning: "good wish from others", emoji: "🙏" },
            { word: "tradition", meaning: "custom passed through generations", emoji: "📜" },
            { word: "festival", meaning: "special celebration event", emoji: "🎊" }
        ],
        challenges: [
            {
                id: 'dragon_dancer',
                title: 'Dragon Dancer',
                description: 'Learn all 15 Chinese New Year words',
                reward: '🐉',
                requirement: 15
            },
            {
                id: 'lantern_master',
                title: 'Lantern Master',
                description: 'Practice Chinese New Year words for 7 days',
                reward: '🏮',
                requirement: 7
            },
            {
                id: 'fortune_keeper',
                title: 'Fortune Keeper',
                description: 'Complete 15 Chinese New Year word reviews',
                reward: '🧧',
                requirement: 15
            }
        ]
    },
    birthday: {
        id: 'birthday',
        name: 'Special Birthday 🎂',
        period: { start: '09-10', end: '09-10' },
        words: [
            { word: "cake", meaning: "sweet birthday dessert with candles", emoji: "🎂" },
            { word: "candle", meaning: "wax stick that burns with flame", emoji: "🕯️" },
            { word: "gift", meaning: "present given on birthday", emoji: "🎁" },
            { word: "party", meaning: "celebration with friends", emoji: "🎉" },
            { word: "balloon", meaning: "colorful inflated decoration", emoji: "🎈" },
            { word: "wish", meaning: "special hope made when blowing candles", emoji: "⭐" },
            { word: "friend", meaning: "person who comes to celebrate", emoji: "👫" },
            { word: "surprise", meaning: "unexpected birthday joy", emoji: "🎊" }
        ],
        challenges: [
            {
                id: 'birthday_celebration',
                title: 'Birthday Star',
                description: 'Learn all 8 birthday words',
                reward: '🎂',
                requirement: 8
            },
            {
                id: 'birthday_wishes',
                title: 'Wish Master',
                description: 'Practice birthday words 3 times',
                reward: '🌟',
                requirement: 3
            }
        ]
    }
};

function getCurrentEvent() {
    const today = new Date();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const currentDate = `${month}-${day}`;

    return Object.values(EVENTS).find(event => {
        const [startMonth, startDay] = event.period.start.split('-');
        const [endMonth, endDay] = event.period.end.split('-');
        const start = `${startMonth.padStart(2, '0')}-${startDay.padStart(2, '0')}`;
        const end = `${endMonth.padStart(2, '0')}-${endDay.padStart(2, '0')}`;
        
        return currentDate >= start && currentDate <= end;
    });
}

// Event progress tracking
const EVENT_PROGRESS_KEY = 'englishAppEventProgress';

function normalizeEventProgressEntry(entry) {
    const safe = (entry && typeof entry === 'object') ? entry : {};
    return {
        wordsLearned: Array.isArray(safe.wordsLearned) ? safe.wordsLearned : [],
        challengesCompleted: Array.isArray(safe.challengesCompleted) ? safe.challengesCompleted : []
    };
}

function loadAllEventProgress() {
    try {
        const saved = localStorage.getItem(EVENT_PROGRESS_KEY);
        const parsed = saved ? JSON.parse(saved) : {};
        return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch {
        return {};
    }
}

function getEventProgress(eventId) {
    const allProgress = loadAllEventProgress();
    return normalizeEventProgressEntry(allProgress[eventId]);
}

function updateEventProgress(eventId, type, data) {
    const allProgress = loadAllEventProgress();
    allProgress[eventId] = normalizeEventProgressEntry(allProgress[eventId]);
    
    if (type === 'word' && !allProgress[eventId].wordsLearned.includes(data)) {
        allProgress[eventId].wordsLearned.push(data);
    } else if (type === 'challenge' && !allProgress[eventId].challengesCompleted.includes(data)) {
        allProgress[eventId].challengesCompleted.push(data);
    }
    
    localStorage.setItem(EVENT_PROGRESS_KEY, JSON.stringify(allProgress));
    return allProgress[eventId];
}

// Check if an event challenge is completed
function checkEventChallenges(event, progress) {
    const safeProgress = normalizeEventProgressEntry(progress);
    event.challenges.forEach(challenge => {
        if (!safeProgress.challengesCompleted.includes(challenge.id)) {
            if (challenge.id.includes('master') && safeProgress.wordsLearned.length >= challenge.requirement) {
                updateEventProgress(event.id, 'challenge', challenge.id);
                showEventReward(challenge);
            } else if (challenge.id.includes('spirit') || challenge.id.includes('friend')) {
                // Check consecutive days logic here
                const streak = getDailyStreak();
                if (streak.current >= challenge.requirement) {
                    updateEventProgress(event.id, 'challenge', challenge.id);
                    showEventReward(challenge);
                }
            }
        }
    });
}

function showEventReward(challenge) {
    showNotification(
        `${challenge.reward} Event Challenge Complete!`,
        challenge.description
    );
}

// Date-based holiday checking utility functions
function isHolidayActive(holidayId) {
    const event = EVENTS[holidayId];
    if (!event || !event.period) return false;
    
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // getMonth() returns 0-11, we need 1-12
    const currentDay = today.getDate();
    
    const startParts = event.period.start.split('-');
    const endParts = event.period.end.split('-');
    
    const startMonth = parseInt(startParts[0]);
    const startDay = parseInt(startParts[1]);
    const endMonth = parseInt(endParts[0]);
    const endDay = parseInt(endParts[1]);
    
    // Handle events that span across year boundary (like New Year)
    if (startMonth > endMonth) {
        // Event spans December to January
        return (currentMonth === startMonth && currentDay >= startDay) ||
               (currentMonth === endMonth && currentDay <= endDay) ||
               (currentMonth > startMonth || currentMonth < endMonth);
    } else {
        // Regular event within same year
        if (currentMonth === startMonth && currentMonth === endMonth) {
            return currentDay >= startDay && currentDay <= endDay;
        } else if (currentMonth === startMonth) {
            return currentDay >= startDay;
        } else if (currentMonth === endMonth) {
            return currentDay <= endDay;
        } else {
            return currentMonth > startMonth && currentMonth < endMonth;
        }
    }
}

function checkAllActiveHolidays() {
    const activeHolidays = [];
    const holidayIds = ['easter', 'summer', 'halloween', 'christmas', 'newyear', 'chinesenewyear'];
    
    holidayIds.forEach(id => {
        if (isHolidayActive(id)) {
            activeHolidays.push({
                id: id,
                name: EVENTS[id].name,
                period: EVENTS[id].period
            });
        }
    });
    
    return activeHolidays;
}

function getHolidayMessage(holidayId) {
    const event = EVENTS[holidayId];
    if (!event) return null;
    
    if (isHolidayActive(holidayId)) {
        return `🎉 ${event.name} is active! Enjoy the holiday animation!`;
    } else {
        return `❌ ${event.name} is not currently active. Holiday period: ${event.period.start} to ${event.period.end}`;
    }
}
