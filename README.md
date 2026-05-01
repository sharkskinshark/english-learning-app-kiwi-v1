# 🥝 Cambridge Vocabulary Practice

Web app for English language learners to practice Cambridge YLE vocabulary through spelling, meaning, and phonics exercises.

🌐 **Live:** [english-learning-app-kiwi-v1.vercel.app](https://english-learning-app-kiwi-v1.vercel.app)

## ✨ Features

- **Three levels** — Starters, Movers, Flyers with categorized vocabulary
- **Four practice modes** — Spelling, Meaning Match, Phonics, Learn New Words
- **Progress tracking** — Streaks, mastered words, achievements, calendar view, leaderboard
- **Gmail sign-in + cloud sync** — Save progress across devices via Vercel Functions backend
- **Seasonal events** — Themed animations and vocabulary for major holidays
- **Full Shields Goal intro** — Animated entry experience that maps progress to a 3 × 5 shield board
- **Text-to-speech** — Native English pronunciation via Web Speech API
- **Mobile-friendly** — Responsive layout for phone, tablet, desktop

## 🚀 Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

> Local preview cannot reach the Gmail sign-in service. Use the deployed Vercel URL to test sign-in, registration, and cloud sync end to end.

## 🚢 Deployment

The repo deploys to Vercel automatically on push to `main`. Backend functions in `api/` run on Vercel Functions. Deployment configuration lives in `vercel.json`.

## 📁 Structure

```text
.
├── index.html              # Main page
├── styles.css              # Styling
├── app.js                  # Practice flow + identity / cloud sync glue
├── achievements.js         # Achievement definitions
├── calendar.js             # Calendar view
├── daily.js                # Daily challenges & streaks
├── environment.js          # Roaming kiwi family
├── events.js               # Seasonal event scheduling
├── goal-intro.js           # Full-shields entry animation
├── leaderboard.js          # Leaderboard rendering
├── review.js               # Review system for missed words
├── vocab.json              # Cambridge vocabulary database
├── api/                    # Vercel serverless functions
│   ├── auth/               #   Gmail OAuth + session
│   ├── leaderboard/        #   Leaderboard read/write
│   ├── sync/               #   Cloud sync push/pull
│   └── _lib/               #   Shared backend helpers
├── dashboards/             # Internal analysis dashboards
├── user-data/              # Sample identity data
├── vercel.json             # Vercel deploy config
└── package.json
```

## 🔒 Privacy

- Personal progress is stored in browser `localStorage` by default
- Gmail sign-in is optional and only used to power cloud sync + leaderboard identity
- No third-party analytics beyond Vercel Speed Insights
- Web Speech API runs locally in the browser; no audio is uploaded

## 📄 License

[MIT](LICENSE) — free for personal, educational, and commercial use with attribution.
