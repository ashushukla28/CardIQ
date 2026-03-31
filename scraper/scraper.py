import os, re, json, time, smtplib, requests
from datetime import date
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# ── CONFIG ────────────────────────────────────────────────────────────────
SUPABASE_URL   = os.environ["SUPABASE_URL"]
SUPABASE_KEY   = os.environ["SUPABASE_KEY"]
ANTHROPIC_KEY  = os.environ["ANTHROPIC_KEY"]
GMAIL_USER     = os.environ["GMAIL_USER"]
GMAIL_PASS     = os.environ["GMAIL_PASS"]
ALERT_EMAIL    = os.environ["ALERT_EMAIL"]

# How many cards to check per run (to stay within API limits)
# Full run = all cards. Set lower for testing.
CARDS_PER_RUN  = 10

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

# ── CLAUDE WEB SEARCH ─────────────────────────────────────────────────────
def lookup_card(card_name, bank):
    """Use Claude with web search to get latest card data."""
    prompt = f"""Search the web for the latest information about the {card_name} credit card by {bank} in India.

Return ONLY a JSON object with these fields (use null if not found):
{{
  "annual_fee": <number in Rs, 0 if free>,
  "joining_fee": <number in Rs, 0 if free>,
  "reward_rate": <base reward points per Rs100 spent>,
  "apr": <monthly interest rate as number e.g. 3.6>,
  "forex_fee": <forex markup % as number e.g. 3.5>,
  "lounge_domestic": <number of free domestic lounge visits per year>,
  "lounge_intl": <number of free international lounge visits per year>,
  "welcome_bonus": <welcome bonus points or Rs value as number>,
  "fee_waiver": <spend waiver condition as string e.g. "Rs4L/yr" or "No waiver">,
  "is_active": <true if card is still available, false if discontinued>
}}

No markdown, no explanation. Raw JSON only."""

    try:
        r = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": ANTHROPIC_KEY.strip(),
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json"
            },
            json={
                "model": "claude-haiku-4-5-20251001",
                "max_tokens": 300,
                "tools": [{"type": "web_search_20250305", "name": "web_search"}],
                "messages": [{"role": "user", "content": prompt}]
            },
            timeout=60
        )
        r.raise_for_status()
        data = r.json()
        text = "".join(b["text"] for b in data.get("content", []) if b.get("type") == "text")
        text = text.replace("```json", "").replace("```", "").strip()
        m = re.search(r"\{[\s\S]*\}", text)
        if m:
            return json.loads(m.group(0))
    except Exception as e:
        print(f"  Claude lookup failed for {card_name}: {e}")
    return None

# ── COMPARE FIELDS ────────────────────────────────────────────────────────
COMPARE_FIELDS = {
    "annual_fee":       ("annual_fee",    50,   "💸 Annual fee"),
    "joining_fee":      ("joining_fee",   50,   "🪙 Joining fee"),
    "reward_rate":      ("reward_rate",   0.5,  "🎁 Reward rate"),
    "apr":              ("apr",           0.2,  "📈 APR"),
    "forex_fee":        ("forex_fee",     0.3,  "🌍 Forex fee"),
    "lounge_domestic":  ("lounge_domestic", 1,  "✈️ Domestic lounge"),
    "lounge_intl":      ("lounge_intl",   1,    "🛬 Intl lounge"),
}

def detect_changes(card, new_data):
    changes = {}
    change_log = []
    for field, (db_field, threshold, label) in COMPARE_FIELDS.items():
        new_val = new_data.get(field)
        if new_val is None: continue
        old_val = card.get(db_field)
        if old_val is None: continue
        try:
            if abs(float(new_val) - float(old_val)) > threshold:
                changes[db_field] = new_val
                change_log.append(f"{label}: {old_val} → {new_val}")
        except: continue
    # Check if card was discontinued
    if new_data.get("is_active") is False and card.get("is_active", True):
        changes["is_active"] = False
        change_log.append("❌ Card appears to be discontinued")
    return changes, change_log

# ── MAIN ──────────────────────────────────────────────────────────────────
def run():
    print("Fetching cards from Supabase...")
    all_cards = sb_get("cards", "select=id,name,bank,annual_fee,joining_fee,reward_rate,apr,forex_fee,lounge_domestic,lounge_intl,is_active&is_active=eq.true&order=id")
    print(f"Loaded {len(all_cards)} active cards")

    # Process in batches — rotate through cards each week
    # This week's batch based on day of year
    day_of_year = date.today().timetuple().tm_yday
    week_num = day_of_year // 7
    start = (week_num * CARDS_PER_RUN) % len(all_cards)
    batch = all_cards[start:start + CARDS_PER_RUN]
    print(f"Checking batch: cards {start+1} to {start+len(batch)} of {len(all_cards)}")

    all_updates = []
    new_cards_found = []
    today = str(date.today())

    for i, card in enumerate(batch):
        name = card["name"]
        bank = card["bank"]
        print(f"[{i+1}/{len(batch)}] Checking: {name}...")

        new_data = lookup_card(name, bank)
        if not new_data:
            print(f"  No data returned")
            time.sleep(1)
            continue

        changes, change_log = detect_changes(card, new_data)

        if changes:
            changes["last_verified"] = today
            sb_update("cards", "id", card["id"], changes)
            for log in change_log:
                all_updates.append(f"{name}: {log}")
            print(f"  Updated: {', '.join(change_log)}")
        else:
            # Still update last_verified even if no changes
            sb_update("cards", "id", card["id"], {"last_verified": today})
            print(f"  No changes")

        time.sleep(2)  # Rate limit — 2s between API calls

    # Also search for brand new Indian credit cards launched recently
    print("\nSearching for newly launched cards...")
    new_data = search_new_cards()
    for card_name in new_data:
        new_cards_found.append(card_name)

    send_email(all_updates, new_cards_found, len(batch))
    print(f"\nDone. Checked {len(batch)} cards. {len(all_updates)} updates. {len(new_cards_found)} new cards.")

# ── SEARCH FOR NEW CARDS ──────────────────────────────────────────────────
def search_new_cards():
    """Search for credit cards launched in India recently."""
    prompt = f"""Search the web for credit cards newly launched in India in 2025 or 2026 that are NOT in this common list: HDFC Regalia, Axis Atlas, SBI Cashback, ICICI Amazon Pay, OneCard.

Return ONLY a JSON array of new card names you find:
["Card Name 1", "Card Name 2"]

No markdown. Raw JSON array only. Return empty array [] if none found."""

    try:
        r = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={"x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json"},
            json={
                "model": "claude-haiku-4-5-20251001",
                "max_tokens": 200,
                "tools": [{"type": "web_search_20250305", "name": "web_search"}],
                "messages": [{"role": "user", "content": prompt}]
            },
            timeout=60
        )
        r.raise_for_status()
        data = r.json()
        text = "".join(b["text"] for b in data.get("content", []) if b.get("type") == "text")
        text = text.replace("```json", "").replace("```", "").strip()
        m = re.search(r"\[[\s\S]*\]", text)
        if m:
            names = json.loads(m.group(0))
            print(f"New cards found: {names}")
            return names
    except Exception as e:
        print(f"New card search failed: {e}")
    return []

# ── EMAIL ─────────────────────────────────────────────────────────────────
def send_email(updates, new_cards, checked_count):
    if not updates and not new_cards:
        subject = f"CardIQ Weekly — {checked_count} cards checked, all up to date"
        body = f"<p>Checked <strong>{checked_count}</strong> cards using live web search. No changes detected.</p>"
    else:
        subject = f"CardIQ Weekly — {len(updates)} changes, {len(new_cards)} new cards"
        lines = [f"<p>Checked <strong>{checked_count}</strong> cards this week.</p>"]
        if updates:
            lines.append("<h2>Data Changes Detected</h2><ul>")
            for u in updates: lines.append(f"<li>{u}</li>")
            lines.append("</ul>")
        if new_cards:
            lines.append("<h2>Newly Launched Cards Found</h2><ul>")
            for c in new_cards: lines.append(f"<li>{c} — add to Supabase manually</li>")
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
