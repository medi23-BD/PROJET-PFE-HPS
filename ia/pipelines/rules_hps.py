from datetime import datetime, timedelta
from collections import defaultdict


PAYS_RISQUE = ["Malaisie", "Philippines", "Sri Lanka", "Equateur", "Pérou", "Colombie", "Antigua et Barbade", "Trinidade et Tobaggo", "République Dominicaine", "Cambodia", "Indonésia"]
PAYS_SANS_TRANSFER = ["Japon", "Thailande", "Népal"]
PAYS_EGA206 = ["Chine", "Inde", "États-Unis", "USA"]

MCC_SENSIBLES = [5541, 4511, 4812, 5722, 5812, 5944, 5947]  # pour EIT204

def parser_date_heure(date_str):
    return datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S")

def filtrer_par_periode(journal, carte, start, end):
    return [t for t in journal if t["card_number"] == carte and start <= parser_date_heure(t["timestamp"]) <= end]

def verifier_EIT204(journal, transaction):
    if transaction["pos_entry_mode"] == "Chip":
        return False
    mcc = transaction["merchant_category_code"]
    if mcc not in MCC_SENSIBLES:
        return False
    date_txn = transaction["transaction_local_date"]
    count = sum(
        1 for t in journal
        if t["card_number"] == transaction["card_number"] and
        t["merchant_category_code"] in MCC_SENSIBLES and
        t["transaction_local_date"] == date_txn and
        t["pos_entry_mode"] != "Chip"
    )
    return count > 3

def verifier_EEE205(journal, transaction):
    date_txn = transaction["transaction_local_date"]
    count = sum(
        1 for t in journal
        if t["card_number"] == transaction["card_number"] and
        t["transaction_local_date"] == date_txn and
        t["pos_entry_mode"] != "Chip"
    )
    return count > 6

def verifier_EEE206(journal, transaction):
    date_txn = transaction["transaction_local_date"]
    count = sum(
        1 for t in journal
        if t["card_number"] == transaction["card_number"] and
        t["transaction_local_date"] == date_txn and
        t["merchant_country"] in PAYS_RISQUE
    )
    return count > 5

def verifier_EGA203(journal, transaction):
    date_txn = transaction["transaction_local_date"]
    count = sum(
        1 for t in journal
        if t["card_number"] == transaction["card_number"] and
        t["transaction_local_date"] == date_txn and
        t["merchant_country"] in PAYS_SANS_TRANSFER
    )
    return count > 2

def verifier_EEE212(transaction):
    return transaction["transaction_currency"] == "EUR" and transaction["transaction_amount"] > 800

def verifier_EGT215(journal, transaction):
    t_time = parser_date_heure(transaction["timestamp"])
    last_30min = t_time - timedelta(minutes=30)
    autres_pays = set()
    for t in filtrer_par_periode(journal, transaction["card_number"], last_30min, t_time):
        if t["merchant_country"] != transaction["merchant_country"] and t["pos_entry_mode"] != "Chip":
            autres_pays.add(t["merchant_country"])
    return len(autres_pays) >= 1

def verifier_EEE216(journal, transaction):
    t_time = parser_date_heure(transaction["timestamp"])
    last_hour = t_time - timedelta(hours=1)
    count = len(filtrer_par_periode(journal, transaction["card_number"], last_hour, t_time))
    return count > 4

def verifier_EGA206bis(journal, transaction):
    if transaction["channel"] != "ATM":
        return False
    date_txn = transaction["transaction_local_date"]
    count = sum(
        1 for t in journal
        if t["card_number"] == transaction["card_number"] and
        t["transaction_local_date"] == date_txn and
        t["merchant_country"] in PAYS_EGA206 and
        t["channel"] == "ATM"
    )
    return count > 4

def verifier_EIN215bis(journal, transaction):
    t_time = parser_date_heure(transaction["timestamp"])
    last_30min = t_time - timedelta(minutes=30)
    pays = set()
    for t in filtrer_par_periode(journal, transaction["card_number"], last_30min, t_time):
        if t["channel"] == "ECOM":
            pays.add(t["merchant_country"])
    return len(pays) >= 3 and transaction["merchant_country"] not in pays

def verifier_EIN227(journal, transaction):
    t_time = parser_date_heure(transaction["timestamp"])
    if not (t_time.hour >= 18 or t_time.hour < 7):
        return False
    date_txn = transaction["transaction_local_date"]
    count = sum(
        1 for t in journal
        if t["transaction_local_date"] == date_txn and
        t["card_number"] == transaction["card_number"] and
        t["channel"] == "ECOM" and
        (parser_date_heure(t["timestamp"]).hour >= 18 or parser_date_heure(t["timestamp"]).hour < 7)
    )
    return count > 3

def verifier_EIN228(journal, transaction):
    t_time = parser_date_heure(transaction["timestamp"])
    if not (7 <= t_time.hour < 18):
        return False
    date_txn = transaction["transaction_local_date"]
    count = sum(
        1 for t in journal
        if t["transaction_local_date"] == date_txn and
        t["card_number"] == transaction["card_number"] and
        t["channel"] == "ECOM" and
        7 <= parser_date_heure(t["timestamp"]).hour < 18
    )
    return count > 3

def verifier_EEE238(journal, transaction):
    if transaction["channel"] != "ECOM":
        return False
    date_txn = transaction["transaction_local_date"]
    montant_total = sum(
        t["transaction_amount"] for t in journal
        if t["transaction_local_date"] == date_txn and
        t["card_number"] == transaction["card_number"] and
        t["channel"] == "ECOM"
    )
    return montant_total > 448000
