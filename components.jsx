// ═══════════════════════════════════════
// UI Components
// ═══════════════════════════════════════
const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= breakpoint);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [breakpoint]);
  return isMobile;
};

const Badge = ({children,color,bg}) => (
  <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:6,fontSize:12,fontWeight:600,color,background:bg,letterSpacing:.3}}>{children}</span>
);
const STATUS_MAP = {
  pending:{label:"Beklemede",color:"var(--text-sec)",bg:"rgba(148,163,184,0.15)"},
  active:{label:"İşlemde",color:"#3b82f6",bg:"rgba(59,130,246,0.15)"},
  completed:{label:"Tamamlandı",color:"#10b981",bg:"rgba(16,185,129,0.15)"},
};
const StatusBadge = ({status}) => { const s=STATUS_MAP[status]||STATUS_MAP.pending; return <Badge color={s.color} bg={s.bg}>{s.label}</Badge>; };
const PriorityBadge = ({priority}) => {
  const m={high:{l:"Yüksek",c:"#ef4444",b:"rgba(239,68,68,0.15)"},normal:{l:"Normal",c:"#3b82f6",b:"rgba(59,130,246,0.15)"},low:{l:"Düşük",c:"#94a3b8",b:"rgba(148,163,184,0.15)"}};
  const p=m[priority]||m.normal; return <Badge color={p.c} bg={p.b}>{p.l}</Badge>;
};
const OrderTypeBadge = ({type}) => type==="bileme"?<Badge color="#f59e0b" bg="rgba(245,158,11,0.15)">🔧 Bileme</Badge>:<Badge color="#6366f1" bg="rgba(99,102,241,0.15)">🏭 Üretim</Badge>;

function Btn({children,variant="primary",size="md",onClick,disabled,style:s2,icon:Icon}){
  const base={display:"inline-flex",alignItems:"center",gap:6,border:"none",borderRadius:8,cursor:disabled?"not-allowed":"pointer",fontWeight:600,fontFamily:"inherit",transition:"all 0.15s",opacity:disabled?0.5:1,whiteSpace:"nowrap"};
  const sizes={sm:{padding:"6px 12px",fontSize:12},md:{padding:"8px 16px",fontSize:13},lg:{padding:"10px 20px",fontSize:14}};
  const vars={primary:{background:"#3b82f6",color:"#fff"},success:{background:"#10b981",color:"#fff"},danger:{background:"#ef4444",color:"#fff"},warning:{background:"#f59e0b",color:"#000"},ghost:{background:"var(--border)",color:"var(--text-sec)",border:"1px solid var(--border-strong)"},outline:{background:"transparent",color:"#3b82f6",border:"1px solid #3b82f6"}};
  return <button onClick={onClick} disabled={disabled} style={{...base,...sizes[size],...vars[variant],...s2}}>{Icon&&<Icon size={size==="sm"?14:16}/>}{children}</button>;
}

function Input({label,value,onChange,type="text",placeholder,options,style:s2,disabled,rows,step,accept,onFileChange}){
  const wrap={display:"flex",flexDirection:"column",gap:4,...s2};
  const ist={padding:"8px 12px",borderRadius:8,border:"1px solid rgba(255,255,255,0.12)",background:"var(--bg-hover)",color:"var(--text)",fontSize:13,fontFamily:"inherit",outline:"none"};
  if(accept) return (
    <div style={wrap}>
      {label&&<label style={{fontSize:12,color:"var(--text-sec)",fontWeight:600}}>{label}</label>}
      <input type="file" accept={accept} onChange={onFileChange} style={{...ist,padding:"6px 8px",fontSize:12}} disabled={disabled}/>
    </div>
  );
  if(options) return (
    <div style={wrap}>
      {label&&<label style={{fontSize:12,color:"var(--text-sec)",fontWeight:600}}>{label}</label>}
      <select value={value} onChange={e=>onChange(e.target.value)} style={ist} disabled={disabled}><option value="">Seçiniz...</option>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>
    </div>
  );
  if(rows) return (
    <div style={wrap}>
      {label&&<label style={{fontSize:12,color:"var(--text-sec)",fontWeight:600}}>{label}</label>}
      <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{...ist,resize:"vertical"}} disabled={disabled}/>
    </div>
  );
  return (
    <div style={wrap}>
      {label&&<label style={{fontSize:12,color:"var(--text-sec)",fontWeight:600}}>{label}</label>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={ist} disabled={disabled} step={step}/>
    </div>
  );
}

const Card = ({children,style:s2,onClick}) => (
  <div onClick={onClick} style={{background:"var(--bg-card)",border:"1px solid var(--border-h)",borderRadius:12,padding:20,...s2,cursor:onClick?"pointer":"default"}}>{children}</div>
);

const TblWrap = ({children}) => (<div className="tbl-wrap">{children}</div>);

function Modal({title,onClose,children,width=700}){
  return (
    <div className="modal-backdrop-mobile" style={{position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.7)",backdropFilter:"blur(4px)"}} onClick={onClose}>
      <div className="modal-mobile" onClick={e=>e.stopPropagation()} style={{background:"var(--bg-modal)",border:"1px solid var(--border-strong)",borderRadius:16,width:"92%",maxWidth:width,maxHeight:"88vh",overflow:"auto",padding:24,WebkitOverflowScrolling:"touch"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,position:"sticky",top:-24,background:"var(--bg-modal)",padding:"4px 0 12px",zIndex:1}}>
          <h3 style={{margin:0,color:"var(--text-h)",fontSize:18}}>{title}</h3>
          <button onClick={onClose} style={{background:"var(--border)",border:"none",color:"var(--text-sec)",cursor:"pointer",fontSize:18,width:36,height:36,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function TabSwitcher({tabs,active,onChange}){
  return (
    <div style={{display:"flex",gap:0,background:"var(--bg-hover)",borderRadius:10,padding:3,border:"1px solid var(--border-h)"}}>
      {tabs.map(t=>(
        <button key={t.key} onClick={()=>onChange(t.key)} style={{flex:1,padding:"10px 16px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600,transition:"all 0.2s",background:active===t.key?t.color||"#3b82f6":"transparent",color:active===t.key?"#fff":"var(--text-mute)",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          {t.icon&&<t.icon size={15}/>}{t.label}
        </button>
      ))}
    </div>
  );
}

function WorkflowProgress({currentStep,orderType}){
  const steps = orderType==="bileme"?[
    {key:"order",label:"Sipariş",color:"#6366f1"},{key:"workorder",label:"İş Emri",color:"#8b5cf6"},
    {key:"cutting",label:"Kesim",color:"#f59e0b"},{key:"production",label:"Bileme",color:"#3b82f6"},{key:"qc",label:"KK",color:"#10b981"},
    {key:"coating",label:"Kaplama",color:"#14b8a6"},{key:"shipping",label:"Sevkiyat",color:"#ef4444"}
  ]:[
    {key:"order",label:"Sipariş",color:"#6366f1"},{key:"workorder",label:"İş Emri",color:"#8b5cf6"},
    {key:"cutting",label:"Kesim",color:"#f59e0b"},{key:"grinding",label:"Taşlama",color:"#d946ef"},{key:"production",label:"Üretim",color:"#3b82f6"},
    {key:"qc",label:"KK",color:"#10b981"},{key:"laser",label:"Lazer",color:"#a855f7"},
    {key:"coating",label:"Kaplama",color:"#14b8a6"},{key:"shipping",label:"Sevkiyat",color:"#ef4444"}
  ];
  const idx=steps.findIndex(s=>s.key===currentStep);
  return (
    <div style={{display:"flex",alignItems:"center",gap:2,overflowX:"auto",padding:"6px 0"}}>
      {steps.map((s,i)=>{const done=i<idx;const act=i===idx;return(
        <div key={s.key} style={{display:"flex",alignItems:"center",gap:2}}>
          <div style={{display:"flex",alignItems:"center",gap:4,padding:"4px 8px",borderRadius:6,background:act?`${s.color}22`:done?"rgba(16,185,129,0.1)":"rgba(255,255,255,0.03)",border:act?`1px solid ${s.color}`:"1px solid transparent",whiteSpace:"nowrap"}}>
            {done?<Check size={11} color="#10b981"/>:<CircleDot size={11} color={act?s.color:"var(--text-dim)"}/>}
            <span style={{fontSize:10,fontWeight:600,color:act?s.color:done?"#10b981":"var(--text-mute)"}}>{s.label}</span>
          </div>
          {i<steps.length-1&&<ChevronRight size={12} color="#334155"/>}
        </div>
      );})}
    </div>
  );
}

function AssignForm({woId,itemId,estMin,machines,operators,productionJobs,onAssign}){
  const [mid,setMid]=useState("");
  const [oid,setOid]=useState("");
  const [em,setEm]=useState(estMin);
  return(
    <div>
      <Input label="Makine" value={mid} onChange={setMid} options={machines.filter(m=>m.type==="CNC").map(m=>({value:m.id,label:`${m.name} (${productionJobs.filter(j=>j.machineId===m.id&&j.status!=="completed").length} iş)`}))}/>
      <div style={{marginTop:12}}><Input label="Operatör" value={oid} onChange={setOid} options={operators.filter(o=>o.role.includes("CNC")).map(o=>({value:o.id,label:`${o.name} (${o.shift})`}))}/></div>
      <div style={{marginTop:12}}><Input label="Tahmini Üretim Süresi (dk)" type="number" value={em} onChange={v=>setEm(Number(v))} placeholder="60"/></div>
      <div style={{marginTop:20,display:"flex",justifyContent:"flex-end",gap:8}}><Btn variant="primary" icon={Check} onClick={()=>onAssign(mid,oid,em)} disabled={!mid||!oid}>Atama Yap</Btn></div>
    </div>
  );
}



function RescheduleForm({ job, machines: mList, workOrders, productionJobs, onSave, onClear }) {
  const wo = workOrders.find(w => w.id === job.woId);
  const item = wo?.items.find(i => i.id === job.itemId);
  const machine = mList.find(m => m.id === job.machineId);
  const curBlock = job._blocks?.[0];
  const curStartDate = job.planDate || curBlock?.date || dateStr(new Date());
  const curStartMin = job.planStartMin != null ? job.planStartMin : (curBlock?.start ?? WORK_START);
  const [newMachine, setNewMachine] = useState(job.machineId || "");
  const [newDate, setNewDate] = useState(curStartDate);
  const [newHour, setNewHour] = useState(Math.floor(curStartMin / 60));
  const [newMin, setNewMin] = useState(curStartMin % 60);
  const [newEst, setNewEst] = useState(job.estimatedMinutes || 60);
  const hourOpts = [];
  for (let h = 8; h <= 17; h++) hourOpts.push({ value: h, label: String(h).padStart(2, "0") });
  const minOpts = [];
  for (let m = 0; m < 60; m += 10) minOpts.push({ value: m, label: String(m).padStart(2, "0") });
  const planStartMin = newHour * 60 + newMin;
  const endMin = planStartMin + newEst;
  const overflow = endMin > WORK_END;
  const sameM = productionJobs.filter(j => j.machineId === (newMachine || job.machineId) && j.id !== job.id && j.estimatedMinutes > 0).sort((a, b) => (a.assignedAt || 0) - (b.assignedAt || 0));
  const followJobs = sameM.filter(j => (j.assignedAt || 0) > (job.assignedAt || 0));
  const cascadePreview = (() => {
    let cursor = endMin <= WORK_END ? { date: newDate, min: endMin } : { date: newDate, min: WORK_END };
    return followJobs.slice(0, 5).map(fj => {
      const fwo = workOrders.find(w => w.id === fj.woId);
      const fit = fwo?.items.find(i => i.id === fj.itemId);
      let cMin = cursor.min; let cDate = cursor.date;
      if (fj.planDate && fj.planStartMin != null && (fj.planDate > cDate || (fj.planDate === cDate && fj.planStartMin > cMin))) { cDate = fj.planDate; cMin = fj.planStartMin; }
      if (cMin >= WORK_END) { cDate = "ertesi gün"; cMin = WORK_START; }
      const fEnd = cMin + fj.estimatedMinutes;
      const result = { id: fj.id, name: fit?.productCode || ("\u00D8"+fit?.diameter), customer: fwo?.customerCode||wo?.customerName, start: cMin, end: fEnd, date: cDate, dur: fj.estimatedMinutes };
      cursor = { date: fEnd > WORK_END ? "ertesi gün" : cDate, min: fEnd > WORK_END ? WORK_START + (fEnd - WORK_END) : fEnd };
      return result;
    });
  })();
  const shiftMin = (planStartMin + newEst) - (curStartMin + job.estimatedMinutes);
  return (
    <div>
      <div style={{padding:12,borderRadius:8,background:"rgba(99,102,241,0.08)",border:"1px solid rgba(99,102,241,0.2)",marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>{item?.productCode || ("\u00D8"+(item?.diameter||"")+" "+(item?.islem||""))}</div>
            <div style={{fontSize:12,color:"var(--text-sec)",marginTop:2}}>{wo?.customerCode||wo?.customerName} — {item?.qty} ad | {machine?.name}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:12,color:"var(--text-mute)"}}>Mevcut</div>
            <div style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>{curStartDate} {fmtTime(curStartMin)}–{fmtTime(curStartMin + job.estimatedMinutes)}</div>
            {job.planDate ? <span style={{fontSize:10,color:"#f59e0b"}}>📌 Manuel</span> : <span style={{fontSize:10,color:"var(--text-mute)"}}>Otomatik</span>}
          </div>
        </div>
      </div>
      <Input label="Makine" value={newMachine} onChange={setNewMachine} options={mList.filter(m=>m.type==="CNC").map(m=>({value:m.id,label:m.name}))}/>
      <div style={{marginTop:12}}><Input label="Planlanan Tarih" type="date" value={newDate} onChange={setNewDate}/></div>
      <div style={{marginTop:12}}>
        <div style={{fontSize:12,color:"var(--text-sec)",marginBottom:6,fontWeight:600}}>Başlangıç Saati</div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <Input label="Saat" value={newHour} onChange={v=>setNewHour(Number(v))} options={hourOpts}/>
          <span style={{fontSize:18,color:"var(--text-mute)",fontWeight:700}}>:</span>
          <Input label="Dakika" value={newMin} onChange={v=>setNewMin(Number(v))} options={minOpts}/>
        </div>
      </div>
      <div style={{marginTop:12}}><Input label="Tahmini Süre (dk)" type="number" value={newEst} onChange={v=>setNewEst(Number(v))} placeholder="60"/></div>
      <div style={{marginTop:14,padding:12,borderRadius:8,background:"rgba(30,41,59,0.8)",border:"1px solid var(--border-h)"}}>
        <div style={{fontSize:12,fontWeight:700,color:"var(--text)",marginBottom:8}}>📋 Yeni Plan</div>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:6,background:"rgba(59,130,246,0.15)",border:"1px solid rgba(59,130,246,0.3)",marginBottom:6}}>
          <span style={{fontSize:12,fontWeight:600,color:"#3b82f6"}}>📌</span>
          <span style={{fontSize:12,fontWeight:600,color:"var(--text)",flex:1}}>{item?.productCode || ("\u00D8"+item?.diameter)}</span>
          <span style={{fontSize:12,fontWeight:700,color:"#3b82f6"}}>{fmtTime(planStartMin)} → {fmtTime(endMin > WORK_END ? WORK_END : endMin)}</span>
          <span style={{fontSize:11,color:"var(--text-mute)"}}>{newEst}dk</span>
        </div>
        {overflow && <div style={{fontSize:11,color:"#f59e0b",marginBottom:6,paddingLeft:10}}>⚠️ Mesai aşımı — ertesi güne sarkacak</div>}
        {shiftMin !== 0 && <div style={{fontSize:11,fontWeight:600,color:shiftMin>0?"#f59e0b":"#10b981",marginBottom:8,paddingLeft:10}}>{shiftMin>0?("⏩ +"+shiftMin+"dk gecikme — sonraki işler kaydırılacak"):("⏪ "+shiftMin+"dk erken — sonraki işler öne çekilecek")}</div>}
        {cascadePreview.length > 0 && <div style={{marginTop:4}}>
          <div style={{fontSize:11,color:"var(--text-mute)",marginBottom:4,paddingLeft:10}}>Sonraki işler (kaskad):</div>
          {cascadePreview.map((fj,i) => <div key={fj.id} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 10px",borderRadius:5,background:"rgba(255,255,255,0.02)",marginBottom:2}}>
            <span style={{fontSize:11,color:"var(--text-mute)",width:14}}>{i+1}.</span>
            <span style={{fontSize:11,color:"var(--text-sec)",flex:1}}>{fj.name} — {fj.customer}</span>
            <span style={{fontSize:11,fontWeight:600,color:"var(--text-sec)"}}>{fj.date==="ertesi gün"?"→ertesi gün ":""}{fmtTime(fj.start)}–{fmtTime(fj.end>WORK_END?WORK_END:fj.end)}</span>
            <span style={{fontSize:10,color:"var(--text-mute)"}}>{fj.dur}dk</span>
          </div>)}
          {followJobs.length>5 && <div style={{fontSize:10,color:"var(--text-mute)",paddingLeft:10,marginTop:2}}>...ve {followJobs.length-5} iş daha</div>}
        </div>}
      </div>
      <div style={{marginTop:18,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>{job.planDate && <Btn variant="ghost" size="sm" onClick={onClear}>Otomatiğe Çevir</Btn>}</div>
        <Btn variant="primary" icon={Save} onClick={()=>onSave(job.id,{planDate:newDate,planStartMin,estimatedMinutes:newEst,machineId:newMachine})}>Kaydet</Btn>
      </div>
    </div>
  );
}
