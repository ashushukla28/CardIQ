import { useState, useEffect } from "react";
import { fetchCardsFromDB, scoreCards, FALLBACK, PREF_AREAS, INCOME_MAP, INCOME_RANGES, EMP_TYPES, SPEND_CATS, CREDIT_SCORES, ACCENT, ACCENT_LIGHT } from "./utils";
import { Pill, PrefTile, CardTagInput, StepDot, StepLine, BtnPrimary, CardResult, ComparisonTable } from "./components";

export default function App() {
  const [allCards, setAllCards] = useState(FALLBACK);
  const [dbStatus, setDbStatus] = useState("loading");
  const [apiStatus, setApiStatus] = useState("checking");
  const [step, setStep] = useState("prefs");
  const [priorities, setPriorities] = useState([]);
  const [cats, setCats] = useState([]);
  const [income, setIncome] = useState("");
  const [empType, setEmpType] = useState("");
  const [creditScore, setCreditScore] = useState("");
  const [monthly, setMonthly] = useState("");
  const [mode, setMode] = useState("suggest");
  const [selCards, setSelCards] = useState([]);
  const [results, setResults] = useState([]);
  const [synopses, setSynopses] = useState({});
  const [winner, setWinner] = useState("");
  const [winnerReason, setWinnerReason] = useState("");
  const [source, setSource] = useState("");
  const [openBreakdown, setOpenBreakdown] = useState({});
  const [error, setError] = useState("");
  const [compareCards, setCompareCards] = useState([]);
  const [showCompare, setShowCompare] = useState(false);

  useEffect(() => {
    fetchCardsFromDB().then((c) => { setAllCards(c); setDbStatus("live"); }).catch(() => setDbStatus("offline"));
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 8000);
    fetch("/api/chat", {
      method:"POST", headers:{"Content-Type":"application/json"}, signal:ctrl.signal,
      body:JSON.stringify({ model:"claude-haiku-4-5-20251001", max_tokens:10, messages:[{role:"user",content:"Hi"}] }),
    }).then((r)=>r.json()).then((d)=>setApiStatus(d.content?"ok":"fail")).catch(()=>setApiStatus("fail"));
  }, []);

  const toggleP = (id) => setPriorities((p) => p.includes(id)?p.filter((x)=>x!==id):p.length<3?[...p,id]:p);
  const toggleC = (c) => setCats((p) => p.includes(c)?p.filter((x)=>x!==c):[...p,c]);
  const canProceed = priorities.length > 0 && income && empType;
  const allNames = allCards.map((c) => c.name);

  const toggleCompare = (card) => {
    setCompareCards((prev) => {
      if (prev.find((c)=>c.id===card.id)) return prev.filter((c)=>c.id!==card.id);
      if (prev.length >= 3) return prev;
      return [...prev, card];
    });
  };

  const analyze = async () => {
    setStep("loading"); setError(""); setCompareCards([]);
    const incomeNum = INCOME_MAP[income] || 0;
    let pool = allCards.filter((c) => !c.employment || c.employment.includes(empType));
    if (mode === "compare" && selCards.length > 0) pool = allCards.filter((c) => selCards.includes(c.name));
    const scored = scoreCards(pool, priorities, incomeNum, cats);
    const top = scored.slice(0, mode === "compare" ? pool.length : 3);
    if (top.length === 0) { setError("No eligible cards found. Try adjusting your profile."); setStep("cards"); return; }
    setResults(top); setWinner(top[0].name); setWinnerReason(""); setSource("db"); setStep("results");

    const priorityLabels = priorities.map((p)=>{ const a=PREF_AREAS.find((x)=>x.id===p); return a?a.label:""; }).filter(Boolean).join(", ")||"general use";
    const prompt = "Indian credit card advisor. User: "+empType+", income "+income+", spend Rs"+(monthly||"unspecified")+"/month, categories: "+(cats.join(",")||"general")+", priorities: "+priorityLabels+". Cards: "+top.map((c)=>c.name).join(", ")+". Return ONLY raw JSON: {\"synopses\":[\"why card1 fits in 1 sentence\",\"why card2\",\"why card3\"],\"winner\":\""+top[0].name+"\",\"winnerReason\":\"1 sentence\"}";
    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch("/api/chat", {
        method:"POST", headers:{"Content-Type":"application/json"}, signal:ctrl.signal,
        body:JSON.stringify({ model:"claude-haiku-4-5-20251001", max_tokens:200, messages:[{role:"user",content:prompt}] }),
      });
      const d = await res.json();
      if (d.error) return;
      const txt = (d.content||[]).filter((b)=>b.type==="text").map((b)=>b.text).join("");
      const m = txt.replace(/```json|```/g,"").trim().match(/\{[\s\S]*\}/);
      if (!m) return;
      const parsed = JSON.parse(m[0]);
      const syn = {};
      top.forEach((c,i)=>{ syn[c.name]=parsed.synopses&&parsed.synopses[i]?parsed.synopses[i]:""; });
      setSynopses(syn);
      if (parsed.winner) setWinner(parsed.winner);
      if (parsed.winnerReason) setWinnerReason(parsed.winnerReason);
      setSource("ai");
    } catch(e) {}
  };

  const reset = () => { setStep("prefs"); setResults([]); setPriorities([]); setCats([]); setIncome(""); setEmpType(""); setCreditScore(""); setMonthly(""); setSelCards([]); setSynopses({}); setWinner(""); setWinnerReason(""); setSource(""); setError(""); setCompareCards([]); setShowCompare(false); };
  const stepN = step==="prefs"?1:step==="cards"?2:3;

  return (
    <div style={{ fontFamily:"Inter,-apple-system,sans-serif", minHeight:"100vh", background:"#f8fafc" }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}} @keyframes pulse{0%,100%{opacity:.2}50%{opacity:1}} .fade{animation:fadeIn .3s ease}`}</style>

      <div style={{ background:"#fff", borderBottom:"1px solid #e5e7eb", padding:"0 20px", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ maxWidth:640, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height:56 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:30, height:30, borderRadius:8, background:ACCENT, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ color:"#fff", fontSize:14, fontWeight:900 }}>C</span>
            </div>
            <span style={{ fontWeight:800, fontSize:17, color:"#111" }}>CardIQ</span>
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <div style={{ display:"flex", gap:5, alignItems:"center" }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:dbStatus==="live"?"#22c55e":dbStatus==="offline"?"#ef4444":"#d1d5db" }}/>
              <span style={{ fontSize:11, color:"#9ca3af", fontWeight:500 }}>{dbStatus==="live"?"DB Live":dbStatus==="offline"?"DB Offline":"DB..."}</span>
            </div>
            <div style={{ display:"flex", gap:5, alignItems:"center" }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:apiStatus==="ok"?"#22c55e":apiStatus==="fail"?"#ef4444":"#d1d5db" }}/>
              <span style={{ fontSize:11, color:"#9ca3af", fontWeight:500 }}>{apiStatus==="ok"?"AI Live":apiStatus==="fail"?"Smart Match":"Connecting..."}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:640, margin:"0 auto", padding:"24px 16px 100px" }}>
        {step!=="loading"&&<div style={{ display:"flex", alignItems:"flex-start", marginBottom:28 }}>
          <StepDot n={1} active={stepN===1} done={stepN>1}/>
          <StepLine done={stepN>1}/>
          <StepDot n={2} active={stepN===2} done={stepN>2}/>
          <StepLine done={stepN>2}/>
          <StepDot n={3} active={stepN===3} done={false}/>
        </div>}

        {step==="prefs"&&<div className="fade">
          <h2 style={{ fontSize:22, fontWeight:800, margin:"0 0 4px", color:"#111" }}>Find your perfect card</h2>
          <p style={{ color:"#6b7280", fontSize:14, margin:"0 0 24px" }}>Tell us what matters most and we will match you instantly.</p>
          <div style={{ marginBottom:24 }}>
            <div style={{ fontWeight:700, fontSize:14, color:"#111", marginBottom:4 }}>What matters most?</div>
            <div style={{ fontSize:12, color:"#9ca3af", marginBottom:12 }}>Pick up to 3 priorities</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {PREF_AREAS.map((a)=>(<PrefTile key={a.id} area={a} active={priorities.includes(a.id)} onClick={()=>toggleP(a.id)} disabled={priorities.length>=3}/>))}
            </div>
          </div>
          <div style={{ marginBottom:24 }}>
            <div style={{ fontWeight:700, fontSize:14, color:"#111", marginBottom:12 }}>Top spend categories</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>{SPEND_CATS.map((c)=>(<Pill key={c} label={c} active={cats.includes(c)} onClick={()=>toggleC(c)}/>))}</div>
          </div>
          <div style={{ marginBottom:24 }}>
            <div style={{ fontWeight:700, fontSize:14, color:"#111", marginBottom:4 }}>Monthly spend on credit card</div>
            <div style={{ fontSize:12, color:"#9ca3af", marginBottom:12 }}>Used to calculate your annual value estimate</div>
            <div style={{ position:"relative", maxWidth:220 }}>
              <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:14, color:ACCENT, fontWeight:700 }}>Rs</span>
              <input type="number" value={monthly} onChange={(e)=>setMonthly(e.target.value)} placeholder="e.g. 30000" style={{ width:"100%", padding:"12px 14px 12px 38px", borderRadius:12, border:"1.5px solid #e5e7eb", fontSize:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box", color:"#111" }}/>
            </div>
          </div>
          <div style={{ background:"#fff", borderRadius:16, padding:20, border:"1px solid #e5e7eb", marginBottom:8 }}>
            <div style={{ fontWeight:700, fontSize:14, color:"#111", marginBottom:14 }}>About you</div>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:12, color:"#6b7280", fontWeight:600, marginBottom:8 }}>Annual income *</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>{INCOME_RANGES.map((r)=>(<Pill key={r} label={r} active={income===r} onClick={()=>setIncome(r)}/>))}</div>
            </div>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:12, color:"#6b7280", fontWeight:600, marginBottom:8 }}>Employment type *</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>{EMP_TYPES.map((r)=>(<Pill key={r} label={r} active={empType===r} onClick={()=>setEmpType(r)}/>))}</div>
            </div>
            <div>
              <div style={{ fontSize:12, color:"#6b7280", fontWeight:600, marginBottom:4 }}>Credit score <span style={{ fontWeight:400, color:"#9ca3af" }}>(optional)</span></div>
              <div style={{ fontSize:11, color:"#9ca3af", marginBottom:8 }}>Helps refine card eligibility</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>{CREDIT_SCORES.map((r)=>(<Pill key={r} label={r} active={creditScore===r} onClick={()=>setCreditScore(r)}/>))}</div>
            </div>
          </div>
          {!canProceed&&<p style={{ fontSize:12, color:"#9ca3af", marginBottom:4, textAlign:"center" }}>Select at least 1 priority + income + employment to continue</p>}
          <BtnPrimary label="Continue" onClick={()=>setStep("cards")} disabled={!canProceed}/>
        </div>}

        {step==="cards"&&<div className="fade">
          <button onClick={()=>setStep("prefs")} style={{ background:"none", border:"none", color:ACCENT, cursor:"pointer", fontSize:13, fontWeight:600, padding:"0 0 16px" }}>Back</button>
          <h2 style={{ fontSize:22, fontWeight:800, margin:"0 0 4px", color:"#111" }}>How would you like to search?</h2>
          <p style={{ color:"#6b7280", fontSize:14, margin:"0 0 20px" }}>AI suggests the best cards or compare specific ones.</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:24 }}>
            {[{id:"suggest",icon:"✨",title:"Suggest for me",desc:"AI picks top 3 for your profile"},{id:"compare",icon:"⚖️",title:"Compare cards",desc:"I have specific cards in mind"}].map((o)=>(
              <button key={o.id} onClick={()=>setMode(o.id)} style={{ padding:"18px 16px", borderRadius:16, textAlign:"left", cursor:"pointer", border:mode===o.id?"2px solid "+ACCENT:"1.5px solid #e5e7eb", background:mode===o.id?ACCENT_LIGHT:"#fff" }}>
                <div style={{ fontSize:26, marginBottom:8 }}>{o.icon}</div>
                <div style={{ fontWeight:700, fontSize:14, color:mode===o.id?ACCENT:"#111", marginBottom:4 }}>{o.title}</div>
                <div style={{ fontSize:12, color:"#6b7280" }}>{o.desc}</div>
              </button>
            ))}
          </div>
          {mode==="compare"&&<div style={{ marginBottom:20 }}>
            <div style={{ fontWeight:700, fontSize:14, color:"#111", marginBottom:8 }}>Select cards to compare</div>
            <CardTagInput selected={selCards} setSelected={setSelCards} allNames={allNames}/>
          </div>}
          {error&&<div style={{ padding:"12px 16px", background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:12, fontSize:13, color:"#dc2626", marginBottom:16 }}>{error}</div>}
          <BtnPrimary label="Get My Results" onClick={analyze} disabled={mode==="compare"&&selCards.length<2}/>
          <p style={{ fontSize:11, color:"#9ca3af", textAlign:"center", marginTop:10 }}>Results load instantly. AI adds insights in the background.</p>
        </div>}

        {step==="loading"&&<div style={{ textAlign:"center", padding:"80px 20px" }} className="fade">
          <div style={{ width:64, height:64, borderRadius:20, background:ACCENT_LIGHT, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", fontSize:30 }}>⚡</div>
          <h2 style={{ fontSize:20, fontWeight:800, margin:"0 0 8px", color:"#111" }}>Analysing your profile</h2>
          <p style={{ color:"#6b7280", fontSize:14, margin:"0 0 28px" }}>Scoring 150+ cards across 40+ parameters...</p>
          <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
            {[0,1,2].map((i)=>(<div key={i} style={{ width:10, height:10, borderRadius:"50%", background:ACCENT, animation:"pulse 1.2s ease-in-out "+i*0.4+"s infinite" }}/>))}
          </div>
        </div>}

        {step==="results"&&results.length>0&&<div className="fade">
          <div style={{ background:"linear-gradient(135deg,"+ACCENT+",#7C3AED)", borderRadius:20, padding:22, marginBottom:24, color:"#fff", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:-20, right:-20, width:100, height:100, borderRadius:"50%", background:"rgba(255,255,255,.08)" }}/>
            <div style={{ fontSize:10, fontWeight:800, letterSpacing:2, opacity:.7, textTransform:"uppercase", marginBottom:6 }}>Best Match For You</div>
            <div style={{ fontSize:22, fontWeight:900, marginBottom:6 }}>🏆 {winner}</div>
            <div style={{ fontSize:13, opacity:.85, lineHeight:1.6 }}>{winnerReason||"Best match for: "+(priorities.map((p)=>{const a=PREF_AREAS.find((x)=>x.id===p);return a?a.label:"";}).filter(Boolean).join(", ")||"general use")+"."}</div>
            {source==="ai"&&<div style={{ display:"inline-flex", alignItems:"center", gap:5, marginTop:10, background:"rgba(255,255,255,.15)", borderRadius:20, padding:"4px 10px", fontSize:11, fontWeight:600 }}>AI enhanced</div>}
          </div>

          {results.map((card,i)=>(
            <CardResult key={card.id} card={card} i={i} topCard={results[0]} priorities={priorities} synopses={synopses} monthly={monthly} userCats={cats} openBreakdown={openBreakdown} setOpenBreakdown={setOpenBreakdown} isSelected={!!compareCards.find((c)=>c.id===card.id)} onToggleSelect={()=>toggleCompare(card)}/>
          ))}

          <div style={{ background:"#fff", borderRadius:16, padding:18, border:"1px solid #e5e7eb", marginTop:4, fontSize:11, color:"#6b7280", lineHeight:1.8 }}>
            <div style={{ fontWeight:700, color:"#374151", marginBottom:8, fontSize:12 }}>Important Disclosures</div>
            <p style={{ margin:"0 0 6px" }}><strong>Not financial advice:</strong> CardIQ is an independent free comparison tool. Please consult a certified financial planner before applying.</p>
            <p style={{ margin:"0 0 6px" }}><strong>No commercial interest:</strong> We do not earn any referral fees or commissions from banks.</p>
            <p style={{ margin:"0 0 6px" }}><strong>Data accuracy:</strong> Card data based on publicly available information as of mid-2025. Always verify on the issuer website before applying.</p>
            <p style={{ margin:0 }}><strong>Privacy:</strong> We do not store or share your personal information. Compliant with India DPDP Act 2023.</p>
          </div>
          <button onClick={reset} style={{ width:"100%", marginTop:14, padding:14, borderRadius:14, background:"#fff", border:"1.5px solid #e5e7eb", color:"#374151", fontWeight:600, fontSize:14, cursor:"pointer" }}>Start Over</button>
        </div>}
      </div>

      {compareCards.length>=2&&<div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", zIndex:100 }}>
        <button onClick={()=>setShowCompare(true)} style={{ display:"flex", alignItems:"center", gap:8, padding:"14px 24px", borderRadius:50, background:ACCENT, color:"#fff", fontSize:14, fontWeight:700, border:"none", cursor:"pointer", boxShadow:"0 8px 24px rgba(79,70,229,.4)" }}>
          ⚖️ Compare {compareCards.length} Cards
        </button>
      </div>}

      {showCompare&&<ComparisonTable cards={compareCards} monthly={parseFloat(monthly)||0} userCats={cats} onClose={()=>setShowCompare(false)}/>}
    </div>
  );
}
