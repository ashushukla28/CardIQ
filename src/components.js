import { useState, useRef, useEffect } from "react";
import { ACCENT, ACCENT_LIGHT, calcSavings, PREF_AREAS } from "./utils";

export function Pill({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ padding:"8px 16px", borderRadius:24, fontSize:13, fontWeight:500, cursor:"pointer", border:"none", background:active ? ACCENT : ACCENT_LIGHT, color:active ? "#fff" : ACCENT, transition:"all .15s", whiteSpace:"nowrap" }}>
      {label}
    </button>
  );
}

export function PrefTile({ area, active, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled && !active} style={{ display:"flex", flexDirection:"column", alignItems:"flex-start", gap:4, padding:14, borderRadius:14, border:active ? "2px solid " + ACCENT : "1.5px solid #e5e7eb", background:active ? ACCENT_LIGHT : "#fff", cursor:disabled && !active ? "not-allowed" : "pointer", textAlign:"left", opacity:disabled && !active ? 0.4 : 1, position:"relative" }}>
      <span style={{ fontSize:22 }}>{area.icon}</span>
      <span style={{ fontWeight:700, fontSize:13, color:active ? ACCENT : "#111" }}>{area.label}</span>
      <span style={{ fontSize:11, color:active ? ACCENT : "#9ca3af" }}>{area.desc}</span>
      {active && <span style={{ position:"absolute", top:10, right:10, width:18, height:18, borderRadius:"50%", background:ACCENT, color:"#fff", fontSize:11, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>✓</span>}
    </button>
  );
}

export function ScoreBar({ label, value, highlighted }) {
  return (
    <div style={{ marginBottom:8 }}>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:11.5, marginBottom:4 }}>
        <span style={{ color:highlighted ? "#111" : "#6b7280", fontWeight:highlighted ? 700 : 400 }}>{label}{highlighted ? " *" : ""}</span>
        <span style={{ fontWeight:700, color:value >= 75 ? "#16a34a" : value >= 50 ? "#d97706" : "#9ca3af" }}>{value}</span>
      </div>
      <div style={{ height:6, borderRadius:4, background:"#f1f5f9", overflow:"hidden" }}>
        <div style={{ height:"100%", borderRadius:4, width:value + "%", background:highlighted ? ACCENT : value >= 75 ? "#22c55e" : value >= 50 ? "#f59e0b" : "#cbd5e1" }} />
      </div>
    </div>
  );
}

export function SavingsWidget({ card, monthly }) {
  const s = calcSavings(card, monthly);
  if (!s) return null;
  const pos = s.delta > 0;
  return (
    <div style={{ borderRadius:12, padding:"14px 16px", marginBottom:16, background:pos ? "#f0fdf4" : "#fffbeb", border:"1px solid " + (pos ? "#86efac" : "#fde68a") }}>
      <div style={{ fontSize:10, fontWeight:800, color:pos ? "#15803d" : "#92400e", textTransform:"uppercase", letterSpacing:1, marginBottom:12 }}>Annual Savings Estimate</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, textAlign:"center", marginBottom:12 }}>
        {[["Reward Value", "Rs" + Math.round(s.rewardVal).toLocaleString(), "#15803d"], ["Annual Fee", "-Rs" + card.annualFee.toLocaleString(), "#dc2626"], ["Net Gain", "Rs" + Math.round(s.netVal).toLocaleString(), pos ? "#15803d" : "#dc2626"]].map(([l, v, c]) => (
          <div key={l} style={{ background:"rgba(255,255,255,.6)", borderRadius:8, padding:"8px 4px" }}>
            <div style={{ fontSize:10, color:"#6b7280", marginBottom:3 }}>{l}</div>
            <div style={{ fontSize:15, fontWeight:900, color:c }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize:12.5, fontWeight:700, color:pos ? "#15803d" : "#92400e", textAlign:"center" }}>
        {pos ? "You earn Rs" + Math.round(s.delta).toLocaleString() + " more per year than an average card" : "Rs" + Math.round(Math.abs(s.delta)).toLocaleString() + " less per year vs average card"}
      </div>
    </div>
  );
}

export function CardTagInput({ selected, setSelected, allNames }) {
  const [q, setQ] = useState("");
  const [sugg, setSugg] = useState([]);
  const [focus, setFocus] = useState(false);
  const ref = useRef();
  useEffect(() => {
    if (q.trim().length < 1) { setSugg([]); return; }
    setSugg(allNames.filter((c) => c.toLowerCase().includes(q.toLowerCase()) && !selected.includes(c)).slice(0, 7));
  }, [q, selected, allNames]);
  const add = (c) => { if (selected.length >= 3) return; setSelected([...selected, c]); setQ(""); setSugg([]); ref.current && ref.current.focus(); };
  const rem = (c) => setSelected(selected.filter((x) => x !== c));
  return (
    <div style={{ position:"relative" }}>
      <div onClick={() => ref.current && ref.current.focus()} style={{ display:"flex", flexWrap:"wrap", gap:6, padding:"10px 12px", borderRadius:12, border:focus ? "2px solid " + ACCENT : "1.5px solid #e5e7eb", background:"#fff", cursor:"text", minHeight:48, alignItems:"center" }}>
        {selected.map((c) => (
          <span key={c} style={{ display:"inline-flex", alignItems:"center", gap:6, background:ACCENT, color:"#fff", borderRadius:20, padding:"5px 12px", fontSize:12.5, fontWeight:600 }}>
            {c}
            <button onClick={(e) => { e.stopPropagation(); rem(c); }} style={{ background:"none", border:"none", color:"#fff", cursor:"pointer", padding:0, fontSize:14, lineHeight:1, opacity:.8 }}>x</button>
          </span>
        ))}
        {selected.length < 3 && (
          <input ref={ref} value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => { setFocus(false); setTimeout(() => setSugg([]), 150); }} placeholder={selected.length === 0 ? "Search 75+ Indian cards..." : "Add another..."} style={{ border:"none", outline:"none", fontSize:13.5, fontFamily:"inherit", flex:1, minWidth:140, background:"transparent", color:"#111" }} />
        )}
      </div>
      {sugg.length > 0 && (
        <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, right:0, zIndex:99, background:"#fff", border:"1.5px solid #e5e7eb", borderRadius:12, boxShadow:"0 12px 32px rgba(0,0,0,.1)", overflow:"hidden" }}>
          {sugg.map((s, i) => (
            <div key={i} onMouseDown={() => add(s)} style={{ padding:"12px 16px", fontSize:13.5, cursor:"pointer", borderBottom:i < sugg.length - 1 ? "1px solid #f3f4f6" : "none", color:"#111" }} onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_LIGHT)} onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}>{s}</div>
          ))}
        </div>
      )}
      <p style={{ fontSize:11, color:"#9ca3af", margin:"6px 0 0" }}>{selected.length}/3 cards selected</p>
    </div>
  );
}

export function StepDot({ n, active, done }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
      <div style={{ width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, background:done || active ? ACCENT : "#e5e7eb", color:done || active ? "#fff" : "#9ca3af" }}>
        {done ? "✓" : n}
      </div>
    </div>
  );
}

export function StepLine({ done }) {
  return <div style={{ flex:1, height:2, background:done ? ACCENT : "#e5e7eb", margin:"14px 4px 0" }} />;
}

export function BtnPrimary({ label, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width:"100%", padding:15, borderRadius:14, fontSize:15, fontWeight:700, border:"none", background:disabled ? "#e5e7eb" : ACCENT, color:disabled ? "#9ca3af" : "#fff", cursor:disabled ? "not-allowed" : "pointer", marginTop:8 }}>
      {label}
    </button>
  );
}

export function CardResult({ card, i, priorities, synopses, monthly, openBreakdown, setOpenBreakdown }) {
  const pros = genPros(card);
  const cons = genCons(card);
  const mSp = parseFloat(monthly) || 0;
  const isOpen = openBreakdown[card.id];
  const score = card.finalScore || 70;
  const scoreColor = score >= 80 ? ACCENT : score >= 60 ? "#d97706" : "#dc2626";
  const scoreBg = score >= 80 ? ACCENT_LIGHT : score >= 60 ? "#fffbeb" : "#fef2f2";
  return (
    <div style={{ background:"#fff", borderRadius:20, padding:22, marginBottom:16, border:"1px solid #e5e7eb", boxShadow:"0 2px 12px rgba(0,0,0,.04)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
        <div style={{ flex:1, paddingRight:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6, flexWrap:"wrap" }}>
            {i === 0 && <span style={{ fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:20, background:ACCENT, color:"#fff" }}>BEST MATCH</span>}
            <span style={{ fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:20, background:"#f3f4f6", color:"#6b7280" }}>{card.network}</span>
          </div>
          <div style={{ fontWeight:800, fontSize:19, color:"#111" }}>{card.name}</div>
          <div style={{ fontSize:12, color:"#6b7280", marginTop:2 }}>{card.bank}</div>
        </div>
        <div style={{ textAlign:"center", background:scoreBg, borderRadius:16, padding:"12px 16px", flexShrink:0, minWidth:68 }}>
          <div style={{ fontSize:28, fontWeight:900, color:scoreColor, lineHeight:1 }}>{score}</div>
          <div style={{ fontSize:9, color:"#9ca3af", fontWeight:700, marginTop:3, textTransform:"uppercase" }}>Score</div>
        </div>
      </div>
      {synopses[card.name] && (
        <div style={{ display:"flex", gap:10, padding:"12px 14px", background:ACCENT_LIGHT, borderRadius:12, marginBottom:16, alignItems:"flex-start" }}>
          <span style={{ fontSize:16, flexShrink:0 }}>✨</span>
          <p style={{ fontSize:13, color:ACCENT, lineHeight:1.6, margin:0, fontWeight:500 }}>{synopses[card.name]}</p>
        </div>
      )}
      {mSp > 0 && <SavingsWidget card={card} monthly={mSp} />}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:16 }}>
        {[
          ["Joining Fee", card.joiningFee === 0 ? "Free" : "Rs" + card.joiningFee.toLocaleString()],
          ["Annual Fee", card.annualFee === 0 ? "Lifetime Free" : "Rs" + card.annualFee.toLocaleString()],
          ["Fee Waiver", card.feeWaiver],
          ["Reward Rate", card.rewardRate + "pts/Rs100"],
          ["Point Value", "Rs" + card.pointValue + "/pt"],
          ["APR", card.apr + "%/mo"],
          ["Lounge", card.loungeAccess.domestic + "D + " + card.loungeAccess.international + "I"],
          ["Forex Fee", card.forexFee === 0 ? "ZERO" : card.forexFee + "%"],
          ["Welcome", card.welcomeBonus > 0 ? "Rs" + card.welcomeBonus.toLocaleString() : "None"],
        ].map(([k, v]) => (
          <div key={k} style={{ padding:10, background:"#f8fafc", borderRadius:10, border:"1px solid #f1f5f9" }}>
            <div style={{ fontSize:9, color:"#9ca3af", fontWeight:700, textTransform:"uppercase", letterSpacing:.5, marginBottom:3 }}>{k}</div>
            <div style={{ fontSize:13, fontWeight:700, color:"#111" }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ borderRadius:12, border:"1px solid #e5e7eb", marginBottom:16, overflow:"hidden" }}>
        <button onClick={() => setOpenBreakdown((p) => ({ ...p, [card.id]: !p[card.id] }))} style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", background:"#f8fafc", border:"none", cursor:"pointer" }}>
          <span style={{ fontSize:12, fontWeight:700, color:"#374151", textTransform:"uppercase", letterSpacing:.5 }}>Score Breakdown</span>
          <span style={{ fontSize:18, color:ACCENT }}>{isOpen ? "▲" : "▼"}</span>
        </button>
        {isOpen && (
          <div style={{ padding:"14px 16px" }}>
            {PREF_AREAS.map((a) => (<ScoreBar key={a.id} label={a.icon + " " + a.label} value={card.scores[a.sk] || 0} highlighted={priorities.includes(a.id)} />))}
          </div>
        )}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
        <div style={{ background:"#f0fdf4", borderRadius:12, padding:"12px 14px" }}>
          <div style={{ fontSize:10, fontWeight:800, color:"#15803d", textTransform:"uppercase", letterSpacing:.8, marginBottom:8 }}>Pros</div>
          {pros.map((p, j) => (<div key={j} style={{ display:"flex", gap:6, fontSize:12.5, color:"#166534", marginBottom:6, lineHeight:1.5 }}><span style={{ fontWeight:800, flexShrink:0 }}>+</span>{p}</div>))}
        </div>
        <div style={{ background:"#fef2f2", borderRadius:12, padding:"12px 14px" }}>
          <div style={{ fontSize:10, fontWeight:800, color:"#dc2626", textTransform:"uppercase", letterSpacing:.8, marginBottom:8 }}>Cons</div>
          {cons.map((c, j) => (<div key={j} style={{ display:"flex", gap:6, fontSize:12.5, color:"#991b1b", marginBottom:6, lineHeight:1.5 }}><span style={{ fontWeight:800, flexShrink:0 }}>-</span>{c}</div>))}
        </div>
      </div>
      <div style={{ background:ACCENT_LIGHT, borderRadius:12, padding:"12px 14px", marginBottom:14, fontSize:13, color:ACCENT }}><strong>Best for:</strong> {card.bestFor}</div>
      <button onClick={() => window.open(card.applyUrl, "_blank")} style={{ width:"100%", padding:14, borderRadius:14, background:ACCENT, color:"#fff", fontSize:14, fontWeight:700, border:"none", cursor:"pointer" }}>Apply on Bank Website</button>
      <p style={{ fontSize:11, color:"#9ca3af", textAlign:"center", marginTop:6 }}>Opens the official bank website in a new tab</p>
    </div>
  );
}

function genPros(c) {
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

function genCons(c) {
  const p = [];
  if (c.joiningFee >= 5000) p.push("High joining fee of Rs" + c.joiningFee.toLocaleString());
  if (c.annualFee >= 3000 && c.feeWaiver === "No waiver") p.push("No spend-based annual fee waiver");
  if (c.forexFee >= 3.5) p.push("High " + c.forexFee + "% forex fee on international spends");
  if (c.pointValue <= 0.25) p.push("Low point value at Rs0.25 per point");
  if (c.loungeAccess.domestic === 0 && c.loungeAccess.international === 0) p.push("No airport lounge access");
  if (c.apr >= 3.6) p.push("High APR — avoid carrying a balance");
  return p.slice(0, 3);
}
