# Rwanda AgriSense

ML-powered crop advisory platform for Rwanda. Farmers, agronomists, and planners get fertilizer recommendations, yield predictions, and per-location crop suitability scores — all on a mobile app backed by trained machine learning models.

---

## Architecture

```
Mobile App (React Native + Expo)
        │  Clerk JWT
        ▼
Node.js / Express API  (:3001)
        │  proxies ML requests
        ▼
FastAPI ML Service  (:8000)
        │  reads models + raster
        ▼
.pkl / .joblib models  +  rwanda_ml_features_250m.tif
```

The Express API handles auth, request validation, and persistence (PostgreSQL via Prisma). It forwards prediction requests to the FastAPI service and saves results to the database. The mobile app talks only to the Express API.

---

## Features

- **Fertilizer guide** — recommends fertilizer type based on crop, soil type, and NPK levels
- **Yield prediction** — estimates harvest in kg/ha for 8 Rwandan crops given rainfall, temperature, and pesticide usage
- **Crop suitability map** — tap any point in Rwanda to get suitability scores (0–2) for maize, beans, Irish potato, sorghum, and cassava, derived from soil and climate raster data
- **Prediction history** — all results are stored per user and accessible offline via local cache
- **Rwanda season awareness** — app adapts seasonal context to Season A (Sep–Jan), B (Mar–Jun), or C (Jul–Aug)

---

## Project Structure

```
Agrisense/
├── backend/
│   ├── data/                        # Training datasets (CSV)
│   ├── tif/                         # Rwanda raster features (250m GeoTIFF)
│   ├── models/                      # Exported model files (generated)
│   ├── fastapi/                     # Python ML inference API
│   │   ├── main.py
│   │   ├── requirements.txt
│   │   └── .env
│   └── api/                         # Node.js business logic API
│       ├── src/
│       │   ├── index.ts
│       │   ├── middleware/clerk.ts
│       │   └── routes/              # fertilizer, yield, map, history, webhooks
│       ├── prisma/schema.prisma
│       └── .env
└── mobile/                          # React Native + Expo app
    ├── app/
    │   ├── (auth)/                  # sign-in, sign-up
    │   ├── (tabs)/                  # dashboard, fertilizer, yield, map, profile
    │   ├── _layout.tsx
    │   ├── index.tsx                # root redirect
    │   └── onboarding.tsx
    ├── components/
    ├── hooks/                       # useApi, useHistory
    ├── utils/                       # season, score, cropInsights
    ├── lib/                         # ArcGIS WebView HTML
    └── .env
```

---

## Prerequisites

- Node.js 18+
- Python 3.10+
- PostgreSQL database
- [Clerk](https://clerk.com) account (free tier works)
- [ArcGIS Developer](https://developers.arcgis.com) API key (for the map)
- Expo Go app on your phone (for mobile development)

---

## Getting Started

### 1. Train the ML models

Run the training scripts once to generate the model files in `backend/models/`:

```bash
cd backend
pip install scikit-learn pandas numpy joblib rasterio

python ml/train_yield.py
python ml/train_fertilizer.py
python ml/train_suitability.py
```

Training data is in `backend/data/`. The suitability model also requires the GeoTIFF at `backend/tif/rwanda_ml_features_250m.tif`.

---

### 2. FastAPI (ML inference service)

```bash
cd backend/fastapi
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env   # adjust MODELS_DIR and TIF_PATH if needed

uvicorn main:app --reload --port 8000
```

Health check: `GET http://localhost:8000/health`

---

### 3. Node.js API

```bash
cd backend/api
cp .env.example .env   # fill in DATABASE_URL, CLERK_SECRET_KEY, FASTAPI_URL

npm install
npx prisma migrate dev --name init
npm run dev
```

Health check: `GET http://localhost:3001/health`

---

### 4. Mobile app

```bash
cd mobile
cp .env.example .env
# Set EXPO_PUBLIC_BACKEND_URL to your machine's LAN IP (not localhost)
# e.g. EXPO_PUBLIC_BACKEND_URL=http://192.168.1.100:3001

npm install
npx expo start
```

Scan the QR code with Expo Go. For the map to work, add your ArcGIS API key to `EXPO_PUBLIC_ARCGIS_API_KEY`.

> **Clerk note:** Disable email verification in the Clerk dashboard for development with Expo Go, or configure OTP-based verification.

---

## Environment Variables

### `backend/fastapi/.env`

| Variable | Default | Description |
|---|---|---|
| `MODELS_DIR` | `../models` | Path to trained model files |
| `TIF_PATH` | `../tif/rwanda_ml_features_250m.tif` | Rwanda raster feature file |

### `backend/api/.env`

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `CLERK_SECRET_KEY` | From Clerk dashboard → API Keys |
| `CLERK_PUBLISHABLE_KEY` | From Clerk dashboard → API Keys |
| `FASTAPI_URL` | URL of the FastAPI service (default: `http://localhost:8000`) |
| `PORT` | Server port (default: `3001`) |

### `mobile/.env`

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_BACKEND_URL` | LAN IP of the Node.js API (e.g. `http://192.168.1.100:3001`) |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | From Clerk dashboard → API Keys |
| `EXPO_PUBLIC_ARCGIS_API_KEY` | From ArcGIS Developer portal |

---

## API Reference

### FastAPI (`:8000`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/fertilizer` | Predict fertilizer type |
| `POST` | `/yield` | Predict yield in kg/ha |
| `POST` | `/suitability` | Crop suitability scores for a lat/lon |

### Express API (`:3001`)

All `/api/*` routes require a Clerk JWT in the `Authorization: Bearer <token>` header.

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/api/fertilizer` | Get fertilizer recommendation + save to history |
| `POST` | `/api/yield` | Get yield prediction + save to history |
| `POST` | `/api/map/predict` | Get suitability scores for a location + save to history |
| `GET` | `/api/history` | Fetch all predictions for the authenticated user |
| `POST` | `/api/webhooks/clerk` | Clerk user lifecycle webhook |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native, Expo SDK 54, expo-router, TypeScript |
| Auth | Clerk (`@clerk/clerk-expo`) |
| Maps | ArcGIS JS API (via WebView), Nominatim geocoding |
| Node.js API | Express, TypeScript, Prisma, PostgreSQL |
| ML API | FastAPI, Python, scikit-learn, joblib, rasterio |
| ML models | Decision Tree (yield), Random Forest (fertilizer, suitability) |
| Offline | AsyncStorage (history cache + map result cache) |
| Hosting | Render (free tier — self-ping enabled to prevent spin-down) |
