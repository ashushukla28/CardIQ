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
    employment: r.employment || ["Salaried", "Self-Employed", "Business Owner"],
    scores: {
      cb: r.score_cashback, tr: r.score_travel, rw: r.score_rewards,
      fu: r.score_fuel, di: r.score_dining, lf: r.score_low_fees,
      fo: r.score_forex, em: r.score_emi,
    },
  }));
}

export const FALLBACK = [
  { id:1, name:"HDFC Regalia Gold", bank:"HDFC Bank", network:"Visa", joiningFee:2500, annualFee:2500, feeWaiver:"Rs4L/yr", apr:3.6, forexFee:2.0, rewardRate:4, pointValue:0.5, loungeAccess:{domestic:12,international:6}, welcomeBonus:2500, minIncome:100000, applyUrl:"https://www.hdfcbank.com/personal/pay/cards/credit-cards/regalia-gold-credit-card", bestFor:"Frequent travellers spending Rs4L+/yr", employment:["Salaried","Self-Employed","Business Owner"], scores:{cb:50,tr:80,rw:80,fu:60,di:75,lf:55,fo:60,em:65} },
  { id:2, name:"HDFC Infinia Metal", bank:"HDFC Bank", network:"Visa", joiningFee:12500, annualFee:12500, feeWaiver:"No waiver", apr:1.99, forexFee:2.0, rewardRate:5, pointValue:1.0, loungeAccess:{domestic:99,international:99}, welcomeBonus:12500, minIncome:300000, applyUrl:"https://www.hdfcbank.com/personal/pay/cards/credit-cards/infinia-credit-card-metal-edition", bestFor:"HNI spenders wanting unlimited lounge", employment:["Salaried","Self-Employed","Business Owner"], scores:{cb:40,tr:99,rw:95,fu:65,di:85,lf:10,fo:60,em:70} },
  { id:3, name:"Axis Atlas", bank:"Axis Bank", network:"Visa", joiningFee:5000, annualFee:5000, feeWaiver:"No waiver", apr:3.6, forexFee:3.5, rewardRate:5, pointValue:1.0, loungeAccess:{domestic:8,international:8}, welcomeBonus:5000, minIncome:150000, applyUrl:"https://www.axisbank.com/retail/cards/credit-card/axis-bank-atlas-credit-card", bestFor:"Heavy travel spenders", employment:["Salaried","Self-Employed","Business Owner"], scores:{cb:45,tr:95,rw:85,fu:55,di:65,lf:30,fo:50,em:55} },
  { id:4, name:"SBI Cashback", bank:"SBI Card", network:"Visa", joiningFee:999, annualFee:999, feeWaiver:"Rs2L/yr", apr:3.5, forexFee:3.5, rewardRate:5, pointValue:1.0, loungeAccess:{domestic:0,international:0}, welcomeBonus:0, minIncome:30000, applyUrl:"https://www.sbicard.com/en/personal/credit-cards/cashback/sbi-card-cashback.page", bestFor:"Online shoppers wanting simple cashback", employment:["Salaried","Self-Employed","Business Owner"], scores:{cb:95,tr:20,rw:70,fu:50,di:40,lf:75,fo:25,em:60} },
  { id:5, name:"ICICI Amazon Pay", bank:"ICICI Bank", network:"Visa", joiningFee:0, annualFee:0, feeWaiver:"Lifetime free", apr:3.5, forexFee:3.5, rewardRate:5, pointValue:1.0, loungeAccess:{domestic:0,international:0}, welcomeBonus:1500, minIncome:25000, applyUrl:"https://www.icicibank.com/personal-banking/cards/credit-card/amazon-pay-credit-card", bestFor:"Amazon Prime members", employment:["Salaried","Self-Employed","Business Owner","Student","Retired"], scores:{cb:80,tr:10,rw:55,fu:45,di:35,lf:100,fo:25,em:65} },
  { id:6, name:"IDFC FIRST Wealth", bank:"IDFC FIRST Bank", network:"Visa", joiningFee:0, annualFee:0, feeWaiver:"Lifetime free", apr:0.75, forexFee:1.5, rewardRate:3, pointValue:0.25, loungeAccess:{domestic:4,international:0}, welcomeBonus:0, minIncome:150000, applyUrl:"https://www.idfcfirstbank.com/personal-banking/cards/credit-card/wealth-credit-card", bestFor:"Low-fee seekers who carry balance occasionally", employment:["Salaried","Self-Employed","Business Owner"], scores:{cb:55,tr:60,rw:60,fu:65,di:65,lf:90,fo:70,em:80} },
  { id:7, name:"Axis Ace", bank:"Axis Bank", network:"Visa", joiningFee:499, annualFee:499, feeWaiver:"Rs2L/yr", apr:3.6, forexFee:3.5, rewardRate:5, pointValue:1.0, loungeAccess:{domestic:0,international:0}, welcomeBonus:500, minIncome:25000, applyUrl:"https://www.axisbank.com/retail/cards/credit-card/ace-credit-card", bestFor:"Cashback seekers on bills and Google Pay", employment:["Salaried","Self-Employed","Business Owner"], scores:{cb:85,tr:20,rw:60,fu:55,di:55,lf:80,fo:30,em:65} },
  { id:8, name:"RBL World Safari", bank:"RBL Bank", network:"Mastercard", joiningFee:3000, annualFee:3000, feeWaiver:"Rs3L/yr", apr:3.99, forexFee:0, rewardRate:5, pointValue:0.5, loungeAccess:{domestic:4,international:4}, welcomeBonus:3000, minIncome:80000, applyUrl:"https://www.rblbank.com/credit-cards/world-safari-credit-card", bestFor:"International travellers wanting zero forex fee", employment:["Salaried","Self-Employed","Business Owner"], scores:{cb:35,tr:85,rw:70,fu:20,di:30,lf:45,fo:100,em:50} },
];

export const PREF_AREAS = [
  { id:"cashback", icon:"💰", label:"Cashback", sk:"cb", desc:"Earn money back" },
  { id:"travel", icon:"✈️", label:"Travel and Lounge", sk:"tr", desc:"Flights and airports" },
  { id:"rewards", icon:"🎁", label:"Reward Points", sk:"rw", desc:"Points to redeem" },
  { id:"fuel", icon:"⛽", label:"Fuel", sk:"fu", desc:"Surcharge waivers" },
  { id:"dining", icon:"🍽️", label:"Dining", sk:"di", desc:"Food and restaurants" },
  { id:"lowfees", icon:"📉", label:"Low Fees", sk:"lf", desc:"Minimal charges" },
  { id:"forex", icon:"🌍", label:"Forex", sk:"fo", desc:"International spends" },
  { id:"emi", icon:"📅", label:"EMI Offers", sk:"em", desc:"No-cost EMI deals" },
];

export const INCOME_MAP = {
  "Under Rs3 LPA": 25000, "Rs3-6 LPA": 50000, "Rs6-12 LPA": 100000,
  "Rs12-25 LPA": 200000, "Rs25 LPA+": 400000,
};
export const INCOME_RANGES = Object.keys(INCOME_MAP);
export const EMP_TYPES = ["Salaried", "Self-Employed", "Business Owner", "Student", "Retired"];
export const SPEND_CATS = ["Groceries", "Dining", "Travel", "Fuel", "Online Shopping", "Entertainment", "Utilities", "International"];
export const CREDIT_SCORES = ["Excellent 750+", "Good 700-749", "Fair 650-699", "Not sure"];

export function scoreCards(pool, priorities) {
  const w = { cb:1, tr:1, rw:1, fu:1, di:1, lf:1, fo:1, em:1 };
  if (priorities.length > 0) {
    Object.keys(w).forEach((k) => (w[k] = 0.2));
    priorities.forEach((pid, i) => {
      const a = PREF_AREAS.find((x) => x.id === pid);
      if (a) w[a.sk] = (3 - i) * 1.5;
    });
  }
  return pool.map((c) => {
    let raw = 0, tot = 0;
    Object.entries(w).forEach(([k, wt]) => { raw += (c.scores[k] || 0) * wt; tot += wt * 100; });
    return { ...c, finalScore: Math.round((raw / tot) * 100) };
  }).sort((a, b) => b.finalScore - a.finalScore);
}

export function genPros(c) {
  const p = [];
  if (c.annualFee === 0) p.push("Lifetime free — zero annual fee ever");
  else if (c.feeWaiver && c.feeWaiver !== "No waiver") p.push("Fee waived on " + c.feeWaiver + " spend");
  if (c.forexFee === 0) p.push("Zero forex markup on international transactions");
  else if (c.forexFee <= 1.5) p.push("Low " + c.forexFee + "% forex — good for international use");
  if (c.loungeAccess.domestic >= 12) p.push(c.loungeAccess.domestic + " domestic + " + c.loungeAccess.international + " intl lounge visits/yr");
  else if (c.loungeAccess.domestic >= 4) p.push(c.loungeAccess.domestic + " free domestic lounge visits/yr");
  if (c.rewardRate >= 5) p.push("High " + c.rewardRate + "X reward rate on all spends");
  if (c.welcomeBonus >= 5000) p.push("Rs" + c.welcomeBonus.toLocaleString() + " welcome bonus on joining");
  if (c.apr <= 1.5) p.push("Very low " + c.apr + "% APR — ideal if you carry balance");
  return p.slice(0, 4);
}

export function genCons(c) {
  const p = [];
  if (c.joiningFee >= 5000) p.push("High joining fee of Rs" + c.joiningFee.toLocaleString());
  if (c.annualFee >= 3000 && c.feeWaiver === "No waiver") p.push("No spend-based annual fee waiver");
  if (c.forexFee >= 3.5) p.push("High " + c.forexFee + "% forex fee on international spends");
  if (c.pointValue <= 0.25) p.push("Low point value at Rs0.25 per point");
  if (c.loungeAccess.domestic === 0 && c.loungeAccess.international === 0) p.push("No airport lounge access");
  if (c.apr >= 3.6) p.push("High APR — avoid carrying a balance");
  return p.slice(0, 3);
}

export function calcSavings(c, monthly) {
  if (!monthly || monthly <= 0) return null;
  const annual = monthly * 12;
  const rewardVal = annual * (c.rewardRate / 100) * c.pointValue;
  const netVal = rewardVal - c.annualFee;
  return { rewardVal, netVal, delta: netVal - annual * 0.003 };
}
