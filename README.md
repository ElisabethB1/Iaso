# Iaso — Health Information Assistant

A conversational health AI built on Mistral, with emergency intercept, warm UI, and secure API key handling.

---

## Deploy to Vercel in 5 steps

### Step 1 — Install dependencies
```bash
npm install
```

### Step 2 — Set up your environment variables
```bash
cp .env.example .env.local
```
Open `.env.local` and fill in:
```
MISTRAL_API_KEY=your_key_here
MISTRAL_AGENT_ID=ag_019ec2d1e57775ddaf7da731e882f15d
```

### Step 3 — Test locally
```bash
npm run dev
```
Open http://localhost:3000 — you should see Iaso running.

### Step 4 — Push to GitHub
1. Create a new repository on github.com (name it `iaso` or similar)
2. In this folder, run:
```bash
git init
git add .
git commit -m "Initial Iaso build"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### Step 5 — Deploy on Vercel
1. Go to vercel.com and sign in with GitHub
2. Click "Add New Project"
3. Select your iaso repository
4. Under "Environment Variables", add:
   - `MISTRAL_API_KEY` → your key
   - `MISTRAL_AGENT_ID` → ag_019ec2d1e57775ddaf7da731e882f15d
5. Click Deploy

You'll get a live URL in about 60 seconds.

---

## Project structure

```
iaso/
├── pages/
│   ├── index.js          # Main chat UI
│   └── api/
│       └── chat.js       # Backend proxy — API key lives here, never in browser
├── lib/
│   └── emergencyIntercept.js  # Pre-LLM safety layer
├── styles/
│   ├── globals.css
│   └── Chat.module.css
├── .env.example          # Template — copy to .env.local
├── .gitignore            # Keeps .env.local out of GitHub
└── package.json
```

## Security note
Your Mistral API key is stored in `.env.local` (never committed to git) and used only in `pages/api/chat.js` which runs server-side. The browser never sees the key.
