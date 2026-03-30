export const SUPABASE_URL = "https://euimmdbvtzfwahfwidxn.supabase.co";
export const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1aW1tZGJ2dHpmd2FoZndpZHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3ODY1MDMsImV4cCI6MjA5MDM2MjUwM30.ch_NlfYeRXdvpJDYHl61oIcosvTWDi5rOrWLSB8e0Mk";
export const ACCENT = "#4F46E5";
export const ACCENT_LIGHT = "#EEF2FF";

export async function fetchCardsFromDB() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/cards?select=*&is_active=eq.true&order=id`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );
  if (!res.ok) throw new Error("fail");
  const rows = await res.json();
  return rows.map((r) => ({
    id: r.id, name: r.name, bank: r.bank, network: r.network,
    joiningFee: r.joining_fee, annualFee: r.annual_fee, feeWaiver: r.fee_waiver,
    apr: r.apr, forexFee: r.forex_fee, rewardRate: r.reward_rate, pointValue: r.point_value,
    loungeAccess: { domestic: r.lounge_domestic, international: r.lounge_intl },
    welcomeBonus: r.welcome_bonus, minIncome: r.min_income,
    applyUrl: r.apply_url, bestFor: r.best_for,
    lastVerified: r.last_verified || null,
    employment: r.employment || ["Salaried", "Self-Employed", "Business Owner"],
    cardType: r.card_type || "General",
    isLifetimeFree: r.is_lifetime_free || false,
    isMetal: r.is_metal || false,
    coBrand: r.co_brand || null,
    interestFreeDays: r.interest_free_days || 48,
    milestoneBonus: r.milestone_bonus || null,
    pointExpiry: r.point_expiry_months || 0,
    cashbackCap: r.cashback_cap || 0,
    acceleratedCats: r.accelerated_cats || [],
    imageUrl: r.image_url || null,
  }));
}

export const FALLBACK = [
  { id:1, name:"HDFC Regalia Gold", bank:"HDFC Bank", network:"Visa", joiningFee:2500, annualFee:2500, feeWaiver:"Rs4L/yr", apr:3.6, forexFee:2.0, rewardRate:4, pointValue:0.5, loungeAccess:{domestic:12,international:6}, welcomeBonus:2500, minIncome:100000, applyUrl:"https://www.hdfcbank.com/personal/pay/cards/credit-cards/regalia-gold-credit-card", bestFor:"Frequent travellers", employment:["Salaried","Self-Employed","Business Owner"], cardType:"Travel", isLifetimeFree:false, isMetal:false, coBrand:null, interestFreeDays:50, pointExpiry:0, cashbackCap:0, lastVerified:"2025-06-01", acceleratedCats:[{cat:"travel",rate:5,value:0.5}], imageUrl:null },
  { id:2, name:"SBI Cashback", bank:"SBI Card", network:"Visa", joiningFee:999, annualFee:999, feeWaiver:"Rs2L/yr", apr:3.5, forexFee:3.5, rewardRate:5, pointValue:1.0, loungeAccess:{domestic:0,international:0}, welcomeBonus:0, minIncome:30000, applyUrl:"https://www.sbicard.com/en/personal/credit-cards/cashback/sbi-card-cashback.page", bestFor:"Online shoppers", employment:["Salaried","Self-Employed","Business Owner"], cardType:"Cashback", isLifetimeFree:false, isMetal:false, coBrand:null, interestFreeDays:50, pointExpiry:0, cashbackCap:5000, lastVerified:"2025-06-01", acceleratedCats:[{cat:"online",rate:5,value:1.0}], imageUrl:null },
  { id:3, name:"ICICI Amazon Pay", bank:"ICICI Bank", network:"Visa", joiningFee:0, annualFee:0, feeWaiver:"Lifetime free", apr:3.5, forexFee:3.5, rewardRate:5, pointValue:1.0, loungeAccess:{domestic:0,international:0}, welcomeBonus:1500, minIncome:25000, applyUrl:"https://www.icicibank.com/personal-banking/cards/credit-card/amazon-pay-credit-card", bestFor:"Amazon Prime members", employment:["Salaried","Self-Employed","Business Owner","Student","Retired"], cardType:"Shopping", isLifetimeFree:true, isMetal:false, coBrand:"Amazon", interestFreeDays:48, pointExpiry:0, cashbackCap:0, lastVerified:"2025-06-01", acceleratedCats:[{cat:"online",rate:5,value:1.0}], imageUrl:null },
  { id:4, name:"Axis Atlas", bank:"Axis Bank", network:"Visa", joiningFee:5000, annualFee:5000, feeWaiver:"No waiver", apr:3.6, forexFee:3.5, rewardRate:5, pointValue:1.0, loungeAccess:{domestic:8,international:8}, welcomeBonus:5000, minIncome:150000, applyUrl:"https://www.axisbank.com/retail/cards/credit-card/axis-bank-atlas-credit-card", bestFor:"Heavy travel spenders", employment:["Salaried","Self-Employed","Business Owner"], cardType:"Travel", isLifetimeFree:false, isMetal:false, coBrand:null, interestFreeDays:50, pointExpiry:24, cashbackCap:0, lastVerified:"2025-06-01", acceleratedCats:[{cat:"travel",rate:10,value:1.0}], imageUrl:null },
  { id:5, name:"IDFC FIRST Wealth", bank:"IDFC FIRST Bank", network:"Visa", joiningFee:0, annualFee:0, feeWaiver:"Lifetime free", apr:0.75, forexFee:1.5, rewardRate:3, pointValue:0.25, loungeAccess:{domestic:4,international:0}, welcomeBonus:0, minIncome:150000, applyUrl:"https://www.idfcfirstbank.com/personal-banking/cards/credit-card/wealth-credit-card", bestFor:"Low-fee seekers", employment:["Salaried","Self-Employed","Business Owner"], cardType:"General", isLifetimeFree:true, isMetal:false, coBrand:null, interestFreeDays:48, pointExpiry:0, cashbackCap:0, lastVerified:"2025-06-01", acceleratedCats:[], imageUrl:null },
  { id:6, name:"Axis Ace", bank:"Axis Bank", network:"Visa", joiningFee:499, annualFee:499, feeWaiver:"Rs2L/yr", apr:3.6, forexFee:3.5, rewardRate:5, pointValue:1.0, loungeAccess:{domestic:0,international:0}, welcomeBonus:500, minIncome:25000, applyUrl:"https://www.axisbank.com/retail/cards/credit-card/ace-credit-card", bestFor:"Cashback seekers", employment:["Salaried","Self-Employed","Business Owner"], cardType:"Cashback", isLifetimeFree:false, isMetal:false, coBrand:null, interestFreeDays:50, pointExpiry:0, cashbackCap:0, lastVerified:"2025-06-01", acceleratedCats:[{cat:"online",rate:5,value:1.0}], imageUrl:null },
];

export const PREF_AREAS = [
  { id:"cashback", icon:"💰", label:"Cashback", desc:"Earn money back" },
  { id:"travel", icon:"✈️", label:"Travel and Lounge", desc:"Flights and airports" },
  { id:"rewards", icon:"🎁", label:"Reward Points", desc:"Points to redeem" },
  { id:"fuel", icon:"⛽", label:"Fuel", desc:"Surcharge waivers" },
  { id:"dining", icon:"🍽️", label:"Dining", desc:"Food and restaurants" },
  { id:"lowfees", icon:"📉", label:"Low Fees", desc:"Minimal charges" },
  { id:"forex", icon:"🌍", label:"Forex", desc:"International spends" },
  { id:"emi", icon:"📅", label:"EMI Offers", desc:"No-cost EMI deals" },
];

export const INCOME_MAP = {
  "Under Rs3 LPA": 25000, "Rs3-6 LPA": 50000, "Rs6-12 LPA": 100000,
  "Rs12-25 LPA": 200000, "Rs25 LPA+": 400000,
};
export const INCOME_RANGES = Object.keys(INCOME_MAP);
export const EMP_TYPES = ["Salaried", "Self-Employed", "Business Owner", "Student", "Retired"];
export const SPEND_CATS = ["Groceries", "Dining", "Travel", "Fuel", "Online Shopping", "Entertainment", "Utilities", "International"];
export const CREDIT_SCORES = ["Excellent 750+", "Good 700-749", "Fair 650-699", "Not sure"];

const CAT_MAP = {
  "Groceries":"groceries","Dining":"dining","Travel":"travel","Fuel":"fuel",
  "Online Shopping":"online","Entertainment":"entertainment","Utilities":"utilities","International":"international",
};

export function effectiveRewardRate(card, userCats) {
  if (!userCats || userCats.length === 0) return card.rewardRate * card.pointValue;
  const accel = card.acceleratedCats || [];
  let best = card.rewardRate * card.pointValue;
  userCats.forEach((uc) => {
    const mc = CAT_MAP[uc];
    const match = accel.find((a) => a.cat === mc);
    if (match) { const v = match.rate * (match.value || card.pointValue); if (v > best) best = v; }
  });
  return best;
}

function calcFeeScore(c) {
  if (c.annualFee === 0) return 100;
  if (c.feeWaiver === "No waiver") {
    if (c.annualFee >= 10000) return 5;
    if (c.annualFee >= 5000) return 15;
    if (c.annualFee >= 2000) return 30;
    return 50;
  }
  if (c.annualFee <= 500) return 90;
  if (c.annualFee <= 1000) return 82;
  if (c.annualFee <= 2000) return 72;
  if (c.annualFee <= 3000) return 60;
  if (c.annualFee <= 5000) return 48;
  return 35;
}

function calcRewardScore(c, userCats) {
  const r = effectiveRewardRate(c, userCats);
  if (r >= 5) return 100; if (r >= 4) return 90; if (r >= 3) return 78;
  if (r >= 2) return 65; if (r >= 1) return 50; if (r >= 0.5) return 35;
  return 20;
}

function calcCashbackScore(c, userCats) {
  const base = calcRewardScore(c, userCats);
  return c.pointValue >= 1.0 ? Math.min(100, base + 10) : Math.round(base * 0.75);
}

function calcTravelScore(c) {
  const total = c.loungeAccess.domestic + (c.loungeAccess.international * 2);
  const loungeScore = Math.min(60, total * 3);
  const forexBonus = c.forexFee <= 0 ? 30 : c.forexFee <= 1.5 ? 20 : c.forexFee <= 2 ? 10 : 0;
  return Math.min(100, loungeScore + forexBonus + (c.cardType === "Travel" ? 10 : 0));
}

function calcFuelScore(c) {
  if (c.cardType === "Fuel") return Math.min(100, 90 + (c.rewardRate >= 5 ? 10 : 0));
  if (c.network === "RuPay") return 55;
  const accel = (c.acceleratedCats || []).find((a) => a.cat === "fuel");
  if (accel) return Math.min(100, 50 + accel.rate * 4);
  return Math.min(50, c.rewardRate * 8);
}

function calcDiningScore(c) {
  const base = calcRewardScore(c, ["Dining"]);
  return Math.min(100, base + (c.cardType === "Lifestyle" ? 15 : c.coBrand === "EazyDiner" ? 25 : 0));
}

function calcForexScore(c) {
  if (c.forexFee === 0) return 100; if (c.forexFee <= 1.0) return 88;
  if (c.forexFee <= 1.5) return 75; if (c.forexFee <= 2.0) return 60;
  if (c.forexFee <= 2.5) return 45; if (c.forexFee <= 3.0) return 30;
  return 15;
}

function calcEmiScore(c) {
  if (c.apr <= 0) return 100; if (c.apr <= 1.0) return 92; if (c.apr <= 1.5) return 82;
  if (c.apr <= 2.0) return 70; if (c.apr <= 2.5) return 58; if (c.apr <= 3.0) return 45;
  if (c.apr <= 3.5) return 32; return 20;
}

export function computeDimensions(c, userCats) {
  return {
    cashback: calcCashbackScore(c, userCats),
    travel: calcTravelScore(c),
    rewards: calcRewardScore(c, userCats),
    fuel: calcFuelScore(c),
    dining: calcDiningScore(c),
    lowfees: calcFeeScore(c),
    forex: calcForexScore(c),
    emi: calcEmiScore(c),
  };
}

export function scoreCards(pool, priorities, incomeNum, userCats) {
  const prefMap = { cashback:"cashback", travel:"travel", rewards:"rewards", fuel:"fuel", dining:"dining", lowfees:"lowfees", forex:"forex", emi:"emi" };
  return pool.map((c) => {
    const dims = computeDimensions(c, userCats);
    const weights = { cashback:1, travel:1, rewards:1, fuel:1, dining:1, lowfees:1, forex:1, emi:1 };
    if (priorities.length > 0) {
      Object.keys(weights).forEach((k) => (weights[k] = 0.3));
      priorities.forEach((pid, i) => { if (prefMap[pid]) weights[prefMap[pid]] = (3 - i) * 1.8; });
    }
    let raw = 0, tot = 0;
    Object.entries(weights).forEach(([k, w]) => { raw += (dims[k] || 0) * w; tot += w * 100; });
    let finalScore = Math.round((raw / tot) * 100);
    let eligibilityNote = null;
    if (incomeNum > 0) {
      const gap = (c.minIncome - incomeNum) / (c.minIncome || 1);
      if (gap > 0.5) { finalScore = Math.round(finalScore * 0.7); eligibilityNote = "Income may be below minimum — check eligibility with bank"; }
      else if (gap > 0.2) { finalScore = Math.round(finalScore * 0.88); eligibilityNote = "You may need to negotiate eligibility with the bank"; }
    }
    finalScore = Math.min(100, Math.max(1, finalScore));
    return { ...c, finalScore, dims, eligibilityNote };
  })
  .filter((c) => c.finalScore >= 50)
  .sort((a, b) => b.finalScore - a.finalScore);
}

export function calcAnnualValue(c, monthly, userCats) {
  if (!monthly || monthly <= 0) return null;
  const annual = monthly * 12;
  const effRate = effectiveRewardRate(c, userCats);
  const rewardVal = annual * (effRate / 100);
  const cappedRewardVal = c.cashbackCap > 0 ? Math.min(rewardVal, c.cashbackCap * 12) : rewardVal;
  const loungeVal = (c.loungeAccess.domestic + c.loungeAccess.international) * 500;
  const welcomeVal = (c.welcomeBonus * c.pointValue) / 2;
  const netVal = cappedRewardVal + loungeVal + welcomeVal - c.annualFee;
  return {
    rewardVal: Math.round(cappedRewardVal),
    loungeVal: Math.round(loungeVal),
    welcomeVal: Math.round(welcomeVal),
    annualFee: c.annualFee,
    netVal: Math.round(netVal),
    delta: Math.round(netVal - (annual * 0.005)),
  };
}

export function explainScore(c, priorities, userCats) {
  const lines = [];
  if (priorities.includes("lowfees")) {
    if (c.annualFee === 0) lines.push("Lifetime free — perfect for low fee priority");
    else if (c.feeWaiver !== "No waiver") lines.push("Annual fee waivable on " + c.feeWaiver + " spend");
    else lines.push("Annual fee Rs" + c.annualFee.toLocaleString() + " with no waiver");
  }
  if (priorities.includes("travel")) {
    const total = c.loungeAccess.domestic + c.loungeAccess.international;
    if (total >= 10) lines.push("Excellent lounge: " + c.loungeAccess.domestic + " domestic + " + c.loungeAccess.international + " intl/yr");
    else if (total >= 4) lines.push(total + " lounge visits/yr");
    else lines.push("Limited lounge access (" + total + " visits/yr)");
  }
  if (priorities.includes("cashback") || priorities.includes("rewards")) {
    const eff = effectiveRewardRate(c, userCats);
    lines.push("Earns Rs" + eff.toFixed(2) + " per Rs100 spent" + (userCats && userCats.length > 0 ? " for your spend mix" : ""));
  }
  if (priorities.includes("forex")) {
    if (c.forexFee === 0) lines.push("Zero forex fee — best for international use");
    else lines.push(c.forexFee + "% forex fee on international transactions");
  }
  if (priorities.includes("fuel")) {
    const accel = (c.acceleratedCats || []).find((a) => a.cat === "fuel");
    if (accel) lines.push(accel.rate + "X reward rate on fuel spends");
    else lines.push("No dedicated fuel reward category");
  }
  return lines;
}

export function whyNotThisCard(card, topCard, priorities, userCats) {
  const reasons = [];
  const gap = topCard.finalScore - card.finalScore;
  if (gap > 0) reasons.push("Scores " + gap + " points lower than " + topCard.name);
  if (priorities.includes("lowfees") && card.annualFee > topCard.annualFee && card.feeWaiver === "No waiver")
    reasons.push("Annual fee Rs" + card.annualFee.toLocaleString() + " vs Rs" + topCard.annualFee.toLocaleString() + " for top pick");
  if (priorities.includes("travel")) {
    const cl = card.loungeAccess.domestic + card.loungeAccess.international;
    const tl = topCard.loungeAccess.domestic + topCard.loungeAccess.international;
    if (cl < tl) reasons.push("Fewer lounge visits (" + cl + " vs " + tl + "/yr)");
  }
  if (priorities.includes("forex") && card.forexFee > topCard.forexFee)
    reasons.push("Higher forex fee (" + card.forexFee + "% vs " + topCard.forexFee + "%)");
  if (priorities.includes("cashback") || priorities.includes("rewards")) {
    const ce = effectiveRewardRate(card, userCats);
    const te = effectiveRewardRate(topCard, userCats);
    if (ce < te) reasons.push("Lower returns (Rs" + ce.toFixed(2) + " vs Rs" + te.toFixed(2) + " per Rs100)");
  }
  const dims = card.dims || computeDimensions(card, userCats);
  const best = Object.entries(dims).sort((a, b) => b[1] - a[1])[0];
  const bestLabel = { cashback:"cashback", travel:"travel and lounge", rewards:"reward points", fuel:"fuel spends", dining:"dining", lowfees:"low fees", forex:"international spends", emi:"EMI and low interest" }[best[0]];
  return { reasons, bestAt: bestLabel };
}

export function genPros(c, userCats) {
  const p = [];
  if (c.annualFee === 0) p.push("Lifetime free — zero annual fee ever");
  else if (c.feeWaiver && c.feeWaiver !== "No waiver") p.push("Fee waived on " + c.feeWaiver + " spend");
  if (c.forexFee === 0) p.push("Zero forex markup on international transactions");
  else if (c.forexFee <= 1.5) p.push("Low " + c.forexFee + "% forex — good for international use");
  if (c.loungeAccess.domestic >= 12) p.push(c.loungeAccess.domestic + " domestic + " + c.loungeAccess.international + " intl lounge visits/yr");
  else if (c.loungeAccess.domestic >= 4) p.push(c.loungeAccess.domestic + " free domestic lounge visits/yr");
  const eff = effectiveRewardRate(c, userCats);
  if (eff >= 3) p.push("High returns — Rs" + eff.toFixed(2) + " earned per Rs100 spent");
  if (c.welcomeBonus >= 5000) p.push("Rs" + c.welcomeBonus.toLocaleString() + " welcome bonus on joining");
  if (c.apr <= 1.5) p.push("Very low " + c.apr + "% APR — ideal if you carry balance");
  if (c.isMetal) p.push("Premium metal card");
  return p.slice(0, 4);
}

export function genCons(c) {
  const p = [];
  if (c.joiningFee >= 5000) p.push("High joining fee of Rs" + c.joiningFee.toLocaleString());
  if (c.annualFee >= 3000 && c.feeWaiver === "No waiver") p.push("Rs" + c.annualFee.toLocaleString() + " annual fee — no waiver option");
  if (c.forexFee >= 3.5) p.push("High " + c.forexFee + "% forex fee on international spends");
  if (c.pointValue <= 0.25) p.push("Low point value at Rs0.25 per point");
  if (c.loungeAccess.domestic === 0 && c.loungeAccess.international === 0) p.push("No airport lounge access");
  if (c.apr >= 3.6) p.push("High APR — avoid carrying a balance");
  if (c.pointExpiry > 0 && c.pointExpiry <= 24) p.push("Points expire in " + c.pointExpiry + " months");
  return p.slice(0, 3);
}
