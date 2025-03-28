import requests
import random
import time
import datetime
import logging
import sqlite3
import json
import os
import csv

# 🎯 Configuration des logs (console + fichier)
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("transactions.log", mode='a', encoding='utf-8'),
        logging.StreamHandler()
    ]
)

# 🛠️ Mode automatique Docker ou local
if os.getenv("DOCKER_MODE") == "1":
    API_FLASK = "http://flask-api:5000/predict"
    API_ALERT = "http://node-backend:3000/api/email/alert"
else:
    API_FLASK = "http://localhost:5000/predict"
    API_ALERT = "http://localhost:3000/api/email/alert"

# 📁 Initialisation base SQLite
def init_db():
    conn = sqlite3.connect("predictions.db")
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            transaction_json TEXT,
            prediction INTEGER,
            proba_mlp REAL,
            proba_xgboost REAL,
            mse REAL
        )
    ''')
    conn.commit()
    conn.close()

# 💾 Sauvegarde en base
def save_prediction(transaction, result):
    conn = sqlite3.connect("predictions.db")
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO predictions (
            timestamp, transaction_json, prediction,
            proba_mlp, proba_xgboost, mse
        ) VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        datetime.datetime.now().isoformat(),
        json.dumps(transaction),
        result.get("prediction"),
        result.get("probabilite_mlp"),
        result.get("probabilite_xgboost"),
        result.get("mse_autoencodeur")
    ))
    conn.commit()
    conn.close()

# 🧾 Export CSV si fraude détectée
def exporter_csv_si_fraude(transaction, result):
    if result.get("prediction") == 1:
        fichier = "fraude.csv"
        entetes = list(transaction.keys()) + ["mse", "proba_mlp", "proba_xgboost"]
        ligne = list(transaction.values()) + [
            result.get("mse_autoencodeur"),
            result.get("probabilite_mlp"),
            result.get("probabilite_xgboost")
        ]
        fichier_existe = os.path.isfile(fichier)
        with open(fichier, mode='a', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            if not fichier_existe:
                writer.writerow(entetes)
            writer.writerow(ligne)

# 📬 Appel du backend Node.js pour l’envoi d’alerte
def notifier_backend_node(transaction, result):
    try:
        payload = {
            "montant": transaction.get("transaction_amount"),
            "lieu": f'{transaction.get("merchant_city")} ({transaction.get("merchant_country")})',
            "dateTransaction": transaction.get("transaction_local_date"),
            "typeTerminal": f'{transaction.get("channel")} - {transaction.get("pos_entry_mode")}',
            "carte": transaction.get("card_number"),
            "scores": {
                "probabilite_xgboost": result.get("probabilite_xgboost"),
                "probabilite_mlp": result.get("probabilite_mlp"),
                "mse_autoencodeur": result.get("mse_autoencodeur")
            }
        }
        response = requests.post(API_ALERT, json=payload)
        if response.status_code == 200:
            logging.info("📧 Alerte email envoyée via le backend Node.js")
        else:
            logging.warning(f"⚠️ Échec de l’envoi email : {response.text}")
    except Exception as e:
        logging.error(f"❌ Erreur alerte email : {e}")

# 🔁 Génération d'une transaction simulée
def generer_transaction(force_fraude=False):
    today = datetime.date.today()
    transaction = {
        "transaction_amount": round(random.uniform(10, 2000), 2),
        "transaction_fee": round(random.uniform(1, 50), 2),
        "risk_score": round(random.uniform(0, 1), 2),
        "bin": random.choice([45789, 51234, 60110, 42123]),
        "bin_country": random.choice(["Maroc", "Nigeria", "France", "USA"]),
        "card_type": random.choice(["Credit", "Debit", "Prepaid"]),
        "card_brand": random.choice(["Visa", "MasterCard", "Amex"]),
        "issuing_bank": random.choice(["Attijariwafa Bank", "Unknown Bank", "CIH", "BMCE", "BOA"]),
        "transaction_currency": "MAD",
        "transaction_local_date": str(today),
        "merchant_category_code": random.choice([5999, 5411, 5732, 4812]),
        "merchant_name": random.choice(["Luxury Store", "ElectroMaroc", "SuperMarket", "Tech Store"]),
        "merchant_city": random.choice(["Casablanca", "Rabat", "Fès", "Marrakech"]),
        "merchant_country": "Maroc",
        "acquiring_country": "Maroc",
        "pos_entry_mode": random.choice(["Chip", "Manual", "Contactless"]),
        "transaction_status": random.choice(["Approved", "Declined"]),
        "channel": random.choice(["POS", "ATM", "Online"]),
        "motif_rejet": random.choice(["", "Stolen card", "Insufficient funds", "Expired card"]),
        "cvv_validation": random.choice(["Valid", "Invalid"]),
        "expiration_date_valid": random.choice([True, False]),
        "is_ecommerce": random.choice([True, False]),
        "is_domestic": random.choice([True, False]),
        "customer_city": random.choice(["Lagos", "Casablanca", "Abuja", "Tunis"]),
        "customer_phone": random.randint(600000000, 699999999),
        "device_id": f"DEV-{random.randint(100, 999)}",
        "merchant_id": f"MID-{random.randint(100, 999)}",
        "terminal_id": f"TERM-{random.randint(100, 999)}",
        "authorization_code": f"{random.choice('ABCDEFGH')}{random.randint(1,9)}{random.choice('JKLMN')}{random.randint(1,9)}{random.choice('XYZ')}",
        "card_number": random.randint(4000000000000000, 4999999999999999)
    }

    if force_fraude:
        transaction.update({
            "cvv_validation": "Invalid",
            "expiration_date_valid": False,
            "is_domestic": False,
            "bin_country": "Nigeria",
            "merchant_country": "Maroc",
            "motif_rejet": "Stolen card",
            "transaction_amount": round(random.uniform(1800, 2500), 2)
        })

    return transaction

# 🚀 Boucle principale
def lancer_envoi(frequence_secondes=10, forcer_fraude_tous_les=4):
    logging.info("🚀 Lancement du simulateur de transactions")
    compteur = 0
    while True:
        compteur += 1
        force_fraude = (compteur % forcer_fraude_tous_les == 0)
        transaction = generer_transaction(force_fraude)
        try:
            réponse = requests.post(API_FLASK, json=transaction)
            resultat = réponse.json()

            logging.info("📤 Transaction envoyée :")
            logging.info(transaction)
            logging.info(f"✅ Réponse API : {réponse.status_code} - {resultat}")

            save_prediction(transaction, resultat)
            if resultat.get("prediction") == 1:
                exporter_csv_si_fraude(transaction, resultat)
                notifier_backend_node(transaction, resultat)
                logging.warning("🚨 FRAUDE DÉTECTÉE : alerte envoyée et CSV mis à jour")

        except Exception as erreur:
            logging.error(f"❌ Erreur lors de la requête : {erreur}")

        time.sleep(frequence_secondes)

# 🏁 Lancement
if __name__ == "__main__":
    init_db()
    lancer_envoi(frequence_secondes=10, forcer_fraude_tous_les=4)
