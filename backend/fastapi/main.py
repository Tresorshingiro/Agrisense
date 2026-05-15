import os
import pickle
import numpy as np
import joblib
import rasterio
from rasterio.transform import rowcol
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

MODELS_DIR = os.getenv("MODELS_DIR", os.path.join(os.path.dirname(__file__), "..", "models"))
TIF_PATH   = os.getenv("TIF_PATH",   os.path.join(os.path.dirname(__file__), "..", "tif", "rwanda_ml_features_250m.tif"))

# Resolve relative paths against this file's directory
if not os.path.isabs(MODELS_DIR):
    MODELS_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), MODELS_DIR))
if not os.path.isabs(TIF_PATH):
    TIF_PATH = os.path.normpath(os.path.join(os.path.dirname(__file__), TIF_PATH))


def _load_pickle(name: str):
    with open(os.path.join(MODELS_DIR, name), "rb") as f:
        return pickle.load(f)


# Lazy-loaded models
_dtr          = None
_preprocesser = None
_fertilizer   = None
_suitability  = None


def get_yield_models():
    global _dtr, _preprocesser
    if _dtr is None:
        _dtr          = _load_pickle("dtr.pkl")
        _preprocesser = _load_pickle("preprocesser.pkl")
    return _dtr, _preprocesser


def get_fertilizer_model():
    global _fertilizer
    if _fertilizer is None:
        _fertilizer = joblib.load(os.path.join(MODELS_DIR, "fertilizer_model.pkl"))
    return _fertilizer


def get_suitability_bundle():
    global _suitability
    if _suitability is None:
        _suitability = joblib.load(os.path.join(MODELS_DIR, "rwanda_agrisense_models.joblib"))
    return _suitability


app = FastAPI(title="Rwanda AgriSense ML API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── /health ──────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}


# ── /fertilizer ──────────────────────────────────────────────────────────────

class FertilizerRequest(BaseModel):
    temperature: float
    humidity: float
    moisture: float
    soil_type: str
    crop_type: str
    nitrogen: float
    phosphorous: float
    potassium: float


@app.post("/fertilizer")
def predict_fertilizer(req: FertilizerRequest):
    import pandas as pd
    model = get_fertilizer_model()
    # Match column names the model was trained on
    X = pd.DataFrame([{
        "Temparature": req.temperature,
        "Humidity ":   req.humidity,   # trailing space matches CSV column name
        "Moisture":    req.moisture,
        "Soil Type":   req.soil_type,
        "Crop Type":   req.crop_type,
        "Nitrogen":    req.nitrogen,
        "Potassium":   req.potassium,
        "Phosphorous": req.phosphorous,
    }])
    try:
        result = model.predict(X)[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {"fertilizer": result}


# ── /yield ────────────────────────────────────────────────────────────────────

class YieldRequest(BaseModel):
    year: int
    rainfall_mm: float
    pesticides_tonnes: float
    avg_temp: float
    area: str
    crop: str


@app.post("/yield")
def predict_yield(req: YieldRequest):
    dtr, preprocesser = get_yield_models()
    features = np.array([[
        req.year,
        req.rainfall_mm,
        req.pesticides_tonnes,
        req.avg_temp,
        req.area,
        req.crop,
    ]], dtype=object)
    try:
        transformed = preprocesser.transform(features)
        predicted   = dtr.predict(transformed)[0]
        # Convert hg/ha → kg/ha
        yield_kg_ha = float(predicted) / 10.0
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {"yield_kg_ha": round(yield_kg_ha, 2)}


# ── /suitability ──────────────────────────────────────────────────────────────

class SuitabilityRequest(BaseModel):
    latitude: float
    longitude: float


FEATURE_NAMES = [
    "soil_pH", "soil_organic_carbon", "soil_clay_fraction", "soil_sand_fraction",
    "elevation_m", "slope_deg", "aspect_deg", "rainfall_mean_mm_month",
    "rainfall_seasonA_mm", "rainfall_seasonB_mm",
]


@app.post("/suitability")
def predict_suitability(req: SuitabilityRequest):
    bundle = get_suitability_bundle()
    models = bundle["models"]
    crops  = bundle["crops"]

    try:
        with rasterio.open(TIF_PATH) as src:
            row, col = rowcol(src.transform, req.longitude, req.latitude)
            row = int(np.clip(row, 0, src.height - 1))
            col = int(np.clip(col, 0, src.width  - 1))
            pixel_values = src.read(window=((row, row + 1), (col, col + 1)))
            features = pixel_values.reshape(1, -1).astype(float)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TIF sampling error: {e}")

    if np.any(np.isnan(features)):
        raise HTTPException(status_code=422, detail="Location is outside valid raster area")

    scores = {}
    for crop in crops:
        score = int(models[crop].predict(features)[0])
        scores[crop] = score

    feature_values = {
        name: round(float(features[0][i]), 2)
        for i, name in enumerate(FEATURE_NAMES)
    }

    return {
        "latitude":    req.latitude,
        "longitude":   req.longitude,
        "suitability": scores,
        "features":    feature_values,
    }
