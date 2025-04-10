from flask import Flask, request, jsonify
import joblib
import numpy as np
import pandas as pd
from tensorflow.keras.models import load_model
import shap

# Initialisation Flask
app = Flask(__name__)

# Chargement des modèles
preprocesseur = joblib.load("pipelines/preprocessing_pipeline.joblib")
autoencodeur = load_model("models/autoencoder_model.keras")
xgb_model = joblib.load("models/xgboost_model.joblib")
mlp_model = joblib.load("models/mlp_model.joblib")
meta_model = joblib.load("models/meta_model.joblib")

# Mapping lisible pour SHAP
feature_mapping = {
    "num__transaction_amount": "Montant élevé",
    "num__risk_score": "Score de risque",
    "num__distance_from_home": "Distance au domicile",
    "num__days_since_last_transaction": "Jours depuis la dernière transaction",
    "cat__merchant_city_Casablanca": "Ville = Casablanca",
    "cat__merchant_country_USA": "Pays = USA",
    "cat__pos_entry_mode_Manual": "Canal = TPE",
    "autoencoder_mse": "Erreur de reconstruction"
}

# Règles métiers
def detecter_regle(transaction):
    if (
        transaction.get("merchant_country") == "USA"
        and transaction.get("cvv_validation") == "Invalid"
        and transaction.get("pos_entry_mode") == "Manual"
    ):
        return "EEE205 - CVV invalide USA"
    if transaction.get("risk_score", 0) > 0.9 and transaction.get("transaction_amount", 0) > 3000:
        return "ETP202 - Montant élevé avec score risque"
    return ""

# Calcul du MSE Autoencodeur
def calculer_mse(X, modele, batch_size=1000):
    mse_liste = []
    for i in range(0, len(X), batch_size):
        X_batch = X[i:i+batch_size]
        X_pred = modele.predict(X_batch)
        mse = np.mean(np.square(X_batch - X_pred), axis=1)
        mse_liste.append(mse)
    return np.concatenate(mse_liste)

# Endpoint de prédiction
@app.route("/predict", methods=["POST"])
def predire_fraude():
    try:
        data = request.get_json()
        df_input = pd.DataFrame([data])

        # ✅ Patch : ajout des colonnes manquantes
        colonnes_attendues = preprocesseur.feature_names_in_
        for col in colonnes_attendues:
            if col not in df_input.columns:
                df_input[col] = None

        # Prétraitement
        X_prep = preprocesseur.transform(df_input)

        # Ajout du MSE de l'autoencodeur comme feature
        mse = calculer_mse(X_prep, autoencodeur, batch_size=1)
        X_hybride = np.hstack((X_prep, mse.reshape(-1, 1)))

        # Prédictions
        xgb_proba = xgb_model.predict_proba(X_hybride)[:, 1].reshape(-1, 1)
        mlp_proba = mlp_model.predict_proba(X_hybride)[:, 1].reshape(-1, 1)
        X_meta = np.hstack((xgb_proba, mlp_proba))
        pred = meta_model.predict(X_meta)[0]
        score_final = float((xgb_proba[0][0] + mlp_proba[0][0]) / 2)

        # 🧠 Explications SHAP
        explainer = shap.TreeExplainer(xgb_model)
        shap_values = explainer.shap_values(X_hybride)
        valeurs_instance = shap_values[0]

        feature_names = list(preprocesseur.get_feature_names_out()) + ["autoencoder_mse"]
        explication_shap = []

        for name, impact in zip(feature_names, valeurs_instance):
            impact_percent = round(abs(impact) * 100)
            if impact_percent >= 1:
                nom = feature_mapping.get(name, name.replace("num__", "").replace("cat__", ""))
                if name.startswith("num__"):
                    interpretation = "Variable numérique influente"
                elif name.startswith("cat__"):
                    interpretation = "Catégorie présente dans la transaction"
                elif name == "autoencoder_mse":
                    interpretation = "Erreur de reconstruction du modèle"
                else:
                    interpretation = "Variable influente"
                explication_shap.append(
                    f"{nom} – Impact : {impact_percent}% ({interpretation})"
                )

        regle = detecter_regle(data)

        return jsonify({
            "prediction": int(pred),
            "probabilite_xgboost": float(xgb_proba[0][0]),
            "probabilite_mlp": float(mlp_proba[0][0]),
            "mse_autoencodeur": float(mse[0]),
            "score_final": score_final,
            "explication_shap": explication_shap,
            "regle_hps": regle
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Lancement serveur Flask
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
