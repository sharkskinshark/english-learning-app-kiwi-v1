let vocab = {};
let session = { words: [], index: 0, score: 0, level: '', category: '' };
let currentWord = '';
let hasAnsweredCurrentQuestion = false;
let currentQuestionKey = '';
const synth = window.speechSynthesis;
const SELECTED_VOICE_KEY = 'englishAppSelectedSpeechVoice';

// Preferred British female voice matching - optimized for human-like voices on iPad/iPhone
// IMPORTANT: Moira (Apple voice) is first for iOS devices - most human-like
const VOICE_PREFERENCES = [
  // iOS/macOS - Apple voices (FIRST PRIORITY - highest quality and most human-like on Apple devices)
  'Moira',      // PRIMARY: British female (iOS/macOS - highly natural and human-like)
  'Victoria',   // British female (iOS - natural and clear)
  'Fiona',      // British female (macOS - natural)
  'Serena',     // British female (iOS - premium quality)
  'Kate',       // British female (iOS - clear pronunciation)
  'Ellen',      // English female (iOS)
  'Samantha',   // English female (iOS - fallback)
  // Windows/Edge/Chrome - Microsoft Natural voices (human-like)
  'Microsoft Sonia Online (Natural)',
  'Microsoft Libby Online (Natural)', 
  'Microsoft Olivia Online (Natural)',
  'Microsoft Hazel',
  'Microsoft Zira Online (Natural)',
  // Google voices (good quality)
  'Google UK English Female',
  'Google UK English',
  // Fallbacks for other systems
  'en-GB female',
  'English Female',
  'English (United Kingdom)'
];

function getVoiceKey(voice) {
  if (!voice) return '';
  return voice.voiceURI || `${voice.name || ''}|${voice.lang || ''}|${voice.localService ? 'local' : 'remote'}`;
}

function getSelectedSpeechVoice(voices = null) {
  const saved = localStorage.getItem(SELECTED_VOICE_KEY) || 'auto';
  if (!saved || saved === 'auto') return null;

  const list = voices || ((typeof synth?.getVoices === 'function') ? synth.getVoices() : []);
  return list.find(v => getVoiceKey(v) === saved) || null;
}

function pickBritishFemaleVoice() {
  try {
    const voices = (typeof synth?.getVoices === 'function') ? synth.getVoices() : [];
    if (!voices || voices.length === 0) {
      console.warn('No voices available');
      return null;
    }

    const selectedVoice = getSelectedSpeechVoice(voices);
    if (selectedVoice) {
      console.log('✓ SELECTED VOICE:', selectedVoice.name, '(' + selectedVoice.lang + ')');
      return selectedVoice;
    }
    
    // Log available voices for debugging
    logAvailableVoices();
    
    const voiceStr = (v) => `${(v.name || '') + ' ' + (v.lang || '')}`.toLowerCase();

    // Filter for en-GB or UK English voices
    const enGb = voices.filter(v => {
      const s = voiceStr(v);
      return /en-gb|en_gb|english \(united kingdom\)|british|uk english|moira|victoria|fiona/i.test(s);
    });

    console.log('Found', enGb.length, 'British/en-GB voices:', enGb.map(v => v.name + ' (' + v.lang + ')').join(', '));

    // 1. Try exact preferred voice matches (EXACT - case insensitive)
    for (const pref of VOICE_PREFERENCES) {
      const match = voices.find(v => (v.name || '').toLowerCase() === pref.toLowerCase());
      if (match) {
        console.log('✓ EXACT MATCH:', match.name, '(' + match.lang + ')');
        return match;
      }
    }

    // 2. Try case-insensitive contains match
    for (const pref of VOICE_PREFERENCES) {
      const match = voices.find(v => (v.name || '').toLowerCase().includes(pref.toLowerCase()));
      if (match) {
        console.log('✓ PARTIAL MATCH:', match.name, '(' + match.lang + ')');
        return match;
      }
    }

    // 3. Pick en-GB voice with female indicators
    if (enGb.length > 0) {
      const femaleIndicators = /female|woman|lady|girl|ms|mrs|sonia|libby|olivia|moira|victoria|fiona|ellen|samantha/i;
      const female = enGb.find(v => femaleIndicators.test(v.name || ''));
      if (female) {
        console.log('✓ EN-GB FEMALE:', female.name, '(' + female.lang + ')');
        return female;
      }
      // Just return first en-GB if no female match
      console.log('✓ EN-GB (no female):', enGb[0].name, '(' + enGb[0].lang + ')');
      return enGb[0];
    }

    // 4. Fallback: any English voice with female indicators
    const engFemale = voices.find(v => {
      const s = voiceStr(v);
      return /^en/i.test(v.lang || '') && /female|woman|lady|girl/i.test(v.name || '');
    });
    if (engFemale) {
      console.log('✓ EN FEMALE FALLBACK:', engFemale.name, '(' + engFemale.lang + ')');
      return engFemale;
    }

    // 5. Final fallback: any English voice
    const eng = voices.find(v => /^en/i.test(v.lang || ''));
    if (eng) {
      console.log('✓ EN FALLBACK:', eng.name, '(' + eng.lang + ')');
      return eng;
    }

    // 6. Ultimate fallback: first available voice
    console.log('✓ FIRST VOICE:', voices[0].name, '(' + voices[0].lang + ')');
    return voices[0];
  } catch (e) {
    console.warn('Voice selection error:', e);
    return null;
  }
}

// Debug function to show all available voices
function logAvailableVoices() {
  try {
    const voices = (typeof synth?.getVoices === 'function') ? synth.getVoices() : [];
    console.log('=== ALL AVAILABLE VOICES ===');
    voices.forEach((v, i) => {
      console.log(`${i}: "${v.name}" (lang: ${v.lang}) [default: ${v.default}]`);
    });
    console.log('=== END VOICES ===');
  } catch (e) {
    console.warn('Error logging voices:', e);
  }
}

function formatVoiceLabel(voice) {
  const parts = [voice.name || 'Unnamed voice', voice.lang || 'unknown'];
  parts.push(voice.localService === false ? 'online' : 'downloaded');
  return parts.join(' - ');
}

function isEnglishVoice(voice) {
  return /^en([-_]|$)/i.test(voice?.lang || '');
}

function isDownloadedVoice(voice) {
  return voice?.localService !== false;
}

function isGbEnglishVoice(voice) {
  return /^en[-_]GB$/i.test(voice?.lang || '');
}

function getVoiceBrowserProfile() {
  const ua = navigator.userAgent || '';
  if (/Edg\//i.test(ua)) return 'edge';
  if (/CriOS|Chrome/i.test(ua) && !/Edg\//i.test(ua)) return 'chrome';
  if (/Safari/i.test(ua) && !/CriOS|Chrome|Edg\//i.test(ua)) return 'safari';
  return 'default';
}

function isHumanPremiumEnglishVoice(voice) {
  if (!isEnglishVoice(voice) || !isDownloadedVoice(voice)) return false;

  const name = String(voice.name || '');
  const searchable = `${name} ${voice.voiceURI || ''}`.toLowerCase();

  // Browser speech APIs do not expose a reliable "premium" flag, so combine
  // downloaded/local service, English locale, premium-quality labels, and
  // known human Apple/Microsoft English voice names.
  const premiumIndicators = /premium|enhanced|natural|neural|siri|online \(natural\)/i;
  const knownHumanEnglishVoices = /arthur|daniel|fiona|kate|martha|moira|oliver|serena|susan|victoria|samantha|allison|ava|zoe|jamie|sonia|libby|olivia|zira/i;
  const nonHumanIndicators = /compact|novelty|eloquence|bells?|boing|bubbles|cellos?|deranged|fred|good news|bad news|hysterical|organ|princess|superstar|trinoids|whisper|zarvox/i;

  if (nonHumanIndicators.test(searchable)) return false;
  return isGbEnglishVoice(voice) || premiumIndicators.test(searchable) || knownHumanEnglishVoices.test(searchable);
}

function getDisplayableEnglishVoices(voices) {
  const list = voices || [];
  const profile = getVoiceBrowserProfile();

  if (profile === 'chrome') {
    const allowedChromeVoices = new Set([
      'google uk english female|en-gb',
      'google uk english male|en-gb',
      'google us english|en-us'
    ]);
    return list.filter((voice) => {
      const key = `${String(voice.name || '').toLowerCase()}|${String(voice.lang || '').toLowerCase()}`;
      return allowedChromeVoices.has(key);
    });
  }

  if (profile === 'safari') {
    const safariGbDownloadedPremium = list.filter((voice) => (
      isGbEnglishVoice(voice) &&
      isDownloadedVoice(voice) &&
      isHumanPremiumEnglishVoice(voice)
    ));
    if (safariGbDownloadedPremium.length) return safariGbDownloadedPremium;

    const safariGbHuman = list.filter((voice) => (
      isGbEnglishVoice(voice) &&
      isHumanPremiumEnglishVoice(voice)
    ));
    if (safariGbHuman.length) return safariGbHuman;

    return list.filter(isGbEnglishVoice);
  }

  if (profile === 'edge') {
    const edgeGbNatural = list.filter((voice) => {
      const searchable = `${voice.name || ''} ${voice.voiceURI || ''}`.toLowerCase();
      return isGbEnglishVoice(voice) && /microsoft/.test(searchable) && /natural/.test(searchable);
    });
    return edgeGbNatural.length ? edgeGbNatural : list.filter(isGbEnglishVoice);
  }

  return list.filter(isHumanPremiumEnglishVoice);
}

function sortVoicesForDisplay(voices) {
  return [...voices].sort((a, b) => {
    const aGb = isGbEnglishVoice(a) ? 0 : 1;
    const bGb = isGbEnglishVoice(b) ? 0 : 1;
    if (aGb !== bGb) return aGb - bGb;
    return formatVoiceLabel(a).localeCompare(formatVoiceLabel(b));
  });
}

function populateVoiceSelect() {
  if (!voiceSelect || typeof synth?.getVoices !== 'function') return;

  const voices = sortVoicesForDisplay(getDisplayableEnglishVoices(synth.getVoices() || []));
  const saved = localStorage.getItem(SELECTED_VOICE_KEY) || 'auto';
  voiceSelect.innerHTML = '';

  const autoOption = document.createElement('option');
  autoOption.value = 'auto';
  autoOption.textContent = voices.length ? 'Auto filtered English voice' : 'No matching English voice exposed';
  voiceSelect.appendChild(autoOption);

  voices.forEach((voice) => {
    const option = document.createElement('option');
    option.value = getVoiceKey(voice);
    option.textContent = formatVoiceLabel(voice);
    voiceSelect.appendChild(option);
  });

  voiceSelect.value = voices.some(v => getVoiceKey(v) === saved) ? saved : 'auto';
}

function initVoiceSelector() {
  if (!voiceSelect) return;

  populateVoiceSelect();
  voiceSelect.addEventListener('change', () => {
    localStorage.setItem(SELECTED_VOICE_KEY, voiceSelect.value || 'auto');
    const selected = getSelectedSpeechVoice();
    if (selected) {
      setSpeechFeedback(`Voice selected: ${selected.name}`);
    } else {
      setSpeechFeedback('Voice selected: Auto');
    }
  });

  if (synth) {
    if (typeof synth.addEventListener === 'function') {
      synth.addEventListener('voiceschanged', populateVoiceSelect);
    } else {
      synth.onvoiceschanged = populateVoiceSelect;
    }
  }

  setTimeout(populateVoiceSelect, 300);
  setTimeout(populateVoiceSelect, 1200);
}
const PROGRESS_KEY = 'englishAppProgress';
const IDENTITY_STORE_KEY = 'englishAppIdentityProfiles';
const ACTIVE_IDENTITY_KEY = 'englishAppActiveIdentity';
const USERNAME_KEY_FALLBACK = 'englishAppUsername';
const AUTO_CLOUD_SYNC_KEY = 'englishAppAutoCloudSync';
const EVENT_SECTION_COLLAPSED_KEY = 'englishAppEventSectionCollapsed';
const REPORT_ARCHIVE_KEY = 'englishAppMonthlyHtmlReports';
const MAX_REPORT_ARCHIVE = 80;
const CLOUD_SYNC_KEYS = [
  'englishAppProgress',
  'englishAppReview',
  'englishAppLeaderboard',
  'englishAppDaily',
  'englishAppDailyStreak',
  'englishAppCalendar',
  'englishAppEventProgress',
  'achievements',
  'perfectScores',
  'englishAppMonthlyHtmlReports',
  'englishAppIdentityProfiles',
  'englishAppActiveIdentity',
  'englishAppUsername'
];

// DOM Elements
const modeSelect = document.getElementById('modeSelect');
const levelSelect = document.getElementById('levelSelect');
const startBtn = document.getElementById('startBtn');
console.log('🔍 Start button found:', !!startBtn, startBtn);
if (startBtn) {
  console.log('🔍 Start button properties:', {
    disabled: startBtn.disabled,
    hidden: startBtn.classList.contains('hidden'),
    display: window.getComputedStyle(startBtn).display,
    visibility: window.getComputedStyle(startBtn).visibility,
    zIndex: window.getComputedStyle(startBtn).zIndex
  });
}
const progressSection = document.getElementById('progressSection');
const showProgressBtn = document.getElementById('showProgress');
const listenWordBtn = document.getElementById('listenWordBtn');
const voiceSelect = document.getElementById('voiceSelect');
const spellingInput = document.getElementById('spellingInput');
const submitSpelling = document.getElementById('submitSpelling');
const spellingResult = document.getElementById('spellingResult');
const resultMessage = document.getElementById('resultMessage');
const correctAnswer = document.getElementById('correctAnswer');
const correctSpelling = document.getElementById('correctSpelling');
const wordImage = document.getElementById('wordImage');
const usernameInputField = document.getElementById('usernameInput');
const birthdayInputField = document.getElementById('birthdayInput');
const birthdayVisibilityToggle = document.getElementById('birthdayVisibilityToggle');
const loadingMessage = document.getElementById('loadingMessage');
const cloudPullBtn = document.getElementById('cloudPullBtn');
const cloudPushBtn = document.getElementById('cloudPushBtn');
const autoCloudSyncChk = document.getElementById('autoCloudSyncChk');
const autoCloudSyncLabel = document.getElementById('autoCloudSyncLabel');
const reportMonthInput = document.getElementById('reportMonthInput');
const generateMonthlyReportBtn = document.getElementById('generateMonthlyReportBtn');
const openLatestReportBtn = document.getElementById('openLatestReportBtn');
const refreshReportHistoryBtn = document.getElementById('refreshReportHistoryBtn');
const openDashboardBtn = document.getElementById('openDashboardBtn');
const googleSignInContainer = document.getElementById('googleSignInContainer');
const googleSignOutBtn = document.getElementById('googleSignOutBtn');
const existingGoogleLoginBtn = document.getElementById('existingGoogleLoginBtn');
const registerProfileBtn = document.getElementById('registerProfileBtn');
const recoverNicknameBtn = document.getElementById('recoverNicknameBtn');
const authStatusHint = document.getElementById('authStatusHint');
const learningContent = document.getElementById('learningContent');
const identitySection = document.getElementById('identitySection');
const identityToggleBtn = document.getElementById('identityToggleBtn');
const eventSection = document.getElementById('eventSection');
const eventToggleBtn = document.getElementById('eventToggleBtn');
const topUserBar = document.getElementById('topUserBar');
const topUserName = document.getElementById('topUserName');
const topUserEmail = document.getElementById('topUserEmail');
const topUserLogoutBtn = document.getElementById('topUserLogoutBtn');
const cloudSyncPanel = document.querySelector('.cloud-sync-panel');

const backendAuthState = {
  backendEnabled: false,
  googleClientId: '',
  signedIn: false,
  user: null
};
let googleSignInInitialized = false;
let appAccessGranted = false;
let identitySectionCollapsed = false;
let eventSectionCollapsed = localStorage.getItem(EVENT_SECTION_COLLAPSED_KEY) === '1';

const EVENT_MARQUEE_THEMES = {
  easter: {
    themeKey: 'easter',
    durationSec: 16,
    items: [
      { emoji: '🥚', label: 'Egg Hunt' },
      { emoji: '🐰', label: 'Bunny Parade' },
      { emoji: '🌷', label: 'Spring Bloom' },
      { emoji: '🐣', label: 'Chick Surprise' },
      { emoji: '🍫', label: 'Chocolate Time' },
      { emoji: '🧺', label: 'Basket Joy' }
    ]
  },
  summer: {
    themeKey: 'summer',
    durationSec: 14,
    items: [
      { emoji: '☀️', label: 'Sunshine Vibes' },
      { emoji: '🏖️', label: 'Beach Adventure' },
      { emoji: '🍦', label: 'Ice Cream Break' },
      { emoji: '🏊', label: 'Swim Time' },
      { emoji: '🕶️', label: 'Cool Shades' },
      { emoji: '🏰', label: 'Sandcastle Fun' }
    ]
  },
  backToSchool: {
    themeKey: 'backtoschool',
    durationSec: 15,
    items: [
      { emoji: '🎒', label: 'Ready to Learn' },
      { emoji: '✏️', label: 'Pencil Power' },
      { emoji: '📓', label: 'Notebook Notes' },
      { emoji: '🏫', label: 'Classroom Time' },
      { emoji: '👩‍🏫', label: 'Teacher Tips' },
      { emoji: '🎓', label: 'Study Goals' }
    ]
  },
  halloween: {
    themeKey: 'halloween',
    durationSec: 13,
    items: [
      { emoji: '🎃', label: 'Pumpkin Parade' },
      { emoji: '👻', label: 'Ghostly Giggles' },
      { emoji: '🧙‍♀️', label: 'Witchy Magic' },
      { emoji: '🍬', label: 'Candy Rush' },
      { emoji: '🦇', label: 'Night Flight' },
      { emoji: '🌙', label: 'Spooky Night' }
    ]
  },
  christmas: {
    themeKey: 'christmas',
    durationSec: 18,
    items: [
      { emoji: '🎄', label: 'Holiday Cheer' },
      { emoji: '🎅', label: 'Santa Express' },
      { emoji: '🎁', label: 'Gift Time' },
      { emoji: '❄️', label: 'Snow Sparkle' },
      { emoji: '🔔', label: 'Jingle Bells' },
      { emoji: '🦌', label: 'Reindeer Run' }
    ]
  },
  spring: {
    themeKey: 'spring',
    durationSec: 16,
    items: [
      { emoji: '🌸', label: 'Bloom Season' },
      { emoji: '🦋', label: 'Butterfly Dance' },
      { emoji: '🌧️', label: 'Gentle Rain' },
      { emoji: '🌈', label: 'Rainbow Glow' },
      { emoji: '🌺', label: 'Garden Walk' },
      { emoji: '🌱', label: 'Fresh Start' }
    ]
  },
  thanksgiving: {
    themeKey: 'thanksgiving',
    durationSec: 17,
    items: [
      { emoji: '🦃', label: 'Turkey Feast' },
      { emoji: '🥧', label: 'Pie Delight' },
      { emoji: '🍽️', label: 'Family Dinner' },
      { emoji: '🙏', label: 'Give Thanks' },
      { emoji: '🍁', label: 'Autumn Warmth' },
      { emoji: '👨‍👩‍👧‍👦', label: 'Together Time' }
    ]
  },
  newyear: {
    themeKey: 'newyear',
    durationSec: 12,
    items: [
      { emoji: '🎆', label: 'Firework Show' },
      { emoji: '🥂', label: 'Midnight Toast' },
      { emoji: '🕛', label: 'Countdown' },
      { emoji: '🎊', label: 'Confetti Burst' },
      { emoji: '✨', label: 'Fresh Beginning' },
      { emoji: '🎯', label: 'New Goals' }
    ]
  },
  chinesenewyear: {
    themeKey: 'chinesenewyear',
    durationSec: 14,
    items: [
      { emoji: '🏮', label: 'Lantern Glow' },
      { emoji: '🐉', label: 'Dragon Dance' },
      { emoji: '🧧', label: 'Red Envelope' },
      { emoji: '🥟', label: 'Dumpling Joy' },
      { emoji: '🧨', label: 'Firecracker Pop' },
      { emoji: '🍀', label: 'Lucky Start' }
    ]
  },
  birthday: {
    themeKey: 'birthday',
    durationSec: 15,
    items: [
      { emoji: '🎂', label: 'Cake Time' },
      { emoji: '🎈', label: 'Balloon Party' },
      { emoji: '🎁', label: 'Gift Surprise' },
      { emoji: '⭐', label: 'Wish Moment' },
      { emoji: '🎉', label: 'Celebrate' },
      { emoji: '🕯️', label: 'Blow the Candles' }
    ]
  }
};

const EVENT_MARQUEE_PARTICLE_PRESETS = {
  easter: { emojis: ['🥚', '🐣', '🌸', '✨'], count: 14, minDur: 8, maxDur: 13 },
  summer: { emojis: ['☀️', '🌊', '🏖️', '✨'], count: 12, minDur: 7, maxDur: 11 },
  backtoschool: { emojis: ['✏️', '📘', '📚', '⭐'], count: 11, minDur: 8, maxDur: 12 },
  halloween: { emojis: ['🎃', '🦇', '👻', '✨'], count: 14, minDur: 6, maxDur: 10 },
  christmas: { emojis: ['❄️', '✨', '🎄', '🔔'], count: 16, minDur: 7, maxDur: 12 },
  spring: { emojis: ['🌸', '🦋', '🌿', '✨'], count: 13, minDur: 8, maxDur: 13 },
  thanksgiving: { emojis: ['🍁', '✨', '🦃', '🥧'], count: 12, minDur: 8, maxDur: 13 },
  newyear: { emojis: ['🎆', '🎇', '✨', '🎊'], count: 16, minDur: 6, maxDur: 10 },
  chinesenewyear: { emojis: ['🏮', '🧧', '✨', '🧨'], count: 15, minDur: 7, maxDur: 11 },
  birthday: { emojis: ['🎈', '✨', '🎉', '⭐'], count: 13, minDur: 7, maxDur: 12 },
  default: { emojis: ['✨', '⭐', '🎊'], count: 10, minDur: 8, maxDur: 13 }
};

function seededUnit(value) {
  const x = Math.sin(value) * 10000;
  return x - Math.floor(x);
}

function buildEventMarqueeParticles(themeKey, event) {
  const preset = EVENT_MARQUEE_PARTICLE_PRESETS[themeKey] || EVENT_MARQUEE_PARTICLE_PRESETS.default;
  const emojis = (preset.emojis && preset.emojis.length > 0)
    ? preset.emojis
    : (event.words || []).map(entry => entry?.emoji).filter(Boolean);
  const particleEmojis = emojis.length > 0 ? emojis : ['✨'];
  const count = Math.max(6, Number(preset.count || 10));
  const minDur = Number(preset.minDur || 8);
  const maxDur = Math.max(minDur + 0.5, Number(preset.maxDur || 13));
  const eventSeed = (event?.id || 'default').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

  const particles = [];
  for (let i = 0; i < count; i += 1) {
    const s1 = seededUnit(eventSeed + (i + 1) * 11.7);
    const s2 = seededUnit(eventSeed + (i + 1) * 19.3);
    const s3 = seededUnit(eventSeed + (i + 1) * 29.1);
    const s4 = seededUnit(eventSeed + (i + 1) * 37.9);
    const s5 = seededUnit(eventSeed + (i + 1) * 43.7);
    const s6 = seededUnit(eventSeed + (i + 1) * 53.2);

    const emoji = particleEmojis[Math.floor(s1 * particleEmojis.length)] || '✨';
    const x = (2 + s2 * 96).toFixed(2);
    const drift = (-24 + s3 * 48).toFixed(1);
    const size = (0.72 + s4 * 0.88).toFixed(2);
    const duration = (minDur + s5 * (maxDur - minDur)).toFixed(2);
    const delay = (-(s6 * Number(duration))).toFixed(2);

    particles.push(`
      <span class="event-marquee-particle" style="--x:${x}%;--drift:${drift}px;--particle-size:${size};--particle-duration:${duration}s;--particle-delay:${delay}s;">${escapeHtml(emoji)}</span>
    `);
  }

  return particles.join('');
}

// Initialize button state
startBtn.disabled = true;
loadingMessage.style.display = 'inline';


// Progress tracking
function getProgress() {
  const saved = localStorage.getItem(PROGRESS_KEY);
  return saved ? JSON.parse(saved) : {};
}

function setSpeechFeedback(message, isError = false) {
  if (!feedbackEl) return;
  feedbackEl.textContent = message || '';
  feedbackEl.className = isError ? 'feedback bad' : 'feedback';
}

function selectReliableSpeechVoice() {
  const voices = (typeof window.speechSynthesis?.getVoices === 'function')
    ? window.speechSynthesis.getVoices()
    : [];
  if (!voices || voices.length === 0) return null;

  const selectedVoice = getSelectedSpeechVoice(voices);
  if (selectedVoice) return selectedVoice;

  const englishVoices = voices.filter(v => /^en[-_]/i.test(v.lang || ''));
  const localEnglish = englishVoices.filter(v => v.localService !== false);
  const candidates = localEnglish.length ? localEnglish : englishVoices;

  return (
    candidates.find(v => /en[-_]gb/i.test(v.lang || '')) ||
    candidates.find(v => /united kingdom|british|uk/i.test(v.name || '')) ||
    candidates.find(v => /en[-_]us/i.test(v.lang || '')) ||
    candidates[0] ||
    null
  );
}

// Listen and spell functionality
let speechAttemptId = 0;
let currentWordAudio = null;

function buildRemoteSpeechUrls(text) {
  const q = encodeURIComponent(text);
  return [
    `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en-GB&q=${q}`,
    `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en-US&q=${q}`
  ];
}

function playRemoteWordAudio(text, attemptId, onFallback = null) {
  const urls = buildRemoteSpeechUrls(text);
  let urlIndex = 0;

  const tryNext = () => {
    if (speechAttemptId !== attemptId) return;

    if (urlIndex >= urls.length) {
      if (typeof onFallback === 'function') {
        onFallback();
      } else {
        setSpeechFeedback('Audio playback failed (remote-audio-failed). Please try Chrome or check browser audio permissions.', true);
      }
      return;
    }

    try {
      if (currentWordAudio) {
        currentWordAudio.pause();
        currentWordAudio.removeAttribute('src');
        currentWordAudio.load();
      }
    } catch {}

    const audio = new Audio(urls[urlIndex]);
    currentWordAudio = audio;
    urlIndex += 1;
    audio.preload = 'auto';
    audio.volume = 1;

    audio.onplaying = () => {
      if (speechAttemptId === attemptId) setSpeechFeedback(`Playing: ${text}`);
    };
    audio.onended = () => {
      if (speechAttemptId === attemptId && !hasAnsweredCurrentQuestion) {
        setTimeout(() => {
          if (speechAttemptId === attemptId && !hasAnsweredCurrentQuestion) setSpeechFeedback('');
        }, 350);
      }
    };
    audio.onerror = () => {
      console.warn('Remote word audio failed, trying next source');
      tryNext();
    };

    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch((error) => {
        console.warn('Remote word audio play rejected:', error);
        tryNext();
      });
    }
  };

  tryNext();
}

function speakWord(word) {
  const text = String(word || '').trim();
  if (!text) {
    console.warn('No word available to speak');
    setSpeechFeedback('No word is ready to play yet.', true);
    return;
  }

  const speech = window.speechSynthesis;
  if (!speech || typeof SpeechSynthesisUtterance !== 'function') {
    console.error('Speech synthesis not supported in this browser');
    setSpeechFeedback('This browser does not support word audio playback.', true);
    return;
  }

  const attemptId = ++speechAttemptId;
  // Enhanced settings for iPad/iPhone with human-like British female voice
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isMobile = /Mobile|Android|iPhone|iPad/.test(navigator.userAgent);
  const ignoredSpeechErrors = new Set(['interrupted', 'canceled']);

  const buildUtterance = (voice = null) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-GB';
    if (voice) utterance.voice = voice;

    // Optimized for human-like, steady and gentle speech on mobile devices
    if (isIOS) {
      utterance.rate = 0.75;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
    } else if (isMobile) {
      utterance.rate = 0.8;
      utterance.pitch = 1.05;
      utterance.volume = 1.0;
    } else {
      utterance.rate = 0.85;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
    }
    return utterance;
  };

  const speakUtterance = (voice = null, allowDefaultFallback = true) => {
    const utterance = buildUtterance(voice);
    let didStart = false;

    utterance.onstart = () => {
      didStart = true;
      if (speechAttemptId === attemptId) setSpeechFeedback(`Playing: ${text}`);
    };
    utterance.onend = () => {
      if (speechAttemptId === attemptId && !hasAnsweredCurrentQuestion) {
        setTimeout(() => {
          if (speechAttemptId === attemptId && !hasAnsweredCurrentQuestion) setSpeechFeedback('');
        }, 350);
      }
    };
    utterance.onerror = (event) => {
      const code = event?.error || 'unknown';
      if (speechAttemptId !== attemptId) return;

      if (ignoredSpeechErrors.has(code)) {
        console.warn('Speech synthesis was interrupted by a newer playback request:', code);
        return;
      }

      console.error('Speech synthesis error:', code, event);
      if (allowDefaultFallback && voice) {
        console.warn('Retrying speech with browser default voice after voice error:', code);
        setSpeechFeedback('Selected voice failed. Trying browser default voice...');
        speakUtterance(null, false);
        return;
      }

      setSpeechFeedback(`Audio playback failed (${code}). Please choose another English voice or check browser speech settings.`, true);
    };

    try {
      if (speech.speaking || speech.pending) speech.cancel();
    } catch {}

    try { speech.resume(); } catch {}

    try {
      speech.speak(utterance);
      setTimeout(() => {
        if (speechAttemptId === attemptId && !didStart && !speech.speaking) {
          setSpeechFeedback('Audio did not start. Please check browser sound, tab mute, and system speech settings.', true);
        }
      }, 1200);
    } catch (error) {
      console.error('Speech synthesis failed:', error);
      setSpeechFeedback('Audio playback failed. Please try another browser or check system speech settings.', true);
    }
  };

  // Keep speech inside the user's click/tap activation. If voices are not ready,
  // speak immediately with the system default voice instead of delaying playback.
  const voicesNow = (typeof synth?.getVoices === 'function') ? synth.getVoices() : [];
  if (!voicesNow || voicesNow.length === 0) console.warn('Voices not loaded yet, using system default voice');
  const voice = selectReliableSpeechVoice();
  if (voice) console.log('Speaking with voice:', voice.name, '(' + voice.lang + ')');
  else console.warn('No reliable speech voice found, using browser default');

  speakUtterance(voice, true);
}

// ---------- Phonics analysis (Consonant/Vowel rules) ----------
const VOWELS = ['a', 'e', 'i', 'o', 'u'];

function isLetter(ch){ return /[a-z]/i.test(ch); }
function isVowelAt(word, i){
  const ch = word[i].toLowerCase();
  if (!isLetter(ch)) return false;
  if (VOWELS.includes(ch)) return true;
  // treat 'y' as vowel when not the first letter and followed by a consonant
  if (ch === 'y') {
    if (i > 0) {
      const next = word[i+1]?.toLowerCase() || '';
      return next && (!isLetter(next) || !VOWELS.includes(next));
    }
  }
  return false;
}

function buildCVPattern(word){
  const letters = word.replace(/[^a-z]/gi, '').toLowerCase();
  let pattern = '';
  for (let i = 0; i < letters.length; i++) {
    pattern += isVowelAt(letters, i) ? 'V' : 'C';
  }
  // Detect magic-e (CVCe, CVCE, etc.)
  if (/e$/i.test(letters) && /[aeiouy]/i.test(letters.slice(0, -1))) {
    // mark as trailing 'e' indicator
    pattern += ' (e)';
  }
  return pattern;
}

function detectPhonicsRule(word, pattern){
  const w = word.toLowerCase();
  const letters = w.replace(/[^a-z]/g, '');
  const hasSilentE = letters.endsWith('e') && /[aeiouy]/.test(letters.slice(0, -1)) && /[^aeiouy]e$/i.test(letters);
  if (hasSilentE) {
    // find vowel before the final consonant-e
    const core = letters.slice(0, -1); // drop e
    const vowel = core.split('').reverse().find(ch => /[aeiou]/.test(ch)) || 'vowel';
    return `Magic e: final 'e' makes the ${vowel.toUpperCase()} long (e.g., a_e in "cake").`;
  }
  // Vowel teams
  if (/aa|ee|ea|ai|ay|oa|oe|ie|ee|oo|ue/.test(letters)) {
    return 'Vowel team: two vowels together often make a long vowel sound (e.g., ai, ea, oa).';
  }
  // Open syllable CV
  if (/^CV$/.test(pattern)) {
    return 'Open syllable (CV): the vowel is usually long (e.g., "me", "go").';
  }
  // Simple CVC
  if (/^CVC$/.test(pattern)) {
    return 'Closed syllable (CVC): the vowel is usually short (e.g., "cat", "dog").';
  }
  // Blends at start/end
  if (/^CCVC|CVCC/.test(pattern)) {
    return 'Consonant blend: read the blend together, short vowel in the middle (e.g., "stop", "milk").';
  }
  return 'Sound it out: read the consonant(s), then the vowel, then the ending.';
}

function chunkForSounding(word){
  const letters = word.toLowerCase();
  // Split by vowel groups to approximate onset-rime chunks
  const chunks = [];
  let i = 0;
  while (i < letters.length) {
    // onset (consonants)
    let onset = '';
    while (i < letters.length && !/[aeiouy]/.test(letters[i])) { onset += letters[i]; i++; }
    // nucleus (vowel group)
    let nucleus = '';
    while (i < letters.length && /[aeiouy]/.test(letters[i])) { nucleus += letters[i]; i++; }
    // coda (following consonants but stop before next vowel)
    let coda = '';
    while (i < letters.length && !/[aeiouy]/.test(letters[i])) {
      // keep final 'e' out of chunk if magic-e
      if (i === letters.length - 1 && letters[i] === 'e' && /[aeiou]/.test(nucleus)) break;
      coda += letters[i]; i++;
    }
    const chunk = (onset + nucleus + coda).trim();
    if (chunk) chunks.push(chunk);
  }
  // Add final silent e as note
  if (/[^aeiou]e$/i.test(letters)) {
    chunks.push('(silent e)');
  }
  return chunks.length ? chunks : [word];
}

function speakSoundOut(word){
  const chunks = chunkForSounding(word);
  let i = 0;
  
  // Enhanced settings for steady, gentle phonics pronunciation on iPad/iPhone
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isMobile = /Mobile|Android|iPhone|iPad/.test(navigator.userAgent);
  
  const speakNext = () => {
    if (i >= chunks.length) { setTimeout(() => speakWord(word), 400); return; }
    
    const u = new SpeechSynthesisUtterance(chunks[i].replace(/[()]/g,''));
    u.lang = 'en-GB';
    
    // Optimized phonics settings for human-like, steady pronunciation
    if (isIOS) {
      u.rate = 0.65;      // Very steady and deliberate for iOS phonics
      u.pitch = 0.95;     // Slightly lower, more natural pitch for phonics
      u.volume = 0.85;    // Gentle volume for iOS
    } else if (isMobile) {
      u.rate = 0.7;       // Steady pace for Android phonics
      u.pitch = 1.0;      // Natural pitch for phonics
      u.volume = 0.9;     // Clear but gentle volume
    } else {
      u.rate = 0.75;      // Desktop phonics pace
      u.pitch = 1.05;     // Desktop phonics pitch
      u.volume = 0.95;    // Desktop phonics volume
    }
    
    const v = pickBritishFemaleVoice();
    if (v) u.voice = v;
    
    u.onend = () => { 
      i++; 
      // Longer pause between phonics chunks for better learning
      const pauseTime = isIOS ? 150 : (isMobile ? 120 : 100);
      setTimeout(speakNext, pauseTime); 
    };
    
    try { synth.speak(u); } catch { /* ignore */ }
  };
  
  try { synth.cancel(); } catch {}
  speakNext();
}

function analyzePhonics(word){
  const pattern = buildCVPattern(word);
  const tip = detectPhonicsRule(word, pattern);
  const chunks = chunkForSounding(word);
  return { pattern, tip, chunks };
}

function ensurePhonicsHelper(wordObj, container){
  let panel = document.getElementById('phonicsHelper');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'phonicsHelper';
    panel.style.marginTop = '8px';
    panel.style.padding = '8px 12px';
    panel.style.border = '1px solid #e0e0e0';
    panel.style.borderRadius = '8px';
    panel.style.background = '#fafafa';
    container.appendChild(panel);
  }
  const word = wordObj.word;
  const emoji = wordObj.emoji;
  const { pattern, tip, chunks } = analyzePhonics(word);
  const chunkText = chunks.join(' · ');
  panel.innerHTML = `
    <div style="font-weight:600; margin-bottom:6px;">Phonics helper</div>
    <div style="margin:2px 0; font-size:24px;">${emoji}</div>
    <div style="margin:2px 0;">Pattern: <code>${pattern}</code></div>
    <div style="margin:2px 0;">How to read: ${chunkText}</div>
    <div style="margin:2px 0; color:#555;">Tip: ${tip}</div>
    <button id="soundItOutBtn" class="btn" style="margin-top:6px;">🔊 Sound it out</button>
  `;
  const btn = panel.querySelector('#soundItOutBtn');
  btn.onclick = () => speakSoundOut(word);
}

function buildQuestionKey(mode, current) {
  const phase = session.isReview ? 'review' : 'learn';
  const word = current?.word || 'unknown';
  return `${phase}|${mode}|${session.index}|${word}`;
}

function checkSpelling() {
  if (hasAnsweredCurrentQuestion) return;

  const userInput = spellingInput.value.trim().toLowerCase();
  if (!userInput) return;

  hasAnsweredCurrentQuestion = true;
  spellingInput.disabled = true;
  submitSpelling.disabled = true;

  const current = session.words[session.index];
  const correct = userInput === current.word.toLowerCase();
  
  spellingResult.classList.remove('hidden');
  spellingResult.classList.remove('correct', 'wrong');
  spellingResult.classList.add(correct ? 'correct' : 'wrong');
  
  if (correct) {
    resultMessage.textContent = "✓ Correct! Well done!";
    correctAnswer.classList.add('hidden');
    session.score++;
    updateChallengesForAction('word_complete');
    if (!session.isReview) {
      updateChallengesForAction('perfect_spell');
    }
  } else {
    resultMessage.textContent = "✗ Not quite right. Let's see the correct answer:";
    correctAnswer.classList.remove('hidden');
    correctSpelling.textContent = current.word;
    wordImage.innerHTML = `<div class="word-emoji">${current.emoji}</div>`;
  }

  if (session.isReview && correct) {
    updateChallengesForAction('review_complete');
  }

  // Persist learn/review outcome so review lists and future analytics have data.
  if (typeof saveForReview === 'function') {
    saveForReview(current, correct, {
      mode: 'spelling',
      phase: session.isReview ? 'review' : 'learn',
      questionKey: currentQuestionKey
    });
  }
  
  nextBtn.classList.remove('hidden');
  restartBtn.classList.remove('hidden');
  scoreEl.classList.remove('hidden');
  scoreEl.textContent = `Score: ${session.score}`;
}

// Add event listeners for spelling practice (removed duplicates)
spellingInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    checkSpelling();
  }
});

function updateProgress(level, category, correct, total) {
  const progress = getProgress();
  if (!progress[level]) progress[level] = {};
  if (!progress[level][category]) progress[level][category] = { correct: 0, total: 0 };
  
  progress[level][category].correct += correct;
  progress[level][category].total += total;
  
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  displayProgress();
}

function displayProgress() {
  const progress = getProgress();
  const cards = document.querySelectorAll('.progress-card');
  
  // Update progress cards
  cards.forEach(card => {
    const level = card.dataset.level;
    const details = card.querySelector('.progress-details');
    details.innerHTML = '';
    
    if (progress[level]) {
      Object.entries(progress[level]).forEach(([category, stats]) => {
        const percent = Math.round((stats.correct / stats.total) * 100) || 0;
        const emoji = getCategoryEmoji(category);
        const totalInCategory = (vocab[level] && Array.isArray(vocab[level][category])) ? vocab[level][category].length : 0;
        const label = `${prettyCategoryLabel(category)} (${totalInCategory})`;
        details.innerHTML += `
          <div class="progress-category">
            <span class="category-emoji">${emoji}</span>
            <span>${label}: ${stats.correct}/${stats.total}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-bar-fill" style="width: ${percent}%"></div>
          </div>
        `;
      });
    }
  });

  // Update achievements grid
  const achievementsGrid = document.getElementById('achievementsGrid');
  achievementsGrid.innerHTML = '';
  
  // Safely get earned achievements and ACHIEVEMENTS list (these may be in achievements.js)
  const earned = (typeof getEarnedAchievements === 'function') ? getEarnedAchievements() : [];

  // Display all achievements (earned and locked) if ACHIEVEMENTS is available
  if (typeof ACHIEVEMENTS !== 'undefined' && Object.values(ACHIEVEMENTS).flat) {
    Object.values(ACHIEVEMENTS).flat().forEach(achievement => {
      const isEarned = earned.includes(achievement.id);
      achievementsGrid.innerHTML += `
        <div class="achievement-card ${isEarned ? '' : 'locked'}">
          <div class="achievement-emoji">${achievement.emoji}</div>
          <div class="achievement-title">${achievement.title}</div>
          <div class="achievement-desc">${achievement.description}</div>
        </div>
      `;
    });
  }

  renderReportHistoryList();
}

function currentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatDateTime(value) {
  const ts = new Date(value);
  if (Number.isNaN(ts.getTime())) return String(value || '');
  return ts.toLocaleString();
}

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function loadReportArchive() {
  try {
    const raw = localStorage.getItem(REPORT_ARCHIVE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(item => item && typeof item === 'object' && item.id && item.month && item.createdAt && item.html)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, MAX_REPORT_ARCHIVE);
  } catch {
    return [];
  }
}

function saveReportArchive(list) {
  const safe = Array.isArray(list) ? list.slice(0, MAX_REPORT_ARCHIVE) : [];
  localStorage.setItem(REPORT_ARCHIVE_KEY, JSON.stringify(safe));
}

function buildProgressSummary(progress) {
  const levels = {};
  let totalQuestions = 0;
  let totalCorrect = 0;

  Object.entries(progress || {}).forEach(([level, categories]) => {
    if (!categories || typeof categories !== 'object') return;
    levels[level] = [];

    Object.entries(categories).forEach(([category, stats]) => {
      const correct = Number(stats?.correct || 0);
      const total = Number(stats?.total || 0);
      totalQuestions += total;
      totalCorrect += correct;
      levels[level].push({ category, correct, total, accuracy: total ? (correct / total) : 0 });
    });
  });

  return {
    totalQuestions,
    totalCorrect,
    totalAccuracy: totalQuestions ? (totalCorrect / totalQuestions) : 0,
    levels
  };
}

function buildProgressRowsHtml(summary) {
  const blocks = [];
  Object.entries(summary.levels || {}).forEach(([level, rows]) => {
    if (!Array.isArray(rows) || rows.length === 0) return;
    const rowHtml = rows.map((row) => {
      const pct = Math.round((row.accuracy || 0) * 100);
      return `<tr><td>${escapeHtml(prettyCategoryLabel(row.category))}</td><td>${row.correct}/${row.total}</td><td>${pct}%</td></tr>`;
    }).join('');
    blocks.push(`
      <h3>${escapeHtml(level.toUpperCase())}</h3>
      <table>
        <thead><tr><th>Category</th><th>Score</th><th>Accuracy</th></tr></thead>
        <tbody>${rowHtml}</tbody>
      </table>
    `);
  });

  return blocks.length > 0 ? blocks.join('') : '<p>No progress data yet.</p>';
}

function collectMonthlyReportData(yearMonth) {
  const month = yearMonth || currentYearMonth();
  const monthly = (typeof getMonthlyReviewSummary === 'function')
    ? getMonthlyReviewSummary(month)
    : { month, attempts: 0, correct: 0, accuracy: 0, uniqueWords: 0, completedCycles: 0 };
  const reviewStats = (typeof getReviewStats === 'function')
    ? getReviewStats()
    : { total: 0, needsReview: 0, mastered: 0, cycleCompleted: 0 };
  const streak = (typeof getDailyStreak === 'function')
    ? getDailyStreak()
    : { current: 0, best: 0 };
  const progressSummary = buildProgressSummary(getProgress());
  const nickname = getCloudNickname();

  return {
    month,
    nickname,
    monthly,
    reviewStats,
    streak,
    progressSummary
  };
}

function createMonthlyReportHtml(report) {
  const m = report.monthly || {};
  const r = report.reviewStats || {};
  const p = report.progressSummary || {};
  const s = report.streak || {};

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>English Learning Monthly Report ${escapeHtml(report.month)}</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; margin: 24px; background: #f4f9ff; color: #1f2f46; }
    .wrap { max-width: 980px; margin: 0 auto; background: #fff; border: 1px solid #d8e8ff; border-radius: 12px; padding: 20px; }
    h1 { margin: 0 0 6px; }
    .sub { color: #4f6380; margin-bottom: 16px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 10px; margin-bottom: 16px; }
    .card { background: #f8fcff; border: 1px solid #d8e8ff; border-radius: 8px; padding: 10px; }
    .v { font-size: 1.3rem; font-weight: 700; color: #1d3f72; }
    .k { font-size: 0.85rem; color: #5a708f; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0 16px; }
    th, td { border: 1px solid #e5eefc; padding: 8px; text-align: left; }
    th { background: #f2f8ff; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>Monthly Learning Report</h1>
    <div class="sub">Month: ${escapeHtml(report.month)} | Student: ${escapeHtml(report.nickname)} | Generated: ${escapeHtml(formatDateTime(report.createdAt))}</div>
    <div class="grid">
      <div class="card"><div class="v">${m.attempts || 0}</div><div class="k">Monthly Attempts</div></div>
      <div class="card"><div class="v">${m.correct || 0}</div><div class="k">Monthly Correct</div></div>
      <div class="card"><div class="v">${Math.round((m.accuracy || 0) * 100)}%</div><div class="k">Monthly Accuracy</div></div>
      <div class="card"><div class="v">${m.uniqueWords || 0}</div><div class="k">Monthly Unique Words</div></div>
      <div class="card"><div class="v">${m.completedCycles || 0}</div><div class="k">Monthly Completed Cycles</div></div>
      <div class="card"><div class="v">${r.total || 0}</div><div class="k">All Review Words</div></div>
      <div class="card"><div class="v">${r.needsReview || 0}</div><div class="k">Need Review</div></div>
      <div class="card"><div class="v">${r.mastered || 0}</div><div class="k">Mastered</div></div>
      <div class="card"><div class="v">${Math.round((p.totalAccuracy || 0) * 100)}%</div><div class="k">All-Time Progress Accuracy</div></div>
      <div class="card"><div class="v">${s.current || 0}</div><div class="k">Current Daily Streak</div></div>
      <div class="card"><div class="v">${s.best || 0}</div><div class="k">Best Daily Streak</div></div>
    </div>
    <h2>Progress by Level and Category</h2>
    ${buildProgressRowsHtml(p)}
  </div>
</body>
</html>`;
}

function openReportSnapshot(record, asDownload = false) {
  if (!record || !record.html) return;
  const blob = new Blob([record.html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  if (asDownload) {
    const a = document.createElement('a');
    const stamp = record.createdAt.replace(/[:.]/g, '-');
    a.href = url;
    a.download = `english-learning-report-${record.month}-${stamp}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } else {
    window.open(url, '_blank', 'noopener');
  }

  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function renderReportHistoryList() {
  const container = document.getElementById('reportHistoryList');
  if (!container) return;

  const archive = loadReportArchive();
  const filterMonth = (reportMonthInput?.value || '').trim();
  const visible = filterMonth ? archive.filter(item => item.month === filterMonth) : archive;

  if (visible.length === 0) {
    container.innerHTML = '<div class="report-history-empty">No report snapshots yet for this month.</div>';
    return;
  }

  container.innerHTML = visible.map((item) => {
    const attempts = item?.monthly?.attempts ?? item?.summary?.attempts ?? 0;
    const accuracy = Math.round(((item?.monthly?.accuracy ?? item?.summary?.accuracy ?? 0) * 100));
    return `
      <div class="report-history-item" data-report-id="${escapeHtml(item.id)}">
        <div class="report-history-meta">
          <div><strong>${escapeHtml(item.month)}</strong> | ${escapeHtml(formatDateTime(item.createdAt))}</div>
          <div>Attempts: ${attempts} | Accuracy: ${accuracy}%</div>
        </div>
        <div class="report-history-actions">
          <button class="secondary-action-btn report-open-btn" data-report-id="${escapeHtml(item.id)}">Open</button>
          <button class="secondary-action-btn report-download-btn" data-report-id="${escapeHtml(item.id)}">Download</button>
          <button class="secondary-action-btn report-delete-btn" data-report-id="${escapeHtml(item.id)}">Delete</button>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.report-open-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-report-id');
      const record = loadReportArchive().find(item => item.id === id);
      if (record) openReportSnapshot(record, false);
    });
  });

  container.querySelectorAll('.report-download-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-report-id');
      const record = loadReportArchive().find(item => item.id === id);
      if (record) openReportSnapshot(record, true);
    });
  });

  container.querySelectorAll('.report-delete-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-report-id');
      const archiveNow = loadReportArchive();
      const next = archiveNow.filter(item => item.id !== id);
      saveReportArchive(next);
      renderReportHistoryList();
    });
  });
}

function generateMonthlyReportSnapshot(targetMonth, autoOpen = true) {
  const month = (targetMonth || reportMonthInput?.value || currentYearMonth()).trim();
  if (!/^\d{4}-\d{2}$/.test(month)) {
    if (typeof showNotification === 'function') showNotification('⚠️ Invalid Month', 'Please pick a valid month first.');
    return null;
  }

  const data = collectMonthlyReportData(month);
  const record = {
    id: `${month}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    month,
    createdAt: new Date().toISOString(),
    nickname: data.nickname,
    monthly: data.monthly,
    summary: {
      attempts: data.monthly.attempts,
      correct: data.monthly.correct,
      accuracy: data.monthly.accuracy,
      uniqueWords: data.monthly.uniqueWords,
      completedCycles: data.monthly.completedCycles
    },
    reviewStats: data.reviewStats,
    streak: data.streak,
    progressSummary: data.progressSummary,
    html: ''
  };

  record.html = createMonthlyReportHtml(record);

  const archive = loadReportArchive();
  archive.unshift(record);
  saveReportArchive(archive.slice(0, MAX_REPORT_ARCHIVE));
  renderReportHistoryList();

  if (autoOpen) openReportSnapshot(record, false);
  if (typeof showNotification === 'function') {
    showNotification('📄 Monthly Report Saved', `${month} snapshot saved.`);
  }

  return record;
}

function openLatestReportForSelectedMonth() {
  const month = (reportMonthInput?.value || '').trim();
  const archive = loadReportArchive();
  const filtered = month ? archive.filter(item => item.month === month) : archive;
  if (filtered.length === 0) {
    if (typeof showNotification === 'function') showNotification('ℹ️ No Report', 'No snapshot found for selected month.');
    return;
  }
  openReportSnapshot(filtered[0], false);
}

function getCategoryEmoji(category) {
  const emojis = {
    // Cambridge-style categories
    animals: '🐾',
    the_body_and_the_face: '👤',
    clothes: '👕',
    colours: '🎨', // British spelling
    colors: '🎨',  // fallback if US spelling appears
    family_and_friends: '👨‍👩‍👧‍👦',
    food_and_drink: '🍽️',
    the_home: '🏡',
    materials: '🧱',
    names: '✨',
    numbers: '🔢',
    places_and_directions: '📍',
    school: '🏫',
    sports_and_leisure: '⚽',
    time: '⏰',
    toys: '🧸',
    transport: '🚗',
    weather: '⛅',
    work: '💼',
    the_world_around_us: '🌍',
    health: '🏥',
    // Legacy/custom categories used elsewhere in the UI
    nouns: '📚',
    actions: '🏃',
    descriptions: '✨'
  };
  return emojis[category] || '🔖';
}

// Already defined above
const exercise = document.getElementById('exercise');
const promptEl = document.getElementById('prompt');
const spellingArea = document.getElementById('spellingArea');
const meaningArea = document.getElementById('meaningArea');
const phonicsArea = document.getElementById('phonicsArea');
const phonicsWordDisplay = document.getElementById('phonicsWordDisplay');
const phonicsPronounceBtn = document.getElementById('phonicsPronounceBtn');
const choicesEl = document.getElementById('choices');
const feedbackEl = document.getElementById('feedback');
const nextBtn = document.getElementById('nextBtn');
const restartBtn = document.getElementById('restartBtn');
const progressEl = document.getElementById('progress');
const scoreEl = document.getElementById('score');

async function loadVocab(){
  try {
    loadingMessage.textContent = 'Loading vocabulary...';
    const res = await fetch('vocab.json');
    vocab = await res.json();
    
    console.log('✓ Vocabulary loaded successfully');
    console.log('  Starters categories:', Object.keys(vocab.starters || {}).length);
    console.log('  Movers categories:', Object.keys(vocab.movers || {}).length);
    console.log('  Flyers categories:', Object.keys(vocab.flyers || {}).length);
    
    // Enable start only after auth gate is completed.
    startBtn.disabled = !appAccessGranted;
    loadingMessage.style.display = 'none';
    
    // Populate categories for the initially selected level
    try {
      updateCategoryOptions(levelSelect.value);
      console.log('✓ Categories populated for level:', levelSelect.value);
    } catch (e) {
      console.warn('Failed to populate categories:', e);
    }
    
    // Setup level change listener AFTER vocab is loaded
    if (levelSelect) {
      const handleLevelChange = (e) => {
        const newLevel = e.target.value;
        console.log('🔄 Level changed to:', newLevel);
        console.log('📋 Available vocab levels:', Object.keys(vocab));
        console.log('🔍 Vocab exists for this level?', vocab[newLevel] ? 'YES' : 'NO');
        if (vocab[newLevel]) {
          console.log('📦 Categories in this level:', Object.keys(vocab[newLevel]));
        }
        updateCategoryOptions(newLevel);
      };
      
      // Remove any existing listeners first
      levelSelect.removeEventListener('change', handleLevelChange);
      levelSelect.removeEventListener('input', handleLevelChange);
      
      // Add new listeners
      levelSelect.addEventListener('change', handleLevelChange);
      levelSelect.addEventListener('input', handleLevelChange);
      
      console.log('✓ Level change listener added inside loadVocab()');
    }

    updateReviewCountDisplay();
  } catch(e) {
    loadingMessage.textContent = 'Failed to load vocabulary. Please refresh the page.';
    loadingMessage.style.color = '#f44336';
    console.error('✗ Failed to load vocabulary:', e);
    startBtn.disabled = true;
  }
}

function updateReviewCountDisplay() {
  try {
    const stats = (typeof getReviewStats === 'function')
      ? getReviewStats()
      : { needsReview: 0, mastered: 0, cycleCompleted: 0 };
    document.getElementById('reviewCount').textContent = stats.needsReview;
    document.getElementById('masteredCount').textContent = stats.mastered;
    const cycleCountEl = document.getElementById('cycleCount');
    if (cycleCountEl) cycleCountEl.textContent = stats.cycleCompleted;
  } catch(e) {
    console.warn('updateReviewCountDisplay error:', e);
    document.getElementById('reviewCount').textContent = 0;
    document.getElementById('masteredCount').textContent = 0;
    const cycleCountEl = document.getElementById('cycleCount');
    if (cycleCountEl) cycleCountEl.textContent = 0;
  }
}

function showAchievementNotification(achievement) {
  const notif = document.getElementById('achievementNotif');
  notif.querySelector('.achievement-emoji').textContent = achievement.emoji;
  notif.querySelector('.achievement-title').textContent = achievement.title;
  notif.classList.remove('hidden');
  setTimeout(() => notif.classList.add('hidden'), 3000);
}

function shuffle(a){
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]
  }
}

function startSession(){
  console.log('startSession called');
  
  // Make exercise section visible
  exercise.classList.remove('hidden');
  
  const mode = document.getElementById('practiceMode').value;
  let wordList;
  
  if (mode === 'review') {
    if (typeof getWordsForReview !== 'function') {
      promptEl.textContent = 'Review mode not available. Please use Learn mode.';
      console.error('getWordsForReview function not found');
      return;
    }
    wordList = getWordsForReview();
    if (wordList.length === 0) {
      promptEl.textContent = 'No words to review yet! Try learning some new words first.';
      return;
    }
    session = {
      words: wordList,
      index: 0,
      score: 0,
      isReview: true
    };
  } else {
    const level = levelSelect.value;
    let category = document.getElementById('categorySelect').value;
    
    console.log('Level:', level, 'Category:', category);
    console.log('Vocab available:', !!vocab[level]);
    console.log('Category available:', vocab[level] ? !!vocab[level][category] : false);
    
    // If the selected category no longer exists for this level, switch to the first available
    if (vocab[level] && !vocab[level][category]) {
      const cats = Object.keys(vocab[level]);
      console.log('Category not found, available categories:', cats);
      if (cats.length > 0) {
        category = cats[0];
        document.getElementById('categorySelect').value = category;
        console.log('Switched to first available category:', category);
      }
    }

    if (!vocab[level] || !vocab[level][category]) {
      console.error('Failed to find words:', { level, category, hasLevel: !!vocab[level], hasCategory: vocab[level] ? !!vocab[level][category] : false });
      promptEl.textContent = `No words available for ${category} in ${level} level`;
      return;
    }
    
    console.log('Found words:', vocab[level][category].length);
    wordList = vocab[level][category].slice();
    shuffle(wordList);
    session = {
      words: wordList,
      index: 0,
      score: 0,
      level: level,
      category: category,
      isReview: false
    };
  }
  exercise.classList.remove('hidden');
  
  // Enhanced iPhone auto-scroll for all browsers (Safari, Edge, Chrome)
  const isMobile = window.innerWidth <= 768;
  const isIPhone = /iPhone/i.test(navigator.userAgent);
  const isSafari = /Safari/i.test(navigator.userAgent) && !/Chrome|CriOS|Edge|Edg/i.test(navigator.userAgent);
  const isEdge = /Edge|Edg/i.test(navigator.userAgent);
  const isChrome = /CriOS|Chrome/i.test(navigator.userAgent);
  
  if (isMobile || isIPhone) {
    // Disable auto-centering ONLY for iPhone 16 Pro Safari
    const isIphone16Pro = window.screen.width === 430 && window.screen.height === 932;
    if (isSafari && isIphone16Pro) return;
    
    const browserType = isSafari ? 'Safari' : (isEdge ? 'Edge' : (isChrome ? 'Chrome' : 'Unknown'));
    console.log(`📱 iPhone ${browserType} detected - preparing auto-scroll to input box "Type what you hear..."`);

    // Small delay to ensure DOM is updated after exercise section becomes visible
    setTimeout(() => {
      if (spellingInput) {
        console.log(`📱 Scrolling to input box on iPhone ${browserType}`);
        
        // Method 1: Modern scrollIntoView (Safari, Chrome)
        if (isSafari || isChrome) {
          try {
            spellingInput.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'center'
            });
            console.log(`📱 ${browserType}: Used scrollIntoView method for input box`);
          } catch (e) {
            console.log(`📱 ${browserType}: scrollIntoView failed, using fallback`);
          }
        }
        
        // Method 2: Manual calculation (Better for Edge, fallback for all)
        setTimeout(() => {
          const inputRect = spellingInput.getBoundingClientRect();
          const inputTop = inputRect.top + window.pageYOffset;
          const viewportHeight = window.innerHeight;
          const scrollToPosition = inputTop - (viewportHeight / 2) + (inputRect.height / 2);
          
          // Enhanced scrolling with browser-specific optimizations
          if (isEdge) {
            // Edge on iPhone sometimes needs explicit smooth scrolling
            window.scrollTo({
              top: scrollToPosition,
              behavior: 'smooth'
            });
            console.log(`📱 Edge: Used manual scroll to input position:`, scrollToPosition);
          } else if (isSafari) {
            // Safari iOS - use both methods for reliability
            window.scrollTo({
              top: scrollToPosition,
              behavior: 'smooth'
            });
            console.log(`📱 Safari: Used enhanced scroll to input position:`, scrollToPosition);
          } else if (isChrome) {
            // Chrome on iPhone - prefer smooth scrolling
            window.scrollTo({
              top: scrollToPosition,
              behavior: 'smooth'
            });
            console.log(`📱 Chrome: Used smooth scroll to input position:`, scrollToPosition);
          } else {
            // Fallback for any other browser
            window.scrollTo({
              top: scrollToPosition,
              behavior: 'smooth'
            });
            console.log(`📱 Fallback: Used scroll to input position:`, scrollToPosition);
          }
          
          // Additional verification for iPhone browsers
          setTimeout(() => {
            const currentScroll = window.pageYOffset;
            const targetReached = Math.abs(currentScroll - scrollToPosition) < 50;
            console.log(`📱 ${browserType}: Input scroll verification - Target: ${scrollToPosition}, Current: ${currentScroll}, Success: ${targetReached}`);
            
            // Final fallback if scroll didn't work
            if (!targetReached) {
              console.log(`📱 ${browserType}: Applying final fallback scroll to input`);
              window.scrollTo(0, scrollToPosition);
            }
          }, 800);
          
        }, 100); // Secondary delay for Edge compatibility
        
      } else {
        console.log('⚠️ Spelling input box not found for auto-scroll');
      }
    }, 300); // Primary delay to ensure DOM is ready
  }
  
  feedbackEl.textContent = '';
  nextBtn.classList.add('hidden');
  restartBtn.classList.add('hidden');
  scoreEl.classList.add('hidden');
  updateSessionProgress();
  showCurrent();
}

function updateSessionProgress(){
  const currentNumber = session.words.length ? Math.min(session.index + 1, session.words.length) : 0;
  progressEl.textContent = `${currentNumber} / ${session.words.length}`;
}

function showCurrent(){
  if(session.index >= session.words.length){
    finishSession();
    return;
  }
  const mode = modeSelect.value;
  const current = session.words[session.index];
  currentQuestionKey = buildQuestionKey(mode, current);
  hasAnsweredCurrentQuestion = mode === 'phonics';

  feedbackEl.textContent = '';
  nextBtn.classList.add('hidden');
  restartBtn.classList.add('hidden');
  scoreEl.classList.add('hidden');

  if(mode === 'spelling'){
    meaningArea.classList.add('hidden');
    phonicsArea.classList.add('hidden');
    spellingArea.classList.remove('hidden');
    spellingResult.classList.add('hidden');
    promptEl.textContent = 'Listen to the word and type what you hear.';
    spellingInput.value = '';
    spellingInput.disabled = false;
    submitSpelling.disabled = false;
    spellingInput.focus();
    currentWord = current;
    
    // Reset result area
    resultMessage.textContent = '';
    correctAnswer.classList.add('hidden');
    wordImage.innerHTML = '';
    
    // Speak immediately while still inside the user's click/tap activation.
    speakWord(current.word);
  }else if(mode === 'phonics'){
    spellingArea.classList.add('hidden');
    meaningArea.classList.add('hidden');
    phonicsArea.classList.remove('hidden');
    promptEl.textContent = 'Learn how to sound out this word.';
    phonicsWordDisplay.textContent = current.word;
    phonicsPronounceBtn.onclick = () => speakWord(current.word);
    const container = document.getElementById('phonicsHelperContainer');
    container.innerHTML = ''; // Clear previous
    ensurePhonicsHelper(current, container);
    // Show next button immediately since no input required
    nextBtn.classList.remove('hidden');
  }else{
    spellingArea.classList.add('hidden');
    phonicsArea.classList.add('hidden');
    meaningArea.classList.remove('hidden');
    promptEl.textContent = 'Choose the correct meaning:';
    document.getElementById('wordDisplay').textContent = current.word;
    document.getElementById('pronounceBtn').onclick = () => speakWord(current.word);
    renderChoices(current);
  }
  updateSessionProgress();
}

function renderChoices(current){
  choicesEl.innerHTML = '';
  // correct meaning + 3 random wrongs from other words
  const pool = [];
  // vocab is organized as { level: { category: [words...] } }
  for (const levelKey in vocab) {
    const levelObj = vocab[levelKey];
    for (const cat in levelObj) {
      const arr = levelObj[cat];
      if (Array.isArray(arr)) {
        arr.forEach(w => pool.push(w.meaning));
      }
    }
  }
  // remove exact duplicate of correct
  const uniquePool = pool.filter(m=>m!==current.meaning);
  shuffle(uniquePool);
  const options = uniquePool.slice(0,3).concat(current.meaning);
  shuffle(options);
  options.forEach(opt=>{
    const b=document.createElement('button');
    b.className='choiceBtn';
    b.textContent=opt;
    b.onclick=()=>checkMeaning(opt,current);
    choicesEl.appendChild(b);
  });
}

function checkMeaning(selected,current){
  if (hasAnsweredCurrentQuestion) return;
  hasAnsweredCurrentQuestion = true;

  const isCorrect = selected === current.meaning;
  if(isCorrect){
    feedbackEl.textContent='Correct!';
    feedbackEl.className='feedback ok';
    session.score++;
  }else{
    feedbackEl.textContent=`Nope — correct: ${current.meaning}`;
    feedbackEl.className='feedback bad';
  }

  // Persist learn/review outcome for review queue and cycle-based analytics.
  if (typeof saveForReview === 'function') {
    saveForReview(current, isCorrect, {
      mode: 'meaning',
      phase: session.isReview ? 'review' : 'learn',
      questionKey: currentQuestionKey
    });
  }

  // Color the buttons
  const buttons = document.querySelectorAll('.choiceBtn');
  buttons.forEach(btn => {
    if (btn.textContent === current.meaning) {
      btn.classList.add('correct');
    } else if (btn.textContent === selected && !isCorrect) {
      btn.classList.add('wrong');
    }
    btn.disabled = true; // Disable all buttons after choice
  });
  nextBtn.classList.remove('hidden');
  restartBtn.classList.remove('hidden');
  scoreEl.classList.remove('hidden');
  scoreEl.textContent = `Score: ${session.score}`;
}

function next(){
  const mode = modeSelect.value;
  if ((mode === 'spelling' || mode === 'meaning') && !hasAnsweredCurrentQuestion) return;

  session.index++;
  updateSessionProgress();
  showCurrent();
}

function finishSession(){
  promptEl.textContent = 'Session complete!';
  feedbackEl.textContent = `Final score: ${session.score} / ${session.words.length}`;
  feedbackEl.className='feedback';
  nextBtn.classList.add('hidden');
  restartBtn.classList.remove('hidden');
  scoreEl.classList.remove('hidden');
  scoreEl.textContent = `Score: ${session.score}`;
  
  // Trigger celebration ribbons
  createCelebrationRibbons();
  
  if (!session.isReview) {
    // Update progress
    updateProgress(session.level, session.category, session.score, session.words.length);
    
    // Check achievements
    const progress = getProgress();
    // Check achievements if achievement utilities are available
    if (typeof checkAchievements === 'function') {
      const newAchievements = checkAchievements(progress, session) || [];
      newAchievements.forEach(achievementId => {
        const achievement = (typeof getAchievementDetails === 'function') ? getAchievementDetails(achievementId) : null;
        if (achievement) {
          if (typeof saveAchievement === 'function') saveAchievement(achievementId);
          if (typeof showAchievementNotification === 'function') showAchievementNotification(achievement);
        }
      });
    }
  }

  recordIdentitySessionSummary();
  updatePracticeRecord();
  updateLeaderboardsOnFinish();

  updateReviewCountDisplay();
  progressSection.classList.remove('hidden');

  triggerAutoCloudSync('session complete').catch(() => {
    // Auto sync is best-effort; keep UX responsive even if upload fails.
  });
}

startBtn.addEventListener('click', (e)=>{
  // Avoid double-firing on touch devices that also fire click events
  if (buttonTouchHandled) {
    console.log('📱 Click event skipped - already handled by touch');
    buttonTouchHandled = false; // Reset for next interaction
    return;
  }
  
  if(!vocab || Object.keys(vocab).length===0){
    promptEl.textContent = 'Vocabulary not loaded yet.';return
  }

  if (!appAccessGranted) {
    setIdentityHint('請先完成註冊（名稱+生日+Gmail）。');
    return;
  }
  
  // INSTANT visual feedback for desktop/non-touch devices
  const isMobile = window.innerWidth <= 768;
  const isIPhone = /iPhone/i.test(navigator.userAgent);
  
  if (isMobile || isIPhone) {
    console.log('📱 Adding INSTANT button animation (click event)');
    startBtn.classList.add('button-enlarge');
    // Remove animation immediately after adding it
    setTimeout(() => {
      startBtn.classList.remove('button-enlarge');
    }, 150); // Very short animation for visual feedback only
  }
  
  console.log('🖱️ ⚡ INSTANT session start via click');
  // IMMEDIATE execution - no delays
  startSession();
});

// IMMEDIATE iPhone touch support for Start Practice button - NO DELAYS
let touchStartTime = 0;
let buttonTouchHandled = false;

startBtn.addEventListener('touchstart', function(e) {
  console.log('📱 Start button touch started - IMMEDIATE MODE');
  touchStartTime = Date.now();
  buttonTouchHandled = false;
  
  // INSTANT visual feedback - no delay
  const isMobile = window.innerWidth <= 768;
  const isIPhone = /iPhone/i.test(navigator.userAgent);
  
  if (isMobile || isIPhone) {
    console.log('📱 Adding INSTANT button animation');
    startBtn.classList.add('button-enlarge');
  }
}, { passive: true });

startBtn.addEventListener('touchend', function(e) {
  console.log('📱 Start button touch ended - IMMEDIATE RESPONSE');
  
  const touchDuration = Date.now() - touchStartTime;
  
  // IMMEDIATE response - no delays or duration checks
  if (!buttonTouchHandled) {
    buttonTouchHandled = true;
    
    // Prevent the delayed click event
    e.preventDefault();
    e.stopPropagation();
    
    // Remove animation immediately
    startBtn.classList.remove('button-enlarge');
    
    // Check if vocab is loaded and button is not disabled
    if(!vocab || Object.keys(vocab).length===0){
      promptEl.textContent = 'Vocabulary not loaded yet.';
      return;
    }

    if (!appAccessGranted) {
      setIdentityHint('請先完成註冊（名稱+生日+Gmail）。');
      return;
    }
    
    if (!startBtn.disabled) {
      console.log('📱 ⚡ INSTANT SESSION START - NO DELAY');
      // IMMEDIATE execution - no setTimeout at all
      startSession();
    }
  }
}, { passive: false });

function playCurrentWord() {
  const current = session.words[session.index];
  if (!current?.word) {
    promptEl.textContent = 'Press Start to begin';
    return;
  }
  speakWord(current.word);
}

let listenTouchHandled = false;
listenWordBtn.addEventListener('click', () => {
  if (listenTouchHandled) {
    listenTouchHandled = false;
    return;
  }
  playCurrentWord();
});

listenWordBtn.addEventListener('touchend', (e) => {
  listenTouchHandled = true;
  e.preventDefault();
  playCurrentWord();
}, { passive: false });

submitSpelling.addEventListener('click', ()=>{checkSpelling();});

// Enhanced iPhone touch support for Check Answer button
submitSpelling.addEventListener('touchend', function(e) {
  console.log('📱 Check Answer button touched');
  e.preventDefault();
  if (!submitSpelling.disabled) {
    checkSpelling();
  }
}, { passive: false });

nextBtn.addEventListener('click', ()=>{next();});

// Enhanced iPhone touch support for Next button
nextBtn.addEventListener('touchend', function(e) {
  console.log('📱 Next button touched');
  e.preventDefault();
  if (!nextBtn.disabled && !nextBtn.classList.contains('hidden')) {
    next();
  }
}, { passive: false });

restartBtn.addEventListener('click', ()=>{startSession();});

// Mode selection handling
document.getElementById('practiceMode').addEventListener('change', (e) => {
  const learnControls = document.getElementById('learnControls');
  const reviewStats = document.getElementById('reviewStats');
  
  if (e.target.value === 'review') {
    learnControls.classList.add('hidden');
    reviewStats.classList.remove('hidden');
  } else {
    learnControls.classList.remove('hidden');
    reviewStats.classList.add('hidden');
  }
});

// Progress button handling
showProgressBtn.addEventListener('click', () => {
  if (progressSection.classList.contains('hidden')) {
    progressSection.classList.remove('hidden');
    displayProgress();
    showProgressBtn.textContent = 'Hide Progress';
  } else {
    progressSection.classList.add('hidden');
    showProgressBtn.textContent = 'Show Progress';
  }
});

function displayDailyChallenges() {
  // Use safe fallbacks if daily utilities are not available
  const daily = (typeof getDailyChallenge === 'function') ? getDailyChallenge() : { challenges: [] };
  const streak = (typeof getDailyStreak === 'function') ? getDailyStreak() : { current: 0, best: 0 };
  const container = document.getElementById('dailyChallenges');

  // Update streak display
  document.getElementById('currentStreak').textContent = streak.current;
  document.getElementById('bestStreak').textContent = streak.best;

  container.innerHTML = (daily.challenges || []).map(challenge => `
        <div class="daily-challenge ${challenge.completed ? 'completed' : ''}">
            <div class="challenge-header">
                <span class="challenge-emoji">${challenge.completed ? '✅' : '🎯'}</span>
                <span class="challenge-title">${challenge.description}</span>
            </div>
            <div class="challenge-progress">
                <div class="challenge-progress-fill" 
                     style="width: ${(challenge.progress / challenge.requirement) * 100}%">
                </div>
            </div>
        </div>
    `).join('');
}

// Update daily challenge progress based on actions
function updateChallengesForAction(action) {
    switch(action) {
        case 'word_complete':
      if (typeof updateDailyChallenge === 'function') updateDailyChallenge('category_master');
            break;
        case 'perfect_spell':
      if (typeof updateDailyChallenge === 'function') updateDailyChallenge('perfect_spell');
            break;
        case 'review_complete':
      if (typeof updateDailyChallenge === 'function') updateDailyChallenge('review_champion');
            break;
    }
}

// Speak event words with British female voice
function speakEventWord(word) {
  if (!synth) {
    console.error('Speech synthesis not supported');
    return;
  }
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = 'en-GB';
  utterance.rate = 0.9;
  utterance.pitch = 1.05;
  const voice = pickBritishFemaleVoice();
  if (voice) utterance.voice = voice;
  try { synth.cancel(); } catch {}
  synth.speak(utterance);
}

function updateEventSectionVisibility() {
  if (!eventSection || !eventToggleBtn) return;
  const collapsed = !!eventSectionCollapsed;
  eventSection.classList.toggle('collapsed', collapsed);
  eventToggleBtn.classList.toggle('collapsed', collapsed);
  eventToggleBtn.setAttribute('aria-expanded', String(!collapsed));
  const toggleHint = collapsed ? '展開節日單字區塊' : '收合節日單字區塊';
  eventToggleBtn.setAttribute('title', toggleHint);
  eventToggleBtn.setAttribute('aria-label', toggleHint);
}

function renderEventMarquee(event) {
  const marquee = document.getElementById('eventMarquee');
  const track = document.getElementById('eventMarqueeTrack');
  const particlesLayer = document.getElementById('eventMarqueeParticles');
  if (!marquee || !track || !particlesLayer) return;

  if (!event) {
    marquee.classList.add('hidden');
    marquee.removeAttribute('data-theme');
    track.innerHTML = '';
    particlesLayer.innerHTML = '';
    return;
  }

  const theme = EVENT_MARQUEE_THEMES[event.id] || null;
  const themeKey = (theme?.themeKey || event.id || 'default').toLowerCase();
  const fallbackItems = (event.words || []).slice(0, 8).map((entry) => ({
    emoji: entry?.emoji || '✨',
    label: entry?.word || event.name || 'Celebration'
  }));
  const items = ((theme?.items && theme.items.length > 0) ? theme.items : fallbackItems)
    .filter(item => item && (item.emoji || item.label));

  if (items.length === 0) {
    marquee.classList.add('hidden');
    marquee.removeAttribute('data-theme');
    track.innerHTML = '';
    particlesLayer.innerHTML = '';
    return;
  }

  marquee.dataset.theme = themeKey;
  marquee.style.setProperty('--marquee-duration', `${Number(theme?.durationSec || 20)}s`);

  const sequenceHtml = items.map(item => `
    <span class="event-marquee-item">
      <span class="event-marquee-emoji">${escapeHtml(item.emoji || '✨')}</span>
      <span class="event-marquee-text">${escapeHtml(item.label || event.name || 'Celebration')}</span>
    </span>
  `).join('');

  track.innerHTML = `
    <div class="event-marquee-sequence">${sequenceHtml}</div>
    <div class="event-marquee-sequence" aria-hidden="true">${sequenceHtml}</div>
  `;
  particlesLayer.innerHTML = buildEventMarqueeParticles(themeKey, event);
  marquee.classList.remove('hidden');
}

function checkAndDisplayEvent() {
  // Safely obtain current event and progress
  const currentEvent = (typeof getCurrentEvent === 'function') ? getCurrentEvent() : null;

  if (!eventSection) return;

  if (currentEvent) {
    eventSection.classList.remove('hidden');
    document.getElementById('eventTitle').textContent = currentEvent.name;
    renderEventMarquee(currentEvent);

    // Display event words
    const wordsHTML = (currentEvent.words || []).map(word => `
        <div class="event-word">
          <span class="event-emoji">${word.emoji}</span>
          <span>${word.word}</span>
          <button class="pronounce-btn" onclick="speakEventWord('${word.word}')" title="Pronounce">🔊</button>
        </div>
      `).join('');
    document.getElementById('eventWords').innerHTML = `
      <h3>Special Words</h3>
      ${wordsHTML}
    `;

    // Display event challenges (guard getEventProgress)
    const rawProgress = (typeof getEventProgress === 'function')
      ? getEventProgress(currentEvent.id)
      : {};
    const progress = {
      challengesCompleted: Array.isArray(rawProgress?.challengesCompleted) ? rawProgress.challengesCompleted : [],
      wordsLearned: Array.isArray(rawProgress?.wordsLearned) ? rawProgress.wordsLearned : []
    };
    const challengesHTML = (currentEvent.challenges || []).map(challenge => `
        <div class="event-challenge ${progress.challengesCompleted.includes(challenge.id) ? 'completed' : ''}">
          <div class="challenge-header">
            <span class="challenge-emoji">${challenge.reward}</span>
            <span>${challenge.title}</span>
          </div>
          <p>${challenge.description}</p>
        </div>
      `).join('');
    document.getElementById('eventChallenges').innerHTML = `
      <h3>Event Challenges</h3>
      ${challengesHTML}
    `;
    updateEventSectionVisibility();
  } else {
    renderEventMarquee(null);
    eventSection.classList.add('hidden');
  }
}

function updatePracticeRecord() {
  // Safely update calendar data if calendar utilities are present
  if (typeof updateCalendarData !== 'function') return;

  const isReview = !!session.isReview;
  const wordsCount = Number(session.words?.length || 0);
  updateCalendarData(new Date(), {
    used: true,
    wordsLearnedIncrement: isReview ? 0 : wordsCount,
    reviewsDoneIncrement: isReview ? wordsCount : 0,
    scoreIncrement: Number(session.score || 0)
  });

  const dailyChallenge = (typeof getDailyChallenge === 'function') ? getDailyChallenge() : { completed: false };
  if (dailyChallenge.completed) {
    updateCalendarData(new Date(), { dailyCompleted: true });
  }
  if (typeof updateCalendarDisplay === 'function') updateCalendarDisplay();
}

function loadIdentityStore() {
  try {
    const raw = localStorage.getItem(IDENTITY_STORE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return (parsed && typeof parsed === 'object') ? parsed : {};
  } catch {
    return {};
  }
}

function saveIdentityStore(store) {
  try {
    localStorage.setItem(IDENTITY_STORE_KEY, JSON.stringify(store));
  } catch {
    // Ignore storage quota/private mode failures.
  }
}

function normalizeNickname(raw) {
  return (raw || '').trim();
}

function normalizeEmail(raw) {
  return (raw || '').trim().toLowerCase();
}

const IDENTITY_PLACEHOLDER_NAME = '輸入暱稱';
const IDENTITY_PLACEHOLDER_BIRTHDAY = '輸入西元生日';

function applyIdentityInputPlaceholders() {
  if (usernameInputField) usernameInputField.placeholder = IDENTITY_PLACEHOLDER_NAME;
  if (birthdayInputField) birthdayInputField.placeholder = IDENTITY_PLACEHOLDER_BIRTHDAY;
}

function setBirthdayDigitsVisible(visible) {
  if (!birthdayInputField) return;
  const showDigits = !!visible;
  const current = birthdayInputField.value;
  birthdayInputField.setAttribute('type', showDigits ? 'text' : 'password');
  birthdayInputField.value = current;
  if (birthdayVisibilityToggle) birthdayVisibilityToggle.checked = showDigits;
}

function resetIdentityInputFields() {
  if (usernameInputField) usernameInputField.value = '';
  if (birthdayInputField) birthdayInputField.value = '';
  applyIdentityInputPlaceholders();
}

function getSignedInGoogleEmail() {
  return normalizeEmail(backendAuthState.user?.email || '');
}

function findIdentityByGoogleEmail(email, store = loadIdentityStore()) {
  const target = normalizeEmail(email);
  if (!target) return null;

  for (const [key, profile] of Object.entries(store)) {
    if (!profile || typeof profile !== 'object') continue;
    if (normalizeEmail(profile.googleEmail) === target) {
      return { key, profile };
    }
  }
  return null;
}

function findIdentityByNickname(nickname, store = loadIdentityStore()) {
  const key = normalizeNickname(nickname).toLowerCase();
  if (!key) return null;
  const profile = store[key];
  if (!profile || typeof profile !== 'object') return null;
  return { key, profile };
}

function buildDefaultIdentityStats() {
  return {
    totalSessions: 0,
    learnSessions: 0,
    reviewSessions: 0,
    totalQuestions: 0,
    totalScore: 0
  };
}

function upsertLocalIdentityProfile(rawProfile = {}) {
  const nickname = normalizeNickname(rawProfile.nickname || '');
  const birthday = String(rawProfile.birthday || '').trim();
  const googleEmail = normalizeEmail(rawProfile.googleEmail || '');

  if (!nickname || !birthday || !googleEmail) return null;

  const key = nickname.toLowerCase();
  const now = Date.now();
  const store = loadIdentityStore();

  Object.keys(store).forEach((existingKey) => {
    if (existingKey === key) return;
    if (normalizeEmail(store[existingKey]?.googleEmail || '') === googleEmail) {
      delete store[existingKey];
    }
  });

  const existing = store[key];
  store[key] = {
    nickname,
    birthday,
    googleEmail,
    createdAt: existing?.createdAt || now,
    lastLoginAt: now,
    stats: existing?.stats || buildDefaultIdentityStats()
  };

  saveIdentityStore(store);
  localStorage.setItem(ACTIVE_IDENTITY_KEY, key);
  return { key, profile: store[key] };
}

async function fetchIdentityProfileFromBackend() {
  if (!backendAuthState.backendEnabled || !backendAuthState.signedIn) {
    return { ok: false, reason: 'backend-or-session-disabled', profile: null };
  }

  const result = await fetchBackendJson('/api/auth/session', {
    method: 'POST',
    body: { action: 'me' }
  });
  if (result.status === 401) {
    return { ok: false, reason: 'unauthorized', profile: null };
  }
  if (!result.ok) {
    return { ok: false, reason: result.data?.error || 'failed', profile: null };
  }

  return {
    ok: true,
    reason: 'ok',
    profile: result.data?.profile || null
  };
}

function fillIdentityInputs(profile) {
  if (!profile) return;
  const usernameInput = document.getElementById('usernameInput');
  const birthdayInput = document.getElementById('birthdayInput');
  if (usernameInput) usernameInput.value = profile.nickname || '';
  if (birthdayInput) birthdayInput.value = profile.birthday || '';
}

function updateTopUserBar(profile = null, email = '') {
  if (!topUserBar) return;
  const visible = !!profile && !!email;
  topUserBar.classList.toggle('hidden', !visible);

  if (visible) {
    if (topUserName) topUserName.textContent = profile.nickname || '';
    if (topUserEmail) topUserEmail.textContent = email;
  } else {
    if (topUserName) topUserName.textContent = '';
    if (topUserEmail) topUserEmail.textContent = '';
  }
}

function updateIdentitySectionVisibility() {
  if (!identitySection) return;

  const canToggle = appAccessGranted;
  const collapsed = canToggle && identitySectionCollapsed;

  identitySection.classList.toggle('collapsed', collapsed);

  if (!identityToggleBtn) return;
  identityToggleBtn.classList.toggle('hidden', !canToggle);
  identityToggleBtn.classList.toggle('collapsed', collapsed);
  identityToggleBtn.setAttribute('aria-expanded', String(!collapsed));
  const toggleHint = collapsed ? '展開登入區塊' : '收合登入區塊';
  identityToggleBtn.setAttribute('title', toggleHint);
  identityToggleBtn.setAttribute('aria-label', toggleHint);
}

function setLearningAccess(enabled, profile = null, email = '') {
  const wasGranted = appAccessGranted;
  appAccessGranted = !!enabled;

  if (learningContent) {
    learningContent.classList.toggle('hidden', !appAccessGranted);
  }
  if (cloudSyncPanel) {
    cloudSyncPanel.classList.toggle('hidden', !appAccessGranted);
  }
  if (startBtn) {
    startBtn.disabled = !appAccessGranted || !vocab || Object.keys(vocab).length === 0;
  }
  if (!appAccessGranted && exercise) {
    exercise.classList.add('hidden');
  }

  if (appAccessGranted && typeof markCalendarLoginUsage === 'function') {
    markCalendarLoginUsage(new Date());
    if (typeof updateCalendarDisplay === 'function') updateCalendarDisplay();
  }

  if (appAccessGranted && !wasGranted) {
    identitySectionCollapsed = true;
  }
  if (!appAccessGranted) {
    identitySectionCollapsed = false;
  }

  updateTopUserBar(appAccessGranted ? profile : null, appAccessGranted ? email : '');
  updateIdentitySectionVisibility();
}

async function syncAuthGateFromCurrentState({ silent = false } = {}) {
  if (!backendAuthState.signedIn) {
    setLearningAccess(false);
    if (!silent) {
      setIdentityHint('請先登入 Gmail，再完成註冊。');
    }
    return false;
  }

  const email = getSignedInGoogleEmail();
  if (!email) {
    setLearningAccess(false);
    if (!silent) setIdentityHint('目前無法讀取 Gmail 信箱，請重新登入。', true);
    return false;
  }

  const store = loadIdentityStore();
  const activeKey = localStorage.getItem(ACTIVE_IDENTITY_KEY) || '';
  const activeProfile = activeKey ? store[activeKey] : null;

  if (activeProfile && normalizeEmail(activeProfile.googleEmail) === email) {
    resetIdentityInputFields();
    syncUsernameAcrossFeatures(activeProfile.nickname);
    setLearningAccess(true, activeProfile, email);
    if (!silent) setIdentityHint(`登入成功：${activeProfile.nickname}（${email}）`);
    return true;
  }

  const linked = findIdentityByGoogleEmail(email, store);
  if (linked) {
    localStorage.setItem(ACTIVE_IDENTITY_KEY, linked.key);
    resetIdentityInputFields();
    syncUsernameAcrossFeatures(linked.profile.nickname);
    setLearningAccess(true, linked.profile, email);
    if (!silent) setIdentityHint(`歡迎回來：${linked.profile.nickname}（${email}）`);
    return true;
  }

  const remoteIdentity = await fetchIdentityProfileFromBackend();
  if (remoteIdentity.ok && remoteIdentity.profile) {
    const synced = upsertLocalIdentityProfile(remoteIdentity.profile);
    if (synced?.profile && normalizeEmail(synced.profile.googleEmail) === email) {
      resetIdentityInputFields();
      syncUsernameAcrossFeatures(synced.profile.nickname);
      setLearningAccess(true, synced.profile, email);
      if (!silent) setIdentityHint(`歡迎回來：${synced.profile.nickname}（${email}）`);
      return true;
    }
  }

  setLearningAccess(false);
  if (!silent) {
    setIdentityHint('Gmail 已登入，請先設定暱稱與生日再按「完成註冊」。暱稱不可重複。');
  }
  return false;
}

async function signInRegisteredByGoogleOnly() {
  if (!backendAuthState.signedIn) {
    setIdentityHint('請先完成 Gmail 登入。', true);
    return false;
  }

  const email = getSignedInGoogleEmail();
  if (!email) {
    setIdentityHint('無法取得 Gmail 信箱，請重新登入。', true);
    return false;
  }

  let linked = findIdentityByGoogleEmail(email);
  if (!linked) {
    const remoteIdentity = await fetchIdentityProfileFromBackend();
    if (remoteIdentity.ok && remoteIdentity.profile) {
      const synced = upsertLocalIdentityProfile(remoteIdentity.profile);
      if (synced) linked = synced;
    }
  }

  if (!linked || !linked.profile) {
    setIdentityHint('找不到此 Gmail 的註冊資料，請先輸入名稱與生日完成註冊。', true);
    return false;
  }

  localStorage.setItem(ACTIVE_IDENTITY_KEY, linked.key);
  resetIdentityInputFields();
  syncUsernameAcrossFeatures(linked.profile.nickname);
  setLearningAccess(true, linked.profile, email);
  setIdentityHint(`已使用 Gmail 登入：${linked.profile.nickname}`);
  return true;
}

async function recoverNicknameForSignedInGoogle() {
  if (!backendAuthState.signedIn) {
    setIdentityHint('請先完成 Gmail 登入。', true);
    return false;
  }

  const email = getSignedInGoogleEmail();
  if (!email) {
    setIdentityHint('無法取得 Gmail 信箱，請重新登入。', true);
    return false;
  }

  let linked = findIdentityByGoogleEmail(email);
  if (!linked) {
    const remoteIdentity = await fetchIdentityProfileFromBackend();
    if (remoteIdentity.ok && remoteIdentity.profile) {
      const synced = upsertLocalIdentityProfile(remoteIdentity.profile);
      if (synced) linked = synced;
    }
  }

  if (!linked?.profile) {
    setIdentityHint('此 Gmail 尚未註冊暱稱，請先輸入暱稱與生日完成註冊。', true);
    return false;
  }

  fillIdentityInputs(linked.profile);
  setIdentityHint(`此 Gmail 綁定的暱稱是：${linked.profile.nickname}`);
  return true;
}

function isValidBirthday(value) {
  if (!/^\d{8}$/.test(value || '')) return false;

  const yyyy = parseInt(value.slice(0, 4), 10);
  const mm = parseInt(value.slice(4, 6), 10);
  const dd = parseInt(value.slice(6, 8), 10);
  const date = new Date(yyyy, mm - 1, dd);

  if (yyyy < 1900 || yyyy > 2100) return false;
  return date.getFullYear() === yyyy && date.getMonth() === mm - 1 && date.getDate() === dd;
}

function setIdentityHint(message, isError = false) {
  const hint = document.getElementById('identityHint');
  if (!hint) return;
  hint.textContent = message;
  hint.classList.toggle('error', !!isError);
}

function syncUsernameAcrossFeatures(name) {
  if (!name) return;
  localStorage.setItem(USERNAME_KEY_FALLBACK, name);
  if (typeof setUsername === 'function') setUsername(name);
  if (typeof displayLeaderboards === 'function') displayLeaderboards();
}

async function saveOrSignInIdentityProfile(name, birthday, options = {}) {
  const nickname = normalizeNickname(name);
  const birth = (birthday || '').trim();
  const googleEmail = normalizeEmail(options.googleEmail || '');

  if (!nickname) {
    setIdentityHint('請先輸入名稱。', true);
    return { ok: false, reason: 'missing-nickname' };
  }
  if (!isValidBirthday(birth)) {
    setIdentityHint('生日格式錯誤，請輸入 YYYYMMDD。', true);
    return { ok: false, reason: 'invalid-birthday' };
  }
  if (!googleEmail) {
    setIdentityHint('請先完成 Gmail 登入，才能註冊。', true);
    return { ok: false, reason: 'missing-google-email' };
  }

  const localStore = loadIdentityStore();
  const localNicknameOwner = findIdentityByNickname(nickname, localStore);
  const localNicknameOwnerEmail = normalizeEmail(localNicknameOwner?.profile?.googleEmail || '');
  if (localNicknameOwner && localNicknameOwnerEmail && localNicknameOwnerEmail !== googleEmail) {
    setIdentityHint('此名稱已被其他人註冊，請更換名稱。', true);
    return { ok: false, reason: 'nickname-taken' };
  }

  if (backendAuthState.backendEnabled && backendAuthState.signedIn) {
    const remote = await fetchBackendJson('/api/auth/session', {
      method: 'POST',
      body: { action: 'register', nickname, birthday: birth }
    });

    if (!remote.ok) {
      const reason = String(remote.data?.reason || 'identity-conflict');
      const reasonHintMap = {
        'missing-nickname': '請先輸入名稱。',
        'invalid-birthday': '生日格式錯誤，請輸入 YYYYMMDD。',
        'nickname-taken': '此名稱已被其他人註冊，請更換名稱。',
        'email-taken': '此 Gmail 已綁定其他帳號，請改用原帳號登入。',
        'nickname-mismatch': '此 Gmail 已綁定其他名稱，無法更換。',
        'email-mismatch': '此名稱已綁定不同 Gmail，請改用原本帳號登入。',
        'birthday-mismatch': '此名稱已存在，但生日不符。請使用原本生日。'
      };
      setIdentityHint(reasonHintMap[reason] || (remote.data?.error || '身份資料驗證失敗。'), true);
      return { ok: false, reason };
    }

    const synced = upsertLocalIdentityProfile(remote.data?.profile || {
      nickname,
      birthday: birth,
      googleEmail
    });

    if (!synced?.profile) {
      setIdentityHint('註冊資料同步失敗，請再試一次。', true);
      return { ok: false, reason: 'local-sync-failed' };
    }

    syncUsernameAcrossFeatures(synced.profile.nickname);
    setIdentityHint(`註冊成功：${synced.profile.nickname}（${synced.profile.googleEmail}）`);
    if (typeof showNotification === 'function') {
      showNotification('👤 註冊完成', `已註冊：${synced.profile.nickname}`);
    }

    return { ok: true, key: synced.key, profile: synced.profile };
  }

  const key = nickname.toLowerCase();
  const store = localStore;
  const now = Date.now();
  const existing = store[key];

  const linkedByEmail = findIdentityByGoogleEmail(googleEmail, store);
  if (linkedByEmail && linkedByEmail.key !== key) {
    localStorage.setItem(ACTIVE_IDENTITY_KEY, linkedByEmail.key);
    resetIdentityInputFields();
    syncUsernameAcrossFeatures(linkedByEmail.profile.nickname);
    setLearningAccess(true, linkedByEmail.profile, googleEmail);
    setIdentityHint(`此 Gmail 已綁定 ${linkedByEmail.profile.nickname}，已直接登入。`);
    return { ok: true, key: linkedByEmail.key, profile: linkedByEmail.profile };
  }

  if (existing && existing.birthday !== birth) {
    setIdentityHint('此名稱已存在，但生日不符。請使用原本生日。', true);
    return { ok: false, reason: 'birthday-mismatch' };
  }

  if (existing && existing.googleEmail && normalizeEmail(existing.googleEmail) !== googleEmail) {
    setIdentityHint('此名稱已綁定不同 Gmail，請改用原本帳號登入。', true);
    return { ok: false, reason: 'email-mismatch' };
  }

  store[key] = {
    nickname,
    birthday: birth,
    googleEmail,
    createdAt: existing?.createdAt || now,
    lastLoginAt: now,
    stats: existing?.stats || buildDefaultIdentityStats()
  };

  saveIdentityStore(store);
  localStorage.setItem(ACTIVE_IDENTITY_KEY, key);
  syncUsernameAcrossFeatures(nickname);

  setIdentityHint(`註冊成功：${nickname}（${googleEmail}）`);
  if (typeof showNotification === 'function') {
    showNotification('👤 註冊完成', `已註冊：${nickname}`);
  }

  return { ok: true, key, profile: store[key] };
}

async function recoverNicknamesByBirthday(birthday, name) {
  const nickname = normalizeNickname(name);
  const birth = (birthday || '').trim();

  if (!nickname) {
    setIdentityHint('請輸入暱稱與生日（YYYYMMDD）來確認是否註冊。', true);
    return;
  }

  if (!isValidBirthday(birth)) {
    setIdentityHint('請輸入正確生日（YYYYMMDD）以確認註冊。', true);
    return;
  }

  if (backendAuthState.backendEnabled && backendAuthState.signedIn) {
    const remote = await fetchBackendJson('/api/auth/session', {
      method: 'POST',
      body: { action: 'check', nickname, birthday: birth }
    });

    if (remote.status === 401) {
      setIdentityHint('登入已過期，請先重新登入 Gmail。', true);
      return;
    }

    if (!remote.ok) {
      setIdentityHint(remote.data?.error || '註冊確認失敗，請稍後再試。', true);
      return;
    }

    if (!remote.data?.registered) {
      setIdentityHint('此暱稱 + 生日尚未註冊。', true);
      return;
    }

    if (!remote.data?.owner) {
      setIdentityHint('此暱稱 + 生日已註冊，但不屬於目前 Gmail 帳號。', true);
      return;
    }

    const synced = upsertLocalIdentityProfile(remote.data?.profile || {
      nickname,
      birthday: birth,
      googleEmail: getSignedInGoogleEmail()
    });
    if (synced?.profile) {
      const usernameInput = document.getElementById('usernameInput');
      if (usernameInput) usernameInput.value = synced.profile.nickname || nickname;
    }
    setIdentityHint(`已確認註冊：${nickname}（生日驗證成功）。`);
    return;
  }

  const store = loadIdentityStore();
  const profile = store[nickname.toLowerCase()];
  if (!profile) {
    setIdentityHint('此暱稱尚未註冊。', true);
    return;
  }
  if ((profile.birthday || '').trim() !== birth) {
    setIdentityHint('此暱稱存在，但生日不符。', true);
    return;
  }

  setIdentityHint(`已確認註冊：${profile.nickname}（生日驗證成功）。`);
}

function restoreActiveIdentityFromStorage() {
  const activeKey = localStorage.getItem(ACTIVE_IDENTITY_KEY);
  if (!activeKey) return;

  const store = loadIdentityStore();
  const profile = store[activeKey];
  if (!profile) return;

  const usernameInput = document.getElementById('usernameInput');
  const birthdayInput = document.getElementById('birthdayInput');
  if (usernameInput) usernameInput.value = profile.nickname || '';
  if (birthdayInput) birthdayInput.value = profile.birthday || '';

  syncUsernameAcrossFeatures(profile.nickname);
  setIdentityHint(`歡迎回來：${profile.nickname}。`);
}

function recordIdentitySessionSummary() {
  const activeKey = localStorage.getItem(ACTIVE_IDENTITY_KEY);
  if (!activeKey) return;

  const store = loadIdentityStore();
  const profile = store[activeKey];
  if (!profile) return;

  if (!profile.stats || typeof profile.stats !== 'object') {
    profile.stats = {
      totalSessions: 0,
      learnSessions: 0,
      reviewSessions: 0,
      totalQuestions: 0,
      totalScore: 0
    };
  }

  profile.lastLoginAt = Date.now();
  profile.stats.totalSessions += 1;
  profile.stats.totalQuestions += session.words.length;
  profile.stats.totalScore += session.score;
  if (session.isReview) profile.stats.reviewSessions += 1;
  else profile.stats.learnSessions += 1;

  store[activeKey] = profile;
  saveIdentityStore(store);
}

function setCloudSyncHint(message, isError = false) {
  const hint = document.getElementById('cloudSyncHint');
  if (!hint) return;
  hint.textContent = message;
  hint.classList.toggle('error', !!isError);
}

function setAuthStatusHint(message, isError = false) {
  if (!authStatusHint) return;
  authStatusHint.textContent = message;
  authStatusHint.classList.toggle('error', !!isError);
}

function updateIdentityRegistrationControls() {
  const signedIn = !!backendAuthState.signedIn;

  if (usernameInputField) {
    usernameInputField.disabled = !signedIn;
    usernameInputField.readOnly = !signedIn;
    usernameInputField.placeholder = signedIn ? IDENTITY_PLACEHOLDER_NAME : '請先登入 Gmail';
  }

  if (birthdayInputField) {
    birthdayInputField.disabled = !signedIn;
    birthdayInputField.readOnly = !signedIn;
    birthdayInputField.placeholder = signedIn ? IDENTITY_PLACEHOLDER_BIRTHDAY : '請先登入 Gmail';
  }

  if (birthdayVisibilityToggle) {
    birthdayVisibilityToggle.disabled = !signedIn;
    if (!signedIn) setBirthdayDigitsVisible(false);
  }

  if (registerProfileBtn) {
    registerProfileBtn.disabled = !signedIn || cloudSyncBusy;
  }

  if (recoverNicknameBtn) {
    recoverNicknameBtn.disabled = !signedIn || cloudSyncBusy;
  }
}

function readStorageValue(key) {
  const raw = localStorage.getItem(key);
  if (raw === null) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function isObjectLike(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function deepClone(value) {
  if (value === null || typeof value === 'undefined') return value;
  if (typeof value !== 'object') return value;
  if (typeof structuredClone === 'function') {
    try { return structuredClone(value); } catch { /* fallback below */ }
  }
  return JSON.parse(JSON.stringify(value));
}

function asNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function uniqStrings(values) {
  return Array.from(new Set((values || []).filter(v => typeof v === 'string')));
}

function loadAutoCloudSyncPreference() {
  return localStorage.getItem(AUTO_CLOUD_SYNC_KEY) === '1';
}

function saveAutoCloudSyncPreference(enabled) {
  localStorage.setItem(AUTO_CLOUD_SYNC_KEY, enabled ? '1' : '0');
}

function updateCloudSyncControlLabels() {
  if (cloudPullBtn) cloudPullBtn.textContent = '從雲端下載';
  if (cloudPushBtn) cloudPushBtn.textContent = '上傳到雲端';

  if (autoCloudSyncLabel) {
    autoCloudSyncLabel.textContent = '每次完成練習後自動上傳（帳號雲端）';
  }

  if (googleSignOutBtn) {
    googleSignOutBtn.textContent = '登出 Gmail 帳號';
    googleSignOutBtn.classList.toggle('hidden', !backendAuthState.signedIn);
    googleSignOutBtn.disabled = cloudSyncBusy;
  }
  if (googleSignInContainer) {
    googleSignInContainer.classList.toggle('hidden', backendAuthState.signedIn);
  }
  if (existingGoogleLoginBtn) {
    existingGoogleLoginBtn.classList.add('hidden');
    existingGoogleLoginBtn.disabled = true;
  }

  updateIdentityRegistrationControls();
}

async function fetchBackendJson(path, options = {}) {
  const headers = {
    Accept: 'application/json',
    ...(options.headers || {})
  };

  const init = {
    method: options.method || 'GET',
    credentials: 'include',
    headers
  };

  if (typeof options.body !== 'undefined') {
    init.body = JSON.stringify(options.body);
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(path, init);
  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  return {
    ok: response.ok,
    status: response.status,
    data
  };
}

function describeSignedInUser(user) {
  if (!user || typeof user !== 'object') return '已登入。';
  const name = (user.name || '').trim();
  const email = (user.email || '').trim();
  if (name && email) return `已登入：${name} (${email})。`;
  return `已登入：${name || email || 'Gmail 帳號'}。`;
}

async function refreshBackendSessionState({ silent = false } = {}) {
  if (!backendAuthState.backendEnabled) {
    backendAuthState.signedIn = false;
    backendAuthState.user = null;
    updateCloudSyncControlLabels();
    setLearningAccess(false);
    return false;
  }

  const result = await fetchBackendJson('/api/auth/session');
  if (!result.ok) {
    if (!silent) setAuthStatusHint('帳號會話檢查失敗，請重新登入。', true);
    backendAuthState.signedIn = false;
    backendAuthState.user = null;
    updateCloudSyncControlLabels();
    setLearningAccess(false);
    return false;
  }

  backendAuthState.signedIn = !!result.data?.authenticated;
  backendAuthState.user = backendAuthState.signedIn ? (result.data.user || null) : null;
  updateCloudSyncControlLabels();

  if (!silent) {
    if (backendAuthState.signedIn) {
      setAuthStatusHint(`${describeSignedInUser(backendAuthState.user)} 帳號雲端同步已啟用。`);
    } else {
      setAuthStatusHint('請先登入 Gmail，才能使用雲端同步。');
    }
  }

  await syncAuthGateFromCurrentState({ silent });

  return backendAuthState.signedIn;
}

async function handleGoogleCredentialResponse(response) {
  const idToken = response?.credential || '';
  if (!idToken) {
    setAuthStatusHint('Gmail 登入未回傳憑證。', true);
    return;
  }

  setAuthStatusHint('正在登入 Gmail...');
  const result = await fetchBackendJson('/api/auth/google-login', {
    method: 'POST',
    body: { idToken }
  });

  if (!result.ok) {
    setAuthStatusHint(result.data?.error || 'Gmail 登入失敗。', true);
    return;
  }

  backendAuthState.signedIn = true;
  backendAuthState.user = result.data?.user || null;
  updateCloudSyncControlLabels();
  setAuthStatusHint(`${describeSignedInUser(backendAuthState.user)} 帳號雲端同步已啟用。`);
  setCloudSyncHint('帳號雲端同步已啟用，請使用「從雲端下載 / 上傳到雲端」。');
  await syncAuthGateFromCurrentState({ silent: false });
}

function renderGoogleSignInButton() {
  if (!backendAuthState.backendEnabled || !backendAuthState.googleClientId) return;
  if (!googleSignInContainer) return;
  if (!window.google?.accounts?.id) return;

  window.google.accounts.id.initialize({
    client_id: backendAuthState.googleClientId,
    callback: handleGoogleCredentialResponse
  });

  googleSignInContainer.innerHTML = '';
  window.google.accounts.id.renderButton(googleSignInContainer, {
    theme: 'outline',
    size: 'large',
    shape: 'pill',
    text: 'signin_with',
    width: 260
  });
  googleSignInInitialized = true;
}

function tryInitGoogleSignIn(attempt = 0) {
  if (!backendAuthState.backendEnabled || !googleSignInContainer || googleSignInInitialized) return;
  if (window.google?.accounts?.id) {
    renderGoogleSignInButton();
    return;
  }
  if (attempt >= 30) {
    setAuthStatusHint('Gmail 登入元件載入失敗，請重新整理後再試。', true);
    return;
  }
  setTimeout(() => tryInitGoogleSignIn(attempt + 1), 200);
}

async function initBackendAccountSync() {
  const result = await fetchBackendJson('/api/auth/config');
  if (!result.ok) {
    setAuthStatusHint('本機預覽無法連線 Gmail 登入服務，請用 Vercel 網址測試登入。');
    updateCloudSyncControlLabels();
    return;
  }

  backendAuthState.backendEnabled = !!result.data?.backendEnabled;
  backendAuthState.googleClientId = (result.data?.googleClientId || '').trim();

  if (!backendAuthState.backendEnabled || !backendAuthState.googleClientId) {
    setAuthStatusHint('帳號雲端同步尚未完成設定。', true);
    updateCloudSyncControlLabels();
    return;
  }

  await refreshBackendSessionState();
  tryInitGoogleSignIn();
}

async function signOutBackendAccount() {
  if (window.google?.accounts?.id) {
    try {
      window.google.accounts.id.disableAutoSelect();
      if (backendAuthState.user?.email) {
        window.google.accounts.id.revoke(backendAuthState.user.email, () => {});
      }
    } catch {
      // Keep logout flow resilient even if Google SDK revoke fails.
    }
  }

  const result = await fetchBackendJson('/api/auth/logout', { method: 'POST' });
  if (!result.ok) {
    setAuthStatusHint(result.data?.error || '登出失敗，請再試一次。', true);
    return;
  }

  backendAuthState.signedIn = false;
  backendAuthState.user = null;
  updateCloudSyncControlLabels();
  setAuthStatusHint('已登出 Gmail 帳號。');
  setCloudSyncHint('已登出，請先登入 Gmail 才能上傳或下載雲端資料。');
  setLearningAccess(false);
  setIdentityHint('你已登出。請重新登入或註冊。');
}

async function pullCloudSnapshotFromBackend() {
  setCloudSyncBusy(true);
  setCloudSyncHint('正在從帳號雲端下載資料...');
  try {
    const result = await fetchBackendJson('/api/sync/pull');
    if (result.status === 401) {
      backendAuthState.signedIn = false;
      backendAuthState.user = null;
      updateCloudSyncControlLabels();
      setAuthStatusHint('登入會話已過期，請重新登入。', true);
      throw new Error('登入會話已過期，請重新登入。');
    }
    if (!result.ok) {
      throw new Error(result.data?.error || '雲端下載失敗。');
    }

    const payload = result.data?.payload;
    if (!payload) {
      setCloudSyncHint('目前雲端尚無可下載資料。', true);
      return;
    }

    applyCloudPayload(payload);
    setCloudSyncHint('已從帳號雲端下載資料。');
    if (typeof showNotification === 'function') {
      showNotification('☁️ 雲端下載完成', '已載入帳號雲端資料。');
    }
  } catch (err) {
    setCloudSyncHint(err?.message || '雲端下載失敗。', true);
  } finally {
    setCloudSyncBusy(false);
  }
}

async function pushCloudSnapshotToBackend(options = {}) {
  const auto = !!options.auto;
  const activeKey = localStorage.getItem(ACTIVE_IDENTITY_KEY) || '';
  const nickname = getCloudNickname();
  const payload = buildCloudPayload(activeKey, nickname);

  setCloudSyncBusy(true);
  setCloudSyncHint('正在上傳本機資料到帳號雲端...');
  try {
    const result = await fetchBackendJson('/api/sync/push', {
      method: 'POST',
      body: { payload }
    });

    if (result.status === 401) {
      backendAuthState.signedIn = false;
      backendAuthState.user = null;
      updateCloudSyncControlLabels();
      setAuthStatusHint('登入會話已過期，請重新登入。', true);
      throw new Error('登入會話已過期，請重新登入。');
    }

    if (!result.ok) {
      throw new Error(result.data?.error || '雲端上傳失敗。');
    }

    setCloudSyncHint('已上傳資料到帳號雲端。');
    if (!auto && typeof showNotification === 'function') {
      showNotification('☁️ 雲端上傳完成', `已上傳：${nickname}`);
    }
  } catch (err) {
    setCloudSyncHint(err?.message || '雲端上傳失敗。', true);
  } finally {
    setCloudSyncBusy(false);
  }
}

function mergeProgressData(localValue, remoteValue) {
  const local = isObjectLike(localValue) ? localValue : {};
  const remote = isObjectLike(remoteValue) ? remoteValue : {};
  const out = {};

  const levelKeys = new Set([...Object.keys(remote), ...Object.keys(local)]);
  levelKeys.forEach((level) => {
    const localLevel = isObjectLike(local[level]) ? local[level] : {};
    const remoteLevel = isObjectLike(remote[level]) ? remote[level] : {};
    const catOut = {};
    const catKeys = new Set([...Object.keys(remoteLevel), ...Object.keys(localLevel)]);
    catKeys.forEach((cat) => {
      const localStats = isObjectLike(localLevel[cat]) ? localLevel[cat] : {};
      const remoteStats = isObjectLike(remoteLevel[cat]) ? remoteLevel[cat] : {};
      const total = Math.max(asNumber(localStats.total, 0), asNumber(remoteStats.total, 0));
      const correct = Math.min(total, Math.max(asNumber(localStats.correct, 0), asNumber(remoteStats.correct, 0)));
      catOut[cat] = { correct, total };
    });
    out[level] = catOut;
  });

  return out;
}

function mergeReviewData(localValue, remoteValue) {
  const local = isObjectLike(localValue) ? localValue : {};
  const remote = isObjectLike(remoteValue) ? remoteValue : {};
  const out = {};

  const words = new Set([...Object.keys(remote), ...Object.keys(local)]);
  words.forEach((word) => {
    const l = isObjectLike(local[word]) ? local[word] : {};
    const r = isObjectLike(remote[word]) ? remote[word] : {};
    const lSeen = asNumber(l.lastSeen, 0);
    const rSeen = asNumber(r.lastSeen, 0);
    const latest = lSeen >= rSeen ? l : r;

    const lHist = Array.isArray(l.history) ? l.history : [];
    const rHist = Array.isArray(r.history) ? r.history : [];
    const mergedHistoryMap = new Map();
    [...lHist, ...rHist].forEach((evt) => {
      if (!evt || typeof evt !== 'object') return;
      const ts = asNumber(evt.ts, 0);
      const phase = evt.phase === 'review' ? 'review' : 'learn';
      const mode = evt.mode === 'meaning' ? 'meaning' : 'spelling';
      const correct = !!evt.correct;
      const k = `${ts}|${phase}|${mode}|${correct ? 1 : 0}`;
      if (!mergedHistoryMap.has(k)) {
        mergedHistoryMap.set(k, { ts, phase, mode, correct });
      }
    });

    const history = Array.from(mergedHistoryMap.values())
      .sort((a, b) => a.ts - b.ts)
      .slice(-300);

    const attempts = history.length > 0
      ? history.length
      : Math.max(asNumber(l.attempts, 0), asNumber(r.attempts, 0));
    const correctCount = history.length > 0
      ? history.filter(evt => evt.correct).length
      : Math.max(asNumber(l.correct, 0), asNumber(r.correct, 0));
    const learnAttempts = history.filter(evt => evt.phase === 'learn').length || Math.max(asNumber(l.learnAttempts, 0), asNumber(r.learnAttempts, 0));
    const reviewAttempts = history.filter(evt => evt.phase === 'review').length || Math.max(asNumber(l.reviewAttempts, 0), asNumber(r.reviewAttempts, 0));
    const cycleCompleted = learnAttempts > 0 && reviewAttempts > 0;
    const lastSeen = Math.max(lSeen, rSeen, history[history.length - 1]?.ts || 0);
    const firstSeen = Math.min(
      asNumber(l.firstSeen, Number.MAX_SAFE_INTEGER),
      asNumber(r.firstSeen, Number.MAX_SAFE_INTEGER),
      history[0]?.ts || Number.MAX_SAFE_INTEGER
    );

    out[word] = {
      word,
      meaning: latest.meaning || l.meaning || r.meaning || '',
      emoji: latest.emoji || l.emoji || r.emoji || '',
      attempts,
      correct: Math.min(attempts, correctCount),
      firstSeen: Number.isFinite(firstSeen) && firstSeen !== Number.MAX_SAFE_INTEGER ? firstSeen : Date.now(),
      lastSeen: lastSeen || Date.now(),
      needsReview: !attempts || (Math.min(attempts, correctCount) / attempts) < 0.7,
      learnAttempts,
      reviewAttempts,
      cycleCompleted,
      lastMode: latest.lastMode === 'meaning' ? 'meaning' : 'spelling',
      history,
      lastQuestionKey: ''
    };
  });

  return out;
}

function mergeLeaderboardData(localValue, remoteValue) {
  const local = isObjectLike(localValue) ? localValue : {};
  const remote = isObjectLike(remoteValue) ? remoteValue : {};
  const out = {};

  const typeKeys = new Set([...Object.keys(remote), ...Object.keys(local)]);
  typeKeys.forEach((type) => {
    const localArr = Array.isArray(local[type]) ? local[type] : [];
    const remoteArr = Array.isArray(remote[type]) ? remote[type] : [];
    const merged = [...localArr, ...remoteArr]
      .filter(entry => entry && typeof entry === 'object')
      .reduce((map, entry) => {
        const key = `${entry.username || ''}|${entry.score || 0}|${entry.timestamp || ''}|${entry.eventName || ''}`;
        if (!map.has(key)) map.set(key, entry);
        return map;
      }, new Map());
    out[type] = Array.from(merged.values())
      .sort((a, b) => asNumber(b.score, 0) - asNumber(a.score, 0))
      .slice(0, 100);
  });

  return out;
}

function mergeDailyData(localValue, remoteValue) {
  const local = isObjectLike(localValue) ? localValue : {};
  const remote = isObjectLike(remoteValue) ? remoteValue : {};
  const localDate = local.date || '';
  const remoteDate = remote.date || '';

  if (!localDate) return deepClone(remote);
  if (!remoteDate) return deepClone(local);
  if (localDate !== remoteDate) {
    return (new Date(localDate).getTime() >= new Date(remoteDate).getTime()) ? deepClone(local) : deepClone(remote);
  }

  const localChallenges = Array.isArray(local.challenges) ? local.challenges : [];
  const remoteChallenges = Array.isArray(remote.challenges) ? remote.challenges : [];
  const byType = new Map();
  [...remoteChallenges, ...localChallenges].forEach((challenge) => {
    if (!challenge || !challenge.type) return;
    const prev = byType.get(challenge.type) || {};
    byType.set(challenge.type, {
      ...prev,
      ...challenge,
      progress: Math.max(asNumber(prev.progress, 0), asNumber(challenge.progress, 0)),
      completed: !!prev.completed || !!challenge.completed
    });
  });

  const challenges = Array.from(byType.values());
  return {
    date: localDate,
    challenges,
    completed: !!local.completed || !!remote.completed || (challenges.length > 0 && challenges.every(c => c.completed))
  };
}

function mergeDailyStreakData(localValue, remoteValue) {
  const local = isObjectLike(localValue) ? localValue : {};
  const remote = isObjectLike(remoteValue) ? remoteValue : {};
  const localTime = new Date(local.lastComplete || 0).getTime() || 0;
  const remoteTime = new Date(remote.lastComplete || 0).getTime() || 0;

  return {
    current: Math.max(asNumber(local.current, 0), asNumber(remote.current, 0)),
    best: Math.max(asNumber(local.best, 0), asNumber(remote.best, 0)),
    lastComplete: localTime >= remoteTime ? (local.lastComplete || '') : (remote.lastComplete || '')
  };
}

function mergeCalendarData(localValue, remoteValue) {
  const local = isObjectLike(localValue) ? localValue : {};
  const remote = isObjectLike(remoteValue) ? remoteValue : {};
  const out = {};

  const dayKeys = new Set([...Object.keys(remote), ...Object.keys(local)]);
  dayKeys.forEach((day) => {
    const l = isObjectLike(local[day]) ? local[day] : {};
    const r = isObjectLike(remote[day]) ? remote[day] : {};
    out[day] = {
      wordsLearned: Math.max(asNumber(l.wordsLearned, 0), asNumber(r.wordsLearned, 0)),
      reviewsDone: Math.max(asNumber(l.reviewsDone, 0), asNumber(r.reviewsDone, 0)),
      score: Math.max(asNumber(l.score, 0), asNumber(r.score, 0)),
      dailyCompleted: !!l.dailyCompleted || !!r.dailyCompleted
    };
  });

  return out;
}

function mergeEventProgressData(localValue, remoteValue) {
  const local = isObjectLike(localValue) ? localValue : {};
  const remote = isObjectLike(remoteValue) ? remoteValue : {};
  const out = {};

  const eventKeys = new Set([...Object.keys(remote), ...Object.keys(local)]);
  eventKeys.forEach((eventId) => {
    const l = isObjectLike(local[eventId]) ? local[eventId] : {};
    const r = isObjectLike(remote[eventId]) ? remote[eventId] : {};
    out[eventId] = {
      wordsLearned: uniqStrings([...(Array.isArray(r.wordsLearned) ? r.wordsLearned : []), ...(Array.isArray(l.wordsLearned) ? l.wordsLearned : [])]),
      challengesCompleted: uniqStrings([...(Array.isArray(r.challengesCompleted) ? r.challengesCompleted : []), ...(Array.isArray(l.challengesCompleted) ? l.challengesCompleted : [])])
    };
  });

  return out;
}

function mergeIdentityProfilesData(localValue, remoteValue) {
  const local = isObjectLike(localValue) ? localValue : {};
  const remote = isObjectLike(remoteValue) ? remoteValue : {};
  const out = {};

  const profileKeys = new Set([...Object.keys(remote), ...Object.keys(local)]);
  profileKeys.forEach((key) => {
    const l = isObjectLike(local[key]) ? local[key] : {};
    const r = isObjectLike(remote[key]) ? remote[key] : {};
    const lStats = isObjectLike(l.stats) ? l.stats : {};
    const rStats = isObjectLike(r.stats) ? r.stats : {};
    const createdAt = Math.min(
      asNumber(l.createdAt, Number.MAX_SAFE_INTEGER),
      asNumber(r.createdAt, Number.MAX_SAFE_INTEGER)
    );

    out[key] = {
      nickname: l.nickname || r.nickname || key,
      birthday: l.birthday || r.birthday || '',
      createdAt: Number.isFinite(createdAt) && createdAt !== Number.MAX_SAFE_INTEGER ? createdAt : Date.now(),
      lastLoginAt: Math.max(asNumber(l.lastLoginAt, 0), asNumber(r.lastLoginAt, 0)),
      stats: {
        totalSessions: Math.max(asNumber(lStats.totalSessions, 0), asNumber(rStats.totalSessions, 0)),
        learnSessions: Math.max(asNumber(lStats.learnSessions, 0), asNumber(rStats.learnSessions, 0)),
        reviewSessions: Math.max(asNumber(lStats.reviewSessions, 0), asNumber(rStats.reviewSessions, 0)),
        totalQuestions: Math.max(asNumber(lStats.totalQuestions, 0), asNumber(rStats.totalQuestions, 0)),
        totalScore: Math.max(asNumber(lStats.totalScore, 0), asNumber(rStats.totalScore, 0))
      }
    };
  });

  return out;
}

function mergeReportArchiveData(localValue, remoteValue) {
  const local = Array.isArray(localValue) ? localValue : [];
  const remote = Array.isArray(remoteValue) ? remoteValue : [];
  const map = new Map();

  [...remote, ...local].forEach((item) => {
    if (!item || typeof item !== 'object') return;
    const key = item.id || `${item.month || ''}|${item.createdAt || ''}`;
    if (!key) return;

    if (!map.has(key)) {
      map.set(key, item);
      return;
    }

    const prev = map.get(key);
    const prevLen = typeof prev?.html === 'string' ? prev.html.length : 0;
    const nextLen = typeof item?.html === 'string' ? item.html.length : 0;
    if (nextLen > prevLen) map.set(key, item);
  });

  return Array.from(map.values())
    .filter(item => item && item.month && item.createdAt && item.html)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, MAX_REPORT_ARCHIVE);
}

function mergeCloudDataForKey(key, localValue, remoteValue) {
  if (typeof localValue === 'undefined') return deepClone(remoteValue);
  if (typeof remoteValue === 'undefined') return deepClone(localValue);

  switch (key) {
    case 'englishAppProgress':
      return mergeProgressData(localValue, remoteValue);
    case 'englishAppReview':
      return mergeReviewData(localValue, remoteValue);
    case 'englishAppLeaderboard':
      return mergeLeaderboardData(localValue, remoteValue);
    case 'englishAppDaily':
      return mergeDailyData(localValue, remoteValue);
    case 'englishAppDailyStreak':
      return mergeDailyStreakData(localValue, remoteValue);
    case 'englishAppCalendar':
      return mergeCalendarData(localValue, remoteValue);
    case 'englishAppEventProgress':
      return mergeEventProgressData(localValue, remoteValue);
    case 'achievements':
      return uniqStrings([...(Array.isArray(remoteValue) ? remoteValue : []), ...(Array.isArray(localValue) ? localValue : [])]);
    case 'perfectScores':
      return Math.max(asNumber(localValue, 0), asNumber(remoteValue, 0));
    case 'englishAppMonthlyHtmlReports':
      return mergeReportArchiveData(localValue, remoteValue);
    case 'englishAppIdentityProfiles':
      return mergeIdentityProfilesData(localValue, remoteValue);
    case 'englishAppActiveIdentity':
    case 'englishAppUsername':
      return (typeof localValue === 'string' && localValue.trim()) ? localValue : remoteValue;
    default:
      if (Array.isArray(localValue) && Array.isArray(remoteValue)) {
        return Array.from(new Set([...remoteValue, ...localValue]));
      }
      if (isObjectLike(localValue) && isObjectLike(remoteValue)) {
        return { ...remoteValue, ...localValue };
      }
      return localValue;
  }
}

function mergeCloudPayload(localPayload, remotePayload) {
  const localData = isObjectLike(localPayload?.data) ? localPayload.data : {};
  const remoteData = isObjectLike(remotePayload?.data) ? remotePayload.data : {};
  const mergedData = {};

  const keys = new Set([...Object.keys(remoteData), ...Object.keys(localData), ...CLOUD_SYNC_KEYS]);
  keys.forEach((key) => {
    mergedData[key] = mergeCloudDataForKey(key, localData[key], remoteData[key]);
  });

  return {
    meta: {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      identityKey: localPayload?.meta?.identityKey || remotePayload?.meta?.identityKey || '',
      nickname: localPayload?.meta?.nickname || remotePayload?.meta?.nickname || 'Anonymous',
      source: 'merge-local-remote'
    },
    data: mergedData
  };
}

function getCloudNickname() {
  const activeKey = localStorage.getItem(ACTIVE_IDENTITY_KEY);
  const store = loadIdentityStore();
  if (activeKey && store[activeKey]?.nickname) return store[activeKey].nickname;

  const typed = normalizeNickname(document.getElementById('usernameInput')?.value || '');
  if (typed) return typed;

  return (localStorage.getItem(USERNAME_KEY_FALLBACK) || 'Anonymous').trim() || 'Anonymous';
}

function buildCloudPayload(identityKey, nickname) {
  const data = {};
  CLOUD_SYNC_KEYS.forEach((key) => {
    const value = readStorageValue(key);
    if (typeof value !== 'undefined') data[key] = value;
  });

  return {
    meta: {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      identityKey: identityKey || '',
      nickname,
      source: 'browser'
    },
    data
  };
}

function applyCloudPayload(payload) {
  if (!payload || typeof payload !== 'object' || !payload.data || typeof payload.data !== 'object') {
    throw new Error('Invalid cloud payload format.');
  }

  CLOUD_SYNC_KEYS.forEach((key) => {
    if (!(key in payload.data)) return;
    const value = payload.data[key];
    if (value === null || typeof value === 'undefined') {
      localStorage.removeItem(key);
      return;
    }

    if (typeof value === 'string') {
      localStorage.setItem(key, value);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  });

  restoreActiveIdentityFromStorage();
  if (typeof displayProgress === 'function') displayProgress();
  if (typeof updateReviewCountDisplay === 'function') updateReviewCountDisplay();
  if (typeof displayDailyChallenges === 'function') displayDailyChallenges();
  if (typeof checkAndDisplayEvent === 'function') checkAndDisplayEvent();
  if (typeof updateCalendarDisplay === 'function') updateCalendarDisplay();
  if (typeof displayLeaderboards === 'function') displayLeaderboards();
  if (typeof renderReportHistoryList === 'function') renderReportHistoryList();
}

let cloudSyncBusy = false;
function setCloudSyncBusy(isBusy) {
  cloudSyncBusy = !!isBusy;
  if (cloudPullBtn) cloudPullBtn.disabled = cloudSyncBusy;
  if (cloudPushBtn) cloudPushBtn.disabled = cloudSyncBusy;
  updateCloudSyncControlLabels();
}

function ensureSignedInForCloudSync() {
  if (!backendAuthState.backendEnabled) {
    setAuthStatusHint('伺服器尚未完成帳號雲端設定。', true);
    setCloudSyncHint('伺服器尚未完成帳號雲端設定。', true);
    return false;
  }
  if (!backendAuthState.signedIn) {
    setAuthStatusHint('請先登入 Gmail。');
    setCloudSyncHint('請先登入 Gmail。');
    return false;
  }
  return true;
}

function shouldAutoCloudSync() {
  return !!autoCloudSyncChk?.checked;
}

async function triggerAutoCloudSync(reason = 'session-complete') {
  if (!shouldAutoCloudSync()) return;

  if (!ensureSignedInForCloudSync()) return;

  setCloudSyncHint(`已啟用自動上傳，正在同步（${reason}）...`);
  await pushCloudSnapshot({ auto: true });
}

async function pullCloudSnapshot() {
  if (cloudSyncBusy) return;

  if (!ensureSignedInForCloudSync()) return;
  await pullCloudSnapshotFromBackend();
}

async function pushCloudSnapshot(options = {}) {
  if (cloudSyncBusy) return;

  if (!ensureSignedInForCloudSync()) return;
  await pushCloudSnapshotToBackend(options);
}

// Username handling
const saveUsernameBtn = document.getElementById('saveUsername');
if (saveUsernameBtn) {
  saveUsernameBtn.addEventListener('click', () => {
    const input = document.getElementById('usernameInput');
    const name = normalizeNickname(input?.value);
    if (!name) return;

    syncUsernameAcrossFeatures(name);
    const store = loadIdentityStore();
    const profile = store[name.toLowerCase()];
    if (profile) {
      localStorage.setItem(ACTIVE_IDENTITY_KEY, name.toLowerCase());
      const birthdayInput = document.getElementById('birthdayInput');
      if (birthdayInput && profile.birthday) birthdayInput.value = profile.birthday;
      setIdentityHint(`已登入：${profile.nickname}。`);
    } else {
      setIdentityHint(`已暫存名稱：${name}。請再填生日並完成 Gmail 註冊。`);
    }

    if (typeof showNotification === 'function') {
      showNotification('👤 名稱已更新', `目前名稱：${name}`);
    }
  });
}

if (registerProfileBtn) {
  registerProfileBtn.addEventListener('click', async () => {
    if (!backendAuthState.signedIn) {
      setIdentityHint('請先完成 Gmail 登入，再送出註冊。', true);
      return;
    }

    const usernameInput = document.getElementById('usernameInput');
    const birthdayInput = document.getElementById('birthdayInput');
    const result = await saveOrSignInIdentityProfile(
      usernameInput?.value,
      birthdayInput?.value,
      { googleEmail: getSignedInGoogleEmail() }
    );

    if (!result?.ok) return;
    setLearningAccess(true, result.profile, getSignedInGoogleEmail());
    resetIdentityInputFields();
  });
}

if (existingGoogleLoginBtn) {
  existingGoogleLoginBtn.addEventListener('click', async () => {
    await signInRegisteredByGoogleOnly();
  });
}

if (recoverNicknameBtn) {
  recoverNicknameBtn.addEventListener('click', async () => {
    await recoverNicknameForSignedInGoogle();
  });
}

if (birthdayInputField) {
  birthdayInputField.addEventListener('input', () => {
    birthdayInputField.value = birthdayInputField.value.replace(/\D/g, '').slice(0, 8);
  });
}

if (birthdayVisibilityToggle) {
  birthdayVisibilityToggle.addEventListener('change', () => {
    setBirthdayDigitsVisible(birthdayVisibilityToggle.checked);
  });
}

if (googleSignOutBtn) {
  googleSignOutBtn.addEventListener('click', async () => {
    await signOutBackendAccount();
  });
}

if (topUserLogoutBtn) {
  topUserLogoutBtn.addEventListener('click', async () => {
    await signOutBackendAccount();
  });
}

if (cloudPullBtn) {
  cloudPullBtn.addEventListener('click', async () => {
    await pullCloudSnapshot();
  });
}

if (cloudPushBtn) {
  cloudPushBtn.addEventListener('click', async () => {
    await pushCloudSnapshot();
  });
}

if (autoCloudSyncChk) {
  autoCloudSyncChk.checked = loadAutoCloudSyncPreference();
  autoCloudSyncChk.addEventListener('change', () => {
    saveAutoCloudSyncPreference(autoCloudSyncChk.checked);
    setCloudSyncHint(autoCloudSyncChk.checked
      ? '已啟用自動上傳，每次完成練習後會同步到帳號雲端。'
      : '已停用自動上傳。');
  });
}

if (reportMonthInput) {
  if (!reportMonthInput.value) reportMonthInput.value = currentYearMonth();
  reportMonthInput.addEventListener('change', () => {
    renderReportHistoryList();
  });
}

if (generateMonthlyReportBtn) {
  generateMonthlyReportBtn.addEventListener('click', () => {
    generateMonthlyReportSnapshot(reportMonthInput?.value || currentYearMonth(), true);
  });
}

if (openLatestReportBtn) {
  openLatestReportBtn.addEventListener('click', () => {
    openLatestReportForSelectedMonth();
  });
}

if (refreshReportHistoryBtn) {
  refreshReportHistoryBtn.addEventListener('click', () => {
    renderReportHistoryList();
  });
}

if (openDashboardBtn) {
  openDashboardBtn.addEventListener('click', () => {
    const dashboardUrl = './dashboards/spelling-analysis.html?v=20260406-4';
    const opened = window.open(dashboardUrl, '_blank', 'noopener');
    if (!opened) {
      window.location.href = dashboardUrl;
    }
  });
}

if (identityToggleBtn) {
  identityToggleBtn.addEventListener('click', () => {
    if (!appAccessGranted) return;
    identitySectionCollapsed = !identitySectionCollapsed;
    updateIdentitySectionVisibility();
  });
}

if (eventToggleBtn) {
  eventToggleBtn.addEventListener('click', () => {
    eventSectionCollapsed = !eventSectionCollapsed;
    localStorage.setItem(EVENT_SECTION_COLLAPSED_KEY, eventSectionCollapsed ? '1' : '0');
    updateEventSectionVisibility();
  });
}

renderReportHistoryList();
updateCloudSyncControlLabels();
initVoiceSelector();
applyIdentityInputPlaceholders();
setBirthdayDigitsVisible(false);
setLearningAccess(false);

restoreActiveIdentityFromStorage();

initBackendAccountSync().catch((err) => {
  setAuthStatusHint(err?.message || '後端登入初始化失敗，請重新整理後再試。', true);
  setLearningAccess(false);
});

// Update leaderboard on session completion
function updateLeaderboardsOnFinish() {
    const progress = getProgress();
    const totalWords = Object.values(progress)
        .reduce((sum, level) => 
            sum + Object.values(level)
                .reduce((s, cat) => s + cat.correct, 0), 0);

  if (typeof updateLeaderboards === 'function') {
    updateLeaderboards('words', { total: totalWords });

    const streak = (typeof getDailyStreak === 'function') ? getDailyStreak() : { current: 0 };
    updateLeaderboards('streak', { current: streak.current });

    if (session.score === session.words.length && session.words.length >= 5) {
      const perfectScores = parseInt(localStorage.getItem('perfectScores') || '0') + 1;
      localStorage.setItem('perfectScores', perfectScores.toString());
      updateLeaderboards('perfect', { count: perfectScores });
    }
  }
}

// Update event leaderboard
function updateEventLeaderboard(eventId) {
  if (typeof EVENTS !== 'undefined' && EVENTS[eventId]) {
    const event = EVENTS[eventId];
    const progress = (typeof getEventProgress === 'function') ? getEventProgress(eventId) : null;
    if (typeof updateLeaderboards === 'function') {
      updateLeaderboards('event', {
        eventName: event.name,
        progress: progress
      });
    }
  }
}

// initialization
loadVocab();
displayProgress(); // Show initial progress
displayDailyChallenges(); // Show daily challenges
checkAndDisplayEvent(); // Check for seasonal events
if (typeof updateCalendarDisplay === 'function') updateCalendarDisplay(); // Initialize calendar if available
if (typeof displayLeaderboards === 'function') displayLeaderboards(); // Show leaderboards if available

// ------- Dynamic category options by level -------
function prettyCategoryLabel(key) {
  const MAP = {
    // Cambridge-style categories (exact keys from vocab.json)
    animals: '🐾 Animals',
    the_body_and_the_face: '👤 Body & Face',
    clothes: '👕 Clothes',
    colours: '🎨 Colours',
    family_and_friends: '👨‍👩‍👧‍👦 Family & Friends',
    food_and_drink: '🍽️ Food & Drink',
    the_home: '🏡 Home',
    materials: '🧱 Materials',
    names: '✨ Names',
    numbers: '🔢 Numbers',
    places_and_directions: '📍 Places & Directions',
    school: '🏫 School',
    sports_and_leisure: '⚽ Sports & Leisure',
    time: '⏰ Time',
    toys: '🧸 Toys',
    transport: '🚗 Transport',
    weather: '⛅ Weather',
    work: '💼 Work',
    the_world_around_us: '🌍 The World Around Us',
    health: '🏥 Health',
    // Legacy/custom keys (kept for compatibility; shown if present)
    colors_shapes: '🎨 Colors & Shapes',
    toys_games: '🧸 Toys & Games',
    school_classroom: '🏫 School & Classroom',
    body_face: '👤 Body & Face',
    food_drinks: '🍽️ Food & Drinks',
    family: '👨‍👩‍👧‍👦 Family',
    places: '🏠 Places',
    weather_legacy: '⛅ Weather',
    people: '👥 People',
    actions: '🏃 Actions',
    home: '🏡 Home',
    nouns: '📝 Nouns',
    colors: '🎨 Colors',
    activities: '🎯 Activities',
    nature: '🌳 Nature',
    sports: '⚽ Sports',
    learning: '📚 Learning',
    descriptions: '✨ Descriptions',
    education: '🎓 Education',
    environment: '🌍 Environment',
    technology: '💻 Technology',
    jobs: '💼 Jobs',
    emotions: '😊 Emotions',
    travel: '✈️ Travel',
    communication: '💬 Communication'
  };
  if (MAP[key]) return MAP[key];
  // Title-case and replace underscores as a fallback
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function updateCategoryOptions(level) {
  const select = document.getElementById('categorySelect');
  if (!select) {
    console.error('❌ categorySelect element not found');
    return;
  }
  if (!vocab || !vocab[level]) {
    console.warn('⚠️ No vocab available for level:', level);
    select.innerHTML = '<option value="">No categories available</option>';
    return;
  }
  const categories = Object.keys(vocab[level]);
  console.log(`📝 Updating categories for ${level}:`, categories);
  console.log(`🗑️ Clearing old options (had ${select.options.length} options)`);
  
  // Clear all existing options
  select.innerHTML = '';
  
  // Add new options
  categories.forEach(c => {
    const option = document.createElement('option');
    option.value = c;
    const items = Array.isArray(vocab[level][c]) ? vocab[level][c] : [];
    const count = items.length || 0;
    option.textContent = `${prettyCategoryLabel(c)} (${count})`;
    select.appendChild(option);
  });
  
  console.log(`✅ Added ${select.options.length} new options`);
  
  // Select first category
  if (categories.length > 0) {
    select.value = categories[0];
    console.log(`👉 Selected category: ${select.value}`);
  }
}

// Event listener is now added inside loadVocab() function to ensure vocab is loaded first
// Kiwi logo two-stage popup logic
(function() {
  const kiwiLogo = document.querySelector('.kiwi-logo');
  const popup1 = document.getElementById('kiwi-popup-stage1');
  const popup2 = document.getElementById('kiwi-popup-stage2');
  if (!kiwiLogo || !popup1 || !popup2) return;

  let popupTimeout;

  function showPopup(stage) {
    popup1.classList.remove('active');
    popup2.classList.remove('active');
    if (stage === 1) {
      popup1.classList.add('active');
    } else if (stage === 2) {
      popup2.classList.add('active');
    }
  }
  function hidePopups() {
    popup1.classList.remove('active');
    popup2.classList.remove('active');
  }

  kiwiLogo.addEventListener('mouseenter', function() {
    showPopup(1);
    clearTimeout(popupTimeout);
    popupTimeout = setTimeout(() => {
      showPopup(2);
    }, 1200);
  });
  kiwiLogo.addEventListener('mouseleave', function() {
    hidePopups();
    clearTimeout(popupTimeout);
  });
  kiwiLogo.addEventListener('focus', function() {
    showPopup(1);
    clearTimeout(popupTimeout);
    popupTimeout = setTimeout(() => {
      showPopup(2);
    }, 1200);
  });
  kiwiLogo.addEventListener('blur', function() {
    hidePopups();
    clearTimeout(popupTimeout);
  });
  kiwiLogo.addEventListener('click', function() {
    showPopup(2);
    clearTimeout(popupTimeout);
    popupTimeout = setTimeout(hidePopups, 1500);
  });
})();
