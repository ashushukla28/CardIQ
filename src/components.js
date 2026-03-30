import { useState, useRef, useEffect } from "react";
import { ACCENT, ACCENT_LIGHT, calcAnnualValue, explainScore, genPros, genCons, PREF_AREAS, computeDimensions, whyNotThisCard, effectiveRewardRate } from "./utils";

export function Pill({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ padding:"8px 16px", borderRadius:24, fontSize:13, fontWeight:500, cursor:"pointer", border:"none", background:active?ACCENT:ACCENT_LIGHT, color:active?"#fff":ACCENT, transition:"all .15s", whiteSpace:"nowrap" }}>
      {label}
    </button>
  );
}

export function PrefTile({ area, active, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled&&!active} style={{ display:"flex", flexDirection:"column", alignItems:"flex-start", gap:4, padding:14, borderRadius:14, border:active?"2px solid "+ACCENT:"1.5px solid #e5e7eb", background:active?ACCENT_LIGHT:"#fff", cursor:disabled&&!active?"not-allowed":"pointer", textAlign:"left", opacity:disabled&&!active?0.4:1, position:"relative" }}>
      <span style={{ fontSize:22 }}>{area.icon}</span>
      <span style={{ fontWeight:700, fontSize:13, color:active?ACCENT:"#111" }}>{area.label}</span>
      <span style={{ fontSize:11, color:active?ACCENT:"#9ca3af" }}>{area.desc}</span>
      {active&&<span style={{ position:"absolute", top:10, right:10, width:18, height:18, borderRadius:"50%", background:ACCENT, color:"#fff", fontSize:11, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>✓</span>}
    </button>
  );
}

export function ScoreBar({ label, value, highlighted }) {
  return (
    <div style={{ marginBottom:8 }}>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:11.5, marginBottom:4 }}>
        <span style={{ color:highlighted?"#111":"#6b7280", fontWeight:highlighted?700:400 }}>{label}{highlighted?" *":""}</span>
        <span style={{ fontWeight:700, color:value>=75?"#16a34a":value>=50?"#d97706":"#9ca3af" }}>{value}</span>
      </div>
      <div style={{ height:6, borderRadius:4, background:"#f1f5f9", overflow:"hidden" }}>
        <div style={{ height:"100%", borderRadius:4, width:value+"%", background:highlighted?ACCENT:value>=75?"#22c55e":value>=50?"#f59e0b":"#cbd5e1" }} />
      </div>
    </div>
  );
}

const BANK_GRADIENTS = {
  "HDFC Bank":"linear-gradient(135deg,#004C8F,#0070CC)",
  "Axis Bank":"linear-gradient(135deg,#800000,#C41E3A)",
  "SBI Card":"linear-gradient(135deg,#1a237e,#283593)",
  "ICICI Bank":"linear-gradient(135deg,#B71C1C,#E53935)",
  "American Express":"linear-gradient(135deg,#1565C0,#42A5F5)",
  "Kotak Bank":"linear-gradient(135deg,#E65100,#FF6D00)",
  "IndusInd Bank":"linear-gradient(135deg,#1B5E20,#388E3C)",
  "IDFC FIRST Bank":"linear-gradient(135deg,#4A148C,#7B1FA2)",
  "RBL Bank":"linear-gradient(135deg,#006064,#00838F)",
  "YES Bank":"linear-gradient(135deg,#0D47A1,#1976D2)",
  "Standard Chartered":"linear-gradient(135deg,#00695C,#00897B)",
  "AU Bank":"linear-gradient(135deg,#F57F17,#F9A825)",
  "HSBC India":"linear-gradient(135deg,#B71C1C,#C62828)",
  "SBM / Federal Bank":"linear-gradient(135deg,#212121,#424242)",
  "Federal Bank":"linear-gradient(135deg,#1A237E,#3949AB)",
  "Bank of Baroda":"linear-gradient(135deg,#E65100,#BF360C)",
  "Canara Bank":"linear-gradient(135deg,#1B5E20,#2E7D32)",
  "Punjab National Bank":"linear-gradient(135deg,#880E4F,#AD1457)",
  "Union Bank":"linear-gradient(135deg,#004D40,#00695C)",
  "IDBI Bank":"linear-gradient(135deg,#1565C0,#0D47A1)",
  "Slice":"linear-gradient(135deg,#6A1B9A,#8E24AA)",
  "CSB Bank":"linear-gradient(135deg,#BF360C,#E64A19)",
};

function CardImage({ card }) {
  const [imgError, setImgError] = useState(false);
  const gradient = BANK_GRADIENTS[card.bank] || "linear-gradient(135deg,#4F46E5,#7C3AED)";
  const showImg = card.imageUrl && !imgError;
  return (
    <div style={{ width:"100%", height:160, borderRadius:14, overflow:"hidden", marginBottom:16, position:"relative", background:gradient, boxShadow:"0 4px 16px rgba(0,0,0,.15)" }}>
      {showImg ? (
        <img src={card.imageUrl} alt={card.name} onError={() => setImgError(true)} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
      ) : (
        <div style={{ width:"100%", height:"100%", display:"flex", flexDirection:"column", justifyContent:"space-between", padding:"18px 20px", boxSizing:"border-box" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,.7)", letterSpacing:1, textTransform:"uppercase", marginBottom:4 }}>{card.bank}</div>
              <div style={{ fontSize:16, fontWeight:800, color:"#fff", lineHeight:1.3 }}>{card.name}</div>
            </div>
            {card.isMetal&&<div style={{ padding:"3px 8px", borderRadius:6, background:"rgba(255,255,255,.2)" }}><span style={{ fontSize:9, fontWeight:800, color:"#fff", letterSpacing:.5 }}>METAL</span></div>}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
            <div style={{ fontSize:13, color:"rgba(255,255,255,.9)", fontWeight:600 }}>{card.annualFee===0?"Lifetime Free":"Rs"+card.annualFee.toLocaleString()+"/yr"}</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,.8)", fontWeight:500 }}>{card.network}</div>
          </div>
        </div>
      )}
      <div style={{ position:"absolute", top:12, right:12, background:"rgba(0,0,0,.5)", backdropFilter:"blur(8px)", borderRadius:10, padding:"6px 10px", textAlign:"center" }}>
        <div style={{ fontSize:18, fontWeight:900, color:card.finalScore>=80?"#4ade80":card.finalScore>=60?"#fbbf24":"#f87171", lineHeight:1 }}>{card.finalScore}</div>
        <div style={{ fontSize:8, color:"rgba(255,255,255,.7)", fontWeight:700, textTransform:"uppercase", marginTop:1 }}>Score</div>
      </div>
    </div>
  );
}

export function SavingsWidget({ card, monthly, userCats }) {
  const s = calcAnnualValue(card, monthly, userCats);
  if (!s) return null;
  const pos = s.netVal > 0;
  return (
    <div style={{ borderRadius:12, padding:"14px 16px", marginBottom:16, background:pos?"#f0fdf4":"#fffbeb", border:"1px solid "+(pos?"#86efac":"#fde68a") }}>
      <div style={{ fontSize:10, fontWeight:800, color:pos?"#15803d":"#92400e", textTransform:"uppercase", letterSpacing:1, marginBottom:12 }}>Annual Value Estimate</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, textAlign:"center", marginBottom:12 }}>
        {[["Rewards","Rs"+s.rewardVal.toLocaleString(),"#15803d"],["Lounge","Rs"+s.loungeVal.toLocaleString(),"#2563eb"],["Fee","-Rs"+s.annualFee.toLocaleString(),"#dc2626"],["Net","Rs"+s.netVal.toLocaleString(),s.netVal>=0?"#15803d":"#dc2626"]].map(([l,v,c])=>(
          <div key={l} style={{ background:"rgba(255,255,255,.7)", borderRadius:8, padding:"8px 4px" }}>
            <div style={{ fontSize:9.5, color:"#6b7280", marginBottom:3 }}>{l}</div>
            <div style={{ fontSize:13, fontWeight:900, color:c }}>{v}</div>
          </div>
        ))}
      </div>
      {s.delta!==0&&<div style={{ fontSize:12.5, fontWeight:700, color:s.delta>0?"#15803d":"#92400e", textAlign:"center" }}>
        {s.delta>0?"Rs"+Math.abs(s.delta).toLocaleString()+"/yr more than an average card":"Rs"+Math.abs(s.delta).toLocaleString()+"/yr less than an average card"}
      </div>}
    </div>
  );
}

export function CardTagInput({ selected, setSelected, allNames }) {
  const [q,setQ]=useState("");const [sugg,setSugg]=useState([]);const [focus,setFocus]=useState(false);const ref=useRef();
  useEffect(()=>{ if(q.trim().length<1){setSugg([]);return;} setSugg(allNames.filter((c)=>c.toLowerCase().includes(q.toLowerCase())&&!selected.includes(c)).slice(0,7)); },[q,selected,allNames]);
  const add=(c)=>{if(selected.length>=3)return;setSelected([...selected,c]);setQ("");setSugg([]);ref.current&&ref.current.focus();};
  const rem=(c)=>setSelected(selected.filter((x)=>x!==c));
  return(
    <div style={{ position:"relative" }}>
      <div onClick={()=>ref.current&&ref.current.focus()} style={{ display:"flex", flexWrap:"wrap", gap:6, padding:"10px 12px", borderRadius:12, border:focus?"2px solid "+ACCENT:"1.5px solid #e5e7eb", background:"#fff", cursor:"text", minHeight:48, alignItems:"center" }}>
        {selected.map((c)=>(<span key={c} style={{ display:"inline-flex", alignItems:"center", gap:6, background:ACCENT, color:"#fff", borderRadius:20, padding:"5px 12px", fontSize:12.5, fontWeight:600 }}>{c}<button onClick={(e)=>{e.stopPropagation();rem(c);}} style={{ background:"none", border:"none", color:"#fff", cursor:"pointer", padding:0, fontSize:14, lineHeight:1, opacity:.8 }}>x</button></span>))}
        {selected.length<3&&<input ref={ref} value={q} onChange={(e)=>setQ(e.target.value)} onFocus={()=>setFocus(true)} onBlur={()=>{setFocus(false);setTimeout(()=>setSugg([]),150);}} placeholder={selected.length===0?"Search 150+ Indian cards...":"Add another..."} style={{ border:"none", outline:"none", fontSize:13.5, fontFamily:"inherit", flex:1, minWidth:140, background:"transparent", color:"#111" }}/>}
      </div>
      {sugg.length>0&&<div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, right:0, zIndex:99, background:"#fff", border:"1.5px solid #e5e7eb", borderRadius:12, boxShadow:"0 12px 32px rgba(0,0,0,.1)", overflow:"hidden" }}>
        {sugg.map((s,i)=>(<div key={i} onMouseDown={()=>add(s)} style={{ padding:"12px 16px", fontSize:13.5, cursor:"pointer", borderBottom:i<sugg.length-1?"1px solid #f3f4f6":"none", color:"#111" }} onMouseEnter={(e)=>(e.currentTarget.style.background=ACCENT_LIGHT)} onMouseLeave={(e)=>(e.currentTarget.style.background="#fff")}>{s}</div>))}
      </div>}
      <p style={{ fontSize:11, color:"#9ca3af", margin:"6px 0 0" }}>{selected.length}/3 cards selected</p>
    </div>
  );
}

export function StepDot({ n, active, done }) {
  return(
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
      <div style={{ width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, background:done||active?ACCENT:"#e5e7eb", color:done||active?"#fff":"#9ca3af" }}>{done?"✓":n}</div>
    </div>
  );
}

export function StepLine({ done }) {
  return <div style={{ flex:1, height:2, background:done?ACCENT:"#e5e7eb", margin:"14px 4px 0" }} />;
}

export function BtnPrimary({ label, onClick, disabled }) {
  return(
    <button onClick={onClick} disabled={disabled} style={{ width:"100%", padding:15, borderRadius:14, fontSize:15, fontWeight:700, border:"none", background:disabled?"#e5e7eb":ACCENT, color:disabled?"#9ca3af":"#fff", cursor:disabled?"not-allowed":"pointer", marginTop:8 }}>
      {label}
    </button>
  );
}

export function ComparisonTable({ cards, monthly, userCats, onClose }) {
  function effectiveRate(c) {
    if (!userCats||userCats.length===0) return c.rewardRate*c.pointValue;
    return effectiveRewardRate(c, userCats);
  }
  const rows=[
    ["Score",(c)=><strong style={{ color:c.finalScore>=80?"#16a34a":c.finalScore>=60?"#d97706":"#dc2626" }}>{c.finalScore}</strong>],
    ["Annual Fee",(c)=>c.annualFee===0?<span style={{ color:"#16a34a",fontWeight:700 }}>Free</span>:"Rs"+c.annualFee.toLocaleString()],
    ["Fee Waiver",(c)=>c.feeWaiver],
    ["Joining Fee",(c)=>c.joiningFee===0?<span style={{ color:"#16a34a",fontWeight:700 }}>Free</span>:"Rs"+c.joiningFee.toLocaleString()],
    ["Reward Rate",(c)=>c.rewardRate+"pts/Rs100"],
    ["Effective Rate",(c)=><span style={{ fontWeight:700,color:"#16a34a" }}>{"Rs"+effectiveRate(c).toFixed(2)+"/100"}</span>],
    ["Lounge",(c)=>c.loungeAccess.domestic+"D + "+c.loungeAccess.international+"I"],
    ["Forex Fee",(c)=>c.forexFee===0?<span style={{ color:"#16a34a",fontWeight:700 }}>ZERO</span>:c.forexFee+"%"],
    ["APR",(c)=>c.apr+"%/mo"],
    ["Welcome",(c)=>c.welcomeBonus>0?"Rs"+c.welcomeBonus.toLocaleString():"None"],
    ["Card Type",(c)=>c.cardType],
    ["Network",(c)=>c.network],
    ...(monthly>0?[["Net Annual Value",(c)=>{ const v=calcAnnualValue(c,monthly,userCats); return v?<span style={{ fontWeight:700,color:v.netVal>=0?"#16a34a":"#dc2626" }}>{"Rs"+v.netVal.toLocaleString()}</span>:"—"; }]]:[] ),
  ];
  return(
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", zIndex:200, overflowY:"auto", padding:"20px 0" }}>
      <div style={{ background:"#fff", maxWidth:700, margin:"0 auto", borderRadius:20, overflow:"hidden" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"18px 20px", borderBottom:"1px solid #e5e7eb", background:ACCENT, color:"#fff" }}>
          <span style={{ fontWeight:800, fontSize:16 }}>Side-by-Side Comparison</span>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,.2)", border:"none", color:"#fff", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontWeight:700, fontSize:13 }}>Close</button>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12.5 }}>
            <thead>
              <tr style={{ background:"#f8fafc" }}>
                <th style={{ padding:"10px 14px", textAlign:"left", fontWeight:700, color:"#374151", borderBottom:"1px solid #e5e7eb", minWidth:120, position:"sticky", left:0, background:"#f8fafc" }}>Parameter</th>
                {cards.map((c)=>(<th key={c.id} style={{ padding:"10px 14px", textAlign:"center", fontWeight:700, color:ACCENT, borderBottom:"1px solid #e5e7eb", minWidth:140 }}><div>{c.name}</div><div style={{ fontSize:10,color:"#9ca3af",fontWeight:400 }}>{c.bank}</div></th>))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([label,renderer],idx)=>(
                <tr key={label} style={{ background:idx%2===0?"#fff":"#f9fafb" }}>
                  <td style={{ padding:"10px 14px", fontWeight:600, color:"#6b7280", borderBottom:"1px solid #f1f5f9", position:"sticky", left:0, background:idx%2===0?"#fff":"#f9fafb" }}>{label}</td>
                  {cards.map((c)=>(<td key={c.id} style={{ padding:"10px 14px", textAlign:"center", color:"#111", borderBottom:"1px solid #f1f5f9" }}>{renderer(c)}</td>))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function CardResult({ card, i, topCard, priorities, synopses, monthly, userCats, openBreakdown, setOpenBreakdown, isSelected, onToggleSelect }) {
  const pros=genPros(card,userCats);const cons=genCons(card);
  const mSp=parseFloat(monthly)||0;const isOpen=openBreakdown[card.id];
  const score=card.finalScore||70;
  const scoreColor=score>=80?ACCENT:score>=60?"#d97706":"#dc2626";
  const scoreBg=score>=80?ACCENT_LIGHT:score>=60?"#fffbeb":"#fef2f2";
  const whyNot=i>0&&topCard?whyNotThisCard(card,topCard,priorities,userCats):null;
  const [showWhyNot,setShowWhyNot]=useState(false);
  const verifiedText=card.lastVerified?("Verified "+new Date(card.lastVerified).toLocaleDateString("en-IN",{month:"short",year:"numeric"})):null;

  return(
    <div style={{ background:"#fff", borderRadius:20, padding:22, marginBottom:16, border:isSelected?"2px solid "+ACCENT:"1px solid #e5e7eb", boxShadow:"0 2px 12px rgba(0,0,0,.04)" }}>

      <CardImage card={card} />

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
        <div style={{ flex:1, paddingRight:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6, flexWrap:"wrap" }}>
            {i===0&&<span style={{ fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:20, background:ACCENT, color:"#fff" }}>BEST MATCH</span>}
            {card.isLifetimeFree&&<span style={{ fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:20, background:"#f0fdf4", color:"#15803d" }}>FREE</span>}
            {card.coBrand&&<span style={{ fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:20, background:"#fffbeb", color:"#b45309" }}>{card.coBrand}</span>}
            <span style={{ fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:20, background:"#f3f4f6", color:"#6b7280" }}>{card.cardType}</span>
          </div>
          <div style={{ fontWeight:800, fontSize:19, color:"#111" }}>{card.name}</div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:3 }}>
            <span style={{ fontSize:12, color:"#6b7280" }}>{card.bank}</span>
            {verifiedText&&<span style={{ fontSize:10, color:"#9ca3af", background:"#f9fafb", padding:"2px 7px", borderRadius:10, border:"1px solid #e5e7eb" }}>{verifiedText}</span>}
          </div>
        </div>
        <button onClick={onToggleSelect} style={{ fontSize:10, fontWeight:700, padding:"7px 12px", borderRadius:10, border:"1.5px solid "+(isSelected?ACCENT:"#e5e7eb"), background:isSelected?ACCENT_LIGHT:"#fff", color:isSelected?ACCENT:"#6b7280", cursor:"pointer", flexShrink:0 }}>
          {isSelected?"✓ Selected":"+ Compare"}
        </button>
      </div>

      {synopses[card.name]&&<div style={{ display:"flex", gap:10, padding:"12px 14px", background:ACCENT_LIGHT, borderRadius:12, marginBottom:16, alignItems:"flex-start" }}><span style={{ fontSize:16, flexShrink:0 }}>✨</span><p style={{ fontSize:13, color:ACCENT, lineHeight:1.6, margin:0, fontWeight:500 }}>{synopses[card.name]}</p></div>}

      {card.eligibilityNote&&<div style={{ display:"flex", gap:8, padding:"10px 14px", background:"#fffbeb", borderRadius:10, marginBottom:14, alignItems:"center", border:"1px solid #fde68a" }}><span style={{ fontSize:14,flexShrink:0 }}>⚠️</span><p style={{ fontSize:12,color:"#92400e",margin:0,lineHeight:1.5 }}>{card.eligibilityNote}</p></div>}

      {mSp>0&&<SavingsWidget card={card} monthly={mSp} userCats={userCats}/>}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:16 }}>
        {[["Joining Fee",card.joiningFee===0?"Free":"Rs"+card.joiningFee.toLocaleString()],["Annual Fee",card.annualFee===0?"Lifetime Free":"Rs"+card.annualFee.toLocaleString()],["Fee Waiver",card.feeWaiver],["Reward Rate",card.rewardRate+"pts/Rs100"],["Point Value","Rs"+card.pointValue+"/pt"],["APR",card.apr+"%/mo"],["Lounge",card.loungeAccess.domestic+"D + "+card.loungeAccess.international+"I"],["Forex Fee",card.forexFee===0?"ZERO":card.forexFee+"%"],["Welcome",card.welcomeBonus>0?"Rs"+card.welcomeBonus.toLocaleString():"None"]].map(([k,v])=>(
          <div key={k} style={{ padding:10, background:"#f8fafc", borderRadius:10, border:"1px solid #f1f5f9" }}>
            <div style={{ fontSize:9, color:"#9ca3af", fontWeight:700, textTransform:"uppercase", letterSpacing:.5, marginBottom:3 }}>{k}</div>
            <div style={{ fontSize:13, fontWeight:700, color:"#111" }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ borderRadius:12, border:"1px solid #e5e7eb", marginBottom:16, overflow:"hidden" }}>
        <button onClick={()=>setOpenBreakdown((p)=>({...p,[card.id]:!p[card.id]}))} style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", background:"#f8fafc", border:"none", cursor:"pointer" }}>
          <span style={{ fontSize:12, fontWeight:700, color:"#374151", textTransform:"uppercase", letterSpacing:.5 }}>How this score was calculated</span>
          <span style={{ fontSize:18, color:ACCENT }}>{isOpen?"▲":"▼"}</span>
        </button>
        {isOpen&&<div style={{ padding:"14px 16px" }}>
          <p style={{ fontSize:11.5, color:"#6b7280", margin:"0 0 12px", lineHeight:1.6 }}>Score calculated purely from card data — fees, reward rate, lounge, forex and APR. No manual bias. Weighted by your priorities.</p>
          {PREF_AREAS.map((a)=>{ const dims=card.dims||computeDimensions(card,userCats); return <ScoreBar key={a.id} label={a.icon+" "+a.label} value={dims[a.id]||0} highlighted={priorities.includes(a.id)}/>; })}
          {explainScore(card,priorities,userCats).map((line,j)=>(<div key={j} style={{ fontSize:12,color:"#374151",padding:"6px 10px",background:"#f0fdf4",borderRadius:8,marginTop:6 }}>✓ {line}</div>))}
        </div>}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
        <div style={{ background:"#f0fdf4", borderRadius:12, padding:"12px 14px" }}>
          <div style={{ fontSize:10, fontWeight:800, color:"#15803d", textTransform:"uppercase", letterSpacing:.8, marginBottom:8 }}>Pros</div>
          {pros.map((p,j)=><div key={j} style={{ display:"flex",gap:6,fontSize:12.5,color:"#166534",marginBottom:6,lineHeight:1.5 }}><span style={{ fontWeight:800,flexShrink:0 }}>+</span>{p}</div>)}
        </div>
        <div style={{ background:"#fef2f2", borderRadius:12, padding:"12px 14px" }}>
          <div style={{ fontSize:10, fontWeight:800, color:"#dc2626", textTransform:"uppercase", letterSpacing:.8, marginBottom:8 }}>Cons</div>
          {cons.map((c,j)=><div key={j} style={{ display:"flex",gap:6,fontSize:12.5,color:"#991b1b",marginBottom:6,lineHeight:1.5 }}><span style={{ fontWeight:800,flexShrink:0 }}>-</span>{c}</div>)}
        </div>
      </div>

      {whyNot&&<div style={{ borderRadius:12, border:"1px solid #e5e7eb", marginBottom:14, overflow:"hidden" }}>
        <button onClick={()=>setShowWhyNot((p)=>!p)} style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 16px", background:"#fafafa", border:"none", cursor:"pointer" }}>
          <span style={{ fontSize:12, fontWeight:700, color:"#374151" }}>Why is this ranked lower?</span>
          <span style={{ fontSize:16, color:"#9ca3af" }}>{showWhyNot?"▲":"▼"}</span>
        </button>
        {showWhyNot&&<div style={{ padding:"12px 16px", background:"#fff" }}>
          {whyNot.reasons.map((r,j)=><div key={j} style={{ display:"flex",gap:6,fontSize:12.5,color:"#374151",marginBottom:6 }}><span style={{ color:"#dc2626",fontWeight:700 }}>→</span>{r}</div>)}
          <div style={{ marginTop:10,padding:"8px 12px",background:ACCENT_LIGHT,borderRadius:8,fontSize:12.5,color:ACCENT }}><strong>This card is best at:</strong> {whyNot.bestAt}</div>
        </div>}
      </div>}

      <div style={{ background:ACCENT_LIGHT, borderRadius:12, padding:"12px 14px", marginBottom:14, fontSize:13, color:ACCENT }}><strong>Best for:</strong> {card.bestFor}</div>
      <button onClick={()=>window.open(card.applyUrl,"_blank")} style={{ width:"100%", padding:14, borderRadius:14, background:ACCENT, color:"#fff", fontSize:14, fontWeight:700, border:"none", cursor:"pointer" }}>Apply on Bank Website</button>
      <p style={{ fontSize:11, color:"#9ca3af", textAlign:"center", marginTop:6 }}>Opens the official bank website in a new tab</p>
    </div>
  );
}
