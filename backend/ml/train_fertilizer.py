import os
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE, "data", "Fertilizer_Prediction.csv")
MODELS_DIR = os.path.join(BASE, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

data = pd.read_csv(DATA_PATH)

y = data["Fertilizer Name"].copy()
X = data.drop("Fertilizer Name", axis=1).copy()

X_train, X_test, y_train, y_test = train_test_split(X, y, train_size=0.7, shuffle=True, random_state=1)

preprocessor = ColumnTransformer(
    transformers=[
        ("onehot", Pipeline(steps=[("enc", OneHotEncoder(sparse_output=False))]), ["Soil Type", "Crop Type"]),
    ],
    remainder="passthrough",
)

model = Pipeline(steps=[
    ("preprocessor", preprocessor),
    ("scaler", StandardScaler()),
    ("classifier", RandomForestClassifier(n_estimators=100, random_state=42)),
])

model.fit(X_train, y_train)
acc = model.score(X_test, y_test)
print(f"Fertilizer model accuracy = {acc*100:.2f}%")

joblib.dump(model, os.path.join(MODELS_DIR, "fertilizer_model.pkl"))
print("Saved: fertilizer_model.pkl")
