import { useState, useRef, useEffect } from "react";

const SUPABASE_URL="https://euimmdbvtzfwahfwidxn.supabase.co";
const SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1aW1tZGJ2dHpmd2FoZndpZHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3ODY1MDMsImV4cCI6MjA5MDM2MjUwM30.ch_NlfYeRXdvpJDYHl61oIcosvTWDi5rOrWLSB8e0Mk";
const ACCENT="#4F46E5"; const ACCENT_LIGHT="#EEF2FF"; const ACCENT_MID="#C7D2FE";

async function fetchCardsFromDB(){
  const res=await fetch(`${SUPABASE_URL}/rest/v1/cards?select=*&is_active=eq.true&order=id`,{
    headers:{"apikey":SUPABASE_KEY,"Authorization":`Bearer ${SUPABASE_KEY}`}
  });
  if(!res.ok) throw new Error("fail");
  const rows=await res.json();
  return rows.map(r=>({
    id:r.id,name:r.name,bank:r.bank,network:r.network,
    joiningFee:r.joining_fee,annualFee:r.annual_fee,feeWaiver:r.fee_waiver,
    apr:r.apr,forexFee:r.forex_fee,rewardRate:r.reward_rate,pointValue:r.point_value,
    loungeAccess:{domestic:r.lounge_domestic,international:r.lounge_intl},
    welcomeBonus:r.welcome_bonus,minIncome:r.min_income,
    applyUrl:r.apply_url,bestFor:r.best_for,lastVerified:r.last_verified,
    employment:r.employment||["Salaried","Self-Employed","Business Owner"],
    scores:{cb:r.score_cashback,tr:r.score_travel,rw:r.score_rewards,
            fu:r.score_fuel,di:r.score_dining,lf:r.score_low_fees,
            fo:r.score_forex,em:r.score_emi}
  }));
}

const mk=(id,n,bk,nt,jf,af,fw,apr,fx,rr,pv,ld,li,wb,mi,s,bf,url,emp)=>({
  id,name:n,bank:bk,network:nt,joiningFee:jf,annualFee:af,feeWaiver:fw,apr,forexFee:fx,
  rewardRate:rr,pointValue:pv,loungeAccess:{domestic:ld,international:li},
  welcomeBonus:wb,minIncome:mi,scores:s,bestFor:bf,applyUrl:url,
  employment:emp||["Salaried","Self-Employed","Business Owner"]
});
const FALLBACK=[
  mk(1,"HDFC Regalia Gold","HDFC Bank","Visa",2500,2500,"Rs4L/yr",3.6,2.0,4,0.5,12,6,2500,100000,{cb:50,tr:80,rw:80,fu:60,di:75,lf:55,fo:60,em:65},"Frequent travellers spending Rs4L+/yr","https://www.hdfcbank.com/personal/pay/cards/credit-cards/regalia-gold-credit-card"),
  mk(2,"HDFC Infinia Metal","HDFC Bank","Visa",12500,12500,"No waiver",1.99,2.0,5,1.0,99,99,12500,300000,{cb:40,tr:99,rw:95,fu:65,di:85,lf:10,fo:60,em:70},"HNI spenders wanting unlimited lounge","https://www.hdfcbank.com/personal/pay/cards/credit-cards/infinia-credit-card-metal-edition"),
  mk(3,"HDFC Millennia","HDFC Bank","Mastercard",1000,1000,"Rs1L/yr",3.6,2.0,5,0.3,2,0,1000,35000,{cb:75,tr:25,rw:60,fu:55,di:65,lf:75,fo:55,em:70},"Young professionals spending online","https://www.hdfcbank.com/personal/pay/cards/credit-cards/millennia-credit-card"),
  mk(4,"Axis Atlas","Axis Bank","Visa",5000,5000,"No waiver",3.6,3.5,5,1.0,8,8,5000,150000,{cb:45,tr:95,rw:85,fu:55,di:65,lf:30,fo:50,em:55},"Heavy travel spenders","https://www.axisbank.com/retail/cards/credit-card/axis-bank-atlas-credit-card"),
  mk(5,"SBI Cashback","SBI Card","Visa",999,999,"Rs2L/yr",3.5,3.5,5,1.0,0,0,0,30000,{cb:95,tr:20,rw:70,fu:50,di:40,lf:75,fo:25,em:60},"Online shoppers wanting cashback","https://www.sbicard.com/en/personal/credit-cards/cashback/sbi-card-cashback.page"),
  mk(6,"ICICI Amazon Pay","ICICI Bank","Visa",0,0,"Lifetime free",3.5,3.5,5,1.0,0,0,1500,25000,{cb:80,tr:10,rw:55,fu:45,di:35,lf:100,fo:25,em:65},"Amazon Prime members","https://www.icicibank.com/personal-banking/cards/credit-card/amazon-pay-credit-card",["Salaried","Self-Employed","Business Owner","Student","Retired"]),
  mk(7,"IDFC FIRST Wealth","IDFC FIRST Bank","Visa",0,0,"Lifetime free",0.75,1.5,3,0.25,4,0,0,150000,{cb:55,tr:60,rw:60,fu:65,di:65,lf:90,fo:70,em:80},"Low-fee seekers","https://www.idfcfirstbank.com/personal-banking/cards/credit-card/wealth-credit-card"),
  mk(8,"Axis Ace","Axis Bank","Visa",499,499,"Rs2L/yr",3.6,3.5,5,1.0,0,0,500,25000,{cb:85,tr:20,rw:60,fu:55,di:55,lf:80,fo:30,em:65},"Cashback seekers","https://www.axisbank.com/retail/cards/credit-card/ace-credit-card"),
];

const PREF_AREAS=[
  {id:"cashback",icon:"💰",label:"Cashback",sk:"cb",desc:"Earn money back"},
  {id:"travel",icon:"✈️",label:"Travel & Lounge",sk:"tr",desc:"Flights & airports"},
  {id:"rewards",icon:"🎁",label:"Reward Points",sk:"rw",desc:"Points to redeem"},
  {id:"fuel",icon:"⛽",label:"Fuel",sk:"fu",desc:"Surcharge waivers"},
  {id:"dining",icon:"🍽️",label:"Dining",sk:"di",desc:"Food & restaurants"},
  {id:"lowfees",icon:"📉",label:"Low Fees",sk:"lf",desc:"Minimal charges"},
  {id:"forex",icon:"🌍",label:"Forex",sk:"fo",desc:"International spends"},
  {id:"emi",icon:"📅",label:"EMI Offers",sk:"em",desc:"No-cost EMI deals"},
];
const INCOME_MAP={"Under Rs3 LPA":25000,"Rs3-6 LPA":50000,"Rs6-12 LPA":100000,"Rs12-25 LPA":200000,"Rs25 LPA+":400000};
const INCOME_RANGES=Object.keys(INCOME_MAP);
const EMP_TYPES=["Salaried","Self-Employed","Business Owner","Student","Retired"];
const SPEND_CATS=["Groceries","Dining","Travel","Fuel","Online Shopping","Entertainment","Utilities","International"];
const CREDIT_SCORES=["Excellent 750+","Good 700-749","Fair 650-699","Not sure"];

function scoreCards(pool,priorities){
  const w={cb:1,tr:1,rw:1,fu:1,di:1,lf:1,fo:1,em:1};
  if(priorities.length>0){Object.keys(w).forEach(k=>w[k]=0.2);priorities.forEach((pid,i)=>{const a=PREF_AREAS.find(x=>x.id===pid);if(a)w[a.sk]=(3-i)*1.5;});}
  return pool.map(c=>{let raw=0,tot=0;Object.entries(w).forEach(([k,wt])=>{raw+=(c.scores[k]||0)*wt;tot+=wt*100;});return{...c,finalScore:Math.round((raw/tot)*100)};}).sort((a,b)=>b.finalScore-a.finalScore);
}
function genPros(c){
  const p=[];
  if(c.annualFee===0)p.push("Lifetime free — zero annual fee ever");
  else if(c.feeWaiver&&c.feeWaiver!=="No waiver")p.push("Fee waived on "+c.feeWaiver+" spend");
  if(c.forexFee===0)p.push("Zero forex markup on international transactions");
  else if(c.forexFee<=1.5)p.push("Low "+c.forexFee+"% forex — good for international use");
  if(c.loungeAccess.domestic>=12)p.push(c.loungeAccess.domestic+" domestic + "+c.loungeAccess.international+" intl lounge visits/yr");
  else if(c.loungeAccess.domestic>=4)p.push(c.loungeAccess.domestic+" free domestic lounge visits/yr");
  else if(c.loungeAccess.international>=4)p.push(c.loungeAccess.international+" international lounge visits/yr");
  if(c.rewardRate>=5)p.push("High "+c.rewardRate+"X reward rate on all spends");
  if(c.welcomeBonus>=5000)p.push("Rs"+c.welcomeBonus.toLocaleString()+" welcome bonus on joining");
  if(c.apr<=1.5)p.push("Very low "+c.apr+"% APR — ideal if you carry balance");
  return p.slice(0,4);
}
function genCons(c){
  const p=[];
  if(c.joiningFee>=5000)p.push("High joining fee of Rs"+c.joiningFee.toLocaleString());
  if(c.annualFee>=3000&&c.feeWaiver==="No waiver")p.push("No spend-based annual fee waiver");
  if(c.forexFee>=3.5)p.push("High "+c.forexFee+"% forex fee on international spends");
  if(c.pointValue<=0.25)p.push("Low point value at Rs0.25 per point");
  if(c.loungeAccess.domestic===0&&c.loungeAccess.international===0)p.push("No airport lounge access");
  if(c.apr>=3.6)p.push("High APR — avoid carrying a balance");
  if(c.minIncome>=200000)p.push("High income requirement");
  return p.slice(0,3);
}
function calcSavings(c,monthly){
  if(!monthly||monthly<=0)return null;
  const annual=monthly*12;
  const rewardVal=annual*(c.rewardRate/100)*c.pointValue;
  const netVal=rewardVal-c.annualFee;
  return{rewardVal,netVal,delta:netVal-(annual*0.003)};
}

// ── UI primitives ──
const Tag=({children,color="#6b7280",bg="#f3f4f6"})=>(
  <span style={{fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:20,background:bg,color,letterSpacing:.4}}>{children}</span>
);
const Pill=({label,active,onClick})=>(
  <button onClick={onClick} style={{padding:"8px 16px",borderRadius:24,fontSize:13,fontWeight:500,cursor:"pointer",border:"none",background:active?ACCENT:ACCENT_LIGHT,color:active?"#fff":ACCENT,transition:"all .15s",whiteSpace:"nowrap"}}>{label}</button>
);
const PrefTile=({area,active,onClick,disabled})=>(
  <button onClick={onClick} disabled={disabled&&!active} style={{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:4,padding:"14px",borderRadius:14,border:active?"2px solid "+ACCENT:"1.5px solid #e5e7eb",background:active?ACCENT_LIGHT:"#fff",cursor:disabled&&!active?"not-allowed":"pointer",textAlign:"left",transition:"all .15s",opacity:disabled&&!active?.4:1,position:"relative"}}>
    <span style={{fontSize:22}}>{area.icon}</span>
    <span style={{fontWeight:700,fontSize:13,color:active?ACCENT:"#111"}}>{area.label}</span>
    <span style={{fontSize:11,color:active?ACCENT:"#9ca3af"}}>{area.desc}</span>
    {active&&<span style={{position:"absolute",top:10,right:10,width:18,height:18,borderRadius:"50%",background:ACCENT,color:"#fff",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>✓</span>}
  </button>
);

function CardTagInput({selected,setSelected,allNames}){
  const [q,setQ]=useState("");const [sugg,setSugg]=useState([]);const [focus,setFocus]=useState(false);const ref=useRef();
  useEffect(()=>{if(q.trim().length<1){setSugg([]);return;}setSugg(allNames.filter(c=>c.toLowerCase().includes(q.toLowerCase())&&!selected.includes(c)).slice(0,7));},[q,selected,allNames]);
  const add=c=>{if(selected.length>=3)return;setSelected([...selected,c]);setQ("");setSugg([]);ref.current?.focus();};
  const rem=c=>setSelected(selected.filter(x=>x!==c));
  return(
    <div style={{position:"relative"}}>
      <div onClick={()=>ref.current?.focus()} style={{display:"flex",flexWrap:"wrap",gap:6,padding:"10px 12px",borderRadius:12,border:focus?"2px solid "+ACCENT:"1.5px solid #e5e7eb",background:"#fff",cursor:"text",minHeight:48,alignItems:"center"}}>
        {selected.map(c=>(
          <span key={c} style={{display:"inline-flex",alignItems:"center",gap:6,background:ACCENT,color:"#fff",borderRadius:20,padding:"5px 12px",fontSize:12.5,fontWeight:600}}>
            {c}
            <button onClick={e=>{e.stopPropagation();rem(c);}} style={{background:"none",border:"none",color:"#fff",cursor:"pointer",padding:0,fontSize:14,lineHeight:1,opacity:.8}}>×</button>
          </span>
        ))}
        {selected.length<3&&<input ref={ref} value={q} onChange={e=>setQ(e.target.value)} onFocus={()=>setFocus(true)} onBlur={()=>{setFocus(false);setTimeout(()=>setSugg([]),150);}} placeholder={selected.length===0?"Search 75+ Indian cards...":"Add another..."} style={{border:"none",outline:"none",fontSize:13.5,fontFamily:"inherit",flex:1,minWidth:140,background:"transparent",color:"#111"}}/>}
      </div>
      {sugg.length>0&&(
        <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,right:0,zIndex:99,background:"#fff",border:"1.5px solid #e5e7eb",borderRadius:12,boxShadow:"0 12px 32px rgba(0,0,0,.1)",overflow:"hidden"}}>
          {sugg.map((s,i)=>(
            <div key={i} onMouseDown={()=>add(s)} style={{padding:"12px 16px",fontSize:13.5,cursor:"pointer",borderBottom:i<sugg.length-1?"1px solid #f3f4f6":"none",color:"#111",transition:"background .1s"}} onMouseEnter={e=>e.currentTarget.style.background=ACCENT_LIGHT} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>{s}</div>
          ))}
        </div>
      )}
      <p style={{fontSize:11,color:"#9ca3af",margin:"6px 0 0"}}>{selected.length}/3 cards selected</p>
    </div>
  );
}

function ScoreBar({label,value,highlighted}){
  return(
    <div style={{marginBottom:8}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:11.5,marginBottom:4}}>
        <span style={{color:highlighted?"#111":"#6b7280",fontWeight:highlighted?700:400}}>{label}{highlighted?" ★":""}</span>
        <span style={{fontWeight:700,color:value>=75?"#16a34a":value>=50?"#d97706":"#9ca3af"}}>{value}</span>
      </div>
      <div style={{height:6,borderRadius:4,background:"#f1f5f9",overflow:"hidden"}}>
        <div style={{height:"100%",borderRadius:4,width:value+"%",background:highlighted?ACCENT:value>=75?"#22c55e":value>=50?"#f59e0b":"#cbd5e1",transition:"width .5s ease"}}/>
      </div>
    </div>
  );
}

function SavingsWidget({card,monthly}){
  const s=calcSavings(card,monthly);if(!s)return null;
  const pos=s.delta>0;
  return(
    <div style={{borderRadius:12,padding:"14px 16px",marginBottom:16,background:pos?"linear-gradient(135deg,#f0fdf4,#dcfce7)":"linear-gradient(135deg,#fffbeb,#fef3c7)",border:"1px solid "+(pos?"#86efac":"#fde68a")}}>
      <div style={{fontSize:10,fontWeight:800,color:pos?"#15803d":"#92400e",textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>Annual Savings Estimate</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,textAlign:"center",marginBottom:12}}>
        {[["Reward Value","Rs"+Math.round(s.rewardVal).toLocaleString(),"#15803d"],["Annual Fee","-Rs"+card.annualFee.toLocaleString(),"#dc2626"],["Net Gain","Rs"+Math.round(s.netVal).toLocaleString(),pos?"#15803d":"#dc2626"]].map(([l,v,c])=>(
          <div key={l} style={{background:"rgba(255,255,255,.6)",borderRadius:8,padding:"8px 4px"}}>
            <div style={{fontSize:10,color:"#6b7280",marginBottom:3}}>{l}</div>
            <div style={{fontSize:15,fontWeight:900,color:c}}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{fontSize:12.5,fontWeight:700,color:pos?"#15803d":"#92400e",textAlign:"center"}}>
        {pos?"You earn Rs"+Math.round(s.delta).toLocaleString()+" more per year than with an average card":"Rs"+Math.round(Math.abs(s.delta)).toLocaleString()+" less per year vs average card"}
      </div>
    </div>
  );
}

const StepDot=({n,active,done})=>(
  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
    <div style={{width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,background:done?ACCENT:active?ACCENT:"#e5e7eb",color:done||active?"#fff":"#9ca3af",transition:"all .3s"}}>{done?"✓":n}</div>
  </div>
);
const StepLine=({done})=><div style={{flex:1,height:2,background:done?ACCENT:"#e5e7eb",transition:"background .3s",margin:"14px 4px 0"}}/>;

export default function App(){
  const [allCards,setAllCards]=useState(FALLBACK);
  const [dbStatus,setDbStatus]=useState("loading");
  const [apiStatus,setApiStatus]=useState("checking");
  const [step,setStep]=useState("prefs");
  const [priorities,setPriorities]=useState([]);
  const [cats,setCats]=useState([]);
  const [income,setIncome]=useState("");
  const [empType,setEmpType]=useState("");
  const [creditScore,setCreditScore]=useState("");
  const [monthly,setMonthly]=useState("");
  const [mode,setMode]=useState("suggest");
  const [selCards,setSelCards]=useState([]);
  const [results,setResults]=useState([]);
  const [synopses,setSynopses]=useState({});
  const [winner,setWinner]=useState("");
  const [winnerReason,setWinnerReason]=useState("");
  const [source,setSource]=useState("");
  const [openBreakdown,setOpenBreakdown]=useState({});
  const [error,setError]=useState("");

  useEffect(()=>{
    fetchCardsFromDB().then(c=>{setAllCards(c);setDbStatus("live");}).catch(()=>setDbStatus("fallback"));
    const ctrl=new AbortController();setTimeout(()=>ctrl.abort(),8000);
    fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},signal:ctrl.signal,body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:10,messages:[{role:"user",content:"Hi"}]})})
      .then(r=>r.json()).then(d=>setApiStatus(d.content?"ok":"fail")).catch(()=>setApiStatus("fail"));
  },[]);

  const toggleP=id=>setPriorities(p=>p.includes(id)?p.filter(x=>x!==id):p.length<3?[...p,id]:p);
  const toggleC=c=>setCats(p=>p.includes(c)?p.filter(x=>x!==c):[...p,c]);
  const canProceed=priorities.length>0&&income&&empType;
  const allNames=allCards.map(c=>c.name);

  const analyze=async()=>{
    setStep("loading");setError("");
    const incomeNum=INCOME_MAP[income]||0;
    let pool=allCards.filter(c=>c.minIncome<=incomeNum&&(!c.employment||c.employment.includes(empType)));
    if(mode==="compare"&&selCards.length>0)pool=allCards.filter(c=>selCards.includes(c.name));
    const scored=scoreCards(pool,priorities);
    const top=scored.slice(0,mode==="compare"?pool.length:3);
    if(top.length===0){setError("No eligible cards found. Try adjusting your income or employment type.");setStep("cards");return;}
    setResults(top);setWinner(top[0].name);setWinnerReason("");setSource("db");setStep("results");
    const priorityLabels=priorities.map(p=>PREF_AREAS.find(a=>a.id===p)?.label).join(", ")||"general use";
    const prompt="Indian credit card advisor. User: "+empType+", income "+income+", spend Rs"+(monthly||"unspecified")+"/month, priorities: "+priorityLabels+". Cards: "+top.map(c=>c.name).join(", ")+". Return ONLY raw JSON no markdown: {\"synopses\":[\"why card1 fits in 1 sentence\",\"why card2\",\"why card3\"],\"winner\":\""+top[0].name+"\",\"winnerReason\":\"1 sentence\"}";
    try{
      const ctrl=new AbortController();setTimeout(()=>ctrl.abort(),15000);
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},signal:ctrl.signal,body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:200,messages:[{role:"user",content:prompt}]})});
      const d=await res.json();if(d.error)return;
      const txt=(d.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("");
      const m=txt.replace(/```json|```/g,"").trim().match(/\{[\s\S]*\}/);if(!m)return;
      const p=JSON.parse(m[0]);
      const syn={};top.forEach((c,i)=>{syn[c.name]=p.synopses?.[i]||"";});
      setSynopses(syn);if(p.winner)setWinner(p.winner);if(p.winnerReason)setWinnerReason(p.winnerReason);setSource("ai");
    }catch(e){}
  };

  const reset=()=>{setStep("prefs");setResults([]);setPriorities([]);setCats([]);setIncome("");setEmpType("");setCreditScore("");setMonthly("");setSelCards([]);setSynopses({});setWinner("");setWinnerReason("");setSource("");setError("");};

  const BtnPrimary=({label,onClick,disabled})=>(
    <button onClick={onClick} disabled={disabled} style={{width:"100%",padding:"15px",borderRadius:14,fontSize:15,fontWeight:700,border:"none",background:disabled?"#e5e7eb":ACCENT,color:disabled?"#9ca3af":"#fff",cursor:disabled?"not-allowed":"pointer",transition:"all .15s",marginTop:8,letterSpacing:.2}}>{label}</button>
  );

  const stepN=step==="prefs"?1:step==="cards"?2:step==="results"?3:2;

  return(
    <div style={{fontFamily:"'Inter',-apple-system,sans-serif",minHeight:"100vh",background:"#f8fafc"}}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}} @keyframes pulse{0%,100%{opacity:.2}50%{opacity:1}} .fade{animation:fadeIn .3s ease}`}</style>

      {/* Top bar */}
      <div style={{background:"#fff",borderBottom:"1px solid #e5e7eb",padding:"0 20px",position:"sticky",top:0,zIndex:50}}>
        <div style={{maxWidth:640,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:56}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:30,height:30,borderRadius:8,background:ACCENT,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{color:"#fff",fontSize:14,fontWeight:900}}>C</span>
            </div>
            <span style={{fontWeight:800,fontSize:17,color:"#111",letterSpacing:-.3}}>CardIQ</span>
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:apiStatus==="ok"?"#22c55e":apiStatus==="fail"?"#ef4444":"#d1d5db",animation:apiStatus==="checking"?"pulse 1.2s infinite":"none"}}/>
            <span style={{fontSize:11,color:"#9ca3af",fontWeight:500}}>{apiStatus==="ok"?"AI Live":apiStatus==="fail"?"Smart Match":"Connecting..."}</span>
          </div>
        </div>
      </div>

      <div style={{maxWidth:640,margin:"0 auto",padding:"24px 16px 60px"}}>

        {/* Steps indicator */}
        {step!=="loading"&&(
          <div style={{display:"flex",alignItems:"flex-start",marginBottom:28}}>
            <StepDot n={1} active={stepN===1} done={stepN>1}/>
            <StepLine done={stepN>1}/>
            <StepDot n={2} active={stepN===2} done={stepN>2}/>
            <StepLine done={stepN>2}/>
            <StepDot n={3} active={stepN===3} done={false}/>
          </div>
        )}

        {/* ── PREFS ── */}
        {step==="prefs"&&(
          <div className="fade">
            <h2 style={{fontSize:22,fontWeight:800,margin:"0 0 4px",color:"#111",letterSpacing:-.4}}>Find your perfect card</h2>
            <p style={{color:"#6b7280",fontSize:14,margin:"0 0 24px"}}>Tell us what matters most and we'll match you instantly.</p>

            <div style={{marginBottom:24}}>
              <div style={{fontWeight:700,fontSize:14,color:"#111",marginBottom:4}}>What matters most to you?</div>
              <div style={{fontSize:12,color:"#9ca3af",marginBottom:12}}>Pick up to 3 priorities</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {PREF_AREAS.map(a=><PrefTile key={a.id} area={a} active={priorities.includes(a.id)} onClick={()=>toggleP(a.id)} disabled={priorities.length>=3}/>)}
              </div>
            </div>

            <div style={{marginBottom:24}}>
              <div style={{fontWeight:700,fontSize:14,color:"#111",marginBottom:12}}>Top spend categories</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>{SPEND_CATS.map(c=><Pill key={c} label={c} active={cats.includes(c)} onClick={()=>toggleC(c)}/>)}</div>
            </div>

            <div style={{marginBottom:24}}>
              <div style={{fontWeight:700,fontSize:14,color:"#111",marginBottom:4}}>Monthly spend on credit card</div>
              <div style={{fontSize:12,color:"#9ca3af",marginBottom:12}}>Used to estimate your annual savings</div>
              <div style={{position:"relative",maxWidth:220}}>
                <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:14,color:ACCENT,fontWeight:700}}>Rs</span>
                <input type="number" value={monthly} onChange={e=>setMonthly(e.target.value)} placeholder="e.g. 30000" style={{width:"100%",padding:"12px 14px 12px 38px",borderRadius:12,border:"1.5px solid #e5e7eb",fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box",color:"#111"}}/>
              </div>
            </div>

            <div style={{background:"#fff",borderRadius:16,padding:"20px",border:"1px solid #e5e7eb",marginBottom:8}}>
              <div style={{fontWeight:700,fontSize:14,color:"#111",marginBottom:14}}>About you</div>
              <div style={{marginBottom:16}}>
                <div style={{fontSize:12,color:"#6b7280",fontWeight:600,marginBottom:8}}>Annual income *</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:7}}>{INCOME_RANGES.map(r=><Pill key={r} label={r} active={income===r} onClick={()=>setIncome(r)}/>)}</div>
              </div>
              <div style={{marginBottom:16}}>
                <div style={{fontSize:12,color:"#6b7280",fontWeight:600,marginBottom:8}}>Employment type *</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:7}}>{EMP_TYPES.map(r=><Pill key={r} label={r} active={empType===r} onClick={()=>setEmpType(r)}/>)}</div>
              </div>
              <div>
                <div style={{fontSize:12,color:"#6b7280",fontWeight:600,marginBottom:4}}>Credit score <span style={{fontWeight:400,color:"#9ca3af"}}>(optional)</span></div>
                <div style={{fontSize:11,color:"#9ca3af",marginBottom:8}}>Helps filter cards you are likely eligible for</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:7}}>{CREDIT_SCORES.map(r=><Pill key={r} label={r} active={creditScore===r} onClick={()=>setCreditScore(r)}/>)}</div>
              </div>
            </div>

            {!canProceed&&<p style={{fontSize:12,color:"#9ca3af",marginBottom:4,textAlign:"center"}}>Select at least 1 priority + income + employment to continue</p>}
            <BtnPrimary label="Continue" onClick={()=>setStep("cards")} disabled={!canProceed}/>
          </div>
        )}

        {/* ── MODE ── */}
        {step==="cards"&&(
          <div className="fade">
            <button onClick={()=>setStep("prefs")} style={{background:"none",border:"none",color:ACCENT,cursor:"pointer",fontSize:13,fontWeight:600,padding:"0 0 16px",display:"flex",alignItems:"center",gap:4}}>
              ← Back
            </button>
            <h2 style={{fontSize:22,fontWeight:800,margin:"0 0 4px",color:"#111",letterSpacing:-.4}}>How would you like to search?</h2>
            <p style={{color:"#6b7280",fontSize:14,margin:"0 0 20px"}}>Let AI suggest the best cards or compare specific ones.</p>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:24}}>
              {[{id:"suggest",icon:"✨",title:"Suggest for me",desc:"AI picks top 3 cards for your profile"},{id:"compare",icon:"⚖️",title:"Compare cards",desc:"I have specific cards in mind"}].map(o=>(
                <button key={o.id} onClick={()=>setMode(o.id)} style={{padding:"18px 16px",borderRadius:16,textAlign:"left",cursor:"pointer",border:mode===o.id?"2px solid "+ACCENT:"1.5px solid #e5e7eb",background:mode===o.id?ACCENT_LIGHT:"#fff",transition:"all .15s"}}>
                  <div style={{fontSize:26,marginBottom:8}}>{o.icon}</div>
                  <div style={{fontWeight:700,fontSize:14,color:mode===o.id?ACCENT:"#111",marginBottom:4}}>{o.title}</div>
                  <div style={{fontSize:12,color:"#6b7280"}}>{o.desc}</div>
                </button>
              ))}
            </div>

            {mode==="compare"&&(
              <div style={{marginBottom:20}}>
                <div style={{fontWeight:700,fontSize:14,color:"#111",marginBottom:8}}>Select cards to compare <span style={{fontWeight:400,color:"#9ca3af",fontSize:12}}>(pick 2 or 3)</span></div>
                <CardTagInput selected={selCards} setSelected={setSelCards} allNames={allNames}/>
              </div>
            )}

            {error&&<div style={{padding:"12px 16px",background:"#fef2f2",border:"1px solid #fca5a5",borderRadius:12,fontSize:13,color:"#dc2626",marginBottom:16}}>{error}</div>}
            <BtnPrimary label="Get My Results" onClick={analyze} disabled={mode==="compare"&&selCards.length<2}/>
            <p style={{fontSize:11,color:"#9ca3af",textAlign:"center",marginTop:10}}>Results load instantly · AI adds insights in the background</p>
          </div>
        )}

        {/* ── LOADING ── */}
        {step==="loading"&&(
          <div style={{textAlign:"center",padding:"80px 20px"}} className="fade">
            <div style={{width:64,height:64,borderRadius:20,background:ACCENT_LIGHT,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:30}}>⚡</div>
            <h2 style={{fontSize:20,fontWeight:800,margin:"0 0 8px",color:"#111"}}>Analysing your profile</h2>
            <p style={{color:"#6b7280",fontSize:14,margin:"0 0 28px"}}>Matching across 75 cards and 40+ parameters...</p>
            <div style={{display:"flex",gap:8,justifyContent:"center"}}>
              {[0,1,2].map(i=><div key={i} style={{width:10,height:10,borderRadius:"50%",background:ACCENT,animation:"pulse 1.2s ease-in-out "+(i*.4)+"s infinite"}}/>)}
            </div>
          </div>
        )}

        {/* ── RESULTS ── */}
        {step==="results"&&results.length>0&&(
          <div className="fade">
            {/* Winner banner */}
            <div style={{background:"linear-gradient(135deg,"+ACCENT+",#7C3AED)",borderRadius:20,padding:"22px",marginBottom:24,color:"#fff",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:-20,right:-20,width:100,height:100,borderRadius:"50%",background:"rgba(255,255,255,.08)"}}/>
              <div style={{position:"absolute",bottom:-30,right:20,width:60,height:60,borderRadius:"50%",background:"rgba(255,255,255,.06)"}}/>
              <div style={{fontSize:10,fontWeight:800,letterSpacing:2,opacity:.7,textTransform:"uppercase",marginBottom:6}}>Best Match For You</div>
              <div style={{fontSize:22,fontWeight:900,marginBottom:6,letterSpacing:-.3}}>🏆 {winner}</div>
              <div style={{fontSize:13,opacity:.85,lineHeight:1.6}}>{winnerReason||"Best match for your priorities: "+(priorities.map(p=>PREF_AREAS.find(a=>a.id===p)?.label).join(", ")||"general use")+"."}</div>
              {source==="ai"&&<div style={{display:"inline-flex",alignItems:"center",gap:5,marginTop:10,background:"rgba(255,255,255,.15)",borderRadius:20,padding:"4px 10px",fontSize:11,fontWeight:600}}>✨ AI enhanced</div>}
            </div>

            {results.map((card,i)=>{
              const pros=genPros(card);const cons=genCons(card);
              const mSp=parseFloat(monthly)||0;const isOpen=openBreakdown[card.id];
              return(
                <div key={card.id} className="fade" style={{background:"#fff",borderRadius:20,padding:"22px",marginBottom:16,border:"1px solid #e5e7eb",boxShadow:"0 2px 12px rgba(0,0,0,.04)"}}>

                  {/* Card header */}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                    <div style={{flex:1,paddingRight:14}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6,flexWrap:"wrap"}}>
                        {i===0&&<Tag color="#fff" bg={ACCENT}>BEST MATCH</Tag>}
                        <Tag>{card.network}</Tag>
                        <Tag>{card.bank}</Tag>
                      </div>
                      <div style={{fontWeight:800,fontSize:19,color:"#111",letterSpacing:-.3}}>{card.name}</div>
                    </div>
                    <div style={{textAlign:"center",background:card.finalScore>=80?ACCENT_LIGHT:card.finalScore>=60?"#fffbeb":"#fef2f2",borderRadius:16,padding:"12px 16px",flexShrink:0,minWidth:68}}>
                      <div style={{fontSize:28,fontWeight:900,color:card.finalScore>=80?ACCENT:card.finalScore>=60?"#d97706":"#dc2626",lineHeight:1}}>{card.finalScore}</div>
                      <div style={{fontSize:9,color:"#9ca3af",fontWeight:700,marginTop:3,textTransform:"uppercase",letterSpacing:.5}}>Score</div>
                    </div>
                  </div>

                  {/* AI synopsis */}
                  {synopses[card.name]&&(
                    <div style={{display:"flex",gap:10,padding:"12px 14px",background:ACCENT_LIGHT,borderRadius:12,marginBottom:16,alignItems:"flex-start"}}>
                      <span style={{fontSize:16,flexShrink:0}}>✨</span>
                      <p style={{fontSize:13,color:ACCENT,lineHeight:1.6,margin:0,fontWeight:500}}>{synopses[card.name]}</p>
                    </div>
                  )}

                  {/* Savings */}
                  {mSp>0&&<SavingsWidget card={card} monthly={mSp}/>}

                  {/* Key stats grid */}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16}}>
                    {[
                      ["Joining Fee",card.joiningFee===0?"Free":"Rs"+card.joiningFee.toLocaleString()],
                      ["Annual Fee",card.annualFee===0?"Lifetime Free":"Rs"+card.annualFee.toLocaleString()],
                      ["Fee Waiver",card.feeWaiver],
                      ["Reward Rate",card.rewardRate+"pts/Rs100"],
                      ["Point Value","Rs"+card.pointValue+"/pt"],
                      ["APR",card.apr+"%/mo"],
                      ["Lounge",card.loungeAccess.domestic+"D + "+card.loungeAccess.international+"I"],
                      ["Forex Fee",card.forexFee===0?"ZERO":card.forexFee+"%"],
                      ["Welcome",card.welcomeBonus>0?"Rs"+card.welcomeBonus.toLocaleString():"None"],
                    ].map(([k,v])=>(
                      <div key={k} style={{padding:"10px",background:"#f8fafc",borderRadius:10,border:"1px solid #f1f5f9"}}>
                        <div style={{fontSize:9,color:"#9ca3af",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:3}}>{k}</div>
                        <div style={{fontSize:13,fontWeight:700,color:"#111"}}>{v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Score breakdown collapsible */}
                  <div style={{borderRadius:12,border:"1px solid #e5e7eb",marginBottom:16,overflow:"hidden"}}>
                    <button onClick={()=>setOpenBreakdown(p=>({...p,[card.id]:!p[card.id]}))} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",background:"#f8fafc",border:"none",cursor:"pointer"}}>
                      <span style={{fontSize:12,fontWeight:700,color:"#374151",textTransform:"uppercase",letterSpacing:.5}}>Score Breakdown</span>
                      <span style={{fontSize:18,color:ACCENT,display:"inline-block",transition:"transform .2s",transform:isOpen?"rotate(180deg)":"rotate(0deg)"}}>⌄</span>
                    </button>
                    {isOpen&&<div style={{padding:"14px 16px"}}>{PREF_AREAS.map(a=><ScoreBar key={a.id} label={a.icon+" "+a.label} value={card.scores[a.sk]||0} highlighted={priorities.includes(a.id)}/>)}</div>}
                  </div>

                  {/* Pros & Cons */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                    <div style={{background:"#f0fdf4",borderRadius:12,padding:"12px 14px"}}>
                      <div style={{fontSize:10,fontWeight:800,color:"#15803d",textTransform:"uppercase",letterSpacing:.8,marginBottom:8}}>Pros</div>
                      {pros.map((p,j)=><div key={j} style={{display:"flex",gap:6,fontSize:12.5,color:"#166534",marginBottom:6,lineHeight:1.5}}><span style={{fontWeight:800,flexShrink:0}}>+</span>{p}</div>)}
                    </div>
                    <div style={{background:"#fef2f2",borderRadius:12,padding:"12px 14px"}}>
                      <div style={{fontSize:10,fontWeight:800,color:"#dc2626",textTransform:"uppercase",letterSpacing:.8,marginBottom:8}}>Cons</div>
                      {cons.map((c,j)=><div key={j} style={{display:"flex",gap:6,fontSize:12.5,color:"#991b1b",marginBottom:6,lineHeight:1.5}}><span style={{fontWeight:800,flexShrink:0}}>-</span>{c}</div>)}
                    </div>
                  </div>

                  {/* Best for + Apply */}
                  <div style={{background:ACCENT_LIGHT,borderRadius:12,padding:"12px 14px",marginBottom:14,fontSize:13,color:ACCENT}}><strong>Best for:</strong> {card.bestFor}</div>
                  <button onClick={()=>window.open(card.applyUrl,"_blank")} style={{width:"100%",padding:"14px",borderRadius:14,background:ACCENT,color:"#fff",fontSize:14,fontWeight:700,border:"none",cursor:"pointer",letterSpacing:.2}}>Apply on Bank Website</button>
                  <p style={{fontSize:11,color:"#9ca3af",textAlign:"center",marginTop:6}}>Opens the official bank website in a new tab</p>
                </div>
              );
            })}

            {/* Legal */}
            <div style={{background:"#fff",borderRadius:16,padding:"18px",border:"1px solid #e5e7eb",marginTop:4,fontSize:11,color:"#6b7280",lineHeight:1.8}}>
              <div style={{fontWeight:700,color:"#374151",marginBottom:8,fontSize:12}}>Important Disclosures</div>
              <p style={{margin:"0 0 6px"}}><strong>Not financial advice:</strong> CardIQ is an independent free comparison tool, not a registered financial advisor or NBFC. Please consult a certified financial planner before applying.</p>
              <p style={{margin:"0 0 6px"}}><strong>No commercial interest:</strong> We do not earn any referral fees or commissions from banks. Our only goal is to help you find the right card.</p>
              <p style={{margin:"0 0 6px"}}><strong>Data accuracy:</strong> Card data is based on publicly available information as of mid-2025. Always verify current terms on the issuer's website before applying.</p>
              <p style={{margin:0}}><strong>Privacy:</strong> We do not store or share your personal information. Compliant with India's DPDP Act, 2023.</p>
            </div>

            <button onClick={reset} style={{width:"100%",marginTop:14,padding:"14px",borderRadius:14,background:"#fff",border:"1.5px solid #e5e7eb",color:"#374151",fontWeight:600,fontSize:14,cursor:"pointer"}}>Start Over</button>
          </div>
        )}
      </div>
    </div>
  );
