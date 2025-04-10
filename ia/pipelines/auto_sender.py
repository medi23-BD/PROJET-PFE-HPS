import time
import json
import random
import logging
import requests
from datetime import datetime

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Génère une transaction aléatoire avec ou sans fraude
def generer_transaction(force_fraude=False):
    return {
        "transaction_amount": round(random.uniform(10, 2000), 2),
        "transaction_fee": round(random.uniform(0.5, 10), 2),
        "risk_score": round(random.uniform(0.2, 1.0), 4),
        "bin": 42123,
        "bin_country": "Maroc",
        "card_type": "Debit",
        "card_brand": "Visa",
        "issuing_bank": "Attijariwafa Bank",
        "transaction_currency": "MAD",
        "transaction_local_date": str(datetime.now().date()),
        "merchant_category_code": 5732,
        "merchant_name": "Boutique en ligne",
        "merchant_city": "Fès",
        "merchant_country": "Maroc",
        "acquiring_country": "Maroc",
        "pos_entry_mode": "Manual" if force_fraude else "Chip",
        "transaction_status": "Approved",
        "channel": "POS" if not force_fraude else "ECOM",
        "motif_rejet": "" if not force_fraude else "Montant incohérent",
        "cvv_validation": "Invalid" if force_fraude else "Valid",
        "expiration_date_valid": not force_fraude,
        "is_ecommerce": force_fraude,
        "is_domestic": True,
        "customer_city": "Fès",
        "customer_phone": 600000000,
        "device_id": "DEV-001",
        "merchant_id": "MID-001",
        "terminal_id": "TERM-001",
        "authorization_code": "ABC123",
        "card_number": random.randint(4000000000000000, 4999999999999999)
    }

# Envoie une transaction vers Flask + email Node.js si fraude détectée
def envoyer_transaction(transaction):
    try:
        response = requests.post("http://127.0.0.1:5000/predict", json=transaction)
        if response.status_code == 200:
            resultat = response.json()
            score = round(resultat.get("score_final", 0), 4)
            logging.info(f"📤 Transaction envoyée : {transaction['transaction_amount']} MAD | Score : {score}")

            if resultat["prediction"] == 1:
                payload_email = {
                    "montant": transaction["transaction_amount"],
                    "lieu": f"{transaction['merchant_city']} ({transaction['merchant_country']})",
                    "dateTransaction": transaction["transaction_local_date"],
                    "typeTerminal": f"{transaction['channel']} - {transaction['pos_entry_mode']}",
                    "carte": transaction["card_number"],
                    "scores": {
                        "probabilite_xgboost": resultat["probabilite_xgboost"],
                        "probabilite_mlp": resultat["probabilite_mlp"],
                        "mse_autoencodeur": resultat["mse_autoencodeur"]
                    },
                    "explication_shap": resultat["explication_shap"],
                    "regle_hps": resultat.get("regle_hps", "")
                }

                logging.info("📦 Payload JSON envoyé à Node.js :\n" + json.dumps(payload_email, indent=2, ensure_ascii=False))

                try:
                    email_response = requests.post("http://localhost:3000/api/email/alert", json=payload_email)
                    if email_response.status_code == 200:
                        logging.info("📧 Alerte email envoyée ✅")
                    else:
                        logging.warning(f"⚠️ Erreur envoi email : {email_response.status_code}")
                except Exception as err:
                    logging.error(f"❌ Erreur appel Node.js : {err}")
        else:
            logging.error(f"❌ Erreur prédiction Flask : {response.status_code}")
    except Exception as e:
        logging.error(f"❌ Exception Flask : {e}")

# Boucle automatique avec envoi toutes les 4s
def lancer_envoi(frequence_secondes=4, forcer_fraude_tous_les=5):
    i = 0
    while True:
        i += 1
        force = (i % forcer_fraude_tous_les == 0)
        transaction = generer_transaction(force)
        envoyer_transaction(transaction)
        time.sleep(frequence_secondes)

if __name__ == "__main__":
    logging.info("🚀 Démarrage du simulateur auto_sender.py...")
    lancer_envoi(frequence_secondes=4, forcer_fraude_tous_les=5)
