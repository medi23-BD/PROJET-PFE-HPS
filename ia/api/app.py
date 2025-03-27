from flask import Flask, request, jsonify
import joblib
import numpy as np
import pandas as pd
from tensorflow.keras.models import load_model

# Création de l'application Flask
app = Flask(__name__)

# Chargement des modèles
preprocesseur = joblib.load("pipelines/preprocessing_pipeline.joblib")
autoencodeur = load_model("models/autoencoder_model.keras")
xgb_modele = joblib.load("models/xgboost_model.joblib")
mlp_modele = joblib.load("models/mlp_model.joblib")
meta_modele = joblib.load("models/meta_model.joblib")

# Fonction utilitaire pour calculer le MSE
def calculer_mse(X, modele, batch_size=1_000):
    mse_liste = []
    for i in range(0, len(X), batch_size):
        X_batch = X[i:i+batch_size]
        X_pred = modele.predict(X_batch)
        mse = np.mean(np.square(X_batch - X_pred), axis=1)
        mse_liste.append(mse)
    return np.concatenate(mse_liste)

@app.route("/predict", methods=["POST"])
def predire_fraude():
    # Récupération des données envoyées
    donnees = request.get_json()
    df_input = pd.DataFrame([donnees])

    # Prétraitement
    X_prep = preprocesseur.transform(df_input)

    # Calcul du MSE via l'autoencodeur
    mse = calculer_mse(X_prep, autoencodeur, batch_size=1)
    X_hybride = np.hstack((X_prep, mse.reshape(-1, 1)))

    # Probabilités des sous-modèles
    xgb_proba = xgb_modele.predict_proba(X_hybride)[:, 1].reshape(-1, 1)
    mlp_proba = mlp_modele.predict_proba(X_hybride)[:, 1].reshape(-1, 1)
    X_meta = np.hstack((xgb_proba, mlp_proba))

    # Prédiction finale
    prediction = meta_modele.predict(X_meta)[0]

    # Construction de la réponse
    reponse = {
        "prediction": int(prediction),  # 0 = normale, 1 = frauduleuse
        "probabilite_xgboost": float(xgb_proba[0][0]),
        "probabilite_mlp": float(mlp_proba[0][0]),
        "mse_autoencodeur": float(mse[0])
    }

    return jsonify(reponse)

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
