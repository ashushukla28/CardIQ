import os, re, time, smtplib, requests
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

# ── BANK CARD PAGES (direct bank sites — much easier to scrape) ───────────
BANK_SOURCES = [
    {
        "bank": "HDFC Bank",
        "url": "https://www.hdfcbank.com/personal/pay/cards/credit-cards",
        "name_selector": ".card-name, h3.title, .cardName",
        "fee_selector": ".annual-fee, .fee-amount, [class*='fee']",
    },
    {
        "bank": "SBI Card",
        "url": "https://www.sbicard.com/en/personal/credit-cards.page",
        "name_selector": ".card-title, h3, .cardTitle",
        "fee_selector": ".annual-fee, .fee, [class*='fee']",
    },
    {
        "bank": "Axis Bank",
        "url": "https://www.axisbank.com/retail/cards/credit-card",
        "name_selector": ".card-name, h3, .cardName",
        "fee_selector": ".fee, .annual-fee, [class*='fee']",
    },
    {
        "bank": "ICICI Bank",
        "url": "https://www.icicibank.com/personal-banking/cards/credit-card",
        "name_selector": ".card-name, h3, .cardTitle",
        "fee_selector": ".fee, [class*='fee'], .annual-fee",
    },
    {
        "bank": "Kotak Bank",
        "url": "https://www.kotak.com/en/personal-banking/cards/credit-cards.html",
        "name_selector": ".card-name, h3, .title",
        "fee_selector": ".fee, .annual-fee",
    },
    {
        "bank": "IDFC FIRST Bank",
        "url": "https://www.idfcfirstbank.com/personal-banking/cards/credit-card",
        "name_selector": ".card-name, h3, .cardName",
        "fee_selector": ".fee, .annual-fee",
    },
]

# ── SUPABASE ──────────────────────────────────────────────────────────────
def sb_get(table, params=""):
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/{table}?{params}",
        headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
    )
    r.raise_for_status()
    return r.json()

def sb_update(table, match_col, match_val, data):
    requests.patch(
        f"{SUPABASE_URL}/rest/v1/{table}?{match_col}=eq.{match_val}",
        headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}",
                 "Content-Type": "application/json", "Prefer": "return=minimal"},
        json=data
    ).raise_for_status()

def sb_insert(table, data):
    requests.post(
        f"{SUPABASE_URL}/rest/v1/{table}",
        headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}",
                 "Content-Type": "application/json", "Prefer": "return=minimal"},
        json=data
    ).raise_for_status()

# ── PARSERS ───────────────────────────────────────────────────────────────
def parse_fee(text):
    if not text: return None
    text = text.lower().replace(",", "").replace("rs", "").replace("₹", "").strip()
    if any(w in text for w in ["free", "nil", "zero", "waived", "lifetime"]): return 0
    nums = re.findall(r"\d+", text)
    return int(nums[0]) if nums else None

def normalise(name):
    return name.lower().strip().replace("-", " ").replace("  ", " ")

def extract_bank(name):
    banks = [
        ("HDFC", "HDFC Bank"), ("SBI", "SBI Card"), ("ICICI", "ICICI Bank"),
        ("Axis", "Axis Bank"), ("Kotak", "Kotak Bank"), ("IndusInd", "IndusInd Bank"),
        ("IDFC", "IDFC FIRST Bank"), ("RBL", "RBL Bank"), ("YES", "YES Bank"),
        ("Amex", "American Express"), ("American Express", "American Express"),
        ("AU ", "AU Bank"), ("HSBC", "HSBC India"),
        ("Standard Chartered", "Standard Chartered"),
    ]
    for key, full in banks:
        if key.lower() in name.lower(): return full
    return ""

# ── SCRAPE SINGLE BANK PAGE ───────────────────────────────────────────────
def scrape_bank(page, source):
    cards = []
    try:
        print(f"  Scraping {source['bank']}...")
        page.goto(source["url"], wait_until="networkidle", timeout=40000)
        page.wait_for_timeout(3000)
        # Scroll to load all cards
        for _ in range(3):
            page.evaluate("window.scrollBy(0, 800)")
            page.wait_for_timeout(800)

        # Try multiple common card container selectors
        container_selectors = [
            ".credit-card-item", ".card-item", ".card-block",
            ".creditCard", "[class*='card-list'] > div",
            "[class*='cardList'] > div", "article",
        ]

        blocks = []
        for sel in container_selectors:
            blocks = page.query_selector_all(sel)
            if len(blocks) > 2:
                print(f"    Found {len(blocks)} cards with selector: {sel}")
                break

        if not blocks:
            # Fallback: find all headings that look like card names
            headings = page.query_selector_all("h2, h3")
            for h in headings:
                text = h.inner_text().strip()
                if "credit card" in text.lower() and len(text) > 8:
                    # Try to find fee near this heading
                    parent = h.evaluate_handle("el => el.closest('div, article, section')")
                    fee_text = ""
                    try:
                        fee_el = parent.query_selector("[class*='fee'], .annual-fee")
                        if fee_el: fee_text = fee_el.inner_text()
                    except: pass
                    cards.append({
                        "name": text, "bank": source["bank"],
                        "annual_fee": parse_fee(fee_text), "reward_rate": None
                    })
            return cards

        for block in blocks:
            try:
                name_el = block.query_selector(source["name_selector"])
                if not name_el:
                    name_el = block.query_selector("h2, h3, h4")
                if not name_el: continue
                name = name_el.inner_text().strip()
                if len(name) < 5 or "credit card" not in name.lower(): continue

                fee_el = block.query_selector(source["fee_selector"])
                if not fee_el:
                    fee_el = block.query_selector("[class*='fee'], [class*='Fee']")
                annual_fee = parse_fee(fee_el.inner_text() if fee_el else "")

                cards.append({"name": name, "bank": source["bank"], "annual_fee": annual_fee, "reward_rate": None})
            except Exception:
                continue

    except Exception as e:
        print(f"  Error scraping {source['bank']}: {e}")

    print(f"  {source['bank']}: {len(cards)} cards found")
    return cards

# ── MAIN ──────────────────────────────────────────────────────────────────
def run():
    print("Fetching existing cards from Supabase...")
    existing = sb_get("cards", "select=id,name,bank,annual_fee,reward_rate")
    existing_map = {normalise(c["name"]): c for c in existing}
    print(f"Loaded {len(existing)} existing cards")

    all_scraped = []
    print("Starting Playwright browser...")
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-blink-features=AutomationControlled"]
        )
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800},
            extra_http_headers={"Accept-Language": "en-IN,en;q=0.9"}
        )
        page = context.new_page()
        # Hide automation signals
        page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

        for source in BANK_SOURCES:
            cards = scrape_bank(page, source)
            all_scraped.extend(cards)
            time.sleep(2)

        browser.close()

    print(f"\nTotal scraped: {len(all_scraped)} cards")

    # Deduplicate
    scraped_map = {}
    for c in all_scraped:
        key = normalise(c["name"])
        if key not in scraped_map: scraped_map[key] = c

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
            if changes:
                changes["last_verified"] = today
                sb_update("cards", "id", existing_card["id"], changes)
        else:
            new_card = {
                "name": scraped["name"],
                "bank": scraped.get("bank") or extract_bank(scraped["name"]),
                "network": "Visa",
                "annual_fee": scraped.get("annual_fee") or 0,
                "joining_fee": scraped.get("annual_fee") or 0,
                "fee_waiver": "Check issuer website",
                "apr": 3.5, "forex_fee": 3.5, "reward_rate": 1,
                "point_value": 0.25, "lounge_domestic": 0, "lounge_intl": 0,
                "welcome_bonus": 0, "min_income": 25000,
                "apply_url": source.get("url", ""),
                "best_for": "Verify full details on issuer website",
                "is_active": True, "last_verified": today,
                "score_cashback": 50, "score_travel": 50, "score_rewards": 50,
                "score_fuel": 50, "score_dining": 50, "score_low_fees": 50,
                "score_forex": 50, "score_emi": 50,
            }
            try:
                sb_insert("cards", new_card)
                new_cards.append(scraped["name"])
            except Exception as e:
                print(f"  Insert failed for {scraped['name']}: {e}")

    send_email(updates, new_cards, len(scraped_map))
    print(f"\nDone. {len(updates)} updates, {len(new_cards)} new cards added.")

# ── EMAIL ─────────────────────────────────────────────────────────────────
def send_email(updates, new_cards, total_scraped):
    if not updates and not new_cards:
        subject = "CardIQ Weekly Scrape — No Changes"
        body = f"<p>Scraped <strong>{total_scraped}</strong> cards from bank websites. All data up to date.</p>"
    else:
        subject = f"CardIQ Weekly Update — {len(updates)} changes, {len(new_cards)} new cards"
        lines = [f"<p>Scraped <strong>{total_scraped}</strong> cards this week.</p>"]
        if updates:
            lines.append("<h2>Data Changes</h2><ul>")
            for u in updates: lines.append(f"<li>{u}</li>")
            lines.append("</ul>")
        if new_cards:
            lines.append("<h2>New Cards Added</h2><ul>")
            for c in new_cards: lines.append(f"<li>{c} — review in Supabase</li>")
            lines.append("</ul>")
        lines.append("<p><a href='https://supabase.com/dashboard'>Open Supabase</a></p>")
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
