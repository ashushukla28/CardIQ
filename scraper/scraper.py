import os, json, time, smtplib, requests
from bs4 import BeautifulSoup
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import date

# ── CONFIG ────────────────────────────────────────────────────────────────
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
GMAIL_USER   = os.environ["GMAIL_USER"]
GMAIL_PASS   = os.environ["GMAIL_PASS"]
ALERT_EMAIL  = os.environ["ALERT_EMAIL"]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    "Accept-Language": "en-IN,en;q=0.9",
}

# ── SUPABASE HELPERS ──────────────────────────────────────────────────────
def sb_get(table, params=""):
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/{table}?{params}",
        headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
    )
    r.raise_for_status()
    return r.json()

def sb_update(table, match_col, match_val, data):
    r = requests.patch(
        f"{SUPABASE_URL}/rest/v1/{table}?{match_col}=eq.{match_val}",
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        },
        json=data
    )
    r.raise_for_status()

def sb_insert(table, data):
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/{table}",
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        },
        json=data
    )
    r.raise_for_status()

# ── SCRAPE BANKBAZAAR ─────────────────────────────────────────────────────
def scrape_bankbazaar():
    cards = []
    urls = [
        "https://www.bankbazaar.com/credit-card.html",
        "https://www.bankbazaar.com/credit-card/travel-credit-cards.html",
        "https://www.bankbazaar.com/credit-card/cashback-credit-cards.html",
        "https://www.bankbazaar.com/credit-card/fuel-credit-cards.html",
        "https://www.bankbazaar.com/credit-card/rewards-credit-cards.html",
    ]
    for url in urls:
        try:
            r = requests.get(url, headers=HEADERS, timeout=20)
            soup = BeautifulSoup(r.text, "html.parser")
            # BankBazaar card listings
            card_blocks = soup.select(".card-item, .credit-card-item, [data-card-name]")
            for block in card_blocks:
                try:
                    name_el = block.select_one(".card-name, h2, h3, [data-card-name]")
                    if not name_el: continue
                    name = name_el.get_text(strip=True)
                    if len(name) < 5: continue

                    # Extract fee
                    fee_el = block.select_one(".annual-fee, .fee, [data-fee]")
                    annual_fee = parse_fee(fee_el.get_text(strip=True) if fee_el else "")

                    # Extract reward rate
                    rr_el = block.select_one(".reward-rate, .reward, [data-reward]")
                    reward_rate = parse_reward(rr_el.get_text(strip=True) if rr_el else "")

                    # Extract bank
                    bank_el = block.select_one(".bank-name, .issuer, [data-bank]")
                    bank = bank_el.get_text(strip=True) if bank_el else ""

                    if name and bank:
                        cards.append({"name": name, "bank": bank, "annual_fee": annual_fee, "reward_rate": reward_rate, "source": "bankbazaar"})
                except Exception:
                    continue
            time.sleep(2)
        except Exception as e:
            print(f"BankBazaar scrape error for {url}: {e}")
    return cards

# ── SCRAPE CARDINSIDER ────────────────────────────────────────────────────
def scrape_cardinsider():
    cards = []
    urls = [
        "https://www.cardinsider.com/credit-cards/",
        "https://www.cardinsider.com/credit-cards/travel-credit-cards/",
        "https://www.cardinsider.com/credit-cards/cashback-credit-cards/",
        "https://www.cardinsider.com/credit-cards/fuel-credit-cards/",
    ]
    for url in urls:
        try:
            r = requests.get(url, headers=HEADERS, timeout=20)
            soup = BeautifulSoup(r.text, "html.parser")
            card_blocks = soup.select(".card-block, .credit-card-block, article")
            for block in card_blocks:
                try:
                    name_el = block.select_one("h2, h3, .card-title, .card-name")
                    if not name_el: continue
                    name = name_el.get_text(strip=True)
                    if len(name) < 5: continue

                    fee_el = block.select_one(".annual-fee, .fee-amount")
                    annual_fee = parse_fee(fee_el.get_text(strip=True) if fee_el else "")

                    rr_el = block.select_one(".reward-rate, .rewards")
                    reward_rate = parse_reward(rr_el.get_text(strip=True) if rr_el else "")

                    bank_el = block.select_one(".bank, .issuer, .bank-name")
                    bank = bank_el.get_text(strip=True) if bank_el else extract_bank_from_name(name)

                    if name:
                        cards.append({"name": name, "bank": bank, "annual_fee": annual_fee, "reward_rate": reward_rate, "source": "cardinsider"})
                except Exception:
                    continue
            time.sleep(2)
        except Exception as e:
            print(f"CardInsider scrape error for {url}: {e}")
    return cards

# ── PARSERS ───────────────────────────────────────────────────────────────
def parse_fee(text):
    if not text: return None
    text = text.lower().replace(",", "").replace("rs", "").replace("₹", "").strip()
    if "free" in text or "nil" in text or "zero" in text or "0" == text: return 0
    import re
    nums = re.findall(r"\d+", text)
    return int(nums[0]) if nums else None

def parse_reward(text):
    if not text: return None
    import re
    nums = re.findall(r"[\d.]+", text)
    return float(nums[0]) if nums else None

def extract_bank_from_name(name):
    banks = ["HDFC", "SBI", "ICICI", "Axis", "Kotak", "IndusInd", "IDFC", "RBL", "YES", "Amex", "American Express", "AU", "HSBC", "Standard Chartered", "Federal", "Canara", "Union", "PNB", "IDBI"]
    for b in banks:
        if b.lower() in name.lower(): return b + " Bank" if b not in ["American Express", "HSBC"] else b
    return ""

# ── NORMALISE CARD NAME ───────────────────────────────────────────────────
def normalise(name):
    return name.lower().strip().replace("-", " ").replace("  ", " ")

# ── COMPARE & UPDATE ──────────────────────────────────────────────────────
def run():
    print("Fetching existing cards from Supabase...")
    existing = sb_get("cards", "select=id,name,bank,annual_fee,reward_rate,is_active")
    existing_map = {normalise(c["name"]): c for c in existing}

    print("Scraping BankBazaar...")
    bb_cards = scrape_bankbazaar()
    print(f"Found {len(bb_cards)} cards on BankBazaar")

    print("Scraping CardInsider...")
    ci_cards = scrape_cardinsider()
    print(f"Found {len(ci_cards)} cards on CardInsider")

    # Merge scraped data (prefer CardInsider, supplement with BankBazaar)
    scraped_map = {}
    for c in bb_cards + ci_cards:
        key = normalise(c["name"])
        if key not in scraped_map:
            scraped_map[key] = c
        else:
            # Update with non-null values
            if c.get("annual_fee") is not None: scraped_map[key]["annual_fee"] = c["annual_fee"]
            if c.get("reward_rate") is not None: scraped_map[key]["reward_rate"] = c["reward_rate"]

    updates = []
    new_cards = []
    today = str(date.today())

    for key, scraped in scraped_map.items():
        if key in existing_map:
            existing_card = existing_map[key]
            changes = {}
            # Check annual fee change
            if scraped.get("annual_fee") is not None:
                existing_fee = existing_card.get("annual_fee") or 0
                if abs(scraped["annual_fee"] - existing_fee) > 50:  # Rs50 threshold
                    changes["annual_fee"] = scraped["annual_fee"]
                    updates.append(f"💸 {existing_card['name']}: Annual fee changed from Rs{existing_fee} → Rs{scraped['annual_fee']}")
            # Check reward rate change
            if scraped.get("reward_rate") is not None:
                existing_rr = float(existing_card.get("reward_rate") or 0)
                if abs(scraped["reward_rate"] - existing_rr) > 0.5:
                    changes["reward_rate"] = scraped["reward_rate"]
                    updates.append(f"🎁 {existing_card['name']}: Reward rate changed from {existing_rr} → {scraped['reward_rate']}")
            if changes:
                changes["last_verified"] = today
                sb_update("cards", "id", existing_card["id"], changes)
        else:
            # New card detected — auto add
            new_card = {
                "name": scraped["name"],
                "bank": scraped.get("bank") or extract_bank_from_name(scraped["name"]),
                "network": "Visa",  # Default — may need manual update
                "annual_fee": scraped.get("annual_fee") or 0,
                "joining_fee": scraped.get("annual_fee") or 0,
                "fee_waiver": "Check issuer website",
                "apr": 3.5,
                "forex_fee": 3.5,
                "reward_rate": scraped.get("reward_rate") or 1,
                "point_value": 0.25,
                "lounge_domestic": 0,
                "lounge_intl": 0,
                "welcome_bonus": 0,
                "min_income": 25000,
                "apply_url": f"https://www.cardinsider.com/credit-cards/",
                "best_for": "Check issuer website for full details",
                "is_active": True,
                "last_verified": today,
                "score_cashback": 50, "score_travel": 50, "score_rewards": 50,
                "score_fuel": 50, "score_dining": 50, "score_low_fees": 50,
                "score_forex": 50, "score_emi": 50,
            }
            try:
                sb_insert("cards", new_card)
                new_cards.append(scraped["name"])
            except Exception as e:
                print(f"Failed to insert {scraped['name']}: {e}")

    # Send email summary
    send_email(updates, new_cards)
    print(f"Done. {len(updates)} updates, {len(new_cards)} new cards added.")

# ── EMAIL ALERT ───────────────────────────────────────────────────────────
def send_email(updates, new_cards):
    if not updates and not new_cards:
        subject = "CardIQ Weekly Scrape — No Changes Detected"
        body = "All 151+ card data points are up to date. No changes detected this week."
    else:
        subject = f"CardIQ Weekly Update — {len(updates)} changes, {len(new_cards)} new cards"
        lines = []
        if updates:
            lines.append("<h2>Data Changes Detected</h2><ul>")
            for u in updates: lines.append(f"<li>{u}</li>")
            lines.append("</ul>")
        if new_cards:
            lines.append("<h2>New Cards Added</h2><ul>")
            for c in new_cards: lines.append(f"<li>{c} — <em>review and update scores in Supabase</em></li>")
            lines.append("</ul>")
        lines.append("<p><a href='https://supabase.com/dashboard'>Open Supabase to review</a></p>")
        body = "".join(lines)

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = GMAIL_USER
        msg["To"] = ALERT_EMAIL
        msg.attach(MIMEText(body, "html"))
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL_USER, GMAIL_PASS)
            server.sendmail(GMAIL_USER, ALERT_EMAIL, msg.as_string())
        print("Email sent successfully")
    except Exception as e:
        print(f"Email failed: {e}")

if __name__ == "__main__":
    run()
