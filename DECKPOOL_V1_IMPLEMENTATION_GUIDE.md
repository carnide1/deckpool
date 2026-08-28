# DeckPool V1 — Step-by-Step Implementation Guide

**Companion to:** `DECKPOOL_V1_BLUEPRINT.md` (product/technical source of truth)  
**Last updated:** 2026-08-27
**Working folder:** `C:\DeckPool`

This guide is written so you can execute V1 with **minimal back-and-forth**. When the blueprint and this guide disagree, **the blueprint wins** — then update this guide.

> **Current-code note:** This is the original build plan, not a live implementation
> reference. For the behavior currently shipped in the repository, use
> `DECKPOOL_CODEBASE.md`. In particular, Collection is an owned-only binder,
> `/cards` uses facet/name filtering rather than the query-language parser, and
> deck status badges use the favorite variation.

---

## How to read this guide

Each step uses the same labels:

| Label | Meaning |
|---|---|
| **Owner** | **YOU** = human in browser/terminal. **AGENT** = Cursor agent implements code. **BOTH** = you run a command or click UI, agent writes/configures the rest. |
| **Purpose** | What this step achieves in the build. |
| **What to do** | Exact actions — clicks, commands, files. |
| **Why** | Product or engineering reason. |
| **Why this way** | Why this order/approach vs alternatives. |
| **Done when** | Objective completion criteria — do not skip to the next step until these pass. |

**Locked defaults** (blueprint gaps resolved here so you do not need to decide mid-build):

| Topic | Default for V1 |
|---|---|
| Decks list Legal/Owned summary | **Any variation**: show Legal if **any** variation is Legal; Owned if **any** variation is Owned (optimistic summary on the row). |
| Builder URL sync | Search state in **component state** only (blueprint allows this). `/cards` **must** URL-sync `q` and `owned`. |
| Remove copies in Builder | **Minus button** on each manifest line; clicking a search result **adds +1** only. |
| Deck rename / delete | **In V1**: rename inline or modal; delete with confirm dialog. |
| Email verification | **Not required** (Diligence-style open signup). |
| Starter product ingest failure | **Hard fail** — do not ship until all ST01–ST36 ingest (blueprint §5.2.2). |
| TreasureRare search token | Rarity `treasure` (not `tr`) to avoid collision with `trigger:` alias `tr:`. |
| Fonts | **Fredoka** (display) + **Nunito** (body) via `next/font/google`. |
| Preview deploys + Firebase Auth | Add **`localhost`** (default) + your **production** `*.vercel.app` domain only. Do **not** add bare `vercel.app` (security risk for shared parent domain). |

---

## Phase overview — who does what

| Phase | Name | Primary owner | Approx. effort | Blocks |
|---|---|---|---|---|
| **0** | Machine prerequisites | **YOU** | 30–60 min once | Everything |
| **1** | Git repo + folder | **YOU** | 15 min | Deploy, backup |
| **2** | Firebase project (console) | **YOU** | 20–30 min | Auth, Firestore |
| **3** | App scaffold (greenfield Next.js) | **AGENT** | 1 session | All UI |
| **4** | Firestore rules + local env | **BOTH** | 30 min | Any write to DB |
| **5** | Catalog ingest (`cards.json`) | **AGENT** (+ YOU runs npm) | 1 session | Search, Collection |
| **6** | Product ingest (ST01–ST36) | **AGENT** (+ YOU runs npm) | 1 session | Starter picker |
| **7** | Auth pages + AuthGate | **AGENT** | 1 session | App pages |
| **8** | Theme + AppShell + nav | **AGENT** | 1 session | All surfaces |
| **9** | Collection page | **AGENT** | 1 session | Builder owned toggle |
| **10** | Cards browser + search URL | **AGENT** | 1–2 sessions | Search UX |
| **11** | Decks list + create | **AGENT** | 1 session | Builder |
| **12** | Builder + legality + variations | **AGENT** | 2 sessions | V1 core |
| **13** | Profile + stats | **AGENT** | ½ session | Success criteria §13 |
| **14** | Unit tests (search + legality) | **AGENT** | 1 session | Confidence |
| **15** | GitHub + Vercel deploy | **YOU** (+ AGENT fixes build) | 30–45 min | Production |
| **16** | Production Firebase auth domain | **YOU** | 5 min | Login on live URL |
| **17** | End-to-end verification | **YOU** | 1–2 hrs | Ship |

**Recommended execution pattern**

1. Complete **Phases 0–2** yourself in one sitting (accounts + Firebase).
2. Ask the agent: *“Implement DeckPool Phase 3–14 per DECKPOOL_V1_IMPLEMENTATION_GUIDE.md”* — ideally phase-by-phase or in groups (3–8, 9–12, 13–14).
3. You run **Phases 15–17** when the app works on `localhost:3000`.

---

## Phase 0 — Machine prerequisites

### Step 0.1 — Install Node.js (LTS)

| | |
|---|---|
| **Owner** | **YOU** |
| **Purpose** | Run Next.js, npm scripts, and ingest tools locally. |
| **What to do** | 1. Open https://nodejs.org/ 2. Download **LTS** (20.x or 22.x). 3. Run the installer; keep **“Add to PATH”** checked. 4. Open **PowerShell** (Win + X → Terminal or Windows PowerShell). 5. Run: `node -v` and `npm -v`. |
| **Why** | DeckPool uses npm (not Yarn) and Next.js 16. |
| **Why this way** | Matches Diligence; blueprint locks npm + `package-lock.json`. |
| **Done when** | `node -v` prints v20+ or v22+; `npm -v` prints 10+. |

---

### Step 0.2 — Install Git

| | |
|---|---|
| **Owner** | **YOU** |
| **Purpose** | Version control and Vercel Git deploy. |
| **What to do** | 1. https://git-scm.com/download/win → download and install. 2. In PowerShell: `git --version`. |
| **Why** | Vercel deploys from GitHub; blueprint expects a normal repo. |
| **Why this way** | Simplest path to preview/production URLs. |
| **Done when** | `git --version` succeeds. |

---

### Step 0.3 — Install Firebase CLI

| | |
|---|---|
| **Owner** | **YOU** |
| **Purpose** | Deploy Firestore security rules from `firestore.rules`. |
| **What to do** | In PowerShell: `npm install -g firebase-tools` then `firebase --version`. |
| **Why** | Blueprint requires rules deployed **before** client writes (production mode denies otherwise). |
| **Why this way** | Same as Diligence; no Admin SDK in V1. |
| **Done when** | `firebase --version` prints 13.x or 14.x. |

---

### Step 0.4 — Firebase CLI login

| | |
|---|---|
| **Owner** | **YOU** |
| **Purpose** | Authenticate CLI to your Google account for `firebase deploy`. |
| **What to do** | 1. Run: `firebase login` 2. Browser opens → pick the Google account you will use for DeckPool. 3. Click **Allow** when Google asks for Firebase CLI permissions. 4. Terminal should print: *Success! Logged in as …* |
| **Why** | Required for deploying rules to **your** new project (not Diligence’s). |
| **Why this way** | One-time; no service account JSON needed for V1. |
| **Done when** | `firebase login:list` shows your account. |

---

### Step 0.5 — (Optional) Diligence as reference only

| | |
|---|---|
| **Owner** | **YOU** (optional) |
| **Purpose** | Peek at a working sibling app if auth/Firestore wiring is unfamiliar. |
| **What to do** | If `C:\Diligence` exists, you may open `ARCHITECTURE.md` or `lib/firebase.ts` **for ideas**. **Do not** copy files one-to-one into DeckPool. |
| **Why** | Blueprint §9.1 says same **structure** (folder shape, AuthGate pattern, nested Firestore) — not a fork of Diligence. |
| **Why this way** | Greenfield `create-next-app` + blueprint is enough; Diligence is optional reading. |
| **Done when** | Skipped entirely, or you know where to look if stuck on AuthGate/Firestore nesting. |

---

## Phase 1 — Git repository

### Step 1.1 — Initialize DeckPool git repo

| | |
|---|---|
| **Owner** | **BOTH** (you run git; agent may add `.gitignore` during scaffold) |
| **Purpose** | Track code; connect to GitHub later. |
| **What to do** | In PowerShell: `cd C:\DeckPool` then: `git init` `git branch -M main` |
| **Why** | Vercel imports from GitHub; blueprint repo path is `C:\DeckPool`. |
| **Why this way** | `main` is Vercel’s default production branch. |
| **Done when** | `git status` runs without error inside `C:\DeckPool`. |

---

### Step 1.2 — Create GitHub repository

| | |
|---|---|
| **Owner** | **YOU** |
| **Purpose** | Remote for Vercel Git integration. |
| **What to do** | 1. Open https://github.com/new 2. **Repository name:** `deckpool` (or your choice). 3. **Visibility:** Private recommended. 4. **Do not** check “Add a README” (folder already has blueprint). 5. Click **Create repository**. 6. Copy the HTTPS URL shown (e.g. `https://github.com/YOUR_USER/deckpool.git`). 7. In PowerShell from `C:\DeckPool`: `git remote add origin https://github.com/YOUR_USER/deckpool.git` |
| **Why** | Vercel “Import Git Repository” needs a remote. |
| **Why this way** | Private repo keeps Firebase config workflow under your control; env vars still go in Vercel, not git. |
| **Done when** | `git remote -v` shows `origin` → your GitHub URL. |

---

## Phase 2 — Firebase project (Google Cloud console)

Use a **new** Firebase project. Do **not** reuse Diligence `diligence-38744`.

### Step 2.1 — Create Firebase project

| | |
|---|---|
| **Owner** | **YOU** |
| **Purpose** | Isolated Auth + Firestore for DeckPool. |
| **What to do** | 1. Go to https://console.firebase.google.com/ 2. Sign in with Google. 3. Click **Create a project** (or **Add project** on the project list page). 4. **Project name:** `deckpool` (display name; ID will auto-generate, e.g. `deckpool-a1b2c`). 5. Click **Continue**. 6. **Google Analytics:** optional for V1 — toggle **off** to keep setup minimal (you can enable later). 7. Click **Create project**. 8. Wait for provisioning spinner; click **Continue** when dashboard loads. |
| **Why** | Blueprint §3: new Firebase project, open signup, nested `users/{uid}`. |
| **Why this way** | Separates DeckPool data/billing from Diligence. |
| **Done when** | Firebase console shows project overview with project name **deckpool** (or your chosen name). **Write down the Project ID** (gear icon → **Project settings** → **General** → **Project ID**). |

---

### Step 2.2 — Register Web app and copy config

| | |
|---|---|
| **Owner** | **YOU** |
| **Purpose** | Get `NEXT_PUBLIC_FIREBASE_*` values for `.env.local`. |
| **What to do** | 1. On project **Overview**, click the **Web** icon (`</>`) under “Get started by adding Firebase to your app”. 2. **App nickname:** `deckpool-web`. 3. **Firebase Hosting:** leave **unchecked** (Vercel hosts the site). 4. Click **Register app**. 5. Copy the `firebaseConfig` object fields: `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`. 6. Click **Continue to console** (SDK snippet can be ignored — agent uses npm `firebase` package). |
| **Why** | Client SDK init requires these public keys. |
| **Why this way** | Standard Firebase web setup; matches Diligence env names in blueprint §9.5. |
| **Done when** | You have all six values saved in a local note (Notepad — **not** committed to git). |

---

### Step 2.3 — Enable Email/Password authentication

| | |
|---|---|
| **Owner** | **YOU** |
| **Purpose** | Sign up, login, password reset (blueprint §3). |
| **What to do** | 1. Left sidebar: **Build** → **Authentication**. 2. Click **Get started** (first time only). 3. Open tab **Sign-in method**. 4. In **Native providers**, click **Email/Password**. 5. Toggle **Enable** ON. 6. Leave **Email link (passwordless sign-in)** OFF. 7. Click **Save**. |
| **Why** | Blueprint: email/password only; no Google/Apple OAuth in V1. |
| **Why this way** | Simplest auth; same as Diligence. |
| **Done when** | Sign-in method list shows **Email/Password** as **Enabled**. |

---

### Step 2.4 — Create Firestore database

| | |
|---|---|
| **Owner** | **YOU** |
| **Purpose** | Store `users/{uid}/collection`, `decks`, `cardPrefs`. |
| **What to do** | 1. Left sidebar: **Build** → **Firestore Database**. 2. Click **Create database**. 3. **Edition:** choose **Standard** (default) → **Next**. 4. **Database ID:** `(default)` → **Next**. 5. **Location:** pick a region close to you (e.g. `nam5 (United States)` or `us-east1`) — **cannot change later** → **Next**. 6. **Secure rules:** select **Start in production mode** (deny all until rules deploy) → **Create**. |
| **Why** | Blueprint §9.3: nested user tree; rules owner-only. |
| **Why this way** | Production mode forces you to deploy rules before testing writes — avoids accidental public data. |
| **Done when** | Firestore **Data** tab loads (empty). **Rules** tab shows default deny-all temporary rules. |

---

### Step 2.5 — Note authorized domains (configure again after deploy)

| | |
|---|---|
| **Owner** | **YOU** (read now; full action in Phase 16) |
| **Purpose** | Know where login will work. |
| **What to do** | 1. **Authentication** → top tab **Settings** (gear next to “Sign-in method” area) → section **Authorized domains**. 2. Confirm **`localhost`** is listed (default). 3. Do **not** add domains yet unless you know your final Vercel URL. |
| **Why** | Firebase Auth rejects sign-in from unlisted domains (`auth/unauthorized-domain`). |
| **Why this way** | Local dev works immediately; production domain added after first Vercel deploy. |
| **Done when** | You see `localhost` in the list. |

---

## Phase 3 — App scaffold (agent)

**You do not need to copy Diligence.** The blueprint asks for the same **architecture** (Next App Router, Tailwind 4, Firebase client SDK, AuthGate, nested `users/{uid}`, provider tree). That is implemented fresh with `create-next-app` + `npm install`, following `DECKPOOL_V1_BLUEPRINT.md` §9.1.

**Path A (default): greenfield scaffold** — use this unless you have a strong reason not to.

**Path B (optional):** glance at `C:\Diligence` for one file (e.g. how `AuthGate` redirects) while writing your own. Never bulk-copy the repo.

---

### Step 3.1 — Create Next.js app + install dependencies

| | |
|---|---|
| **Owner** | **AGENT** (runs commands; you approve if prompted) |
| **Purpose** | Standard Next 16 + Tailwind 4 project with DeckPool’s dependency set. |
| **What to do (agent)** | From `C:\DeckPool` (repo may already contain blueprint `.md` files — that is fine): **1. Bootstrap Next.js** (non-interactive): ```powershell cd C:\DeckPool npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm ``` If the CLI complains the folder is not empty, answer **yes** to proceed in the current directory, or use a temp folder and move generated files into `C:\DeckPool` preserving the blueprint markdown files. **2. Pin stack** to match blueprint/Diligence: Next **16**, React **19**, Tailwind **4** (adjust `package.json` if the template pulled different majors). **3. Install app dependencies:** ```powershell npm install firebase react-hook-form @hookform/resolvers zod lucide-react react-hot-toast npm install -D tsx ``` **4. Add npm scripts** in `package.json`: `"test": "tsx --test lib/**/*.test.ts"` **5. Create empty folder skeleton** per blueprint §9.1: `components/ui/`, `contexts/`, `hooks/`, `lib/`, `types/`, `data/`, `scripts/`, `app/(app)/`, `app/login/`, `app/signup/`, `app/forgot-password/`. **6. Add config files** (write fresh, do not copy from Diligence): `firebase.json` (Firestore rules only), `firestore.rules` (blueprint §9.8), `.env.local.example` (blueprint §9.5), `.firebaserc` placeholder. **7. Stub minimal app:** `app/layout.tsx`, `app/page.tsx` (landing placeholder), `app/globals.css` (Tailwind entry — theme tokens come in Phase 8). |
| **Why** | You need a real Node project before Firebase wiring or ingest scripts. |
| **Why this way** | `create-next-app` gives correct Next/Tailwind/ESLint baseline in one step; avoids dragging Diligence habits/gym/cron into DeckPool. Same end shape, clean history. |
| **Done when (you verify)** | `cd C:\DeckPool` → `npm install` → `npm run dev` → `http://localhost:3000` shows the default or stub landing page with no crash. `package.json` lists `next`, `firebase`, `react-hook-form`, `zod`, `tsx`. |

---

### Step 3.1b — Wire Firebase + AuthGate skeleton (still Phase 3)

| | |
|---|---|
| **Owner** | **AGENT** |
| **Purpose** | Same **patterns** as Diligence (AuthGate, providers, `lib/firebase.ts`) — implemented as new DeckPool code. |
| **What to do (agent)** | Write (not copy-paste wholesale): `lib/firebase.ts` — init from `NEXT_PUBLIC_FIREBASE_*`; `contexts/AuthProvider.tsx` — `onAuthStateChanged`; `components/AuthGate.tsx` — public routes `/`, `/login`, `/signup`, `/forgot-password`; everything else requires auth; `app/(app)/layout.tsx` — shell placeholder. **No** `middleware.ts`. **No** `firebase-admin`, Resend, cron, or API routes in V1. Optionally read Diligence’s `AuthGate.tsx` for redirect logic, then rewrite for DeckPool routes (`/decks`, `/collection`). |
| **Why** | Blueprint requires client-side AuthGate and nested Firestore — this is the minimal vertical slice before feature pages. |
| **Why this way** | Structure matches Diligence; implementation is DeckPool-owned and easier to maintain than a partial fork. |
| **Done when** | App builds; logged-out visit to a future `/collection` path redirects to login (once that route exists). Firebase init does not throw when `.env.local` is filled (Phase 4). |

---

### Step 3.2 — Link Firebase project in repo

| | |
|---|---|
| **Owner** | **BOTH** |
| **Purpose** | CLI deploys rules to the correct project. |
| **What to do** | 1. Agent creates `.firebaserc`: `{ "projects": { "default": "YOUR_PROJECT_ID" } }` 2. **YOU** replace `YOUR_PROJECT_ID` with Project ID from Step 2.1 (or tell agent the ID). 3. **YOU** run from `C:\DeckPool`: `firebase use YOUR_PROJECT_ID` |
| **Why** | Prevents deploying rules to Diligence by mistake. |
| **Why this way** | `.firebaserc` is committed; project id is not secret. |
| **Done when** | `firebase projects:list` includes your project and `firebase use` shows it as active. |

---

## Phase 4 — Environment + Firestore rules

### Step 4.1 — Create `.env.local`

| | |
|---|---|
| **Owner** | **YOU** |
| **Purpose** | Local app talks to your Firebase project. |
| **What to do** | 1. Copy `C:\DeckPool\.env.local.example` → `.env.local` 2. Fill from Step 2.2: ``` NEXT_PUBLIC_FIREBASE_API_KEY=... NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=... NEXT_PUBLIC_FIREBASE_PROJECT_ID=... NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=... NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=... NEXT_PUBLIC_FIREBASE_APP_ID=... NEXT_PUBLIC_APP_URL=http://localhost:3000 ``` 3. Save. **Never commit `.env.local`.** |
| **Why** | Next.js reads `NEXT_PUBLIC_*` at build/dev time. |
| **Why this way** | Same variable names as Diligence — less confusion. |
| **Done when** | File exists; restarting `npm run dev` after save loads app with Firebase init (no “apiKey undefined” in browser console). |

---

### Step 4.2 — Deploy Firestore security rules

| | |
|---|---|
| **Owner** | **YOU** (run command) / **AGENT** (writes rules file) |
| **Purpose** | Allow each user to read/write only `users/{theirUid}/**`. |
| **What to do** | 1. Confirm `firestore.rules` matches blueprint §9.8 (owner-only nested match). 2. In PowerShell: `cd C:\DeckPool` `firebase deploy --only firestore:rules` 3. Confirm CLI prints **Deploy complete**. 4. In Firebase console → **Firestore Database** → **Rules** tab → verify published rules show `isOwner(uid)`. |
| **Why** | Production-mode Firestore denies all until rules allow authenticated owner writes. |
| **Why this way** | Blueprint: deploy rules **before** first client write. |
| **Done when** | Console **Rules** tab shows your deployed rules with timestamp ~now; no deploy errors. |

---

## Phase 5 — Catalog ingest

### Step 5.1 — Clone punk-records English dataset

| | |
|---|---|
| **Owner** | **YOU** (run commands) / **AGENT** (writes ingest script) |
| **Purpose** | Source JSON for all English cards. |
| **What to do** | In PowerShell: `git clone --depth 1 https://github.com/buhbbl/punk-records.git C:\DeckPool\.tmp\punk-records` |
| **Why** | Blueprint §9.7 preferred source; offline snapshot. |
| **Why this way** | Prefetched JSON is fastest; no vega install required for Option A. |
| **Done when** | Folder exists: `C:\DeckPool\.tmp\punk-records\english\cards\` with many `.json` files and `english\packs.json`. |

---

### Step 5.2 — Implement and run `npm run ingest-catalog`

| | |
|---|---|
| **Owner** | **AGENT** implements; **YOU** run |
| **Purpose** | Produce committed `data/cards.json`, construction rules, has-flags. |
| **What to do** | 1. Agent adds `scripts/ingest-catalog.ts` per blueprint §9.7. 2. Agent adds npm script: `"ingest-catalog": "tsx scripts/ingest-catalog.ts"` 3. **YOU** run: `npm run ingest-catalog -- --input C:\DeckPool\.tmp\punk-records\english` 4. Expect outputs: `data/cards.json`, `data/packs.json`, `data/construction-rules.json`, optionally `data/has-flags.json`. |
| **Why** | V1 search runs in-browser over static JSON — no runtime API. |
| **Why this way** | Deterministic legality + search; Vercel serves static files. |
| **Done when** | Command exits **0**; `data/cards.json` is large (thousands of cards); `category: Don` cards absent; `data/unparsed-construction.json` empty or absent; ingest exits non-zero if unparsed entries exist (blueprint). |

---

### Step 5.3 — Verify catalog samples manually

| | |
|---|---|
| **Owner** | **YOU** |
| **Purpose** | Catch bad ingest before building UI. |
| **What to do** | Open `data/cards.json` and confirm entries exist for: `ST01-001` (Leader), `OP08-072` (Biscuit Warrior), `OP13-079` (Imu), `OP12-001` (Rayleigh). Check `OP08-072` has effect text containing “any number”. |
| **Why** | Construction tests depend on these ids (blueprint §5.6). |
| **Why this way** | Cheaper than debugging Builder legality later. |
| **Done when** | All four ids found with plausible fields (`colors`, `category`, `effect`). |

---

## Phase 6 — Product ingest (ST01–ST36)

### Step 6.1 — Implement and run `npm run ingest-products`

| | |
|---|---|
| **Owner** | **AGENT** implements; **YOU** run |
| **Purpose** | Starter deck contents for Collection “Add ST-07” flow. |
| **What to do** | 1. Agent adds `scripts/ingest-products.ts`, `scripts/product-urls.json` (empty `{}` ok). 2. Agent adds `"ingest-products": "tsx scripts/ingest-products.ts"`. 3. **YOU** run (requires network): `npm run ingest-products` 4. Script fetches One Piece Player pages with ~500ms delay between requests. |
| **Why** | Catalog alone cannot know 4× Anana counts (blueprint §5.2.2). |
| **Why this way** | Automated one-time dev ingest; users never type contents. |
| **Done when** | Exit code **0**; `data/products/index.json` lists **36** products ST01–ST36; each `data/products/STxx.json` sums to **51** cards including Leader (50 main + 1 Leader) or blueprint validation passes; every card id exists in `data/cards.json`. |

---

### Step 6.2 — Spot-check ST07 product file

| | |
|---|---|
| **Owner** | **YOU** |
| **Purpose** | Validate parser on a known deck. |
| **What to do** | Open `data/products/ST07.json`. Expect multiple ids with counts > 1 (e.g. four copies of a low card). Open `data/products/index.json` entry for ST07 with `leaderId` `ST07-001`. |
| **Why** | Regression guard against “1 of each” fallback (forbidden). |
| **Why this way** | Blueprint example deck throughout spec. |
| **Done when** | ST07 has varied quantities; leaderId present in index. |

---

### Step 6.3 — Commit data files

| | |
|---|---|
| **Owner** | **BOTH** |
| **Purpose** | Vercel build serves catalog without runtime scraping. |
| **What to do** | `git add data/` `git commit -m "Add catalog and starter product snapshots"` (when you are ready — only if you want a commit now). |
| **Why** | Blueprint: commit generated JSON; no Bandai scrape at runtime. |
| **Why this way** | Reproducible deploys; ingest re-run when sets release. |
| **Done when** | `data/cards.json` and `data/products/` tracked in git (or agent confirms ready to commit). |

---

## Phase 7 — Authentication UI

### Step 7.1 — Auth routes and display name signup

| | |
|---|---|
| **Owner** | **AGENT** |
| **Purpose** | Open signup with **required display name** (blueprint §3). |
| **What to do (agent)** | Implement `/login`, `/signup`, `/forgot-password`, `/` landing. Signup: email + password + display name (Zod min length). On signup: `createUserWithEmailAndPassword` → `updateProfile({ displayName })` → write `users/{uid}` with `{ displayName, email, createdAt }`. Password reset: `sendPasswordResetEmail`. |
| **Why** | Accounts day one; display name on Auth + Firestore. |
| **Why this way** | Dual write keeps Auth profile and Firestore in sync per blueprint. |
| **Done when (you test)** | 1. `http://localhost:3000/signup` creates account. 2. Firebase console → **Authentication** → **Users** shows new user with display name. 3. **Firestore** → `users/{uid}` doc exists with matching `displayName`. 4. Reset email sends (check spam). |

---

### Step 7.2 — AuthGate and post-login routing

| | |
|---|---|
| **Owner** | **AGENT** |
| **Purpose** | Protect app routes; redirect logged-in users off auth pages. |
| **What to do (agent)** | Public: `/`, `/login`, `/signup`, `/forgot-password`. All `(app)/*` require auth. Logged-in on auth routes → `/decks` unless owned card count is 0 → `/collection`. |
| **Why** | Blueprint §7.1 and §3 post-login destination. |
| **Why this way** | Empty binder should land on Collection CTA, not empty Decks. |
| **Done when** | Logged out: `/collection` redirects to login. Logged in: `/login` redirects to `/decks` or `/collection`. |

---

## Phase 8 — Theme, shell, providers

### Step 8.1 — Bright OPTCG theme (globals.css)

| | |
|---|---|
| **Owner** | **AGENT** |
| **Purpose** | Visual identity §8 — parchment, pirate red, game colors. |
| **What to do (agent)** | Implement CSS variables from blueprint §8.3 in `app/globals.css` with Tailwind v4 `@theme`. Load Fredoka + Nunito. **No dark mode.** |
| **Why** | Differentiator vs Diligence dark UI. |
| **Why this way** | Tokens first — all pages inherit consistently. |
| **Done when** | App background is cream `#FAF3E6`; primary button uses pirate red; no Diligence navy theme visible. |

---

### Step 8.2 — Providers + AppShell navigation

| | |
|---|---|
| **Owner** | **AGENT** |
| **Purpose** | Data flow for catalog, collection, decks. |
| **What to do (agent)** | Root: `AuthProvider` → `UserProfileProvider` → `Toaster` → `AuthGate`. `(app)/layout`: `CatalogProvider` (loads `data/cards.json`) → `CollectionProvider` → `DecksProvider` → `AppShell`. Nav items: **Collection**, **Cards**, **Decks**, **Profile** — bottom nav mobile, sidebar desktop. |
| **Why** | Blueprint §9.1 provider tree. |
| **Why this way** | Mirrors Diligence; separates static catalog from Firestore listeners. |
| **Done when** | Logged in, you see four nav items and can switch routes without full reload errors. |

---

### Step 8.3 — next/image remote pattern

| | |
|---|---|
| **Owner** | **AGENT** |
| **Purpose** | Display Bandai card art URLs. |
| **What to do (agent)** | In `next.config.ts`: `images.remotePatterns: [{ protocol: 'https', hostname: 'en.onepiece-cardgame.com', pathname: '/images/**' }]`. |
| **Why** | Blueprint §6.1 hotlink official art. |
| **Why this way** | Next.js blocks external images without allowlist. |
| **Done when** | A test card image renders in dev (not broken image icon). |

---

## Phase 9 — Collection page

### Step 9.1 — Collection search + quantity editor

| | |
|---|---|
| **Owner** | **AGENT** |
| **Purpose** | Primary binder entry — full catalog search, set qty (blueprint §7.2). |
| **What to do (agent)** | `/collection`: search bar (full catalog, no owned-only toggle). Row: card art, name, qty stepper or input, optional label chips. Qty 0 → delete Firestore doc. Labels: free-text chips, autocomplete from user’s existing labels. |
| **Why** | You must log cards you just bought from the full encyclopedia. |
| **Why this way** | Owned-pool-first applies to Builder default, not Collection. |
| **Done when** | Search `OP08-072`, set qty 2, refresh → qty persists. Firestore shows `users/{uid}/collection/OP08-072`. |

---

### Step 9.2 — Starter product modal

| | |
|---|---|
| **Owner** | **AGENT** |
| **Purpose** | One-click ST deck add (blueprint §5.2.1). |
| **What to do (agent)** | Button **Add starter deck** → modal lists products from `data/products/index.json`. On confirm: increment all contents; optional labels (union merge); optional **Also create deck** checkbox → new deck with Leader + `Main` variation prefilled with 50 non-leader counts. Skip Don lines. |
| **Why** | Core UX for “I bought ST-07”. |
| **Why this way** | Separate product JSON because catalog lacks box counts. |
| **Done when** | Adding ST07 increases multiple card qtys correctly; second add increments again (not replace). Optional deck create opens in Builder with ~50 cards. |

---

## Phase 10 — Cards browser + search

### Step 10.1 — Search parser and filter engine

| | |
|---|---|
| **Owner** | **AGENT** |
| **Purpose** | Limitless-style local query language (blueprint §5.5). |
| **What to do (agent)** | Implement `lib/search/parseQuery.ts`, `filterCards.ts`, `typeahead.ts` with keywords table §5.5. Logic: space=AND, `or`, `-term`, quotes, parens. Case rules §5.5.2. Use rarity token `treasure` for TreasureRare. |
| **Why** | Core differentiator alongside owned-first Builder. |
| **Why this way** | In-browser over JSON — no Algolia cost. |
| **Done when** | Unit tests pass for `color:purple type:"Big Mom Pirates"`, `id:OP03-114`, `-yellow`, `cost<=3`. |

---

### Step 10.2 — `/cards` page with URL sync

| | |
|---|---|
| **Owner** | **AGENT** |
| **Purpose** | Art-first catalog browser (blueprint §7.3). |
| **What to do (agent)** | `/cards?q=...&owned=1` syncs to URL. Owned-only toggle **off** by default. Facet chips mutate `q`. Large card grid; click → detail + art picker → saves `users/{uid}/cardPrefs/{cardId}`. **No qty edit** on this page. |
| **Why** | Three surfaces must not collapse — Cards is browse-only. |
| **Why this way** | URL shareable searches like Limitless. |
| **Done when** | Visiting `/cards?q=color%3Apurple&owned=1` filters correctly. Toggle owned updates URL. Refresh preserves state. |

---

## Phase 11 — Decks list + create

### Step 11.1 — Decks list grouped by Leader

| | |
|---|---|
| **Owner** | **AGENT** |
| **Purpose** | Deck hub with wanted-poster rows (blueprint §7.4). |
| **What to do (agent)** | `/decks`: group by Leader visually; row shows Leader art, name, color pills, variation count, Legal/Owned summary (**any variation** rule). Mini poster styling §8.5. |
| **Why** | Multiple decks per Leader allowed — grouping is UI-only. |
| **Why this way** | Poster motif makes list memorable without cluttering Builder. |
| **Done when** | Two decks with same Leader appear under same section header. |

---

### Step 11.2 — Create deck (owned Leaders only)

| | |
|---|---|
| **Owner** | **AGENT** |
| **Purpose** | Enforce Leader ownership at creation (blueprint §5.1). |
| **What to do (agent)** | **New deck** → Leader picker searches **owned** Leaders only → name input → creates `decks/{id}` + variation `Main` with empty `cards` map. |
| **Why** | Cannot start a deck without owning the Leader card. |
| **Why this way** | Unowned cards allowed in 50, not as Leader. |
| **Done when** | Leader you do not own does not appear in picker. Owned Leader creates deck and navigates to Builder. |

---

### Step 11.3 — Deck rename and delete

| | |
|---|---|
| **Owner** | **AGENT** |
| **Purpose** | Basic deck lifecycle (locked default). |
| **What to do (agent)** | Rename deck from decks list or Builder header. Delete deck with confirm (cascades variations subcollection delete or batch delete). |
| **Why** | Expected CRUD; blueprint omitted but users need it. |
| **Why this way** | Minimal — no archive/history. |
| **Done when** | Rename persists in Firestore; delete removes deck + variations. |

---

## Phase 12 — Builder, legality, variations

### Step 12.1 — Legality engine

| | |
|---|---|
| **Owner** | **AGENT** |
| **Purpose** | Legal/Illegal and Owned/Unowned tags with reasons (blueprint §5.4, §5.6). |
| **What to do (agent)** | `lib/legality.ts` + `lib/construction.ts`: validate Leader present, 50 cards, color subset, copy limits, forbid rules, ownership. Biscuit Warrior unlimited copies; Imu Event cost≥2 forbid; Rayleigh cost≥5 forbid. |
| **Why** | Deterministic — no LLM at runtime. |
| **Why this way** | Unit-testable pure functions. |
| **Done when** | Tests pass for blueprint §5.6 known examples. |

---

### Step 12.2 — Builder UI

| | |
|---|---|
| **Owner** | **AGENT** |
| **Purpose** | Core brew surface (blueprint §7.5). |
| **What to do (agent)** | `/decks/[id]`: left/top search (owned-only **on** default); filters Leader colors + construction forbid + no Don; click result adds copy (cap = copy limit only). Right/bottom manifest: lines show `in deck / owned`, minus button, unowned styling obvious. Badges + reason bullets. Mobile layout per §7.5. |
| **Why** | Owned-pool-first sell. |
| **Why this way** | Separate hard filters from text search. |
| **Done when** | Under Imu, 2-cost Events never appear in search. 46-card list saves as **Illegal**. Missing copies show **Unowned** with reasons. |

---

### Step 12.3 — Variations: clone, rename, delete, diff

| | |
|---|---|
| **Owner** | **AGENT** |
| **Purpose** | Named lists under one deck (blueprint §5.3–5.4). |
| **What to do (agent)** | Tabs for variations; clone current; rename; delete except last. **Compare variations** modal: pick base + compare → show count diffs only. Leader change: confirm generic warning → strip illegal cards from **all** variations (no card list in warning). |
| **Why** | Key differentiator vs duplicate-deck apps. |
| **Why this way** | Full count maps stored per variation — diff is UI-only. |
| **Done when** | Clone `Main` → `Budget` copies counts; diff shows changed ids; Leader change removes off-color cards after confirm. |

---

## Phase 13 — Profile

### Step 13.1 — Profile page and stats

| | |
|---|---|
| **Owner** | **AGENT** |
| **Purpose** | Display name edit + stats (blueprint §7.6, §4). |
| **What to do (agent)** | `/profile`: edit displayName (Auth + Firestore), show email, logout. Stats: unique owned ids / total copies; deck count; variation count; Legal vs Illegal variation counts; Owned vs Unowned variation counts. Poster-style stats block §8.5. |
| **Why** | Required display name must be editable. |
| **Why this way** | Stats computed client-side from providers — no extra Firestore aggregates in V1. |
| **Done when** | Name change reflects in Auth and Firestore. Stats update after collection/deck changes. |

---

## Phase 14 — Tests and lint

### Step 14.1 — Run unit tests

| | |
|---|---|
| **Owner** | **YOU** (run) / **AGENT** (writes tests) |
| **Purpose** | Lock search + legality behavior. |
| **What to do** | `npm test` — tests in `lib/**/*.test.ts` for parseQuery, filterCards, legality, construction. |
| **Why** | Blueprint §9.1 same test runner as Diligence. |
| **Why this way** | High-value pure functions; skip E2E in V1. |
| **Done when** | All tests green. |

---

### Step 14.2 — Production build locally

| | |
|---|---|
| **Owner** | **YOU** |
| **Purpose** | Catch Vercel build failures early. |
| **What to do** | `npm run build` then `npm run start` — smoke test at `http://localhost:3000`. |
| **Why** | Static catalog import paths and Next config fail only at build time sometimes. |
| **Why this way** | Cheaper than debug-on-Vercel loop. |
| **Done when** | Build exits 0; main routes load. |

---

## Phase 15 — GitHub push + Vercel deploy

### Step 15.1 — Push code to GitHub

| | |
|---|---|
| **Owner** | **YOU** |
| **Purpose** | Connect Vercel to source. |
| **What to do** | From `C:\DeckPool`: `git add .` `git commit -m "DeckPool V1 initial implementation"` `git push -u origin main` (use your branch name if not `main`). |
| **Why** | Vercel imports from GitHub. |
| **Why this way** | Standard CI/CD for Next apps. |
| **Done when** | GitHub repo shows files online. |

---

### Step 15.2 — Create Vercel project

| | |
|---|---|
| **Owner** | **YOU** |
| **Purpose** | Host production Next.js app. |
| **What to do** | 1. Go to https://vercel.com/ and sign in ( **Continue with GitHub** recommended). 2. Click **Add New…** → **Project** (top right or dashboard). 3. Under **Import Git Repository**, find **deckpool** → click **Import**. 4. **Configure Project:** - **Framework Preset:** Next.js (auto) - **Root Directory:** `./` (default) - **Build Command:** `next build` (default) - **Output Directory:** default - Do **not** override unless agent documented a monorepo 5. Expand **Environment Variables** — add each from `.env.local` (see Step 15.3) **before** first deploy if possible. 6. Click **Deploy**. 7. Wait for build log → **Congratulations** / Visit button. |
| **Why** | Blueprint: new Vercel project, Hobby tier. |
| **Why this way** | Git push auto-deploys later. |
| **Done when** | Vercel gives a URL like `https://deckpool-xxxxx.vercel.app` that loads (auth may fail until Step 16 — expected). |

---

### Step 15.3 — Vercel environment variables

| | |
|---|---|
| **Owner** | **YOU** |
| **Purpose** | Production Firebase config at build time. |
| **What to do** | Vercel project → **Settings** → **Environment Variables** → for each: Click **Add New** → **Key** = name → **Value** = from `.env.local` → check **Production**, **Preview**, **Development** → **Save**. Add all: `NEXT_PUBLIC_FIREBASE_API_KEY` `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` `NEXT_PUBLIC_FIREBASE_PROJECT_ID` `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` `NEXT_PUBLIC_FIREBASE_APP_ID` `NEXT_PUBLIC_APP_URL` = `https://YOUR-PROJECT.vercel.app` (your real URL, no trailing slash) After adding/changing: **Deployments** → latest → **⋯** → **Redeploy** (needed for `NEXT_PUBLIC_*` rebuild). |
| **Why** | `.env.local` is not uploaded to Vercel. |
| **Why this way** | `NEXT_PUBLIC_*` baked in at build — must redeploy after changes. |
| **Done when** | All seven variables visible in Settings; production redeploy succeeded. |

---

## Phase 16 — Production Firebase auth domain

### Step 16.1 — Add Vercel domain to authorized domains

| | |
|---|---|
| **Owner** | **YOU** |
| **Purpose** | Login/signup works on deployed URL. |
| **What to do** | 1. Copy hostname only from Vercel URL (e.g. `deckpool-xxxxx.vercel.app` — no `https://`). 2. Firebase console → **Build** → **Authentication** → tab **Settings** → **Authorized domains**. 3. Click **Add domain**. 4. Paste hostname → **Add**. 5. Confirm it appears in the list alongside `localhost`. |
| **Why** | Without this, browser shows `auth/unauthorized-domain`. |
| **Why this way** | Email/password uses authorized domain list; OAuth not in V1. **Do not** add parent `vercel.app` — only your specific subdomain. |
| **Done when** | Production URL: sign up / log in works without unauthorized-domain error. |

---

### Step 16.2 — Update NEXT_PUBLIC_APP_URL if needed

| | |
|---|---|
| **Owner** | **YOU** |
| **Purpose** | Any absolute links use production URL. |
| **What to do** | If you used a placeholder in Vercel env, set `NEXT_PUBLIC_APP_URL` to final URL → **Redeploy**. Update local `.env.local` only for parity (optional). |
| **Why** | Consistency for redirects/links. |
| **Why this way** | Single public env var per blueprint. |
| **Done when** | Production app auth and navigation work end-to-end. |

---

## Phase 17 — V1 ship verification (blueprint §13)

Run this checklist on **production** (or localhost if you prefer before deploy). Each item maps to blueprint success criteria.

| # | Test | Done when |
|---|---|---|
| 1 | Sign up with display name; reset password; edit name; logout | All four work |
| 2 | Collection: qty, multi labels, filter `label:`, add ST starter (+ optional deck) | Counts and labels persist |
| 3 | `/cards`: full catalog; `owned=1`; query `color:purple type:"Big Mom Pirates"` + typeahead | URL sync + results correct |
| 4 | Create deck only from owned Leader | Blocked otherwise |
| 5 | Multiple variations; clone; diff modal | Variations independent |
| 6 | 46-card draft → **Illegal**; fix to 50 + rules → **Legal** even if unowned | Tags correct |
| 7 | **Unowned** when short copies; manifest shows `4 / 2` | Obvious styling |
| 8 | Builder owned toggle off → add unowned; still color/legal filtered | Works |
| 9 | Biscuit Warrior 5+ copies Legal; Imu blocks 2-cost Events; Rayleigh blocks cost≥5 | Matches §5.6 |
| 10 | Leader change → warning → strip off-color | All variations updated |
| 11 | Art picker when multiple `images[]` | Pref saved to Firestore |
| 12 | Phone + desktop usable; bright poster theme; large art | Subjective but clear |

**V1 is done when all 12 rows pass.**

---

## Troubleshooting (common blockers)

| Symptom | Likely cause | Fix |
|---|---|---|
| `auth/unauthorized-domain` on Vercel | Domain not authorized | Phase 16 — add exact `*.vercel.app` host |
| Firestore permission denied | Rules not deployed or wrong project | `firebase use` + redeploy rules; check `.firebaserc` |
| `Firebase: Error (auth/api-key-not-valid)` | Wrong env vars | Re-copy from Firebase **Project settings** → **Your apps** → web app config |
| Images broken | Remote pattern missing | Agent Step 8.3 |
| `ingest-products` fails | One Piece Player HTML change or network | Agent fixes parser or `scripts/product-overrides/STxx.json`; never ship with missing ST |
| Build fails on Vercel | `NEXT_PUBLIC_*` missing | Step 15.3 + redeploy |
| Login works locally but not prod | Old build without env | Redeploy after env vars set |

---

## What to tell the agent (copy-paste prompts)

**Scaffold (Phases 3–4):**
> Implement Phase 3–4 of DECKPOOL_V1_IMPLEMENTATION_GUIDE.md: greenfield scaffold with create-next-app + npm install (Path A), Firebase/AuthGate skeleton, `.firebaserc` for project ID `[YOUR_ID]`, firestore.rules from blueprint, `.env.local.example`. Use Diligence only as optional reference — do not copy the repo one-to-one.

**Data (Phases 5–6):**
> Implement ingest-catalog and ingest-products scripts per DECKPOOL_V1_BLUEPRINT.md §9.7 and §9.7.1. Run ingest-catalog against `.tmp/punk-records/english` if clone exists.

**App features (Phases 7–13):**
> Implement Phases 7–13 per DECKPOOL_V1_IMPLEMENTATION_GUIDE.md in order. Use locked defaults in the guide for ambiguous blueprint items.

**Tests (Phase 14):**
> Add lib tests for search parser, filterCards, legality, construction per blueprint §5.5 and §5.6. Run npm test and fix failures.

---

## Files you should have at V1 ship

```
C:\DeckPool
├── app/                    # routes + layouts
├── components/
├── contexts/               # Auth, Catalog, Collection, Decks, UserProfile
├── hooks/
├── lib/                    # search, legality, construction, firebase CRUD
├── types/
├── data/
│   ├── cards.json
│   ├── packs.json
│   ├── construction-rules.json
│   └── products/           # index + ST01–ST36
├── scripts/
│   ├── ingest-catalog.ts
│   ├── ingest-products.ts
│   └── product-urls.json
├── firestore.rules
├── firebase.json
├── .firebaserc
├── .env.local              # YOU only, gitignored
├── .env.local.example
├── DECKPOOL_V1_BLUEPRINT.md
└── DECKPOOL_V1_IMPLEMENTATION_GUIDE.md
```

---

## Optional later (not V1)

- Custom domain on Vercel → add that domain to Firebase authorized domains too
- `npx vercel env pull .env.local` to sync env from Vercel to laptop
- Re-run ingest when new OP/ST sets release
- Paste-a-list import, public sharing, ban list — blueprint §10

---

*End of implementation guide.*
