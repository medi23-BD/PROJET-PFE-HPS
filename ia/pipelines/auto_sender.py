import sys
import os
import time
import random
import logging
import requests
from datetime import datetime

from rules_hps import (
    verifier_EIT204, verifier_EEE205, verifier_EEE206, verifier_EGA203,
    verifier_EEE212, verifier_EGT215, verifier_EEE216, verifier_EGA206bis,
    verifier_EIN215bis, verifier_EIN227, verifier_EIN228, verifier_EEE238
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
journal_transactions = []

FRAUDE_PATTERNS = [
    {"pattern_id": "FRAUDE_1", "transaction_amount": 700.95, "merchant_country": "Indonésia", "pos_entry_mode": "Manual", "channel": "ECOM", "transaction_currency": "EUR", "cvv_validation": "Invalid", "expiration_date_valid": False, "motif_rejet": "CVV incorrect"},
    {"pattern_id": "FRAUDE_2", "transaction_amount": 2.25, "merchant_country": "Philippines", "pos_entry_mode": "Swipe", "channel": "POS", "transaction_currency": "EUR", "cvv_validation": "Invalid", "expiration_date_valid": False, "motif_rejet": "Montant très faible dans pays à risque"},
    {"pattern_id": "FRAUDE_3", "transaction_amount": 1548.62, "merchant_country": "Japon", "pos_entry_mode": "Manual", "channel": "POS", "transaction_currency": "MAD", "cvv_validation": "Valid", "expiration_date_valid": True, "motif_rejet": ""},
    {"pattern_id": "FRAUDE_4", "transaction_amount": 902.34, "merchant_country": "Chine", "pos_entry_mode": "Swipe", "channel": "ATM", "transaction_currency": "EUR", "cvv_validation": "Invalid", "expiration_date_valid": False, "motif_rejet": "Transaction ATM dans pays ciblé"},
    {"pattern_id": "FRAUDE_5", "transaction_amount": 16000.75, "merchant_country": "Colombie", "pos_entry_mode": "Manual", "channel": "ECOM", "transaction_currency": "EUR", "cvv_validation": "Invalid", "expiration_date_valid": False, "motif_rejet": "Montant élevé et pays à risque"},
    {"pattern_id": "FRAUDE_6", "transaction_amount": 790.10, "merchant_country": "USA", "pos_entry_mode": "Swipe", "channel": "POS", "transaction_currency": "MAD", "cvv_validation": "Invalid", "expiration_date_valid": False, "motif_rejet": "CVV invalide USA"},
    {"pattern_id": "FRAUDE_7", "transaction_amount": 1399.80, "merchant_country": "République Dominicaine", "pos_entry_mode": "Manual", "channel": "POS", "transaction_currency": "EUR", "cvv_validation": "Valid", "expiration_date_valid": True, "motif_rejet": ""},
    {"pattern_id": "FRAUDE_8", "transaction_amount": 448900.00, "merchant_country": "France", "pos_entry_mode": "Manual", "channel": "ECOM", "transaction_currency": "EUR", "cvv_validation": "Valid", "expiration_date_valid": True, "motif_rejet": "Montant e-commerce très élevé"},
    {"pattern_id": "FRAUDE_9", "transaction_amount": 65.00, "merchant_country": "Sri Lanka", "pos_entry_mode": "Manual", "channel": "ECOM", "transaction_currency": "MAD", "cvv_validation": "Invalid", "expiration_date_valid": False, "motif_rejet": "Transaction ecom pays à risque"},
    {"pattern_id": "FRAUDE_10", "transaction_amount": 950.25, "merchant_country": "Equateur", "pos_entry_mode": "Manual", "channel": "POS", "transaction_currency": "EUR", "cvv_validation": "Invalid", "expiration_date_valid": False, "motif_rejet": "POS manual pays à risque"},
]

def get_criticite(score):
    if score >= 0.9:
        return "CRITIQUE"
    elif score >= 0.75:
        return "ÉLEVÉ"
    elif score >= 0.6:
        return "SUSPECT"
    return "INFO"

def generer_transaction(force_fraude=False):
    now = datetime.now()
    base = random.choice(FRAUDE_PATTERNS) if force_fraude else {
        "transaction_amount": round(random.uniform(10, 2000), 2),
        "merchant_country": "Maroc",
        "pos_entry_mode": random.choice(["Chip", "Contactless"]),
        "channel": random.choice(["POS", "ATM"]),
        "transaction_currency": "MAD",
        "cvv_validation": "Valid",
        "expiration_date_valid": True,
        "motif_rejet": ""
    }

    return {
        "transaction_amount": base["transaction_amount"],
        "transaction_fee": round(random.uniform(0.5, 10), 2),
        "risk_score": round(random.uniform(0.2, 1.0), 4),
        "bin": 42123,
        "bin_country": "Maroc",
        "card_type": random.choice(["Debit", "Credit", "Prepaid"]),
        "card_brand": random.choice(["Visa", "Mastercard", "Amex"]),
        "issuing_bank": random.choice(["Attijariwafa Bank", "BMCE", "CDM"]),
        "transaction_currency": base["transaction_currency"],
        "transaction_local_date": now.strftime("%Y-%m-%d"),
        "timestamp": now.strftime("%Y-%m-%d %H:%M:%S"),
        "merchant_category_code": random.choice([5541, 4511, 4812, 5732, 5944, 6011]),
        "merchant_name": random.choice(["Boutique", "Bijouterie", "Station", "Tech Store"]),
        "merchant_city": random.choice(["Fès", "Casablanca", "Marrakech"]),
        "merchant_country": base["merchant_country"],
        "acquiring_country": "Maroc",
        "pos_entry_mode": base["pos_entry_mode"],
        "transaction_status": "Approved",
        "channel": base["channel"],
        "motif_rejet": base["motif_rejet"],
        "cvv_validation": base["cvv_validation"],
        "expiration_date_valid": base["expiration_date_valid"],
        "is_ecommerce": base["channel"] == "ECOM",
        "is_domestic": base["merchant_country"] == "Maroc",
        "customer_city": "Fès",
        "customer_phone": 600000000,
        "device_id": "DEV-001",
        "merchant_id": "MID-001",
        "terminal_id": "TERM-001",
        "authorization_code": "ABC123",
        "card_number": random.randint(4000000000000000, 4999999999999999)
    }

def enregistrer_en_base(payload):
    try:
        res = requests.post("http://localhost:3000/api/transactions", json=payload)
        if res.status_code == 201:
            logging.info("Transaction enregistrée en base de données")
    except Exception as e:
        logging.error(f"Erreur d'enregistrement : {e}")

def envoyer_transaction(transaction):
    try:
        res = requests.post("http://127.0.0.1:5000/predict", json=transaction)
        if res.status_code != 200:
            logging.error(f"Erreur prédiction : {res.status_code}")
            return
        resultat = res.json()
        journal_transactions.append(transaction)
        regles = []

        if verifier_EIT204(journal_transactions, transaction): regles.append("EIT204")
        if verifier_EEE205(journal_transactions, transaction): regles.append("EEE205")
        if verifier_EEE206(journal_transactions, transaction): regles.append("EEE206")
        if verifier_EGA203(journal_transactions, transaction): regles.append("EGA203")
        if verifier_EEE212(transaction): regles.append("EEE212")
        if verifier_EGT215(journal_transactions, transaction): regles.append("EGT215")
        if verifier_EEE216(journal_transactions, transaction): regles.append("EEE216")
        if verifier_EGA206bis(journal_transactions, transaction): regles.append("EGA206bis")
        if verifier_EIN215bis(journal_transactions, transaction): regles.append("EIN215bis")
        if verifier_EIN227(journal_transactions, transaction): regles.append("EIN227")
        if verifier_EIN228(journal_transactions, transaction): regles.append("EIN228")
        if verifier_EEE238(journal_transactions, transaction): regles.append("EEE238")

        score = resultat.get("score_final", 0)
        logging.info(f"Transaction envoyée : {transaction['transaction_amount']} MAD | Score : {score}")

        if resultat["prediction"] == 1 or regles:
            if regles:
                logging.info(f"Règle(s) déclenchée(s) : {', '.join(regles)}")
            payload = {
                "montant": transaction["transaction_amount"],
                "lieu": f"{transaction['merchant_city']} ({transaction['merchant_country']})",
                "dateTransaction": transaction["transaction_local_date"],
                "typeTerminal": f"{transaction['channel']} - {transaction['pos_entry_mode']}",
                "carte": transaction["card_number"],
                "scores": {
                    "probabilite_xgboost": resultat.get("probabilite_xgboost", 0),
                    "probabilite_mlp": resultat.get("probabilite_mlp", 0),
                    "mse_autoencodeur": resultat.get("mse_autoencodeur", 0)
                },
                "explication_shap": resultat.get("explication_shap", []),
                "regle_hps": ", ".join(regles),
                "criticite": get_criticite(resultat.get("probabilite_xgboost", 0))
            }

            enregistrer_en_base(payload)
            requests.post("http://localhost:3000/api/email/alert", json=payload)
            requests.post("http://localhost:3000/api/whatsapp/alert", json=payload)

    except Exception as e:
        logging.error(f"Erreur envoi transaction : {e}")

def lancer_envoi(frequence_secondes=4, forcer_fraude_tous_les=5):
    i = 0
    while True:
        i += 1
        force = (i % forcer_fraude_tous_les == 0)
        transaction = generer_transaction(force)
        envoyer_transaction(transaction)
        time.sleep(frequence_secondes)

if __name__ == "__main__":
    logging.info("Démarrage du simulateur auto_sender.py")
    lancer_envoi()
