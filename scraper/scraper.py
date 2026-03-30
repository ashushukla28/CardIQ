import os, re, time, json, smtplib, requests
from datetime import date
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from playwright.sync_api import sync_playwright

# ── CONFIG ────────────────────────────────────────────────────────────────
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
GMAIL_USER   = os.environ["GMAIL_USER"]
GMAIL_PASS   = os.environ["GMAIL_PASS"]
ALERT_EMAIL  = os.environ["ALERT_EMAIL"]

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
        headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}",
                 "Content-Type": "application/json", "Prefer": "return=minimal"},
        json=data
    )
    r.raise_for_status()

def sb_insert(table, data):
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/{table}",
        headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}",
                 "Content-Type": "application/json", "Prefer": "return=minimal"},
        json=data
    )
    r.raise_for_status()

# ── PARSERS ───────────────────────────────────────────────────────────────
def parse_fee(text):
    if not text: return None
    text = text.lower().replace(",", "").replace("rs", "").replace("₹", "").strip()
    if any(w in text for w in ["free", "nil", "zero", "waived", "lifetime"]): return 0
    nums = re.findall(r"\d+", text)
    return int(nums[0]) if nums else None

def parse_reward(text):
    if not text: return None
    nums = re.findall(r"[\d.]+", text)
    return float(nums[0]) if nums else None

def extract_bank(name):
    banks = [
        ("HDFC", "HDFC Bank"), ("SBI", "SBI Card"), ("ICICI", "ICICI Bank"),
        ("Axis", "Axis Bank"), ("Kotak", "Kotak Bank"), ("IndusInd", "IndusInd Bank"),
        ("IDFC", "IDFC FIRST Bank"), ("RBL", "RBL Bank"), ("YES", "YES Bank"),
        ("American Express", "American Express"), ("Amex", "American Express"),
        ("AU ", "AU Bank"), ("HSBC", "HSBC India"),
        ("Standard Chartered", "Standard Chartered"), ("Federal", "Federal Bank"),
        ("Canara", "Canara Bank"), ("Union", "Union Bank"),
        ("PNB", "Punjab National Bank"), ("IDBI", "IDBI Bank"),
        ("Bank of Baroda", "Bank of Baroda"), ("BoB", "Bank of Baroda"),
    ]
    for key, full in banks:
        if key.lower() in name.lower(): return full
    return ""

def normalise(name):
    return name.lower().strip().replace("-", " ").replace("  ", " ")

# ── SCRAPE CARDINSIDER ────────────────────────────────────────────────────
def scrape_cardinsider(page):
    cards = []
    urls = [
        "https://www.cardinsider.com/credit-cards/",
        "https://www.cardinsider.com/credit-cards/travel-credit-cards/",
        "https://www.cardinsider.com/credit-cards/cashback-credit-cards/",
        "https://www.cardinsider.com/credit-cards/fuel-credit-cards/",
        "https://www.cardinsider.com/credit-cards/rewards-credit-cards/",
        "https://www.cardinsider.com/credit-cards/shopping-credit-cards/",
        "https://www.cardinsider.com/credit-cards/lifestyle-credit-cards/",
    ]
    for url in urls:
        try:
            page.goto(url, wait_until="networkidle", timeout=30000)
            page.wait_for_timeout(2000)
            # Scroll to load lazy content
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(1500)

            blocks = page.query_selector_all(".card-block, .credit-card-item, .card-list-item, article.card")
            print(f"  CardInsider {url}: found {len(blocks)} blocks")

            for block in blocks:
                try:
                    name_el = block.query_selector("h2, h3, .card-name, .card-title")
                    if not name_el: continue
                    name = name_el.inner_text().strip()
                    if len(name) < 5: continue

                    fee_el = block.query_selector(".annual-fee, .fee, [class*='fee']")
                    annual_fee = parse_fee(fee_el.inner_text() if fee_el else "")

                    rr_el = block.query_selector(".reward-rate, .rewards, [class*='reward']")
                    reward_rate = parse_reward(rr_el.inner_text() if rr_el else "")

                    bank_el = block.query_selector(".bank-name, .issuer, .bank")
                    bank = bank_el.inner_text().strip() if bank_el else extract_bank(name)

                    cards.append({"name": name, "bank": bank, "annual_fee": annual_fee, "reward_rate": reward_rate})
                except Exception:
                    continue
        except Exception as e:
            print(f"  CardInsider error {url}: {e}")
        time.sleep(1)
    return cards

# ── SCRAPE BANKBAZAAR ─────────────────────────────────────────────────────
def scrape_bankbazaar(page):
    cards = []
    urls = [
        "https://www.bankbazaar.com/credit-card.html",
        "https://www.bankbazaar.com/travel-credit-card.html",
        "https://www.bankbazaar.com/cashback-credit-card.html",
        "https://www.bankbazaar.com/fuel-credit-card.html",
        "https://www.bankbazaar.com/rewards-credit-card.html",
    ]
    for url in urls:
        try:
            page.goto(url, wait_until="networkidle", timeout=30000)
            page.wait_for_timeout(2000)
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(1500)

            blocks = page.query_selector_all(".card-item, .credit-card-item, [data-card-name], .cardItem")
            print(f"  BankBazaar {url}: found {len(blocks)} blocks")

            for block in blocks:
                try:
                    name_el = block.query_selector("h2, h3, .card-name, [data-card-name]")
                    if not name_el: continue
                    name = name_el.inner_text().strip()
                    if len(name) < 5: continue

                    fee_el = block.query_selector(".annual-fee, .fee, [class*='fee']")
                    annual_fee = parse_fee(fee_el.inner_text() if fee_el else "")

                    rr_el = block.query_selector(".reward-rate, [class*='reward']")
                    reward_rate = parse_reward(rr_el.inner_text() if rr_el else "")

                    bank_el = block.query_selector(".bank-name, .issuer")
                    bank = bank_el.inner_text().strip() if bank_el else extract_bank(name)

                    cards.append({"name": name, "bank": bank, "annual_fee": annual_fee, "reward_rate": reward_rate})
                except Exception:
                    continue
        except Exception as e:
            print(f"  BankBazaar error {url}: {e}")
        time.sleep(1)
    return cards

# ── MAIN ──────────────────────────────────────────────────────────────────
def run():
    print("Fetching existing cards from Supabase...")
    existing = sb_get("cards", "select=id,name,bank,annual_fee,reward_rate")
    existing_map = {normalise(c["name"]): c for c in existing}
    print(f"Loaded {len(existing)} existing cards")

    print("Starting Playwright browser...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
            viewport={"width": 1280, "height": 800}
        )
        page = context.new_page()

        print("Scraping CardInsider...")
        ci_cards = scrape_cardinsider(page)
        print(f"CardInsider total: {len(ci_cards)} cards")

        print("Scraping BankBazaar...")
        bb_cards = scrape_bankbazaar(page)
        print(f"BankBazaar total: {len(bb_cards)} cards")

        browser.close()

    # Merge — prefer CardInsider
    scraped_map = {}
    for c in bb_cards + ci_cards:
        key = normalise(c["name"])
        if key not in scraped_map:
            scraped_map[key] = c
        else:
            if c.get("annual_fee") is not None: scraped_map[key]["annual_fee"] = c["annual_fee"]
            if c.get("reward_rate") is not None: scraped_map[key]["reward_rate"] = c["reward_rate"]

    print(f"Total unique scraped cards: {len(scraped_map)}")

    updates = []
    new_cards = []
    today = str(date.today())

    for key, scraped in scraped_map.items():
        if key in existing_map:
            existing_card = existing_map[key]
            changes = {}
            if scraped.get("annual_fee") is not None:
                existing_fee = int(existing_card.get("annual_fee") or 0)
                if abs(scraped["annual_fee"] - existing_fee) > 50:
                    changes["annual_fee"] = scraped["annual_fee"]
                    updates.append(f"💸 {existing_card['name']}: Fee Rs{existing_fee} → Rs{scraped['annual_fee']}")
            if scraped.get("reward_rate") is not None:
                existing_rr = float(existing_card.get("reward_rate") or 0)
                if abs(scraped["reward_rate"] - existing_rr) > 0.5:
                    changes["reward_rate"] = scraped["reward_rate"]
                    updates.append(f"🎁 {existing_card['name']}: Reward rate {existing_rr} → {scraped['reward_rate']}")
            if changes:
                changes["last_verified"] = today
                sb_update("cards", "id", existing_card["id"], changes)
        else:
            # New card — auto insert with default scores
            new_card = {
                "name": scraped["name"],
                "bank": scraped.get("bank") or extract_bank(scraped["name"]),
                "network": "Visa",
                "annual_fee": scraped.get("annual_fee") or 0,
                "joining_fee": scraped.get("annual_fee") or 0,
                "fee_waiver": "Check issuer website",
                "apr": 3.5, "forex_fee": 3.5,
                "reward_rate": scraped.get("reward_rate") or 1,
                "point_value": 0.25,
                "lounge_domestic": 0, "lounge_intl": 0,
                "welcome_bonus": 0, "min_income": 25000,
                "apply_url": "https://www.cardinsider.com/credit-cards/",
                "best_for": "Verify full details on issuer website",
                "is_active": True, "last_verified": today,
                "score_cashback": 50, "score_travel": 50, "score_rewards": 50,
                "score_fuel": 50, "score_dining": 50, "score_low_fees": 50,
                "score_forex": 50, "score_emi": 50,
            }
            try:
                sb_insert("cards", new_card)
                new_cards.append(scraped["name"])
                print(f"  Added new card: {scraped['name']}")
            except Exception as e:
                print(f"  Failed to insert {scraped['name']}: {e}")

    send_email(updates, new_cards, len(scraped_map))
    print(f"Done. {len(updates)} updates, {len(new_cards)} new cards added.")

# ── EMAIL ─────────────────────────────────────────────────────────────────
def send_email(updates, new_cards, total_scraped):
    if not updates and not new_cards:
        subject = "CardIQ Weekly Scrape — No Changes"
        body = f"<p>Scraped <strong>{total_scraped}</strong> cards. All data is up to date. No changes detected.</p>"
    else:
        subject = f"CardIQ Weekly Update — {len(updates)} changes, {len(new_cards)} new cards"
        lines = [f"<p>Scraped <strong>{total_scraped}</strong> cards this week.</p>"]
        if updates:
            lines.append("<h2>Data Changes</h2><ul>")
            for u in updates: lines.append(f"<li>{u}</li>")
            lines.append("</ul>")
        if new_cards:
            lines.append("<h2>New Cards Added</h2><ul>")
            for c in new_cards: lines.append(f"<li>{c} — <em>review scores in Supabase</em></li>")
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
        print("Email sent")
    except Exception as e:
        print(f"Email failed: {e}")

if __name__ == "__main__":
    run()
