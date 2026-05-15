import os
import pickle
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.tree import DecisionTreeRegressor

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE, "data", "yield_df.csv")
MODELS_DIR = os.path.join(BASE, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

df = pd.read_csv(DATA_PATH)
if "Unnamed: 0" in df.columns:
    df.drop("Unnamed: 0", axis=1, inplace=True)
df.drop_duplicates(inplace=True)

col = ["Year", "average_rain_fall_mm_per_year", "pesticides_tonnes", "avg_temp", "Area", "Item", "hg/ha_yield"]
df = df[col]

X = df.drop("hg/ha_yield", axis=1)
y = df["hg/ha_yield"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=0, shuffle=True)

ohe = OneHotEncoder(drop="first")
scale = StandardScaler()
preprocesser = ColumnTransformer(
    transformers=[
        ("StandardScale", scale, [0, 1, 2, 3]),
        ("OneHotEncode", ohe, [4, 5]),
    ],
    remainder="passthrough",
)

X_train_t = preprocesser.fit_transform(X_train)
X_test_t = preprocesser.transform(X_test)

dtr = DecisionTreeRegressor()
dtr.fit(X_train_t, y_train)

from sklearn.metrics import r2_score
score = r2_score(y_test, dtr.predict(X_test_t))
print(f"Yield model R² = {score:.4f}")

with open(os.path.join(MODELS_DIR, "dtr.pkl"), "wb") as f:
    pickle.dump(dtr, f)
with open(os.path.join(MODELS_DIR, "preprocesser.pkl"), "wb") as f:
    pickle.dump(preprocesser, f)

print("Saved: dtr.pkl, preprocesser.pkl")
