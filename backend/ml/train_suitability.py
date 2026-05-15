import os
import numpy as np
import pandas as pd
import joblib
import rasterio
from rasterio.transform import rowcol
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TIF_PATH = os.path.join(BASE, "tif", "rwanda_ml_features_250m.tif")
CSV_PATH = os.path.join(BASE, "data", "rwanda_crop_yields_by_district.csv")
MODELS_DIR = os.path.join(BASE, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

# Approximate centroids for Rwanda's 30 districts (lat, lon)
DISTRICT_CENTROIDS = {
    "Nyarugenge":     (-1.9441,  30.0619),
    "Gasabo":         (-1.8627,  30.1119),
    "Kicukiro":       (-2.0054,  30.1033),
    "Nyanza":         (-2.3511,  29.7397),
    "Gisagara":       (-2.6278,  29.8264),
    "Nyaruguru":      (-2.7003,  29.5444),
    "Huye":           (-2.5963,  29.7386),
    "Nyamagabe":      (-2.4597,  29.4931),
    "Ruhango":        (-2.2308,  29.7811),
    "Muhanga":        (-2.0847,  29.7581),
    "Kamonyi":        (-2.0069,  29.8764),
    "Karongi":        (-2.0597,  29.3697),
    "Rutsiro":        (-1.9011,  29.3803),
    "Rubavu":         (-1.6847,  29.3572),
    "Nyabihu":        (-1.6625,  29.5014),
    "Ngororero":      (-1.8697,  29.5722),
    "Rusizi":         (-2.4825,  28.9075),
    "Nyamasheke":     (-2.3347,  29.1358),
    "Rulindo":        (-1.7283,  30.0644),
    "Gakenke":        (-1.6883,  29.7878),
    "Musanze":        (-1.4986,  29.6344),
    "Burera":         (-1.4769,  29.8539),
    "Gicumbi":        (-1.5736,  30.0931),
    "Rwamagana":      (-1.9486,  30.4353),
    "Nyagatare":      (-1.2978,  30.3283),
    "Gatsibo":        (-1.5869,  30.4597),
    "Kayonza":        (-1.9983,  30.6478),
    "Kirehe":         (-2.1553,  30.6681),
    "Ngoma":          (-2.1558,  30.4319),
    "Bugesera":       (-2.2153,  30.2519),
}

CROPS = ["maize", "beans", "irish_potato", "sorghum", "cassava"]

print("Loading TIF and district CSV...")
df_districts = pd.read_csv(CSV_PATH)

# Build district → suitability mapping
suitability_map = {}
for _, row in df_districts.iterrows():
    name = row["district"]
    suitability_map[name] = {
        "maize":        int(row["maize_suitability"]),
        "beans":        int(row["beans_suitability"]),
        "irish_potato": int(row["irish_potato_suitability"]),
        "sorghum":      int(row["sorghum_suitability"]),
        "cassava":      int(row["cassava_suitability"]),
    }

with rasterio.open(TIF_PATH) as src:
    n_bands = src.count
    transform = src.transform
    width = src.width
    height = src.height
    bounds = src.bounds
    nodata = src.nodata

    print(f"TIF: {n_bands} bands, {width}x{height} pixels, bounds={bounds}")

    # Sample a grid — every STEP-th pixel
    STEP = 10
    rows_idx = np.arange(0, height, STEP)
    cols_idx = np.arange(0, width, STEP)

    # Convert pixel indices to lon/lat using the affine transform
    # transform * (col, row) → (x, y) = (lon, lat)
    xs = transform.c + (cols_idx + 0.5) * transform.a          # lon
    ys = transform.f + (rows_idx + 0.5) * transform.e          # lat

    # Build meshgrid
    lon_grid, lat_grid = np.meshgrid(xs, ys)
    lon_flat = lon_grid.ravel()
    lat_flat = lat_grid.ravel()

    # Filter to Rwanda bounding box
    mask = (
        (lat_flat >= bounds.bottom) & (lat_flat <= bounds.top) &
        (lon_flat >= bounds.left)   & (lon_flat <= bounds.right)
    )
    lon_flat = lon_flat[mask]
    lat_flat = lat_flat[mask]

    print(f"Sampling {len(lat_flat)} grid points...")

    # Read all bands at sampled pixel locations
    col_px = ((lon_flat - transform.c) / transform.a).astype(int)
    row_px = ((lat_flat - transform.f) / transform.e).astype(int)

    # Clip to valid range
    col_px = np.clip(col_px, 0, width - 1)
    row_px = np.clip(row_px, 0, height - 1)

    # Read band data — read full array then index (faster than per-pixel reads)
    band_data = src.read()  # shape: (n_bands, height, width)

features = band_data[:, row_px, col_px].T  # shape: (n_points, n_bands)

# Assign each point to nearest district centroid
centroid_names = list(DISTRICT_CENTROIDS.keys())
centroid_lats = np.array([DISTRICT_CENTROIDS[d][0] for d in centroid_names])
centroid_lons = np.array([DISTRICT_CENTROIDS[d][1] for d in centroid_names])

# Euclidean distance in lat/lon space (sufficient for Rwanda's small extent)
diffs_lat = lat_flat[:, None] - centroid_lats[None, :]
diffs_lon = lon_flat[:, None] - centroid_lons[None, :]
distances = np.sqrt(diffs_lat**2 + diffs_lon**2)
nearest_idx = distances.argmin(axis=1)
district_labels = np.array([centroid_names[i] for i in nearest_idx])

# Build label arrays for each crop
labels = {crop: np.array([
    suitability_map.get(d, {}).get(crop, 0)
    for d in district_labels
]) for crop in CROPS}

# Remove rows with nodata
if nodata is not None:
    valid_mask = ~np.any(features == nodata, axis=1)
    features = features[valid_mask]
    district_labels = district_labels[valid_mask]
    labels = {crop: arr[valid_mask] for crop, arr in labels.items()}

# Also remove rows with NaN
nan_mask = ~np.any(np.isnan(features.astype(float)), axis=1)
features = features[nan_mask]
for crop in CROPS:
    labels[crop] = labels[crop][nan_mask]

print(f"Clean training samples: {len(features)}")

# Train one RandomForest per crop
models = {}
for crop in CROPS:
    y = labels[crop]
    clf = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    clf.fit(features, y)
    scores = cross_val_score(clf, features, y, cv=3, scoring="accuracy")
    print(f"  {crop}: cv accuracy = {scores.mean():.3f} ± {scores.std():.3f}")
    models[crop] = clf

# Save bundle
output = {
    "models": models,
    "n_bands": n_bands,
    "crops": CROPS,
}
out_path = os.path.join(MODELS_DIR, "rwanda_agrisense_models.joblib")
joblib.dump(output, out_path)
print(f"\nSaved: rwanda_agrisense_models.joblib  ({len(CROPS)} crop models, {n_bands} TIF bands)")
