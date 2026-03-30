# 🧊 FridgeChef

> Upload photos of your fridge → identify ingredients → discover recipes → shop what's missing.

**Stack:** MongoDB · Express · React · Node.js (MERN) · Zustand · Tailwind CSS · Framer Motion

---

## Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Quick Start](#quick-start)
4. [API Keys Setup](#api-keys-setup)
5. [Project Structure](#project-structure)
6. [Environment Variables](#environment-variables)
7. [Available Scripts](#available-scripts)
8. [Deployment](#deployment)
9. [Testing](#testing)
10. [Design Decisions](#design-decisions)

---

## Features

| Feature | Description |
|---|---|
| **Fridge Scanning** | Upload up to 5 photos — FatSecret AI detects every ingredient |
| **Full Nutrition** | Calories, macros, and 12 micronutrients per ingredient |
| **Ingredient Toggles** | Mark items you don't actually have — recipe search adapts |
| **Recipe Discovery** | Spoonacular finds recipes matching ≥80% of your ingredients |
| **Match Percentage** | See at a glance how well each recipe fits your fridge |
| **Cooking Timer** | Step-locked multi-stage countdown with SVG ring + audio chime |
| **Shopping Links** | Missing ingredients link directly to BigBasket search |
| **Similar Recipes** | Horizontal strip of related recipes per dish |
| **Favourites** | Save recipes with a heart tap |
| **Upload History** | Re-use ingredient sessions from past scans |
| **Meal Planning** | Auto-generate a weekly plan via Spoonacular, diet-aware |
| **Responsive** | Mobile-first, works on phone, tablet, and desktop |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  React + Zustand + Tailwind + Framer Motion  (Vercel)       │
│  client/ — Vite, port 5173 in dev                           │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP (proxied in dev, direct in prod)
┌──────────────────────▼──────────────────────────────────────┐
│  Express + Node.js  (Railway)                               │
│  server/ — port 5000                                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Middleware: helmet · cors · cookie-parser · morgan  │   │
│  │             rate-limit · JWT auth · multer · Joi    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Services:                                                  │
│  ┌──────────────┐  ┌────────────────┐  ┌────────────────┐  │
│  │ FatSecret    │  │  Spoonacular   │  │  BigBasket     │  │
│  │ image recog  │  │  60 req/min    │  │  URL builder   │  │
│  │ + nutrition  │  │  (Bottleneck)  │  │                │  │
│  └──────────────┘  └────────────────┘  └────────────────┘  │
│                                                             │
│  ┌──────────────┐  ┌────────────────┐                      │
│  │ Cloudinary   │  │  Sharp         │                      │
│  │ image CDN    │  │  compression   │                      │
│  └──────────────┘  └────────────────┘                      │
└──────────────────────┬──────────────────────────────────────┘
                       │ Mongoose
┌──────────────────────▼──────────────────────────────────────┐
│  MongoDB Atlas (M0 free tier)                               │
│  Collections: users · uploads · ingredients · recipes       │
│               favorites · mealplans                         │
└─────────────────────────────────────────────────────────────┘
```

### Key pipeline: Image → Ingredients

```
User uploads fridge photo(s)
  → browser-image-compression (max 500KB, max 1200px)
  → Express multer (memory storage)
  → Sharp (server-side normalise to JPEG)
  → Cloudinary (CDN storage, returns URL)
  → FatSecret /rest/image-recognition/v2 (base64)
      eaten_foods[] = ingredients from previous images (context)
  → food_response[] → mapFoodItemToIngredient()
  → deduplicateIngredients() by food_id across all images
  → Ingredient documents saved to MongoDB
  → Response sent to React
```

---

## Quick Start

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- MongoDB Atlas account (free M0 tier works)
- API keys for FatSecret, Spoonacular, Cloudinary (see below)

### 1. Clone and install

```bash
git clone https://github.com/your-username/fridgechef.git
cd fridgechef
npm run install:all
```

### 2. Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in all values. See [API Keys Setup](#api-keys-setup) below.

### 3. Start development servers

```bash
npm run dev
```

This starts:
- **Backend:** `http://localhost:5000`
- **Frontend:** `http://localhost:5173` (proxies `/api` to backend)

---

## API Keys Setup

### FatSecret (required — image recognition + nutrition)

1. Sign up at [platform.fatsecret.com](https://platform.fatsecret.com/api/Default.aspx)
2. Create an application
3. Under **Permissions**, ensure **Image Recognition** scope is enabled
4. Copy `Client ID` and `Client Secret` to `.env`

```env
FATSECRET_CLIENT_ID=your_client_id
FATSECRET_CLIENT_SECRET=your_client_secret
```

> **Note:** Image recognition may require a paid plan. Check your account tier.

---

### Spoonacular (required — recipe search and meal planning)

1. Sign up at [spoonacular.com/food-api](https://spoonacular.com/food-api)
2. Go to **Profile → API Console**
3. Copy your API key

```env
SPOONACULAR_API_KEY=your_api_key
SPOONACULAR_RATE_LIMIT=60
```

> Free tier: 150 points/day with 60 requests/minute. The app caches recipe results
> for 7 days in MongoDB — this dramatically reduces daily point consumption.

---

### Cloudinary (required — image storage and CDN)

1. Sign up at [cloudinary.com](https://cloudinary.com) (free tier: 25GB)
2. Go to **Dashboard**
3. Copy Cloud Name, API Key, API Secret

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_FOLDER=fridgechef/uploads
```

---

### MongoDB Atlas (required — database)

1. Sign up at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free M0 cluster
3. Create a database user with read/write access
4. Add your IP to the allowlist (or use `0.0.0.0/0` for development)
5. Get the connection string from **Connect → Connect your application**

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/fridgechef
```

---

### JWT Secrets (required — generate strong random values)

```bash
# Generate JWT_SECRET
openssl rand -base64 64

# Generate REFRESH_TOKEN_SECRET (use a different value)
openssl rand -base64 64
```

```env
JWT_SECRET=<generated value>
REFRESH_TOKEN_SECRET=<different generated value>
```

---

## Project Structure

```
fridgechef/                     ← Monorepo root
├── package.json                ← npm workspaces (concurrently dev script)
├── .env.example                ← All env vars documented
├── .gitignore
│
├── client/                     ← React frontend (Vite)
│   ├── src/
│   │   ├── api/                ← Axios instance + endpoint wrappers
│   │   ├── components/
│   │   │   ├── auth/           ← LoginForm, RegisterForm
│   │   │   ├── ingredients/    ← IngredientCard, IngredientList, NutritionPanel
│   │   │   ├── recipes/        ← RecipeCard, RecipeGrid, RecipeFilters,
│   │   │   │                       CookingTimer, SimilarRecipes
│   │   │   ├── shopping/       ← ShoppingLinks
│   │   │   ├── upload/         ← ImageUploadZone, ImagePreviewGrid
│   │   │   └── shared/         ← Navbar, PageTransition, LoadingSpinner,
│   │   │                           EmptyState, ErrorBoundary, SkeletonCard
│   │   ├── hooks/              ← useDebounce, useTimer, useImageCompression,
│   │   │                           useInfiniteRecipes
│   │   ├── pages/              ← Home, Auth, Upload, Results, RecipeDetail,
│   │   │                           History, Favorites, MealPlan
│   │   ├── store/              ← Zustand: useAuthStore, useUploadStore,
│   │   │                           useIngredientStore, useRecipeStore,
│   │   │                           useMealPlanStore
│   │   └── utils/              ← nutritionFormatter, bigbasketUrlBuilder
│   ├── tailwind.config.js
│   ├── vite.config.js          ← Proxy to :5000 in dev, code splitting
│   └── vercel.json             ← SPA rewrite rules
│
└── server/                     ← Express backend
    ├── server.js               ← Entry point
    ├── config/
    │   ├── db.js               ← MongoDB connection
    │   ├── cloudinary.js       ← Upload/delete/thumbnail helpers
    │   └── validateEnv.js      ← Crash-fast on missing env vars
    ├── controllers/            ← authController, uploadController,
    │                               recipeController
    ├── middleware/             ← authMiddleware (JWT), errorHandler (AppError),
    │                               rateLimiter, uploadMiddleware (multer),
    │                               validateRequest (Joi)
    ├── models/                 ← User, Upload, Ingredient, Recipe, Favorite,
    │                               MealPlan
    ├── routes/                 ← authRoutes, uploadRoutes, recipeRoutes,
    │                               favoriteRoutes, mealPlanRoutes
    ├── services/               ← fatSecretService (OAuth2 + image recognition),
    │                               spoonacularService (cache-first),
    │                               bigbasketService (URL builder)
    ├── utils/                  ← logger (Winston), imageCompressor (Sharp),
    │                               ingredientDeduplicator, spoonacularQueue
    │                               (Bottleneck), apiCache (node-cache)
    ├── __tests__/              ← Jest unit tests
    ├── railway.toml            ← Railway deployment config
    └── Procfile                ← Render/Heroku deployment
```

---

## Environment Variables

All variables with their types and descriptions are in [`.env.example`](.env.example).

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | Access token signing secret (min 32 chars) |
| `REFRESH_TOKEN_SECRET` | ✅ | Refresh token signing secret (different from above) |
| `CLOUDINARY_CLOUD_NAME` | ✅ | Cloudinary account cloud name |
| `CLOUDINARY_API_KEY` | ✅ | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ✅ | Cloudinary API secret |
| `FATSECRET_CLIENT_ID` | ✅ | FatSecret OAuth2 client ID |
| `FATSECRET_CLIENT_SECRET` | ✅ | FatSecret OAuth2 client secret |
| `SPOONACULAR_API_KEY` | ✅ | Spoonacular API key |
| `NODE_ENV` | ✅ | `development` or `production` |
| `PORT` | ❌ | Server port (default: 5000) |
| `VITE_API_BASE_URL` | ❌ | Frontend API base (default: `/api`) |

---

## Available Scripts

From the **monorepo root:**

| Script | Description |
|---|---|
| `npm run dev` | Start both client (`:5173`) and server (`:5000`) concurrently |
| `npm run build` | Build client for production |
| `npm run install:all` | Install all workspace dependencies |

From `server/`:

| Script | Description |
|---|---|
| `npm run dev` | Start server with nodemon (auto-restart on file changes) |
| `npm start` | Start server in production mode |
| `npm test` | Run Jest unit tests |
| `npm run test:coverage` | Run tests with coverage report |

From `client/`:

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run lint` | ESLint check |

---

## Deployment

### Backend → Railway

1. Push your repo to GitHub
2. Create a new project at [railway.app](https://railway.app)
3. Connect your GitHub repo, set **Root Directory** to `server/`
4. Add all environment variables from `.env.example` in the Railway dashboard
5. Railway auto-deploys on every push to `main`

The `railway.toml` and health check at `/api/health` are already configured.

### Frontend → Vercel

1. Push your repo to GitHub
2. Create a new project at [vercel.com](https://vercel.com)
3. Set **Root Directory** to `client/`
4. Set **Build Command** to `npm run build`
5. Set **Output Directory** to `dist`
6. Add `VITE_API_BASE_URL=https://your-railway-app.railway.app/api`

The `vercel.json` SPA rewrite rules are already configured.

### MongoDB Atlas

Use the M0 free tier for development. For production, upgrade to M10 ($57/month)
for dedicated resources, backup, and analytics.

---

## Testing

```bash
cd server
npm test                    # Run all unit tests
npm run test:coverage       # With coverage report
npm run test:watch          # Watch mode during development
```

**Test coverage targets:**
- `utils/` — 90%+
- `services/` — 70%+
- `controllers/` — integration tested via Supertest (Phase 4 expansion)

### Adding new tests

Place test files in `server/__tests__/` with the `.test.js` extension.
Tests use Jest with ESM support (`--experimental-vm-modules`).

---

## Design Decisions

### Why FatSecret for image recognition?
FatSecret's `/rest/image-recognition/v2` endpoint handles both detection and
nutrition in a single API call. No additional vision service (Google Vision,
OpenAI) is needed. The `eaten_foods[]` parameter passes previously found
ingredients across multiple images for improved accuracy.

### Why Zustand over Redux?
Zustand provides typed stores with minimal boilerplate. Each domain
(auth, upload, ingredients, recipes, meal plan) has its own isolated store.
No providers, no reducers, no action creators.

### Why httpOnly cookies over localStorage?
JWT tokens in localStorage are vulnerable to XSS attacks. httpOnly cookies
are inaccessible to JavaScript and automatically sent with every request.
Access tokens expire in 15 minutes with silent refresh via a dedicated
`/api/auth/refresh` endpoint.

### Why Bottleneck for Spoonacular?
Spoonacular enforces 60 requests/minute. Bottleneck provides a token-bucket
rate limiter that queues excess requests rather than dropping them, with
configurable auto-retry on 429 responses.

### Why MongoDB caching for recipes?
Spoonacular's free tier limits daily requests. Recipe details rarely change —
caching them for 7 days drastically reduces API calls. The same recipe
requested by 10 users only hits Spoonacular once.

### Why Cloudinary over local disk?
Stateless server deployments (Railway, Render) have ephemeral filesystems.
Cloudinary provides persistent CDN storage, auto-format conversion (WebP/AVIF),
on-the-fly thumbnail transforms, and a generous free tier (25GB).

---

## Licence

MIT
