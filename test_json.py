import json
import random
import numpy as np
import logging

# Log pour debug
logging.basicConfig(level=logging.INFO)

# Simule une prédiction avec des floats
def generer_prediction():
    return {
        "montant": round(random.uniform(10, 5000), 2),
        "scores": {
            "probabilite_xgboost": float(np.random.random()),
            "probabilite_mlp": float(np.random.random()),
            "mse_autoencodeur": float(np.random.random())
        },
        "explication_shap": [],
        "regle_hps": "EEE205 - CVV invalide USA"
    }

#  Test du JSON
for i in range(10):
    data = generer_prediction()
    try:
        json_data = json.dumps(data, allow_nan=False)
        logging.info(f"[{i}]  JSON valide généré :")
        print(json_data)
    except Exception as e:
        logging.error(f"[{i}]  Erreur JSON : {e}")
        print(data)
